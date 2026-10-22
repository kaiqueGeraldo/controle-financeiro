# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> E legado conserva proveniência, UNKNOWN e complemento sem histórico fictício
- Location: tests\cf032\journeys.spec.ts:112:5

# Error details

```
Error: {"error":"BadSqlGrammarException","message":"PreparedStatementCallback; bad SQL grammar [select id::text,description,amount::text,date::text,time::text,status,origin,is_paid,operation_id::text,recorded_at::text from transactions where user_id=? order by date,id]"}

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: Carregando layout...
  - alert [ref=e3]: Finanças - Dashboard
```

# Test source

```ts
  13  | }
  14  | 
  15  | test("A cadastro, rascunho, aplicação E01, recibo e releitura",async({page})=>{
  16  |  const person=await register(page,"a");await page.goto("/onboarding");
  17  |  await page.getByLabel("Nome preferido (opcional)").fill("CF032 rascunho persistido");
  18  |  await page.getByLabel("Confirmo que os saldos não incluem movimentos que registrarei novamente").check();
  19  |  await page.getByLabel("Confirmo que o caixa da corretora não inclui o valor dos ativos aplicados").check();
  20  |  await page.getByRole("button",{name:"Salvar rascunho",exact:true}).click();
  21  |  await expect(page.getByRole("status").filter({hasText:"Últimas respostas confirmadas"})).toBeVisible();
  22  |  await page.reload();await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("CF032 rascunho persistido");
  23  |  expect((await sql(page,person.email,"A-draft")).applications).toBe(0);
  24  |  const fixture=await e01(page,"a",person);const state=await financial(page,person.email,"A-applied","1300.00","350.00");
  25  |  expect(state.netWorth).toBe("1451.00");expect(state.investmentTotal).toBe("501.00");
  26  |  expect(state.applications).toBe(16);expect(rows(state.receipts).filter(r=>r.kind==="ONBOARDING_COMPLETE")).toHaveLength(1);
  27  |  expect(rows(state.transactions)).toHaveLength(1);expect(rows(state.transactions)[0]).toMatchObject({is_paid:false,amount:"80.00"});
  28  |  expect(at(fixture.receipt,"summary","metrics","reservedAccounts","value")).toBe("350.00");
  29  |  expect(at(fixture.receipt,"summary","metrics","reservedInvestments","value")).toBe("200.00");
  30  |  expect(rows(state.investments).find(i=>i.position_mode==="MONETARY")).toMatchObject({quantity:null,total_cost:null,valuation_amount:"500.00",acquisition_date:null,historical_source:null});
  31  |  await page.reload();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();
  32  |  expect(at(await json(page,"/onboarding"),"data","completedReceipt")).toEqual(fixture.receipt);
  33  |  await paint(page,page.getByRole("heading",{name:"Entrevista concluída",exact:true}),"A-completed");
  34  |  await save("A-api-receipt",fixture.receipt);
  35  | });
  36  | 
  37  | async function daily(page:Page,suffix:string,ui:boolean){
  38  |  const f=await e01(page,suffix);const a=String(f.checking.id),b=String(f.savings.id),email=f.person.email;
  39  |  if(ui){await transaction(page,a,"INCOME","CF032 receita","250.10");await transaction(page,a,"EXPENSE","CF032 despesa","40.20");await transaction(page,a,"TRANSFER","CF032 transferência","100.00",b);}
  40  |  else {
  41  |   const inc=rows(await json(page,"/categories?type=INCOME"))[0],exp=rows(await json(page,"/categories?type=EXPENSE"))[0];
  42  |   await post(page,"/transactions",{description:"CF032 receita",amount:250.10,date:day,time:"12:34:56",type:"INCOME",accountId:a,categoryId:inc.id,isPaid:true,operationId:randomUUID()});
  43  |   await post(page,"/transactions",{description:"CF032 despesa",amount:40.20,date:day,type:"EXPENSE",accountId:a,categoryId:exp.id,isPaid:true,operationId:randomUUID()});
  44  |   await post(page,"/transactions",{description:"CF032 transferência",amount:100,date:day,type:"TRANSFER",accountId:a,destinationAccountId:b,isPaid:true,fee:2,operationId:randomUUID()});
  45  |  }
  46  |  await financial(page,email,`${suffix}-cash`,"1507.90","350.00");
  47  |  const cats=rows(await json(page,"/categories?type=EXPENSE"));
  48  |  if(ui){
  49  |   await page.goto("/cartoes");await page.getByTitle("Lançar Compra",{exact:true}).click();const modal=page.getByRole("dialog",{name:"Nova Despesa no Crédito"});
  50  |   await modal.getByPlaceholder("0,00").fill("120.00");await modal.getByPlaceholder("Ex: Uber, Amazon, Jantar...").fill("CF032 compra parcelada");
  51  |   await modal.locator('input[type="date"]').fill("2026-10-15");await modal.locator("select").nth(0).selectOption(String(f.card.id));await modal.locator("select").nth(1).selectOption(String(cats[0].id));await modal.locator("select").nth(2).selectOption("3");
  52  |   const response=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/cards/transaction"&&r.request().method()==="POST");
  53  |   await modal.getByRole("button",{name:/Salvar|Lançar|Confirmar/}).click();const result=await response;expect(result.ok(),await result.text()).toBe(true);await expect(modal).toHaveCount(0);
  54  |  }else await post(page,"/cards/transaction",{cardId:f.card.id,categoryId:cats[0].id,description:"CF032 compra parcelada",amount:120,date:"2026-10-15",time:null,totalInstallments:3});
  55  |  await financial(page,email,`${suffix}-purchase`,"1507.90","470.00");
  56  |  const pay=await paymentForm(page,f.card,a,"200.00");const paid=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/cards/${f.card.id}/pay`&&r.request().method()==="POST");
  57  |  await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();const paidResponse=await paid;expect(paidResponse.ok(),await paidResponse.text()).toBe(true);await expect(pay).toHaveCount(0);
  58  |  await financial(page,email,`${suffix}-payment`,"1307.90","270.00");
  59  |  const stock=rows(await json(page,"/investments")).find(i=>i.type==="STOCK");expect(stock).toBeTruthy();
  60  |  if(ui){
  61  |   await page.goto("/investimentos");await page.getByText(String(stock!.ticker),{exact:true}).click();await page.getByRole("button",{name:"Aportar",exact:true}).click();
  62  |   const modal=page.getByRole("dialog",{name:`${stock!.ticker} - Operação`,exact:true});await modal.getByPlaceholder("0",{exact:true}).fill("2");await modal.getByPlaceholder("0,00",{exact:true}).fill("10");await modal.getByLabel("Taxas / retenções").fill("1");await modal.getByLabel("Conta",{exact:true}).selectOption(a);
  63  |   const op=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/investments/operation"&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar Operação",exact:true}).click();const applied=await op;expect(applied.ok(),await applied.text()).toBe(true);await expect(modal).toHaveCount(0);
  64  |  }else await post(page,"/investments/operation",{investmentId:stock!.id,type:"BUY",quantity:2,price:10,fees:1,date:day,accountId:a,operationId:randomUUID()});
  65  |  const goals=rows(await json(page,"/goals"));const trip=goals.find(g=>g.currentValue===500);expect(trip).toBeTruthy();
  66  |  if(ui){
  67  |   await page.goto("/metas");await page.getByRole("button",{name:`Ver detalhes da meta ${trip!.title}`}).click();await page.getByRole("button",{name:"Aporte Avulso",exact:true}).click();
  68  |   const modal=page.getByRole("dialog",{name:"Guardar Dinheiro",exact:true});await modal.getByPlaceholder("0",{exact:true}).fill("100");await modal.locator("select").selectOption(a);
  69  |   const deposited=page.waitForResponse(r=>r.url().includes(`/goals/${trip!.id}/deposit`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar Aporte",exact:true}).click();const response=await deposited;expect(response.ok(),await response.text()).toBe(true);await expect(modal).toHaveCount(0);
  70  |  }else {const r=await page.request.put(`/api/goals/${trip!.id}/allocations`,{data:{accountId:a,amount:"400.00"}});expect(r.status(),await r.text()).toBe(204);}
  71  |  const final=await financial(page,email,`${suffix}-final`,"1286.90","270.00");
  72  |  expect(final.netWorth).toBe("1518.57");expect(final.investmentTotal).toBe("501.67");expect(final.reservedAccounts).toBe("450.00");expect(final.reservedInvestments).toBe("200.00");
  73  |  expect(rows(final.investments).find(i=>i.type==="STOCK"||i.ticker===stock!.ticker)).toMatchObject({quantity:"5.00000000",total_cost:"21.60",valuation_amount:"1.67"});
  74  |  expect(rows(final.allocations).find(r=>r.account_id===a)).toMatchObject({amount:"400.00"});
  75  |  expect(rows(final.accounts).find(r=>r.id===a)).toMatchObject({balance:"886.90"});
  76  |  await save(`${suffix}-api`,{accounts:await json(page,"/accounts/position"),cards:await json(page,"/cards"),annual:await json(page,"/annual-summary?year=2026"),cash:await json(page,"/transactions/summary?month=10&year=2026")});
  77  |  return f;
  78  | }
  79  | 
  80  | test("B uso diário pela UI, reconciliação, reload e logout/login",async({page})=>{
  81  |  const f=await daily(page,"B",true);await page.goto("/contas");await page.reload();await expect(page.getByText("Corrente sintética",{exact:true}).first()).toBeVisible();
  82  |  await paint(page,page.getByText("Corrente sintética",{exact:true}).first(),"B-accounts");
  83  |  const before=await sql(page,f.person.email);await logout(page);await login(page,f.person);await page.goto("/extrato");await page.reload();
  84  |  await expect(page.getByText("CF032 receita",{exact:true})).toBeVisible();expect(await sql(page,f.person.email,"B-new-session")).toEqual(before);
  85  |  expect(at(await json(page,"/onboarding"),"data","completedReceipt")).toEqual(f.receipt);
  86  |  await paint(page,page.getByText("CF032 receita",{exact:true}),"B-new-session");
  87  | });
  88  | 
  89  | test("C relatório e XLSX real com datas, origens, estados e totais independentes",async({page})=>{
  90  |  const f=await daily(page,"C",false);
  91  |  await page.goto("/resumo-anual");await expect(page.getByRole("heading",{name:"Posição atual de investimentos",exact:true})).toBeVisible();
  92  |  await paint(page,page.getByRole("heading",{name:"Posição atual de investimentos",exact:true}),"C-annual");
  93  |  const annual=await json(page,"/annual-summary?year=2026");await save("C-annual-api",annual);
  94  |  const cash=await json(page,"/transactions/summary?month=10&year=2026");
  95  |  expect(Number(at(cash,"observed","balance"))).toBe(-13.10);expect(at(cash,"coverage","state")).toBe("PARTIAL");
  96  |  const book=await download(page,"C-october.xlsx");const all=JSON.stringify(book);
  97  |  expect(all).toContain("250.10");expect(all).toContain("162.20");expect(all).toContain("87.90");
  98  |  expect(JSON.stringify(book["Cobertura"])).toContain("PARTIAL");expect(all).toContain("22/10/2026");expect(all).toContain("15/10/2026");
  99  |  const extract=book["Extrato Financeiro"];expect(Array.isArray(extract)).toBe(true);
  100 |  const lines=extract as unknown[][];
  101 |  expect(lines.find(r=>r[2]==="CF032 receita")?.slice(0,3)).toEqual(["22/10/2026","12:34:56","CF032 receita"]);
  102 |  expect(lines.filter(r=>r[2]==="CF032 receita")).toHaveLength(1);
  103 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[7]).toBe("SETTLED");
  104 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[8]).toBe("USER");
  105 |  const purchases=book["Consumo cartão"];expect(Array.isArray(purchases)).toBe(true);expect(JSON.stringify(purchases)).toContain("120.0");
  106 |  // A distinct period cannot acquire October flows; the current position remains dated.
  107 |  const older=await json(page,"/annual-summary?year=2025");await save("C-previous-year-api",older);
  108 |  expect(at(older,"investments","valuationAsOf")).toBe(day);
  109 |  await financial(page,f.person.email,"C-exported","1286.90","270.00");
  110 | });
  111 | 
  112 | test("E legado conserva proveniência, UNKNOWN e complemento sem histórico fictício",async({page})=>{
> 113 |  const person=await register(page,"legacy");const seeded=await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`);expect(seeded.ok(),await seeded.text()).toBe(true);
      |                                                                                                                                                                                                            ^ Error: {"error":"BadSqlGrammarException","message":"PreparedStatementCallback; bad SQL grammar [select id::text,description,amount::text,date::text,time::text,status,origin,is_paid,operation_id::text,recorded_at::text from transactions where user_id=? order by date,id]"}
  114 |  const before=await sql(page,person.email,"E-before");const account=rows(before.accounts)[0];
  115 |  await page.goto("/onboarding");await expect(page.getByRole("heading",{name:"Organize seu ponto de partida"})).toBeVisible();
  116 |  const sections:Record<string,{answer:string;items:unknown[]}>=Object.fromEntries(["accounts","cards","investments","goals","allocations","forecasts"].map(k=>[k,{answer:"NONE",items:[]}]));
  117 |  sections.accounts={answer:"PROVIDED",items:[{tempId:randomUUID(),action:"LINK",ref:{kind:"ACCOUNT",id:account.id}}]};
  118 |  const payload={context:{currency:"BRL",baseDate:day,boundaryAcknowledged:true,cashOnlyAcknowledged:true},currentStep:"REVIEW",sections};
  119 |  const saved=await page.request.put("/api/onboarding/draft",{data:{contractVersion:1,expectedVersion:"0",action:"SAVE",payload}});expect(saved.status(),await saved.text()).toBe(200);
  120 |  await page.reload();await page.getByRole("button",{name:"Preparar revisão financeira"}).click();await expect(page.getByRole("heading",{name:"Confira antes de registrar"})).toBeVisible();
  121 |  const pending=at(await json(page,"/onboarding"),"data","pendingIntent");
  122 |  expect(at(pending,"summary","metrics","netWorth","value")).toBe("1000.00");expect(at(pending,"summary","metrics","freeAccountCash","state")).toBe("UNKNOWN");expect(at(pending,"summary","metrics","reservedAccounts","value")).toBeNull();
  123 |  await paint(page,page.getByRole("heading",{name:"Confira antes de registrar"}),"E-legacy-unknown");
  124 |  await page.getByRole("button",{name:"Confirmar informações e registrar posições"}).click();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();await page.reload();
  125 |  const after=await sql(page,person.email,"E-after");expect(after.accounts).toEqual(before.accounts);expect(after.legacyReservations).toEqual(before.legacyReservations);expect(rows(after.transactions)).toHaveLength(0);expect(rows(after.investments)).toHaveLength(0);expect(rows(after.allocations)).toHaveLength(0);
  126 |  await save("E-receipt",at(await json(page,"/onboarding"),"data","completedReceipt"));
  127 | });
  128 | 
  129 | test("F contas a receber: baixas parciais, calendário e persistência",async({page})=>{
  130 |  const f=await e01(page,"receivable");const forecast=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content"))[0];expect(forecast.amount).toBe(80);
  131 |  for(const [index,amount,total,remaining] of [[0,"30.00","1330.00",50],[1,"50.00","1380.00",0]] as const){
  132 |   await page.goto("/extrato");await page.getByRole("button",{name:"Mês seguinte do extrato",exact:true}).click();
  133 |   await page.getByText(String(forecast.description),{exact:true}).first().click();await page.getByRole("button",{name:"Baixar previsão",exact:true}).click();
  134 |   const modal=page.getByRole("dialog",{name:"Baixar previsão",exact:true});await modal.getByLabel("Valor da baixa").fill(amount);await modal.getByLabel("Data efetiva").fill(index===0?"2026-10-21":day);
  135 |   const response=page.waitForResponse(r=>r.url().endsWith(`/transactions/${forecast.id}/settlements`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar baixa",exact:true}).click();const r=await response;expect(r.ok(),await r.text()).toBe(true);await expect(modal).toHaveCount(0);await page.reload();
  136 |   await financial(page,f.person.email,`F-${index}`,total,"350.00");const current=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content")).find(t=>t.id===forecast.id);expect(current).toMatchObject({date:"2026-11-05",remainingAmount:remaining});
  137 |  }
  138 |  const book=await download(page,"F-receivables.xlsx");expect(JSON.stringify(book)).toContain("21/10/2026");expect(JSON.stringify(book)).toContain("22/10/2026");
  139 | });
  140 | 
  141 | test("G resposta perdida após commit SQL, recuperação e replay de efeito único",async({page})=>{
  142 |  const f=await e01(page,"lost");const pay=await paymentForm(page,f.card,String(f.checking.id),"200.00");
  143 |  let requests=0;let body:unknown;let receipt:unknown;
  144 |  let resolveLost!:()=>void;const committedAndLost=new Promise<void>(resolve=>{resolveLost=resolve;});
  145 |  await page.route(`**/api/cards/${f.card.id}/pay`,async route=>{
  146 |   requests++;body=route.request().postDataJSON();const response=await route.fetch();expect(response.status()).toBe(200);receipt=await response.json();
  147 |   const committed=await financial(page,f.person.email,"G-committed-before-response-loss","1100.00","150.00");expect(rows(committed.payments)).toHaveLength(1);
  148 |   await route.abort("failed");resolveLost();
  149 |  });
  150 |  await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();await committedAndLost;
  151 |  await expect(pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"})).toBeEnabled();await expect(pay.getByRole("button",{name:"Confirmar Pagamento"})).toBeDisabled();
  152 |  await paint(page,pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}),"G-result-unknown");
  153 |  await page.unroute(`**/api/cards/${f.card.id}/pay`);await pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}).click();await expect(pay).toHaveCount(0);
  154 |  const replay=await page.request.post(`/api/cards/${f.card.id}/pay`,{data:body});expect(replay.status()).toBe(200);expect(await replay.json()).toEqual(receipt);
  155 |  await page.reload();const final=await financial(page,f.person.email,"G-reloaded","1100.00","150.00");expect(rows(final.payments)).toHaveLength(1);expect(rows(final.transactions).filter(t=>t.origin==="INVOICE_PAYMENT")).toHaveLength(1);expect(requests).toBe(1);
  156 |  expect(rows(final.payments)[0].operation_id).toBe(record(body).operationId);
  157 |  await save("G-protocol",{browserRequests:requests,explicitReplays:1,financialEffects:1,body,receipt,replay:await replay.json()});
  158 | });
  159 | 
  160 | test("H dois usuários intercalados, ownership, exportação e troca de sessão",async({page,browser})=>{
  161 |  const a=await register(page,"owners","A");const ctx=await browser.newContext({baseURL:"http://127.0.0.1:3142",timezoneId:"America/Sao_Paulo",locale:"pt-BR"});
  162 |  try{
  163 |   const other=await ctx.newPage();const b=await register(other,"owners","B");
  164 |   const aa=record(await post(page,"/accounts",{name:"EXCLUSIVO A",type:"CHECKING",initialBalance:1000,color:"#10b981"}));const bb=record(await post(other,"/accounts",{name:"EXCLUSIVO B",type:"CHECKING",initialBalance:2300,color:"#10b981"}));
  165 |   // Observable barrier: each command awaits its own HTTP commit before alternation.
  166 |   await transaction(page,String(aa.id),"INCOME","RECEITA EXCLUSIVA A","10.00");await transaction(other,String(bb.id),"EXPENSE","DESPESA EXCLUSIVA B","20.00");
  167 |   const before=await sql(other,b.email,"H-B-before");
  168 |   const forbidden=await page.request.put(`/api/accounts/${bb.id}`,{data:{name:"INVASÃO",balance:1,type:"CHECKING",color:"#10b981"}});expect(forbidden.status()).toBe(404);
  169 |   const transfer=await page.request.post("/api/transactions",{data:{description:"Tentativa cruzada",amount:1,date:day,type:"TRANSFER",accountId:aa.id,destinationAccountId:bb.id,isPaid:true,fee:0,operationId:randomUUID()}});expect(transfer.status()).toBe(404);
  170 |   expect(await sql(other,b.email,"H-B-after")).toEqual(before);expect(before.accountTotal).toBe("2280.00");expect((await sql(page,a.email,"H-A")).accountTotal).toBe("1010.00");
  171 |   await page.goto("/contas");await other.goto("/contas");await expect(page.getByText("EXCLUSIVO A",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toHaveCount(0);await expect(other.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(other.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);
  172 |   const exportsA=await download(page,"H-A.xlsx"),exportsB=await download(other,"H-B.xlsx");expect(JSON.stringify(exportsA)).not.toContain("EXCLUSIVO B");expect(JSON.stringify(exportsB)).not.toContain("EXCLUSIVO A");expect(JSON.stringify(exportsA)).toContain("RECEITA EXCLUSIVA A");expect(JSON.stringify(exportsB)).toContain("DESPESA EXCLUSIVA B");
  173 |   await logout(page);await login(page,b);await page.goto("/contas");await page.reload();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);await paint(page,page.getByText("EXCLUSIVO B",{exact:true}),"H-B-new-session");
  174 |   await logout(page);await login(page,a);expect((await sql(page,a.email)).accountTotal).toBe("1010.00");
  175 |  }finally{await ctx.close();}
  176 | });
  177 | 
  178 | for(const [index,zone] of ["America/Sao_Paulo","UTC","Pacific/Kiritimati"].entries())test(`T${index} prazo e hábito em ${zone}`,async({browser})=>{
  179 |  const context=await browser.newContext({baseURL:"http://127.0.0.1:3142",timezoneId:zone,locale:"pt-BR",viewport:{width:[360,768,1440][index],height:1000}});
  180 |  try{
  181 |   const page=await context.newPage();const f=await e01(page,`temporal-${index}`);const g=rows(await json(page,"/goals")).find(g=>g.type==="NUMERIC");expect(g).toBeTruthy();
  182 |   const habit=record(await post(page,"/habits",{name:"CF032 leitura diária",icon:"BookOpen",color:"BLUE",frequency:"DAILY",goalId:g!.id}));
  183 |   await page.goto("/habitos");const card=page.getByRole("button",{name:"Ver detalhes do hábito CF032 leitura diária"});
  184 |   await paint(page,card.getByRole("button",{name:"Marcar Feito"}),`T${index}-ready`);
  185 |   const toggle=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Marcar Feito"}).click();const marked=await toggle;expect(marked.status()).toBe(200);expect(marked.request().postDataJSON()).toEqual({date:day});await page.reload();await expect(card.getByRole("button",{name:"Feito Hoje"})).toBeVisible();
  186 |   expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(5);
  187 |   const undo=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Feito Hoje"}).click();expect((await undo).status()).toBe(200);await page.reload();
  188 |   const future=await page.request.post(`/api/habits/${habit.id}/toggle`,{data:{date:"2026-10-23"}});expect(future.status()).toBe(400);expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(4);
  189 |   const state=await financial(page,f.person.email,`T${index}-final`,"1300.00","350.00");expect(rows(state.habitLogs)).toEqual([{log_date:day,status:"PENDING",goal_history_id:null}]);
  190 |   await page.goto("/metas");
  191 |   const yesterday=page.getByRole("button",{name:"Ver detalhes da meta Prazo ontem"}),today=page.getByRole("button",{name:"Ver detalhes da meta Prazo hoje"}),tomorrow=page.getByRole("button",{name:"Ver detalhes da meta Prazo amanhã"});
  192 |   await expect(yesterday).toContainText("Atrasado");await expect(today).not.toContainText("Atrasado");await expect(tomorrow).not.toContainText("Atrasado");
  193 |   await expect(today).toContainText("22/10/2026");await expect(tomorrow).toContainText("23/10/2026");
  194 |   await paint(page,today,`T${index}-deadlines`);
  195 |  }finally{await context.close();}
  196 | });
  197 | 
```