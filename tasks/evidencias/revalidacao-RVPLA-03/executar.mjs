import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import crypto from'node:crypto';import{execFileSync,spawnSync}from'node:child_process';
const root=path.resolve(process.argv[2]);assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-rvpla03-')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),tools=path.join(root,'tools'),records=[],adaptations=[];
const source='tasks/evidencias/saneamento-RVPLA-03';
const candidates=['.github/scripts/owned-process.mjs','.github/scripts/owned-process.ps1','.github/scripts/owned-job-probe.ps1',...['counterproofs.mjs','counterproof-supervision.mjs','counterproof-checkpoint.mjs','counterproof-observation.mjs'].map(n=>'tasks/evidencias/preparacao-local-adocao/'+n)];
for(const f of [...candidates,...fs.readdirSync(source).filter(n=>/\.(mjs|ps1|java)$/.test(n)).map(n=>source+'/'+n)]){
 const original=fs.readFileSync(f),text=original.toString(),adapted=f.startsWith(source+'/')?text.replaceAll('preparacao-adocao/rvpla03-','preparacao-adocao/revalidacao-rvpla03-'):text,target=path.join(tools,f);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,adapted);adaptations.push({source:f,originalSha256:sha(original),copySha256:sha(fs.readFileSync(target)),runtimeAllowlistOnly:text!==adapted});
}
fs.writeFileSync(path.join(root,'adaptacoes.json'),JSON.stringify(adaptations,null,2)+'\n');
function run(name,executable,args,extra={}){console.log('START '+name);const log=path.join(root,name+'.log'),fd=fs.openSync(log,'wx');let r;try{r=spawnSync(executable,args,{cwd:process.cwd(),env:{...process.env,...extra},stdio:['ignore',fd,fd],windowsHide:true});}finally{fs.closeSync(fd);}records.push({name,args,exit:r.status,error:r.error?.message,logSha256:sha(fs.readFileSync(log))});fs.writeFileSync(path.join(root,'execucoes.json'),JSON.stringify(records,null,2)+'\n');console.log('END '+name+' exit='+r.status);assert.equal(r.status,0,name+' failed; retained '+log);}
const old=path.join(root,'original');fs.mkdirSync(old);const modules=path.join(old,'modules');fs.mkdirSync(modules);
for(const n of ['counterproofs.mjs','counterproof-checkpoint.mjs','counterproof-observation.mjs'])fs.writeFileSync(path.join(modules,n),execFileSync('git',['show','9bed5e2:tasks/evidencias/preparacao-local-adocao/'+n]));
const original=execFileSync('git',['show','9bed5e2:tasks/evidencias/revalidacao-preparacao-local-adocao/quiescencia-orfao.ps1']);fs.writeFileSync(path.join(old,'original.ps1'),original);
const q=s=>"'"+s.replaceAll("'","''")+"'";
fs.writeFileSync(path.join(old,'replay.ps1'),`$ErrorActionPreference='Stop'\nfunction Copy-Item {param([string]$LiteralPath,[string]$Destination)\n if($LiteralPath -match '^tasks/evidencias/preparacao-local-adocao/(counterproofs\\.mjs|counterproof-checkpoint\\.mjs|counterproof-observation\\.mjs)$'){Microsoft.PowerShell.Management\\Copy-Item -LiteralPath (Join-Path ${q(modules)} $Matches[1]) -Destination $Destination}else{Microsoft.PowerShell.Management\\Copy-Item -LiteralPath $LiteralPath -Destination $Destination}\n}\n& ${q(path.join(old,'original.ps1'))} ${q(old)}\n`);
run('original-replay',process.env.REVIEW_PWSH,['-NoProfile','-NonInteractive','-File',path.join(old,'replay.ps1')]);
fs.writeFileSync(path.join(old,'hashes.json'),JSON.stringify({originalObserverSha256:sha(original),observerUnmodified:true,plumbing:'Only Copy-Item redirects the three runner module inputs to immutable blobs from 9bed5e2; original script and assertions unchanged',modules:Object.fromEntries(fs.readdirSync(modules).map(n=>[n,sha(fs.readFileSync(path.join(modules,n)))]))},null,2)+'\n');
fs.mkdirSync(path.join(root,'units'),{recursive:true});fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
run('unit-43',process.execPath,['--test','--test-reporter=tap','tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.test.mjs','tasks/evidencias/revalidacao-preparacao-local-adocao/checkpoint-independente.test.mjs','.github/scripts/ci.test.mjs'],{REVALIDATION_RUNTIME:path.join(root,'units'),RESUME_TEST_RUNTIME:path.join(root,'units/fixtures'),TEMP:path.join(root,'tmp'),TMP:path.join(root,'tmp')});
const here=path.join(tools,source),runner=path.join(tools,'tasks/evidencias/preparacao-local-adocao/counterproofs.mjs');
run('process-5',process.execPath,[path.join(here,'process-probes.mjs'),path.join(root,'process'),runner]);
run('edges-5',process.execPath,[path.join(here,'edge-probes.mjs'),path.join(root,'edges')]);
run('shared',process.execPath,[path.join(here,'shared-process-probe.mjs'),path.join(root,'shared')]);
run('mutation-claimed',process.execPath,[path.join(here,'mutation.mjs'),path.join(root,'mutation-claimed')]);
fs.writeFileSync(path.join(root,'process-groups-complete.json'),JSON.stringify({at:new Date().toISOString(),records},null,2)+'\n');
run('regression',process.execPath,[path.join(here,'regression-worker.mjs'),root]);
