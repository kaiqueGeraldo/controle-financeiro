import {expect,test} from '@playwright/test';
import {textGeometry} from './support/text-geometry';
import {prepareTextPaint,verifyTextPaint} from './support/text-paint.mjs';
const text='Custo ou avaliação indisponível';
test.beforeEach(async({page})=>{
 await page.setContent('<style>body{margin:20px;background:white;color:black}.badge{display:flex;width:max-content}#text{display:contents}</style><div class="badge"><span id="text">'+text+'</span></div><button onclick="this.textContent=\'Funcional\'">Continuar</button>');
});
for(const kind of ['background-presence','other-text-B','background-value','other-text-original'])test('v2 rejects '+kind,async({page})=>{
 await page.locator('.badge').evaluate(el=>el.style.filter='opacity(0)');
 if(kind==='background-value')await page.locator('#text').evaluate(el=>el.setAttribute('style','color: rgb(0, 0, 0);'));
 const selector=kind==='background-value'?'#text[style*="-webkit-text-fill-color"]':'#text[style]';
 await page.addStyleTag({content:kind.startsWith('background')?'body:has('+selector+'){background:black}':'.decoy{position:absolute;left:20px;top:20px;opacity:0;pointer-events:none}body:has(#text[style]) .decoy{opacity:1}'});
 if(kind.startsWith('other-text'))await page.evaluate(({text,kind})=>{const e=document.createElement('span');e.textContent=text;e.className='decoy';if(kind==='other-text-original')e.style.opacity='1';document.body.append(e);},{text,kind});
 const before=await page.locator('#text').evaluate(el=>el.outerHTML);
 const result=await textGeometry(page.locator('#text'),text);expect(result.ok).toBe(false);
 expect(result.failures).toContain('no-glyph-paint');expect(await page.locator('#text').evaluate(el=>el.outerHTML)).toBe(before);
});
test('v2 visible text on legitimate gradient',async({page})=>{
 await page.locator('.badge').evaluate(el=>el.style.background='linear-gradient(90deg,#ddeeff,#ffeecc)');
 expect((await textGeometry(page.locator('#text'),text)).ok).toBe(true);
});
test('v2 independently rendered multiline text',async({page})=>{
 await page.locator('.badge').evaluate(el=>Object.assign(el.style,{width:'130px',flexWrap:'wrap'}));
 const result=await textGeometry(page.locator('#text'),text);expect(result.ok).toBe(true);expect(result.rects.length).toBeGreaterThan(1);
});
test('v2 preserves attributes, sheets and registry and records the independent mask',async({page},info)=>{
 const target=page.locator('#text'),before=await target.evaluate(el=>({html:el.outerHTML,sheets:document.adoptedStyleSheets.length,highlights:CSS.highlights.size}));
 const r=await target.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const b=range.getBoundingClientRect();return{x:Math.floor(b.x),y:Math.floor(b.y),width:Math.ceil(b.right)-Math.floor(b.x),height:Math.ceil(b.bottom)-Math.floor(b.y)};});
 const saved=await target.evaluateHandle(prepareTextPaint,r),ref=await saved.evaluate(s=>s.reference);await saved.dispose();
 const png=await page.evaluate(async ref=>{
  const canvas=new OffscreenCanvas(ref.width,ref.height),ctx=canvas.getContext('2d')!,pixels=new Uint8ClampedArray(4*ref.alpha.length);
  for(let n=0;n<ref.alpha.length;n++)pixels.set([0,0,0,ref.alpha[n]],4*n);
  ctx.putImageData(new ImageData(pixels,ref.width,ref.height),0,0);return [...new Uint8Array(await (await canvas.convertToBlob({type:'image/png'})).arrayBuffer())];
 },ref);
 await info.attach('independent-glyph-mask',{body:Buffer.from(png),contentType:'image/png'});
 const native=page.screenshot.bind(page);let calls=0;
 page.screenshot=async options=>{const image=await native(options);await info.attach('paint-'+(++calls),{body:image,contentType:'image/png'});return image;};
 try{expect((await textGeometry(target,text)).ok).toBe(true);}finally{page.screenshot=native;}
 expect(calls).toBe(3);expect(await target.evaluate(el=>({html:el.outerHTML,sheets:document.adoptedStyleSheets.length,highlights:CSS.highlights.size}))).toEqual(before);
});
for(const call of [1,2,3])test('v2 cleans its highlight after interrupted capture '+call,async({page})=>{
 const target=page.locator('#text'),html=await target.evaluate(el=>el.outerHTML),native=page.screenshot.bind(page);let calls=0;
 page.screenshot=async options=>{if(++calls===call)throw new Error('interrupted capture');return native(options);};
 try{await expect(textGeometry(target,text)).rejects.toThrow('interrupted capture');}finally{page.screenshot=native;}
 expect(await target.evaluate(el=>({html:el.outerHTML,sheets:document.adoptedStyleSheets.length,highlights:CSS.highlights.size}))).toEqual({html,sheets:0,highlights:0});
 await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.getByRole('button',{name:'Funcional',exact:true})).toBeVisible();
 expect((await textGeometry(target,text)).ok).toBe(true);
});
test('v2 cloning during capture cannot copy a transient inline mask',async({page})=>{
 const target=page.locator('#text'),html=await target.evaluate(el=>el.outerHTML),native=page.screenshot.bind(page);let calls=0;
 page.screenshot=async options=>{if(++calls===2)await target.evaluate(el=>el.replaceWith(el.cloneNode(true)));return native(options);};
 try{expect((await textGeometry(target,text)).ok).toBe(false);}finally{page.screenshot=native;}
 expect(await target.evaluate(el=>el.outerHTML)).toBe(html);expect((await textGeometry(target,text)).ok).toBe(true);
 expect(await page.evaluate(()=>({sheets:document.adoptedStyleSheets.length,highlights:CSS.highlights.size}))).toEqual({sheets:0,highlights:0});
});
test('v2 unsupported editable reference is inconclusive',async({page})=>{
 await page.locator('#text').evaluate(el=>el.setAttribute('contenteditable','true'));
 const result=await textGeometry(page.locator('#text'),text);expect(result).toMatchObject({ok:false,status:'inconclusive'});expect(result.failures).toContain('reference:editable-text');
});
test('v2 unrelated background during B cannot satisfy attribution',async({page})=>{
 await page.locator('.badge').evaluate(el=>el.style.filter='opacity(0)');
 const native=page.screenshot.bind(page);let calls=0;
 page.screenshot=async options=>{if(++calls!==2)return native(options);await page.evaluate(()=>document.body.style.background='black');try{return await native(options);}finally{await page.evaluate(()=>document.body.removeAttribute('style'));}};
 try{const result=await textGeometry(page.locator('#text'),text);expect(result.ok).toBe(false);expect(result.failures).toContain('ambiguous-glyph-paint');}finally{page.screenshot=native;}
});
for(const kind of ['glyph','rectangle','reverse'])test('v2 independent raster contract '+kind,async({page})=>{
 const images=await page.evaluate(async kind=>{
  async function encode(phase:number){
   const canvas=new OffscreenCanvas(8,8),ctx=canvas.getContext('2d')!,data=new Uint8ClampedArray(8*8*4);
   for(let p=0;p<64;p++){const black=kind==='reverse'?phase===1:phase!==1&&(kind==='rectangle'||p===27);data.set(black?[0,0,0,255]:[255,255,255,255],4*p);}
   ctx.putImageData(new ImageData(data,8,8),0,0);return [...new Uint8Array(await (await canvas.convertToBlob({type:'image/png'})).arrayBuffer())];
  }
  return await Promise.all([0,1,2].map(encode));
 },kind);
 const alpha=Array<number>(64).fill(0);alpha[27]=255;
 const result=await page.evaluate(verifyTextPaint,{images,clip:{x:0,y:0,width:8,height:8},glyphs:[{rects:[{x:0,y:0,width:8,height:8}]}],reference:{width:8,height:8,alpha,color:[0,0,0,255]}});
 expect(result.stable).toBe(true);
 if(kind==='glyph')expect(result).toMatchObject({changedPixels:1,glyphPixels:[1],outsideMaskPixels:0,wrongDirectionPixels:0,unmatchedCorePixels:0});
 if(kind==='rectangle')expect(result.outsideMaskPixels).toBe(55);
 if(kind==='reverse')expect(result.wrongDirectionPixels).toBe(64);
});
test('v2 foreign canvas in the text region is inconclusive',async({page})=>{
 await page.evaluate(()=>{const canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'fixed',left:'20px',top:'20px',width:'210px',height:'20px',pointerEvents:'none'});document.body.append(canvas);});
 const result=await textGeometry(page.locator('#text'),text);expect(result).toMatchObject({ok:false,status:'inconclusive'});expect(result.failures).toContain('reference:unsupported-paint-source');
});
test('v2 preserves preexisting highlight ownership when inconclusive',async({page})=>{
 await page.locator('#text').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);CSS.highlights.set('existing',new Highlight(range));});
 const result=await textGeometry(page.locator('#text'),text);expect(result).toMatchObject({ok:false,status:'inconclusive'});
 expect(result.failures).toContain('reference:existing-text-highlight');expect(await page.evaluate(()=>CSS.highlights.has('existing'))).toBe(true);
 expect(await page.evaluate(()=>document.adoptedStyleSheets.length)).toBe(0);
});
