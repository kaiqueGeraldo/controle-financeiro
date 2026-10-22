# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> K limite disponível das telas concilia principal corrente e parcelas futuras
- Location: tests\cf032\journeys.spec.ts:215:5

# Error details

```
Error: Global available must include all unpaid principal

expect(locator).toContainText(expected) failed

Locator: getByText('Disponível', { exact: true }).first().locator('..')
Expected substring: "656,00"
Received string:    "DisponívelR$ 950,00"

Call log:
  - Global available must include all unpaid principal getByText('Disponível', { exact: true }).first().locator('..') with timeout 12000ms
  - waiting for getByText('Disponível', { exact: true }).first().locator('..')
    3 × locator resolved to <div class="min-w-0 [overflow-wrap:anywhere]">…</div>
      - unexpected value "DisponívelR$ 950,00"
  - Test ended.

```

```yaml
- paragraph: Disponível
- text: R$ 950,00
```

```
Error: Card available must include all unpaid principal

expect(locator).toContainText(expected) failed

Locator: getByRole('button', { name: 'Ver fatura de Cartão sintético, final null' }).getByText('Disponível', { exact: true }).locator('..')
Expected substring: "656,00"
Received string:    "DisponívelR$ 950,00"

Call log:
  - Card available must include all unpaid principal getByRole('button', { name: 'Ver fatura de Cartão sintético, final null' }).getByText('Disponível', { exact: true }).locator('..') with timeout 12000ms
  - waiting for getByRole('button', { name: 'Ver fatura de Cartão sintético, final null' }).getByText('Disponível', { exact: true }).locator('..')
    3 × locator resolved to <div class="text-right">…</div>
      - unexpected value "DisponívelR$ 950,00"
  - Test ended.

```

```yaml
- paragraph: Disponível
- text: R$ 950,00
```

# Test source

```ts
  123 |  const older=await json(page,"/annual-summary?year=2025");await save("C-previous-year-api",older);
  124 |  expect(at(older,"investments","valuationAsOf")).toBe(day);
  125 |  await financial(page,f.person.email,"C-exported","1286.90","270.00");
  126 | });
  127 | 
  128 | test("E legado conserva proveniência, UNKNOWN e complemento sem histórico fictício",async({page})=>{
  129 |  const person=await register(page,"legacy");const seeded=await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`);expect(seeded.ok(),await seeded.text()).toBe(true);
  130 |  const before=await sql(page,person.email,"E-before");const account=rows(before.accounts)[0];
  131 |  await page.goto("/onboarding");await expect(page.getByRole("heading",{name:"Organize seu ponto de partida"})).toBeVisible();
  132 |  const sections:Record<string,{answer:string;items:unknown[]}>=Object.fromEntries(["accounts","cards","investments","goals","allocations","forecasts"].map(k=>[k,{answer:"NONE",items:[]}]));
  133 |  sections.accounts={answer:"PROVIDED",items:[{tempId:randomUUID(),action:"LINK",ref:{kind:"ACCOUNT",id:account.id}}]};
  134 |  const payload={context:{currency:"BRL",baseDate:day,boundaryAcknowledged:true,cashOnlyAcknowledged:true},currentStep:"REVIEW",sections};
  135 |  const saved=await request(page).put("/api/onboarding/draft",{data:{contractVersion:1,expectedVersion:"0",action:"SAVE",payload}});expect(saved.status(),await saved.text()).toBe(200);
  136 |  await page.reload();await page.getByRole("button",{name:"Preparar revisão financeira"}).click();await expect(page.getByRole("heading",{name:"Confira antes de registrar"})).toBeVisible();
  137 |  const pending=at(await json(page,"/onboarding"),"data","pendingIntent");
  138 |  expect(at(pending,"summary","metrics","netWorth","value")).toBe("1000.00");expect(at(pending,"summary","metrics","freeAccountCash","state")).toBe("UNKNOWN");expect(at(pending,"summary","metrics","reservedAccounts","value")).toBeNull();
  139 |  await paint(page,page.getByRole("heading",{name:"Confira antes de registrar"}),"E-legacy-unknown");
  140 |  await page.getByRole("button",{name:"Confirmar informações e registrar posições"}).click();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();await page.reload();
  141 |  const after=await sql(page,person.email,"E-after");expect(after.accounts).toEqual(before.accounts);expect(after.legacyReservations).toEqual(before.legacyReservations);expect(rows(after.transactions)).toHaveLength(0);expect(rows(after.investments)).toHaveLength(0);expect(rows(after.allocations)).toHaveLength(0);
  142 |  await save("E-receipt",at(await json(page,"/onboarding"),"data","completedReceipt"));
  143 | });
  144 | 
  145 | test("E2 fonte legada incerta bloqueia nova destinação também no uso cotidiano",async({page})=>{
  146 |  const person=await register(page,"legacy-capacity");
  147 |  const seeded=await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`);expect(seeded.ok(),await seeded.text()).toBe(true);
  148 |  const before=await sql(page,person.email,"E2-before");const account=rows(before.accounts)[0];
  149 |  const goal=record(await post(page,"/goals",{title:"Nova destinação na fonte incerta",targetValue:600,deadline:"2027-06-30",type:"MONETARY",useChecklist:false,color:"BLUE"}));
  150 |  const attempt=await request(page).put(`/api/goals/${goal.id}/allocations`,{data:{accountId:account.id,amount:"0.01"}});
  151 |  const after=await sql(page,person.email,"E2-after-attempt");
  152 |  await save("E2-response",{status:attempt.status(),body:await attempt.text(),expected:"400 without new allocation; SPEC-001 §5/5.1 source risk survives a new goal ID"});
  153 |  await page.goto("/metas");await paint(page,page.getByRole("button",{name:`Ver detalhes da meta ${goal.title}`}),"E2-source-capacity");
  154 |  expect(attempt.status(),"Unknown source reservation must prevent allocating even0.01 through a different goal").toBe(400);
  155 |  expect(rows(after.allocations)).toHaveLength(0);expect(after.accounts).toEqual(before.accounts);
  156 | });
  157 | 
  158 | test("F contas a receber: baixas parciais, calendário e persistência",async({page})=>{
  159 |  const f=await e01(page,"receivable");const forecast=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content"))[0];expect(forecast.amount).toBe(80);
  160 |  for(const [index,amount,total,remaining] of [[0,"30.00","1330.00",50],[1,"50.00","1380.00",0]] as const){
  161 |   await page.goto("/extrato");await page.getByRole("button",{name:"Mês seguinte do extrato",exact:true}).click();
  162 |   await page.getByText(String(forecast.description),{exact:true}).first().click();await page.getByRole("button",{name:"Baixar previsão",exact:true}).click();
  163 |   const modal=page.getByRole("dialog",{name:"Baixar previsão",exact:true});await modal.getByLabel("Valor da baixa").fill(amount);await modal.getByLabel("Data efetiva").fill(index===0?"2026-10-21":day);
  164 |   const response=page.waitForResponse(r=>r.url().endsWith(`/transactions/${forecast.id}/settlements`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar baixa",exact:true}).click();const r=await response;expect(r.ok(),await r.text()).toBe(true);await expect(modal).toHaveCount(0);await page.reload();
  165 |   await financial(page,f.person.email,`F-${index}`,total,"350.00");const current=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content")).find(t=>t.id===forecast.id);expect(current).toMatchObject({date:"2026-11-05",remainingAmount:remaining});
  166 |  }
  167 |  const book=await download(page,"F-receivables.xlsx");expect(JSON.stringify(book)).toContain("21/10/2026");expect(JSON.stringify(book)).toContain("22/10/2026");
  168 | });
  169 | 
  170 | test("G resposta perdida após commit SQL, recuperação e replay de efeito único",async({page})=>{
  171 |  const f=await e01(page,"lost");const pay=await paymentForm(page,f.card,String(f.checking.id),"200.00");
  172 |  let requests=0;let body:unknown;let receipt:unknown;
  173 |  let resolveLost!:()=>void;const committedAndLost=new Promise<void>(resolve=>{resolveLost=resolve;});
  174 |  await page.route(`**/api/cards/${f.card.id}/pay`,async route=>{
  175 |   requests++;body=route.request().postDataJSON();const response=await route.fetch();expect(response.status()).toBe(200);receipt=await response.json();
  176 |   const committed=await financial(page,f.person.email,"G-committed-before-response-loss","1100.00","150.00");expect(rows(committed.payments)).toHaveLength(1);
  177 |   await route.abort("failed");resolveLost();
  178 |  });
  179 |  await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();await committedAndLost;
  180 |  await expect(pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"})).toBeEnabled();await expect(pay.getByRole("button",{name:"Confirmar Pagamento"})).toBeDisabled();
  181 |  await paint(page,pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}),"G-result-unknown");
  182 |  await page.unroute(`**/api/cards/${f.card.id}/pay`);await pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}).click();await expect(pay).toHaveCount(0);
  183 |  const replay=await request(page).post(`/api/cards/${f.card.id}/pay`,{data:body});expect(replay.status()).toBe(200);expect(await replay.json()).toEqual(receipt);
  184 |  const conflict=await request(page).post(`/api/cards/${f.card.id}/pay`,{data:{...record(body),amount:201}});expect(conflict.status()).toBe(409);
  185 |  await page.reload();const final=await financial(page,f.person.email,"G-reloaded","1100.00","150.00");expect(rows(final.payments)).toHaveLength(1);expect(rows(final.transactions).filter(t=>t.origin==="INVOICE_PAYMENT")).toHaveLength(1);expect(requests).toBe(1);
  186 |  expect(final.netWorth).toBe("1451.00");expect(final.reservedAccounts).toBe("350.00");expect(rows(final.accounts).find(a=>a.id===f.checking.id)?.balance).toBe("800.00");
  187 |  expect(rows(await json(page,"/cards"))[0]).toMatchObject({committedLimit:150,availableLimit:850});
  188 |  expect(rows(final.payments)[0].operation_id).toBe(record(body).operationId);
  189 |  await save("G-protocol",{initialBrowserPosts:requests,explicitReplays:1,rejectedContentConflicts:1,totalPostAttempts:3,financialEffects:1,body,receipt,replay:await replay.json()});
  190 | });
  191 | 
  192 | test("H dois usuários intercalados, ownership, exportação e troca de sessão",async({page,browser})=>{
  193 |  const a=await register(page,"owners","A");const ctx=await browser.newContext({baseURL:"http://127.0.0.1:3142",timezoneId:"America/Sao_Paulo",locale:"pt-BR"});
  194 |  try{
  195 |   const other=await ctx.newPage();const b=await register(other,"owners","B");
  196 |   const aa=record(await post(page,"/accounts",{name:"EXCLUSIVO A",type:"CHECKING",initialBalance:1000,color:"#10b981"}));const bb=record(await post(other,"/accounts",{name:"EXCLUSIVO B",type:"CHECKING",initialBalance:2300,color:"#10b981"}));
  197 |   // Observable barrier: each command awaits its own HTTP commit before alternation.
  198 |   await transaction(page,String(aa.id),"INCOME","RECEITA EXCLUSIVA A","10.00");await transaction(other,String(bb.id),"EXPENSE","DESPESA EXCLUSIVA B","20.00");
  199 |   const before=await sql(other,b.email,"H-B-before");
  200 |   const bCard=record(await post(other,"/cards",{name:"CARTÃO EXCLUSIVO B",last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"}));
  201 |   expect((await request(page).get(`/api/cards/${bCard.id}/invoice?month=10&year=2026`)).status()).toBe(404);
  202 |   const bReceipt=rows(before.receipts).find(r=>r.kind==="TRANSACTION_CREATE");expect(bReceipt).toBeTruthy();
  203 |   expect((await request(other).get(`/api/financial-intents/${bReceipt!.id}`)).status()).toBe(200);
  204 |   expect((await request(page).get(`/api/financial-intents/${bReceipt!.id}`)).status()).toBe(404);
  205 |   const forbidden=await request(page).put(`/api/accounts/${bb.id}`,{data:{name:"INVASÃO",type:"CHECKING",color:"#10b981"}});expect(forbidden.status()).toBe(404);
  206 |   const transfer=await request(page).post("/api/transactions",{data:{description:"Tentativa cruzada",amount:1,date:day,type:"TRANSFER",accountId:aa.id,destinationAccountId:bb.id,isPaid:true,fee:0,operationId:randomUUID()}});expect(transfer.status()).toBe(404);
  207 |   expect(await sql(other,b.email,"H-B-after")).toEqual(before);expect(before.accountTotal).toBe("2280.00");expect((await sql(page,a.email,"H-A")).accountTotal).toBe("1010.00");
  208 |   await page.goto("/contas");await other.goto("/contas");await expect(page.getByText("EXCLUSIVO A",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toHaveCount(0);await expect(other.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(other.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);
  209 |   const exportsA=await download(page,"H-A.xlsx"),exportsB=await download(other,"H-B.xlsx");expect(JSON.stringify(exportsA)).not.toContain("EXCLUSIVO B");expect(JSON.stringify(exportsB)).not.toContain("EXCLUSIVO A");expect(JSON.stringify(exportsA)).toContain("RECEITA EXCLUSIVA A");expect(JSON.stringify(exportsB)).toContain("DESPESA EXCLUSIVA B");
  210 |   await logout(page);await login(page,b);await page.goto("/contas");await page.reload();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);await paint(page,page.getByText("EXCLUSIVO B",{exact:true}),"H-B-new-session");
  211 |   await logout(page);await login(page,a);expect((await sql(page,a.email)).accountTotal).toBe("1010.00");
  212 |  }finally{await ctx.close();}
  213 | });
  214 | 
  215 | test("K limite disponível das telas concilia principal corrente e parcelas futuras",async({page})=>{
  216 |  const f=await e01(page,"card-limit");const card=rows(await json(page,"/cards"))[0];
  217 |  expect(card).toMatchObject({committedLimit:344,availableLimit:656});await financial(page,f.person.email,"K-card","1300.00","350.00");
  218 |  await page.goto("/cartoes");await page.reload();
  219 |  const global=page.getByText("Disponível",{exact:true}).first().locator("..");
  220 |  const individual=page.getByRole("button",{name:`Ver fatura de ${card.name}, final ${card.last4Digits}`}).getByText("Disponível",{exact:true}).locator("..");
  221 |  await paint(page,global,"K-available-limit");await save("K-api-versus-ui",{api:card,globalText:await global.innerText(),individualText:await individual.innerText(),expected:"1000−(194+3×50)=656; opening charges6 do not consume limit"});
  222 |  expect.soft(global,"Global available must include all unpaid principal").toContainText("656,00");
> 223 |  expect.soft(individual,"Card available must include all unpaid principal").toContainText("656,00");
      |                                                                             ^ Error: Card available must include all unpaid principal
  224 | });
  225 | 
  226 | for(const [index,zone] of ["America/Sao_Paulo","UTC","Pacific/Kiritimati"].entries())test.describe(`Calendar ${zone}`,()=>{
  227 |  test.use({timezoneId:zone,viewport:{width:[360,768,1440][index],height:[800,1024,900][index]}});
  228 |  test(`T${index} prazo e hábito em ${zone}`,async({page})=>{
  229 |   const f=await e01(page,`temporal-${index}`);const g=rows(await json(page,"/goals")).find(g=>g.type==="NUMERIC");expect(g).toBeTruthy();
  230 |   const habit=record(await post(page,"/habits",{name:"CF032 leitura diária",icon:"BookOpen",color:"BLUE",frequency:"DAILY",goalId:g!.id}));
  231 |   await page.goto("/habitos");const card=page.getByRole("button",{name:"Ver detalhes do hábito CF032 leitura diária"});
  232 |   await paint(page,card.getByRole("button",{name:"Marcar Feito"}),`T${index}-ready`);
  233 |   const toggle=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Marcar Feito"}).click();const marked=await toggle;expect(marked.status()).toBe(200);expect(marked.request().postDataJSON()).toEqual({date:day});await page.reload();await expect(card.getByRole("button",{name:"Feito Hoje"})).toBeVisible();
  234 |   expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(5);
  235 |   const undo=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Feito Hoje"}).click();expect((await undo).status()).toBe(200);await page.reload();
  236 |   const future=await request(page).post(`/api/habits/${habit.id}/toggle`,{data:{date:"2026-10-23"}});expect(future.status()).toBe(400);expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(4);
  237 |   const state=await financial(page,f.person.email,`T${index}-final`,"1300.00","350.00");expect(rows(state.habitLogs)).toEqual([{log_date:day,status:"PENDING",goal_history_id:null}]);
  238 |   await page.goto("/metas");
  239 |   const yesterday=page.getByRole("button",{name:"Ver detalhes da meta Prazo ontem"}),today=page.getByRole("button",{name:"Ver detalhes da meta Prazo hoje"}),tomorrow=page.getByRole("button",{name:"Ver detalhes da meta Prazo amanhã"});
  240 |   await expect(yesterday).toContainText("Atrasado");await expect(today).not.toContainText("Atrasado");await expect(tomorrow).not.toContainText("Atrasado");
  241 |   await expect(today).toContainText("22/10/2026");await expect(tomorrow).toContainText("23/10/2026");
  242 |   await paint(page,today,`T${index}-deadlines`);
  243 |  });
  244 | });
  245 | 
```