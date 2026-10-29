import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';

const root=import.meta.dirname,receipt=JSON.parse(fs.readFileSync(path.join(root,'resultados.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const invalid=new Set(receipt.artifacts.filter(a=>a.expectedInvalidJson).map(a=>path.join(root,a.target)));
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{assert.equal(e.isSymbolicLink(),false);return e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)];});}
const all=files(root);
for(const file of all) {
  assert.equal(/\.(exe|dll|jar|class|zip)$|(?:^|[\\/])\.env(?:\.|$)/.test(file),false,file);
  if(file.endsWith('.json')){if(invalid.has(file))assert.equal(fs.readFileSync(file,'utf8'),'{');else JSON.parse(fs.readFileSync(file));}
  if(file.endsWith('.mjs'))assert.equal(spawnSync(process.execPath,['--check',file]).status,0,file);
}
for(const artifact of receipt.artifacts) {
  const target=path.join(root,artifact.target);assert.equal(sha(fs.readFileSync(artifact.source)),artifact.originalSha256,artifact.source);assert.equal(sha(fs.readFileSync(target)),artifact.collectedSha256,target);
  if(process.argv.includes('--staged'))assert.equal(sha(execFileSync('git',['show',':'+path.relative(process.cwd(),target).replaceAll('\\','/')],{maxBuffer:16*1024*1024})),artifact.collectedSha256,target);
}
const inventory=JSON.parse(fs.readFileSync(path.join(root,'runtime-files.json')));
for(const f of inventory.hashes)assert.equal(sha(fs.readFileSync(f.source)),f.sha256,f.source);
const preservation=JSON.parse(fs.readFileSync(path.join(root,'preservacao-final.json')));
for(const[f,h]of Object.entries(preservation.hashes))assert.equal(sha(fs.readFileSync(f)),h,f);
assert.equal(sha(fs.readFileSync('README.md')),preservation.readmeSha256);
console.log(JSON.stringify({files:all.length,artifacts:receipt.artifacts.length,inventoriedFiles:inventory.files,protected:preservation.protectedFiles,expectedInvalidJson:invalid.size,stagedBytesVerified:process.argv.includes('--staged'),testsRun:0}));
