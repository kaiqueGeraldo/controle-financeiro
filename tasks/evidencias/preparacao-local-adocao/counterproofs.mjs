import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ProofStore,hash} from './counterproof-checkpoint.mjs';
import {validateObservation} from './counterproof-observation.mjs';

const execution = path.resolve(process.argv[2] ?? '');
const restoredImage = process.argv[3];
if (!/^sha256:[a-f0-9]{64}$/.test(restoredImage??'')) throw new Error('Supply the verified local Linux image ID');
const allowed = path.resolve('../controle-financeiro-runtimes/preparacao-adocao') + path.sep;
if (!execution.startsWith(allowed)) throw new Error('Disposable execution required');
const root = path.join(execution,'checkout');
const back = path.join(root,'controle-financeiro-backend');
const proofRoot = path.join(execution,'counterproofs');
let out = proofRoot;
const manifest=JSON.parse(fs.readFileSync(path.join(execution,'inputs.json')));
const audit = process.argv[4] === 'audit';
const resume = process.argv[4] === 'resume';
if (!resume&&!audit) fs.mkdirSync(out); // Never overwrite a previous execution.
else if(!fs.existsSync(out))throw Error('Missing execution to resume/audit');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const base = 'src/main/java/com/controlefinanceiro/api/';
const cases = [
  {name:'preflight-hides-missing-constraint',test:'Cf017OriginalFindingsTest#missingOriginalForeignKeyStopsBeforeBaseline',
    method:'missingOriginalForeignKeyStopsBeforeBaseline',failure:['Expecting code to raise a throwable.'],
    edits:[[base+'infra/migration/LegacyPreflight.java', text=>text.replace('var counts = new TreeMap<String, Integer>();',
      'expected = expected.stream().filter(x -> !x.startsWith("constraint\\t")).toList();\n        observed = observed.stream().filter(x -> !x.startsWith("constraint\\t")).toList();\n        var counts = new TreeMap<String, Integer>();')]]},
  {name:'writer-passes-maintenance',test:'AdoptionRuntimeTest#maintenanceBlocksAllFunctionalIngressWithoutDatabaseEffects',
    method:'maintenanceBlocksAllFunctionalIngressWithoutDatabaseEffects(Path)',failure:['expected: 503','but was: 200'],
    diagnostic:'ADOPTION_BLOCKED_WRITE http=200 persistedAccounts=1',
    edits:[[base+'infra/operations/MaintenanceFilter.java',text=>text.replace('operations.writersEnabled() || probe','true')]]},
  {name:'jobs-register-while-disabled',test:'SchedulingBoundaryTest',
    method:'disabledJobsRegisterNoScheduledTaskIncludingShedlockWork',failure:['Expecting empty but was:','MarketDataService.updateVariableIncomePrices'],
    edits:[[base+'infra/config/SchedulerConfig.java',text=>text.replace(/@ConditionalOnProperty\([\s\S]*?matchIfMissing = true\)\r?\n/,'')]]},
  {name:'flyway-runs-in-api-bootstrap',test:'AdoptionRuntimeTest#emptyOrIncompatibleSchemaCannotStartOrMigrate',
    method:'emptyOrIncompatibleSchemaCannotStartOrMigrate(Path)',failure:['Expecting value to be true but was false'],
    childDiagnostic:'Successfully applied 16 migrations',
    edits:[[base+'infra/operations/AdoptionSafetyInitializer.java',text=>text.replace('require(env, "spring.flyway.enabled", "false");','// counterproof: guard removed')],
      ['src/main/resources/application-adoption.yml',text=>text.replace('enabled: false','enabled: true')]]},
  {name:'readiness-healthy-with-db-frozen',test:'AdoptionRuntimeTest#readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart',
    method:'readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart',failure:['expected: 503','but was: 200'],
    edits:[[base+'infra/operations/HealthController.java',text=>text.replace('return response(connection.isValid(1));','return response(true);').replaceAll('return response(false);','return response(true);')]]},
];
const only=process.argv.find(arg=>arg.startsWith('only='))?.substring(5);
if(only&&!cases.some(x=>x.name===only))throw Error('Unknown scoped proof');
const selected=only?cases.filter(x=>x.name===only):cases;
const identity={candidate:manifest.commit,inputManifestSha256:hash(fs.readFileSync(path.join(execution,'inputs.json'))),
  observerSha256:hash(Buffer.concat(['counterproofs.mjs','counterproof-checkpoint.mjs','counterproof-observation.mjs']
    .map(file=>fs.readFileSync(fileURLToPath(new URL(file,import.meta.url)))))),
  configuration:{postgresMajor:17,image:restoredImage,selection:selected.map(x=>x.name),javaHome:process.env.JAVA_HOME??null,node:process.version,
    javaSha256:process.env.JAVA_HOME?hash(fs.readFileSync(path.join(process.env.JAVA_HOME,'bin',process.platform==='win32'?'java.exe':'java'))):null,
    nodeSha256:hash(fs.readFileSync(process.execPath)),
    environmentSha256:hash(JSON.stringify(Object.entries(process.env).filter(([key])=>/^(JAVA_|JDK_JAVA|_JAVA|MAVEN_|SPRING_|DB_|FLYWAY_)/.test(key)).sort()))}};
if(audit&&!fs.existsSync(path.join(proofRoot,'v2/identity.json')))throw Error('Legacy checkpoint is ambiguous; no completed proofs certified');
if(resume&&fs.existsSync(path.join(proofRoot,'results.json')))console.log('Legacy results preserved; status alone never proves completion');
const store=new ProofStore({directory:path.join(proofRoot,'v2'),identity,sourceRoot:root,evidenceRoot:execution,inputs:manifest.inputs});
const results=[];
function run(name, selection, image) {
  const log = path.join(out,name+'.log');
  const fd = fs.openSync(log,'wx');
  const args=['--batch-mode','-Duser.timezone=UTC','-Dcf017.postgres.major=17','-Dspring.test.context.cache.maxSize=4',
    '-Dtest='+selection,'-Dcf034.reportsDirectory='+path.join(out,name+'-reports'),
    ...(image?['-Dpreparation.image='+image]:[]),'test'];
  let result;
  try { result=spawnSync(process.env.ComSpec??'cmd.exe',['/d','/c','mvnw.cmd',...args],{cwd:back,env:process.env,stdio:['ignore',fd,fd]}); }
  finally { fs.closeSync(fd); }
  if (result.error) throw result.error;
  return {status:result.status,log,reports:path.join(out,name+'-reports'),image:image??null,commands:['mvnw.cmd',...args]};
}
function step(logName, command, args, cwd) {
  const log=path.join(out,logName+'.log'),fd=fs.openSync(log,'wx');
  let result;
  try { result=spawnSync(command,args,{cwd,env:process.env,stdio:['ignore',fd,fd]}); }
  finally { fs.closeSync(fd); }
  if(result.error || result.status!==0) throw new Error('Counterproof preparation failed: '+logName);
  return {command:[command,...args],log};
}
function mutantImage(name) {
  // Compilation/packaging only, explicitly NOT a test invocation. The following
  // Maven test command exercises the mutant through real HTTP/SQL in Linux.
  const build=step(name+'-compile',process.env.ComSpec??'cmd.exe',
    ['/d','/c','mvnw.cmd','--batch-mode','-Dmaven.jar.forceCreation=true','compile','jar:jar','spring-boot:repackage'],back);
  const context=path.join(out,name+'-image');fs.mkdirSync(context);
  const jar=path.join(context,'api.jar');fs.copyFileSync(path.join(back,'target/api-0.0.1.jar'),jar);
  const digest=sha(fs.readFileSync(jar)),iid=path.join(out,name+'-image-id.txt');
  const imageBuild=step(name+'-image-build','docker',['build','--pull=false','--network=none',
    '--build-arg','JAVA_RUNTIME=eclipse-temurin@sha256:85f00967bcc624fc19fa9c2cf124ea426a5363898e267141726f31f358c2e14b',
    '--build-arg','INPUT_COMMIT=counterproof-'+name,'--build-arg','JAR_SHA256='+digest,
    '--iidfile',iid,'-f',path.join(back,'Dockerfile.release'),context],back);
  const image=fs.readFileSync(iid,'utf8').trim();
  fs.writeFileSync(path.join(out,name+'-build.json'),JSON.stringify({build,imageBuild,image,jarSha256:digest,testsRunDuringPackaging:0},null,2)+'\n');
  return image;
}
if(audit) {
  store.verifyInputs();
  for(const experiment of selected) {
    const directory=path.join(proofRoot,'v2',experiment.name);
    const complete=fs.readdirSync(directory).some(name=>{
      const folder=path.join(directory,name),record=JSON.parse(fs.readFileSync(path.join(folder,'checkpoint.json')));
      if(!store.valid(record,folder))return false;
      try{return validateObservation(record.result,experiment).causal===true;}catch{return false;}
    });
    if(!complete)throw Error('No valid completed proof: '+experiment.name);
  }
  console.log(selected.length+' causal proofs and restoration verified; zero new tests; startup witness not certified');process.exit(0);
}
for (const experiment of selected) {
  const outcome=store.run({...experiment,edits:experiment.edits.map(([file,change])=>['controle-financeiro-backend/'+file,change])},folder=>{
    out=folder;
    const priorLogs=fs.existsSync(path.join(back,'target/adoption-processes'))?new Set(fs.readdirSync(path.join(back,'target/adoption-processes'))):new Set();
    const image=experiment.test.startsWith('AdoptionRuntimeTest#')?mutantImage(experiment.name):undefined;
    const result=run(experiment.name,experiment.test,image);
    result.children=[];
    const childRoot=path.join(back,'target/adoption-processes');
    if(fs.existsSync(childRoot))for(const file of fs.readdirSync(childRoot).filter(f=>!priorLogs.has(f))) {
      const target=path.join(folder,'child-'+file);fs.copyFileSync(path.join(childRoot,file),target);result.children.push(target);
    }
    return result;
  },result=>validateObservation(result,experiment));
  results.push({name:experiment.name,...outcome});
  console.log(experiment.name+(outcome.reused?': verified completion reused':': causal assertion and restoration verified'));
}
if(only){console.log('Scoped proof complete; full counterproof/startup gate not certified');process.exit(0);}
out=path.join(proofRoot,'witness-'+crypto.randomUUID());fs.mkdirSync(out);
const witness=run('restored-witness','Cf017OriginalFindingsTest#missingOriginalForeignKeyStopsBeforeBaseline,AdoptionRuntimeTest#maintenanceBlocksAllFunctionalIngressWithoutDatabaseEffects+readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart,SchedulingBoundaryTest',restoredImage);
for(const input of manifest.inputs) if(sha(fs.readFileSync(path.join(root,input.file)))!==input.sha256) throw new Error('Final source mismatch '+input.file);
fs.writeFileSync(path.join(out,'witness.json'),JSON.stringify({...witness,allInputsRestored:true},null,2)+'\n');
if(witness.status!==0) throw new Error('Restored positive witness failed; hashes restored, failure receipt retained');
console.log('Restored witness passed; all exported inputs retain their hashes');
