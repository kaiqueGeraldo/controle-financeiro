import type {Locator, Page} from '@playwright/test';

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

/** Exact HTML text + complete range geometry + stable, nonzero glyph-fill contribution.
 * Uses A / masked-fill B / restored A screenshots; no reference snapshots or timer changes.
 * Conservative evidence for the current static badge, not OCR, contrast, focus or actionability.
 * See tasks/evidencias/saneamento-RR3-01/CONTRATO.md for the bounded paint contract. */
export async function textGeometry(locator: Locator, expectedText: string) {
  const page = locator.page(), element = await locator.elementHandle();
  if (!element) throw new Error('Exact text element is absent');
  try {
    const geometry = await element.evaluate(inspectText,expectedText);
    const reject = (failure:string) => ({...geometry,ok:false,failures:[...geometry.failures,failure]});
    if (!geometry.ok) return geometry;
    if (probing.has(page)) return reject('concurrent-paint-probe');
    probing.add(page);
    try {
      const x = Math.floor(Math.min(...geometry.rects.map(r=>r.x))), y = Math.floor(Math.min(...geometry.rects.map(r=>r.y)));
      const clip = {x,y,width:Math.ceil(Math.max(...geometry.rects.map(r=>r.x+r.width)))-x,height:Math.ceil(Math.max(...geometry.rects.map(r=>r.y+r.height)))-y};
      if (clip.width*clip.height > 1_000_000) return reject('paint-region-too-large');
      const screenshot = () => page.screenshot({type:'png',clip,scale:'css',animations:'allow',caret:'initial'});
      const before = await screenshot();
      // Save before mutating, so even an interrupted masking operation can be restored.
      const saved = await element.evaluateHandle(el => {
        const owners = new Set<HTMLElement>(), walker = document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
        for (let n=walker.nextNode();n;n=walker.nextNode()) if (n.textContent?.trim() && n.parentElement instanceof HTMLElement) owners.add(n.parentElement);
        return [...owners].map(owner=>({owner,value:owner.style.getPropertyValue('-webkit-text-fill-color'),priority:owner.style.getPropertyPriority('-webkit-text-fill-color'),hadStyle:owner.hasAttribute('style')}));
      });
      let masked: Buffer;
      try {
        const effective = await saved.evaluate(entries => {
          for (const {owner} of entries) owner.style.setProperty('-webkit-text-fill-color','transparent','important');
          return entries.every(({owner})=>getComputedStyle(owner).getPropertyValue('-webkit-text-fill-color') === 'rgba(0, 0, 0, 0)');
        });
        if (!effective) return reject('paint-mask-not-effective');
        masked = await screenshot();
      } finally {
        try {
          await saved.evaluate(entries => {
            for (const {owner,value,priority,hadStyle} of entries) {
              if (value) owner.style.setProperty('-webkit-text-fill-color',value,priority);
              else owner.style.removeProperty('-webkit-text-fill-color');
              if (!hadStyle && owner.getAttribute('style') === '') owner.removeAttribute('style');
            }
          });
        } finally { await saved.dispose(); }
      }
      const restored = await screenshot(), after = await element.evaluate(inspectText,expectedText);
      if (JSON.stringify(after) !== JSON.stringify(geometry)) return reject('text-state-changed');
      const paint = await page.evaluate(async ({images,clip,glyphs}) => {
        const decode = async (bytes:number[]) => {
          const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
          try {
            const canvas = new OffscreenCanvas(bitmap.width,bitmap.height), ctx = canvas.getContext('2d')!;
            ctx.drawImage(bitmap,0,0);
            return {width:bitmap.width,height:bitmap.height,data:ctx.getImageData(0,0,bitmap.width,bitmap.height).data};
          } finally { bitmap.close(); }
        };
        const [a,b,c] = await Promise.all(images.map(decode));
        if ([a,b,c].some(i=>i.width!==clip.width || i.height!==clip.height)) return {stable:false,changedPixels:0,glyphPixels:[],dimensions:false};
        let unstablePixels=0,changedPixels=0;
        const stride=a.width+1, prefix=new Uint32Array(stride*(a.height+1));
        for (let y=0;y<a.height;y++) for (let x=0;x<a.width;x++) {
          const i=4*(y*a.width+x);
          if ([0,1,2,3].some(k=>a.data[i+k]!==c.data[i+k])) unstablePixels++;
          const changed=Number([0,1,2].some(k=>a.data[i+k]!==b.data[i+k]));
          changedPixels+=changed;
          const p=(y+1)*stride+x+1;
          prefix[p]=changed+prefix[p-1]+prefix[p-stride]-prefix[p-stride-1];
        }
        const glyphPixels=glyphs.map(g=>g.rects.reduce((sum,r)=>{
          const x0=Math.max(0,Math.floor(r.x-clip.x)),y0=Math.max(0,Math.floor(r.y-clip.y));
          const x1=Math.min(a.width,Math.ceil(r.x+r.width-clip.x)),y1=Math.min(a.height,Math.ceil(r.y+r.height-clip.y));
          return sum+prefix[y1*stride+x1]-prefix[y0*stride+x1]-prefix[y1*stride+x0]+prefix[y0*stride+x0];
        },0));
        return {stable:unstablePixels===0,unstablePixels,changedPixels,glyphPixels,dimensions:true};
      },{images:[Array.from(before),Array.from(masked),Array.from(restored)],clip,glyphs:geometry.glyphs});
      const failures = [...geometry.failures];
      if (!paint.stable) failures.push('unstable-paint');
      if (!paint.dimensions || paint.glyphPixels.length !== geometry.glyphs.length || paint.glyphPixels.some(n=>n===0)) failures.push('no-glyph-paint');
      return {...geometry,ok:failures.length===0,failures,paint};
    } finally { probing.delete(page); }
  } finally { await element.dispose(); }
}
