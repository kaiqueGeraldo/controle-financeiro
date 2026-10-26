import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const execution = path.resolve(process.argv[2] ?? '');
const restoredImage = process.argv[3];
if (!/^sha256:[a-f0-9]{64}$/.test(restoredImage??'')) throw new Error('Supply the verified local Linux image ID');
const allowed = path.resolve('../controle-financeiro-runtimes/preparacao-adocao') + path.sep;
if (!execution.startsWith(allowed)) throw new Error('Disposable execution required');
const root = path.join(execution,'checkout');
const back = path.join(root,'controle-financeiro-backend');
const out = path.join(execution,'counterproofs');
const audit = process.argv[4] === 'audit';
if (audit) {
  const manifest=JSON.parse(fs.readFileSync(path.join(execution,'inputs.json')));
  const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  for(const input of manifest.inputs)if(digest(path.join(root,input.file))!==input.sha256)throw new Error('Unrestored input '+input.file);
  const text=fs.readFileSync(path.join(out,'restored-witness.log'),'utf8');
  if(!text.includes('Tests run: 4, Failures: 2, Errors: 0, Skipped: 0'))throw new Error('Unexpected existing witness; investigate');
  fs.writeFileSync(path.join(out,'witness.json'),JSON.stringify({status:1,tests:4,failures:2,errors:0,skipped:0,
    allInputsRestored:true,inputFiles:manifest.inputs.length,image:restoredImage,
    existingLog:path.join(out,'restored-witness.log'),newTestsExecutedByAudit:0,
    limitation:'Two restored Linux process starts exceeded 40s. No rerun, retry or timeout increase; startup timing remains uncertified.'},null,2)+'\n',{flag:'wx'});
  console.log('All source hashes restored; existing failed witness preserved, no new tests executed');
  process.exit(0);
}
const resume = process.argv[4] === 'resume';
if (!resume) fs.mkdirSync(out); // Never overwrite a previous attempt.
else fs.copyFileSync(path.join(out,'results.json'),path.join(out,'interrupted-results-01.json'),fs.constants.COPYFILE_EXCL);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const base = 'src/main/java/com/controlefinanceiro/api/';
const cases = [
  {name:'preflight-hides-missing-constraint',test:'Cf017OriginalFindingsTest#missingOriginalForeignKeyStopsBeforeBaseline',
    edits:[[base+'infra/migration/LegacyPreflight.java', text=>text.replace('var counts = new TreeMap<String, Integer>();',
      'expected = expected.stream().filter(x -> !x.startsWith("constraint\\t")).toList();\n        observed = observed.stream().filter(x -> !x.startsWith("constraint\\t")).toList();\n        var counts = new TreeMap<String, Integer>();')]]},
  {name:'writer-passes-maintenance',test:'AdoptionRuntimeTest#maintenanceBlocksAllFunctionalIngressWithoutDatabaseEffects',
    diagnostic:'ADOPTION_BLOCKED_WRITE http=200 persistedAccounts=1',
    edits:[[base+'infra/operations/MaintenanceFilter.java',text=>text.replace('operations.writersEnabled() || probe','true')]]},
  {name:'jobs-register-while-disabled',test:'SchedulingBoundaryTest',
    edits:[[base+'infra/config/SchedulerConfig.java',text=>text.replace(/@ConditionalOnProperty\([\s\S]*?matchIfMissing = true\)\r?\n/,'')]]},
  {name:'flyway-runs-in-api-bootstrap',test:'AdoptionRuntimeTest#emptyOrIncompatibleSchemaCannotStartOrMigrate',
    childDiagnostic:'Successfully applied 16 migrations',
    edits:[[base+'infra/operations/AdoptionSafetyInitializer.java',text=>text.replace('require(env, "spring.flyway.enabled", "false");','// counterproof: guard removed')],
      ['src/main/resources/application-adoption.yml',text=>text.replace('enabled: false','enabled: true')]]},
  {name:'readiness-healthy-with-db-frozen',test:'AdoptionRuntimeTest#readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart',
    edits:[[base+'infra/operations/HealthController.java',text=>text.replace('return response(connection.isValid(1));','return response(true);').replaceAll('return response(false);','return response(true);')]]},
];
const results = resume ? JSON.parse(fs.readFileSync(path.join(out,'results.json'))).filter(x=>x.status===1) : [];
if(resume) {
  const inputs=JSON.parse(fs.readFileSync(path.join(execution,'inputs.json')));
  for(const input of inputs.inputs)if(sha(fs.readFileSync(path.join(root,input.file)))!==input.sha256)throw new Error('Source not restored before resume: '+input.file);
}
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
  return {status:result.status,log,image:image??null,commands:['mvnw.cmd',...args]};
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
for (const experiment of cases) {
  if(results.some(x=>x.name===experiment.name && x.status===1)) {
    console.log(experiment.name+': existing completed proof retained, not rerun');
    continue;
  }
  const originals = experiment.edits.map(([file])=>({file,bytes:fs.readFileSync(path.join(back,file))}));
  let result;
  const priorLogs = fs.existsSync(path.join(back,'target/adoption-processes'))
    ? new Set(fs.readdirSync(path.join(back,'target/adoption-processes'))) : new Set();
  try {
    for (const [file,change] of experiment.edits) {
      const before=fs.readFileSync(path.join(back,file),'utf8'), after=change(before);
      if (before===after) throw new Error('Mutation did not apply: '+experiment.name);
      fs.writeFileSync(path.join(back,file),after);
    }
    const image=experiment.test.startsWith('AdoptionRuntimeTest#')?mutantImage(experiment.name):undefined;
    result=run(experiment.name,experiment.test,image);
    const text=fs.readFileSync(result.log,'utf8');
    if(result.status===0 || !/Tests run: \d+, Failures: [1-9]\d*, Errors: 0/.test(text)) {
      throw new Error('Mutation survived or failed outside assertions: '+experiment.name);
    }
    if(experiment.diagnostic && !text.includes(experiment.diagnostic)) throw new Error('Missing causal effect: '+experiment.name);
    if(experiment.childDiagnostic) {
      const observed=fs.readdirSync(path.join(back,'target/adoption-processes')).filter(f=>!priorLogs.has(f))
        .some(f=>fs.readFileSync(path.join(back,'target/adoption-processes',f),'utf8').includes(experiment.childDiagnostic));
      if(!observed) throw new Error('Missing bootstrap migration proof');
    }
  } finally {
    for (const original of originals) fs.writeFileSync(path.join(back,original.file),original.bytes);
    const restored=originals.map(x=>({file:x.file,before:sha(x.bytes),after:sha(fs.readFileSync(path.join(back,x.file)))}));
    if(restored.some(x=>x.before!==x.after)) throw new Error('Restoration failed');
    results.push({name:experiment.name,...result,restored});
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
  }
  console.log(experiment.name+': detected by assertion; sources restored by SHA256');
}
const witness=run('restored-witness','Cf017OriginalFindingsTest#missingOriginalForeignKeyStopsBeforeBaseline,AdoptionRuntimeTest#maintenanceBlocksAllFunctionalIngressWithoutDatabaseEffects+readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart,SchedulingBoundaryTest',restoredImage);
const manifest=JSON.parse(fs.readFileSync(path.join(execution,'inputs.json')));
for(const input of manifest.inputs) if(sha(fs.readFileSync(path.join(root,input.file)))!==input.sha256) throw new Error('Final source mismatch '+input.file);
fs.writeFileSync(path.join(out,'witness.json'),JSON.stringify({...witness,allInputsRestored:true},null,2)+'\n');
if(witness.status!==0) throw new Error('Restored positive witness failed; hashes restored, failure receipt retained');
console.log('Restored witness passed; all exported inputs retain their hashes');
