import type {Locator, Page} from '@playwright/test';
import {prepareTextPaint,verifyTextPaint} from './text-paint.mjs';

// A paint probe briefly masks glyph fill. Do not interleave probes on one page.
const probing = new WeakSet<Page>();

function inspectText(element: Element, expected: string) {
  const failures: string[] = [], rects: Array<{x:number,y:number,width:number,height:number}> = [];
  const glyphs: Array<{text:string,rects:typeof rects}> = [];
  const box = (r: DOMRect) => ({x:r.x,y:r.y,width:r.width,height:r.height});
  const transparent = (color:string) => color === 'transparent' || /(?:rgba\([^)]*,\s*0(?:\.0+)?\)|\/\s*0(?:\.0+)?\s*\))$/.test(color);
  if (!element.isConnected) failures.push('disconnected');
  if (element.textContent?.trim() !== expected) failures.push('identity');
  if (window.top !== window) failures.push('unsupported-frame');
  if (document.fonts.status !== 'loaded') failures.push('fonts-loading');
  if (document.getAnimations().some(a => a.playState === 'running')) failures.push('unstable-animation');
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const segmenter = new Intl.Segmenter(undefined, {granularity:'grapheme'});
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const owner = node.parentElement;
    if (!(owner instanceof HTMLElement)) { failures.push('unsupported-text-owner'); continue; }
    const ancestors: Element[] = [];
    for (let current: Element | null = owner; current; current = current.parentElement) {
      ancestors.push(current);
      const style = getComputedStyle(current);
      if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) < 0.99 || style.contentVisibility === 'hidden') failures.push('not-painted');
    }
    const style = getComputedStyle(owner);
    if (transparent(style.color) || transparent(style.getPropertyValue('-webkit-text-fill-color'))) failures.push('not-painted');
    for (const pseudo of ['::before','::after']) {
      if (!['none','normal','""'].includes(getComputedStyle(owner,pseudo).content)) failures.push('unsupported-generated-content');
    }
    const range = document.createRange(); range.selectNodeContents(node);
    const boxes = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
    if (!boxes.length) failures.push('no-text-box');
    for (const r of boxes) {
      rects.push(box(r));
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) failures.push('outside-viewport');
      for (const parent of ancestors) {
        const style = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
        if (/^(hidden|clip|auto|scroll)$/.test(style.overflowX) && (r.left < bounds.left + parent.clientLeft || r.right > bounds.left + parent.clientLeft + parent.clientWidth)) failures.push('clipped-x');
        if (/^(hidden|clip|auto|scroll)$/.test(style.overflowY) && (r.top < bounds.top + parent.clientTop || r.bottom > bounds.top + parent.clientTop + parent.clientHeight)) failures.push('clipped-y');
      }
      let paintOwner: Element = owner;
      while (getComputedStyle(paintOwner).display === 'contents' && paintOwner.parentElement) paintOwner = paintOwner.parentElement;
      // Conservative coverage check only. Pointer hits do not prove glyph painting.
      for (const fraction of [0.1,0.5,0.9]) {
        const hit = document.elementFromPoint(r.left+r.width*fraction,r.top+r.height/2);
        if (!hit || !(element.contains(hit) || hit === paintOwner)) failures.push('occluded');
      }
    }
    for (const {segment,index} of segmenter.segment(node.textContent)) {
      if (!segment.trim()) continue;
      range.setStart(node,index); range.setEnd(node,index+segment.length);
      const parts = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0).map(box);
      if (!parts.length) failures.push('no-glyph-box');
      glyphs.push({text:segment,rects:parts});
    }
  }
  if (!rects.length || !glyphs.length) failures.push('no-text-box');
  return {ok:failures.length === 0,failures:[...new Set(failures)],text:element.textContent,rects,glyphs,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio}};
}

/** Exact static HTML text: range geometry plus independent glyph attribution. See v2 decision/limits. */
export async function textGeometry(locator: Locator, expectedText: string) {
  const page=locator.page(),element=await locator.elementHandle();
  if(!element)throw new Error('Exact text element is absent');
  try{
    const geometry=await element.evaluate(inspectText,expectedText);
    const reject=(failure:string)=>({...geometry,ok:false,status:'inconclusive',failures:[...geometry.failures,failure]});
    if(!geometry.ok)return geometry;
    if(probing.has(page))return reject('concurrent-paint-probe');
    probing.add(page);
    try{
      const x=Math.floor(Math.min(...geometry.rects.map(r=>r.x))),y=Math.floor(Math.min(...geometry.rects.map(r=>r.y)));
      const clip={x,y,width:Math.ceil(Math.max(...geometry.rects.map(r=>r.x+r.width)))-x,height:Math.ceil(Math.max(...geometry.rects.map(r=>r.y+r.height)))-y};
      if(clip.width*clip.height>1_000_000)return reject('paint-region-too-large');
      const saved=await element.evaluateHandle(prepareTextPaint,clip);
      try{
        const reference=await saved.evaluate(s=>s.reference);
        if(reference.error)return reject('reference:'+reference.error);
        const state=await saved.evaluate(s=>s.state()),screenshot=()=>page.screenshot({type:'png',clip,scale:'css',animations:'allow',caret:'initial'});
        const before=await screenshot();let masked:Buffer,maskState:string,maskAfterState:string;
        try{
          if(!await saved.evaluate(s=>s.mask()))return reject('paint-mask-not-effective');
          maskState=await saved.evaluate(s=>s.state());masked=await screenshot();maskAfterState=await saved.evaluate(s=>s.state());
        }finally{await saved.evaluate(s=>s.restore());}
        const restored=await screenshot(),after=await element.evaluate(inspectText,expectedText),restoredState=await saved.evaluate(s=>s.state());
        if(JSON.stringify(after)!==JSON.stringify(geometry))return reject('text-state-changed');
        const paint=await page.evaluate(verifyTextPaint,{images:[Array.from(before),Array.from(masked),Array.from(restored)],clip,glyphs:geometry.glyphs,reference});
        const failures=[...geometry.failures];
        if(!paint.stable)failures.push('unstable-paint');
        if(state!==maskState||state!==maskAfterState||state!==restoredState)failures.push('paint-side-effects');
        if(!await saved.evaluate(s=>s.restored()))failures.push('paint-state-not-restored');
        if(!paint.dimensions||paint.glyphPixels.length!==geometry.glyphs.length||paint.glyphPixels.some(n=>n===0))failures.push('no-glyph-paint');
        if(paint.outsideMaskPixels||paint.wrongDirectionPixels||paint.unmatchedCorePixels)failures.push('ambiguous-glyph-paint');
        return {...geometry,ok:failures.length===0,status:failures.length?'inconclusive':'painted',failures,paint,reference:{width:reference.width,height:reference.height,inkPixels:reference.alpha.filter(a=>a>0).length,corePixels:reference.alpha.filter(a=>a>=192).length}};
      }finally{await saved.dispose();}
    }finally{probing.delete(page);}
  }finally{await element.dispose();}
}
