import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('./run-01/',import.meta.url);
const summary=[];
for(const mode of ['original','date-only'])for(const payment of [20,120]){
 const name=`${mode}-${payment}`;
 const r=JSON.parse(await readFile(new URL(name+'.json',root),'utf8'));
 const reload=JSON.parse(await readFile(new URL(name+'-reload.json',root),'utf8'));
 const events=JSON.parse(await readFile(new URL(name+'-events.json',root),'utf8'));
 const posts=events.filter(e=>e.event==='request'&&e.path.endsWith('/pay'));
 assert.equal(posts.length,1);assert.equal(r.paymentPosts,1);assert.equal(reload.paymentPosts,1);
 assert.equal(r.account.balance,1000-payment);assert.equal(r.invoice.payableAmount,120-payment);
 assert.equal(reload.reloadAccount.balance,1000-payment);assert.equal(reload.reloadInvoice.payableAmount,120-payment);
 assert.equal(r.receipt.operationId,r.command.operationId);assert.equal(r.receipt.amount,payment);
 assert.equal(r.terminal.consumer.isOpen,false);assert.equal(r.terminal.consumer.isLoading,false);
 assert.equal(Date.parse(r.terminal.date),1800014400000);
 const firstClosed=r.samples.find(s=>s.consumer?.isOpen===false);
 assert(firstClosed);
 const delta=r.terminal.performance-r.terminal.timeline;
 if(mode==='date-only'){
  assert.equal(r.closed,true);assert.equal(r.terminal.dialogs.length,0);assert(Math.abs(delta)<100);
  for(const source of Object.values(r.terminal.clocks))assert(source.includes('[native code]'));
 }else if(payment===120){
  assert.equal(r.closed,false);assert.equal(r.terminal.dialogs.length,1);assert(delta>20000);
  const d=r.terminal.dialogs[0];assert.equal(d.spinner,true);assert.equal(d.disabled,true);assert.equal(d.opacity,'1');
  assert(d.animations.some(a=>a.currentTime < -5000&&a.keyframes.some(k=>k.opacity==='0')));
  assert.equal(r.terminal.intents.length,0);
 }
 const paymentId=posts[0].id;
 assert(events.some(e=>e.id===paymentId&&e.event==='response'&&e.status===200));
 assert(events.some(e=>e.id===paymentId&&e.event==='finished'));
 summary.push({name,closedWithin15s:r.closed,delta,react:r.terminal.consumer,domCount:r.terminal.dialogs.length,
  firstClosedPerformance:firstClosed.performance,terminalPerformance:r.terminal.performance,
  terminalAnimationTimes:r.terminal.dialogs.flatMap(d=>d.animations.map(a=>a.currentTime)),
  account:r.account.balance,payable:r.invoice.payableAmount,operationId:r.command.operationId,
  paymentId:r.receipt.id,bankTransactionId:r.receipt.bankTransactionId,postCount:posts.length,reloadVerified:true});
}
await writeFile(new URL('./causal-summary.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');
console.log('Four observations verified: clock counterproof, native timing control, unique payment/receipt and reload. No additional payment executed.');
