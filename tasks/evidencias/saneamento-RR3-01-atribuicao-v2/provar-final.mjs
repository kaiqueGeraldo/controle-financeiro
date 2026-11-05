import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const rt=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..'),out=path.join(rt,'final-records');fs.mkdirSync(out);
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),records=[];
function run(label,script,args,expected=0,env={}){
 const log=path.join(out,label+'.log'),fd=fs.openSync(log,'wx'),started=new Date(),r=spawnSync(process.execPath,[path.join(root,script),...args],{cwd:root,env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:'0',...env},stdio:['ignore',fd,fd],windowsHide:true,timeout:20*60*1000});fs.closeSync(fd);
 records.push({label,script,scriptSha256:sha(path.join(root,script)),args,started,finished:new Date(),exit:r.status,expected,error:r.error?.message,logSha256:sha(log)});fs.writeFileSync(path.join(out,'executions.json'),JSON.stringify(records,null,2)+'\n');console.log(JSON.stringify(records.at(-1)));assert.equal(r.status,expected,label);
}
const stage=path.join(rt,'final-probes'),front=path.join(stage,'s/f'),support=path.join(front,'tests/e2e/support');fs.mkdirSync(support,{recursive:true});fs.symlinkSync(path.join(rt,'s/f/node_modules'),path.join(front,'node_modules'),'junction');
for(const f of ['text-geometry.ts','text-paint.mjs','text-paint.d.mts'])fs.copyFileSync(path.join(root,'controle-financeiro-frontend/tests/e2e/support',f),path.join(support,f));
const deps=path.join(rt,'final-static/s/f/tests/e2e/support');fs.mkdirSync(deps,{recursive:true});for(const f of ['text-paint.mjs','text-paint.d.mts'])fs.copyFileSync(path.join(support,f),path.join(deps,f));
run('original-static','tasks/evidencias/revalidacao-RR3-01/provas-originais.mjs',['static',rt,'final-static']);
run('residual-presence','tasks/evidencias/revalidacao-RR3-01/independentes.mjs',[stage]);
run('residual-value','tasks/evidencias/revalidacao-RR3-01/rodada-2026-11-02-02/atribuicao.mjs',[stage]);
run('interruptions','tasks/evidencias/revalidacao-RR3-01/complementos.mjs',[stage]);
run('counterproof','tasks/evidencias/saneamento-RR3-01-atribuicao-v2/contraprovar.mjs',[rt]);
run('live-final','tasks/evidencias/saneamento-RR3-01-atribuicao-v2/executar.mjs',['run',rt,'live-final','IndependentRR3LiveProbe','MilestoneRemediationBrowserTest'],0,{REVALIDATE_GREP:'SAN-E2-visual|Independent live reason'});
