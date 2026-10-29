import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const run=path.resolve(process.argv[2]);
const fixed=process.argv[3]==='fixed';
if(!run.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/saneamento-')))throw Error('New sanitation runtime required');
fs.mkdirSync(run);
const source='tasks/evidencias/preparacao-local-adocao/counterproofs.mjs';
const original=fixed?fs.readFileSync(source):execFileSync('git',['show','07c396371029d9942b8667e5c638c04a9e6aeb4b:'+source]);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.writeFileSync(path.join(run,'original.mjs'),original);
fs.writeFileSync(path.join(run,'counterproofs.mjs'),original);
if(fixed)for(const file of ['counterproof-checkpoint.mjs','counterproof-observation.mjs'])fs.copyFileSync(path.join(path.dirname(source),file),path.join(run,file));
const root=path.join(run,'checkout'), back=path.join(root,'controle-financeiro-backend');
const names=['src/main/java/com/controlefinanceiro/api/infra/migration/LegacyPreflight.java','src/main/java/com/controlefinanceiro/api/infra/operations/MaintenanceFilter.java'];
const inputs=names.map(file=>{const bytes=fs.readFileSync('controle-financeiro-backend/'+file);const target=path.join(back,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);return {file:'controle-financeiro-backend/'+file,sha256:sha(bytes)};});
fs.writeFileSync(path.join(run,'inputs.json'),JSON.stringify({inputs}));
// Fault injection at the OS tool boundary only. Runner source and resume branch
// are byte-identical; no PostgreSQL, Docker, mutation image or network is used.
fs.writeFileSync(path.join(run,'fault.mjs'),`import fs from 'node:fs';import child from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';
child.spawnSync=(command,args,options)=>{if((command==='docker'&&args[0]==='ps')||command.toLowerCase().endsWith('powershell.exe'))return {status:0,stdout:'',stderr:''};fs.writeSync(options.stdio[1],'FIXTURE_INFRA_FAILURE before observation; no causal effect\\n');return {status:1};};syncBuiltinESMExports();`);
const image='sha256:'+'0'.repeat(64);
function attempt(mode){const r=spawnSync(process.execPath,['--import',pathToFileURL(path.join(run,'fault.mjs')).href,path.join(run,'counterproofs.mjs'),run,image,...(mode==='resume'?['resume']:[])],{encoding:'utf8'});fs.writeFileSync(path.join(run,mode+'.log'),r.stdout+r.stderr);return r;}
const first=attempt('first');assert.notEqual(first.status,0);
if(fixed) {
  const resumed=attempt('resume');assert.notEqual(resumed.status,0);
  assert.equal(resumed.stdout.includes('completion reused'),false);
  const folder=path.join(run,'counterproofs/v2/preflight-hides-missing-constraint');
  const attempts=fs.readdirSync(folder).sort();assert.deepEqual(attempts,['0001','0002']);
  for(const name of attempts) {const record=JSON.parse(fs.readFileSync(path.join(folder,name,'checkpoint.json')));assert.equal(record.state,'failed');assert.equal(record.restorationVerified,true);}
  for(const input of inputs)assert.equal(sha(fs.readFileSync(path.join(root,input.file))),input.sha256);
  const receipt={sourceSha256:sha(original),runnerUnmodified:true,attemptExit:first.status,resumeExit:resumed.status,incorrectSkipObserved:false,newAttemptObserved:true,sourcesRestored:true};
  fs.writeFileSync(path.join(run,'reproduction.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));process.exit(0);
}
const resultsFile=path.join(run,'counterproofs/results.json');
const firstCheckpoint=fs.readFileSync(resultsFile);fs.writeFileSync(path.join(run,'checkpoint-before-resume.json'),firstCheckpoint);
const recorded=JSON.parse(firstCheckpoint)[0];assert.equal(recorded.status,1);
assert.match(first.stderr,/Mutation survived or failed outside assertions/);
const resumed=attempt('resume');assert.notEqual(resumed.status,0);
assert.match(resumed.stdout,/preflight-hides-missing-constraint: existing completed proof retained, not rerun/);
assert.equal(fs.readFileSync(recorded.log,'utf8').includes('Expecting code to raise a throwable'),false);
for(const input of inputs)assert.equal(sha(fs.readFileSync(path.join(root,input.file))),input.sha256);
const receipt={sourceSha256:sha(original),runnerUnmodified:true,faultBoundary:'spawnSync infrastructure failure, status 1, no assertion/causal effect',
  attemptExit:first.status,resumeExit:resumed.status,persistedStatus:recorded.status,incorrectSkipObserved:true,
  sourcesRestored:true,checkpointSha256:sha(firstCheckpoint),firstLogSha256:sha(fs.readFileSync(path.join(run,'first.log'))),resumeLogSha256:sha(fs.readFileSync(path.join(run,'resume.log')))};
fs.writeFileSync(path.join(run,'reproduction.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
