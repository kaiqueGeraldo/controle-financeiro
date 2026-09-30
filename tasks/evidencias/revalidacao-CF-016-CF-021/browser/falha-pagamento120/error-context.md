# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: milestone-remediation.integrated.spec.ts >> SAN-BC-card compra, exclusão e reembolso após pagamento 120 pela UI
- Location: tests\e2e\milestone-remediation.integrated.spec.ts:47:35

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('dialog', { name: 'Pagar Fatura - SAN cartão 120', exact: true })
Expected: 0
Received: 1
Timeout:  15000ms

Call log:
  - Expect "toHaveCount" getByRole('dialog', { name: 'Pagar Fatura - SAN cartão 120', exact: true }) with timeout 15000ms
  - waiting for getByRole('dialog', { name: 'Pagar Fatura - SAN cartão 120', exact: true })
    33 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=f3e1]:
  - generic [ref=f3e2]:
    - complementary "Navegação principal" [ref=f3e3]:
      - generic [ref=f3e4]:
        - generic [ref=f3e5]: P
        - generic [ref=f3e6]:
          - heading "Pessoa Sintética A" [level=2] [ref=f3e7]
          - generic [ref=f3e8]: cf003-a-san1821-f7516a59-goal-card-120@example.invalid
      - navigation [ref=f3e10]:
        - link "Dashboard" [ref=f3e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f3e19] [cursor=pointer]:
          - /url: /contas
        - link "Extrato" [ref=f3e24] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f3e30] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f3e35] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f3e40] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f3e47] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f3e55] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f3e62] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f3e69]:
        - button "Privacidade" [ref=f3e70] [cursor=pointer]
        - button "Configurações" [ref=f3e78] [cursor=pointer]
        - button "Sair da Conta" [ref=f3e83] [cursor=pointer]
    - main [ref=f3e89]:
      - generic [ref=f3e90]:
        - generic [ref=f3e92]:
          - generic [ref=f3e93]:
            - heading "Carteira" [level=1] [ref=f3e94]
            - paragraph [ref=f3e95]: Gestão de crédito e faturas.
          - generic [ref=f3e96]:
            - button "Lançar Compra" [ref=f3e97] [cursor=pointer]
            - button "Novo Cartão" [ref=f3e102] [cursor=pointer]
        - main [ref=f3e105]:
          - generic [ref=f3e106]:
            - generic [ref=f3e111]:
              - paragraph [ref=f3e112]: Limite Global
              - generic [ref=f3e113]: R$ 1.000,00
            - generic [ref=f3e119]:
              - paragraph [ref=f3e120]: Faturas Abertas
              - generic [ref=f3e121]: R$ 0,00
            - generic [ref=f3e127]:
              - paragraph [ref=f3e128]: Disponível
              - generic [ref=f3e129]: R$ 1.000,00
          - heading "Cartões Ativos" [level=2] [ref=f3e131]
          - button "Ver fatura de SAN cartão 120, final 4242" [ref=f3e133] [cursor=pointer]:
            - generic:
              - generic:
                - img "Logo da bandeira VISA"
              - generic:
                - paragraph: •••• 4242
                - generic:
                  - paragraph: SAN cartão 120
                  - paragraph: Vence dia 28
            - generic [ref=f3e135]:
              - generic [ref=f3e136]:
                - paragraph [ref=f3e137]: Fatura Atual
                - generic [ref=f3e138]: R$ 0,00
              - generic [ref=f3e139]:
                - paragraph [ref=f3e140]: Disponível
                - generic [ref=f3e141]: R$ 1.000,00
  - button "Open Next.js Dev Tools" [ref=f3e148] [cursor=pointer]
  - alert [ref=f3e152]
  - generic [ref=f3e153]:
    - generic [ref=f3e154] [cursor=pointer]
    - dialog [ref=f3e155]:
      - generic [ref=f3e156]:
        - generic [ref=f3e157]:
          - button "Mês anterior da fatura" [ref=f3e158] [cursor=pointer]
          - generic [ref=f3e161]: janeiro de 2027
          - button "Próximo mês da fatura" [ref=f3e165] [cursor=pointer]
        - button "Fechar detalhes da fatura" [active] [ref=f3e168] [cursor=pointer]
      - generic [ref=f3e173]:
        - generic [ref=f3e174]:
          - paragraph [ref=f3e175]: SAN cartão 120 •••• 4242
          - paragraph [ref=f3e176]: R$ 120,00
          - paragraph [ref=f3e177]: "Consumo original · Saldo pagável: R$ 0,00 · Crédito: R$ 0,00"
          - generic [ref=f3e178]:
            - generic "Data em que as compras passam para o próximo mês" [ref=f3e179]: "Fecha: 20 de jan"
            - generic "Data limite para pagamento" [ref=f3e181]: "Vence: 28 de jan"
        - generic [ref=f3e183]: Aberta
      - generic [ref=f3e185]:
        - generic [ref=f3e191]:
          - paragraph [ref=f3e192]: "Compra Meta: SAN compra cartão 120"
          - paragraph [ref=f3e193]:
            - text: 15/01/2027
            - generic [ref=f3e195]: Metas e Objetivos
          - group [ref=f3e196]:
            - generic "Horário e registro" [ref=f3e197] [cursor=pointer]
        - generic [ref=f3e198]:
          - generic [ref=f3e199]: R$ 120,00
          - generic [ref=f3e200]:
            - button [ref=f3e201] [cursor=pointer]
            - button [ref=f3e205] [cursor=pointer]
      - generic [ref=f3e209]:
        - generic [ref=f3e210]:
          - 'button "Limite: R$ 1.000,00" [ref=f3e211] [cursor=pointer]'
          - button "Excluir" [ref=f3e215] [cursor=pointer]
        - button "Fatura Zerada" [disabled] [ref=f3e219] [cursor=pointer]
  - dialog [ref=f3e224]:
    - generic [ref=f3e225]:
      - heading "Pagar Fatura - SAN cartão 120" [level=2] [ref=f3e226]
      - button "Fechar modal" [ref=f3e227]
    - generic [ref=f3e232]:
      - paragraph [ref=f3e233]: "Saldo pagável: R$ 0,00 · Consumo original: R$ 120,00 · Crédito no cartão: R$ 0,00"
      - group [ref=f3e234]:
        - generic [ref=f3e235]:
          - button "Fechamento" [disabled] [ref=f3e236]
          - button "Adiantamento" [disabled] [ref=f3e237]
        - generic [ref=f3e238]:
          - text: Pagar com
          - combobox "Pagar com" [disabled] [ref=f3e243] [cursor=pointer]:
            - 'option "Carteira Física (Saldo: R$ 0.00)" [disabled]'
            - 'option "SAN banco cartão (Saldo: R$ 880.00)" [disabled] [selected]'
        - generic [ref=f3e244]:
          - text: Valor do Pagamento
          - spinbutton "Valor do Pagamento" [disabled] [ref=f3e248]: "120"
        - generic [ref=f3e249]:
          - generic [ref=f3e250]:
            - text: Data do Pagamento
            - textbox "Data do Pagamento" [disabled] [ref=f3e251]: 2027-01-15
          - generic [ref=f3e252]:
            - text: Hora
            - textbox "Horário informado (opcional)" [disabled] [ref=f3e253]: 09:00
      - button [disabled] [ref=f3e254] [cursor=pointer]
```

# Test source

```ts
  1   | import {expect,test,type Page} from "@playwright/test";
  2   | import {mkdir,writeFile} from "node:fs/promises";
  3   | import path from "node:path";
  4   | import {registerSyntheticUser,syntheticUser} from "./support/synthetic-auth";
  5   | const dir=process.env.CF_REVIEW_EVIDENCE!;
  6   | const ns=process.env.CF_E2E_NAMESPACE!;
  7   | async function start(page:Page,suffix:string){await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));await registerSyntheticUser(page,syntheticUser("A",`${ns}-${suffix}`));}
  8   | async function post(page:Page,url:string,data:unknown){
  9   |  // Synthetic fixtures explicitly serialize the new opening contract; legacy commands retain their transport.
  10  |  if(url==="/investments"&&data&&typeof data==="object"){
  11  |    const payload={...data} as Record<string,unknown>;
  12  |    for(const field of ["openingQuantity","openingCost","openingValue"])if(payload[field]!=null)payload[field]=String(payload[field]);
  13  |    data=payload;
  14  |  }
  15  |  const r=await page.request.post(`/api${url}`,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;
  16  | }
  17  | async function json(page:Page,url:string){const r=await page.request.get(`/api${url}`);expect(r.ok(),await r.text()).toBe(true);return r.json();}
  18  | 
  19  | test("SAN-E27 provento bruto e retenção pela UI conciliam caixa líquido e XLSX",async({page})=>{
  20  |  await start(page,"net-cash");
  21  |  const a=await post(page,"/accounts",{name:"SAN caixa proventos",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  22  |  await post(page,"/investments",{ticker:"SANCASH",name:"Provento líquido",type:"STOCK",openingQuantity:10,openingCost:200,openingValue:250,valuationDate:"2027-01-15",valuationSource:"USER_PROVIDED"});
  23  |  await page.goto("/investimentos");await page.getByText("SANCASH",{exact:true}).click();await page.getByRole("button",{name:"Aportar",exact:true}).click();
  24  |  const modal=page.getByRole("dialog",{name:"SANCASH - Operação",exact:true});
  25  |  await modal.getByRole("button",{name:"Proventos",exact:true}).click();
  26  |  await modal.getByLabel("Valor bruto do provento (antes de retenções)").fill("10");await modal.getByLabel("Taxas / retenções").fill("1");await modal.getByLabel("Conta",{exact:true}).selectOption(a.id);
  27  |  await expect(modal.getByText(/A conta recebe apenas o líquido/)).toContainText("9,00");
  28  |  const response=page.waitForResponse(r=>r.url().endsWith("/investments/operation")&&r.request().method()==="POST");
  29  |  await modal.getByRole("button",{name:"Confirmar Operação",exact:true}).click();expect((await response).ok()).toBe(true);
  30  |  await page.goto("/extrato");await page.reload();
  31  |  const rows=(await json(page,"/transactions?month=1&year=2027&size=100")).content;
  32  |  const dividend=rows.find((t:{origin:string})=>t.origin==="INVESTMENT_DIVIDEND");const fee=rows.find((t:{origin:string})=>t.origin==="INVESTMENT_FEE");
  33  |  expect([dividend.amount,dividend.cashAmount,dividend.cashDelta]).toEqual([10,9,9]);expect([fee.amount,fee.cashAmount,fee.cashDelta]).toEqual([1,0,0]);
  34  |  expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(1009);
  35  |  const cash=await json(page,"/transactions/summary?month=1&year=2027");expect([cash.entries,cash.exits,cash.balance]).toEqual([null,null,null]);expect([Number(cash.observed.entries),Number(cash.observed.exits),Number(cash.observed.balance)]).toEqual([9,0,9]);expect(cash.coverage.state).toBe("PARTIAL");
  36  |  await expect(page.getByText("Bruto: R$ 10,00",{exact:true})).toBeVisible();await expect(page.getByText("Bruto: R$ 1,00",{exact:true})).toBeVisible();
  37  |  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await page.getByText("Proventos: SANCASH",{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,`san-e27-extrato-${width}.png`),animations:"disabled"});}
  38  |  const download=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar período",exact:true}).click();await (await download).saveAs(path.join(dir,"san-e27-caixa.xlsx"));
  39  |  await writeFile(path.join(dir,"san-e27-cash.json"),JSON.stringify({dividend,fee,cash},null,2));
  40  |  await page.goto("/");await page.reload();
  41  |  const recent=page.getByRole("heading",{name:"Extrato Recente",exact:true}).locator("..");
  42  |  await expect(recent.getByText(/\+\s*R\$\s*9,00/)).toBeVisible();
  43  |  await expect(recent.getByText("Bruto: R$ 10,00",{exact:true})).toBeVisible();
  44  |  await expect(recent.getByText(/\+\s*R\$\s*10,00/)).toHaveCount(0);
  45  | });
  46  | 
  47  | for(const payment of [20,120])test(`SAN-BC-card compra, exclusão e reembolso após pagamento ${payment} pela UI`,async({page})=>{
  48  |  await start(page,`goal-card-${payment}`);
  49  |  const a=await post(page,"/accounts",{name:"SAN banco cartão",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  50  |  const c=await post(page,"/cards",{name:`SAN cartão ${payment}`,last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"});
  51  |  const g=await post(page,"/goals",{title:`SAN meta cartão ${payment}`,targetValue:1000,deadline:"2028-01-01",type:"MONETARY",useChecklist:true,color:"BLUE"});
  52  |  const name=`SAN compra cartão ${payment}`;
  53  |  await page.goto("/metas");await page.getByText(g.title,{exact:true}).click();await page.getByRole("button",{name:/Adicionar.*item/i}).click();
  54  |  await page.getByPlaceholder("Nome do item (ex: Processador)").fill(name);await page.getByPlaceholder(/Valor|Estimado|Preço/i).fill("120");
  55  |  const added=page.waitForResponse(r=>r.url().endsWith(`/goals/${g.id}/items`)&&r.request().method()==="POST");await page.getByRole("button",{name:"Adicionar",exact:true}).click();expect((await added).ok()).toBe(true);
  56  |  await page.reload();await page.getByText(g.title,{exact:true}).click();await page.getByRole("button",{name:`Comprar ${name}`,exact:true}).click();
  57  |  await page.locator("select").filter({has:page.locator(`option[value="CARD_${c.id}"]`)}).selectOption(`CARD_${c.id}`);
  58  |  const bought=page.waitForResponse(r=>r.url().endsWith("/purchase")&&r.request().method()==="PATCH");await page.getByRole("button",{name:"Confirmar",exact:true}).click();expect((await bought).ok()).toBe(true);
  59  |  await page.goto("/cartoes");await page.getByRole("button",{name:`Ver fatura de ${c.name}, final 4242`}).click();
  60  |  await page.getByRole("dialog",{name:`${c.name} •••• 4242`}).getByRole("button",{name:/^(Pagar|Adiantar)/}).click();
  61  |  const pay=page.getByRole("dialog",{name:`Pagar Fatura - ${c.name}`,exact:true});await pay.getByRole("button",{name:"Adiantamento",exact:true}).click();await pay.getByLabel("Valor do Pagamento").fill(String(payment));await pay.getByLabel("Pagar com").selectOption(a.id);
> 62  |  const paid=page.waitForResponse(r=>r.url().endsWith(`/cards/${c.id}/pay`)&&r.request().method()==="POST");await pay.getByRole("button",{name:"Confirmar Pagamento",exact:true}).click();expect((await paid).ok()).toBe(true);await expect(pay).toHaveCount(0);
      |                                                                                                                                                                                                                                                 ^ Error: expect(locator).toHaveCount(expected) failed
  63  |  await page.goto("/metas");await page.getByText(g.title,{exact:true}).click();await page.getByRole("button",{name:"Deletar Meta",exact:true}).click();
  64  |  const deleted=page.waitForResponse(r=>r.url().endsWith(`/goals/${g.id}`)&&r.request().method()==="DELETE");await page.getByRole("dialog",{name:"Excluir Meta",exact:true}).getByRole("button",{name:"Excluir",exact:true}).click();expect((await deleted).status()).toBe(204);
  65  |  await page.reload();const history=page.getByRole("region",{name:"Histórico de compras"});await expect(history.getByText(name,{exact:true})).toBeVisible();
  66  |  const refunded=page.waitForResponse(r=>r.url().endsWith("/refund")&&r.request().method()==="POST");await history.getByRole("button",{name:"Reembolsar compra",exact:true}).click();expect((await refunded).ok()).toBe(true);
  67  |  await page.reload();await expect(history.getByText("Reembolsada",{exact:true})).toBeVisible();
  68  |  const invoice=await json(page,`/cards/${c.id}/invoice?month=1&year=2027`);expect(invoice.payableAmount).toBe(0);
  69  |  expect((await json(page,"/cards")).find((v:{id:string})=>v.id===c.id).creditBalance).toBe(payment);
  70  |  expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(1000-payment);
  71  |  const fact=(await json(page,"/goals/purchases"))[0];const retry=await page.request.post(`/api/goals/items/${fact.itemId}/refund`);expect(retry.status()).toBe(400);
  72  |  expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(1000-payment);
  73  |  expect((await json(page,"/cards")).find((v:{id:string})=>v.id===c.id).creditBalance).toBe(payment);
  74  |  await writeFile(path.join(dir,`san-b-card-${payment}.json`),JSON.stringify({invoice,fact},null,2));
  75  |  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await history.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,`san-b-card-${payment}-${width}.png`),animations:"disabled"});}
  76  | });
  77  | 
  78  | test("SAN-BC-replace substituição pela UI preserva venda original e recalcula custo dependente",async({page})=>{
  79  |  await start(page,"replacement");
  80  |  const a=await post(page,"/accounts",{name:"SAN banco substituição",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  81  |  const i=await post(page,"/investments",{ticker:"SANREPLACE",name:"Cadeia corrigida",type:"STOCK",openingQuantity:0,openingCost:0});
  82  |  await post(page,"/investments/operation",{investmentId:i.id,type:"BUY",quantity:20,price:10,fees:2,date:"2027-01-15",accountId:a.id});
  83  |  await post(page,"/investments/operation",{investmentId:i.id,type:"SELL",quantity:5,price:15,fees:1,date:"2027-01-15",accountId:a.id});
  84  |  await page.goto("/investimentos");await page.getByText("SANREPLACE",{exact:true}).click();
  85  |  await page.getByText("Compra",{exact:true}).locator("xpath=../../..").getByRole("button",{name:"Compensar operação",exact:true}).click();
  86  |  const modal=page.getByRole("dialog",{name:"Compensar operação",exact:true});await modal.getByLabel("Motivo",{exact:true}).fill("Aquisição corrigida com venda dependente");
  87  |  await modal.getByLabel("Taxas devolvidas",{exact:true}).fill("2");await modal.getByLabel("Registrar operação substituta").check();await modal.getByLabel("Quantidade corrigida").fill("20");await modal.getByLabel("Preço corrigido").fill("8");await modal.getByLabel("Taxas da substituição").fill("2");
  88  |  const response=page.waitForResponse(r=>r.url().endsWith("/corrections")&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar compensação",exact:true}).click();const result=await response;expect(result.ok(),await result.text()).toBe(true);const receipt=await result.json();
  89  |  await page.reload();await page.getByText("SANREPLACE",{exact:true}).click();await expect(page.getByRole("region",{name:"Compensações registradas"})).toContainText("Aquisição corrigida com venda dependente");
  90  |  const position=(await json(page,"/investments")).find((v:{id:string})=>v.id===i.id);expect(position.quantity).toBe(15);expect(position.totalCost).toBe(121.5);
  91  |  expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(912);expect([receipt.cashDelta,receipt.realizedDelta]).toEqual([40,10]);
  92  |  const original=await json(page,`/investments/${i.id}/history`);expect(original).toHaveLength(2);expect(original.find((v:{type:string})=>v.type==="SELL").costDelta).toBe(50.5);
  93  |  await writeFile(path.join(dir,"san-c2-replacement.json"),JSON.stringify({position,receipt,original},null,2));
  94  |  for(const width of [360,768,1440]){
  95  |    await page.setViewportSize({width,height:900});
  96  |    const history=page.getByRole("region",{name:"Compensações registradas"});
  97  |    await expect(history.locator("..")).toHaveCSS("opacity","1");
  98  |    await history.scrollIntoViewIfNeeded();await expect(history).toBeInViewport();
  99  |    await page.screenshot({path:path.join(dir,`san-c2-replace-${width}.png`),animations:"disabled"});
  100 |  }
  101 | });
  102 | 
  103 | test("SAN-E2 arquivar pela UI, posição datada em outro ano e exportar transferência",async({page})=>{
  104 |  await start(page,"report-position");
  105 |  const archived=await post(page,"/accounts",{name:"SAN conta arquivada",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  106 |  const a=await post(page,"/accounts",{name:"SAN origem ativa",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  107 |  const b=await post(page,"/accounts",{name:"SAN destino ativo",type:"CHECKING",initialBalance:0,color:"#3b82f6"});
  108 |  await page.goto("/contas");await page.getByRole("button",{name:`Opções da conta ${archived.name}`}).click();
  109 |  await page.getByRole("menuitem",{name:"Arquivar",exact:true}).click();
  110 |  const response=page.waitForResponse(r=>r.url().endsWith(`/accounts/${archived.id}`)&&r.request().method()==="DELETE");
  111 |  await page.getByRole("dialog",{name:"Arquivar Conta"}).getByRole("button",{name:"Arquivar Conta",exact:true}).click();
  112 |  expect((await response).ok()).toBe(true);await page.reload();
  113 |  await expect(page.getByRole("region",{name:"Posição de contas arquivadas"})).toContainText("SAN conta arquivada");
  114 |  expect((await json(page,"/accounts")).some((v:{id:string})=>v.id===archived.id)).toBe(false);
  115 |  const p=await json(page,"/accounts/position");expect(p.totalBalance).toBe("2000.00");expect(p.archivedBalance).toBe("1000.00");
  116 |  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await page.screenshot({path:path.join(dir,`san-e2-contas-${width}.png`),fullPage:true,animations:"disabled"});}
  117 |  await post(page,"/investments",{ticker:"SANDATE",name:"Avaliação datada",type:"STOCK",openingQuantity:20,openingCost:200,openingValue:500,valuationDate:"2027-01-10",valuationSource:"USER_PROVIDED"});
  118 |  await post(page,"/investments",{ticker:"SANUNKNOWN",name:"Posição sem avaliação conhecida",type:"STOCK",openingQuantity:1,openingCost:10});
  119 |  await page.goto("/resumo-anual");await page.getByRole("button",{name:"Ano anterior",exact:true}).click();
  120 |  await expect(page.getByText(/Não representa fechamento de 2026/)).toBeVisible();
  121 |  await expect(page.getByText(/Avaliação: 10\/01\/2027 · Origem: USER_PROVIDED/)).toBeVisible();
  122 |  await expect(page.getByText("Posição sem avaliação conhecida",{exact:true})).toBeVisible();
  123 |  const annual=await json(page,"/annual-summary?year=2026");
  124 |  expect(annual.investments.totalValue).toBeNull();expect(annual.investments.valuationAsOf).toBe("2027-01-15");
  125 |  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await page.getByText("Posição atual de investimentos",{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,`san-e2-anual-${width}.png`),fullPage:true,animations:"disabled"});}
  126 |  const c=await post(page,"/cards",{name:"SAN consumo fora do filtro",last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"});
  127 |  const categories=await json(page,"/categories?type=EXPENSE");
  128 |  await post(page,"/cards/transaction",{cardId:c.id,categoryId:categories[0].id,description:"SAN compra cartão",amount:100,date:"2027-01-10",totalInstallments:1});
  129 |  await post(page,"/transactions",{description:"SAN transferência filtrada",amount:200,date:"2027-01-15",type:"TRANSFER",accountId:a.id,destinationAccountId:b.id,isPaid:true,fee:0});
  130 |  await page.goto("/extrato");
  131 |  const summaryResponse=page.waitForResponse(r=>r.url().includes("/transactions/summary?")&&r.url().includes("type=TRANSFER"));
  132 |  await page.getByRole("button",{name:"Transferências",exact:true}).click();
  133 |  const summary=await (await summaryResponse).json();expect([summary.entries,summary.exits,summary.balance]).toEqual([null,null,null]);expect([Number(summary.observed.entries),Number(summary.observed.exits),Number(summary.observed.balance)]).toEqual([0,0,0]);
  134 |  await expect(page.getByText("SAN transferência filtrada",{exact:true})).toHaveCount(2);
  135 |  const exported=page.waitForResponse(r=>r.url().includes("/transactions/export?")&&r.url().includes("type=TRANSFER"));
  136 |  const download=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar período",exact:true}).click();
  137 |  expect((await exported).ok()).toBe(true);await (await download).saveAs(path.join(dir,"san-e2-transferencias.xlsx"));
  138 |  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await page.screenshot({path:path.join(dir,`san-e2-filtro-${width}.png`),fullPage:true,animations:"disabled"});}
  139 |  await page.reload();await page.getByRole("button",{name:"Lançar",exact:true}).click();
  140 |  const modal=page.getByRole("dialog",{name:"Nova Transação",exact:true});
  141 |  await expect(modal.getByLabel("Conta do lançamento").locator("option",{hasText:archived.name})).toHaveCount(0);
  142 |  await writeFile(path.join(dir,"san-e2-position.json"),JSON.stringify({position:p,annual,summary},null,2));
  143 | });
  144 | 
  145 | test("SAN-E2-visual motivo de indisponibilidade legível em 360, 768 e 1440",async({page})=>{
  146 |  await start(page,"unknown-visual");
  147 |  await post(page,"/investments",{ticker:"SANVIS",name:"Avaliação desconhecida",type:"STOCK",openingQuantity:10,openingCost:200});
  148 |  await page.goto("/investimentos");
  149 |  const reason=page.getByText("Custo ou avaliação indisponível",{exact:true});await expect(reason).toBeVisible();
  150 |  for(const width of [360,768,1440]){
  151 |    await page.setViewportSize({width,height:900});await reason.scrollIntoViewIfNeeded();
  152 |    const box=await reason.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);
  153 |    await page.screenshot({path:path.join(dir,`san-e2-investimentos-${width}.png`),animations:"disabled"});
  154 |  }
  155 | });
  156 | 
  157 | test("SAN-D2 previsão, baixa, transferência atômica e estorno parcial/total pela UI",async({page})=>{
  158 |  await start(page,"commands");
  159 |  const a=await post(page,"/accounts",{name:`${ns}-origem`,type:"CHECKING",initialBalance:1000,color:"#10b981"});
  160 |  const b=await post(page,"/accounts",{name:`${ns}-destino`,type:"CHECKING",initialBalance:100,color:"#3b82f6"});
  161 |  const categories=await json(page,"/categories?type=EXPENSE");
  162 |  const rows=async()=> (await json(page,"/transactions?month=1&year=2027&size=100")).content;
```