import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync,execFileSync} from 'node:child_process';
const [runtimeArg]=process.argv.slice(2);assert.ok(runtimeArg);const runtime=fs.realpathSync.native(runtimeArg),probes=import.meta.dirname;
const docker=(...args)=>execFileSync('docker',['--context','desktop-linux',...args],{encoding:'utf8',windowsHide:true}).trim();
const image=docker('image','inspect','cf-excecao-zoom:20261103-01','--format','{{.Id}}'),name='cf-component-timeout-'+path.basename(runtime);
assert.equal(image,'sha256:c7492c6f8ef9a57a98ff15dc7a6c82a96712b99a97a5fa19edb9576a7b34d5b1');
const id=docker('create','--name',name,'--label','cf.component.run='+path.basename(runtime),'--shm-size=1g','--mount','type=bind,source='+path.join(runtime,'inputs')+',target=/inputs,readonly','--mount','type=bind,source='+runtime+',target=/evidence','--mount','type=bind,source='+probes+',target=/probes,readonly','--entrypoint','sleep',image,'infinity');
fs.writeFileSync(path.join(runtime,'container.json'),JSON.stringify({at:new Date().toISOString(),id,name,image,policy:'Owned native Linux diagnostic executor; no Docker socket, no backend, no database'},null,2)+'\n',{flag:'wx'});
docker('start',id);
const copy="import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';const m=JSON.parse(fs.readFileSync('/inputs/.ci-source.json'));for(const f of m.files){const p=path.resolve('/work/s',f.path);if(!p.startsWith('/work/s/'))throw Error('path');fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(path.join('/inputs',f.path),p);if(createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==f.sha256)throw Error(f.path);}fs.copyFileSync('/inputs/.ci-source.json','/work/s/.ci-source.json');fs.mkdirSync('/work/diag',{recursive:true});for(const f of ['diagnostic-probe.tsx','instrument.mjs','reporter.mjs','experiments.mjs'])fs.copyFileSync('/probes/'+f,'/work/diag/'+f);";
fs.writeFileSync(path.join(runtime,'copy-native.mjs'),copy,{flag:'wx'});
function command(name,args){const fd=fs.openSync(path.join(runtime,name+'.log'),'wx'),started=new Date().toISOString();const result=spawnSync('docker',['--context','desktop-linux','exec',id,...args],{windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);fs.writeFileSync(path.join(runtime,name+'-invocation.json'),JSON.stringify({started,finished:new Date().toISOString(),id,command:['docker','exec',id,...args],exit:result.status,error:result.error?.message},null,2)+'\n',{flag:'wx'});assert.equal(result.status,0,name);console.log(name+': completed');}
command('copy-native',['node','/evidence/copy-native.mjs']);
command('install',['sh','-c','cd /work/s/controle-financeiro-frontend && npm ci --no-audit --no-fund']);
command('instrument',['node','/work/diag/instrument.mjs']);
command('initial-matrix',['node','/work/diag/experiments.mjs','initial']);
console.log(JSON.stringify({id,retained:'Owned executor retained for conditional experiments; cleanup required at end'}));
