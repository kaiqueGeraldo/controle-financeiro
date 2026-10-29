import type {Locator} from '@playwright/test';

/** Geometry of the exact text, including display:contents, clipping and occlusion.
 * This observes text painting; it does not assert focus or actionability. */
export async function textGeometry(locator: Locator, expectedText: string) {
  return locator.evaluate((element, expected) => {
    const failures: string[] = [];
    if (!element.isConnected) failures.push('disconnected');
    if (element.textContent?.trim() !== expected) failures.push('identity');
    const ancestors: Element[] = [];
    for (let current: Element | null = element; current; current = current.parentElement) {
      ancestors.push(current);
      const style = getComputedStyle(current);
      if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) < 0.99 || style.contentVisibility === 'hidden') failures.push('not-painted');
    }
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const rects: Array<{x:number,y:number,width:number,height:number}> = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      const boxes = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
      if (!boxes.length) failures.push('no-text-box');
      for (const r of boxes) {
        rects.push({x:r.x,y:r.y,width:r.width,height:r.height});
        if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) failures.push('outside-viewport');
        for (const parent of ancestors) {
          const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
          if (/^(hidden|clip|auto|scroll)$/.test(style.overflowX) && (r.left < box.left + parent.clientLeft || r.right > box.left + parent.clientLeft + parent.clientWidth)) failures.push('clipped-x');
          if (/^(hidden|clip|auto|scroll)$/.test(style.overflowY) && (r.top < box.top + parent.clientTop || r.bottom > box.top + parent.clientTop + parent.clientHeight)) failures.push('clipped-y');
        }
        // A display:contents text node is hit-tested on its first box-owning parent.
        let paintOwner: Element = element;
        while (getComputedStyle(paintOwner).display === 'contents' && paintOwner.parentElement) paintOwner = paintOwner.parentElement;
        for (const fraction of [0.1,0.5,0.9]) {
          const hit = document.elementFromPoint(r.left+r.width*fraction,r.top+r.height/2);
          if (!hit || !(element.contains(hit) || hit === paintOwner)) failures.push('occluded');
        }
      }
    }
    if (!rects.length) failures.push('no-text-box');
    return {ok: failures.length === 0, failures:[...new Set(failures)], text:element.textContent, rects, viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio}};
  },expectedText);
}
