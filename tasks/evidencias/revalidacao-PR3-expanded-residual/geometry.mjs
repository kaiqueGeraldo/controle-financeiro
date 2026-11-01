import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const runtime=path.resolve(process.argv[2]),front=path.join(runtime,'s/f'),require=createRequire(import.meta.url);
process.env.PLAYWRIGHT_BROWSERS_PATH='0';
const {chromium}=require(path.join(front,'node_modules/@playwright/test'));
const {textGeometry}=await import(pathToFileURL(path.join(front,'tests/e2e/support/text-geometry.ts')));
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:360,height:900}});const page=await context.newPage();const results=[];
try{
for(const kind of ['visible','wrong-text','hidden','transparent','clipped','overlay','outside','filter-opacity','clip-path','pointerless-overlay']){
 await page.setContent('<style>body{margin:20px;background:white;color:black}.badge{display:flex;width:max-content}#text{display:contents}</style><div class="badge"><span id="text">Custo ou avaliação indisponível</span></div>');
 if(kind==='hidden')await page.locator('#text').evaluate(el=>el.style.visibility='hidden');
 if(kind==='transparent')await page.locator('#text').evaluate(el=>el.style.color='transparent');
 if(kind==='clipped')await page.locator('.badge').evaluate(el=>Object.assign(el.style,{width:'20px',overflow:'hidden',whiteSpace:'nowrap'}));
 if(kind==='outside')await page.locator('.badge').evaluate(el=>Object.assign(el.style,{position:'absolute',left:'1000px'}));
 if(kind==='filter-opacity')await page.locator('.badge').evaluate(el=>el.style.filter='opacity(0)');
 if(kind==='clip-path')await page.locator('.badge').evaluate(el=>el.style.clipPath='inset(100%)');
 if(kind==='overlay'||kind==='pointerless-overlay')await page.evaluate(k=>{const cover=document.createElement('div');Object.assign(cover.style,{position:'fixed',inset:'0',zIndex:'999',background:'white',pointerEvents:k==='pointerless-overlay'?'none':'auto'});document.body.append(cover);},kind);
 const target=page.locator('#text'),observed=await textGeometry(target,kind==='wrong-text'?'outra entidade':'Custo ou avaliação indisponível');
 const states=await target.evaluate(el=>({rootColor:getComputedStyle(el).color,parentFilter:getComputedStyle(el.parentElement).filter,rect:el.parentElement.getBoundingClientRect().toJSON(),locatorDisplay:getComputedStyle(el).display}));
 await page.screenshot({path:path.join(runtime,'geometry-'+kind+'.png')});
 results.push({kind,expected:kind==='visible',accepted:observed.ok,observed,states,boundingBox:await target.boundingBox(),playwrightVisible:await target.isVisible()});
}
fs.writeFileSync(path.join(runtime,'geometry-independent.json'),JSON.stringify({results,unexpected:results.filter(r=>r.accepted!==r.expected)},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(results.map(({kind,expected,accepted,observed})=>({kind,expected,accepted,failures:observed.failures}))));
assert.ok(results.every(r=>r.expected===r.accepted),'paint/identity counterexamples must be rejected');
}finally{await context.close();await browser.close();}
