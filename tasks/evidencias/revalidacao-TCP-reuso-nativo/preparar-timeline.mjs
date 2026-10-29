import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import crypto from'node:crypto';
const root=path.resolve(process.argv[2]);assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-tcp-')));const f=path.join(root,'review-tools/executar.mjs'),before=fs.readFileSync(f),anchor='const executedSources = {};',extra=`
if(name==='corrigido-instrumentado-pg17'){
 const file='AdoptionRuntimeTest.java',value=fs.readFileSync(path.join(tests,file),'utf8');
 const needle='            AdoptionNativeSockets.awaitReleased(process.pid(), port, deadline);';
 const marked=value.replace(needle,'            PortLifecycleProbeTest.trace.put("processWaitReturned",System.nanoTime());\\n            PortLifecycleProbeTest.trace.put("aliveBeforeInspection",process.isAlive());\\n            PortLifecycleProbeTest.trace.put("shutdownDeadline",deadline);\\n'+needle+'\\n            PortLifecycleProbeTest.trace.put("releaseConfirmed",System.nanoTime());');
 assert.notEqual(marked,value);mutate(file,marked);
}
`;
assert.ok(before.toString().includes(anchor));const after=before.toString().replace(anchor,extra+anchor),sha=b=>crypto.createHash('sha256').update(b).digest('hex');fs.writeFileSync(f+'.before-timeline.txt',before,{flag:'wx'});fs.writeFileSync(f,after);fs.writeFileSync(path.join(root,'timeline-adaptation.json'),JSON.stringify({before:sha(before),after:sha(after),change:'Only final corrected instrumented control: record waitFor-return, remaining phase deadline and TCP postcondition-return using monotonic markers; helper budgets and original bind assertions unchanged. App source restored in driver finally.'},null,2)+'\n',{flag:'wx'});
