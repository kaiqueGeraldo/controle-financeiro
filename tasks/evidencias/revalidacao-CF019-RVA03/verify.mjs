import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const root=process.cwd(),run=process.argv[2]??'run-01';
const read=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8').replace(/^\uFEFF/,''));
const sql=fs.readFileSync(path.join(base,run,'persisted.txt'),'utf8');
const summary=[];
for(const mode of ['original','date-only'])for(const payment of [20,120]){
 const prefix=mode+'-'+payment,r=read(run+'/'+prefix+'.json'),reload=read(run+'/'+prefix+'-reload.json');
 const events=read(run+'/'+prefix+'-events.json');
 const response=JSON.parse(r.response.body);
 const posts=events.filter(e=>e.event==='request'&&e.method==='POST'&&e.path.endsWith('/pay'));
 assert.equal(posts.length,1);assert.equal(r.paymentPosts,1);assert.equal(reload.paymentPosts,1);
 assert.deepEqual(response,r.receipt);assert.equal(r.receipt.operationId,r.command.operationId);
 assert.equal(r.receipt.amount,payment);assert.equal(r.receipt.accountId,r.accountId);
 for(const state of [r.terminal,reload.state])assert.equal(Date.parse(state.date),1800014400000);
 assert.equal(r.account.balance,1000-payment);assert.equal(reload.reloadAccount.balance,1000-payment);
 assert.equal(r.invoice.payableAmount,120-payment);assert.equal(reload.reloadInvoice.payableAmount,120-payment);
 assert.equal(r.invoice.status,'OPEN');assert.equal(r.terminal.consumer.isOpen,false);
 assert.equal(r.terminal.consumer.isLoading,false);assert.equal(r.terminal.intents.length,0);
 if(mode==='date-only'){const interaction=read(run+'/'+prefix+'-interaction.json');assert.equal(interaction.closedAndReopened,true);assert.equal(interaction.postCount,1);}
 assert.equal(sql.split('operation_id='+r.command.operationId).length-1,1);
 assert(sql.includes('bank_transaction_id='+r.receipt.bankTransactionId));
 assert(events.some(e=>e.id===posts[0].id&&e.event==='finished'));
 const delta=r.terminal.performance-r.terminal.timeline;
 if(mode==='original'&&payment===120){
  assert.equal(r.closed,false);assert.equal(r.terminal.dialogs.length,1);
  assert.equal(r.terminal.dialogs[0].spinner,true);assert(delta>20000);
  assert(r.terminal.dialogs[0].animations.some(a=>a.currentTime<0&&a.startTime>r.terminal.timeline&&a.keyframes.some(k=>k.opacity==='0')));
 }else if(mode==='date-only'){
  assert.equal(r.closed,true);assert.equal(r.terminal.dialogs.length,0);
  assert(Math.abs(delta)<100);for(const fn of Object.values(r.terminal.clocks))assert(fn.includes('[native code]'));
 }
 summary.push({case:prefix,closed:r.closed,delta,react:r.terminal.consumer,dom:r.terminal.dialogs.length,
  animationTimes:r.terminal.dialogs.flatMap(d=>d.animations.map(a=>({start:a.startTime,current:a.currentTime}))),
  receipt:r.receipt,bank:r.account.balance,debt:r.invoice.payableAmount,reloadFinancial:true,interaction:mode==='date-only'});
}
const preserved=read('preservation-initial.json').map(p=>({...p,unchanged:createHash('sha256').update(fs.readFileSync(path.join(root,p.path))).digest('hex')===p.sha256}));
assert(preserved.every(p=>p.unchanged));
const files=execFileSync('git',['ls-tree','-r','--name-only','18c7150','controle-financeiro-backend/src/main','controle-financeiro-frontend/src'],{encoding:'utf8'}).trim().split('\n');
const newlineOnly=[];
for(const file of files){const blob=execFileSync('git',['show','18c7150:'+file],{maxBuffer:32*1024*1024});const actual=fs.readFileSync(path.join(root,'.rv3',file));
 if(!actual.equals(blob)){assert(!actual.includes(0)&&!blob.includes(0),file);assert.equal(actual.toString('utf8').replaceAll('\r\n','\n'),blob.toString('utf8').replaceAll('\r\n','\n'),file);newlineOnly.push(file);}
}
fs.writeFileSync(path.join(base,'causal-summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(base,'preservation-final.json'),JSON.stringify({preserved,isolatedProductFiles:files.length,productEquivalent:true,newlineOnly},null,2)+'\n');
console.log('Verified causal counterproof, native clocks, identity/receipt/SQL, financial reload, interaction and preservation.');
