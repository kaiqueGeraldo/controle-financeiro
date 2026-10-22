import { test, expect, type Page, type TestInfo } from '../../../controle-financeiro-frontend/node_modules/@playwright/test';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import '../../../controle-financeiro-frontend/src/screens/private/onboarding/e2e/onboarding.integrated.spec';

// Observers only: original journeys, assertions, timers and timeouts stay intact.
const timeline = new Map<string, unknown[]>();
test.beforeEach(async ({ page }, info) => {
  const entries: unknown[] = []; timeline.set(info.testId, entries);
  const started = performance.now();
  const mark = (event: string, data: object = {}) => entries.push({ ms: Math.round(performance.now() - started), event, ...data });
  page.on('request', r => { if (new URL(r.url()).pathname.startsWith('/api/')) mark('request', { method: r.method(), path: new URL(r.url()).pathname }); });
  page.on('response', r => { if (new URL(r.url()).pathname.startsWith('/api/')) mark('response', { method: r.request().method(), path: new URL(r.url()).pathname, status: r.status() }); });
  page.on('requestfailed', r => { if (new URL(r.url()).pathname.startsWith('/api/')) mark('requestfailed', { method: r.method(), path: new URL(r.url()).pathname, failure: r.failure()?.errorText }); });
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) mark('navigation', { path: new URL(frame.url()).pathname }); });
  await page.exposeFunction('cf031DiagnosticState', (data: object) => mark('dom', data));
  await page.addInitScript(() => {
    const report = () => {
      const body = document.body?.innerText ?? '';
      const next = JSON.stringify({ sessionLoading: body.includes('Carregando sua sessão'), interviewLoading: body.includes('Carregando entrevista'), sessionEnded: body.includes('Sua sessão terminou'), completed: body.includes('Entrevista concluída'), context: body.includes('Etapa 1 de 8: Contexto') });
      if (next !== previous) { previous = next; void (window as unknown as { cf031DiagnosticState: (data: object) => Promise<void> }).cf031DiagnosticState(JSON.parse(next)); }
    };
    let previous = '';
    document.addEventListener('DOMContentLoaded', () => { new MutationObserver(report).observe(document.body, { subtree: true, childList: true, characterData: true }); report(); });
  });
});
test.afterEach(async ({ page }, info) => {
  try {
    if (process.env.CF031_CHECK_REMEDIATION === '1' && info.status === 'passed' && info.title.startsWith('E01 complete profile:')) await checkRecoveryAndSession(page, info);
  } finally {
    const cookies = await page.context().cookies();
    await writeFile(path.join(process.env.CF031_EVIDENCE!, `${info.project.name}-${info.testId}-diagnostics.json`), JSON.stringify({ title: info.title, status: info.status, cookieNamesOnly: cookies.map(c => c.name), events: timeline.get(info.testId) }, null, 2));
    timeline.delete(info.testId);
  }
});

async function checkRecoveryAndSession(page: Page, info: TestInfo) {
  const out = process.env.CF031_EVIDENCE!;
  expect((await page.request.patch('/api/users/me/preferences', { data: { privacyMode: false } })).status()).toBe(200);
  const read = async () => { const r = await page.request.get('/api/onboarding'); expect(r.status()).toBe(200); return (await r.json()).data; };
  const original = await read(); const receipt = original.completedReceipt;
  expect(receipt.summary.metrics.freeAccountCash.value).toBe('950.00');
  let newCommands = 0;
  const count = (request: import('../../../controle-financeiro-frontend/node_modules/@playwright/test').Request) => { if (request.method() === 'POST' && /\/onboarding\/(complete|prepare)$/.test(new URL(request.url()).pathname)) newCommands++; };
  page.on('request', count);
  for (const fault of ['cash', 'reservation'] as const) {
    await page.route('**/api/onboarding', async route => {
      const response = await route.fetch(); expect(response.status()).toBe(200); const body = await response.json();
      if (fault === 'cash') body.data.completedReceipt.summary.metrics.freeAccountCash.value = body.data.completedReceipt.summary.metrics.freeAccountCash.knownSubtotal = '999999.00';
      else body.data.completedReceipt.summary.reservationChanges = [{ reservationId: '20000000-0000-4000-8000-000000000011', action: 'CLOSE', previous: { reservationId: '20000000-0000-4000-8000-000000000011', revision: '1', goal: null, nominal: { state: 'KNOWN', value: '0.00', knownSubtotal: '0.00', outsideIndividualRange: false, missingPaths: [] }, attribution: null }, proposed: null }];
      await route.fulfill({ response, json: body });
    });
    await page.reload();
    await expect(page.getByRole('alert').filter({ hasText: 'Resposta da entrevista inválida' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Entrevista concluída', exact: true })).toHaveCount(0);
    await expect(page.getByText('R$ 999.999,00', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: path.join(out, `${info.project.name}-${fault}-rejected.png`) });
    await page.unroute('**/api/onboarding');
    await page.getByRole('button', { name: 'Tentar carregar entrevista' }).click();
    await expect(page.getByRole('heading', { name: 'Entrevista concluída', exact: true })).toBeVisible();
    expect((await read()).completedReceipt).toEqual(receipt);
    await page.getByText('R$ 950,00', { exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByText('R$ 950,00', { exact: true })).toBeVisible();
  }
  expect(newCommands).toBe(0); page.off('request', count);
  // Replay is a real POST of the same immutable identity, not another application.
  const replay = await page.request.post('/api/onboarding/complete', { data: { contractVersion: 1, sessionId: receipt.sessionId, expectedVersion: receipt.draftVersion, operationId: receipt.operationId, contentHash: receipt.contentHash, reviewHash: receipt.reviewHash, confirm: true } });
  expect(replay.status()).toBe(200); expect((await replay.json()).data).toEqual(receipt);
  await page.reload(); await expect(page.getByRole('heading', { name: 'Entrevista concluída', exact: true })).toBeVisible();

  // T01 experiment: delay one catalog until loading is observed; release by event,
  // without sleep, retries, clock changes or altering the original assertions.
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  let seen!: () => void; const catalogRequested = new Promise<void>(resolve => { seen = resolve; });
  await page.route('**/api/categories', async route => { seen(); await gate; await route.continue(); });
  try {
    await page.reload(); await catalogRequested;
    await expect(page.getByRole('status').filter({ hasText: 'Carregando entrevista' })).toBeVisible();
  } finally { release(); }
  await expect(page.getByRole('heading', { name: 'Entrevista concluída', exact: true })).toBeVisible();
  await page.unroute('**/api/categories');
  // T02 experiment: isolate a failed profile transport, keeping the cookie and
  // persisted receipt unchanged. A successful read after restoring transport
  // distinguishes display/session state from loss of the onboarding record.
  await page.route('**/api/auth/user', route => route.abort('connectionrefused'));
  await page.reload(); await expect(page.getByText('Sua sessão terminou. O último rascunho salvo continua no servidor.', { exact: true })).toBeVisible();
  await expect(page.getByText('Não foi possível conectar à API. Tente novamente.', { exact: true })).toBeVisible();
  expect((await read()).completedReceipt).toEqual(receipt);
  await page.unroute('**/api/auth/user'); await page.reload();
  await expect(page.getByRole('heading', { name: 'Entrevista concluída', exact: true })).toBeVisible();
  expect((await read()).completedReceipt).toEqual(receipt);
  await page.getByText('R$ 950,00', { exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByText('R$ 950,00', { exact: true })).toBeVisible();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: path.join(out, `${info.project.name}-valid-recovered.png`) });
  await writeFile(path.join(out, `${info.project.name}-remediation.json`), JSON.stringify({ operationId: receipt.operationId, sessionId: receipt.sessionId, freeAccountCash: receipt.summary.metrics.freeAccountCash.value, faultsRejected: ['cash', 'reservation'], newFinancialCommandsDuringRecovery: newCommands, identicalReplayAccepted: true, reloadAccepted: true, loadingCatalogExperiment: 'loading until explicitly released; valid receipt after release', profileTransportExperiment: 'network failure shown; durable receipt unchanged; valid after transport restored', historicalTimeoutCause: 'INCONCLUSIVE; these controlled experiments reproduce states, not the original trigger' }, null, 2));
}
test.afterAll(async () => {
  if (process.env.CF031_RUN_ORIGINAL_PROBE !== '1') return;
  const probe = path.resolve('../tasks/evidencias/saneamento-CF-031-RC031/receipt-browser-probe.mjs');
  try {
    const result = await promisify(execFile)(process.execPath, [probe], { env: process.env });
    await writeFile(path.resolve('../tasks/evidencias/saneamento-CF-031-RC031/original-browser-before.log'), result.stdout + result.stderr);
  } catch (error) {
    await writeFile(path.resolve('../tasks/evidencias/saneamento-CF-031-RC031/original-browser-before.log'), String(error));
    throw error;
  }
});
