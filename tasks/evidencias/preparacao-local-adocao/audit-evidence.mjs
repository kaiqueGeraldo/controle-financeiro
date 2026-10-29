import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root=path.resolve('tasks/evidencias/preparacao-local-adocao');
const digest=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const hash=file=>digest(fs.readFileSync(file));
function files(folder) {
  return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{
    if(entry.isSymbolicLink())throw new Error('Evidence must not use links');
    const file=path.join(folder,entry.name);
    return entry.isDirectory()?files(file):[file];
  });
}
const evidence=files(root);
for(const file of evidence) {
  if(/\.(jar|class|zip|exe|dll)$|(?:^|[\\/])\.env(?:\.|$)/i.test(file))throw new Error('Forbidden evidence artifact: '+file);
  if(file.endsWith('.json'))JSON.parse(fs.readFileSync(file));
  if(file.endsWith('.mjs')) {
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(result.status!==0)throw new Error('Script syntax: '+result.stderr);
  }
}
const inputs=JSON.parse(fs.readFileSync(path.join(root,'inputs.json')));
for(const input of inputs.inputs)if(hash(input.file)!==input.sha256)throw new Error('Current input differs from tested source: '+input.file);
const collection=JSON.parse(fs.readFileSync(path.join(root,'collection.json')));
for(const [file,expected] of Object.entries(collection.artifacts)) {
  if(hash(path.join(root,file))!==expected)throw new Error('Evidence hash mismatch: '+file);
  if(process.argv.includes('--staged')) {
    const blob=spawnSync('git',['show',':tasks/evidencias/preparacao-local-adocao/'+file],{maxBuffer:16*1024*1024});
    if(blob.status!==0||digest(blob.stdout)!==expected)throw new Error('Staged evidence bytes differ: '+file);
  }
}
const preservation=JSON.parse(fs.readFileSync(path.join(root,'preservation.json')));
if(hash('README.md')!==preservation.readmeSha256||preservation.runtimeFiles.length!==29||preservation.migrations.length!==16)throw new Error('Preservation receipt mismatch');
for(const item of preservation.runtimeFiles)if(hash(path.join(preservation.historicalRuntime,item.file))!==item.sha256)throw new Error('Historical file changed: '+item.file);
for(const item of preservation.migrations)if(hash(item.file)!==item.sha256)throw new Error('Migration changed: '+item.file);
console.log(JSON.stringify({evidenceFiles:evidence.length,bytes:evidence.reduce((n,file)=>n+fs.statSync(file).size,0),
  inputs:inputs.inputs.length,durableArtifacts:Object.keys(collection.artifacts).length,historicalFiles:29,migrations:16,
  readmeSha256:preservation.readmeSha256,stagedEvidenceBytesVerified:process.argv.includes('--staged'),
  scope:'Read-only provenance, syntax and preservation audit; no application tests executed.'}));
