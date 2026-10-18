const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(path.resolve(__dirname, '../../../../../../../../../controle-financeiro-frontend/node_modules/@playwright/test'));
const { setCivilDateOnly } = require(process.env.CF022_CLOCK_HELPER || './civil-date-clock.cjs');

test('habit calendar survives navigation/reload without replacing native animation clocks or leaking contexts', async () => {
  const server = http.createServer((req, res) => res.end('<!doctype html><button>Paint and click</button>'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch();
  const date = new Date('2027-01-05T02:59:59Z');
  try {
    for (const timezoneId of ['America/Sao_Paulo', 'Pacific/Kiritimati']) {
      const context = await browser.newContext({ timezoneId, reducedMotion: 'no-preference' });
      try {
        const page = await context.newPage();
        await setCivilDateOnly(page, date);
        for (let n = 0; n < 4; n++) {
          if (n === 2) await page.reload();
          else await page.goto(`http://127.0.0.1:${server.address().port}/?n=${n}`);
          const observed = await page.evaluate(async () => {
            for (let frame = 0; frame < 8; frame++) await new Promise(requestAnimationFrame);
            const button = document.querySelector('button');
            const animation = button.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'both' });
            animation.startTime = performance.now();
            await new Promise(requestAnimationFrame);
            const result = {
              now: Date.now(), iso: new Date().toISOString(), called: Date(),
              explicit: new Date('2000-01-01T00:00:00Z').toISOString(),
              day: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()),
              native: [performance.now, setTimeout, setInterval, requestAnimationFrame].map(fn => fn.toString().includes('[native code]')),
              current: animation.currentTime,
            };
            animation.cancel();
            button.addEventListener('click', () => { button.textContent = 'Clicked'; });
            return result;
          });
          console.log(JSON.stringify({ timezoneId, navigation: n, ...observed }));
          assert.equal(observed.now, date.getTime());
          assert.equal(observed.iso, '2027-01-05T02:59:59.000Z');
          assert.equal(observed.explicit, '2000-01-01T00:00:00.000Z');
          assert.equal(observed.day, '2027-01-04');
          assert.ok(observed.native.every(Boolean), 'Timers/performance/rAF must stay native');
          assert.ok(observed.current >= 0, 'Animation must not start in a different time origin');
          await page.getByRole('button', { name: 'Paint and click' }).click();
          assert.equal(await page.getByRole('button').textContent(), 'Clicked');
        }
      } finally { await context.close(); }
    }
    const clean = await browser.newContext();
    try {
      const page = await clean.newPage();
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      assert.equal(await page.evaluate(() => Date.toString().includes('[native code]')), true);
    } finally { await clean.close(); }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
