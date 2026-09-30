# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: milestone-remediation.integrated.spec.ts >> SAN-BC-card compra, exclusão e reembolso após pagamento 120 pela UI
- Location: tests\e2e\milestone-remediation.integrated.spec.ts:97:35

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('dialog', { name: 'SAN cartão 120 •••• 4242' }).getByRole('button', { name: /^(Pagar|Adiantar)/ })
    - locator resolved to <button type="button" class="w-full font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 text-white">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <nextjs-portal></nextjs-portal> from <script data-nextjs-dev-overlay="true">…</script> subtree intercepts pointer events
  - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <nextjs-portal></nextjs-portal> from <script data-nextjs-dev-overlay="true">…</script> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    158 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <nextjs-portal></nextjs-portal> from <script data-nextjs-dev-overlay="true">…</script> subtree intercepts pointer events
      - retrying click action
        - waiting 500ms

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
          - text: cf003-a-san1821-608e082b-goal-card-120@example.invalid
      - navigation [ref=f3e9]:
        - link [ref=f3e10] [cursor=pointer]:
          - /url: /
        - link [ref=f3e17] [cursor=pointer]:
          - /url: /contas
        - link [ref=f3e21] [cursor=pointer]:
          - /url: /extrato
        - link [ref=f3e26] [cursor=pointer]:
          - /url: /cartoes
        - link [ref=f3e30] [cursor=pointer]:
          - /url: /planejamento
        - link [ref=f3e34] [cursor=pointer]:
          - /url: /metas
        - link [ref=f3e40] [cursor=pointer]:
          - /url: /investimentos
        - link [ref=f3e47] [cursor=pointer]:
          - /url: /resumo-anual
        - link [ref=f3e53] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f3e59]:
        - button "Privacidade" [ref=f3e60]
        - button "Configurações" [ref=f3e65]
        - button "Sair da Conta" [ref=f3e69]
    - generic [ref=f3e73]:
      - generic [ref=f3e75]:
        - button "Abrir menu de navegação" [ref=f3e76]
        - generic [ref=f3e78]: Controle Financeiro
      - main [ref=f3e79]:
        - generic [ref=f3e80]:
          - generic [ref=f3e82]:
            - generic [ref=f3e83]:
              - heading "Carteira" [level=1] [ref=f3e84]
              - paragraph [ref=f3e85]: Gestão de crédito e faturas.
            - generic [ref=f3e86]:
              - button "Lançar Compra" [ref=f3e87]
              - button "Novo Cartão" [ref=f3e91]
          - main [ref=f3e93]:
            - generic [ref=f3e94]:
              - generic [ref=f3e99]:
                - paragraph [ref=f3e100]: Limite Global
                - text: R$ 1.000,00
              - generic [ref=f3e106]:
                - paragraph [ref=f3e107]: Faturas Abertas
                - text: R$ 120,00
              - generic [ref=f3e113]:
                - paragraph [ref=f3e114]: Disponível
                - text: R$ 880,00
            - heading "Cartões Ativos" [level=2] [ref=f3e116]
            - generic [ref=f3e117]:
              - button "Ver fatura de SAN cartão 120, final 4242":
                - generic:
                  - generic:
                    - img "Logo da bandeira VISA"
                  - generic:
                    - paragraph: •••• 4242
                    - generic:
                      - paragraph: SAN cartão 120
                      - paragraph: Vence dia 28
                - generic:
                  - generic:
                    - generic:
                      - paragraph: Fatura Atual
                      - text: R$ 120,00
                    - generic:
                      - paragraph: Disponível
                      - text: R$ 880,00
  - button "Open Next.js Dev Tools" [ref=f3e123] [cursor=pointer]
  - alert [ref=f3e127]
  - dialog [ref=f3e129]:
    - generic [ref=f3e130]:
      - generic [ref=f3e131]:
        - button "Mês anterior da fatura" [ref=f3e132]
        - generic [ref=f3e135]: janeiro de 2027
        - button "Próximo mês da fatura" [ref=f3e138]
      - button "Fechar detalhes da fatura" [active] [ref=f3e141]
    - generic [ref=f3e146]:
      - generic [ref=f3e147]:
        - paragraph [ref=f3e148]: SAN cartão 120 •••• 4242
        - paragraph [ref=f3e149]: R$ 120,00
        - paragraph [ref=f3e150]: "Consumo original · Saldo pagável: R$ 120,00 · Crédito: R$ 0,00"
        - generic [ref=f3e151]:
          - generic "Data em que as compras passam para o próximo mês" [ref=f3e152]: "Fecha: 20 de jan"
          - generic "Data limite para pagamento" [ref=f3e153]: "Vence: 28 de jan"
      - text: Aberta
    - generic [ref=f3e155]:
      - generic [ref=f3e161]:
        - paragraph [ref=f3e162]: "Compra Meta: SAN compra cartão 120"
        - paragraph [ref=f3e163]: 15/01/2027 Metas e Objetivos
        - group [ref=f3e164]:
          - generic "Horário e registro" [ref=f3e165]
      - generic [ref=f3e166]:
        - text: R$ 120,00
        - generic [ref=f3e167]:
          - button [ref=f3e168]
          - button [ref=f3e172]
    - generic [ref=f3e176]:
      - generic [ref=f3e177]:
        - 'button "Limite: R$ 1.000,00" [ref=f3e178]'
        - button "Excluir" [ref=f3e182]
      - button "Adiantar Fatura" [ref=f3e186]
```

# Test source

```ts
  12  |  const name="rva03-payment120-events.json";
  13  |  page.on("console", message=>{if(message.text().includes("RVA03"))events.push({event:"console",text:message.text()});});
  14  |  page.on("pageerror", error=>events.push({event:"pageerror",message:error.message}));
  15  |  page.on("request", request=>{if(request.url().includes("/api/"))events.push({event:"request",method:request.method(),url:new URL(request.url()).pathname+new URL(request.url()).search});});
  16  |  page.on("requestfinished", request=>{if(request.url().includes("/api/"))events.push({event:"finished",url:new URL(request.url()).pathname+new URL(request.url()).search});});
  17  |  page.on("requestfailed", request=>events.push({event:"failed",url:new URL(request.url()).pathname,failure:request.failure()?.errorText}));
  18  |  page.on("response", response=>{if(response.url().includes("/api/"))events.push({event:"response",url:new URL(response.url()).pathname+new URL(response.url()).search,status:response.status()});});
  19  |  info.attachments.push({name:"RVA03 metadata",path:path.join(dir,name),contentType:"application/json"});
  20  |  await page.exposeFunction("saveRva03",async()=>writeFile(path.join(dir,name),JSON.stringify(events,null,2)));
  21  | });
  22  | test.afterEach(async ({page},info)=>{
  23  |  if(process.env.CF_RVA03_DIAGNOSTICS!=="1" || !info.title.includes("pagamento 120"))return;
  24  |  await page.evaluate(async()=>{
  25  |    await (window as unknown as {saveRva03:()=>Promise<void>}).saveRva03();
  26  |  });
  27  | });
  28  | async function start(page:Page,suffix:string){await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));await registerSyntheticUser(page,syntheticUser("A",`${ns}-${suffix}`));}
  29  | async function post(page:Page,url:string,data:unknown){
  30  |  // Synthetic fixtures explicitly serialize the new opening contract; legacy commands retain their transport.
  31  |  if(url==="/investments"&&data&&typeof data==="object"){
  32  |    const payload={...data} as Record<string,unknown>;
  33  |    for(const field of ["openingQuantity","openingCost","openingValue"])if(payload[field]!=null)payload[field]=String(payload[field]);
  34  |    data=payload;
  35  |  }
  36  |  const r=await page.request.post(`/api${url}`,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;
  37  | }
  38  | async function json(page:Page,url:string){const r=await page.request.get(`/api${url}`);expect(r.ok(),await r.text()).toBe(true);return r.json();}
  39  | 
  40  | test("SAN-RVA proporcional após compensação pela UI e remanescente encerrado após reload",async({page})=>{
  41  |  await start(page,"residuals");
  42  |  const a=await post(page,"/accounts",{name:"RVA banco",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  43  |  const asset=await post(page,"/investments",{ticker:"RVATOTAL",name:"Referência preservada",type:"STOCK",openingQuantity:3,openingCost:3,openingValue:1,valuationDate:"2027-01-10",valuationSource:"USER_PROVIDED"});
  44  |  const op=async(investmentId:string,type:string,quantity:number,price:number)=>post(page,"/investments/operation",{investmentId,type,quantity,price,fees:0,date:"2027-01-15",accountId:a.id});
  45  |  await op(asset.id,"SELL",1,1);await op(asset.id,"DIVIDEND",1,1);
  46  |  await page.goto("/investimentos");await page.getByText("RVATOTAL",{exact:true}).click();
  47  |  await page.getByText("Dividendo",{exact:true}).locator("xpath=../../..").getByRole("button",{name:"Compensar operação",exact:true}).click();
  48  |  const modal=page.getByRole("dialog",{name:"Compensar operação",exact:true});
  49  |  await modal.getByLabel("Motivo",{exact:true}).fill("Cancelamento sem nova avaliação");await modal.getByLabel("Taxas devolvidas",{exact:true}).fill("0");
  50  |  const corrected=page.waitForResponse(r=>r.url().endsWith("/corrections")&&r.request().method()==="POST");
  51  |  await modal.getByRole("button",{name:"Confirmar compensação",exact:true}).click();expect((await corrected).ok()).toBe(true);
  52  |  await op(asset.id,"SELL",1,1);await page.reload();
  53  |  let position=(await json(page,"/investments")).find((i:{id:string})=>i.id===asset.id);
  54  |  expect([position.quantity,position.totalCost,position.valuationAmount,position.valuationBasis,position.valuationDate,position.valuationSource]).toEqual([1,1,0.33,"TOTAL","2027-01-10","USER_PROVIDED"]);
  55  |  await page.getByText("RVATOTAL",{exact:true}).click();await expect(page.getByRole("region",{name:"Compensações registradas"})).toContainText("Cancelamento sem nova avaliação");
  56  |  await op(asset.id,"SELL",1,1);
  57  |  const unknown=await post(page,"/investments",{ticker:"RVAUNKNOWN",name:"Custo histórico desconhecido",type:"STOCK",openingQuantity:10});
  58  |  await op(unknown.id,"SELL",10,25);await page.reload();
  59  |  position=(await json(page,"/investments")).find((i:{id:string})=>i.id===unknown.id);
  60  |  expect([position.quantity,position.totalCost,position.valuationAmount]).toEqual([0,0,0]);expect(position.valuationSource).toBeNull();
  61  |  const historical=await json(page,`/investments/${unknown.id}/history`);expect(historical[0].costDelta).toBeNull();expect(historical[0].realizedResult).toBeNull();
  62  |  await page.goto("/resumo-anual");await page.reload();
  63  |  const report=await json(page,"/annual-summary?year=2027");expect([report.investments.totalCost,report.investments.totalValue]).toEqual([0,0]);expect(report.investments.valuationComplete).toBe(true);expect(report.balance.investmentResult).toBeNull();
  64  |  await expect(page.getByRole("heading",{name:"Posição atual de investimentos",exact:true})).toBeVisible();
  65  |  expect((await json(page,"/accounts")).find((i:{id:string})=>i.id===a.id).balance).toBe(1253);
  66  |  await writeFile(path.join(dir,"rva-financeiro.json"),JSON.stringify({position,historical,report},null,2));
  67  | });
  68  | 
  69  | test("SAN-E27 provento bruto e retenção pela UI conciliam caixa líquido e XLSX",async({page})=>{
  70  |  await start(page,"net-cash");
  71  |  const a=await post(page,"/accounts",{name:"SAN caixa proventos",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  72  |  await post(page,"/investments",{ticker:"SANCASH",name:"Provento líquido",type:"STOCK",openingQuantity:10,openingCost:200,openingValue:250,valuationDate:"2027-01-15",valuationSource:"USER_PROVIDED"});
  73  |  await page.goto("/investimentos");await page.getByText("SANCASH",{exact:true}).click();await page.getByRole("button",{name:"Aportar",exact:true}).click();
  74  |  const modal=page.getByRole("dialog",{name:"SANCASH - Operação",exact:true});
  75  |  await modal.getByRole("button",{name:"Proventos",exact:true}).click();
  76  |  await modal.getByLabel("Valor bruto do provento (antes de retenções)").fill("10");await modal.getByLabel("Taxas / retenções").fill("1");await modal.getByLabel("Conta",{exact:true}).selectOption(a.id);
  77  |  await expect(modal.getByText(/A conta recebe apenas o líquido/)).toContainText("9,00");
  78  |  const response=page.waitForResponse(r=>r.url().endsWith("/investments/operation")&&r.request().method()==="POST");
  79  |  await modal.getByRole("button",{name:"Confirmar Operação",exact:true}).click();expect((await response).ok()).toBe(true);
  80  |  await page.goto("/extrato");await page.reload();
  81  |  const rows=(await json(page,"/transactions?month=1&year=2027&size=100")).content;
  82  |  const dividend=rows.find((t:{origin:string})=>t.origin==="INVESTMENT_DIVIDEND");const fee=rows.find((t:{origin:string})=>t.origin==="INVESTMENT_FEE");
  83  |  expect([dividend.amount,dividend.cashAmount,dividend.cashDelta]).toEqual([10,9,9]);expect([fee.amount,fee.cashAmount,fee.cashDelta]).toEqual([1,0,0]);
  84  |  expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(1009);
  85  |  const cash=await json(page,"/transactions/summary?month=1&year=2027");expect([cash.entries,cash.exits,cash.balance]).toEqual([null,null,null]);expect([Number(cash.observed.entries),Number(cash.observed.exits),Number(cash.observed.balance)]).toEqual([9,0,9]);expect(cash.coverage.state).toBe("PARTIAL");
  86  |  await expect(page.getByText("Bruto: R$ 10,00",{exact:true})).toBeVisible();await expect(page.getByText("Bruto: R$ 1,00",{exact:true})).toBeVisible();
  87  |  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await page.getByText("Proventos: SANCASH",{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,`san-e27-extrato-${width}.png`),animations:"disabled"});}
  88  |  const download=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar período",exact:true}).click();await (await download).saveAs(path.join(dir,"san-e27-caixa.xlsx"));
  89  |  await writeFile(path.join(dir,"san-e27-cash.json"),JSON.stringify({dividend,fee,cash},null,2));
  90  |  await page.goto("/");await page.reload();
  91  |  const recent=page.getByRole("heading",{name:"Extrato Recente",exact:true}).locator("..");
  92  |  await expect(recent.getByText(/\+\s*R\$\s*9,00/)).toBeVisible();
  93  |  await expect(recent.getByText("Bruto: R$ 10,00",{exact:true})).toBeVisible();
  94  |  await expect(recent.getByText(/\+\s*R\$\s*10,00/)).toHaveCount(0);
  95  | });
  96  | 
  97  | for(const payment of [20,120])test(`SAN-BC-card compra, exclusão e reembolso após pagamento ${payment} pela UI`,async({page})=>{
  98  |  await start(page,`goal-card-${payment}`);
  99  |  const a=await post(page,"/accounts",{name:"SAN banco cartão",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  100 |  const c=await post(page,"/cards",{name:`SAN cartão ${payment}`,last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"});
  101 |  let paymentPosts=0;
  102 |  page.on("request",request=>{if(request.method()==="POST"&&request.url().endsWith(`/cards/${c.id}/pay`))paymentPosts++;});
  103 |  const g=await post(page,"/goals",{title:`SAN meta cartão ${payment}`,targetValue:1000,deadline:"2028-01-01",type:"MONETARY",useChecklist:true,color:"BLUE"});
  104 |  const name=`SAN compra cartão ${payment}`;
  105 |  await page.goto("/metas");await page.getByText(g.title,{exact:true}).click();await page.getByRole("button",{name:/Adicionar.*item/i}).click();
  106 |  await page.getByPlaceholder("Nome do item (ex: Processador)").fill(name);await page.getByPlaceholder(/Valor|Estimado|Preço/i).fill("120");
  107 |  const added=page.waitForResponse(r=>r.url().endsWith(`/goals/${g.id}/items`)&&r.request().method()==="POST");await page.getByRole("button",{name:"Adicionar",exact:true}).click();expect((await added).ok()).toBe(true);
  108 |  await page.reload();await page.getByText(g.title,{exact:true}).click();await page.getByRole("button",{name:`Comprar ${name}`,exact:true}).click();
  109 |  await page.locator("select").filter({has:page.locator(`option[value="CARD_${c.id}"]`)}).selectOption(`CARD_${c.id}`);
  110 |  const bought=page.waitForResponse(r=>r.url().endsWith("/purchase")&&r.request().method()==="PATCH");await page.getByRole("button",{name:"Confirmar",exact:true}).click();expect((await bought).ok()).toBe(true);
  111 |  await page.goto("/cartoes");await page.getByRole("button",{name:`Ver fatura de ${c.name}, final 4242`}).click();
> 112 |  await page.getByRole("dialog",{name:`${c.name} •••• 4242`}).getByRole("button",{name:/^(Pagar|Adiantar)/}).click();
      |                                                                                                             ^ Error: locator.click: Test timeout of 90000ms exceeded.
  113 |  const pay=page.getByRole("dialog",{name:`Pagar Fatura - ${c.name}`,exact:true});await pay.getByRole("button",{name:"Adiantamento",exact:true}).click();await pay.getByLabel("Valor do Pagamento").fill(String(payment));await pay.getByLabel("Pagar com").selectOption(a.id);
  114 |  const paid=page.waitForResponse(r=>r.url().endsWith(`/cards/${c.id}/pay`)&&r.request().method()==="POST");await pay.getByRole("button",{name:"Confirmar Pagamento",exact:true}).click();expect((await paid).ok()).toBe(true);await expect(pay).toHaveCount(0);
  115 |  await page.goto("/metas");await page.getByText(g.title,{exact:true}).click();await page.getByRole("button",{name:"Deletar Meta",exact:true}).click();
  116 |  const deleted=page.waitForResponse(r=>r.url().endsWith(`/goals/${g.id}`)&&r.request().method()==="DELETE");await page.getByRole("dialog",{name:"Excluir Meta",exact:true}).getByRole("button",{name:"Excluir",exact:true}).click();expect((await deleted).status()).toBe(204);
  117 |  await page.reload();const history=page.getByRole("region",{name:"Histórico de compras"});await expect(history.getByText(name,{exact:true})).toBeVisible();
  118 |  const refunded=page.waitForResponse(r=>r.url().endsWith("/refund")&&r.request().method()==="POST");await history.getByRole("button",{name:"Reembolsar compra",exact:true}).click();expect((await refunded).ok()).toBe(true);
  119 |  await page.reload();await expect(history.getByText("Reembolsada",{exact:true})).toBeVisible();
  120 |  const invoice=await json(page,`/cards/${c.id}/invoice?month=1&year=2027`);expect(invoice.payableAmount).toBe(0);
  121 |  expect((await json(page,"/cards")).find((v:{id:string})=>v.id===c.id).creditBalance).toBe(payment);
  122 |  expect(paymentPosts).toBe(1);
  123 |  expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(1000-payment);
  124 |  const fact=(await json(page,"/goals/purchases"))[0];const retry=await page.request.post(`/api/goals/items/${fact.itemId}/refund`);expect(retry.status()).toBe(400);
  125 |  expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(1000-payment);
  126 |  expect((await json(page,"/cards")).find((v:{id:string})=>v.id===c.id).creditBalance).toBe(payment);
  127 |  await writeFile(path.join(dir,`san-b-card-${payment}.json`),JSON.stringify({invoice,fact},null,2));
  128 |  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await history.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,`san-b-card-${payment}-${width}.png`),animations:"disabled"});}
  129 | });
  130 | 
  131 | test("SAN-BC-replace substituição pela UI preserva venda original e recalcula custo dependente",async({page})=>{
  132 |  await start(page,"replacement");
  133 |  const a=await post(page,"/accounts",{name:"SAN banco substituição",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  134 |  const i=await post(page,"/investments",{ticker:"SANREPLACE",name:"Cadeia corrigida",type:"STOCK",openingQuantity:0,openingCost:0});
  135 |  await post(page,"/investments/operation",{investmentId:i.id,type:"BUY",quantity:20,price:10,fees:2,date:"2027-01-15",accountId:a.id});
  136 |  await post(page,"/investments/operation",{investmentId:i.id,type:"SELL",quantity:5,price:15,fees:1,date:"2027-01-15",accountId:a.id});
  137 |  await page.goto("/investimentos");await page.getByText("SANREPLACE",{exact:true}).click();
  138 |  await page.getByText("Compra",{exact:true}).locator("xpath=../../..").getByRole("button",{name:"Compensar operação",exact:true}).click();
  139 |  const modal=page.getByRole("dialog",{name:"Compensar operação",exact:true});await modal.getByLabel("Motivo",{exact:true}).fill("Aquisição corrigida com venda dependente");
  140 |  await modal.getByLabel("Taxas devolvidas",{exact:true}).fill("2");await modal.getByLabel("Registrar operação substituta").check();await modal.getByLabel("Quantidade corrigida").fill("20");await modal.getByLabel("Preço corrigido").fill("8");await modal.getByLabel("Taxas da substituição").fill("2");
  141 |  const response=page.waitForResponse(r=>r.url().endsWith("/corrections")&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar compensação",exact:true}).click();const result=await response;expect(result.ok(),await result.text()).toBe(true);const receipt=await result.json();
  142 |  await page.reload();await page.getByText("SANREPLACE",{exact:true}).click();await expect(page.getByRole("region",{name:"Compensações registradas"})).toContainText("Aquisição corrigida com venda dependente");
  143 |  const position=(await json(page,"/investments")).find((v:{id:string})=>v.id===i.id);expect(position.quantity).toBe(15);expect(position.totalCost).toBe(121.5);
  144 |  expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(912);expect([receipt.cashDelta,receipt.realizedDelta]).toEqual([40,10]);
  145 |  const original=await json(page,`/investments/${i.id}/history`);expect(original).toHaveLength(2);expect(original.find((v:{type:string})=>v.type==="SELL").costDelta).toBe(50.5);
  146 |  await writeFile(path.join(dir,"san-c2-replacement.json"),JSON.stringify({position,receipt,original},null,2));
  147 |  for(const width of [360,768,1440]){
  148 |    await page.setViewportSize({width,height:900});
  149 |    const history=page.getByRole("region",{name:"Compensações registradas"});
  150 |    await expect(history.locator("..")).toHaveCSS("opacity","1");
  151 |    await history.scrollIntoViewIfNeeded();await expect(history).toBeInViewport();
  152 |    await page.screenshot({path:path.join(dir,`san-c2-replace-${width}.png`),animations:"disabled"});
  153 |  }
  154 | });
  155 | 
  156 | test("SAN-E2 arquivar pela UI, posição datada em outro ano e exportar transferência",async({page})=>{
  157 |  await start(page,"report-position");
  158 |  const archived=await post(page,"/accounts",{name:"SAN conta arquivada",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  159 |  const a=await post(page,"/accounts",{name:"SAN origem ativa",type:"CHECKING",initialBalance:1000,color:"#10b981"});
  160 |  const b=await post(page,"/accounts",{name:"SAN destino ativo",type:"CHECKING",initialBalance:0,color:"#3b82f6"});
  161 |  await page.goto("/contas");await page.getByRole("button",{name:`Opções da conta ${archived.name}`}).click();
  162 |  await page.getByRole("menuitem",{name:"Arquivar",exact:true}).click();
  163 |  const response=page.waitForResponse(r=>r.url().endsWith(`/accounts/${archived.id}`)&&r.request().method()==="DELETE");
  164 |  await page.getByRole("dialog",{name:"Arquivar Conta"}).getByRole("button",{name:"Arquivar Conta",exact:true}).click();
  165 |  expect((await response).ok()).toBe(true);await page.reload();
  166 |  await expect(page.getByRole("region",{name:"Posição de contas arquivadas"})).toContainText("SAN conta arquivada");
  167 |  expect((await json(page,"/accounts")).some((v:{id:string})=>v.id===archived.id)).toBe(false);
  168 |  const p=await json(page,"/accounts/position");expect(p.totalBalance).toBe("2000.00");expect(p.archivedBalance).toBe("1000.00");
  169 |  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await page.screenshot({path:path.join(dir,`san-e2-contas-${width}.png`),fullPage:true,animations:"disabled"});}
  170 |  await post(page,"/investments",{ticker:"SANDATE",name:"Avaliação datada",type:"STOCK",openingQuantity:20,openingCost:200,openingValue:500,valuationDate:"2027-01-10",valuationSource:"USER_PROVIDED"});
  171 |  await post(page,"/investments",{ticker:"SANUNKNOWN",name:"Posição sem avaliação conhecida",type:"STOCK",openingQuantity:1,openingCost:10});
  172 |  await page.goto("/resumo-anual");await page.getByRole("button",{name:"Ano anterior",exact:true}).click();
  173 |  await expect(page.getByText(/Não representa fechamento de 2026/)).toBeVisible();
  174 |  await expect(page.getByText(/Avaliação: 10\/01\/2027 · Origem: USER_PROVIDED/)).toBeVisible();
  175 |  await expect(page.getByText("Posição sem avaliação conhecida",{exact:true})).toBeVisible();
  176 |  const annual=await json(page,"/annual-summary?year=2026");
  177 |  expect(annual.investments.totalValue).toBeNull();expect(annual.investments.valuationAsOf).toBe("2027-01-15");
  178 |  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await page.getByText("Posição atual de investimentos",{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,`san-e2-anual-${width}.png`),fullPage:true,animations:"disabled"});}
  179 |  const c=await post(page,"/cards",{name:"SAN consumo fora do filtro",last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"});
  180 |  const categories=await json(page,"/categories?type=EXPENSE");
  181 |  await post(page,"/cards/transaction",{cardId:c.id,categoryId:categories[0].id,description:"SAN compra cartão",amount:100,date:"2027-01-10",totalInstallments:1});
  182 |  await post(page,"/transactions",{description:"SAN transferência filtrada",amount:200,date:"2027-01-15",type:"TRANSFER",accountId:a.id,destinationAccountId:b.id,isPaid:true,fee:0});
  183 |  await page.goto("/extrato");
  184 |  const summaryResponse=page.waitForResponse(r=>r.url().includes("/transactions/summary?")&&r.url().includes("type=TRANSFER"));
  185 |  await page.getByRole("button",{name:"Transferências",exact:true}).click();
  186 |  const summary=await (await summaryResponse).json();expect([summary.entries,summary.exits,summary.balance]).toEqual([null,null,null]);expect([Number(summary.observed.entries),Number(summary.observed.exits),Number(summary.observed.balance)]).toEqual([0,0,0]);
  187 |  await expect(page.getByText("SAN transferência filtrada",{exact:true})).toHaveCount(2);
  188 |  const exported=page.waitForResponse(r=>r.url().includes("/transactions/export?")&&r.url().includes("type=TRANSFER"));
  189 |  const download=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar período",exact:true}).click();
  190 |  expect((await exported).ok()).toBe(true);await (await download).saveAs(path.join(dir,"san-e2-transferencias.xlsx"));
  191 |  for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await page.screenshot({path:path.join(dir,`san-e2-filtro-${width}.png`),fullPage:true,animations:"disabled"});}
  192 |  await page.reload();await page.getByRole("button",{name:"Lançar",exact:true}).click();
  193 |  const modal=page.getByRole("dialog",{name:"Nova Transação",exact:true});
  194 |  await expect(modal.getByLabel("Conta do lançamento").locator("option",{hasText:archived.name})).toHaveCount(0);
  195 |  await writeFile(path.join(dir,"san-e2-position.json"),JSON.stringify({position:p,annual,summary},null,2));
  196 | });
  197 | 
  198 | test("SAN-E2-visual motivo de indisponibilidade legível em 360, 768 e 1440",async({page})=>{
  199 |  await start(page,"unknown-visual");
  200 |  await post(page,"/investments",{ticker:"SANVIS",name:"Avaliação desconhecida",type:"STOCK",openingQuantity:10,openingCost:200});
  201 |  await page.goto("/investimentos");
  202 |  const reason=page.getByText("Custo ou avaliação indisponível",{exact:true});await expect(reason).toBeVisible();
  203 |  for(const width of [360,768,1440]){
  204 |    await page.setViewportSize({width,height:900});await reason.scrollIntoViewIfNeeded();
  205 |    const box=await reason.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);
  206 |    await page.screenshot({path:path.join(dir,`san-e2-investimentos-${width}.png`),animations:"disabled"});
  207 |  }
  208 | });
  209 | 
  210 | test("SAN-D2 previsão, baixa, transferência atômica e estorno parcial/total pela UI",async({page})=>{
  211 |  await start(page,"commands");
  212 |  const a=await post(page,"/accounts",{name:`${ns}-origem`,type:"CHECKING",initialBalance:1000,color:"#10b981"});
```