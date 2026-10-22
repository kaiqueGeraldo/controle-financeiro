import { chromium } from '../../../controle-financeiro-frontend/node_modules/playwright-core/index.mjs';
import { readFile, writeFile } from 'node:fs/promises';
const out = new URL('./', import.meta.url);
const checkpoint = JSON.parse(await readFile(new URL('e2e/mobile-360-SP-full-checkpoint.json', out), 'utf8'));
const browser = await chromium.launch({headless:true});
try {
 const page = await browser.newPage({viewport:{width:360,height:800},timezoneId:'America/Sao_Paulo'});
 await page.goto('http://127.0.0.1:3111/auth');
 await page.locator('input[name="email"]').fill(checkpoint.email);
 await page.locator('input[name="senha"]').fill('Cf003-A-Senha-2026');
 await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await page.waitForURL('http://127.0.0.1:3111/');
 const original = await page.request.get('http://127.0.0.1:3111/api/onboarding');
 if (original.status() !== 200) throw Error('Real GET failed');
 const body = await original.json();
 if (body.data.status !== 'COMPLETED' || body.data.completedReceipt.summary.metrics.freeAccountCash.value !== '950.00') throw Error('Independent E01 precondition failed');
 await page.route('**/api/onboarding', async route => {
   const response = await route.fetch(); const altered = await response.json();
   altered.data.completedReceipt.summary.metrics.freeAccountCash.value = '999999.00';
   altered.data.completedReceipt.summary.metrics.freeAccountCash.knownSubtotal = '999999.00';
   await route.fulfill({response,json:altered});
 });
 await page.goto('http://127.0.0.1:3111/onboarding');
 await page.getByRole('heading',{name:'Entrevista concluída',exact:true}).waitFor({state:'visible'});
 const wrong = page.getByText('R$ 999.999,00',{exact:true}); await wrong.waitFor({state:'visible'}); await wrong.scrollIntoViewIfNeeded();
 await page.screenshot({path:new URL('RC031-01-browser.png',out).pathname.replace(/^\/(\w:)/,'$1')});
 const after = await (await page.request.get('http://127.0.0.1:3111/api/onboarding')).json();
 await writeFile(new URL('RC031-01-browser.json',out),JSON.stringify({browser:browser.version(),viewport:page.viewportSize(),injection:'Only GET response changed after real commit; no financial write',sessionId:checkpoint.sessionId,expectedFree:'950.00',actualDisplayed:'999999.00',completedHeadingVisible:true,serverFreeAfter:after.data.completedReceipt.summary.metrics.freeAccountCash.value,expected:'Reject inconsistent receipt; do not render confirmed summary',verdict:'CONFIRMED_DEFECT'},null,2));
} finally {await browser.close();}
