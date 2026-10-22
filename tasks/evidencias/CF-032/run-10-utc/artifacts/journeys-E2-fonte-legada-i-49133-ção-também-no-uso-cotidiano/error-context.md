# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> E2 fonte legada incerta bloqueia nova destinação também no uso cotidiano
- Location: tests\cf032\journeys.spec.ts:151:5

# Error details

```
Error: Unknown source reservation must prevent allocating even0.01 through a different goal

expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 204
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
          - generic [ref=f1e8]: cf003-a-cf032-9847fcde-legacy-capacity@example.invalid
      - navigation [ref=f1e10]:
        - link "Dashboard" [ref=f1e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f1e19] [cursor=pointer]:
          - /url: /contas
        - link "Configuração inicial" [ref=f1e24] [cursor=pointer]:
          - /url: /onboarding
        - link "Extrato" [ref=f1e30] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f1e36] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f1e41] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f1e46] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f1e53] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f1e61] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f1e68] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f1e75]:
        - button "Privacidade" [ref=f1e76] [cursor=pointer]
        - button "Configurações" [ref=f1e84] [cursor=pointer]
        - button "Sair da Conta" [ref=f1e89] [cursor=pointer]
    - main [ref=f1e95]:
      - generic [ref=f1e96]:
        - generic [ref=f1e98]:
          - generic [ref=f1e99]:
            - heading "Metas & Objetivos" [level=1] [ref=f1e100]
            - paragraph [ref=f1e101]: Financeiro, Leitura, Saúde e mais.
          - button "Nova Meta" [ref=f1e102] [cursor=pointer]
        - main [ref=f1e105]:
          - generic [ref=f1e107]:
            - generic [ref=f1e108]:
              - generic [ref=f1e109]: Patrimônio Alvo
              - generic [ref=f1e117]: R$ 0,01
              - paragraph [ref=f1e118]:
                - text: de
                - generic [ref=f1e119]: R$ 1.200,00
                - text: previstos
            - generic [ref=f1e122]:
              - generic [ref=f1e123]: Conquista Global
              - generic [ref=f1e124]: 0%
          - heading "Seus Objetivos" [level=2] [ref=f1e128]
          - generic [ref=f1e129]:
            - button "Ver detalhes da meta Legado sem origem" [ref=f1e131] [cursor=pointer]:
              - generic [ref=f1e139]:
                - heading "Legado sem origem" [level=3] [ref=f1e140]
                - generic [ref=f1e141]:
                  - generic [ref=f1e142]: Atrasado
                  - generic [ref=f1e143]: 21/10/2026
              - generic [ref=f1e147]:
                - generic [ref=f1e148]: R$ 0,00
                - generic [ref=f1e149]: 0%
            - button "Ver detalhes da meta Nova destinação na fonte incerta" [ref=f1e153] [cursor=pointer]:
              - generic [ref=f1e161]:
                - heading "Nova destinação na fonte incerta" [level=3] [ref=f1e162]
                - generic [ref=f1e163]:
                  - generic [ref=f1e164]: Iniciando
                  - generic [ref=f1e165]: 30/06/2027
              - generic [ref=f1e169]:
                - generic [ref=f1e170]: R$ 0,01
                - generic [ref=f1e171]: 0%
          - region "Histórico de compras" [ref=f1e174]:
            - heading "Histórico de compras" [level=2] [ref=f1e175]
            - paragraph [ref=f1e176]: Compras permanecem aqui mesmo após excluir o item ou a meta. Reembolso no cartão reduz a dívida e devolve o excedente como crédito no cartão.
            - button "Atualizar compras" [ref=f1e177]
            - paragraph [ref=f1e178]: Nenhuma compra registrada.
  - alert [ref=f1e179]
```

# Test source

```ts
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
  119 |  expect.soft(lines.find(r=>r[2]==="CF032 receita")?.slice(0,3),"Export must preserve the supplied wall-clock seconds; no precision exception is approved").toEqual(["22/10/2026","12:34:56","CF032 receita"]);
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
> 160 |  expect(attempt.status(),"Unknown source reservation must prevent allocating even0.01 through a different goal").toBe(400);
      |                                                                                                                  ^ Error: Unknown source reservation must prevent allocating even0.01 through a different goal
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
  220 | 
  221 | test("K limite disponível das telas concilia principal corrente e parcelas futuras",async({page})=>{
  222 |  const f=await e01(page,"card-limit");const card=rows(await json(page,"/cards"))[0];
  223 |  expect(card).toMatchObject({committedLimit:344,availableLimit:656});await financial(page,f.person.email,"K-card","1300.00","350.00");
  224 |  await page.goto("/cartoes");await page.reload();
  225 |  const global=page.getByText("Disponível",{exact:true}).first().locator("..");
  226 |  const individual=page.getByRole("button",{name:`Ver fatura de ${card.name}, final ${card.last4Digits}`}).getByText("Disponível",{exact:true}).locator("..");
  227 |  await paint(page,global,"K-available-limit");await save("K-api-versus-ui",{api:card,globalText:await global.innerText(),individualText:await individual.innerText(),expected:"1000−(194+3×50)=656; opening charges6 do not consume limit"});
  228 |  await expect.soft(global,"Global available must include all unpaid principal").toContainText("656,00");
  229 |  await expect.soft(individual,"Card available must include all unpaid principal").toContainText("656,00");
  230 | });
  231 | 
  232 | test("L investimento válido sem identificador continua identificável pelo nome",async({page})=>{
  233 |  const f=await e01(page,"optional-identifier");const positions=rows(await json(page,"/investments"));
  234 |  expect(positions.find(i=>i.name==="Ação sintética")).toMatchObject({ticker:null});
  235 |  await financial(page,f.person.email,"L-positions","1300.00","350.00");
  236 |  await page.goto("/investimentos");await page.reload();await paint(page,page.getByRole("heading",{name:"Investimentos",exact:true}),"L-optional-identifier");
  237 |  await save("L-api-versus-ui",{positions,body:await page.locator("body").innerText(),accessibleInvestmentNames:await page.getByRole("button",{name:/Ver detalhes do investimento/}).evaluateAll(elements=>elements.map(e=>e.getAttribute("aria-label")))});
  238 |  await expect(page.getByText("Ação sintética",{exact:true}),"SPEC-001 allows missing identifier; position name must still identify it").toBeVisible();
  239 |  await expect(page.getByText("Renda fixa sintética",{exact:true})).toBeVisible();
  240 | });
  241 | 
  242 | for(const [index,zone] of ["America/Sao_Paulo","UTC","Pacific/Kiritimati"].entries())test.describe(`Calendar ${zone}`,()=>{
  243 |  test.use({timezoneId:zone,viewport:{width:[360,768,1440][index],height:[800,1024,900][index]}});
  244 |  test(`T${index} prazo e hábito em ${zone}`,async({page})=>{
  245 |   const f=await e01(page,`temporal-${index}`);const g=rows(await json(page,"/goals")).find(g=>g.type==="NUMERIC");expect(g).toBeTruthy();
  246 |   const habit=record(await post(page,"/habits",{name:"CF032 leitura diária",icon:"BookOpen",color:"BLUE",frequency:"DAILY",goalId:g!.id}));
  247 |   await page.goto("/habitos");const card=page.getByRole("button",{name:"Ver detalhes do hábito CF032 leitura diária"});
  248 |   await paint(page,card.getByRole("button",{name:"Marcar Feito"}),`T${index}-ready`);
  249 |   const toggle=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Marcar Feito"}).click();const marked=await toggle;expect(marked.status()).toBe(200);expect(marked.request().postDataJSON()).toEqual({date:day});await page.reload();await expect(card.getByRole("button",{name:"Feito Hoje"})).toBeVisible();
  250 |   expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(5);
  251 |   const undo=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Feito Hoje"}).click();expect((await undo).status()).toBe(200);await page.reload();
  252 |   const future=await request(page).post(`/api/habits/${habit.id}/toggle`,{data:{date:"2026-10-23"}});expect(future.status()).toBe(400);expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(4);
  253 |   const state=await financial(page,f.person.email,`T${index}-final`,"1300.00","350.00");expect(rows(state.habitLogs)).toEqual([{log_date:day,status:"PENDING",goal_history_id:null}]);
  254 |   await page.goto("/metas");
  255 |   const yesterday=page.getByRole("button",{name:"Ver detalhes da meta Prazo ontem"}),today=page.getByRole("button",{name:"Ver detalhes da meta Prazo hoje"}),tomorrow=page.getByRole("button",{name:"Ver detalhes da meta Prazo amanhã"});
  256 |   await expect(yesterday).toContainText("Atrasado");await expect(today).not.toContainText("Atrasado");await expect(tomorrow).not.toContainText("Atrasado");
  257 |   await expect(today).toContainText("22/10/2026");await expect(tomorrow).toContainText("23/10/2026");
  258 |   await paint(page,today,`T${index}-deadlines`);
  259 |  });
  260 | });
```