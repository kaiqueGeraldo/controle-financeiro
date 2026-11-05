import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const [mode,runtimeArg]=process.argv.slice(2),runtime=path.resolve(runtimeArg);const meta=JSON.parse(fs.readFileSync(path.join(runtime,'prepared.json')));const root=path.resolve(import.meta.dirname,'../../..');assert.equal(meta.origin,root);const subject=meta.subject,sha=b=>createHash('sha256').update(b).digest('hex');
const files=['controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/DashboardService.java','controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/GoalService.java','f/tests/e2e/milestone-remediation.integrated.spec.ts'];
const receipt=path.join(runtime,'counter-finance-clock.json');
if(mode==='apply'){
 const records=[];
 for(const file of files){const full=path.join(subject,file),before=fs.readFileSync(full);const backup=path.join(runtime,'counter-originals',file);fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,before,{flag:'wx'});let text=before.toString();
  const replace=(old,next)=>{assert.ok(text.includes(old),file+' missing exact mutation');text=text.replace(old,next);};
  if(file.endsWith('DashboardService.java')){replace('BigDecimal totalIncome = totals.income();','BigDecimal totalIncome = totals.income().add(new BigDecimal("1000.00"));');replace('return new PeriodTotals(income, expense, cardConsumption, investmentResult);','return new PeriodTotals(income, expense, cardConsumption, BigDecimal.ZERO);');}
  else if(file.endsWith('GoalService.java'))replace('allocationRepository.deleteAll(allocationRepository.findAllByGoalId(id));',`for(var allocation:allocationRepository.findAllByGoalId(id)){
            if(allocation.getAccount()!=null){var account=allocation.getAccount();account.credit(allocation.getAmount());accountRepository.save(account);}
        }
        allocationRepository.deleteAll(allocationRepository.findAllByGoalId(id));`);
  else{replace(' || suffix==="payment"','');text+=`\n// Read-only terminal metadata for the old-clock counterproof.
test.afterEach(async({page},info)=>{if(!info.title.startsWith('SAN-D1 '))return;const state=await page.evaluate(()=>({date:Date.now(),performance:performance.now(),timeline:document.timeline.currentTime,dialogs:[...document.querySelectorAll('[role="dialog"]')].map(el=>({name:el.getAttribute('aria-label'),animations:el.getAnimations({subtree:true}).map(a=>({startTime:a.startTime,currentTime:a.currentTime,playState:a.playState,timing:a.effect?.getComputedTiming()}))}))}));await writeFile(path.join(dir,'counter-clock-observer.json'),JSON.stringify(state,null,2));});\n`;}
  fs.writeFileSync(full,text);records.push({file,before:sha(before),mutant:sha(Buffer.from(text))});
 }
 fs.writeFileSync(receipt,JSON.stringify({at:new Date(),subject,scope:'Only own disposable copy; financial API mutations and old clock; never applied to checkout or real database',records},null,2)+'\n',{flag:'wx'});
}else if(mode==='restore'){
 const data=JSON.parse(fs.readFileSync(receipt));for(const record of data.records){const full=path.join(subject,record.file);assert.equal(sha(fs.readFileSync(full)),record.mutant,'unexpected mutation change');const before=fs.readFileSync(path.join(runtime,'counter-originals',record.file));assert.equal(sha(before),record.before);fs.writeFileSync(full,before);assert.equal(sha(fs.readFileSync(full)),record.before);}
 fs.writeFileSync(path.join(runtime,'counter-finance-clock-restored.json'),JSON.stringify({at:new Date(),allRestored:true,files:data.records.map(r=>({file:r.file,sha256:r.before}))},null,2)+'\n',{flag:'wx'});
}else throw Error('apply or restore');console.log(mode+' complete');
