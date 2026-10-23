# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> L investimento válido sem identificador continua identificável pelo nome
- Location: tests\cf032\journeys.spec.ts:232:5

# Error details

```
Error: SPEC-001 allows missing identifier; position name must still identify it

expect(locator).toBeVisible() failed

Locator: getByText('Ação sintética', { exact: true })
Expected: visible
Timeout: 12000ms
Error: element(s) not found

Call log:
  - SPEC-001 allows missing identifier; position name must still identify it getByText('Ação sintética', { exact: true }) with timeout 12000ms
  - waiting for getByText('Ação sintética', { exact: true })

```

```yaml
- complementary "Navegação principal":
  - text: P
  - heading "Pessoa Sintética A" [level=2]
  - text: cf003-a-cf032-7d8cf5be-optional-identifier@example.invalid
  - navigation:
    - link "Dashboard":
      - /url: /
    - link "Minhas Contas":
      - /url: /contas
    - link "Configuração inicial":
      - /url: /onboarding
    - link "Extrato":
      - /url: /extrato
    - link "Cartões de Crédito":
      - /url: /cartoes
    - link "Planejamento":
      - /url: /planejamento
    - link "Metas":
      - /url: /metas
    - link "Investimentos":
      - /url: /investimentos
    - link "Resumo Anual":
      - /url: /resumo-anual
    - link "Hábitos":
      - /url: /habitos
  - button "Privacidade"
  - button "Configurações"
  - button "Sair da Conta"
- main:
  - heading "Investimentos" [level=1]
  - paragraph: Acompanhe a evolução do seu patrimônio.
  - button "Novo Ativo"
  - main:
    - text: Investimentos avaliados R$ 501,00 Rentabilidade Geral Indisponível Custo ou avaliação indisponível
    - heading "Sua Carteira" [level=2]
    - button "Ver detalhes do investimento null":
      - heading [level=3]
      - text: Renda Fixa R$ 500,00 Alocação 100%
    - button "Ver detalhes do investimento null":
      - heading [level=3]
      - text: Ação R$ 1,00 66.67% (+R$ 0,40) Alocação 0%
- alert
```

# Test source

```ts
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
> 238 |  await expect(page.getByText("Ação sintética",{exact:true}),"SPEC-001 allows missing identifier; position name must still identify it").toBeVisible();
      |                                                                                                                                         ^ Error: SPEC-001 allows missing identifier; position name must still identify it
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
  261 | 
  262 | // Append to the runtime-only journeys.spec.ts; original tests remain unchanged.
  263 | test("R1 controle positivo de reserva conhecida e débito real com legado incerto",async({page})=>{
  264 |  const f=await e01(page,"review-known");
  265 |  const goal=record(await post(page,"/goals",{title:"Reserva independente conhecida",targetValue:600,deadline:"2027-06-30",type:"MONETARY",useChecklist:false,color:"BLUE"}));
  266 |  const before=await sql(page,f.person.email,"R1-known-before");
  267 |  const allowed=await request(page).put(`/api/goals/${goal.id}/allocations`,{data:{accountId:f.checking.id,amount:"0.01"}});
  268 |  expect(allowed.status()).toBe(204);
  269 |  const after=await sql(page,f.person.email,"R1-known-after");
  270 |  expect(after.accountTotal).toBe(before.accountTotal);expect(after.netWorth).toBe(before.netWorth);
  271 |  expect(after.reservedAccounts).toBe("350.01");
  272 |  await logout(page);
  273 |  const person=await register(page,"review-unknown-debit");
  274 |  expect((await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`)).ok()).toBe(true);
  275 |  const legacy=await sql(page,person.email,"R1-legacy-before");
  276 |  await transaction(page,String(rows(legacy.accounts)[0].id),"EXPENSE","Débito real não é nova reserva","1.00");
  277 |  const spent=await sql(page,person.email,"R1-legacy-after");
  278 |  expect(spent.accountTotal).toBe("999.00");expect(spent.legacyReservations).toEqual(legacy.legacyReservations);
  279 |  expect(rows(spent.allocations)).toHaveLength(0);
  280 | });
  281 | 
  282 | test("R2 nova sessão do cartão e seleção das duas posições sem ticker",async({page})=>{
  283 |  const f=await e01(page,"review-session");
  284 |  await logout(page);await login(page,f.person);await page.goto("/cartoes");
  285 |  const card=rows(await json(page,"/cards"))[0];
  286 |  const available=page.getByText("Disponível",{exact:true}).first().locator("..");
  287 |  await paint(page,available,"R2-card-session");
  288 |  await save("R2-card-session",{card,visible:await available.innerText()});
  289 |  await expect.soft(available).toContainText("656,00");
  290 |  const positions=rows(await json(page,"/investments"));
  291 |  expect(positions).toHaveLength(2);expect(positions.every(p=>p.ticker===null)).toBe(true);
  292 |  const visits:unknown[]=[];
  293 |  for(let index=0;index<2;index++){
  294 |   await page.goto("/investimentos");
  295 |   const buttons=page.getByRole("button",{name:"Ver detalhes do investimento null",exact:true});
  296 |   await expect(buttons).toHaveCount(2);
  297 |   const history=page.waitForResponse(r=>/\/api\/investments\/[^/]+\/history$/.test(new URL(r.url()).pathname));
  298 |   await buttons.nth(index).click();const response=await history;
  299 |   expect(response.status()).toBe(200);
  300 |   const id=new URL(response.url()).pathname.split("/")[3];
  301 |   expect(positions.some(p=>p.id===id)).toBe(true);
  302 |   const dialog=page.getByRole("dialog",{name:"Detalhes do investimento null",exact:true});
  303 |   await expect(dialog).toBeVisible();
  304 |   visits.push({id,name:positions.find(p=>p.id===id)?.name,dialog:await dialog.innerText()});
  305 |  }
  306 |  expect(new Set(visits.map(v=>record(v).id)).size).toBe(2);
  307 |  await save("R2-selection",{positions,visits,sql:await sql(page,f.person.email,"R2-selection")});
  308 | });
  309 | 
  310 | // Runtime-only independent probe: establish API versus export precision directly.
  311 | test("R3 horário original, resposta API, releitura e XLSX",async({page})=>{
  312 |  const f=await e01(page,"review-time-api");
  313 |  const category=rows(await json(page,"/categories?type=INCOME"))[0];
  314 |  const input={description:"R3 segundos explícitos",amount:1.23,date:day,time:"12:34:56",type:"INCOME",accountId:f.checking.id,categoryId:category.id,isPaid:true,operationId:randomUUID()};
  315 |  const response=await post(page,"/transactions",input);
  316 |  const list=await json(page,"/transactions?month=10&year=2026&size=100");
  317 |  const line=rows(at(list,"content")).find(t=>t.description===input.description);
  318 |  await save("R3-api",{input,response,line});
  319 |  expect(line?.time).toBe("12:34:56");
  320 |  const state=await sql(page,f.person.email,"R3-time");
  321 |  expect(rows(state.transactions).find(t=>t.description===input.description)?.time).toBe("12:34:56");
  322 |  const book=await download(page,"R3-time.xlsx");
  323 |  const lineExport=(book["Extrato Financeiro"] as unknown[][]).find(row=>row[2]===input.description);
  324 |  expect(lineExport?.[1]).toBe("12:34:56");
  325 | });
  326 | 
```