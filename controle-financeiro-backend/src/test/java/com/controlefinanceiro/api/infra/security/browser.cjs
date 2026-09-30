const path = require('node:path');
const fs = require('node:fs/promises');
const [frontend, evidence, namespace, instant] = process.argv.slice(2);
const { chromium, expect } = require(path.join(frontend, 'node_modules/@playwright/test'));
const baseURL = 'http://127.0.0.1:3113';
const password = 'Synthetic-Cf023-2026';
async function body(response) { expect(response.ok(), `HTTP${response.status()}`).toBe(true); return response.json(); }
(async () => {
  const deadline = Date.now() + 120000;
  let ready = false;
  while (Date.now() < deadline) {
    try { ready = (await fetch(`${baseURL}/auth`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  expect(ready).toBe(true);
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL, timezoneId: 'America/Sao_Paulo', locale: 'pt-BR', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage(); await page.clock.setFixedTime(new Date(instant));
  async function authenticate(owner, registration) {
    await page.goto(registration ? '/auth?modo=cadastro' : '/auth?modo=login');
    if (registration) await page.locator('input[name="nome"]').fill(`CF023 ${owner}`);
    await page.locator('input[name="email"]').fill(`${namespace}-${owner}@example.invalid`);
    await page.locator('input[name="senha"]').fill(password);
    if (registration) await page.locator('input[name="confirmarSenha"]').fill(password);
    await page.getByRole('button', { name: registration ? 'Criar Conta' : 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  }
  async function logout() {
    await page.getByRole('button', { name: 'Sair da Conta', exact: true }).click();
    await page.getByRole('dialog', { name: 'Sair da Conta' }).getByRole('button', { name: 'Sair', exact: true }).click();
    await expect(page).toHaveURL(/\/auth/);
    expect((await context.cookies()).filter(c => c.name === 'token')).toHaveLength(0);
    expect((await page.request.get('/api/accounts')).status()).toBe(401);
  }
  try {
    await authenticate('A', true);
    const accountA = await body(await page.request.post('/api/accounts', { data: { name: `${namespace}-ACCOUNT-A`, type: 'CHECKING', initialBalance: 1000, openingDate: '2026-09-01' } }));
    await page.goto('/contas'); await expect(page.getByText(`${namespace}-ACCOUNT-A`, { exact: true })).toBeVisible();
    const otherTab = await context.newPage(); await otherTab.clock.setFixedTime(new Date(instant));
    await otherTab.goto('/contas'); await expect(otherTab.getByText(`${namespace}-ACCOUNT-A`, { exact: true })).toBeVisible();
    await logout();
    await expect(otherTab.getByText(`${namespace}-ACCOUNT-A`, { exact: true })).toHaveCount(0);
    await authenticate('B', true);
    await body(await page.request.post('/api/accounts', { data: { name: `${namespace}-ACCOUNT-B`, type: 'CHECKING', initialBalance: 2300, openingDate: '2026-09-01' } }));
    await page.goto('/contas'); await page.reload();
    await expect(page.getByText(`${namespace}-ACCOUNT-B`, { exact: true })).toBeVisible();
    await expect(page.getByText(`${namespace}-ACCOUNT-A`, { exact: true })).toHaveCount(0);
    const positionB = await body(await page.request.get('/api/accounts/position')); expect(positionB.totalBalance).toBe('2300.00');
    const forbidden = await page.request.put(`/api/accounts/${accountA.id}`, { data: { name: 'changed', type: 'CHECKING' } }); expect(forbidden.status()).toBe(404);
    expect((await page.request.get('/api/auth/user')).status()).toBe(200);
    await page.screenshot({ path: path.join(evidence, 'owner-b.png'), fullPage: true });
    await otherTab.reload(); await expect(otherTab.getByText(`${namespace}-ACCOUNT-B`, { exact: true })).toBeVisible();
    await expect(otherTab.getByText(`${namespace}-ACCOUNT-A`, { exact: true })).toHaveCount(0);
    await logout(); await authenticate('A', false); await page.goto('/contas'); await page.reload();
    await expect(page.getByText(`${namespace}-ACCOUNT-A`, { exact: true })).toBeVisible();
    await expect(page.getByText(`${namespace}-ACCOUNT-B`, { exact: true })).toHaveCount(0);
    const positionA = await body(await page.request.get('/api/accounts/position')); expect(positionA.totalBalance).toBe('1000.00');
    await page.screenshot({ path: path.join(evidence, 'owner-a-restored.png'), fullPage: true });
    await fs.writeFile(path.join(evidence, 'results.json'), JSON.stringify({ flow: 'A/logout/B/reload/404/logout/A/reload', positionA: '1000.00', positionB: '2300.00', otherTabCleared: true, fixtureNamespace: namespace }, null, 2));
    console.log('PASS UI→BFF→Spring→PostgreSQL: A/logout/B/reload/404/logout/A/reload, cross-tab cleared, positions 1000/2300');
  } finally { await context.close(); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
