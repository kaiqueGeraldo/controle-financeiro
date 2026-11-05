import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
const runtime=path.resolve(process.argv[2]),front=path.join(runtime,'s/f'),out=path.join(runtime,'independent-static');fs.mkdirSync(out);
process.env.PLAYWRIGHT_BROWSERS_PATH='0';const require=createRequire(import.meta.url),{chromium}=require(path.join(front,'node_modules/@playwright/test')),{textGeometry}=await import(pathToFileURL(path.join(front,'tests/e2e/support/text-geometry.ts')));
const browser=await chromium.launch(),results=[],hash=b=>createHash('sha256').update(b).digest('hex'),text='Custo ou avaliação indisponível';
const html='<style>body{margin:20px;background:white;color:black}.badge{display:flex;width:max-content}#text{display:contents}</style><div class="badge"><span id="text">'+text+'</span></div><button id="action" onclick="this.textContent=\'funcional\'">Verificar continuidade</button>';
async function exercise(name,{setup,expected=true,error=false,shotHook,options={},inspect,expectedReason}={}){
 const context=await browser.newContext({viewport:{width:360,height:900},...options}),page=await context.newPage(),shots=[];
 let before,after,observed,failure,extra,element;
 try{
  await page.setContent(html);if(setup)await setup(page);element=await page.locator('#text').elementHandle();
  before=await element.evaluate(el=>({html:el.outerHTML,style:el.getAttribute('style'),parentStyle:el.parentElement?.getAttribute('style')}));
  const native=page.screenshot.bind(page);let call=0;
  page.screenshot=async opts=>{call++;if(shotHook)await shotHook({page,element,call,opts,native});const started=performance.now(),image=await native(opts);fs.writeFileSync(path.join(out,name+'-'+call+'.png'),image,{flag:'wx'});shots.push({call,options:opts,ms:performance.now()-started,bytes:image.length,sha256:hash(image)});return image;};
  const start=performance.now();try{observed=await textGeometry(page.locator('#text'),text);}catch(e){failure={name:e.name,message:e.message};}const elapsed=performance.now()-start;
  page.screenshot=native;
  try{after=await element.evaluate(el=>({html:el.outerHTML,style:el.getAttribute('style'),connected:el.isConnected,parentStyle:el.parentElement?.getAttribute('style')}));}catch(e){after={lostContext:true,name:e.name};}
  if(inspect)extra=await inspect({page,element,observed,failure});
  const restoration=after.lostContext===true || after.style===before.style;
  const correct=(error?!!failure:!failure&&observed.ok===expected)&&restoration&&(!expectedReason||observed?.failures.includes(expectedReason));
  results.push({name,expected,error,expectedReason,correct,before,after,restoration,observed,failure,elapsed,shots,extra});
 }catch(e){results.push({name,correct:false,preparationError:{name:e.name,message:e.message},shots,before,after});}
 finally{await element?.dispose().catch(()=>{});await context.close();}
}
try{
 await exercise('legitimate-background',{setup:p=>p.addStyleTag({content:'.badge{background:#ddeeff;border:2px solid blue;padding:4px}#text{color:#112233}'})});
 await exercise('transparent-original-fill',{expected:false,expectedReason:'not-painted',setup:p=>p.locator('#text').evaluate(el=>el.style.setProperty('-webkit-text-fill-color','transparent','important'))});
 await exercise('important-fill',{setup:p=>p.locator('#text').evaluate(el=>el.style.cssText='-webkit-text-fill-color: rgb(120, 0, 0) !important; color: navy; padding: 0px')});
 await exercise('inherited-fill',{setup:p=>p.locator('.badge').evaluate(el=>el.style.setProperty('-webkit-text-fill-color','rgb(120,0,0)','important'))});
 await exercise('empty-inline-style',{setup:p=>p.locator('#text').evaluate(el=>el.setAttribute('style',''))});
 await exercise('wrapped-lines',{setup:p=>p.locator('.badge').evaluate(el=>Object.assign(el.style,{width:'130px',flexWrap:'wrap'}))});
 await exercise('dpr-alignment',{options:{deviceScaleFactor:2},setup:p=>p.locator('.badge').evaluate(el=>el.style.transform='translate(0.25px,0.5px)')});
 await exercise('scroll-position',{setup:async p=>{await p.locator('.badge').evaluate(el=>el.style.marginTop='1300px');await p.locator('#text').scrollIntoViewIfNeeded();}});
 for(const n of [1,2,3])await exercise('capture-error-'+n,{error:true,shotHook:({call})=>{if(call===n)throw new Error('controlled screenshot failure '+n);}});
 await exercise('timeout-masked-capture',{error:true,shotHook:({call,opts})=>{if(call===2)opts.timeout=1;}});
 await exercise('removed-element',{expected:false,shotHook:async({call,element})=>{if(call===2)await element.evaluate(el=>el.remove());}});
 await exercise('navigation-interruption',{error:true,shotHook:async({page,call})=>{if(call===2)await page.goto('about:blank');},inspect:async({page})=>{await page.setContent(html);const restored=await textGeometry(page.locator('#text'),text);return{newDocumentAccepted:restored.ok,newStyle:await page.locator('#text').getAttribute('style')};}});
 let nested;
 await exercise('nested-probe',{shotHook:async({page,call})=>{if(call===1){await page.evaluate(()=>{const e=document.createElement('div');e.id='other';e.textContent='Outro texto';document.body.append(e);});nested=await textGeometry(page.locator('#other'),'Outro texto');}},inspect:()=>({nestedRejected:nested?.ok===false,reason:nested?.failures})});
 await exercise('text-update',{expected:false,expectedReason:'text-state-changed',shotHook:async({page,call})=>{if(call===2)await page.locator('#text').evaluate(el=>el.textContent='Conteúdo atualizado durante a leitura');}});
 await exercise('element-replaced',{expected:false,shotHook:async({page,call})=>{if(call===2)await page.locator('#text').evaluate(el=>el.replaceWith(el.cloneNode(true)));}});
 await exercise('scroll-moved',{expected:false,shotHook:async({page,call})=>{if(call===2)await page.evaluate(()=>{document.body.style.marginTop='100px';});}});
 await exercise('unrelated-unstable-content',{expected:false,expectedReason:'unstable-paint',setup:p=>p.addStyleTag({content:'.badge{background:white}'}),shotHook:async({page,call})=>{if(call===2)await page.locator('.badge').evaluate(el=>el.style.background='yellow');}});
 // Static CSS responds to the helper's temporary inline style, not to an external timer.
 // Original target is invisible in A1/A2; B differs only because unrelated background changes.
 await exercise('mask-side-effect-background',{expected:false,expectedReason:'no-glyph-paint',setup:p=>p.addStyleTag({content:'.badge{filter:opacity(0)}body:has(#text[style]){background:black}'}),inspect:async({page})=>({filter:await page.locator('.badge').evaluate(el=>getComputedStyle(el).filter),bodyBackground:await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),functionalButton:await page.locator('#action').click().then(()=>page.locator('#action').innerText())})});
 await exercise('mask-side-effect-other-text',{expected:false,expectedReason:'no-glyph-paint',setup:async p=>{await p.addStyleTag({content:'.badge{filter:opacity(0)}.decoy{position:absolute;left:20px;top:20px;opacity:0;pointer-events:none}body:has(#text[style]) .decoy{opacity:1}'});await p.evaluate(t=>{const e=document.createElement('span');e.className='decoy';e.textContent=t;document.body.append(e);},text);},inspect:async({page})=>({targetFilter:await page.locator('.badge').evaluate(el=>getComputedStyle(el).filter),decoyOpacity:await page.locator('.decoy').evaluate(el=>getComputedStyle(el).opacity)})});
 fs.writeFileSync(path.join(runtime,'independent-static.json'),JSON.stringify({at:new Date(),observerSha256:hash(fs.readFileSync(path.join(front,'tests/e2e/support/text-geometry.ts'))),cases:results,unexpected:results.filter(r=>!r.correct),DPRControlIsNotNativeZoom:true},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(results.map(r=>({name:r.name,correct:r.correct,accepted:r.observed?.ok,reason:r.observed?.failures,error:r.failure?.name,restored:r.restoration,ms:r.elapsed}))));
 assert.ok(results.every(r=>r.correct),'independent observer contract cases must agree');
}finally{await browser.close();}
