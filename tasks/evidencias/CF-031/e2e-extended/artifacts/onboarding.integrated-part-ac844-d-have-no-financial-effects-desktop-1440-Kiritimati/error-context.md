# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.integrated.spec.ts >> partial draft: real stale version, explicit comparison, pause/resume and discard have no financial effects
- Location: src\screens\private\onboarding\e2e\onboarding.integrated.spec.ts:78:5

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Entrar para retomar' })
    - locator resolved to <a href="/auth" class="rounded-lg border border-border-divider px-4 py-2 text-text-main hover:bg-bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">Entrar para retomar</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    155 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs">…</div> intercepts pointer events
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e2]:
    - complementary "Navegação principal" [ref=f2e3]:
      - generic [ref=f2e4]:
        - generic [ref=f2e5]: U
        - generic [ref=f2e6]:
          - heading "Carregando..." [level=2] [ref=f2e7]
          - generic [ref=f2e8]: ...
      - navigation [ref=f2e10]:
        - link "Dashboard" [ref=f2e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f2e19] [cursor=pointer]:
          - /url: /contas
        - link "Configuração inicial" [ref=f2e24] [cursor=pointer]:
          - /url: /onboarding
        - link "Extrato" [ref=f2e30] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f2e36] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f2e41] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f2e46] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f2e53] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f2e61] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f2e68] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f2e75]:
        - button "Privacidade" [ref=f2e76] [cursor=pointer]
        - button "Configurações" [ref=f2e84] [cursor=pointer]
        - button "Sair da Conta" [ref=f2e89] [cursor=pointer]
    - main [ref=f2e95]:
      - generic [ref=f2e96]:
        - paragraph [ref=f2e97]: Sua sessão terminou. O último rascunho salvo continua no servidor.
        - link "Entrar para retomar" [ref=f2e98] [cursor=pointer]:
          - /url: /auth
  - button "Open Next.js Dev Tools" [ref=f2e104] [cursor=pointer]
  - alert [ref=f2e108]
  - dialog [ref=f2e110]:
    - generic [ref=f2e111]:
      - heading "Sessão Expirada" [level=2] [ref=f2e112]
      - button "Fechar modal" [active] [ref=f2e113]
    - generic [ref=f2e118]:
      - paragraph [ref=f2e119]: Por medidas de segurança, sua sessão foi encerrada. Por favor, faça login novamente para continuar.
      - button "Ir para o Login" [ref=f2e121] [cursor=pointer]
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
  11  |   await registerSyntheticUser(page, person); return person;
  12  | }
  13  | async function view(page: Page) { const r = await page.request.get("/api/onboarding"); expect(r.status()).toBe(200); return (await r.json()).data; }
  14  | async function screenshot(page: Page, info: TestInfo, name: string) {
  15  |   await expect(page.getByRole("heading", { name: "Organize seu ponto de partida" })).toBeVisible();
  16  |   await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  17  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && Array.from(document.querySelectorAll("main")).every(main => main.scrollWidth <= main.clientWidth))).toBe(true);
  18  |   await page.screenshot({ path: path.join(evidence, `${info.project.name}-${name}.png`), fullPage: true });
  19  | }
  20  | test("empty profile: keyboard, save/reload and lost confirmation recover a single effect", async ({ page }, info) => {
  21  |   const person = await register(page, info, "empty"); await page.getByRole("link", { name: "Abrir configuração inicial" }).click();
  22  |   await expect(page.getByRole("heading", { name: "Etapa 1 de 8: Contexto" })).toBeVisible();
  23  |   await page.getByLabel("Data-base das aberturas").fill("2026-10-21"); await page.getByLabel("Nome preferido (opcional)").fill("Perfil sem novas posições");
  24  |   await page.getByLabel("Confirmo que os saldos não incluem movimentos que registrarei novamente").check(); await page.getByLabel("Confirmo que o caixa da corretora não inclui o valor dos ativos aplicados").check();
  25  |   await screenshot(page, info, "context-dark");
  26  |   await page.getByRole("button", { name: "Salvar e continuar" }).focus(); await page.keyboard.press("Enter");
  27  |   for (const name of ["contas", "cartões e dívidas", "investimentos", "metas", "reservas vinculadas", "previsões opcionais"]) {
  28  |     const select = page.getByRole("combobox", { name: `Resposta para ${name}` }); await expect(select).toBeVisible(); await select.selectOption("NONE");
  29  |     await page.getByRole("button", { name: "Salvar e continuar" }).focus(); await page.keyboard.press("Enter");
  30  |   }
  31  |   await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  32  |   const before = await view(page); expect(before.payload.currentStep).toBe("REVIEW"); expect(before.status).toBe("IN_PROGRESS");
  33  |   const accountsBefore = await (await page.request.get("/api/accounts")).json(); expect(accountsBefore).toHaveLength(1); expect(accountsBefore[0].balance).toBe(0);
  34  |   await page.reload(); await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  35  |   await page.getByRole("button", { name: "Preparar revisão financeira" }).click(); await expect(page.getByRole("button", { name: "Confirmar informações e registrar posições" })).toBeVisible();
  36  |   const pending = await view(page); const operationId = pending.pendingIntent.operationId;
  37  |   // Fault injection forwards the real request and loses only the response after commit.
  38  |   let completeCalls = 0;
  39  |   let lost!: () => void; const lostResponse = new Promise<void>(resolve => { lost = resolve; });
  40  |   await page.route("**/api/onboarding/complete", async route => { completeCalls++; const response = await route.fetch(); expect(response.status()).toBe(200); await route.abort("failed"); lost(); });
  41  |   await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).click(); await expect(page.getByRole("heading", { name: "Confirmação pendente de verificação" })).toBeVisible();
  42  |   await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toHaveCount(0);
  43  |   await lostResponse; await expect(page.getByRole("button", { name: "Consultar resultado" })).toBeEnabled(); await page.unroute("**/api/onboarding/complete"); await page.getByRole("button", { name: "Consultar resultado" }).click();
  44  |   await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  45  |   const completed = await view(page); expect(completed.completedReceipt.operationId).toBe(operationId); expect(completed.completedReceipt.summary.metrics.netWorth.value).toBe("0.00"); expect(completeCalls).toBe(1);
  46  |   await page.reload(); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible(); await screenshot(page, info, "empty-completed");
  47  |   await writeFile(path.join(evidence, `${info.project.name}-empty-checkpoint.json`), JSON.stringify({ scenario: "empty", email: person.email, sessionId: completed.sessionId, operationId, completeCalls, expectedAccounts: "0.00" }));
  48  | });
  49  | test("E01 complete profile: persisted answers, real review, keyboard confirmation and receipt", async ({ page }, info) => {
  50  |   const person = await register(page, info, "full");
  51  |   const example = JSON.parse(await readFile(path.resolve("../tasks/evidencias/CF-028/examples.json"), "utf8"));
  52  |   const accounts = await (await page.request.get("/api/accounts")).json(); expect(accounts).toHaveLength(1); const categories = await (await page.request.get("/api/categories?type=INCOME")).json(); expect(categories.length).toBeGreaterThan(0);
  53  |   const serialized = JSON.stringify(example.draft).replaceAll("00000000-0000-4000-8000-000000000901", accounts[0].id).replaceAll("00000000-0000-4000-8000-000000000902", categories[0].id);
  54  |   const r = await page.request.put("/api/onboarding/draft", { data: JSON.parse(serialized) }); expect(r.status()).toBe(200);
  55  |   await page.goto("/onboarding"); await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  56  |   const labels = ["2. Contas", "3. Cartões e dívidas", "4. Investimentos", "5. Metas", "6. Reservas", "7. Previsões"];
  57  |   for (const [i, label] of labels.entries()) {
  58  |     await page.getByRole("button", { name: label, exact: true }).click(); await expect(page.getByRole("heading", { name: new RegExp(`Etapa ${i + 2} de 8:`) })).toBeVisible();
  59  |     await page.evaluate(light => document.documentElement.classList.toggle("dark", !light), i % 2 === 0);
  60  |     await screenshot(page, info, `full-step-${i + 2}`);
  61  |   }
  62  |   await page.getByRole("button", { name: "8. Revisão" }).click();
  63  |   await page.getByRole("button", { name: "Preparar revisão financeira" }).focus(); await page.keyboard.press("Enter");
  64  |   await expect(page.getByRole("heading", { name: "Confira antes de registrar" })).toBeVisible();
  65  |   const pending = await view(page); const summary = pending.pendingIntent.summary;
  66  |   expect(summary.metrics.netWorth.value).toBe("1451.00"); expect(summary.metrics.accountsSigned.value).toBe("1300.00"); expect(summary.metrics.investmentsValue.value).toBe("501.00"); expect(summary.metrics.cardDebt.value).toBe("350.00"); expect(summary.byCard[0].availableLimit.value).toBe("656.00");
  67  |   expect(await (await page.request.get("/api/accounts")).json()).toHaveLength(1);
  68  |   for (const light of [true, false]) { await page.evaluate(light => document.documentElement.classList.toggle("dark", !light), light); await screenshot(page, info, `full-review-${light ? "light" : "dark"}`); }
  69  |   await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).scrollIntoViewIfNeeded(); await expect(page.getByRole("button", { name: "Confirmar informações e registrar posições" })).toBeInViewport(); await screenshot(page, info, "full-review-actions");
  70  |   await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).focus(); await page.keyboard.press("Enter"); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  71  |   const completed = await view(page); expect(completed.completedReceipt.summary).toEqual(summary); expect(completed.completedReceipt.mapping).toHaveLength(16);
  72  |   const financialAccounts = await (await page.request.get("/api/accounts")).json(); expect(financialAccounts).toHaveLength(3); expect(financialAccounts.map((a: { balance: number }) => a.balance).sort((a: number, b: number) => a - b)).toEqual([100, 200, 1000]);
  73  |   await page.reload(); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  74  |   const privacy = await page.request.patch("/api/users/me/preferences", { data: { privacyMode: true } }); expect(privacy.status()).toBe(200); await page.reload(); await expect(page.getByText("Valor oculto").first()).toBeVisible();
  75  |   expect(await page.getByText("R$ 1.451,00", { exact: true }).isVisible()).toBe(false); await screenshot(page, info, "full-private-completed");
  76  |   await writeFile(path.join(evidence, `${info.project.name}-full-checkpoint.json`), JSON.stringify({ scenario: "full", email: person.email, sessionId: completed.sessionId, operationId: completed.completedReceipt.operationId, expectedAccounts: "1300.00", expectedNetWorth: "1451.00" }));
  77  | });
  78  | test("partial draft: real stale version, explicit comparison, pause/resume and discard have no financial effects", async ({ page }, info) => {
  79  |   const person = await register(page, info, "draft"); await page.goto("/onboarding"); await expect(page.getByRole("heading", { name: "Etapa 1 de 8: Contexto" })).toBeVisible();
  80  |   await page.getByLabel("Nome preferido (opcional)").fill("Primeiro salvamento"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await expect(page.getByRole("status").filter({ hasText: "Últimas respostas confirmadas" })).toBeVisible();
  81  |   const previous = await view(page); const remotePayload = structuredClone(previous.payload); remotePayload.context.preferredName = "Resposta de outra aba";
  82  |   expect((await page.request.put("/api/onboarding/draft", { data: { contractVersion: 1, action: "SAVE", expectedVersion: previous.version, payload: remotePayload } })).status()).toBe(200);
  83  |   await page.getByLabel("Nome preferido (opcional)").fill("Resposta local preservada"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await expect(page.getByText("Salvamento pendente de verificação", { exact: true })).toBeVisible();
  84  |   await page.getByRole("button", { name: "Verificar salvamento" }).click(); const compare = page.getByRole("region", { name: "Comparar rascunhos" }); await expect(compare).toBeVisible(); await expect(compare.getByText("Nome preferido: Resposta local preservada")).toBeVisible(); await expect(compare.getByText("Nome preferido: Resposta de outra aba")).toBeVisible();
  85  |   await page.getByRole("button", { name: "Salvar minhas respostas como nova versão" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(compare).toHaveCount(0);
  86  |   await page.getByRole("button", { name: "Salvar e pausar" }).click(); await expect(page).toHaveURL(/\/$/); await page.goto("/onboarding"); await expect(page.getByRole("button", { name: "Retomar entrevista" })).toBeVisible(); await page.getByRole("button", { name: "Retomar entrevista" }).click(); await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("Resposta local preservada");
  87  |   // A real committed save whose response becomes 503 is reconciled by GET, not another PUT.
  88  |   let lostSave!: () => void; const saveCommitted = new Promise<void>(resolve => { lostSave = resolve; });
  89  |   let puts = 0;
  90  |   await page.route("**/api/onboarding/draft", async route => { puts++; const response = await route.fetch(); expect(response.status()).toBe(200); await route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"Resposta sintética indisponível após save real"}' }); lostSave(); });
  91  |   await page.getByLabel("Nome preferido (opcional)").fill("Salvo mesmo com resposta perdida"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await saveCommitted;
  92  |   await expect(page.getByRole("button", { name: "Verificar salvamento" })).toBeEnabled(); await page.unroute("**/api/onboarding/draft");
  93  |   await page.getByRole("button", { name: "Verificar salvamento" }).click(); await expect(page.getByText("Salvamento confirmado pela releitura do servidor.", { exact: true })).toBeVisible(); expect(puts).toBe(1);
  94  |   // Expire the browser credentials; recover the durable draft after logging in again.
  95  |   await page.context().clearCookies(); await page.getByRole("button", { name: "Consultar rascunho do servidor" }).click(); await expect(page.getByRole("link", { name: "Entrar para retomar" })).toBeVisible();
> 96  |   await page.getByRole("link", { name: "Entrar para retomar" }).click(); await page.locator('input[name="email"]').fill(person.email); await page.locator('input[name="senha"]').fill(person.password); await page.getByRole("button", { name: "Entrar", exact: true }).click(); await expect(page).toHaveURL(/\/$/);
      |                                                                 ^ Error: locator.click: Test timeout of 90000ms exceeded.
  97  |   await page.goto("/onboarding"); await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("Salvo mesmo com resposta perdida");
  98  |   await page.getByRole("button", { name: "Descartar respostas" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(page.getByText("Respostas descartadas no servidor. Nenhum saldo foi alterado.")).toBeVisible();
  99  |   const discarded = await view(page); expect(discarded.payload).toBeNull(); expect(discarded.status).toBe("SKIPPED"); expect(discarded.completedReceipt).toBeNull();
  100 |   await screenshot(page, info, "draft-discarded"); await writeFile(path.join(evidence, `${info.project.name}-draft-checkpoint.json`), JSON.stringify({ scenario: "draft", email: person.email, sessionId: discarded.sessionId, operationId: null, expectedAccounts: "0.00" }));
  101 | });
  102 | test("large, negative and unknown values keep knowledge separate from totals on each viewport", async ({ page }, info) => {
  103 |   const person = await register(page, info, "visual");
  104 |   const context = { currency: "BRL", baseDate: "2026-10-21", boundaryAcknowledged: true, cashOnlyAcknowledged: true };
  105 |   const account = (name: string, balance: string) => ({ tempId: crypto.randomUUID(), action: "CREATE", name, type: "CHECKING", balance: { state: "KNOWN", value: balance }, deficitAcknowledged: balance.startsWith("-"), distinctCashConfirmed: false });
  106 |   const payload = { context, currentStep: "REVIEW", sections: {
  107 |     accounts: { answer: "PROVIDED", items: [account("Fonte máxima A com nome extenso para conferir quebra de linha e alcance dos controles", "999999999999.99"), account("Fonte máxima B", "999999999999.99"), account("Conta com saldo negativo real", "-0.01")] },
  108 |     investments: { answer: "PROVIDED", items: [{ tempId: crypto.randomUUID(), action: "CREATE", name: "Posição sem avaliação disponível", type: "FIXED_INCOME", positionMode: "MONETARY", quantity: { state: "NOT_APPLICABLE" }, cost: { state: "UNKNOWN" }, valuation: { state: "UNKNOWN" }, acquisitionDate: { state: "UNKNOWN" }, historicalSource: { state: "UNKNOWN" } }] },
  109 |     cards: { answer: "NONE", items: [] }, goals: { answer: "NONE", items: [] }, allocations: { answer: "NONE", items: [] }, forecasts: { answer: "DEFERRED", items: [] },
  110 |   } };
  111 |   expect((await page.request.put("/api/onboarding/draft", { data: { contractVersion: 1, expectedVersion: "0", action: "SAVE", payload } })).status()).toBe(200);
  112 |   await page.goto("/onboarding"); await page.getByRole("button", { name: "Preparar revisão financeira" }).click(); await expect(page.getByRole("heading", { name: "Confira antes de registrar" })).toBeVisible();
  113 |   const state = await view(page); const m = state.pendingIntent.summary.metrics;
  114 |   expect(m.accountsSigned).toMatchObject({ state: "KNOWN", value: "1999999999999.97", outsideIndividualRange: true }); expect(m.investmentsValue).toMatchObject({ state: "UNKNOWN", value: null, knownSubtotal: null }); expect(m.netWorth).toMatchObject({ state: "PARTIAL", value: null, knownSubtotal: "1999999999999.97" });
  115 |   await expect(page.getByText("Subtotal conhecido R$ 1.999.999.999.999,97; total indisponível", { exact: false })).toBeVisible();
  116 |   await screenshot(page, info, "large-partial-review");
  117 |   await page.getByRole("heading", { name: "Conta com saldo negativo real" }).scrollIntoViewIfNeeded(); await expect(page.getByText("R$ -0,01", { exact: true }).first()).toBeVisible(); await screenshot(page, info, "negative-and-unknown-source");
  118 |   await page.getByRole("button", { name: "Cancelar revisão para corrigir" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(page.getByRole("button", { name: "Preparar revisão financeira" })).toBeEnabled();
  119 |   const uncommitted = await view(page); expect(uncommitted.pendingIntent).toBeNull(); expect(uncommitted.completedReceipt).toBeNull();
  120 |   await writeFile(path.join(evidence, `${info.project.name}-visual-checkpoint.json`), JSON.stringify({ scenario: "visual", email: person.email, sessionId: uncommitted.sessionId, operationId: null, expectedAccounts: "0.00" }));
  121 | });
  122 | 
```