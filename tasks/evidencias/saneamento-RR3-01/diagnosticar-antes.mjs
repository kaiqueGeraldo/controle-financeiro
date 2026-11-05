import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';
const runtime=path.resolve(process.argv[2]),require=createRequire(import.meta.url),front=path.join(runtime,'s/f'),sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
process.env.PLAYWRIGHT_BROWSERS_PATH='0';
const {chromium}=require(path.join(front,'node_modules/@playwright/test')),sharp=require(path.join(front,'node_modules/sharp'));
const {textGeometry}=await import(pathToFileURL(path.join(front,'tests/e2e/support/text-geometry.ts')));process.env.PLAYWRIGHT_BROWSERS_PATH='0';
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:360,height:900}}),diagnostics=[];
try{
 for(const kind of ['visible','filter-opacity','pointerless-overlay']){
  await page.setContent('<style>body{margin:20px;background:white;color:black}.badge{display:flex;width:max-content}#text{display:contents}</style><div class="badge"><span id="text">Custo ou avaliação indisponível</span></div>');
  if(kind==='filter-opacity')await page.locator('.badge').evaluate(e=>e.style.filter='opacity(0)');
  if(kind==='pointerless-overlay')await page.evaluate(()=>{const cover=document.createElement('div');cover.id='cover';Object.assign(cover.style,{position:'fixed',inset:'0',background:'white',zIndex:'999',pointerEvents:'none'});document.body.append(cover);});
  const target=page.locator('#text'),dom=await target.evaluate(e=>{
   const range=document.createRange();range.selectNodeContents(e);
   const styles=(e)=>{const s=getComputedStyle(e);return Object.fromEntries(['display','visibility','opacity','filter','color','-webkit-text-fill-color','overflow','clip-path','pointer-events','position','z-index'].map(k=>[k,s.getPropertyValue(k)]));};
   const ancestors=[];for(let a=e;a;a=a.parentElement)ancestors.push({tag:a.tagName,id:a.id,classes:a.className,style:styles(a),box:a.getBoundingClientRect().toJSON()});
   return {html:document.body.outerHTML,text:e.textContent,ancestors,ranges:[...range.getClientRects()].map(r=>({box:r.toJSON(),hits:[.1,.5,.9].map(f=>{const x=r.x+r.width*f,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return {x,y,tag:hit?.tagName,id:hit?.id,classes:hit?.className};})})),cover:document.getElementById('cover')?styles(document.getElementById('cover')):null};
  });
  diagnostics.push({kind,dom,observed:await textGeometry(target,'Custo ou avaliação indisponível')});
 }
}finally{await browser.close();}
const rows=[];
for(const group of ['before-static','before-live/browsers/RR3LiveGeometryProbe']){
 const file=path.join(runtime,group,group==='before-static'?'geometry-independent.json':'live-geometry.json'),data=JSON.parse(fs.readFileSync(file));
 for(const o of data.results??data.observations){
  if(!['visible','baseline','filter-opacity','pointerless-overlay','restored'].includes(o.kind))continue;
  const png=path.join(runtime,group,(group==='before-static'?'geometry-':'live-')+o.kind+'.png'),{data:p,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true}),r=o.observed.rects[0];
  let nonWhite=0,red=0;for(let y=Math.floor(r.y);y<Math.ceil(r.y+r.height);y++)for(let x=Math.floor(r.x);x<Math.ceil(r.x+r.width);x++){const i=4*(y*info.width+x);if(p[i]<255||p[i+1]<255||p[i+2]<255)nonWhite++;if(p[i]>120&&p[i]>2*p[i+1]&&p[i]>1.2*p[i+2])red++;}
  rows.push({group,kind:o.kind,accepted:o.observed.ok,nonWhite,red,range:r,pngSha256:sha(png),sourceSha256:sha(file)});
 }
}
for(const r of rows.filter(r=>['filter-opacity','pointerless-overlay'].includes(r.kind))){assert.equal(r.accepted,true);assert.equal(r.group==='before-static'?r.nonWhite:r.red,0);}
fs.writeFileSync(path.join(runtime,'before-diagnostics.json'),JSON.stringify({observerSha256:sha(path.join(front,'tests/e2e/support/text-geometry.ts')),diagnostics,pixels:rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(rows));
