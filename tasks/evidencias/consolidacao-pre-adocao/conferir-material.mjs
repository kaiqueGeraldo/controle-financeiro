import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {eventsFromChunks} from '../investigacao-startup-HQL/jfr-stream.mjs';
const out='tasks/evidencias/consolidacao-pre-adocao';
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const save=(name,data)=>fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
const candidate='56eb80b5cb867539d94995ec58b63ce2dbc519fa';
const phase=process.argv[2]??'material';
assert.ok(['material','imagem','runtime'].includes(phase));
if(phase==='material'){
const changed=execFileSync('git',['-c','core.quotepath=false','diff','--name-only','-z','origin/main',candidate],{maxBuffer:16*1024*1024}).toString().split('\0').filter(Boolean);
// Material size from explicit Git delta, not a new archive traversal/hash inventory.
const groups={},largest=[];let totalBytes=0;
for(const file of changed){const bytes=fs.statSync(file).size,parts=file.split('/');totalBytes+=bytes;
 const group=parts[0]==='tasks'&&parts[1]==='evidencias'?parts.slice(0,3).join('/'):parts[0];
 groups[group]??={files:0,bytes:0};groups[group].files++;groups[group].bytes+=bytes;
 largest.push({file,bytes});}
largest.sort((a,b)=>b.bytes-a.bytes);
save('material-git.json',{at:new Date().toISOString(),candidate,changedFiles:changed.length,totalWorkingTreeBytes:totalBytes,
 scope:'Explicit Git delta file sizes; not a complete archive inventory or Git pack/upload size',groups,largest:largest.slice(0,10)});
const envelopeChecks=[];
for(const document of ['{"recording":{"events":[{}]}','{"events":[{},]}']){
 let strictJsonRejects=false;try{JSON.parse(document);}catch{strictJsonRejects=true;}
 const events=[];for await(const event of eventsFromChunks((async function*(){yield document;})()))events.push(event);
 assert.ok(strictJsonRejects);assert.equal(events.length,1);
 envelopeChecks.push({document,strictJsonRejects,streamReaderAccepts:true,events:events.length});
}
save('leitor-limites.json',{at:new Date().toISOString(),envelopeChecks,
 source:{file:'tasks/evidencias/investigacao-startup-HQL/jfr-stream.mjs',sha256:hash('tasks/evidencias/investigacao-startup-HQL/jfr-stream.mjs')},
 currentEvidence:'Unchanged captured inputs and independent current-evidence checks referenced by hash in preservacao-inicial.json. No new JFR captures generated.',
 impact:'Known diagnostic-reader limitation reproduced; not imported by product or CI collectors. No invalid current measurements shown; future general JSON ingestion needs separate implementation and independent review.'});
console.log(JSON.stringify({changedFiles:changed.length,totalBytes,largest:largest[0],envelopeChecks:envelopeChecks.length}));
}
if(phase==='imagem'){
const observed=spawnSync('docker',['image','inspect','sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1'],{encoding:'utf8',windowsHide:true});
if(observed.status!==0)throw Error('Read-only local image inspection unavailable; preserve failure separately');
const image=JSON.parse(observed.stdout)[0];
assert.equal(image.Id,'sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1');
assert.equal(image.Config.Labels['com.controlefinanceiro.jar.sha256'],'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
assert.equal(image.Config.Labels['org.opencontainers.image.revision'],'24844b594e4ed8fe906e0fc6eaee32bdd58f31a0');
save('imagem-observada.json',{at:new Date().toISOString(),id:image.Id,os:image.Os,architecture:image.Architecture,user:image.Config.User,
 jarSha256:image.Config.Labels['com.controlefinanceiro.jar.sha256'],inputCommit:image.Config.Labels['org.opencontainers.image.revision'],
 readOnly:true,containerCreated:false,applicationStarted:false,embeddedJarProof:'Reuse previous verified extraction for the same immutable local image ID; no extraction/rebuild here.'});
console.log(JSON.stringify({image:image.Id,readOnly:true}));
}
if(phase==='runtime'){
const runtime=path.resolve('../controle-financeiro-runtimes/preparacao-adocao/consolidacao-20261028-01');
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);assert.ok(!entry.isSymbolicLink());if(entry.isDirectory())walk(full);else files.push({file:path.relative(runtime,full),bytes:fs.statSync(full).size,sha256:hash(full)});}}
walk(runtime);
save('runtime-files.json',{at:new Date().toISOString(),runtime,scope:'Only artifacts newly created by this consolidation execution',files});
console.log(JSON.stringify({newRuntimeFiles:files.length}));
}
