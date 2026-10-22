import {test,expect,type Page} from "@playwright/test";
import {randomUUID} from "node:crypto";
import {day,record,rows,at,json,post,save,register,sql,paint,e01,transaction,paymentForm,download,login,logout,request} from "./support";

const network=new Map<string,unknown[]>();
test.beforeEach(async({page},info)=>{
 const events:unknown[]=[];network.set(info.title,events);
 page.on("request",r=>{if(new URL(r.url()).pathname.startsWith("/api/"))events.push({event:"request",method:r.method(),path:new URL(r.url()).pathname,at:Date.now()});});
 page.on("response",r=>{if(new URL(r.url()).pathname.startsWith("/api/"))events.push({event:"response",status:r.status(),path:new URL(r.url()).pathname,at:Date.now()});});
 page.on("pageerror",e=>events.push({event:"pageerror",message:e.message}));
});
test.afterEach(async({page},info)=>{
 const name=info.title.match(/^[A-Z][0-9]?/)?.[0]??"test";
 const status=info.status==="passed"&&info.errors.length?"failed":info.status;
 await save(`${name}-result`,{title:info.title,status,expectedStatus:info.expectedStatus,errors:info.errors.map(e=>e.message),browser:page.context().browser()?.version()});
 await save(`${name}-network`,network.get(info.title));
 if(status!==info.expectedStatus&&!page.isClosed())await save(`${name}-failure-dom`,{text:await page.locator("body").innerText()});
});

async function financial(page:Page,email:string,name:string,accounts:string,debt:string){
 const state=await sql(page,email,name);expect(state.accountTotal,`${name} account balances in SQL`).toBe(accounts);expect(state.debt,`${name} unpaid debt in SQL`).toBe(debt);return state;
}

test("A cadastro, rascunho, aplicação E01, recibo e releitura",async({page})=>{
 const person=await register(page,"a");await page.goto("/onboarding");
 const auxiliaryStatus=(await page.request.get("/api/accounts")).status();const browserStatus=(await request(page).get("/api/accounts")).status();
 await save("A-cookie-transport",{auxiliaryStatus,browserStatus,cookies:(await page.context().cookies()).map(({name,secure,httpOnly,sameSite,domain,path})=>({name,secure,httpOnly,sameSite,domain,path}))});
 expect(browserStatus).toBe(200);
 await page.getByLabel("Nome preferido (opcional)").fill("CF032 rascunho persistido");
 await page.getByLabel("Confirmo que os saldos não incluem movimentos que registrarei novamente").check();
 await page.getByLabel("Confirmo que o caixa da corretora não inclui o valor dos ativos aplicados").check();
 await page.getByRole("button",{name:"Salvar rascunho",exact:true}).click();
 await expect(page.getByRole("status").filter({hasText:"Últimas respostas confirmadas"})).toBeVisible();
 await page.reload();await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("CF032 rascunho persistido");
 expect((await sql(page,person.email,"A-draft")).applications).toBe(0);
 const fixture=await e01(page,"a",person);const state=await financial(page,person.email,"A-applied","1300.00","350.00");
 expect(state.netWorth).toBe("1451.00");expect(state.investmentTotal).toBe("501.00");
 expect(state.applications).toBe(16);expect(rows(state.receipts).filter(r=>r.kind==="ONBOARDING_COMPLETE")).toHaveLength(1);
 expect(rows(state.transactions)).toHaveLength(1);expect(rows(state.transactions)[0]).toMatchObject({is_paid:false,amount:"80.00"});
 expect(at(fixture.receipt,"summary","metrics","reservedAccounts","value")).toBe("350.00");
 expect(at(fixture.receipt,"summary","metrics","reservedInvestments","value")).toBe("200.00");
 expect(rows(state.investments).find(i=>i.position_mode==="MONETARY")).toMatchObject({quantity:null,total_cost:null,valuation_amount:"500.00",acquisition_date:null,historical_source:null});
 await page.reload();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();
 expect(at(await json(page,"/onboarding"),"data","completedReceipt")).toEqual(fixture.receipt);
 await paint(page,page.getByRole("heading",{name:"Entrevista concluída",exact:true}),"A-completed");
 await save("A-api-receipt",fixture.receipt);
});

async function daily(page:Page,suffix:string,ui:boolean){
 // Known-identifier daily branch. The original valid no-identifier E01 remains
 // strict in independent L, so its consumer defect cannot block later operations.
 const f=await e01(page,suffix,undefined,ui?"CF032STOCK":undefined);const a=String(f.checking.id),b=String(f.savings.id),email=f.person.email;
 if(ui){await transaction(page,a,"INCOME","CF032 receita","250.10");await transaction(page,a,"EXPENSE","CF032 despesa","40.20");await transaction(page,a,"TRANSFER","CF032 transferência","100.00",b);}
 else {
  const inc=rows(await json(page,"/categories?type=INCOME"))[0],exp=rows(await json(page,"/categories?type=EXPENSE"))[0];
  await post(page,"/transactions",{description:"CF032 receita",amount:250.10,date:day,time:"12:34:56",type:"INCOME",accountId:a,categoryId:inc.id,isPaid:true,operationId:randomUUID()});
  await post(page,"/transactions",{description:"CF032 despesa",amount:40.20,date:day,type:"EXPENSE",accountId:a,categoryId:exp.id,isPaid:true,operationId:randomUUID()});
  await post(page,"/transactions",{description:"CF032 transferência",amount:100,date:day,type:"TRANSFER",accountId:a,destinationAccountId:b,isPaid:true,fee:2,operationId:randomUUID()});
 }
 await financial(page,email,`${suffix}-cash`,"1507.90","350.00");
 const cats=rows(await json(page,"/categories?type=EXPENSE"));
 if(ui){
  await page.goto("/cartoes");await page.getByTitle("Lançar Compra",{exact:true}).click();const modal=page.getByRole("dialog",{name:"Nova Despesa no Crédito"});
  await modal.getByPlaceholder("0,00").fill("120.00");await modal.getByPlaceholder("Ex: Uber, Amazon, Jantar...").fill("CF032 compra parcelada");
  await modal.locator('input[type="date"]').fill("2026-10-15");await modal.locator("select").nth(0).selectOption(String(f.card.id));await modal.locator("select").nth(1).selectOption(String(cats[0].id));await modal.locator("select").nth(2).selectOption("3");
  const response=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/cards/transaction"&&r.request().method()==="POST");
  await modal.getByRole("button",{name:/Salvar|Lançar|Confirmar/}).click();const result=await response;expect(result.ok(),await result.text()).toBe(true);await expect(modal).toHaveCount(0);
 }else await post(page,"/cards/transaction",{cardId:f.card.id,categoryId:cats[0].id,description:"CF032 compra parcelada",amount:120,date:"2026-10-15",time:null,totalInstallments:3});
 await financial(page,email,`${suffix}-purchase`,"1507.90","470.00");
 const pay=await paymentForm(page,f.card,a,"200.00");const paid=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/cards/${f.card.id}/pay`&&r.request().method()==="POST");
 await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();const paidResponse=await paid;expect(paidResponse.ok(),await paidResponse.text()).toBe(true);await expect(pay).toHaveCount(0);
 await financial(page,email,`${suffix}-payment`,"1307.90","270.00");
 const stock=rows(await json(page,"/investments")).find(i=>i.type==="STOCK");expect(stock).toBeTruthy();
 if(ui){
  await page.goto("/investimentos");await page.getByText(String(stock!.ticker),{exact:true}).click();await page.getByRole("button",{name:"Aportar",exact:true}).click();
  const modal=page.getByRole("dialog",{name:`${stock!.ticker} - Operação`,exact:true});await modal.getByPlaceholder("0",{exact:true}).fill("2");await modal.getByPlaceholder("0,00",{exact:true}).fill("10");await modal.getByLabel("Taxas / retenções").fill("1");await modal.getByLabel("Conta",{exact:true}).selectOption(a);
  await paint(page,modal.getByRole("button",{name:"Confirmar Operação",exact:true}),"B-stock-operation");
  const op=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/investments/operation"&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar Operação",exact:true}).click();const applied=await op;expect(applied.ok(),await applied.text()).toBe(true);await expect(modal).toHaveCount(0);
 }else await post(page,"/investments/operation",{investmentId:stock!.id,type:"BUY",quantity:2,price:10,fees:1,date:day,accountId:a,operationId:randomUUID()});
 const goals=rows(await json(page,"/goals"));const trip=goals.find(g=>g.currentValue===500);expect(trip).toBeTruthy();
 if(ui){
  await page.goto("/metas");await page.getByRole("button",{name:`Ver detalhes da meta ${trip!.title}`}).click();await page.getByRole("button",{name:"Aporte Avulso",exact:true}).click();
  const modal=page.getByRole("dialog",{name:"Guardar Dinheiro",exact:true});await modal.getByPlaceholder("0",{exact:true}).fill("100");await modal.locator("select").selectOption(a);
  const deposited=page.waitForResponse(r=>r.url().includes(`/goals/${trip!.id}/deposit`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar Aporte",exact:true}).click();const response=await deposited;expect(response.ok(),await response.text()).toBe(true);await expect(modal).toHaveCount(0);
 }else {const r=await request(page).put(`/api/goals/${trip!.id}/allocations`,{data:{accountId:a,amount:"400.00"}});expect(r.status(),await r.text()).toBe(204);}
 const final=await financial(page,email,`${suffix}-final`,"1286.90","270.00");
 expect(final.netWorth).toBe("1518.57");expect(final.investmentTotal).toBe("501.67");expect(final.reservedAccounts).toBe("450.00");expect(final.reservedInvestments).toBe("200.00");
 expect(rows(final.investments).find(i=>i.type==="STOCK"||i.ticker===stock!.ticker)).toMatchObject({quantity:"5.00000000",total_cost:"21.60",valuation_amount:"1.67"});
 expect(rows(final.allocations).find(r=>r.account_id===a)).toMatchObject({amount:"400.00"});
 expect(rows(final.accounts).find(r=>r.id===a)).toMatchObject({balance:"886.90"});
 await save(`${suffix}-api`,{accounts:await json(page,"/accounts/position"),cards:await json(page,"/cards"),annual:await json(page,"/annual-summary?year=2026"),cash:await json(page,"/transactions/summary?month=10&year=2026")});
 return f;
}

test("B uso diário pela UI, reconciliação, reload e logout/login",async({page})=>{
 const f=await daily(page,"B",true);await page.goto("/contas");await page.reload();await expect(page.getByText("Corrente sintética",{exact:true}).first()).toBeVisible();
 await paint(page,page.getByText("Corrente sintética",{exact:true}).first(),"B-accounts");
 const before=await sql(page,f.person.email);await logout(page);await login(page,f.person);await page.goto("/extrato");await page.reload();
 await expect(page.getByText("CF032 receita",{exact:true})).toBeVisible();expect(await sql(page,f.person.email,"B-new-session")).toEqual(before);
 expect(at(await json(page,"/onboarding"),"data","completedReceipt")).toEqual(f.receipt);
 await paint(page,page.getByText("CF032 receita",{exact:true}),"B-new-session");
});

test("C relatório e XLSX real com datas, origens, estados e totais independentes",async({page})=>{
 const f=await daily(page,"C",false);
 await page.goto("/resumo-anual");await expect(page.getByRole("heading",{name:"Posição atual de investimentos",exact:true})).toBeVisible();
 await paint(page,page.getByRole("heading",{name:"Posição atual de investimentos",exact:true}),"C-annual");
 const annual=await json(page,"/annual-summary?year=2026");await save("C-annual-api",annual);
 expect(at(annual,"balance","observed","income")).toBe("250.10");expect(at(annual,"balance","observed","expense")).toBe("162.20");expect(at(annual,"balance","observed","balance")).toBe("87.90");
 expect(at(annual,"investments","totalCost")).toBeNull();expect(at(annual,"investments","totalValue")).toBe(501.67);
 const cash=await json(page,"/transactions/summary?month=10&year=2026");
 expect(Number(at(cash,"observed","balance"))).toBe(-13.10);expect(at(cash,"coverage","state")).toBe("PARTIAL");
 const book=await download(page,"C-october.xlsx");const all=JSON.stringify(book);
 expect(all).toContain("250.10");expect(all).toContain("162.20");expect(all).toContain("87.90");
 expect(JSON.stringify(book["Cobertura"])).toContain("PARTIAL");expect(all).toContain("22/10/2026");expect(all).toContain("15/10/2026");
 const extract=book["Extrato Financeiro"];expect(Array.isArray(extract)).toBe(true);
 const lines=extract as unknown[][];
 // Keep the precision check red, while inspecting independent monetary columns.
 expect.soft(lines.find(r=>r[2]==="CF032 receita")?.slice(0,3),"Export must preserve the supplied wall-clock seconds; no precision exception is approved").toEqual(["22/10/2026","12:34:56","CF032 receita"]);
 expect(lines.filter(r=>r[2]==="CF032 receita")).toHaveLength(1);
 expect(lines.find(r=>r[2]==="CF032 receita")?.[6]).toBe("250.1");
 expect(lines.find(r=>r[2]==="CF032 despesa")?.[6]).toBe("40.2");
 expect(lines.find(r=>r[2]==="CF032 receita")?.[7]).toBe("SETTLED");
 expect(lines.find(r=>r[2]==="CF032 receita")?.[8]).toBe("USER");
 const purchases=book["Consumo cartão"];expect(Array.isArray(purchases)).toBe(true);
 // The sheet may detail installments; three40 rows reconcile the single120 purchase.
 const purchaseRows=(purchases as unknown[][]).slice(1);expect(purchaseRows.map(r=>r[3]).sort()).toEqual(["40.0","40.0","40.0"]);expect(purchaseRows.map(r=>r[0])).toEqual(["15/10/2026","15/10/2026","15/10/2026"]);
 // A distinct period cannot acquire October flows; the current position remains dated.
 const older=await json(page,"/annual-summary?year=2025");await save("C-previous-year-api",older);
 expect(at(older,"investments","valuationAsOf")).toBe(day);
 await financial(page,f.person.email,"C-exported","1286.90","270.00");
});

test("E legado conserva proveniência, UNKNOWN e complemento sem histórico fictício",async({page})=>{
 const person=await register(page,"legacy");const seeded=await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`);expect(seeded.ok(),await seeded.text()).toBe(true);
 const before=await sql(page,person.email,"E-before");const account=rows(before.accounts)[0];
 await page.goto("/onboarding");await expect(page.getByRole("heading",{name:"Organize seu ponto de partida"})).toBeVisible();
 const sections:Record<string,{answer:string;items:unknown[]}>=Object.fromEntries(["accounts","cards","investments","goals","allocations","forecasts"].map(k=>[k,{answer:"NONE",items:[]}]));
 sections.accounts={answer:"PROVIDED",items:[{tempId:randomUUID(),action:"LINK",ref:{kind:"ACCOUNT",id:account.id}}]};
 const payload={context:{currency:"BRL",baseDate:day,boundaryAcknowledged:true,cashOnlyAcknowledged:true},currentStep:"REVIEW",sections};
 const saved=await request(page).put("/api/onboarding/draft",{data:{contractVersion:1,expectedVersion:"0",action:"SAVE",payload}});expect(saved.status(),await saved.text()).toBe(200);
 await page.reload();await page.getByRole("button",{name:"Preparar revisão financeira"}).click();await expect(page.getByRole("heading",{name:"Confira antes de registrar"})).toBeVisible();
 const pending=at(await json(page,"/onboarding"),"data","pendingIntent");
 expect(at(pending,"summary","metrics","netWorth","value")).toBe("1000.00");expect(at(pending,"summary","metrics","freeAccountCash","state")).toBe("UNKNOWN");expect(at(pending,"summary","metrics","reservedAccounts","value")).toBeNull();
 await paint(page,page.getByRole("heading",{name:"Confira antes de registrar"}),"E-legacy-unknown");
 await page.getByRole("button",{name:"Confirmar informações e registrar posições"}).click();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();await page.reload();
 const after=await sql(page,person.email,"E-after");expect(after.accounts).toEqual(before.accounts);expect(after.legacyReservations).toEqual(before.legacyReservations);expect(rows(after.transactions)).toHaveLength(0);expect(rows(after.investments)).toHaveLength(0);expect(rows(after.allocations)).toHaveLength(0);
 await save("E-receipt",at(await json(page,"/onboarding"),"data","completedReceipt"));
});

test("E2 fonte legada incerta bloqueia nova destinação também no uso cotidiano",async({page})=>{
 const person=await register(page,"legacy-capacity");
 const seeded=await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`);expect(seeded.ok(),await seeded.text()).toBe(true);
 const before=await sql(page,person.email,"E2-before");const account=rows(before.accounts)[0];
 const goal=record(await post(page,"/goals",{title:"Nova destinação na fonte incerta",targetValue:600,deadline:"2027-06-30",type:"MONETARY",useChecklist:false,color:"BLUE"}));
 const attempt=await request(page).put(`/api/goals/${goal.id}/allocations`,{data:{accountId:account.id,amount:"0.01"}});
 const after=await sql(page,person.email,"E2-after-attempt");
 await save("E2-response",{status:attempt.status(),body:await attempt.text(),expected:"400 without new allocation; SPEC-001 §5/5.1 source risk survives a new goal ID"});
 await page.goto("/metas");await paint(page,page.getByRole("button",{name:`Ver detalhes da meta ${goal.title}`}),"E2-source-capacity");
 expect(attempt.status(),"Unknown source reservation must prevent allocating even0.01 through a different goal").toBe(400);
 expect(rows(after.allocations)).toHaveLength(0);expect(after.accounts).toEqual(before.accounts);
});

test("F contas a receber: baixas parciais, calendário e persistência",async({page})=>{
 const f=await e01(page,"receivable");const forecast=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content"))[0];expect(forecast.amount).toBe(80);
 for(const [index,amount,total,remaining] of [[0,"30.00","1330.00",50],[1,"50.00","1380.00",0]] as const){
  await page.goto("/extrato");await page.getByRole("button",{name:"Mês seguinte do extrato",exact:true}).click();
  await page.getByText(String(forecast.description),{exact:true}).first().click();await page.getByRole("button",{name:"Baixar previsão",exact:true}).click();
  const modal=page.getByRole("dialog",{name:"Baixar previsão",exact:true});await modal.getByLabel("Valor da baixa").fill(amount);await modal.getByLabel("Data efetiva").fill(index===0?"2026-10-21":day);
  const response=page.waitForResponse(r=>r.url().endsWith(`/transactions/${forecast.id}/settlements`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar baixa",exact:true}).click();const r=await response;expect(r.ok(),await r.text()).toBe(true);await expect(modal).toHaveCount(0);await page.reload();
  await financial(page,f.person.email,`F-${index}`,total,"350.00");const current=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content")).find(t=>t.id===forecast.id);expect(current).toMatchObject({date:"2026-11-05",remainingAmount:remaining});
 }
 const book=await download(page,"F-receivables.xlsx");expect(JSON.stringify(book)).toContain("21/10/2026");expect(JSON.stringify(book)).toContain("22/10/2026");
});

test("G resposta perdida após commit SQL, recuperação e replay de efeito único",async({page})=>{
 const f=await e01(page,"lost");const pay=await paymentForm(page,f.card,String(f.checking.id),"200.00");
 let requests=0;let body:unknown;let receipt:unknown;
 let resolveLost!:()=>void;const committedAndLost=new Promise<void>(resolve=>{resolveLost=resolve;});
 await page.route(`**/api/cards/${f.card.id}/pay`,async route=>{
  requests++;body=route.request().postDataJSON();const response=await route.fetch();expect(response.status()).toBe(200);receipt=await response.json();
  const committed=await financial(page,f.person.email,"G-committed-before-response-loss","1100.00","150.00");expect(rows(committed.payments)).toHaveLength(1);
  await route.abort("failed");resolveLost();
 });
 await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();await committedAndLost;
 await expect(pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"})).toBeEnabled();await expect(pay.getByRole("button",{name:"Confirmar Pagamento"})).toBeDisabled();
 await paint(page,pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}),"G-result-unknown");
 await page.unroute(`**/api/cards/${f.card.id}/pay`);await pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}).click();await expect(pay).toHaveCount(0);
 const replay=await request(page).post(`/api/cards/${f.card.id}/pay`,{data:body});expect(replay.status()).toBe(200);expect(await replay.json()).toEqual(receipt);
 const conflict=await request(page).post(`/api/cards/${f.card.id}/pay`,{data:{...record(body),amount:201}});expect(conflict.status()).toBe(409);
 await page.reload();const final=await financial(page,f.person.email,"G-reloaded","1100.00","150.00");expect(rows(final.payments)).toHaveLength(1);expect(rows(final.transactions).filter(t=>t.origin==="INVOICE_PAYMENT")).toHaveLength(1);expect(requests).toBe(1);
 expect(final.netWorth).toBe("1451.00");expect(final.reservedAccounts).toBe("350.00");expect(rows(final.accounts).find(a=>a.id===f.checking.id)?.balance).toBe("800.00");
 expect(rows(await json(page,"/cards"))[0]).toMatchObject({committedLimit:150,availableLimit:850});
 expect(rows(final.payments)[0].operation_id).toBe(record(body).operationId);
 await save("G-protocol",{initialBrowserPosts:requests,explicitReplays:1,rejectedContentConflicts:1,totalPostAttempts:3,financialEffects:1,body,receipt,replay:await replay.json()});
});

test("H dois usuários intercalados, ownership, exportação e troca de sessão",async({page,browser})=>{
 const a=await register(page,"owners","A");const ctx=await browser.newContext({baseURL:"http://127.0.0.1:3142",timezoneId:"America/Sao_Paulo",locale:"pt-BR"});
 try{
  const other=await ctx.newPage();const b=await register(other,"owners","B");
  const aa=record(await post(page,"/accounts",{name:"EXCLUSIVO A",type:"CHECKING",initialBalance:1000,color:"#10b981"}));const bb=record(await post(other,"/accounts",{name:"EXCLUSIVO B",type:"CHECKING",initialBalance:2300,color:"#10b981"}));
  // Observable barrier: each command awaits its own HTTP commit before alternation.
  await transaction(page,String(aa.id),"INCOME","RECEITA EXCLUSIVA A","10.00");await transaction(other,String(bb.id),"EXPENSE","DESPESA EXCLUSIVA B","20.00");
  const before=await sql(other,b.email,"H-B-before");
  const bCard=record(await post(other,"/cards",{name:"CARTÃO EXCLUSIVO B",last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"}));
  expect((await request(page).get(`/api/cards/${bCard.id}/invoice?month=10&year=2026`)).status()).toBe(404);
  const bReceipt=rows(before.receipts).find(r=>r.kind==="TRANSACTION_CREATE");expect(bReceipt).toBeTruthy();
  expect((await request(other).get(`/api/financial-intents/${bReceipt!.id}`)).status()).toBe(200);
  expect((await request(page).get(`/api/financial-intents/${bReceipt!.id}`)).status()).toBe(404);
  const forbidden=await request(page).put(`/api/accounts/${bb.id}`,{data:{name:"INVASÃO",type:"CHECKING",color:"#10b981"}});expect(forbidden.status()).toBe(404);
  const transfer=await request(page).post("/api/transactions",{data:{description:"Tentativa cruzada",amount:1,date:day,type:"TRANSFER",accountId:aa.id,destinationAccountId:bb.id,isPaid:true,fee:0,operationId:randomUUID()}});expect(transfer.status()).toBe(404);
  expect(await sql(other,b.email,"H-B-after")).toEqual(before);expect(before.accountTotal).toBe("2280.00");expect((await sql(page,a.email,"H-A")).accountTotal).toBe("1010.00");
  await page.goto("/contas");await other.goto("/contas");await expect(page.getByText("EXCLUSIVO A",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toHaveCount(0);await expect(other.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(other.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);
  const exportsA=await download(page,"H-A.xlsx"),exportsB=await download(other,"H-B.xlsx");expect(JSON.stringify(exportsA)).not.toContain("EXCLUSIVO B");expect(JSON.stringify(exportsB)).not.toContain("EXCLUSIVO A");expect(JSON.stringify(exportsA)).toContain("RECEITA EXCLUSIVA A");expect(JSON.stringify(exportsB)).toContain("DESPESA EXCLUSIVA B");
  await logout(page);await login(page,b);await page.goto("/contas");await page.reload();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);await paint(page,page.getByText("EXCLUSIVO B",{exact:true}),"H-B-new-session");
  await logout(page);await login(page,a);expect((await sql(page,a.email)).accountTotal).toBe("1010.00");
 }finally{await ctx.close();}
});

test("K limite disponível das telas concilia principal corrente e parcelas futuras",async({page})=>{
 const f=await e01(page,"card-limit");const card=rows(await json(page,"/cards"))[0];
 expect(card).toMatchObject({committedLimit:344,availableLimit:656});await financial(page,f.person.email,"K-card","1300.00","350.00");
 await page.goto("/cartoes");await page.reload();
 const global=page.getByText("Disponível",{exact:true}).first().locator("..");
 const individual=page.getByRole("button",{name:`Ver fatura de ${card.name}, final ${card.last4Digits}`}).getByText("Disponível",{exact:true}).locator("..");
 await paint(page,global,"K-available-limit");await save("K-api-versus-ui",{api:card,globalText:await global.innerText(),individualText:await individual.innerText(),expected:"1000−(194+3×50)=656; opening charges6 do not consume limit"});
 await expect.soft(global,"Global available must include all unpaid principal").toContainText("656,00");
 await expect.soft(individual,"Card available must include all unpaid principal").toContainText("656,00");
});

test("L investimento válido sem identificador continua identificável pelo nome",async({page})=>{
 const f=await e01(page,"optional-identifier");const positions=rows(await json(page,"/investments"));
 expect(positions.find(i=>i.name==="Ação sintética")).toMatchObject({ticker:null});
 await financial(page,f.person.email,"L-positions","1300.00","350.00");
 await page.goto("/investimentos");await page.reload();await paint(page,page.getByRole("heading",{name:"Investimentos",exact:true}),"L-optional-identifier");
 await save("L-api-versus-ui",{positions,body:await page.locator("body").innerText(),accessibleInvestmentNames:await page.getByRole("button",{name:/Ver detalhes do investimento/}).evaluateAll(elements=>elements.map(e=>e.getAttribute("aria-label")))});
 await expect(page.getByText("Ação sintética",{exact:true}),"SPEC-001 allows missing identifier; position name must still identify it").toBeVisible();
 await expect(page.getByText("Renda fixa sintética",{exact:true})).toBeVisible();
});

for(const [index,zone] of ["America/Sao_Paulo","UTC","Pacific/Kiritimati"].entries())test.describe(`Calendar ${zone}`,()=>{
 test.use({timezoneId:zone,viewport:{width:[360,768,1440][index],height:[800,1024,900][index]}});
 test(`T${index} prazo e hábito em ${zone}`,async({page})=>{
  const f=await e01(page,`temporal-${index}`);const g=rows(await json(page,"/goals")).find(g=>g.type==="NUMERIC");expect(g).toBeTruthy();
  const habit=record(await post(page,"/habits",{name:"CF032 leitura diária",icon:"BookOpen",color:"BLUE",frequency:"DAILY",goalId:g!.id}));
  await page.goto("/habitos");const card=page.getByRole("button",{name:"Ver detalhes do hábito CF032 leitura diária"});
  await paint(page,card.getByRole("button",{name:"Marcar Feito"}),`T${index}-ready`);
  const toggle=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Marcar Feito"}).click();const marked=await toggle;expect(marked.status()).toBe(200);expect(marked.request().postDataJSON()).toEqual({date:day});await page.reload();await expect(card.getByRole("button",{name:"Feito Hoje"})).toBeVisible();
  expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(5);
  const undo=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Feito Hoje"}).click();expect((await undo).status()).toBe(200);await page.reload();
  const future=await request(page).post(`/api/habits/${habit.id}/toggle`,{data:{date:"2026-10-23"}});expect(future.status()).toBe(400);expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(4);
  const state=await financial(page,f.person.email,`T${index}-final`,"1300.00","350.00");expect(rows(state.habitLogs)).toEqual([{log_date:day,status:"PENDING",goal_history_id:null}]);
  await page.goto("/metas");
  const yesterday=page.getByRole("button",{name:"Ver detalhes da meta Prazo ontem"}),today=page.getByRole("button",{name:"Ver detalhes da meta Prazo hoje"}),tomorrow=page.getByRole("button",{name:"Ver detalhes da meta Prazo amanhã"});
  await expect(yesterday).toContainText("Atrasado");await expect(today).not.toContainText("Atrasado");await expect(tomorrow).not.toContainText("Atrasado");
  await expect(today).toContainText("22/10/2026");await expect(tomorrow).toContainText("23/10/2026");
  await paint(page,today,`T${index}-deadlines`);
 });
});
