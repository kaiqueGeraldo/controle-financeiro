import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const runtime=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..'),file='controle-financeiro-frontend/tests/e2e/support/text-geometry.ts',copy=path.join(runtime,'s/f/tests/e2e/support/text-geometry.ts'),old=path.join(runtime,'originals',file),candidate=path.join(runtime,'candidate-text-geometry.ts');
assert.match(path.basename(runtime),/^rr3-01-/);const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
assert.equal(sha(copy),sha(path.join(root,file)));fs.copyFileSync(copy,candidate,fs.constants.COPYFILE_EXCL);
const before=sha(copy),oldSha=sha(old),runs=[],env={...process.env};delete env.REVALIDATE_GREP;
function run(script,args){
 const r=spawnSync(process.execPath,[path.join(import.meta.dirname,script),...args],{cwd:root,encoding:'utf8',windowsHide:true,env,timeout:15*60*1000});
 runs.push({script,args,exit:r.status,error:r.error?.message,stdout:r.stdout,stderr:r.stderr});
 console.log(JSON.stringify({script,args,exit:r.status}));return r;
}
try{
 fs.copyFileSync(old,copy);assert.equal(sha(copy),oldSha);
 assert.equal(run('preparar-provas.mjs',['static',runtime,'counter-old-static']).status,1);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(runtime,'counter-old-static/geometry-independent.json'))).unexpected.map(r=>r.kind),['filter-opacity','pointerless-overlay']);
 assert.equal(run('executar.mjs',['run',runtime,'counter-old-live','RR3LiveGeometryProbe']).status,1);
 const live=JSON.parse(fs.readFileSync(path.join(runtime,'counter-old-live/browsers/RR3LiveGeometryProbe/live-geometry.json')));
 assert.deepEqual(live.observations.filter(r=>r.observed.ok).map(r=>r.kind),['baseline','filter-opacity','pointerless-overlay','restored']);
}finally{
 fs.copyFileSync(candidate,copy);assert.equal(sha(copy),before);assert.equal(sha(path.join(root,file)),before);
 fs.writeFileSync(path.join(runtime,'counterproof-restoration.json'),JSON.stringify({at:new Date(),isolatedCopy:copy,oldSha256:oldSha,candidateSha256:before,restoredSha256:sha(copy),worktreeSha256:sha(path.join(root,file)),runs},null,2)+'\n',{flag:'wx'});
}
assert.equal(run('preparar-provas.mjs',['static',runtime,'counter-restored-static']).status,0);
assert.equal(run('executar.mjs',['run',runtime,'counter-restored-live','RR3LiveGeometryProbe']).status,0);
fs.writeFileSync(path.join(runtime,'counterproof-complete.json'),JSON.stringify({at:new Date(),candidateSha256:before,runs},null,2)+'\n',{flag:'wx'});
