import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawnSync}from'node:child_process';
const root=path.resolve('tasks/evidencias/saneamento-preparacao-local-adocao'),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sha=f=>hash(fs.readFileSync(f));
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(e.isSymbolicLink())throw Error('Evidence link is not allowed');return e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)];});}
const all=files(root);for(const file of all){
 if(/\.(jar|jfr|exe|class|zip)$|(?:^|[\\/])\.env(?:\.|$)/.test(file))throw Error('Binary/runtime/secret file in evidence');
 if(file.endsWith('.json'))JSON.parse(fs.readFileSync(file));
 if(file.endsWith('.mjs')){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0)throw Error('Invalid script: '+file);}
}
const receipt=JSON.parse(fs.readFileSync(path.join(root,'resultados.json')));
for(const item of receipt.collected){const file=path.join(root,item.target);if(sha(file)!==item.collectedSha256)throw Error('Collected artifact changed: '+item.target);
 if(sha(item.source)!==item.originalSha256)throw Error('Original artifact changed: '+item.source);
 if(process.argv.includes('--staged')){const relative=path.relative(process.cwd(),file).replaceAll('\\','/'),blob=spawnSync('git',['show',':'+relative],{maxBuffer:4*1024*1024});if(blob.status!==0||hash(blob.stdout)!==item.collectedSha256)throw Error('Staged bytes differ: '+relative);}
}
const preservation=JSON.parse(fs.readFileSync(path.join(root,'preservacao-final.json')));
for(const [file,expected]of Object.entries(preservation.hashes))if(sha(file)!==expected)throw Error('Protected artifact changed: '+file);
if(sha('README.md')!==preservation.readmeSha256)throw Error('README changed');
const identity=JSON.parse(fs.readFileSync(path.join(root,'execucao/saneamento-quiescencia-01/counterproofs/v2/identity.json')));
const observer=hash(Buffer.concat(['counterproofs.mjs','counterproof-checkpoint.mjs','counterproof-observation.mjs'].map(f=>fs.readFileSync('tasks/evidencias/preparacao-local-adocao/'+f))));
if(observer!==identity.identity.observerSha256)throw Error('Actual completed proof used another observer');
console.log(JSON.stringify({files:all.length,bytes:all.reduce((n,f)=>n+fs.statSync(f).size,0),collected:receipt.collected.length,protectedFiles:Object.keys(preservation.hashes).length,
 readme:preservation.readmeSha256,observerSha256:observer,stagedBytesVerified:process.argv.includes('--staged'),applicationTestsExecuted:0}));
