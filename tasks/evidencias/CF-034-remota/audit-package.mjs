import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';
import {backendSelection} from '../../../.github/scripts/suites.mjs';

const [diagnosisFile,packageFile,head,base,runId,output,expectedRef='refs/pull/1/merge']=process.argv.slice(2);
assert(['refs/pull/1/merge','refs/heads/main'].includes(expectedRef),'only PR #1 and its main integration are supported');
assert(output,'diagnosis inspection, package inspection, head, base, run ID, output required');
for(const sha of [head,base])assert.match(sha,/^[a-f0-9]{40}$/);
const diagnosis=JSON.parse(fs.readFileSync(diagnosisFile)),archive=JSON.parse(fs.readFileSync(packageFile));
for(const inspected of [diagnosis,archive])assert.equal(inspected.platformDigestMatches,true);
const result=diagnosis.results.find(r=>r.path==='result.json').value;
const manifest=archive.results.find(r=>r.path.endsWith('package-manifest.json')).value;
const checkout=manifest.commit;
assert.match(checkout,/^[a-f0-9]{40}$/);
assert.equal(result.status,'passed');assert.equal(result.stage,'all');
assert.deepEqual(result.source.originalTreeChanges,[]);
assert.equal(result.source.commit,checkout);assert.equal(manifest.ci.checkoutSha,checkout);
assert.equal(manifest.ci.runId,String(runId));assert.deepEqual(manifest.ci,result.ci);
assert.equal(manifest.ci.ref,expectedRef);
for(const name of ['install','lint','typecheck','unit','components','build','browser-install','maven-version','backend','e2e'])
  assert.equal(result.steps.find(step=>step.name===name)?.exit,0,`${name} did not succeed`);
assert.equal(result.unit.timezones,3);assert(result.unit.tests>0);
for(const name of ['components','backend','e2eJava','browser']){
  const counts=result[name];assert(counts.tests>0,name);
  for(const key of ['failures','errors','skipped'])assert.equal(counts[key],0,`${name}.${key}`);
}
assert.equal(result.browser.tests,6);
const backendCommand=result.steps.find(step=>step.name==='backend').command;
assert.equal(backendCommand.at(-1),'verify');assert(!backendCommand.some(arg=>/skipTests|maven\.test\.skip/.test(arg)));
assert.deepEqual(result.selection.selected,backendSelection(process.cwd(),'smoke').selected);
const jar=archive.files.filter(file=>file.path.endsWith('.jar'));
assert.equal(jar.length,1);assert.equal(jar[0].path,manifest.file);
assert.equal(jar[0].sha256,manifest.sha256);assert.equal(jar[0].bytes,manifest.bytes);
assert.equal(result.artifact.sha256,manifest.sha256);
assert.equal(manifest.gates.backend.jarSha256,manifest.sha256);
assert.deepEqual(manifest.gates.backend.counts,result.backend);
assert.deepEqual(manifest.gates.e2e.counts,result.browser);
assert.equal(hash(Buffer.from(JSON.stringify(manifest.sourceFiles))),manifest.sourceDigest);
assert.equal(result.source.digest,manifest.sourceDigest);
for(const gate of Object.values(manifest.gates)){
  assert.equal(gate.status,'passed');assert.equal(gate.source,manifest.sourceDigest);
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024}).trim();
assert.deepEqual(git('rev-list','--parents','-n','1',checkout).split(' '),[checkout,base,head]);
assert.equal(git('rev-parse',`${checkout}^{tree}`),git('rev-parse',`${head}^{tree}`));
const inputs=['.github','controle-financeiro-backend','controle-financeiro-frontend','tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json'];
const files=execFileSync('git',['ls-tree','-r','--name-only','-z',checkout,'--',...inputs],{encoding:'utf8'}).split('\0').filter(Boolean).filter(file=>
  !/(^|\/)(node_modules|target|\.next|\.git|test-results|playwright-report)(\/|$)/.test(file)
  &&path.posix.basename(file)!=='next-env.d.ts'&&!file.endsWith('.tsbuildinfo')&&!/(^|\/)\.env(?:\.|$)/.test(file)
).sort((a,b)=>a.localeCompare(b,'en'));
assert.deepEqual(manifest.sourceFiles.map(file=>file.path),files);
assert(files.every(file=>!/[\r\n]/.test(file)));
const batch=spawnSync('git',['cat-file','--batch'],{input:files.map(file=>`${checkout}:${file}\n`).join(''),maxBuffer:64*1024*1024});
assert.equal(batch.status,0);let cursor=0;
const hashes=new Map(),checkoutConversions=[];
for(const file of manifest.sourceFiles){
  const end=batch.stdout.indexOf(10,cursor),header=batch.stdout.subarray(cursor,end).toString('utf8');
  const match=header.match(/^[a-f0-9]{40} blob (\d+)$/);assert(match,file.path);
  const size=Number(match[1]),start=end+1,bytes=batch.stdout.subarray(start,start+size);
  const blobHash=hash(bytes);let actual=blobHash;
  if(actual!==file.sha256){
    const attributes=Object.fromEntries(git('check-attr',`--source=${checkout}`,'eol','text','working-tree-encoding','filter','ident','--',file.path)
      .split('\n').map(line=>line.slice(file.path.length+2).split(': ')));
    assert.equal(attributes.eol,'crlf',file.path);assert.notEqual(attributes.text,'unset');
    for(const key of ['working-tree-encoding','filter','ident'])assert.equal(attributes[key],'unspecified',key);
    const utf8=bytes.toString('utf8');assert(bytes.equals(Buffer.from(utf8)));
    actual=hash(Buffer.from(utf8.replace(/\r?\n/g,'\r\n')));
    checkoutConversions.push({path:file.path,eol:'crlf; committed Git attribute',gitBlobSha256:blobHash,checkoutSha256:actual});
  }
  assert.equal(actual,file.sha256,file.path);hashes.set(file.path,actual);
  cursor=start+size+1;
}
assert.equal(manifest.dependencies.pomSha256,hashes.get('controle-financeiro-backend/pom.xml'));
assert.equal(manifest.dependencies.lockSha256,hashes.get('controle-financeiro-frontend/package-lock.json'));
writeJson(output,{at:new Date().toISOString(),status:'verified',runId,attempt:manifest.ci.attempt,head,base,checkout,
  ref:expectedRef,identicalMergeAndHeadTree:true,sourceFilesChecked:files.length,sourceDigest:manifest.sourceDigest,checkoutConversions,
  package:{file:manifest.file,bytes:manifest.bytes,sha256:manifest.sha256,zipSha256:archive.zipSha256},
  diagnosisZipSha256:diagnosis.zipSha256,counts:{unit:result.unit,components:result.components,backend:result.backend,e2eJava:result.e2eJava,browser:result.browser},
  selectedBackendClasses:result.selection.selected.length,toolchain:manifest.toolchain,
  verifierPreparation:'initial blob-only comparison rejected mvnw.cmd; committed text/eol=crlf projection now verified explicitly; no arbitrary hash normalization',
  scope:'downloaded JAR and manifest matched; every declared input checked against merge Git blobs and committed checkout EOL attributes; no deploy or binary reproducibility claim'});
console.log(JSON.stringify({verified:true,runId,checkout,sourceFiles:files.length,jarSha256:manifest.sha256}));
