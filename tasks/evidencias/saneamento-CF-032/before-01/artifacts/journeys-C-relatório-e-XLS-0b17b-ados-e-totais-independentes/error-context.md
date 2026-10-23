# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> C relatório e XLSX real com datas, origens, estados e totais independentes
- Location: tests\cf032\journeys.spec.ts:104:5

# Error details

```
Error: Export must preserve the supplied wall-clock seconds; no precision exception is approved

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 1

  Array [
    "22/10/2026",
-   "12:34:56",
+   "12:34",
    "CF032 receita",
  ]
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
          - generic [ref=f4e8]: cf003-a-cf032-7d8cf5be-c@example.invalid
      - navigation [ref=f4e10]:
        - link "Dashboard" [ref=f4e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f4e19] [cursor=pointer]:
          - /url: /contas
        - link "Configuração inicial" [ref=f4e24] [cursor=pointer]:
          - /url: /onboarding
        - link "Extrato" [ref=f4e30] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f4e36] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f4e41] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f4e46] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f4e53] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f4e61] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f4e68] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f4e75]:
        - button "Privacidade" [ref=f4e76] [cursor=pointer]
        - button "Configurações" [ref=f4e84] [cursor=pointer]
        - button "Sair da Conta" [ref=f4e89] [cursor=pointer]
    - main [ref=f4e95]:
      - generic [ref=f4e96]:
        - generic [ref=f4e98]:
          - generic [ref=f4e99]:
            - generic [ref=f4e101]:
              - heading "Extrato" [level=1] [ref=f4e102]
              - paragraph [ref=f4e103]: Histórico completo de movimentações.
            - generic [ref=f4e104]:
              - button "Mês anterior do extrato" [ref=f4e105] [cursor=pointer]
              - generic [ref=f4e108]: outubro de 2026
              - button "Mês seguinte do extrato" [ref=f4e109] [cursor=pointer]
            - button "Lançar" [ref=f4e112] [cursor=pointer]
          - generic [ref=f4e114]:
            - generic [ref=f4e115]:
              - button "Tudo" [ref=f4e116] [cursor=pointer]
              - button "Entradas" [ref=f4e117] [cursor=pointer]
              - button "Saídas" [ref=f4e118] [cursor=pointer]
              - button "Transferências" [ref=f4e119] [cursor=pointer]: Transf.
            - button "Todas as Contas" [ref=f4e120]
          - button "Exportar período" [ref=f4e127]
        - main [ref=f4e128]:
          - status [ref=f4e129]:
            - paragraph [ref=f4e130]: "Total do período indisponível: Período parcialmente coberto; somente valores registrados estão disponíveis."
            - paragraph [ref=f4e131]: "Base conhecida: 09/10/2026. Referência: 22/10/2026."
            - generic [ref=f4e132]:
              - paragraph [ref=f4e133]: "Subtotais observados nos registros (não representam o total completo):"
              - paragraph [ref=f4e134]:
                - text: "Entradas:"
                - generic [ref=f4e135]: R$ 250,10
              - paragraph [ref=f4e136]:
                - text: "Saídas:"
                - generic [ref=f4e137]: R$ 263,20
              - paragraph [ref=f4e138]:
                - text: "Fluxo líquido:"
                - generic [ref=f4e139]: R$ -13,10
          - generic [ref=f4e140]:
            - generic [ref=f4e146]:
              - paragraph [ref=f4e147]: Entradas de caixa realizadas
              - generic [ref=f4e148]: Indisponível
            - generic [ref=f4e154]:
              - paragraph [ref=f4e155]: Saídas de caixa realizadas
              - generic [ref=f4e156]: Indisponível
            - generic [ref=f4e162]:
              - paragraph [ref=f4e163]: Fluxo líquido do período
              - generic [ref=f4e164]: Indisponível
          - generic [ref=f4e166]:
            - heading "qui., 22 de out." [level=3] [ref=f4e167]
            - generic [ref=f4e168]:
              - button "Ver detalhes de CF032 receita" [ref=f4e169] [cursor=pointer]:
                - generic [ref=f4e175]:
                  - generic [ref=f4e176]: CF032 receita
                  - generic [ref=f4e178]:
                    - generic "Horário informado" [ref=f4e183]: 12:34:56
                    - generic [ref=f4e184]: Ajuste de Saldo
                    - generic [ref=f4e185]: Realizado
                    - generic [ref=f4e187]: Corrente sintética
                - generic [ref=f4e191]: + R$ 250,10
              - button "Ver detalhes de Adiantamento de Fatura" [ref=f4e194] [cursor=pointer]:
                - generic [ref=f4e200]:
                  - generic [ref=f4e201]: Adiantamento de Fatura
                  - generic [ref=f4e203]:
                    - generic "Horário informado" [ref=f4e208]: 06:00
                    - generic [ref=f4e209]: Pagamento de Fatura
                    - generic [ref=f4e210]: Realizado
                    - generic [ref=f4e212]: Corrente sintética
                - generic [ref=f4e216]: "- R$ 200,00"
              - 'button "Ver detalhes de Aporte: null" [ref=f4e219] [cursor=pointer]':
                - generic [ref=f4e225]:
                  - generic [ref=f4e226]: "Aporte: null"
                  - generic [ref=f4e228]:
                    - generic "Horário não informado" [ref=f4e233]: —
                    - generic [ref=f4e234]: Aporte de Invest.
                    - generic [ref=f4e235]: Realizado
                    - generic [ref=f4e237]: Corrente sintética
                - generic [ref=f4e241]: "- R$ 21,00"
              - button "Ver detalhes de CF032 transferência" [ref=f4e244] [cursor=pointer]:
                - generic [ref=f4e250]:
                  - generic [ref=f4e251]: CF032 transferência
                  - generic [ref=f4e253]:
                    - generic "Horário não informado" [ref=f4e258]: —
                    - generic [ref=f4e259]: Geral
                    - generic [ref=f4e260]: Realizado
                    - generic [ref=f4e262]: Corrente sintética
                - generic [ref=f4e266]: "- R$ 100,00"
              - button "Ver detalhes de CF032 transferência" [ref=f4e269] [cursor=pointer]:
                - generic [ref=f4e275]:
                  - generic [ref=f4e276]: CF032 transferência
                  - generic [ref=f4e278]:
                    - generic "Horário não informado" [ref=f4e283]: —
                    - generic [ref=f4e284]: Geral
                    - generic [ref=f4e285]: Realizado
                    - generic [ref=f4e287]: Poupança sintética
                - generic [ref=f4e292]: + R$ 100,00
              - button "Ver detalhes de Taxa - CF032 transferência" [ref=f4e295] [cursor=pointer]:
                - generic [ref=f4e301]:
                  - generic [ref=f4e302]: Taxa - CF032 transferência
                  - generic [ref=f4e304]:
                    - generic "Horário não informado" [ref=f4e309]: —
                    - generic [ref=f4e310]: Geral
                    - generic [ref=f4e311]: Realizado
                    - generic [ref=f4e313]: Corrente sintética
                - generic [ref=f4e317]: "- R$ 2,00"
              - button "Ver detalhes de CF032 despesa" [ref=f4e320] [cursor=pointer]:
                - generic [ref=f4e326]:
                  - generic [ref=f4e327]: CF032 despesa
                  - generic [ref=f4e329]:
                    - generic "Horário não informado" [ref=f4e334]: —
                    - generic [ref=f4e335]: Alimentação
                    - generic [ref=f4e336]: Realizado
                    - generic [ref=f4e338]: Corrente sintética
                - generic [ref=f4e342]: "- R$ 40,20"
  - alert [ref=f4e345]
```

# Test source

```ts
  19  | 
  20  | async function financial(page:Page,email:string,name:string,accounts:string,debt:string){
  21  |  const state=await sql(page,email,name);expect(state.accountTotal,`${name} account balances in SQL`).toBe(accounts);expect(state.debt,`${name} unpaid debt in SQL`).toBe(debt);return state;
  22  | }
  23  | 
  24  | test("A cadastro, rascunho, aplicação E01, recibo e releitura",async({page})=>{
  25  |  const person=await register(page,"a");await page.goto("/onboarding");
  26  |  const auxiliaryStatus=(await page.request.get("/api/accounts")).status();const browserStatus=(await request(page).get("/api/accounts")).status();
  27  |  await save("A-cookie-transport",{auxiliaryStatus,browserStatus,cookies:(await page.context().cookies()).map(({name,secure,httpOnly,sameSite,domain,path})=>({name,secure,httpOnly,sameSite,domain,path}))});
  28  |  expect(browserStatus).toBe(200);
  29  |  await page.getByLabel("Nome preferido (opcional)").fill("CF032 rascunho persistido");
  30  |  await page.getByLabel("Confirmo que os saldos não incluem movimentos que registrarei novamente").check();
  31  |  await page.getByLabel("Confirmo que o caixa da corretora não inclui o valor dos ativos aplicados").check();
  32  |  await page.getByRole("button",{name:"Salvar rascunho",exact:true}).click();
  33  |  await expect(page.getByRole("status").filter({hasText:"Últimas respostas confirmadas"})).toBeVisible();
  34  |  await page.reload();await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("CF032 rascunho persistido");
  35  |  expect((await sql(page,person.email,"A-draft")).applications).toBe(0);
  36  |  const fixture=await e01(page,"a",person);const state=await financial(page,person.email,"A-applied","1300.00","350.00");
  37  |  expect(state.netWorth).toBe("1451.00");expect(state.investmentTotal).toBe("501.00");
  38  |  expect(state.applications).toBe(16);expect(rows(state.receipts).filter(r=>r.kind==="ONBOARDING_COMPLETE")).toHaveLength(1);
  39  |  expect(rows(state.transactions)).toHaveLength(1);expect(rows(state.transactions)[0]).toMatchObject({is_paid:false,amount:"80.00"});
  40  |  expect(at(fixture.receipt,"summary","metrics","reservedAccounts","value")).toBe("350.00");
  41  |  expect(at(fixture.receipt,"summary","metrics","reservedInvestments","value")).toBe("200.00");
  42  |  expect(rows(state.investments).find(i=>i.position_mode==="MONETARY")).toMatchObject({quantity:null,total_cost:null,valuation_amount:"500.00",acquisition_date:null,historical_source:null});
  43  |  await page.reload();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();
  44  |  expect(at(await json(page,"/onboarding"),"data","completedReceipt")).toEqual(fixture.receipt);
  45  |  await paint(page,page.getByRole("heading",{name:"Entrevista concluída",exact:true}),"A-completed");
  46  |  await save("A-api-receipt",fixture.receipt);
  47  | });
  48  | 
  49  | async function daily(page:Page,suffix:string,ui:boolean){
  50  |  // Known-identifier daily branch. The original valid no-identifier E01 remains
  51  |  // strict in independent L, so its consumer defect cannot block later operations.
  52  |  const f=await e01(page,suffix,undefined,ui?"CF032STOCK":undefined);const a=String(f.checking.id),b=String(f.savings.id),email=f.person.email;
  53  |  if(ui){await transaction(page,a,"INCOME","CF032 receita","250.10");await transaction(page,a,"EXPENSE","CF032 despesa","40.20");await transaction(page,a,"TRANSFER","CF032 transferência","100.00",b);}
  54  |  else {
  55  |   const inc=rows(await json(page,"/categories?type=INCOME"))[0],exp=rows(await json(page,"/categories?type=EXPENSE"))[0];
  56  |   await post(page,"/transactions",{description:"CF032 receita",amount:250.10,date:day,time:"12:34:56",type:"INCOME",accountId:a,categoryId:inc.id,isPaid:true,operationId:randomUUID()});
  57  |   await post(page,"/transactions",{description:"CF032 despesa",amount:40.20,date:day,type:"EXPENSE",accountId:a,categoryId:exp.id,isPaid:true,operationId:randomUUID()});
  58  |   await post(page,"/transactions",{description:"CF032 transferência",amount:100,date:day,type:"TRANSFER",accountId:a,destinationAccountId:b,isPaid:true,fee:2,operationId:randomUUID()});
  59  |  }
  60  |  await financial(page,email,`${suffix}-cash`,"1507.90","350.00");
  61  |  const cats=rows(await json(page,"/categories?type=EXPENSE"));
  62  |  if(ui){
  63  |   await page.goto("/cartoes");await page.getByTitle("Lançar Compra",{exact:true}).click();const modal=page.getByRole("dialog",{name:"Nova Despesa no Crédito"});
  64  |   await modal.getByPlaceholder("0,00").fill("120.00");await modal.getByPlaceholder("Ex: Uber, Amazon, Jantar...").fill("CF032 compra parcelada");
  65  |   await modal.locator('input[type="date"]').fill("2026-10-15");await modal.locator("select").nth(0).selectOption(String(f.card.id));await modal.locator("select").nth(1).selectOption(String(cats[0].id));await modal.locator("select").nth(2).selectOption("3");
  66  |   const response=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/cards/transaction"&&r.request().method()==="POST");
  67  |   await modal.getByRole("button",{name:/Salvar|Lançar|Confirmar/}).click();const result=await response;expect(result.ok(),await result.text()).toBe(true);await expect(modal).toHaveCount(0);
  68  |  }else await post(page,"/cards/transaction",{cardId:f.card.id,categoryId:cats[0].id,description:"CF032 compra parcelada",amount:120,date:"2026-10-15",time:null,totalInstallments:3});
  69  |  await financial(page,email,`${suffix}-purchase`,"1507.90","470.00");
  70  |  const pay=await paymentForm(page,f.card,a,"200.00");const paid=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/cards/${f.card.id}/pay`&&r.request().method()==="POST");
  71  |  await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();const paidResponse=await paid;expect(paidResponse.ok(),await paidResponse.text()).toBe(true);await expect(pay).toHaveCount(0);
  72  |  await financial(page,email,`${suffix}-payment`,"1307.90","270.00");
  73  |  const stock=rows(await json(page,"/investments")).find(i=>i.type==="STOCK");expect(stock).toBeTruthy();
  74  |  if(ui){
  75  |   await page.goto("/investimentos");await page.getByText(String(stock!.ticker),{exact:true}).click();await page.getByRole("button",{name:"Aportar",exact:true}).click();
  76  |   const modal=page.getByRole("dialog",{name:`${stock!.ticker} - Operação`,exact:true});await modal.getByPlaceholder("0",{exact:true}).fill("2");await modal.getByPlaceholder("0,00",{exact:true}).fill("10");await modal.getByLabel("Taxas / retenções").fill("1");await modal.getByLabel("Conta",{exact:true}).selectOption(a);
  77  |   await paint(page,modal.getByRole("button",{name:"Confirmar Operação",exact:true}),"B-stock-operation");
  78  |   const op=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/investments/operation"&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar Operação",exact:true}).click();const applied=await op;expect(applied.ok(),await applied.text()).toBe(true);await expect(modal).toHaveCount(0);
  79  |  }else await post(page,"/investments/operation",{investmentId:stock!.id,type:"BUY",quantity:2,price:10,fees:1,date:day,accountId:a,operationId:randomUUID()});
  80  |  const goals=rows(await json(page,"/goals"));const trip=goals.find(g=>g.currentValue===500);expect(trip).toBeTruthy();
  81  |  if(ui){
  82  |   await page.goto("/metas");await page.getByRole("button",{name:`Ver detalhes da meta ${trip!.title}`}).click();await page.getByRole("button",{name:"Aporte Avulso",exact:true}).click();
  83  |   const modal=page.getByRole("dialog",{name:"Guardar Dinheiro",exact:true});await modal.getByPlaceholder("0",{exact:true}).fill("100");await modal.locator("select").selectOption(a);
  84  |   const deposited=page.waitForResponse(r=>r.url().includes(`/goals/${trip!.id}/deposit`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar Aporte",exact:true}).click();const response=await deposited;expect(response.ok(),await response.text()).toBe(true);await expect(modal).toHaveCount(0);
  85  |  }else {const r=await request(page).put(`/api/goals/${trip!.id}/allocations`,{data:{accountId:a,amount:"400.00"}});expect(r.status(),await r.text()).toBe(204);}
  86  |  const final=await financial(page,email,`${suffix}-final`,"1286.90","270.00");
  87  |  expect(final.netWorth).toBe("1518.57");expect(final.investmentTotal).toBe("501.67");expect(final.reservedAccounts).toBe("450.00");expect(final.reservedInvestments).toBe("200.00");
  88  |  expect(rows(final.investments).find(i=>i.type==="STOCK"||i.ticker===stock!.ticker)).toMatchObject({quantity:"5.00000000",total_cost:"21.60",valuation_amount:"1.67"});
  89  |  expect(rows(final.allocations).find(r=>r.account_id===a)).toMatchObject({amount:"400.00"});
  90  |  expect(rows(final.accounts).find(r=>r.id===a)).toMatchObject({balance:"886.90"});
  91  |  await save(`${suffix}-api`,{accounts:await json(page,"/accounts/position"),cards:await json(page,"/cards"),annual:await json(page,"/annual-summary?year=2026"),cash:await json(page,"/transactions/summary?month=10&year=2026")});
  92  |  return f;
  93  | }
  94  | 
  95  | test("B uso diário pela UI, reconciliação, reload e logout/login",async({page})=>{
  96  |  const f=await daily(page,"B",true);await page.goto("/contas");await page.reload();await expect(page.getByText("Corrente sintética",{exact:true}).first()).toBeVisible();
  97  |  await paint(page,page.getByText("Corrente sintética",{exact:true}).first(),"B-accounts");
  98  |  const before=await sql(page,f.person.email);await logout(page);await login(page,f.person);await page.goto("/extrato");await page.reload();
  99  |  await expect(page.getByText("CF032 receita",{exact:true})).toBeVisible();expect(await sql(page,f.person.email,"B-new-session")).toEqual(before);
  100 |  expect(at(await json(page,"/onboarding"),"data","completedReceipt")).toEqual(f.receipt);
  101 |  await paint(page,page.getByText("CF032 receita",{exact:true}),"B-new-session");
  102 | });
  103 | 
  104 | test("C relatório e XLSX real com datas, origens, estados e totais independentes",async({page})=>{
  105 |  const f=await daily(page,"C",false);
  106 |  await page.goto("/resumo-anual");await expect(page.getByRole("heading",{name:"Posição atual de investimentos",exact:true})).toBeVisible();
  107 |  await paint(page,page.getByRole("heading",{name:"Posição atual de investimentos",exact:true}),"C-annual");
  108 |  const annual=await json(page,"/annual-summary?year=2026");await save("C-annual-api",annual);
  109 |  expect(at(annual,"balance","observed","income")).toBe("250.10");expect(at(annual,"balance","observed","expense")).toBe("162.20");expect(at(annual,"balance","observed","balance")).toBe("87.90");
  110 |  expect(at(annual,"investments","totalCost")).toBeNull();expect(at(annual,"investments","totalValue")).toBe(501.67);
  111 |  const cash=await json(page,"/transactions/summary?month=10&year=2026");
  112 |  expect(Number(at(cash,"observed","balance"))).toBe(-13.10);expect(at(cash,"coverage","state")).toBe("PARTIAL");
  113 |  const book=await download(page,"C-october.xlsx");const all=JSON.stringify(book);
  114 |  expect(all).toContain("250.10");expect(all).toContain("162.20");expect(all).toContain("87.90");
  115 |  expect(JSON.stringify(book["Cobertura"])).toContain("PARTIAL");expect(all).toContain("22/10/2026");expect(all).toContain("15/10/2026");
  116 |  const extract=book["Extrato Financeiro"];expect(Array.isArray(extract)).toBe(true);
  117 |  const lines=extract as unknown[][];
  118 |  // Keep the precision check red, while inspecting independent monetary columns.
> 119 |  expect.soft(lines.find(r=>r[2]==="CF032 receita")?.slice(0,3),"Export must preserve the supplied wall-clock seconds; no precision exception is approved").toEqual(["22/10/2026","12:34:56","CF032 receita"]);
      |                                                                                                                                                            ^ Error: Export must preserve the supplied wall-clock seconds; no precision exception is approved
  120 |  expect(lines.filter(r=>r[2]==="CF032 receita")).toHaveLength(1);
  121 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[6]).toBe("250.1");
  122 |  expect(lines.find(r=>r[2]==="CF032 despesa")?.[6]).toBe("40.2");
  123 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[7]).toBe("SETTLED");
  124 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[8]).toBe("USER");
  125 |  const purchases=book["Consumo cartão"];expect(Array.isArray(purchases)).toBe(true);
  126 |  // The sheet may detail installments; three40 rows reconcile the single120 purchase.
  127 |  const purchaseRows=(purchases as unknown[][]).slice(1);expect(purchaseRows.map(r=>r[3]).sort()).toEqual(["40.0","40.0","40.0"]);expect(purchaseRows.map(r=>r[0])).toEqual(["15/10/2026","15/10/2026","15/10/2026"]);
  128 |  // A distinct period cannot acquire October flows; the current position remains dated.
  129 |  const older=await json(page,"/annual-summary?year=2025");await save("C-previous-year-api",older);
  130 |  expect(at(older,"investments","valuationAsOf")).toBe(day);
  131 |  await financial(page,f.person.email,"C-exported","1286.90","270.00");
  132 | });
  133 | 
  134 | test("E legado conserva proveniência, UNKNOWN e complemento sem histórico fictício",async({page})=>{
  135 |  const person=await register(page,"legacy");const seeded=await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`);expect(seeded.ok(),await seeded.text()).toBe(true);
  136 |  const before=await sql(page,person.email,"E-before");const account=rows(before.accounts)[0];
  137 |  await page.goto("/onboarding");await expect(page.getByRole("heading",{name:"Organize seu ponto de partida"})).toBeVisible();
  138 |  const sections:Record<string,{answer:string;items:unknown[]}>=Object.fromEntries(["accounts","cards","investments","goals","allocations","forecasts"].map(k=>[k,{answer:"NONE",items:[]}]));
  139 |  sections.accounts={answer:"PROVIDED",items:[{tempId:randomUUID(),action:"LINK",ref:{kind:"ACCOUNT",id:account.id}}]};
  140 |  const payload={context:{currency:"BRL",baseDate:day,boundaryAcknowledged:true,cashOnlyAcknowledged:true},currentStep:"REVIEW",sections};
  141 |  const saved=await request(page).put("/api/onboarding/draft",{data:{contractVersion:1,expectedVersion:"0",action:"SAVE",payload}});expect(saved.status(),await saved.text()).toBe(200);
  142 |  await page.reload();await page.getByRole("button",{name:"Preparar revisão financeira"}).click();await expect(page.getByRole("heading",{name:"Confira antes de registrar"})).toBeVisible();
  143 |  const pending=at(await json(page,"/onboarding"),"data","pendingIntent");
  144 |  expect(at(pending,"summary","metrics","netWorth","value")).toBe("1000.00");expect(at(pending,"summary","metrics","freeAccountCash","state")).toBe("UNKNOWN");expect(at(pending,"summary","metrics","reservedAccounts","value")).toBeNull();
  145 |  await paint(page,page.getByRole("heading",{name:"Confira antes de registrar"}),"E-legacy-unknown");
  146 |  await page.getByRole("button",{name:"Confirmar informações e registrar posições"}).click();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();await page.reload();
  147 |  const after=await sql(page,person.email,"E-after");expect(after.accounts).toEqual(before.accounts);expect(after.legacyReservations).toEqual(before.legacyReservations);expect(rows(after.transactions)).toHaveLength(0);expect(rows(after.investments)).toHaveLength(0);expect(rows(after.allocations)).toHaveLength(0);
  148 |  await save("E-receipt",at(await json(page,"/onboarding"),"data","completedReceipt"));
  149 | });
  150 | 
  151 | test("E2 fonte legada incerta bloqueia nova destinação também no uso cotidiano",async({page})=>{
  152 |  const person=await register(page,"legacy-capacity");
  153 |  const seeded=await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`);expect(seeded.ok(),await seeded.text()).toBe(true);
  154 |  const before=await sql(page,person.email,"E2-before");const account=rows(before.accounts)[0];
  155 |  const goal=record(await post(page,"/goals",{title:"Nova destinação na fonte incerta",targetValue:600,deadline:"2027-06-30",type:"MONETARY",useChecklist:false,color:"BLUE"}));
  156 |  const attempt=await request(page).put(`/api/goals/${goal.id}/allocations`,{data:{accountId:account.id,amount:"0.01"}});
  157 |  const after=await sql(page,person.email,"E2-after-attempt");
  158 |  await save("E2-response",{status:attempt.status(),body:await attempt.text(),expected:"400 without new allocation; SPEC-001 §5/5.1 source risk survives a new goal ID"});
  159 |  await page.goto("/metas");await paint(page,page.getByRole("button",{name:`Ver detalhes da meta ${goal.title}`}),"E2-source-capacity");
  160 |  expect(attempt.status(),"Unknown source reservation must prevent allocating even0.01 through a different goal").toBe(400);
  161 |  expect(rows(after.allocations)).toHaveLength(0);expect(after.accounts).toEqual(before.accounts);
  162 | });
  163 | 
  164 | test("F contas a receber: baixas parciais, calendário e persistência",async({page})=>{
  165 |  const f=await e01(page,"receivable");const forecast=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content"))[0];expect(forecast.amount).toBe(80);
  166 |  for(const [index,amount,total,remaining] of [[0,"30.00","1330.00",50],[1,"50.00","1380.00",0]] as const){
  167 |   await page.goto("/extrato");await page.getByRole("button",{name:"Mês seguinte do extrato",exact:true}).click();
  168 |   await page.getByText(String(forecast.description),{exact:true}).first().click();await page.getByRole("button",{name:"Baixar previsão",exact:true}).click();
  169 |   const modal=page.getByRole("dialog",{name:"Baixar previsão",exact:true});await modal.getByLabel("Valor da baixa").fill(amount);await modal.getByLabel("Data efetiva").fill(index===0?"2026-10-21":day);
  170 |   const response=page.waitForResponse(r=>r.url().endsWith(`/transactions/${forecast.id}/settlements`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar baixa",exact:true}).click();const r=await response;expect(r.ok(),await r.text()).toBe(true);await expect(modal).toHaveCount(0);await page.reload();
  171 |   await financial(page,f.person.email,`F-${index}`,total,"350.00");const current=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content")).find(t=>t.id===forecast.id);expect(current).toMatchObject({date:"2026-11-05",remainingAmount:remaining});
  172 |  }
  173 |  const book=await download(page,"F-receivables.xlsx");expect(JSON.stringify(book)).toContain("21/10/2026");expect(JSON.stringify(book)).toContain("22/10/2026");
  174 | });
  175 | 
  176 | test("G resposta perdida após commit SQL, recuperação e replay de efeito único",async({page})=>{
  177 |  const f=await e01(page,"lost");const pay=await paymentForm(page,f.card,String(f.checking.id),"200.00");
  178 |  let requests=0;let body:unknown;let receipt:unknown;
  179 |  let resolveLost!:()=>void;const committedAndLost=new Promise<void>(resolve=>{resolveLost=resolve;});
  180 |  await page.route(`**/api/cards/${f.card.id}/pay`,async route=>{
  181 |   requests++;body=route.request().postDataJSON();const response=await route.fetch();expect(response.status()).toBe(200);receipt=await response.json();
  182 |   const committed=await financial(page,f.person.email,"G-committed-before-response-loss","1100.00","150.00");expect(rows(committed.payments)).toHaveLength(1);
  183 |   await route.abort("failed");resolveLost();
  184 |  });
  185 |  await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();await committedAndLost;
  186 |  await expect(pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"})).toBeEnabled();await expect(pay.getByRole("button",{name:"Confirmar Pagamento"})).toBeDisabled();
  187 |  await paint(page,pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}),"G-result-unknown");
  188 |  await page.unroute(`**/api/cards/${f.card.id}/pay`);await pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}).click();await expect(pay).toHaveCount(0);
  189 |  const replay=await request(page).post(`/api/cards/${f.card.id}/pay`,{data:body});expect(replay.status()).toBe(200);expect(await replay.json()).toEqual(receipt);
  190 |  const conflict=await request(page).post(`/api/cards/${f.card.id}/pay`,{data:{...record(body),amount:201}});expect(conflict.status()).toBe(409);
  191 |  await page.reload();const final=await financial(page,f.person.email,"G-reloaded","1100.00","150.00");expect(rows(final.payments)).toHaveLength(1);expect(rows(final.transactions).filter(t=>t.origin==="INVOICE_PAYMENT")).toHaveLength(1);expect(requests).toBe(1);
  192 |  expect(final.netWorth).toBe("1451.00");expect(final.reservedAccounts).toBe("350.00");expect(rows(final.accounts).find(a=>a.id===f.checking.id)?.balance).toBe("800.00");
  193 |  expect(rows(await json(page,"/cards"))[0]).toMatchObject({committedLimit:150,availableLimit:850});
  194 |  expect(rows(final.payments)[0].operation_id).toBe(record(body).operationId);
  195 |  await save("G-protocol",{initialBrowserPosts:requests,explicitReplays:1,rejectedContentConflicts:1,totalPostAttempts:3,financialEffects:1,body,receipt,replay:await replay.json()});
  196 | });
  197 | 
  198 | test("H dois usuários intercalados, ownership, exportação e troca de sessão",async({page,browser})=>{
  199 |  const a=await register(page,"owners","A");const ctx=await browser.newContext({baseURL:"http://127.0.0.1:3142",timezoneId:"America/Sao_Paulo",locale:"pt-BR"});
  200 |  try{
  201 |   const other=await ctx.newPage();const b=await register(other,"owners","B");
  202 |   const aa=record(await post(page,"/accounts",{name:"EXCLUSIVO A",type:"CHECKING",initialBalance:1000,color:"#10b981"}));const bb=record(await post(other,"/accounts",{name:"EXCLUSIVO B",type:"CHECKING",initialBalance:2300,color:"#10b981"}));
  203 |   // Observable barrier: each command awaits its own HTTP commit before alternation.
  204 |   await transaction(page,String(aa.id),"INCOME","RECEITA EXCLUSIVA A","10.00");await transaction(other,String(bb.id),"EXPENSE","DESPESA EXCLUSIVA B","20.00");
  205 |   const before=await sql(other,b.email,"H-B-before");
  206 |   const bCard=record(await post(other,"/cards",{name:"CARTÃO EXCLUSIVO B",last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"}));
  207 |   expect((await request(page).get(`/api/cards/${bCard.id}/invoice?month=10&year=2026`)).status()).toBe(404);
  208 |   const bReceipt=rows(before.receipts).find(r=>r.kind==="TRANSACTION_CREATE");expect(bReceipt).toBeTruthy();
  209 |   expect((await request(other).get(`/api/financial-intents/${bReceipt!.id}`)).status()).toBe(200);
  210 |   expect((await request(page).get(`/api/financial-intents/${bReceipt!.id}`)).status()).toBe(404);
  211 |   const forbidden=await request(page).put(`/api/accounts/${bb.id}`,{data:{name:"INVASÃO",type:"CHECKING",color:"#10b981"}});expect(forbidden.status()).toBe(404);
  212 |   const transfer=await request(page).post("/api/transactions",{data:{description:"Tentativa cruzada",amount:1,date:day,type:"TRANSFER",accountId:aa.id,destinationAccountId:bb.id,isPaid:true,fee:0,operationId:randomUUID()}});expect(transfer.status()).toBe(404);
  213 |   expect(await sql(other,b.email,"H-B-after")).toEqual(before);expect(before.accountTotal).toBe("2280.00");expect((await sql(page,a.email,"H-A")).accountTotal).toBe("1010.00");
  214 |   await page.goto("/contas");await other.goto("/contas");await expect(page.getByText("EXCLUSIVO A",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toHaveCount(0);await expect(other.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(other.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);
  215 |   const exportsA=await download(page,"H-A.xlsx"),exportsB=await download(other,"H-B.xlsx");expect(JSON.stringify(exportsA)).not.toContain("EXCLUSIVO B");expect(JSON.stringify(exportsB)).not.toContain("EXCLUSIVO A");expect(JSON.stringify(exportsA)).toContain("RECEITA EXCLUSIVA A");expect(JSON.stringify(exportsB)).toContain("DESPESA EXCLUSIVA B");
  216 |   await logout(page);await login(page,b);await page.goto("/contas");await page.reload();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);await paint(page,page.getByText("EXCLUSIVO B",{exact:true}),"H-B-new-session");
  217 |   await logout(page);await login(page,a);expect((await sql(page,a.email)).accountTotal).toBe("1010.00");
  218 |  }finally{await ctx.close();}
  219 | });
```