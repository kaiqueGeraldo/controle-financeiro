# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.integrated.spec.ts >> partial draft: real stale version, explicit comparison, pause/resume and discard have no financial effects
- Location: src\screens\private\onboarding\e2e\onboarding.integrated.spec.ts:80:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Etapa 1 de 8: Contexto' })
Expected: visible
Timeout: 12000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Etapa 1 de 8: Contexto' }) with timeout 12000ms
  - waiting for getByRole('heading', { name: 'Etapa 1 de 8: Contexto' })

```

```yaml
- complementary "Navegação principal":
  - text: P
  - heading "Pessoa Sintética A" [level=2]
  - text: cf003-a-cf031-d92a269c-desktop-1440-kiritimati-draft@example.invalid
  - navigation:
    - link "Dashboard":
      - /url: /
    - link "Minhas Contas":
      - /url: /contas
    - link "Configuração inicial":
      - /url: /onboarding
    - link "Extrato":
      - /url: /extrato
    - link "Cartões de Crédito":
      - /url: /cartoes
    - link "Planejamento":
      - /url: /planejamento
    - link "Metas":
      - /url: /metas
    - link "Investimentos":
      - /url: /investimentos
    - link "Resumo Anual":
      - /url: /resumo-anual
    - link "Hábitos":
      - /url: /habitos
  - button "Privacidade"
  - button "Configurações"
  - button "Sair da Conta"
- main:
  - paragraph: Configuração inicial voluntária
  - heading "Organize seu ponto de partida" [level=1]
  - paragraph: Registre o que já existe na data-base. Salvar respostas não altera saldos; somente a confirmação final registra as posições.
  - button "Ir ao dashboard" [disabled]
  - status: Carregando entrevista e cadastros existentes…
- alert
```

# Test source

```ts
  1   | import { test, expect, type Page, type TestInfo } from "@playwright/test";
  2   | import { readFile, writeFile } from "node:fs/promises";
  3   | import path from "node:path";
  4   | import { registerSyntheticUser, syntheticUser } from "../../../../../tests/e2e/support/synthetic-auth";
  5   | 
  6   | const evidence = process.env.CF031_EVIDENCE!;
  7   | async function register(page: Page, info: TestInfo, scenario: string) {
  8   |   // Fix only the civil calendar; native animation clocks remain coherent.
  9   |   await page.clock.setFixedTime(new Date("2026-10-21T15:00:00Z"));
  10  |   const person = syntheticUser("A", `${process.env.CF_E2E_NAMESPACE}-${info.project.name}-${scenario}`);
  11  |   await registerSyntheticUser(page, person);
  12  |   await writeFile(path.join(evidence, `${info.project.name}-${scenario}-environment.json`), JSON.stringify({ browser: page.context().browser()?.version(), node: process.version, platform: process.platform, viewport: page.viewportSize(), timezone: await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone), calendarFixed: "2026-10-21T15:00:00Z", clockMode: "Date-only", nativeZoom200Certified: false }));
  13  |   return person;
  14  | }
  15  | async function view(page: Page) { const r = await page.request.get("/api/onboarding"); expect(r.status()).toBe(200); return (await r.json()).data; }
  16  | async function screenshot(page: Page, info: TestInfo, name: string) {
  17  |   await expect(page.getByRole("heading", { name: "Organize seu ponto de partida" })).toBeVisible();
  18  |   await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  19  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && Array.from(document.querySelectorAll("main")).every(main => main.scrollWidth <= main.clientWidth))).toBe(true);
  20  |   await page.screenshot({ path: path.join(evidence, `${info.project.name}-${name}.png`), fullPage: true });
  21  | }
  22  | test("empty profile: keyboard, save/reload and lost confirmation recover a single effect", async ({ page }, info) => {
  23  |   const person = await register(page, info, "empty"); await page.getByRole("link", { name: "Abrir configuração inicial" }).click();
  24  |   await expect(page.getByRole("heading", { name: "Etapa 1 de 8: Contexto" })).toBeVisible();
  25  |   await page.getByLabel("Data-base das aberturas").fill("2026-10-21"); await page.getByLabel("Nome preferido (opcional)").fill("Perfil sem novas posições");
  26  |   await page.getByLabel("Confirmo que os saldos não incluem movimentos que registrarei novamente").check(); await page.getByLabel("Confirmo que o caixa da corretora não inclui o valor dos ativos aplicados").check();
  27  |   await screenshot(page, info, "context-dark");
  28  |   await page.getByRole("button", { name: "Salvar e continuar" }).focus(); await page.keyboard.press("Enter");
  29  |   for (const name of ["contas", "cartões e dívidas", "investimentos", "metas", "reservas vinculadas", "previsões opcionais"]) {
  30  |     const select = page.getByRole("combobox", { name: `Resposta para ${name}` }); await expect(select).toBeVisible(); await select.selectOption("NONE");
  31  |     await page.getByRole("button", { name: "Salvar e continuar" }).focus(); await page.keyboard.press("Enter");
  32  |   }
  33  |   await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  34  |   const before = await view(page); expect(before.payload.currentStep).toBe("REVIEW"); expect(before.status).toBe("IN_PROGRESS");
  35  |   const accountsBefore = await (await page.request.get("/api/accounts")).json(); expect(accountsBefore).toHaveLength(1); expect(accountsBefore[0].balance).toBe(0);
  36  |   await page.reload(); await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  37  |   await page.getByRole("button", { name: "Preparar revisão financeira" }).click(); await expect(page.getByRole("button", { name: "Confirmar informações e registrar posições" })).toBeVisible();
  38  |   const pending = await view(page); const operationId = pending.pendingIntent.operationId;
  39  |   // Fault injection forwards the real request and loses only the response after commit.
  40  |   let completeCalls = 0;
  41  |   let lost!: () => void; const lostResponse = new Promise<void>(resolve => { lost = resolve; });
  42  |   await page.route("**/api/onboarding/complete", async route => { completeCalls++; const response = await route.fetch(); expect(response.status()).toBe(200); await route.abort("failed"); lost(); });
  43  |   await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).click(); await expect(page.getByRole("heading", { name: "Confirmação pendente de verificação" })).toBeVisible();
  44  |   await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toHaveCount(0);
  45  |   await lostResponse; await expect(page.getByRole("button", { name: "Consultar resultado" })).toBeEnabled(); await page.unroute("**/api/onboarding/complete"); await page.getByRole("button", { name: "Consultar resultado" }).click();
  46  |   await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  47  |   const completed = await view(page); expect(completed.completedReceipt.operationId).toBe(operationId); expect(completed.completedReceipt.summary.metrics.netWorth.value).toBe("0.00"); expect(completeCalls).toBe(1);
  48  |   await page.reload(); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible(); await screenshot(page, info, "empty-completed");
  49  |   await writeFile(path.join(evidence, `${info.project.name}-empty-checkpoint.json`), JSON.stringify({ scenario: "empty", email: person.email, sessionId: completed.sessionId, operationId, completeCalls, expectedAccounts: "0.00" }));
  50  | });
  51  | test("E01 complete profile: persisted answers, real review, keyboard confirmation and receipt", async ({ page }, info) => {
  52  |   const person = await register(page, info, "full");
  53  |   const example = JSON.parse(await readFile(path.resolve("../tasks/evidencias/CF-028/examples.json"), "utf8"));
  54  |   const accounts = await (await page.request.get("/api/accounts")).json(); expect(accounts).toHaveLength(1); const categories = await (await page.request.get("/api/categories?type=INCOME")).json(); expect(categories.length).toBeGreaterThan(0);
  55  |   const serialized = JSON.stringify(example.draft).replaceAll("00000000-0000-4000-8000-000000000901", accounts[0].id).replaceAll("00000000-0000-4000-8000-000000000902", categories[0].id);
  56  |   const r = await page.request.put("/api/onboarding/draft", { data: JSON.parse(serialized) }); expect(r.status()).toBe(200);
  57  |   await page.goto("/onboarding"); await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  58  |   const labels = ["2. Contas", "3. Cartões e dívidas", "4. Investimentos", "5. Metas", "6. Reservas", "7. Previsões"];
  59  |   for (const [i, label] of labels.entries()) {
  60  |     await page.getByRole("button", { name: label, exact: true }).click(); await expect(page.getByRole("heading", { name: new RegExp(`Etapa ${i + 2} de 8:`) })).toBeVisible();
  61  |     await page.evaluate(light => document.documentElement.classList.toggle("dark", !light), i % 2 === 0);
  62  |     await screenshot(page, info, `full-step-${i + 2}`);
  63  |   }
  64  |   await page.getByRole("button", { name: "8. Revisão" }).click();
  65  |   await page.getByRole("button", { name: "Preparar revisão financeira" }).focus(); await page.keyboard.press("Enter");
  66  |   await expect(page.getByRole("heading", { name: "Confira antes de registrar" })).toBeVisible();
  67  |   const pending = await view(page); const summary = pending.pendingIntent.summary;
  68  |   expect(summary.metrics.netWorth.value).toBe("1451.00"); expect(summary.metrics.accountsSigned.value).toBe("1300.00"); expect(summary.metrics.investmentsValue.value).toBe("501.00"); expect(summary.metrics.cardDebt.value).toBe("350.00"); expect(summary.byCard[0].availableLimit.value).toBe("656.00");
  69  |   expect(await (await page.request.get("/api/accounts")).json()).toHaveLength(1);
  70  |   for (const light of [true, false]) { await page.evaluate(light => document.documentElement.classList.toggle("dark", !light), light); await screenshot(page, info, `full-review-${light ? "light" : "dark"}`); }
  71  |   await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).scrollIntoViewIfNeeded(); await expect(page.getByRole("button", { name: "Confirmar informações e registrar posições" })).toBeInViewport(); await screenshot(page, info, "full-review-actions");
  72  |   await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).focus(); await page.keyboard.press("Enter"); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  73  |   const completed = await view(page); expect(completed.completedReceipt.summary).toEqual(summary); expect(completed.completedReceipt.mapping).toHaveLength(16);
  74  |   const financialAccounts = await (await page.request.get("/api/accounts")).json(); expect(financialAccounts).toHaveLength(3); expect(financialAccounts.map((a: { balance: number }) => a.balance).sort((a: number, b: number) => a - b)).toEqual([100, 200, 1000]);
  75  |   await page.reload(); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  76  |   const privacy = await page.request.patch("/api/users/me/preferences", { data: { privacyMode: true } }); expect(privacy.status()).toBe(200); await page.reload(); await expect(page.getByText("Valor oculto").first()).toBeVisible();
  77  |   expect(await page.getByText("R$ 1.451,00", { exact: true }).isVisible()).toBe(false); await screenshot(page, info, "full-private-completed");
  78  |   await writeFile(path.join(evidence, `${info.project.name}-full-checkpoint.json`), JSON.stringify({ scenario: "full", email: person.email, sessionId: completed.sessionId, operationId: completed.completedReceipt.operationId, expectedAccounts: "1300.00", expectedNetWorth: "1451.00" }));
  79  | });
  80  | test("partial draft: real stale version, explicit comparison, pause/resume and discard have no financial effects", async ({ page }, info) => {
> 81  |   const person = await register(page, info, "draft"); await page.goto("/onboarding"); await expect(page.getByRole("heading", { name: "Etapa 1 de 8: Contexto" })).toBeVisible();
      |                                                                                                                                                                   ^ Error: expect(locator).toBeVisible() failed
  82  |   await page.getByLabel("Nome preferido (opcional)").fill("Primeiro salvamento"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await expect(page.getByRole("status").filter({ hasText: "Últimas respostas confirmadas" })).toBeVisible();
  83  |   const previous = await view(page); const remotePayload = structuredClone(previous.payload); remotePayload.context.preferredName = "Resposta de outra aba";
  84  |   expect((await page.request.put("/api/onboarding/draft", { data: { contractVersion: 1, action: "SAVE", expectedVersion: previous.version, payload: remotePayload } })).status()).toBe(200);
  85  |   await page.getByLabel("Nome preferido (opcional)").fill("Resposta local preservada"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await expect(page.getByText("Salvamento pendente de verificação", { exact: true })).toBeVisible();
  86  |   await page.getByRole("button", { name: "Verificar salvamento" }).click(); const compare = page.getByRole("region", { name: "Comparar rascunhos" }); await expect(compare).toBeVisible(); await expect(compare.getByText("Nome preferido: Resposta local preservada")).toBeVisible(); await expect(compare.getByText("Nome preferido: Resposta de outra aba")).toBeVisible();
  87  |   await page.getByRole("button", { name: "Salvar minhas respostas como nova versão" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(compare).toHaveCount(0);
  88  |   await page.getByRole("button", { name: "Salvar e pausar" }).click(); await expect(page).toHaveURL(/\/$/); await page.goto("/onboarding"); await expect(page.getByRole("button", { name: "Retomar entrevista" })).toBeVisible(); await page.getByRole("button", { name: "Retomar entrevista" }).click(); await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("Resposta local preservada");
  89  |   // A real committed save whose response becomes 503 is reconciled by GET, not another PUT.
  90  |   let lostSave!: () => void; const saveCommitted = new Promise<void>(resolve => { lostSave = resolve; });
  91  |   let puts = 0;
  92  |   await page.route("**/api/onboarding/draft", async route => { puts++; const response = await route.fetch(); expect(response.status()).toBe(200); await route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"Resposta sintética indisponível após save real"}' }); lostSave(); });
  93  |   await page.getByLabel("Nome preferido (opcional)").fill("Salvo mesmo com resposta perdida"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await saveCommitted;
  94  |   await expect(page.getByRole("button", { name: "Verificar salvamento" })).toBeEnabled(); await page.unroute("**/api/onboarding/draft");
  95  |   await page.getByRole("button", { name: "Verificar salvamento" }).click(); await expect(page.getByText("Salvamento confirmado pela releitura do servidor.", { exact: true })).toBeVisible(); expect(puts).toBe(1);
  96  |   // Expire the browser credentials; recover the durable draft after logging in again.
  97  |   await page.context().clearCookies(); await page.getByRole("button", { name: "Consultar rascunho do servidor" }).click(); await expect(page.getByRole("link", { name: "Entrar para retomar" })).toBeVisible();
  98  |   await page.getByRole("dialog").getByRole("button", { name: "Ir para o Login", exact: true }).click(); await page.locator('input[name="email"]').fill(person.email); await page.locator('input[name="senha"]').fill(person.password); await page.getByRole("button", { name: "Entrar", exact: true }).click(); await expect(page).toHaveURL(/\/$/);
  99  |   await page.goto("/onboarding"); await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("Salvo mesmo com resposta perdida");
  100 |   await page.getByRole("button", { name: "Descartar respostas" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(page.getByText("Respostas descartadas no servidor. Nenhum saldo foi alterado.")).toBeVisible();
  101 |   const discarded = await view(page); expect(discarded.payload).toBeNull(); expect(discarded.status).toBe("SKIPPED"); expect(discarded.completedReceipt).toBeNull();
  102 |   await screenshot(page, info, "draft-discarded"); await writeFile(path.join(evidence, `${info.project.name}-draft-checkpoint.json`), JSON.stringify({ scenario: "draft", email: person.email, sessionId: discarded.sessionId, operationId: null, expectedAccounts: "0.00" }));
  103 | });
  104 | test("large, negative and unknown values keep knowledge separate from totals on each viewport", async ({ page }, info) => {
  105 |   const person = await register(page, info, "visual");
  106 |   const context = { currency: "BRL", baseDate: "2026-10-21", boundaryAcknowledged: true, cashOnlyAcknowledged: true };
  107 |   const account = (name: string, balance: string) => ({ tempId: crypto.randomUUID(), action: "CREATE", name, type: "CHECKING", balance: { state: "KNOWN", value: balance }, deficitAcknowledged: balance.startsWith("-"), distinctCashConfirmed: false });
  108 |   const payload = { context, currentStep: "REVIEW", sections: {
  109 |     accounts: { answer: "PROVIDED", items: [account("Fonte máxima A com nome extenso para conferir quebra de linha e alcance dos controles", "999999999999.99"), account("Fonte máxima B", "999999999999.99"), account("Conta com saldo negativo real", "-0.01")] },
  110 |     investments: { answer: "PROVIDED", items: [{ tempId: crypto.randomUUID(), action: "CREATE", name: "Posição sem avaliação disponível", type: "FIXED_INCOME", positionMode: "MONETARY", quantity: { state: "NOT_APPLICABLE" }, cost: { state: "UNKNOWN" }, valuation: { state: "UNKNOWN" }, acquisitionDate: { state: "UNKNOWN" }, historicalSource: { state: "UNKNOWN" } }] },
  111 |     cards: { answer: "NONE", items: [] }, goals: { answer: "NONE", items: [] }, allocations: { answer: "NONE", items: [] }, forecasts: { answer: "DEFERRED", items: [] },
  112 |   } };
  113 |   expect((await page.request.put("/api/onboarding/draft", { data: { contractVersion: 1, expectedVersion: "0", action: "SAVE", payload } })).status()).toBe(200);
  114 |   await page.goto("/onboarding"); await page.getByRole("button", { name: "Preparar revisão financeira" }).click(); await expect(page.getByRole("heading", { name: "Confira antes de registrar" })).toBeVisible();
  115 |   const state = await view(page); const m = state.pendingIntent.summary.metrics;
  116 |   expect(m.accountsSigned).toMatchObject({ state: "KNOWN", value: "1999999999999.97", outsideIndividualRange: true }); expect(m.investmentsValue).toMatchObject({ state: "UNKNOWN", value: null, knownSubtotal: null }); expect(m.netWorth).toMatchObject({ state: "PARTIAL", value: null, knownSubtotal: "1999999999999.97" });
  117 |   await expect(page.getByText("Subtotal conhecido R$ 1.999.999.999.999,97; total indisponível", { exact: false })).toBeVisible();
  118 |   await page.getByText("Subtotal conhecido R$ 1.999.999.999.999,97; total indisponível", { exact: false }).scrollIntoViewIfNeeded();
  119 |   await screenshot(page, info, "large-partial-review");
  120 |   await page.getByRole("heading", { name: "Conta com saldo negativo real" }).scrollIntoViewIfNeeded(); await expect(page.getByText("R$ -0,01", { exact: true }).first()).toBeVisible(); await screenshot(page, info, "negative-and-unknown-source");
  121 |   await page.getByRole("heading", { name: "Posição sem avaliação disponível" }).scrollIntoViewIfNeeded(); await screenshot(page, info, "unknown-source");
  122 |   await page.getByRole("button", { name: "Cancelar revisão para corrigir" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(page.getByRole("button", { name: "Preparar revisão financeira" })).toBeEnabled();
  123 |   const uncommitted = await view(page); expect(uncommitted.pendingIntent).toBeNull(); expect(uncommitted.completedReceipt).toBeNull();
  124 |   await writeFile(path.join(evidence, `${info.project.name}-visual-checkpoint.json`), JSON.stringify({ scenario: "visual", email: person.email, sessionId: uncommitted.sessionId, operationId: null, expectedAccounts: "0.00" }));
  125 | });
  126 | 
```