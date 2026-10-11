import { expect, type Page } from '@playwright/test';

// Framer Motion uses rAF/inline styles, which screenshot animations:'disabled'
// does not settle. Observe the actual rendered geometry; never alter the DOM.
export async function settleVisual(page: Page) {
  let previous = '';
  let stableSamples = 0;
  await expect.poll(async () => {
    const current = await page.evaluate(() => JSON.stringify(
      Array.from(document.querySelectorAll('[style], [role="dialog"], form')).map(el => {
        const r = el.getBoundingClientRect();
        return [el.getAttribute('style'), r.x, r.y, r.width, r.height];
      }),
    ));
    stableSamples = current === previous ? stableSamples + 1 : 0;
    previous = current;
    return stableSamples;
  }, { intervals: [100] }).toBeGreaterThanOrEqual(3);
}
