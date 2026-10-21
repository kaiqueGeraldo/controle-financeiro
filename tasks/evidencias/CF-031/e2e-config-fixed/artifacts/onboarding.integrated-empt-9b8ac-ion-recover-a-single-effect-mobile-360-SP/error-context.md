# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.integrated.spec.ts >> empty profile: keyboard, save/reload and lost confirmation recover a single effect
- Location: src\screens\private\onboarding\e2e\onboarding.integrated.spec.ts:20:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "REVIEW"
Received: "FORECASTS"
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e5]:
      - button "Abrir menu de navegação" [ref=e6] [cursor=pointer]
      - generic [ref=e8]: Controle Financeiro
    - main [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]:
            - paragraph [ref=e14]: Configuração inicial voluntária
            - heading "Organize seu ponto de partida" [level=1] [ref=e15]
            - paragraph [ref=e16]: Registre o que já existe na data-base. Salvar respostas não altera saldos; somente a confirmação final registra as posições.
          - button "Ir ao dashboard" [ref=e17]
        - alert [ref=e18]: Rascunho salvo. O diagnóstico corresponde a este salvamento, sem revalidar a situação financeira atual.
        - complementary [ref=e19]:
          - heading "Seus registros atuais serão preservados" [level=2] [ref=e20]
          - paragraph [ref=e21]: Este é um complemento voluntário. Use vínculos para registros já existentes; não reaplique saldo de abertura. Nenhum cadastro será reinicializado automaticamente.
          - group [ref=e22]:
            - generic "Consultar cadastros existentes" [ref=e23] [cursor=pointer]
        - navigation "Etapas da entrevista" [ref=e24]:
          - list [ref=e25]:
            - listitem [ref=e26]:
              - button "1. Contexto" [ref=e27]
            - listitem [ref=e28]:
              - button "2. Contas" [ref=e29]
            - listitem [ref=e30]:
              - button "3. Cartões e dívidas" [ref=e31]
            - listitem [ref=e32]:
              - button "4. Investimentos" [ref=e33]
            - listitem [ref=e34]:
              - button "5. Metas" [ref=e35]
            - listitem [ref=e36]:
              - button "6. Reservas" [ref=e37]
            - listitem [ref=e38]:
              - button "7. Previsões" [ref=e39]
            - listitem [ref=e40]:
              - button "8. Revisão" [ref=e41]
        - 'heading "Etapa 8 de 8: Revisão" [active] [level=2] [ref=e42]'
        - group [ref=e43]:
          - paragraph [ref=e44]: Confira as respostas. Preparar salva esta etapa e consulta os valores autoritativos sem aplicar posições financeiras. O próximo passo apresenta o resumo para confirmação explícita.
          - generic [ref=e45]:
            - generic [ref=e48]:
              - paragraph [ref=e49]: Contexto
              - generic [ref=e50]:
                - generic [ref=e51]:
                  - term [ref=e52]: Moeda
                  - definition [ref=e53]:
                    - paragraph [ref=e54]: "Moeda: BRL"
                - generic [ref=e55]:
                  - term [ref=e56]: Data-base
                  - definition [ref=e57]:
                    - paragraph [ref=e58]: "Data-base: 21/10/2026"
                - generic [ref=e59]:
                  - term [ref=e60]: Fuso do navegador
                  - definition [ref=e61]:
                    - paragraph [ref=e62]: "Fuso do navegador: America/Sao_Paulo"
                - generic [ref=e63]:
                  - term [ref=e64]: Fronteira com movimentos posteriores
                  - definition [ref=e65]:
                    - paragraph [ref=e66]: "Fronteira com movimentos posteriores: Confirmado"
                - generic [ref=e67]:
                  - term [ref=e68]: Caixa sem ativos aplicados
                  - definition [ref=e69]:
                    - paragraph [ref=e70]: "Caixa sem ativos aplicados: Confirmado"
                - generic [ref=e71]:
                  - term [ref=e72]: Nome preferido
                  - definition [ref=e73]:
                    - paragraph [ref=e74]: "Nome preferido: Perfil sem novas posições"
            - heading "Contas — Nenhum novo item declarado" [level=3] [ref=e76]
            - heading "Cartões e dívidas — Nenhum novo item declarado" [level=3] [ref=e78]
            - heading "Investimentos — Nenhum novo item declarado" [level=3] [ref=e80]
            - heading "Metas — Nenhum novo item declarado" [level=3] [ref=e82]
            - heading "Reservas vinculadas — Nenhum novo item declarado" [level=3] [ref=e84]
            - heading "Previsões opcionais — Nenhum novo item declarado" [level=3] [ref=e86]
        - generic [ref=e87]:
          - status [ref=e88]: Últimas respostas confirmadas no servidor.
          - generic [ref=e89]:
            - button "Voltar" [ref=e90]
            - button "Salvar rascunho" [ref=e91]
            - button "Preparar revisão financeira" [ref=e92]
            - button "Salvar e pausar" [ref=e93]
            - button "Descartar respostas" [ref=e94]
            - button "Consultar rascunho do servidor" [ref=e95]
  - button "Open Next.js Dev Tools" [ref=e101] [cursor=pointer]
  - alert [ref=e105]: Finanças - Configuração inicial
```

# Test source

```ts
  1  | import { test, expect, type Page, type TestInfo } from "@playwright/test";
  2  | import { readFile, writeFile } from "node:fs/promises";
  3  | import path from "node:path";
  4  | import { registerSyntheticUser, syntheticUser } from "../../../../../tests/e2e/support/synthetic-auth";
  5  | 
  6  | const evidence = process.env.CF031_EVIDENCE!;
  7  | async function register(page: Page, info: TestInfo, scenario: string) {
  8  |   // Fix only the civil calendar; native animation clocks remain coherent.
  9  |   await page.clock.setFixedTime(new Date("2026-10-21T15:00:00Z"));
  10 |   const person = syntheticUser("A", `${process.env.CF_E2E_NAMESPACE}-${info.project.name}-${scenario}`);
  11 |   await registerSyntheticUser(page, person); return person;
  12 | }
  13 | async function view(page: Page) { const r = await page.request.get("/api/onboarding"); expect(r.status()).toBe(200); return (await r.json()).data; }
  14 | async function screenshot(page: Page, info: TestInfo, name: string) {
  15 |   await expect(page.getByRole("heading", { name: "Organize seu ponto de partida" })).toBeVisible();
  16 |   await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  17 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && Array.from(document.querySelectorAll("main")).every(main => main.scrollWidth <= main.clientWidth))).toBe(true);
  18 |   await page.screenshot({ path: path.join(evidence, `${info.project.name}-${name}.png`), fullPage: true });
  19 | }
  20 | test("empty profile: keyboard, save/reload and lost confirmation recover a single effect", async ({ page }, info) => {
  21 |   const person = await register(page, info, "empty"); await page.getByRole("link", { name: "Abrir configuração inicial" }).click();
  22 |   await expect(page.getByRole("heading", { name: "Etapa 1 de 8: Contexto" })).toBeVisible();
  23 |   await page.getByLabel("Data-base das aberturas").fill("2026-10-21"); await page.getByLabel("Nome preferido (opcional)").fill("Perfil sem novas posições");
  24 |   await page.getByLabel("Confirmo que os saldos não incluem movimentos que registrarei novamente").check(); await page.getByLabel("Confirmo que o caixa da corretora não inclui o valor dos ativos aplicados").check();
  25 |   await screenshot(page, info, "context-dark");
  26 |   await page.getByRole("button", { name: "Salvar e continuar" }).focus(); await page.keyboard.press("Enter");
  27 |   for (const name of ["contas", "cartões e dívidas", "investimentos", "metas", "reservas vinculadas", "previsões opcionais"]) {
  28 |     const select = page.getByRole("combobox", { name: `Resposta para ${name}` }); await expect(select).toBeVisible(); await select.selectOption("NONE");
  29 |     await page.getByRole("button", { name: "Salvar e continuar" }).focus(); await page.keyboard.press("Enter");
  30 |   }
> 31 |   const before = await view(page); expect(before.payload.currentStep).toBe("REVIEW"); expect(before.status).toBe("IN_PROGRESS");
     |                                                                       ^ Error: expect(received).toBe(expected) // Object.is equality
  32 |   const accountsBefore = await (await page.request.get("/api/accounts")).json(); expect(accountsBefore).toHaveLength(1); expect(accountsBefore[0].balance).toBe(0);
  33 |   await page.reload(); await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  34 |   await page.getByRole("button", { name: "Preparar revisão financeira" }).click(); await expect(page.getByRole("button", { name: "Confirmar informações e registrar posições" })).toBeVisible();
  35 |   const pending = await view(page); const operationId = pending.pendingIntent.operationId;
  36 |   // Fault injection forwards the real request and loses only the response after commit.
  37 |   let completeCalls = 0;
  38 |   await page.route("**/api/onboarding/complete", async route => { completeCalls++; const response = await route.fetch(); expect(response.status()).toBe(200); await route.abort("failed"); });
  39 |   await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).click(); await expect(page.getByRole("heading", { name: "Confirmação pendente de verificação" })).toBeVisible();
  40 |   await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toHaveCount(0);
  41 |   await page.unroute("**/api/onboarding/complete"); await page.getByRole("button", { name: "Consultar resultado" }).click();
  42 |   await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  43 |   const completed = await view(page); expect(completed.completedReceipt.operationId).toBe(operationId); expect(completed.completedReceipt.summary.metrics.netWorth.value).toBe("0.00"); expect(completeCalls).toBe(1);
  44 |   await page.reload(); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible(); await screenshot(page, info, "empty-completed");
  45 |   await writeFile(path.join(evidence, `${info.project.name}-empty-checkpoint.json`), JSON.stringify({ scenario: "empty", email: person.email, sessionId: completed.sessionId, operationId, completeCalls, expectedAccounts: "0.00" }));
  46 | });
  47 | test("E01 complete profile: persisted answers, real review, keyboard confirmation and receipt", async ({ page }, info) => {
  48 |   const person = await register(page, info, "full");
  49 |   const example = JSON.parse(await readFile(path.resolve("../tasks/evidencias/CF-028/examples.json"), "utf8"));
  50 |   const accounts = await (await page.request.get("/api/accounts")).json(); expect(accounts).toHaveLength(1); const categories = await (await page.request.get("/api/categories?type=INCOME")).json(); expect(categories.length).toBeGreaterThan(0);
  51 |   const serialized = JSON.stringify(example.draft).replaceAll("00000000-0000-4000-8000-000000000901", accounts[0].id).replaceAll("00000000-0000-4000-8000-000000000902", categories[0].id);
  52 |   const r = await page.request.put("/api/onboarding/draft", { data: JSON.parse(serialized) }); expect(r.status()).toBe(200);
  53 |   await page.goto("/onboarding"); await expect(page.getByRole("heading", { name: "Etapa 8 de 8: Revisão" })).toBeVisible();
  54 |   const labels = ["2. Contas", "3. Cartões e dívidas", "4. Investimentos", "5. Metas", "6. Reservas", "7. Previsões"];
  55 |   for (const [i, label] of labels.entries()) {
  56 |     await page.getByRole("button", { name: label, exact: true }).click(); await expect(page.getByRole("heading", { name: new RegExp(`Etapa ${i + 2} de 8:`) })).toBeVisible();
  57 |     await page.evaluate(light => document.documentElement.classList.toggle("dark", !light), i % 2 === 0);
  58 |     await screenshot(page, info, `full-step-${i + 2}`);
  59 |   }
  60 |   await page.getByRole("button", { name: "8. Revisão" }).click();
  61 |   await page.getByRole("button", { name: "Preparar revisão financeira" }).focus(); await page.keyboard.press("Enter");
  62 |   await expect(page.getByRole("heading", { name: "Confira antes de registrar" })).toBeVisible();
  63 |   const pending = await view(page); const summary = pending.pendingIntent.summary;
  64 |   expect(summary.metrics.netWorth.value).toBe("1451.00"); expect(summary.metrics.accountsSigned.value).toBe("1300.00"); expect(summary.metrics.investmentsValue.value).toBe("501.00"); expect(summary.metrics.cardDebt.value).toBe("350.00"); expect(summary.byCard[0].availableLimit.value).toBe("656.00");
  65 |   expect(await (await page.request.get("/api/accounts")).json()).toHaveLength(1);
  66 |   for (const light of [true, false]) { await page.evaluate(light => document.documentElement.classList.toggle("dark", !light), light); await screenshot(page, info, `full-review-${light ? "light" : "dark"}`); }
  67 |   await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).scrollIntoViewIfNeeded(); await expect(page.getByRole("button", { name: "Confirmar informações e registrar posições" })).toBeInViewport(); await screenshot(page, info, "full-review-actions");
  68 |   await page.getByRole("button", { name: "Confirmar informações e registrar posições" }).focus(); await page.keyboard.press("Enter"); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  69 |   const completed = await view(page); expect(completed.completedReceipt.summary).toEqual(summary); expect(completed.completedReceipt.mapping).toHaveLength(16);
  70 |   const financialAccounts = await (await page.request.get("/api/accounts")).json(); expect(financialAccounts).toHaveLength(3); expect(financialAccounts.map((a: { balance: number }) => a.balance).sort((a: number, b: number) => a - b)).toEqual([100, 200, 1000]);
  71 |   await page.reload(); await expect(page.getByRole("heading", { name: "Entrevista concluída", exact: true })).toBeVisible();
  72 |   const privacy = await page.request.patch("/api/users/me/preferences", { data: { privacyMode: true } }); expect(privacy.status()).toBe(200); await page.reload(); await expect(page.getByText("Valor oculto").first()).toBeVisible();
  73 |   expect(await page.getByText("R$ 1.451,00", { exact: true }).isVisible()).toBe(false); await screenshot(page, info, "full-private-completed");
  74 |   await writeFile(path.join(evidence, `${info.project.name}-full-checkpoint.json`), JSON.stringify({ scenario: "full", email: person.email, sessionId: completed.sessionId, operationId: completed.completedReceipt.operationId, expectedAccounts: "1300.00", expectedNetWorth: "1451.00" }));
  75 | });
  76 | test("partial draft: real stale version, explicit comparison, pause/resume and discard have no financial effects", async ({ page }, info) => {
  77 |   const person = await register(page, info, "draft"); await page.goto("/onboarding"); await expect(page.getByRole("heading", { name: "Etapa 1 de 8: Contexto" })).toBeVisible();
  78 |   await page.getByLabel("Nome preferido (opcional)").fill("Primeiro salvamento"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await expect(page.getByRole("status").filter({ hasText: "Últimas respostas confirmadas" })).toBeVisible();
  79 |   const previous = await view(page); const remotePayload = structuredClone(previous.payload); remotePayload.context.preferredName = "Resposta de outra aba";
  80 |   expect((await page.request.put("/api/onboarding/draft", { data: { contractVersion: 1, action: "SAVE", expectedVersion: previous.version, payload: remotePayload } })).status()).toBe(200);
  81 |   await page.getByLabel("Nome preferido (opcional)").fill("Resposta local preservada"); await page.getByRole("button", { name: "Salvar rascunho" }).click(); await expect(page.getByText("Salvamento pendente de verificação", { exact: true })).toBeVisible();
  82 |   await page.getByRole("button", { name: "Verificar salvamento" }).click(); const compare = page.getByRole("region", { name: "Comparar rascunhos" }); await expect(compare).toBeVisible(); await expect(compare.getByText("Nome preferido: Resposta local preservada")).toBeVisible(); await expect(compare.getByText("Nome preferido: Resposta de outra aba")).toBeVisible();
  83 |   await page.getByRole("button", { name: "Salvar minhas respostas como nova versão" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(compare).toHaveCount(0);
  84 |   await page.getByRole("button", { name: "Salvar e pausar" }).click(); await expect(page).toHaveURL(/\/$/); await page.goto("/onboarding"); await expect(page.getByRole("button", { name: "Retomar entrevista" })).toBeVisible(); await page.getByRole("button", { name: "Retomar entrevista" }).click(); await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("Resposta local preservada");
  85 |   await page.getByRole("button", { name: "Descartar respostas" }).click(); await page.getByRole("dialog").getByRole("button", { name: "Confirmar alteração", exact: true }).click(); await expect(page.getByText("Respostas descartadas no servidor. Nenhum saldo foi alterado.")).toBeVisible();
  86 |   const discarded = await view(page); expect(discarded.payload).toBeNull(); expect(discarded.status).toBe("SKIPPED"); expect(discarded.completedReceipt).toBeNull();
  87 |   await screenshot(page, info, "draft-discarded"); await writeFile(path.join(evidence, `${info.project.name}-draft-checkpoint.json`), JSON.stringify({ scenario: "draft", email: person.email, sessionId: discarded.sessionId, operationId: null, expectedAccounts: "0.00" }));
  88 | });
  89 | 
```