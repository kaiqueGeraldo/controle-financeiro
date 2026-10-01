# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rv24-independent.integrated.spec.ts >> RV24 transaction before: browser BFF PostgreSQL reload exact replay and isolation
- Location: tests\e2e\rv24-independent.integrated.spec.ts:6:7

# Error details

```
Error: apiRequestContext.post: read ECONNRESET
Call log:
  - → POST http://127.0.0.1:3107/api/transactions
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.8010.12 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 289
    - cookie: token=[REDACTED_SYNTHETIC_JWT]

```

# Page snapshot

```yaml
- generic [active] [ref=f4e1]:
  - generic [ref=f4e2]:
    - complementary "Navegação principal" [ref=f4e3]:
      - generic [ref=f4e4]:
        - generic [ref=f4e5]: P
        - generic [ref=f4e6]:
          - heading "Pessoa Sintética A" [level=2] [ref=f4e7]
          - generic [ref=f4e8]: cf003-a-rv24-e5aa3666-transaction-before@example.invalid
      - navigation [ref=f4e10]:
        - link "Dashboard" [ref=f4e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f4e19] [cursor=pointer]:
          - /url: /contas
        - link "Extrato" [ref=f4e24] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f4e30] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f4e35] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f4e40] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f4e47] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f4e55] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f4e62] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f4e69]:
        - button "Privacidade" [ref=f4e70] [cursor=pointer]
        - button "Configurações" [ref=f4e78] [cursor=pointer]
        - button "Sair da Conta" [ref=f4e83] [cursor=pointer]
    - main [ref=f4e89]:
      - generic [ref=f4e90]:
        - generic [ref=f4e92]:
          - generic [ref=f4e93]:
            - generic [ref=f4e95]:
              - heading "Extrato" [level=1] [ref=f4e96]
              - paragraph [ref=f4e97]: Histórico completo de movimentações.
            - generic [ref=f4e98]:
              - button "Mês anterior do extrato" [ref=f4e99] [cursor=pointer]
              - generic [ref=f4e102]: janeiro de 2027
              - button "Mês seguinte do extrato" [ref=f4e103] [cursor=pointer]
            - button "Lançar" [ref=f4e106] [cursor=pointer]
          - generic [ref=f4e108]:
            - generic [ref=f4e109]:
              - button "Tudo" [ref=f4e110] [cursor=pointer]
              - button "Entradas" [ref=f4e111] [cursor=pointer]
              - button "Saídas" [ref=f4e112] [cursor=pointer]
              - button "Transferências" [ref=f4e113] [cursor=pointer]: Transf.
            - button "Todas as Contas" [ref=f4e114]
          - button "Exportar período" [ref=f4e121]
        - main [ref=f4e122]:
          - status [ref=f4e123]:
            - paragraph [ref=f4e124]: "Total do período indisponível: Período parcialmente coberto; somente valores registrados estão disponíveis."
            - paragraph [ref=f4e125]: "Base conhecida: 15/01/2027. Referência: 15/01/2027."
            - generic [ref=f4e126]:
              - paragraph [ref=f4e127]: "Subtotais observados nos registros (não representam o total completo):"
              - paragraph [ref=f4e128]:
                - text: "Entradas:"
                - generic [ref=f4e129]: R$ 0,00
              - paragraph [ref=f4e130]:
                - text: "Saídas:"
                - generic [ref=f4e131]: R$ 25,00
              - paragraph [ref=f4e132]:
                - text: "Fluxo líquido:"
                - generic [ref=f4e133]: R$ -25,00
          - generic [ref=f4e134]:
            - generic [ref=f4e140]:
              - paragraph [ref=f4e141]: Entradas de caixa realizadas
              - generic [ref=f4e142]: Indisponível
            - generic [ref=f4e148]:
              - paragraph [ref=f4e149]: Saídas de caixa realizadas
              - generic [ref=f4e150]: Indisponível
            - generic [ref=f4e156]:
              - paragraph [ref=f4e157]: Fluxo líquido do período
              - generic [ref=f4e158]: Indisponível
          - generic [ref=f4e160]:
            - heading "sex., 15 de jan." [level=3] [ref=f4e161]
            - generic [ref=f4e163] [cursor=pointer]:
              - generic [ref=f4e169]:
                - generic [ref=f4e170]: rv24-e5aa3666-transaction-before
                - generic [ref=f4e172]:
                  - generic "Horário informado" [ref=f4e177]: 09:00
                  - generic [ref=f4e178]: Alimentação
                  - generic [ref=f4e179]: Realizado
                  - generic [ref=f4e181]: rv24-e5aa3666-transaction-before
              - generic [ref=f4e185]: "- R$ 25,00"
  - button "Open Next.js Dev Tools" [ref=f4e193] [cursor=pointer]
  - alert [ref=f4e197]
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import { registerSyntheticUser, syntheticUser } from "./support/synthetic-auth";
  3   | import { join } from "node:path";
  4   | 
  5   | for (const kind of ["transaction", "investment"] as const) for (const mode of ["lost", "before", "unavailable"] as const) {
  6   |   test(`RV24 ${kind} ${mode}: browser BFF PostgreSQL reload exact replay and isolation`, async ({ page, browser }) => {
  7   |     const tag = `${process.env.CF_E2E_NAMESPACE}-${kind}-${mode}`;
  8   |     await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));
  9   |     await registerSyntheticUser(page, syntheticUser("A", tag));
  10  |     const created = await page.request.post("/api/accounts", { data: { name: tag, type: "CHECKING", initialBalance: 1000, color: "BLUE" } });
  11  |     expect(created.ok()).toBe(true); const account = await created.json();
  12  |     const categories = await (await page.request.get("/api/categories?type=EXPENSE")).json();
  13  |     let assetId: string;
  14  |     if (kind === "investment") {
  15  |       const asset = await page.request.post("/api/investments", { data: { name: tag, ticker: "RV24", type: "STOCK", openingQuantity: "10", openingCost: "1000", openingValue: "1000", valuationDate: "2027-01-15", valuationSource: "SYNTHETIC" } });
  16  |       expect(asset.ok(), await asset.text()).toBe(true); assetId = (await asset.json()).id;
  17  |     }
  18  |     const open = async () => {
  19  |       if (kind === "transaction") { await page.goto("/extrato"); await page.getByRole("button", { name: "Lançar", exact: true }).click(); }
  20  |       else { await page.goto("/investimentos"); await page.getByText("RV24", { exact: true }).click(); await page.getByRole("button", { name: "Aportar", exact: true }).click(); }
  21  |       return page.getByRole("dialog", { name: kind === "transaction" ? "Nova Transação" : "RV24 - Operação", exact: true });
  22  |     };
  23  |     let modal = await open();
  24  |     if (kind === "transaction") {
  25  |       await modal.getByLabel("Valor do lançamento").fill("25.00"); await modal.getByLabel("Descrição do lançamento").fill(tag);
  26  |       await modal.getByLabel("Categoria do lançamento").selectOption(categories[0].id); await modal.getByLabel("Conta do lançamento").selectOption(account.id);
  27  |       await modal.getByLabel("Data do lançamento").fill("2027-01-15");
  28  |     } else { await modal.getByPlaceholder("0", { exact: true }).fill("2"); await modal.getByPlaceholder("0,00", { exact: true }).fill("100"); await modal.getByLabel("Conta", { exact: true }).selectOption(account.id); }
  29  |     const endpoint = kind === "transaction" ? "/transactions" : "/investments/operation";
  30  |     if (mode === "before") expect((await page.request.post("/api/rv24-probe/fault", { data: { enabled: true } })).status()).toBe(204);
  31  |     let posts = 0; let original: Record<string, unknown>;
  32  |     await page.route(`**/api${endpoint}`, async route => {
  33  |       if (route.request().method() !== "POST") { await route.continue(); return; }
  34  |       posts++; const command = route.request().postDataJSON();
  35  |       if (posts === 1) {
  36  |         original = command;
  37  |         expect(typeof command.operationId).toBe("string");
  38  |         const response = await route.fetch();
  39  |         if (mode === "before") { expect(response.status()).toBe(500); await route.fulfill({ response }); }
  40  |         else { expect(response.ok(), await response.text()).toBe(true); await route.abort("connectionclosed"); }
  41  |       } else { expect(command).toEqual(original!); await route.continue(); }
  42  |     });
  43  |     await modal.getByRole("button", { name: kind === "transaction" ? "Salvar Transação" : "Confirmar Operação", exact: true }).click();
  44  |     await expect(modal.getByRole("alert")).toContainText("Não foi possível confirmar");
  45  |     await expect(modal.getByRole("button", { name: kind === "transaction" ? "Salvar Transação" : "Confirmar Operação", exact: true })).toBeDisabled();
  46  |     expect(posts).toBe(1);
  47  |     const identity = String(original!.operationId);
  48  |     const receipt = await page.request.get(`/api/financial-intents/${identity}`);
  49  |     expect(receipt.status()).toBe(mode === "before" ? 404 : 200);
  50  |     if (mode === "before") {
  51  |       const unchanged = await (await page.request.get("/api/accounts")).json();
  52  |       expect(unchanged.find((a: { id: string }) => a.id === account.id).balance).toBe(1000);
  53  |       if (kind === "investment") {
  54  |         expect((await (await page.request.get(`/api/investments/${assetId!}/history`)).json())).toHaveLength(0);
  55  |         const positions = await (await page.request.get("/api/investments")).json(); expect(positions.find((a: { id: string }) => a.id === assetId).quantity).toBe(10);
  56  |       }
  57  |       expect((await page.request.post("/api/rv24-probe/fault", { data: { enabled: false } })).status()).toBe(204);
  58  |     }
  59  |     await modal.getByRole("button", { name: "Fechar modal" }).click();
  60  |     modal = await open(); await expect(modal.getByRole("button", { name: "Repetir a mesma intenção" })).toBeEnabled();
  61  |     await page.reload(); modal = await open();
  62  |     if (mode === "unavailable") await page.route(`**/api/financial-intents/${identity}`, route => route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"synthetic recovery outage"}' }));
  63  |     await modal.getByRole("button", { name: "Consultar recibo" }).click();
  64  |     if (mode === "lost") await expect(modal).toHaveCount(0);
  65  |     else {
  66  |       await expect(modal.getByRole("alert")).toContainText(mode === "before" ? "pode estar em andamento" : "synthetic recovery outage");
  67  |       expect(posts).toBe(1);
  68  |       await modal.getByRole("button", { name: "Repetir a mesma intenção" }).click(); await expect(modal).toHaveCount(0);
  69  |     }
> 70  |     const replay = await page.request.post(`/api${endpoint}`, { data: original! }); expect(replay.ok(), await replay.text()).toBe(true);
      |                                       ^ Error: apiRequestContext.post: read ECONNRESET
  71  |     const balance = async () => (await (await page.request.get("/api/accounts")).json()).find((a: { id: string }) => a.id === account.id).balance;
  72  |     expect(await balance()).toBe(kind === "transaction" ? 975 : 800);
  73  |     const different = { ...original!, [kind === "transaction" ? "amount" : "quantity"]: kind === "transaction" ? "30" : 3 };
  74  |     const conflict = await page.request.post(`/api${endpoint}`, { data: different }); expect(conflict.status()).toBe(409);
  75  |     expect(await balance()).toBe(kind === "transaction" ? 975 : 800);
  76  |     const other = await browser.newContext({ baseURL: process.env.CF_TEST_BASE_URL ?? "http://127.0.0.1:3107" });
  77  |     try {
  78  |       const otherPage = await other.newPage(); await registerSyntheticUser(otherPage, syntheticUser("B", tag));
  79  |       expect((await otherPage.request.get(`/api/financial-intents/${identity}`)).status()).toBe(404);
  80  |       expect((await otherPage.request.post(`/api${endpoint}`, { data: original! })).status()).toBe(409);
  81  |     } finally { await other.close(); }
  82  |     // A second identical legitimate intent, created through the same real form, has its own ID.
  83  |     await page.unroute(`**/api${endpoint}`); modal = await open();
  84  |     if (kind === "transaction") {
  85  |       await modal.getByLabel("Valor do lançamento").fill("25.00"); await modal.getByLabel("Descrição do lançamento").fill(tag);
  86  |       await modal.getByLabel("Categoria do lançamento").selectOption(categories[0].id); await modal.getByLabel("Conta do lançamento").selectOption(account.id);
  87  |       await modal.getByLabel("Data do lançamento").fill("2027-01-15"); await modal.getByLabel("Horário informado (opcional)").fill(String(original!.time));
  88  |     } else { await modal.getByPlaceholder("0", { exact: true }).fill("2"); await modal.getByPlaceholder("0,00", { exact: true }).fill("100"); await modal.getByLabel("Conta", { exact: true }).selectOption(account.id); }
  89  |     const next = page.waitForRequest(r => r.url().endsWith(`/api${endpoint}`) && r.method() === "POST");
  90  |     await modal.getByRole("button", { name: kind === "transaction" ? "Salvar Transação" : "Confirmar Operação", exact: true }).click();
  91  |     const second = (await next).postDataJSON(); expect(second.operationId).not.toBe(identity); expect(second).toEqual({ ...original!, operationId: second.operationId });
  92  |     await expect(modal).toHaveCount(0); await page.reload();
  93  |     expect(await balance()).toBe(kind === "transaction" ? 950 : 600);
  94  |     if (kind === "investment") {
  95  |       const assets = await (await page.request.get("/api/investments")).json(); expect(assets.find((a: { id: string }) => a.id === assetId).quantity).toBe(14);
  96  |       const history = await (await page.request.get(`/api/investments/${assetId!}/history`)).json(); expect(history).toHaveLength(2);
  97  |     } else {
  98  |       const facts = await (await page.request.get("/api/transactions?month=1&year=2027&size=100")).json(); expect(facts.content.filter((t: { description: string }) => t.description === tag)).toHaveLength(2);
  99  |     }
  100 |     if(kind === "transaction") {
  101 |       await expect(page.getByRole("button", {name:"Lançar",exact:true})).toBeVisible();
  102 |       await expect(page.getByText(tag,{exact:true}).first()).toBeVisible();
  103 |     } else await expect(page.getByText("RV24",{exact:true})).toBeVisible();
  104 |     await page.screenshot({ path: join(process.env.CF_REVIEW_EVIDENCE!, `${kind}-${mode}.png`), fullPage: true });
  105 |   });
  106 | }
  107 | 
```