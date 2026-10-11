// Os dois cenários do revisor são importados intactos; só observação passiva adicional.
import './frontend-closure-payment.integrated.spec';
import {test} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const events=new Map<string,unknown[]>();
test.beforeEach(async({page},info)=>{
 const entries:unknown[]=[];events.set(info.title,entries);
 await page.exposeFunction('rf15DialogObservation',(entry:unknown)=>entries.push(entry));
 await page.addInitScript(()=>{
  let last='';
  const collect=()=>{
   const state=Array.from(document.querySelectorAll('[role="dialog"]')).map(el=>({label:el.getAttribute('aria-label')??el.getAttribute('aria-labelledby'),text:el.textContent,spinners:el.querySelectorAll('.animate-spin').length,buttons:Array.from(el.querySelectorAll('button')).map(b=>({text:b.textContent,disabled:b.disabled}))}));
   const serialized=JSON.stringify(state);if(serialized===last)return;last=serialized;
   void (window as unknown as {rf15DialogObservation:(x:unknown)=>Promise<void>}).rf15DialogObservation({time:performance.now(),dialogs:state});
  };
  document.addEventListener('DOMContentLoaded',()=>{new MutationObserver(collect).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class','aria-busy']});collect();},{once:true});
 });
});
test.afterEach(async({},info)=>{await writeFile(path.join(process.env.CF_REVIEW_EVIDENCE!,`rva-pending-${info.title.includes('120')?'120':'20'}.json`),JSON.stringify(events.get(info.title),null,2));});
