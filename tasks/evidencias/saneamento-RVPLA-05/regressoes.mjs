import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';
const root=path.resolve(process.argv[2]),scope=process.argv[3]??'all';assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/rvpla05-')));fs.mkdirSync(root);const tools=path.join(root,'tools'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),adaptations=[];
const folders=['.github/scripts','tasks/evidencias/preparacao-local-adocao','tasks/evidencias/saneamento-RVPLA-03','tasks/evidencias/saneamento-RVPLA-04','tasks/evidencias/revalidacao-RVPLA-04'];
for(const folder of folders)for(const name of fs.readdirSync(folder)){if(!/\.(mjs|ps1|cs|java)$/.test(name))continue;const file=folder+'/'+name,b=fs.readFileSync(file);let text=b.toString().replaceAll('preparacao-adocao/rvpla03-','preparacao-adocao/rvpla05-').replaceAll('preparacao-adocao/rvpla04-','preparacao-adocao/rvpla05-').replaceAll('preparacao-adocao/revalidacao-rvpla04-','preparacao-adocao/rvpla05-');
 if(name==='canal.mjs'&&fs.readFileSync('tasks/evidencias/preparacao-local-adocao/counterproof-supervision.mjs','utf8').includes('mailboxSlot')){const old="const mailbox=path.join(dir,'.owned-runs','mailbox-'+run.runId+'.json');",updated="const registry=path.join(dir,'.owned-runs');const active=fs.readdirSync(registry).filter(n=>n.startsWith('mailbox-'+run.runId+'-')&&n.endsWith('.json')).find(n=>JSON.parse(fs.readFileSync(path.join(registry,n))).mode==='command');assert.ok(active,'Active command slot exists');const mailbox=path.join(registry,active);";assert.ok(text.includes(old));text=text.replace(old,updated);}
 const to=path.join(tools,file);fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,text);adaptations.push({file,original:sha(b),adapted:sha(text),changed:sha(b)!==sha(text)});
}
fs.writeFileSync(path.join(root,'adaptations.json'),JSON.stringify({scope,changes:'Runtime allowlists; channel observer addresses actual active slot when protocol supports slots. Assertions/deadlines unchanged.',adaptations},null,2)+'\n');
const entry=f=>path.join(tools,'tasks/evidencias',f),env={...process.env,REVALIDATION_RUNTIME:path.join(root,'unit'),RESUME_TEST_RUNTIME:path.join(root,'unit'),TEMP:path.join(root,'temp'),TMP:path.join(root,'temp')};fs.mkdirSync(env.TEMP);const results=[];
const commands=scope==='shared'?[['shared',[entry('saneamento-RVPLA-03/shared-process-probe.mjs'),root+'/shared']]]:[
 ['unit',['--test','--test-concurrency=1','tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.test.mjs','tasks/evidencias/revalidacao-preparacao-local-adocao/checkpoint-independente.test.mjs','.github/scripts/ci.test.mjs']],
 ['broker',[entry('saneamento-RVPLA-04/broker-lifecycle.mjs'),root+'/broker']],
 ['before-child',[entry('saneamento-RVPLA-04/broker-lifecycle.mjs'),root+'/before-child','before-child']],
 ['handoff',[entry('saneamento-RVPLA-04/handoff.mjs'),root+'/handoff','mutation']],
 ['inspection',[entry('saneamento-RVPLA-04/inspection-faults.mjs'),root+'/inspection']],
 ['abandonment',[entry('saneamento-RVPLA-03/process-probes.mjs'),root+'/abandonment',path.resolve('tasks/evidencias/preparacao-local-adocao/counterproofs.mjs'),'corrected']],
 ['edge',[entry('saneamento-RVPLA-03/edge-probes.mjs'),root+'/edge']],
 ['channel',[entry('revalidacao-RVPLA-04/canal.mjs'),root]]
];
for(const[name,args]of commands){const fd=fs.openSync(path.join(root,name+'.log'),'wx'),begin=process.hrtime.bigint();let r;try{r=spawnSync(process.execPath,args,{env,windowsHide:true,stdio:['ignore',fd,fd]});}finally{fs.closeSync(fd);}const result={name,args,status:r.status,error:r.error?.message,elapsedMs:Number(process.hrtime.bigint()-begin)/1e6};results.push(result);fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(result));if(r.status!==0)break;}
assert.ok(results.every(r=>r.status===0));assert.equal(results.length,commands.length);
