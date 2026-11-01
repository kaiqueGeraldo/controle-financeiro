import {expect,test} from '@playwright/test';
import {textGeometry} from './support/text-geometry';
const text='Custo ou avaliação indisponível';
test.beforeEach(async({page})=>{
 await page.setContent('<style>body{margin:20px;background:white;color:black}.badge{display:flex;width:max-content}#text{display:contents}</style><div class="badge"><span id="text">'+text+'</span></div>');
});
const controls: Array<[string,boolean]> = [
 ['visible',true],['filter-one',true],['clear-overlay',true],['behind-overlay',true],
 ['wrong-identity',false],['self-opacity',false],['ancestor-opacity',false],['descendant-opacity',false],
 ['display-none',false],['visibility-hidden',false],['transparent-color',false],['transparent-fill',false],
 ['overflow-clip',false],['clip-path',false],['pointer-overlay',false],['pointerless-overlay',false],
 ['pointerless-partial-word',false],['ancestor-filter-zero',false],['outside',false],
];
for(const [kind,accepted] of controls)test(kind,async({page})=>{
 await page.evaluate(kind=>{
  const el=document.getElementById('text')!,parent=el.parentElement!;
  if(kind==='self-opacity')el.style.opacity='0';
  if(kind==='ancestor-opacity')parent.style.opacity='0';
  if(kind==='descendant-opacity')el.innerHTML='<span style="opacity:0">'+el.textContent+'</span>';
  if(kind==='display-none')parent.style.display='none';
  if(kind==='visibility-hidden')el.style.visibility='hidden';
  if(kind==='transparent-color')el.style.color='transparent';
  if(kind==='transparent-fill')el.style.setProperty('-webkit-text-fill-color','transparent','important');
  if(kind==='overflow-clip')Object.assign(parent.style,{width:'20px',overflow:'hidden',whiteSpace:'nowrap'});
  if(kind==='clip-path')parent.style.clipPath='inset(100%)';
  if(kind==='outside')Object.assign(parent.style,{position:'absolute',left:'1000px'});
  if(kind==='ancestor-filter-zero')parent.style.filter='opacity(0)';
  if(kind==='filter-one')parent.style.filter='opacity(1)';
  if(['pointer-overlay','pointerless-overlay','pointerless-partial-word','clear-overlay','behind-overlay'].includes(kind)){
   const cover=document.createElement('div');Object.assign(cover.style,{position:'fixed',inset:'0',background:kind==='clear-overlay'?'transparent':'white',zIndex:kind==='behind-overlay'?'-1':'999',pointerEvents:kind==='pointer-overlay'?'auto':'none'});
   if(kind==='pointerless-partial-word'){
    const range=document.createRange();range.setStart(el.firstChild!,0);range.setEnd(el.firstChild!,5);const r=range.getBoundingClientRect();
    Object.assign(cover.style,{inset:'auto',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
   }
   document.body.append(cover);
  }
 },kind);
 const target=page.locator('#text'),html=await target.evaluate(el=>el.outerHTML);
 const observed=await textGeometry(target,kind==='wrong-identity'?'outra entidade':text);
 expect(observed.ok,JSON.stringify(observed)).toBe(accepted);
 expect(await target.evaluate(el=>el.outerHTML)).toBe(html);
 if(kind==='ancestor-filter-zero'||kind.startsWith('pointerless-'))expect(observed.failures).toContain('no-glyph-paint');
});
test('native animation is rejected while running or invisible, then accepted when finished',async({page})=>{
 const target=page.locator('#text');
 await target.evaluate(el=>{const a=el.parentElement!.animate([{opacity:0},{opacity:1}],{duration:60000,fill:'forwards'});a.pause();a.currentTime=0;});
 expect((await textGeometry(target,text)).ok).toBe(false);
 await target.evaluate(el=>el.parentElement!.getAnimations()[0].play());
 expect((await textGeometry(target,text)).ok).toBe(false);
 await target.evaluate(el=>el.parentElement!.getAnimations()[0].finish());
 expect((await textGeometry(target,text)).ok).toBe(true);
});
test('style priority and unrelated declarations survive the paint probe',async({page})=>{
 const target=page.locator('#text');await target.evaluate(el=>(el as HTMLElement).style.cssText='-webkit-text-fill-color: rgb(180, 0, 0) !important; padding: 0px');
 const before=await target.getAttribute('style');expect((await textGeometry(target,text)).ok).toBe(true);expect(await target.getAttribute('style')).toBe(before);
});
test('mask is restored even when screenshot capture fails',async({page})=>{
 const target=page.locator('#text'),screenshot=page.screenshot.bind(page);let calls=0;
 page.screenshot=async(...args)=>{if(++calls===2)throw new Error('controlled capture failure');return screenshot(...args);};
 try{await expect(textGeometry(target,text)).rejects.toThrow('controlled capture failure');}finally{page.screenshot=screenshot;}
 expect(await target.getAttribute('style')).toBeNull();expect((await textGeometry(target,text)).ok).toBe(true);
});
test('does not fast-forward animation or wait for an invisible state to become visible',async({page})=>{
 const target=page.locator('#text');await target.evaluate(el=>{const a=el.parentElement!.animate([{opacity:0},{opacity:1}],{duration:60000,fill:'forwards'});a.pause();a.currentTime=0;});
 expect((await textGeometry(target,text)).ok).toBe(false);
 expect(await target.evaluate(el=>{const a=el.parentElement!.getAnimations()[0];return{time:a.currentTime,state:a.playState};})).toEqual({time:0,state:'paused'});
});
test('uses the visible text range after scrolling',async({page})=>{
 const target=page.locator('#text');await target.evaluate(el=>el.parentElement!.style.marginTop='1300px');
 await target.scrollIntoViewIfNeeded();expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(0);
 expect((await textGeometry(target,text)).ok).toBe(true);
 await target.evaluate(el=>el.parentElement!.style.filter='opacity(0)');
 expect((await textGeometry(target,text)).ok).toBe(false);
});
