const path = require('node:path');
const fs = require('node:fs/promises');
const [frontend, evidence, namespace, instant] = process.argv.slice(2);
const { chromium, expect } = require(path.join(frontend, 'node_modules/@playwright/test'));
const baseURL = 'http://127.0.0.1:3112';

async function json(response) {
  expect(response.ok(), `HTTP ${response.status()} ${await response.text()}`).toBe(true);
  return response.json();
}

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
  const results = [];
  try {
    for (const [key, timezoneId] of [['sp', 'America/Sao_Paulo'], ['kir', 'Pacific/Kiritimati']]) {
      const context = await browser.newContext({ baseURL, timezoneId, locale: 'pt-BR', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      await context.tracing.start({ screenshots: true, snapshots: true });
      try {
        const page = await context.newPage(); await page.clock.setFixedTime(new Date(instant));
        await page.goto('/auth?modo=cadastro');
        await page.locator('input[name="nome"]').fill('Pessoa Sintética CF022');
        await page.locator('input[name="email"]').fill(`${namespace}-${key}@example.invalid`);
        await page.locator('input[name="senha"]').fill('Synthetic-Cf022-2026');
        await page.locator('input[name="confirmarSenha"]').fill('Synthetic-Cf022-2026');
        // Observe authentication before asserting navigation: cold dev compilation
        // consumed the previous assertion window while registration/login ran.
        const loggedIn = page.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/login' && r.request().method() === 'POST');
        await page.getByRole('button', { name: 'Criar Conta' }).click();
        expect((await loggedIn).status()).toBe(200);
        await expect(page).toHaveURL(/\/$/);
        for (const frequency of ['DAILY', 'WEEKLY_GOAL']) {
          // The current modal offers a numeric goal to one habit at a time.
          // Shared-goal concurrency is covered at the service/PostgreSQL layer.
          const goal = await json(await page.request.post('/api/goals', { data: {
            title: `${namespace}-${key}-${frequency}-meta`, type: 'NUMERIC', targetValue: 100, deadline: '2028-01-04', color: 'BLUE', useChecklist: false
          } }));
          const name = `${namespace}-${key}-${frequency}`;
          await page.goto('/habitos');
          await page.getByRole('button', { name: 'Novo Hábito' }).click();
          const modal = page.getByRole('dialog', { name: 'Novo Hábito', exact: true });
          await modal.getByPlaceholder('Ex: Beber 3L de Água').fill(name);
          if (frequency === 'WEEKLY_GOAL') {
            await modal.getByRole('button', { name: 'Meta na Semana' }).click();
            await modal.getByPlaceholder('Ex: 4').fill('2');
          }
          await modal.locator('select').selectOption(goal.id);
          const createResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/api/habits' && r.request().method() === 'POST');
          await modal.getByRole('button', { name: 'Criar Hábito' }).click();
          const created = await json(await createResponse); expect(created.frequency).toBe(frequency);
          if (frequency === 'WEEKLY_GOAL') expect(created.weeklyGoal).toBe(2);
          const card = page.getByRole('button', { name: `Ver detalhes do hábito ${name}` });
          const markResponse = page.waitForResponse(r => new URL(r.url()).pathname.endsWith(`/habits/${created.id}/toggle`));
          const [, marked] = await Promise.all([
            card.getByRole('button', { name: frequency === 'DAILY' ? 'Marcar Feito' : 'Avançar Progresso' }).click(),
            markResponse,
          ]);
          expect(marked.status()).toBe(200); expect(marked.request().postDataJSON()).toEqual({ date: '2027-01-04' });
          await page.reload(); await expect(card.getByRole('button', { name: 'Feito Hoje' })).toBeVisible();
          let habits = await json(await page.request.get('/api/habits'));
          expect(habits.find(h => h.id === created.id).currentStreak).toBe(frequency === 'DAILY' ? 1 : 0);
          let goals = await json(await page.request.get('/api/goals')); expect(goals.find(g => g.id === goal.id).currentValue).toBe(1);
          await page.screenshot({ path: path.join(evidence, `${key}-${frequency}-marked.png`), fullPage: true });
          const undoResponse = page.waitForResponse(r => new URL(r.url()).pathname.endsWith(`/habits/${created.id}/toggle`));
          const [, undone] = await Promise.all([card.getByRole('button', { name: 'Feito Hoje' }).click(), undoResponse]);
          expect(undone.status()).toBe(200);
          await page.reload(); await expect(card.getByRole('button', { name: frequency === 'DAILY' ? 'Marcar Feito' : 'Avançar Progresso' })).toBeVisible();
          habits = await json(await page.request.get('/api/habits'));
          const habit = habits.find(h => h.id === created.id);
          expect(habit.logs).toHaveLength(1); expect(habit.logs[0]).toMatchObject({ date: '2027-01-04', status: 'PENDING' });
          expect(habit.currentStreak).toBe(0); expect(habit.highestStreak).toBe(0);
          goals = await json(await page.request.get('/api/goals')); expect(goals.find(g => g.id === goal.id).currentValue).toBe(0);
          results.push({ timezoneId, frequency, clickedDay: '2027-01-04', progressAfterCheck: 1, progressAfterUndo: 0 });
          console.log(`PASS ${key} ${frequency}: UI/BFF/Spring/PostgreSQL/reload, day=2027-01-04, progress 0→1→0`);
        }
      } catch (error) {
        const pages = context.pages();
        if (pages.length) {
          await pages[0].screenshot({ path: path.join(evidence, `${key}-failure.png`), fullPage: true });
          await fs.writeFile(path.join(evidence, `${key}-failure.txt`), await pages[0].locator('body').ariaSnapshot());
        }
        await context.tracing.stop({ path: path.join(evidence, `${key}-trace.zip`) });
        throw error;
      } finally { await context.close(); }
    }
    await fs.writeFile(path.join(evidence, 'results.json'), JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
