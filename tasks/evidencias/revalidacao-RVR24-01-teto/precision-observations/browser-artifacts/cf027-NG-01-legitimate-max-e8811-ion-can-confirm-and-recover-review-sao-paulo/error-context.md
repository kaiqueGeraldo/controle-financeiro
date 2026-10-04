# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cf027.spec.ts >> NG-01 legitimate maximum quantity redemption can confirm and recover
- Location: ..\..\..\..\..\AppData\Local\Temp\rv24-residual-25b6425e89fd403dadfe33bef5af9229\browser\cf027.spec.ts:5:5

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "\"quantity\":999999999999.99999999"
Received string:    "{\"operationId\":\"1fe6a720-117a-4444-9e5e-8bdbe7bccdbe\",\"kind\":\"INVESTMENT_OPERATION\",\"recordedAt\":\"2027-01-15T12:00:00.123456Z\",\"result\":{\"id\":\"c0a3f7b1-1413-47d1-8a32-e4e6612b6d8d\",\"type\":\"SELL\",\"date\":\"2027-01-15\",\"quantity\":1.0E12,\"price\":0.0,\"totalValue\":1.0,\"fees\":0,\"costDelta\":1.0,\"realizedResult\":0.0,\"dateOrigin\":\"USER_INPUT\",\"legacyDateRaw\":\"2027-01-15T00:00:00\"}}"
```

```
Error: expect(received).toHaveLength(expected)

Expected length: 0
Received length: 1
Received array:  [["cf-creation:v1:4720db29-5685-43c0-aa9c-f7551053acee:INVESTMENT_OPERATION", "{\"version\":1,\"ownerId\":\"4720db29-5685-43c0-aa9c-f7551053acee\",\"kind\":\"INVESTMENT_OPERATION\",\"label\":\"NGMAX — SELL\",\"command\":{\"investmentId\":\"e334e40d-a15d-46f7-a23c-ade43bf1ddf4\",\"amount\":\"1.00\",\"type\":\"SELL\",\"quantity\":1,\"price\":1,\"date\":\"2027-01-15\",\"accountId\":\"c944ac4f-cddc-4a52-a4dc-a5822b2f88ed\",\"fees\":0,\"operationId\":\"1fe6a720-117a-4444-9e5e-8bdbe7bccdbe\"}}"]]
```

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('dialog', { name: 'NGMAX - Operação', exact: true })
Expected: 0
Received: 1
Timeout:  15000ms

Call log:
  - Expect "soft toHaveCount" getByRole('dialog', { name: 'NGMAX - Operação', exact: true }) with timeout 15000ms
  - waiting for getByRole('dialog', { name: 'NGMAX - Operação', exact: true })
    33 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - complementary "Navegação principal" [ref=f1e3]:
      - generic [ref=f1e4]:
        - generic [ref=f1e5]: P
        - generic [ref=f1e6]:
          - heading "Pessoa Sintética A" [level=2] [ref=f1e7]
          - generic [ref=f1e8]: cf003-a-rv24-65474244-precision@example.invalid
      - navigation [ref=f1e10]:
        - link "Dashboard" [ref=f1e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f1e19] [cursor=pointer]:
          - /url: /contas
        - link "Extrato" [ref=f1e24] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f1e30] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f1e35] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f1e40] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f1e47] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f1e55] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f1e62] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f1e69]:
        - button "Privacidade" [ref=f1e70] [cursor=pointer]
        - button "Configurações" [ref=f1e78] [cursor=pointer]
        - button "Sair da Conta" [ref=f1e83] [cursor=pointer]
    - main [ref=f1e89]:
      - generic [ref=f1e90]:
        - generic [ref=f1e92]:
          - generic [ref=f1e93]:
            - heading "Investimentos" [level=1] [ref=f1e94]
            - paragraph [ref=f1e95]: Acompanhe a evolução do seu patrimônio.
          - button "Novo Ativo" [ref=f1e96] [cursor=pointer]
        - main [ref=f1e99]:
          - generic [ref=f1e100]:
            - generic [ref=f1e101]:
              - generic [ref=f1e102]: Investimentos avaliados
              - generic [ref=f1e108]: R$ 0,00
            - generic [ref=f1e109]:
              - generic [ref=f1e110]: Rentabilidade Geral
              - generic [ref=f1e117]:
                - text: Indisponível
                - generic [ref=f1e118]: +R$ 0,00
          - heading "Sua Carteira" [level=2] [ref=f1e120]
          - generic [ref=f1e123] [cursor=pointer]:
            - generic [ref=f1e130]:
              - heading "NGMAX" [level=3] [ref=f1e131]
              - text: Renda Fixa
            - generic [ref=f1e132]: R$ 0,00
            - generic [ref=f1e134]:
              - generic [ref=f1e135]: Alocação
              - generic [ref=f1e136]: Indisponível
  - button "Open Next.js Dev Tools" [ref=f1e144] [cursor=pointer]
  - alert [ref=f1e148]
  - dialog [ref=f1e150]:
    - generic [ref=f1e151]:
      - heading "NGMAX - Operação" [level=2] [ref=f1e152]
      - button "Fechar modal" [ref=f1e153]
    - generic [ref=f1e158]:
      - alert [ref=f1e159]:
        - paragraph [ref=f1e160]: Não foi possível confirmar a operação. Consulte o recibo ou repita somente a mesma intenção. Resultado financeiro inválido; a operação continua pendente de confirmação.
        - paragraph [ref=f1e161]: "Operação anterior: NGMAX — SELL · 2027-01-15 · Quantidade 1, preço 1, taxas 0."
        - paragraph [ref=f1e162]: Fechar ou recarregar preserva esta intenção nesta aba. Perder o armazenamento exige conferir o histórico; a identidade perdida não pode ser recuperada automaticamente.
        - button "Consultar recibo" [ref=f1e163]
        - button "Repetir a mesma intenção" [ref=f1e164]
      - group [ref=f1e165]:
        - generic [ref=f1e166]:
          - button "Ajustar Saldo" [disabled] [ref=f1e167]
          - button "Aportar" [disabled] [ref=f1e173]
          - button "Resgatar" [disabled] [ref=f1e177]
        - generic [ref=f1e181]:
          - generic [ref=f1e182]:
            - text: Valor da Operação
            - generic [ref=f1e183]:
              - generic [ref=f1e184]: R$
              - spinbutton "Valor informado" [disabled] [ref=f1e185]: "1.00"
          - generic [ref=f1e186]:
            - text: Taxas / retenções
            - spinbutton "Taxas / retenções" [disabled] [ref=f1e187]
          - generic [ref=f1e188]:
            - generic [ref=f1e189]:
              - text: Data
              - textbox [disabled] [ref=f1e193]: 2027-01-15
            - generic [ref=f1e194]:
              - text: Conta
              - combobox "Conta" [disabled] [ref=f1e199] [cursor=pointer]:
                - option "Carteira Física" [disabled]
                - option "rv24-65474244-precision" [disabled] [selected]
              - paragraph [ref=f1e200]:
                - generic [ref=f1e201]: "Disponível:"
                - generic [ref=f1e202]: R$ 1.001,00
          - button "Confirmar Operação" [disabled] [ref=f1e203] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { registerSyntheticUser, syntheticUser } from "C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro/controle-financeiro-frontend/tests/e2e/support/synthetic-auth";
  3  | import { writeFileSync } from "node:fs";
  4  | import { join } from "node:path";
  5  | test("NG-01 legitimate maximum quantity redemption can confirm and recover",async({page})=>{
  6  |   const out=process.env.CF_REVIEW_EVIDENCE!;
  7  |   const tag=`${process.env.CF_E2E_NAMESPACE}-precision`;
  8  |   await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));
  9  |   await registerSyntheticUser(page,syntheticUser("A",tag));
  10 |   const accountResponse=await page.request.post("/api/accounts",{data:{name:tag,type:"CHECKING",initialBalance:1000,color:"BLUE"}});
  11 |   expect(accountResponse.ok()).toBe(true); const account=await accountResponse.json();
  12 |   const assetResponse=await page.request.post("/api/investments",{data:{name:tag,ticker:"NGMAX",type:"FIXED_INCOME",openingQuantity:"999999999999.99999999",openingCost:"1.00",openingValue:"1.00",valuationDate:"2027-01-15",valuationSource:"SYNTHETIC"}});
  13 |   writeFileSync(join(out,"opening-raw.json"),await assetResponse.text());
  14 |   expect(assetResponse.ok()).toBe(true);
  15 |   await page.goto("/investimentos");await page.getByText("NGMAX",{exact:true}).click();
  16 |   await page.getByRole("button",{name:"Aportar",exact:true}).click();
  17 |   const modal=page.getByRole("dialog",{name:"NGMAX - Operação",exact:true});
  18 |   await modal.getByRole("button",{name:"Resgatar",exact:true}).click();
  19 |   await modal.getByLabel("Valor informado").fill("1.00");
  20 |   await modal.getByLabel("Conta",{exact:true}).selectOption(account.id);
  21 |   let posts=0;let original:Record<string,unknown>={};
  22 |   page.on("request",r=>{if(r.url().endsWith("/api/investments/operation")&&r.method()==="POST"){posts++;original=r.postDataJSON();}});
  23 |   const pendingResponse=page.waitForResponse(r=>r.url().endsWith("/api/investments/operation")&&r.request().method()==="POST");
  24 |   await modal.getByRole("button",{name:"Confirmar Operação",exact:true}).click();
  25 |   const actual=await pendingResponse;const raw=await actual.text();writeFileSync(join(out,"operation-raw.json"),raw);
  26 |   expect(actual.ok()).toBe(true);expect(raw).toContain('"quantity":999999999999.99999999');
  27 |   expect(JSON.parse(raw).quantity).toBe(1000000000000);
  28 |   const receiptResponse=await page.request.get(`/api/financial-intents/${original.operationId}`);
  29 |   const receiptRaw=await receiptResponse.text();writeFileSync(join(out,"receipt-raw.json"),receiptRaw);
  30 |   expect(receiptResponse.ok()).toBe(true);expect.soft(receiptRaw).toContain('"quantity":999999999999.99999999');
  31 |   // If the legitimate response was rejected, exercise actual UI recovery, without modifying any response.
  32 |   if(await modal.getByRole("button",{name:"Consultar recibo"}).isVisible()){
  33 |     const recovery=page.waitForResponse(r=>r.url().endsWith(`/api/financial-intents/${original.operationId}`));
  34 |     await modal.getByRole("button",{name:"Consultar recibo"}).click();await recovery;
  35 |   }
  36 |   const state=await(await page.request.get("/api/rv24-probe/state")).json();
  37 |   expect(state.accounts).toEqual([{balance:1001}]);
  38 |   expect(state.operations).toHaveLength(1);expect(state.operations[0].total_value).toBe(1);
  39 |   expect(state.receipts).toEqual([{id:original.operationId,gross:1}]);
  40 |   expect(posts).toBe(1);
  41 |   const saved=await page.evaluate(()=>Object.entries(sessionStorage).filter(([k])=>k.startsWith("cf-creation:")));
  42 |   writeFileSync(join(out,"precision-state.json"),JSON.stringify({original,posts,state,saved,parsedQuantity:JSON.parse(raw).quantity},null,2));
  43 |   await page.screenshot({path:join(out,"legitimate-pending.png"),fullPage:true});
  44 |   expect.soft(saved).toHaveLength(0);
> 45 |   await expect.soft(modal).toHaveCount(0);
     |                            ^ Error: expect(locator).toHaveCount(expected) failed
  46 | });
  47 | 
```