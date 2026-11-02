import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const runtime=path.resolve(process.argv[2]),front=path.join(runtime,'s/f'),require=createRequire(import.meta.url);process.env.PLAYWRIGHT_BROWSERS_PATH='0';
const {chromium}=require(path.join(front,'node_modules/@playwright/test')),{textGeometry}=await import(pathToFileURL(path.join(front,'tests/e2e/support/text-geometry.ts'))),browser=await chromium.launch(),text='Custo ou avaliação indisponível',records=[];
const html='<style>body{margin:20px;background:white;color:black}#text{display:contents}</style><div><span id="text">'+text+'</span></div><button onclick="this.textContent=\'funcional\'">Continuar</button>';
try{
 for(const kind of ['fonts-loading','timeout-then-continuation','fresh-element-replacement','late-native-animation']){
  const context=await browser.newContext({viewport:{width:360,height:900}}),page=await context.newPage();
  try{
   let pending,observed,error,followup,shots=0,clock;
   if(kind==='fonts-loading'){
    await page.route('**/delayed-font.woff2',route=>{pending=route;});
    await page.setContent('<style>@font-face{font-family:ReviewPending;src:url(http://127.0.0.1:39099/delayed-font.woff2)}#text{font-family:ReviewPending}</style><span id="text">'+text+'</span>',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.fonts.status==='loading');
    const native=page.screenshot.bind(page);page.screenshot=async opts=>{shots++;return native(opts);};
    observed=await textGeometry(page.locator('#text'),text);assert.ok(observed.failures.includes('fonts-loading'));assert.equal(shots,0);
    await pending.abort();await page.evaluate(()=>document.fonts.ready);await page.setContent(html);page.screenshot=native;followup=await textGeometry(page.locator('#text'),text);assert.equal(followup.ok,true);
   }else{
    await page.setContent(html);const native=page.screenshot.bind(page);const handle=await page.locator('#text').elementHandle();
    page.screenshot=async opts=>{shots++;
      if(shots===2){
       if(kind==='timeout-then-continuation')opts.timeout=1;
       if(kind==='fresh-element-replacement')await page.locator('#text').evaluate(el=>{const fresh=document.createElement('span');fresh.id=el.id;fresh.textContent=el.textContent;fresh.style.display='contents';el.replaceWith(fresh);});
       if(kind==='late-native-animation')await page.locator('#text').evaluate(el=>el.parentElement.animate([{color:'black'},{color:'red'}],{duration:60000,fill:'forwards'}));
      }
      return native(opts);
    };
    try{observed=await textGeometry(page.locator('#text'),text);}catch(e){error={name:e.name,message:e.message};}page.screenshot=native;
    const detachedStyle=await handle.evaluate(el=>el.style.getPropertyValue('-webkit-text-fill-color'));assert.equal(detachedStyle,'');await handle.dispose();
    if(kind==='late-native-animation'){assert.equal(observed.ok,false);clock=await page.evaluate(()=>document.getAnimations().map(a=>({time:a.currentTime,state:a.playState})));assert.ok(clock.some(a=>a.state==='running'));}
    else{if(kind==='timeout-then-continuation')assert.equal(error.name,'TimeoutError');else assert.equal(observed.ok,false);followup=await textGeometry(page.locator('#text'),text);assert.equal(followup.ok,true);await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'funcional',exact:true}).waitFor();}
   }
   const style=await page.locator('#text').getAttribute('style');assert.ok(!style?.includes('text-fill-color'));
   records.push({kind,passed:true,observed,error,followup,shots,clock,finalStyle:style});
  }catch(e){records.push({kind,passed:false,error:{name:e.name,message:e.message}});}finally{await context.close();}
 }
 fs.writeFileSync(path.join(runtime,'independent-complement.json'),JSON.stringify({at:new Date(),records},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(records.map(r=>({kind:r.kind,passed:r.passed,reason:r.observed?.failures,followup:r.followup?.ok,error:r.error?.name}))));assert.ok(records.every(r=>r.passed));
}finally{await browser.close();}
