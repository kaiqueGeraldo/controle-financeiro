import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const run=path.resolve(process.argv[2]??'');
if(!run.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep)||!path.basename(run).startsWith('revisao-'))throw new Error('Runtime novo de revisão');
const back=path.join(run,'checkout/controle-financeiro-backend'),out=path.join(run,'counterproofs-independent');fs.mkdirSync(out);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base='src/main/java/com/controlefinanceiro/api/';
const experiments=[
  {name:'ingress',file:base+'infra/operations/MaintenanceFilter.java',from:'operations.writersEnabled() || probe',to:'true',
   test:'OperationBoundaryProbeTest#closedIngressNeverReachesSqlOrExternalEffect',effect:/REVIEW_INGRESS status=200 sqlRows=1 externalEffects=1/},
  {name:'readiness',file:base+'infra/operations/HealthController.java',from:'return response(connection.isValid(1));',to:'return response(true);',
   test:'OperationBoundaryProbeTest#readyDatabaseProbeObservesRealUnavailableDependency',effect:/REVIEW_HEALTH dbPaused=true readiness=200 liveness=200/},
  {name:'migration-guard',file:base+'infra/operations/AdoptionSafetyInitializer.java',from:'require(env, "spring.flyway.enabled", "false");',to:'// independent counterproof: one guard removed',
   test:'OperationBoundaryProbeTest#unsafeGuardStopsBeforeRegisteredMigrationEffect',effect:/REVIEW_GUARD blocked=false migratedVersions=16/},
  {name:'scheduling',file:base+'infra/config/SchedulerConfig.java',from:/@ConditionalOnProperty\([\s\S]*?matchIfMissing = true\)\r?\n/,to:'',
   test:'SchedulingBoundaryTest',effect:/ScheduledTask|not to be empty|to be empty/}
];
const results=[];
function execute(name,test){
  const log=path.join(out,name+'.log'),fd=fs.openSync(log,'wx');
  const args=['/d','/c','mvnw.cmd','--batch-mode','-Duser.timezone=UTC','-Dcf017.postgres.major=17','-Dtest='+test,
    '-Dcf034.reportsDirectory='+path.join(out,name+'-reports'),'test'];
  let result;try{result=spawnSync(process.env.ComSpec??'cmd.exe',args,{cwd:back,env:process.env,stdio:['ignore',fd,fd]});}finally{fs.closeSync(fd);}
  return {status:result.status,error:result.error?.message,command:args.slice(2),log};
}
for(const x of experiments){
  const file=path.join(back,x.file),original=fs.readFileSync(file),before=sha(file);
  let result;
  try{
    const changed=original.toString('utf8').replace(x.from,x.to);if(changed===original.toString('utf8'))throw new Error('Mutação não aplicada');
    fs.writeFileSync(file,changed);const mutated=sha(file);
    result=execute(x.name,x.test);const log=fs.readFileSync(result.log,'utf8');
    result={...result,mutated,assertionFailure:/Tests run: \d+, Failures: [1-9]\d*, Errors: 0/.test(log),effectObserved:x.effect.test(log)};
  }finally{
    fs.writeFileSync(file,original);const after=sha(file);
    results.push({name:x.name,source:x.file,...result,before,after,restored:before===after});
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
    if(before!==after)throw new Error('Restauração divergiu');
  }
  console.log(JSON.stringify(results.at(-1)));
}
const witness=execute('restored','OperationBoundaryProbeTest,SchedulingBoundaryTest');
const manifest=JSON.parse(fs.readFileSync(path.join(run,'inputs.json')));
const changed=manifest.inputs.filter(x=>sha(path.join(run,'checkout',x.file))!==x.sha256).map(x=>x.file);
fs.writeFileSync(path.join(out,'witness.json'),JSON.stringify({...witness,inputFiles:manifest.inputs.length,changed,allInputsRestored:changed.length===0},null,2)+'\n');
if(witness.status!==0||changed.length||results.some(x=>x.status===0||!x.assertionFailure||!x.effectObserved))throw new Error('Uma prova permanece não certificada; preservar resultados');
