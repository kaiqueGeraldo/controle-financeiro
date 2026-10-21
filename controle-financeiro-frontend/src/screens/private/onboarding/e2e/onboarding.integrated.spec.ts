import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { registerSyntheticUser, syntheticUser } from "../../../../../tests/e2e/support/synthetic-auth";

const evidence = process.env.CF031_EVIDENCE!;
async function register(page: Page, info: TestInfo, scenario: string) {
  // Fix only the civil calendar; native animation clocks remain coherent.
  await page.clock.setFixedTime(new Date("2026-10-21T15:00:00Z"));
  const person = syntheticUser("A", `${process.env.CF_E2E_NAMESPACE}-${info.project.name}-${scenario}`);
  await registerSyntheticUser(page, person);
  await writeFile(path.join(evidence, `${info.project.name}-${scenario}-environment.json`), JSON.stringify({ browser: page.context().browser()?.version(), node: process.version, platform: process.platform, viewport: page.viewportSize(), timezone: await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone), calendarFixed: "2026-10-21T15:00:00Z", clockMode: "Date-only", nativeZoom200Certified: false }));
  return person;
}
async function view(page: Page) { const r = await page.request.get("/api/onboarding"); expect(r.status()).toBe(200); return (await r.json()).data; }
async function screenshot(page: Page, info: TestInfo, name: string) {
  await expect(page.getByRole("heading", { name: "Organize seu ponto de partida" })).toBeVisible();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && Array.from(document.querySelectorAll("main")).every(main => main.scrollWidth <= main.clientWidth))).toBe(true);
  await page.screenshot({ path: path.join(evidence, `${info.project.name}-${name}.png`), fullPage: true });
}
test("empty profile: keyboard, save/reload and lost confirmation recover a single effect", async ({ page }, info) => {
  const person = await register(page, info, "empty"); await page.getByRole("link", { name: "Abrir configuração inicial" }).click();
  await expect(page.getByRole("heading", { name: "Etapa 1 de 8: Contexto" })).toBeVisible();
  await page.getByLabel("Data-base das aberturas").fill("2026-10-21"); await page.getByLabel("Nome preferido (opcional)").fill("Perfil sem novas posições");
  await page.getByLabel("Confirmo que os saldos não incluem movimentos que registrarei novamente").check(); await page.getByLabel("Confirmo que o caixa da corretora não inclui o valor dos ativos aplicados").check();
  await screenshot(page, info, "context-dark");
  await page.getByRole("button", { name: "Salvar e continuar" }).focus(); await page.keyboard.press("Enter");
  for (const name of ["contas", "cartões e dívidas", "investimentos", "metas", "reservas vinculadas", "previsões opcionais"]) {
    const select = page.getByRole("combobox", { name: `Resposta para ${name}` }); await expect(select).toBeVisible(); await select.selectOption("NONE");
    await page.getByRole("button", { name: "Salvar e continuar" }).focus(); await page.keyboard.press("Enter");
  }
  await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  const before = await view(page); expect(before.payload.currentStep).toBe("REVIEW"); expect(before.status).toBe("IN_PROGRESS");
  const accountsBefore = await (await page.request.get("/api/accounts")).json(); expect(accountsBefore).toHaveLength(1); expect(accountsBefore[0].balance).toBe(0);
  await page.reload(); await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  await page.getByRole("button", { name: "Preparar revisão financeira" }).click(); await expect(page.getByRole("button", { name: "Confirmar informações e registrar posições" })).toBeVisible();
  const pending = await view(page); const operationId = pending.pendingIntent.operationId;
  // Fault injection forwards the real request and loses only the response after commit.
  let completeCalls = 0;
  let lost!: () => void; const lostResponse = new Promise<void>(resolve => { lost = resolve; });
  await page.route("**/api/onboarding/complete", async route => { completeCalls++; const response = await route.fetch(); expect(response.status()).toBe(200); await route.abort("failed"); lost(); });
  await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).click(); await expect(page.getByRole("heading", { name: "Confirmação pendente de verificação" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toHaveCount(0);
  await lostResponse; await expect(page.getByRole("button", { name: "Consultar resultado" })).toBeEnabled(); await page.unroute("**/api/onboarding/complete"); await page.getByRole("button", { name: "Consultar resultado" }).click();
  await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  const completed = await view(page); expect(completed.completedReceipt.operationId).toBe(operationId); expect(completed.completedReceipt.summary.metrics.netWorth.value).toBe("0.00"); expect(completeCalls).toBe(1);
  await page.reload(); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible(); await screenshot(page, info, "empty-completed");
  await writeFile(path.join(evidence, `${info.project.name}-empty-checkpoint.json`), JSON.stringify({ scenario: "empty", email: person.email, sessionId: completed.sessionId, operationId, completeCalls, expectedAccounts: "0.00" }));
});
test("E01 complete profile: persisted answers, real review, keyboard confirmation and receipt", async ({ page }, info) => {
  const person = await register(page, info, "full");
  const example = JSON.parse(await readFile(path.resolve("../tasks/evidencias/CF-028/examples.json"), "utf8"));
  const accounts = await (await page.request.get("/api/accounts")).json(); expect(accounts).toHaveLength(1); const categories = await (await page.request.get("/api/categories?type=INCOME")).json(); expect(categories.length).toBeGreaterThan(0);
  const serialized = JSON.stringify(example.draft).replaceAll("00000000-0000-4000-8000-000000000901", accounts[0].id).replaceAll("00000000-0000-4000-8000-000000000902", categories[0].id);
  const r = await page.request.put("/api/onboarding/draft", { data: JSON.parse(serialized) }); expect(r.status()).toBe(200);
  await page.goto("/onboarding"); await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  const labels = ["2. Contas", "3. Cartões e dívidas", "4. Investimentos", "5. Metas", "6. Reservas", "7. Previsões"];
  for (const [i, label] of labels.entries()) {
    await page.getByRole("button", { name: label, exact: true }).click(); await expect(page.getByRole("heading", { name: new RegExp(`Etapa ${i + 2} de 8:`) })).toBeVisible();
    await page.evaluate(light => document.documentElement.classList.toggle("dark", !light), i % 2 === 0);
    await screenshot(page, info, `full-step-${i + 2}`);
  }
  await page.getByRole("button", { name: "8. Revisão" }).click();
  await page.getByRole("button", { name: "Preparar revisão financeira" }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Confira antes de registrar" })).toBeVisible();
  const pending = await view(page); const summary = pending.pendingIntent.summary;
  expect(summary.metrics.netWorth.value).toBe("1451.00"); expect(summary.metrics.accountsSigned.value).toBe("1300.00"); expect(summary.metrics.investmentsValue.value).toBe("501.00"); expect(summary.metrics.cardDebt.value).toBe("350.00"); expect(summary.byCard[0].availableLimit.value).toBe("656.00");
  expect(await (await page.request.get("/api/accounts")).json()).toHaveLength(1);
  for (const light of [true, false]) { await page.evaluate(light => document.documentElement.classList.toggle("dark", !light), light); await screenshot(page, info, `full-review-${light ? "light" : "dark"}`); }
  await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).scrollIntoViewIfNeeded(); await expect(page.getByRole("button", { name: "Confirmar informações e registrar posições" })).toBeInViewport(); await screenshot(page, info, "full-review-actions");
  await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).focus(); await page.keyboard.press("Enter"); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  const completed = await view(page); expect(completed.completedReceipt.summary).toEqual(summary); expect(completed.completedReceipt.mapping).toHaveLength(16);
  const financialAccounts = await (await page.request.get("/api/accounts")).json(); expect(financialAccounts).toHaveLength(3); expect(financialAccounts.map((a: { balance: number }) => a.balance).sort((a: number, b: number) => a - b)).toEqual([100, 200, 1000]);
  await page.reload(); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  const privacy = await page.request.patch("/api/users/me/preferences", { data: { privacyMode: true } }); expect(privacy.status()).toBe(200); await page.reload(); await expect(page.getByText("Valor oculto").first()).toBeVisible();
  expect(await page.getByText("R$ 1.451,00", { exact: true }).isVisible()).toBe(false); await screenshot(page, info, "full-private-completed");
  await writeFile(path.join(evidence, `${info.project.name}-full-checkpoint.json`), JSON.stringify({ scenario: "full", email: person.email, sessionId: completed.sessionId, operationId: completed.completedReceipt.operationId, expectedAccounts: "1300.00", expectedNetWorth: "1451.00" }));
});
test("partial draft: real stale version, explicit comparison, pause/resume and discard have no financial effects", async ({ page }, info) => {
  const person = await register(page, info, "draft"); await page.goto("/onboarding"); await expect(page.getByRole("heading", { name: "Etapa 1 de 8: Contexto" })).toBeVisible();
  await page.getByLabel("Nome preferido (opcional)").fill("Primeiro salvamento"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await expect(page.getByRole("status").filter({ hasText: "Últimas respostas confirmadas" })).toBeVisible();
  const previous = await view(page); const remotePayload = structuredClone(previous.payload); remotePayload.context.preferredName = "Resposta de outra aba";
  expect((await page.request.put("/api/onboarding/draft", { data: { contractVersion: 1, action: "SAVE", expectedVersion: previous.version, payload: remotePayload } })).status()).toBe(200);
  await page.getByLabel("Nome preferido (opcional)").fill("Resposta local preservada"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await expect(page.getByText("Salvamento pendente de verificação", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Verificar salvamento" }).click(); const compare = page.getByRole("region", { name: "Comparar rascunhos" }); await expect(compare).toBeVisible(); await expect(compare.getByText("Nome preferido: Resposta local preservada")).toBeVisible(); await expect(compare.getByText("Nome preferido: Resposta de outra aba")).toBeVisible();
  await page.getByRole("button", { name: "Salvar minhas respostas como nova versão" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(compare).toHaveCount(0);
  await page.getByRole("button", { name: "Salvar e pausar" }).click(); await expect(page).toHaveURL(/\/$/); await page.goto("/onboarding"); await expect(page.getByRole("button", { name: "Retomar entrevista" })).toBeVisible(); await page.getByRole("button", { name: "Retomar entrevista" }).click(); await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("Resposta local preservada");
  // A real committed save whose response becomes 503 is reconciled by GET, not another PUT.
  let lostSave!: () => void; const saveCommitted = new Promise<void>(resolve => { lostSave = resolve; });
  let puts = 0;
  await page.route("**/api/onboarding/draft", async route => { puts++; const response = await route.fetch(); expect(response.status()).toBe(200); await route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"Resposta sintética indisponível após save real"}' }); lostSave(); });
  await page.getByLabel("Nome preferido (opcional)").fill("Salvo mesmo com resposta perdida"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await saveCommitted;
  await expect(page.getByRole("button", { name: "Verificar salvamento" })).toBeEnabled(); await page.unroute("**/api/onboarding/draft");
  await page.getByRole("button", { name: "Verificar salvamento" }).click(); await expect(page.getByText("Salvamento confirmado pela releitura do servidor.", { exact: true })).toBeVisible(); expect(puts).toBe(1);
  // Expire the browser credentials; recover the durable draft after logging in again.
  await page.context().clearCookies(); await page.getByRole("button", { name: "Consultar rascunho do servidor" }).click(); await expect(page.getByRole("link", { name: "Entrar para retomar" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Ir para o Login", exact: true }).click(); await page.locator('input[name="email"]').fill(person.email); await page.locator('input[name="senha"]').fill(person.password); await page.getByRole("button", { name: "Entrar", exact: true }).click(); await expect(page).toHaveURL(/\/$/);
  await page.goto("/onboarding"); await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("Salvo mesmo com resposta perdida");
  await page.getByRole("button", { name: "Descartar respostas" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(page.getByText("Respostas descartadas no servidor. Nenhum saldo foi alterado.")).toBeVisible();
  const discarded = await view(page); expect(discarded.payload).toBeNull(); expect(discarded.status).toBe("SKIPPED"); expect(discarded.completedReceipt).toBeNull();
  await screenshot(page, info, "draft-discarded"); await writeFile(path.join(evidence, `${info.project.name}-draft-checkpoint.json`), JSON.stringify({ scenario: "draft", email: person.email, sessionId: discarded.sessionId, operationId: null, expectedAccounts: "0.00" }));
});
test("large, negative and unknown values keep knowledge separate from totals on each viewport", async ({ page }, info) => {
  const person = await register(page, info, "visual");
  const context = { currency: "BRL", baseDate: "2026-10-21", boundaryAcknowledged: true, cashOnlyAcknowledged: true };
  const account = (name: string, balance: string) => ({ tempId: crypto.randomUUID(), action: "CREATE", name, type: "CHECKING", balance: { state: "KNOWN", value: balance }, deficitAcknowledged: balance.startsWith("-"), distinctCashConfirmed: false });
  const payload = { context, currentStep: "REVIEW", sections: {
    accounts: { answer: "PROVIDED", items: [account("Fonte máxima A com nome extenso para conferir quebra de linha e alcance dos controles", "999999999999.99"), account("Fonte máxima B", "999999999999.99"), account("Conta com saldo negativo real", "-0.01")] },
    investments: { answer: "PROVIDED", items: [{ tempId: crypto.randomUUID(), action: "CREATE", name: "Posição sem avaliação disponível", type: "FIXED_INCOME", positionMode: "MONETARY", quantity: { state: "NOT_APPLICABLE" }, cost: { state: "UNKNOWN" }, valuation: { state: "UNKNOWN" }, acquisitionDate: { state: "UNKNOWN" }, historicalSource: { state: "UNKNOWN" } }] },
    cards: { answer: "NONE", items: [] }, goals: { answer: "NONE", items: [] }, allocations: { answer: "NONE", items: [] }, forecasts: { answer: "DEFERRED", items: [] },
  } };
  expect((await page.request.put("/api/onboarding/draft", { data: { contractVersion: 1, expectedVersion: "0", action: "SAVE", payload } })).status()).toBe(200);
  await page.goto("/onboarding"); await page.getByRole("button", { name: "Preparar revisão financeira" }).click(); await expect(page.getByRole("heading", { name: "Confira antes de registrar" })).toBeVisible();
  const state = await view(page); const m = state.pendingIntent.summary.metrics;
  expect(m.accountsSigned).toMatchObject({ state: "KNOWN", value: "1999999999999.97", outsideIndividualRange: true }); expect(m.investmentsValue).toMatchObject({ state: "UNKNOWN", value: null, knownSubtotal: null }); expect(m.netWorth).toMatchObject({ state: "PARTIAL", value: null, knownSubtotal: "1999999999999.97" });
  await expect(page.getByText("Subtotal conhecido R$ 1.999.999.999.999,97; total indisponível", { exact: false })).toBeVisible();
  await page.getByText("Subtotal conhecido R$ 1.999.999.999.999,97; total indisponível", { exact: false }).scrollIntoViewIfNeeded();
  await screenshot(page, info, "large-partial-review");
  await page.getByRole("heading", { name: "Conta com saldo negativo real" }).scrollIntoViewIfNeeded(); await expect(page.getByText("R$ -0,01", { exact: true }).first()).toBeVisible(); await screenshot(page, info, "negative-and-unknown-source");
  await page.getByRole("heading", { name: "Posição sem avaliação disponível" }).scrollIntoViewIfNeeded(); await screenshot(page, info, "unknown-source");
  await page.getByRole("button", { name: "Cancelar revisão para corrigir" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(page.getByRole("button", { name: "Preparar revisão financeira" })).toBeEnabled();
  const uncommitted = await view(page); expect(uncommitted.pendingIntent).toBeNull(); expect(uncommitted.completedReceipt).toBeNull();
  await writeFile(path.join(evidence, `${info.project.name}-visual-checkpoint.json`), JSON.stringify({ scenario: "visual", email: person.email, sessionId: uncommitted.sessionId, operationId: null, expectedAccounts: "0.00" }));
});
