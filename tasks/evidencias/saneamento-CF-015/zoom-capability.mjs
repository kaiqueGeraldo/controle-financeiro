import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(directory, '../../../controle-financeiro-frontend/package.json'));
process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.setContent('<button>Teste sintético de capacidade de zoom</button>');
  const metrics = () => page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio, scale: visualViewport.scale }));
  const before = await metrics();
  await page.keyboard.press('Control+Equal');
  await page.keyboard.press('Control+Equal');
  await page.keyboard.press('Control+Equal');
  const after = await metrics();
  const report = { browser: browser.version(), headless: true, action: 'Control+Equal x3', before, after, applied: before.width !== after.width || before.dpr !== after.dpr, limitation: 'Teste de capacidade do harness, não verificação de produto a 200%. Viewport estreito e pageScaleFactor não substituem zoom nativo.' };
  fs.writeFileSync(path.join(directory, 'zoom-capability.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
