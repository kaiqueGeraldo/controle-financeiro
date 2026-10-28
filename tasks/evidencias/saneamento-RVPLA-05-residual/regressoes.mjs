import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root=path.resolve(process.argv[2]);
assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-')));
assert.equal(fs.existsSync(root),false);fs.mkdirSync(root);
const tools=path.join(root,'tools'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),adaptations=[];
for(const folder of ['.github/scripts','tasks/evidencias/preparacao-local-adocao','tasks/evidencias/saneamento-RVPLA-03','tasks/evidencias/saneamento-RVPLA-04','tasks/evidencias/revalidacao-RVPLA-04','tasks/evidencias/revalidacao-RVPLA-05']) {
  for(const name of fs.readdirSync(folder)) {
    if(!/\.(mjs|ps1|cs|java)$/.test(name))continue;
    const file=folder+'/'+name,original=fs.readFileSync(file);let code=original.toString();
    for(const prefix of ['rvpla03-','rvpla04-','revalidacao-rvpla04-','revalidacao-rvpla05-'])code=code.replaceAll('preparacao-adocao/'+prefix,'preparacao-adocao/rvpla05-residual-');
    if(file==='tasks/evidencias/revalidacao-RVPLA-04/canal.mjs') {
      const old="const mailbox=path.join(dir,'.owned-runs','mailbox-'+run.runId+'.json');";
      const active="const registry=path.join(dir,'.owned-runs');const active=fs.readdirSync(registry).filter(n=>n.startsWith('mailbox-'+run.runId+'-')&&n.endsWith('.json')).find(n=>JSON.parse(fs.readFileSync(path.join(registry,n))).mode==='command');assert.ok(active,'Active command slot exists');const mailbox=path.join(registry,active);";
      assert.ok(code.includes(old));code=code.replace(old,active);
    }
    const to=path.join(tools,file);fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,code);
    adaptations.push({file,originalSha256:sha(original),adaptedSha256:sha(code),changed:sha(original)!==sha(code)});
  }
}
fs.writeFileSync(path.join(root,'adaptations.json'),JSON.stringify({scope:'Executed legacy drivers: destination allowlists only; channel observer addresses the already-accepted active slot. No deadline/assertion/lifetime changes. Full original30s foreign fixture intentionally not rerun.',adaptations},null,2)+'\n');
const entry=f=>path.join(tools,'tasks/evidencias',f),env={...process.env,REVALIDATION_RUNTIME:path.join(root,'unit'),RESUME_TEST_RUNTIME:path.join(root,'unit'),TEMP:path.join(root,'temp'),TMP:path.join(root,'temp')};
fs.mkdirSync(env.TEMP);
const commands=[
  ['unit',['--test','--test-concurrency=1','tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.test.mjs','tasks/evidencias/revalidacao-preparacao-local-adocao/checkpoint-independente.test.mjs','.github/scripts/ci.test.mjs']],
  ['broker',[entry('saneamento-RVPLA-04/broker-lifecycle.mjs'),root+'/broker']],
  ['before-child',[entry('saneamento-RVPLA-04/broker-lifecycle.mjs'),root+'/before-child','before-child']],
  ['handoff',[entry('saneamento-RVPLA-04/handoff.mjs'),root+'/handoff','mutation']],
  ['inspection',[entry('saneamento-RVPLA-04/inspection-faults.mjs'),root+'/inspection']],
  ['edge',[entry('saneamento-RVPLA-03/edge-probes.mjs'),root+'/edge']],
  ['channel',[entry('revalidacao-RVPLA-04/canal.mjs'),root]],
  ['foreign',[entry('revalidacao-RVPLA-05/alheio.mjs'),root]],
];
const results=[];
for(const[name,args]of commands) {
  const fd=fs.openSync(path.join(root,name+'.log'),'wx'),begin=process.hrtime.bigint();let run;
  try{run=spawnSync(process.execPath,args,{env,windowsHide:true,stdio:['ignore',fd,fd]});}finally{fs.closeSync(fd);}
  const result={name,args,status:run.status,error:run.error?.message,elapsedMs:Number(process.hrtime.bigint()-begin)/1e6};
  results.push(result);fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(result));
  assert.equal(run.status,0,'Keep failure; no retry: '+name);
}
