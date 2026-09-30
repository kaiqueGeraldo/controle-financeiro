import {expect,test,type Page} from "@playwright/test";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {registerSyntheticUser,syntheticUser} from "./support/synthetic-auth";
const dir=process.env.CF_REVIEW_EVIDENCE!;
const ns=process.env.CF_E2E_NAMESPACE!;
async function start(page:Page,suffix:string){await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));await registerSyntheticUser(page,syntheticUser("A",`${ns}-${suffix}`));}
async function post(page:Page,url:string,data:unknown){const r=await page.request.post(`/api${url}`,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;}
async function json(page:Page,url:string){const r=await page.request.get(`/api${url}`);expect(r.ok(),await r.text()).toBe(true);return r.json();}

test("SAN-D2 previsão, baixa, transferência atômica e estorno parcial/total pela UI",async({page})=>{
 await start(page,"commands");
 const a=await post(page,"/accounts",{name:`${ns}-origem`,type:"CHECKING",initialBalance:1000,color:"#10b981"});
 const b=await post(page,"/accounts",{name:`${ns}-destino`,type:"CHECKING",initialBalance:100,color:"#3b82f6"});
 const categories=await json(page,"/categories?type=EXPENSE");
 const rows=async()=> (await json(page,"/transactions?month=1&year=2027&size=100")).content;
 const accountBalance=async(id:string)=>(await json(page,"/accounts")).find((v:{id:string})=>v.id===id).balance;
 await page.goto("/extrato");
 async function create(description:string,forecast:boolean,transfer=false){
   await page.getByRole("button",{name:"Lançar",exact:true}).click();
   const modal=page.getByRole("dialog",{name:"Nova Transação",exact:true});
   await modal.getByRole("button",{name:transfer?"Transferência":"Despesa",exact:true}).click();
   await modal.getByLabel("Valor do lançamento").fill("100.00");await modal.getByLabel("Descrição do lançamento").fill(description);
   await modal.getByLabel("Data do lançamento").fill("2027-01-15");await modal.getByLabel("Conta do lançamento").selectOption(a.id);
   if(transfer){await modal.getByLabel("Conta destino").selectOption(b.id);await modal.getByLabel("Taxa da transferência").fill("2.00");}
   else await modal.getByLabel("Categoria do lançamento").selectOption(categories[0].id);
   await modal.getByLabel("Registrar previsão (sem movimentar saldo)").setChecked(forecast);
   const response=page.waitForResponse(r=>r.url().endsWith("/api/transactions")&&r.request().method()==="POST");
   await modal.getByRole("button",{name:"Salvar Transação"}).click();const saved=await response;expect(saved.ok(),await saved.text()).toBe(true);
   await expect(modal).toHaveCount(0);await page.reload();return saved.json();
 }
 async function open(description:string,action:string,title:string){
   await page.getByText(description,{exact:true}).first().click();await page.getByRole("button",{name:action,exact:true}).click();
   return page.getByRole("dialog",{name:title,exact:true});
 }
 async function confirm(modal:ReturnType<Page["getByRole"]>,name:string,path:string){
   const response=page.waitForResponse(r=>r.url().includes(path)&&r.request().method()==="POST");
   await modal.getByRole("button",{name,exact:true}).click();const result=await response;expect(result.ok(),await result.text()).toBe(true);
   await expect(modal).toHaveCount(0);await page.reload();return result.json();
 }
 const forecast=await create("SAN previsão preservada",true);
 expect(await accountBalance(a.id)).toBe(1000);
 let modal=await open("SAN previsão preservada","Baixar previsão","Baixar previsão");
 await modal.getByLabel("Valor da baixa").fill("40.00");await modal.getByLabel("Data efetiva").fill("2027-01-16");
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await modal.screenshot({path:path.join(dir,`san-d2-baixa-${width}.png`),animations:"disabled"});}
 const settlement=await confirm(modal,"Confirmar baixa","/settlements");expect(await accountBalance(a.id)).toBe(960);
 for(const amount of ["10.00","30.00"]){
   modal=await open("Baixa - SAN previsão preservada","Estornar parcial ou total","Estornar lançamento");
   await modal.getByLabel("Valor do estorno").fill(amount);await modal.getByLabel("Data efetiva").fill("2027-01-17");await modal.getByLabel("Motivo").fill(`Devolução ${amount}`);
   await confirm(modal,"Confirmar estorno","/reversals");
 }
 expect(await accountBalance(a.id)).toBe(1000);
 let current=(await rows()).find((t:{id:string})=>t.id===forecast.id);expect(current.amount).toBe(100);expect(current.date).toBe("2027-01-15");expect(current.remainingAmount).toBe(100);
 expect((await rows()).find((t:{id:string})=>t.id===settlement.id).status).toBe("REVERSED");
 modal=await open("SAN previsão preservada","Baixar previsão","Baixar previsão");
 await modal.getByLabel("Data efetiva").fill("2027-01-18");await confirm(modal,"Confirmar baixa","/settlements");
 expect(await accountBalance(a.id)).toBe(900);
 const direct=await create("SAN despesa realizada",false);
 let lastCommand:Record<string,unknown>|null=null;
 for(const amount of ["30.00","70.00"]){
   modal=await open("SAN despesa realizada","Estornar parcial ou total","Estornar lançamento");
   await modal.getByLabel("Valor do estorno").fill(amount);await modal.getByLabel("Data efetiva").fill("2027-01-19");await modal.getByLabel("Motivo").fill(`Reembolso ${amount}`);
   for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await modal.screenshot({path:path.join(dir,`san-d2-estorno-${width}.png`),animations:"disabled"});}
   const response=page.waitForResponse(r=>r.url().endsWith(`/transactions/${direct.id}/reversals`)&&r.request().method()==="POST");
   await modal.getByRole("button",{name:"Confirmar estorno"}).click();const result=await response;expect(result.ok()).toBe(true);lastCommand=result.request().postDataJSON();
   await expect(modal).toHaveCount(0);await page.reload();
 }
 await post(page,`/transactions/${direct.id}/reversals`,lastCommand);expect(await accountBalance(a.id)).toBe(900);
 const transfer=await create("SAN transferência prevista",true,true);
 expect(await accountBalance(a.id)).toBe(900);expect(await accountBalance(b.id)).toBe(100);
 modal=await open("SAN transferência prevista","Realizar transferência prevista","Realizar transferência prevista");
 await modal.getByLabel("Data efetiva").fill("2027-01-20");await modal.getByLabel("Motivo").fill("Transferência confirmada no banco");
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await modal.screenshot({path:path.join(dir,`san-d2-transferencia-${width}.png`),animations:"disabled"});}
 const actual=await confirm(modal,"Confirmar realização","/realizations");
 expect(await accountBalance(a.id)).toBe(798);expect(await accountBalance(b.id)).toBe(200);
 const history=await rows();expect(history.filter((t:{operationId:string,status:string})=>t.operationId===transfer.operationId&&t.status==="FULFILLED")).toHaveLength(3);
 expect(history.filter((t:{operationId:string,status:string})=>t.operationId===actual.operationId&&t.status==="SETTLED")).toHaveLength(3);
 current=history.find((t:{id:string})=>t.id===forecast.id);expect(current.status).toBe("FULFILLED");
 await writeFile(path.join(dir,"san-d2-history.json"),JSON.stringify({forecast,settlement,direct,transfer,actual,history},null,2));
});

test("SAN-D1 duas intenções iguais, saldo pagável, recibo e conflito",async({page})=>{
 await start(page,"payment");
 const a=await post(page,"/accounts",{name:`${ns}-cash`,type:"CHECKING",initialBalance:1000,color:"#10b981"});
 const c=await post(page,"/cards",{name:`${ns}-card`,last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"});
 const categories=await json(page,"/categories?type=EXPENSE");
 await post(page,"/cards/transaction",{cardId:c.id,categoryId:categories[0].id,description:"Compra300",amount:300,date:"2027-01-10",time:null,totalInstallments:1});
 await page.goto("/cartoes");
 const bodies:Array<Record<string,unknown>>=[];
 for(const suggested of ["300.00","200.00"]){
   await page.reload();await page.getByRole("button",{name:`Ver fatura de ${c.name}, final 4242`}).click();
   await page.getByRole("dialog",{name:`${c.name} •••• 4242`}).getByRole("button",{name:/^(Pagar|Adiantar)/}).click();
   const modal=page.getByRole("dialog",{name:`Pagar Fatura - ${c.name}`,exact:true});
   await expect(modal.getByLabel("Valor do Pagamento")).toHaveValue(suggested);
   await modal.getByRole("button",{name:"Adiantamento",exact:true}).click();
   await modal.getByLabel("Valor do Pagamento").fill("100");await modal.getByLabel("Pagar com").selectOption(a.id);
   const response=page.waitForResponse(r=>r.url().endsWith(`/cards/${c.id}/pay`)&&r.request().method()==="POST");
   await modal.getByRole("button",{name:"Confirmar Pagamento"}).click();const paid=await response;expect(paid.ok()).toBe(true);
   bodies.push(paid.request().postDataJSON());await expect(modal).toHaveCount(0);
 }
 expect(bodies[0].operationId).not.toBe(bodies[1].operationId);
 const replay=await post(page,`/cards/${c.id}/pay`,bodies[0]);
 expect(replay.operationId).toBe(bodies[0].operationId);
 const conflict=await page.request.post(`/api/cards/${c.id}/pay`,{data:{...bodies[0],amount:99}});expect(conflict.status()).toBe(409);
 expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(800);
 const invoice=await json(page,`/cards/${c.id}/invoice?month=1&year=2027`);expect(invoice.payableAmount).toBe(100);expect(invoice.totalAmount).toBe(300);
 await page.reload();await page.getByRole("button",{name:`Ver fatura de ${c.name}, final 4242`}).click();
 await page.getByRole("dialog",{name:`${c.name} •••• 4242`}).getByRole("button",{name:/^(Pagar|Adiantar)/}).click();
 const modal=page.getByRole("dialog",{name:`Pagar Fatura - ${c.name}`,exact:true});
 await expect(modal.getByLabel("Valor do Pagamento")).toHaveValue("100.00");
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await modal.screenshot({path:path.join(dir,`san-d1-payment-${width}.png`),animations:"disabled"});}
 await writeFile(path.join(dir,"san-d1-receipt.json"),JSON.stringify({bodies,replay,invoice},null,2));
});

test("SAN-B criar item, reload, consumir reserva, excluir intenção e reembolsar pela UI",async({page})=>{
 await start(page,"goal");
 const a=await post(page,"/accounts",{name:`${ns}-source`,type:"CHECKING",initialBalance:1000,color:"#10b981"});
 const g=await post(page,"/goals",{title:`${ns}-goal`,targetValue:1000,deadline:"2028-01-01",type:"MONETARY",useChecklist:true,color:"BLUE"});
 await post(page,`/goals/${g.id}/deposit`,{accountId:a.id,amount:300,note:"Reserva"});
 await page.goto("/metas");await page.getByText(g.title,{exact:true}).click();
 await page.getByRole("button",{name:/Adicionar.*item/i}).click();
 await page.getByPlaceholder("Nome do item (ex: Processador)").fill("Compra saneamento");
 await page.getByPlaceholder(/Valor|Estimado|Preço/i).fill("120");
 const added=page.waitForResponse(r=>r.url().endsWith(`/api/goals/${g.id}/items`)&&r.request().method()==="POST");
 await page.getByRole("button",{name:"Adicionar",exact:true}).click();expect((await added).ok()).toBe(true);
 await page.reload();await page.getByText(g.title,{exact:true}).click();
 await page.getByRole("button",{name:"Comprar Compra saneamento"}).click();
 const allocations=await json(page,`/goals/${g.id}/allocations`);
 await page.locator("select").filter({has:page.locator(`option[value="RES_${allocations[0].id}"]`)}).selectOption(`RES_${allocations[0].id}`);
 const bought=page.waitForResponse(r=>r.url().endsWith("/purchase")&&r.request().method()==="PATCH");
 await page.getByRole("button",{name:"Confirmar",exact:true}).click();expect((await bought).ok()).toBe(true);
 expect((await json(page,"/accounts")).find((x:{id:string})=>x.id===a.id).balance).toBe(880);
 expect((await json(page,`/goals/${g.id}/allocations`))[0].amount).toBe(180);
 await page.getByRole("button",{name:"Deletar Meta",exact:true}).click();
 const modal=page.getByRole("dialog",{name:"Excluir Meta",exact:true});
 const deleted=page.waitForResponse(r=>r.url().endsWith(`/api/goals/${g.id}`)&&r.request().method()==="DELETE");
 await modal.getByRole("button",{name:"Excluir",exact:true}).click();expect((await deleted).status()).toBe(204);
 await page.reload();
 const history=page.getByRole("region",{name:"Histórico de compras"});
 await expect(history.getByText("Compra saneamento",{exact:true})).toBeVisible();
 const refunded=page.waitForResponse(r=>r.url().endsWith("/refund")&&r.request().method()==="POST");
 await history.getByRole("button",{name:"Reembolsar compra"}).click();expect((await refunded).ok()).toBe(true);
 await page.reload();await expect(history.getByText("Reembolsada")).toBeVisible();
 expect((await json(page,"/accounts")).find((x:{id:string})=>x.id===a.id).balance).toBe(1000);
 await mkdir(dir,{recursive:true});await writeFile(path.join(dir,"san-b-purchases.json"),JSON.stringify(await json(page,"/goals/purchases"),null,2));
 for(const width of [360,768,1440]) {await page.setViewportSize({width,height:900});await history.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,`san-b-${width}.png`),animations:"disabled"});}
});

test("SAN-C avaliação auditada, resgate B08 e encerramento pela UI",async({page})=>{
 await start(page,"valuation");
 const a=await post(page,"/accounts",{name:`${ns}-cash`,type:"CHECKING",initialBalance:1000,color:"#10b981"});
 const i=await post(page,"/investments",{ticker:"SANFIX",name:"Renda fixa saneamento",type:"FIXED_INCOME",openingQuantity:1000,openingCost:1000,openingValue:1000,valuationDate:"2027-01-15",valuationSource:"USER_PROVIDED"});
 const open=async()=>{await page.getByText("SANFIX",{exact:true}).click();await page.getByRole("button",{name:"Atualizar Saldo",exact:true}).click();return page.getByRole("dialog",{name:"SANFIX - Operação"});};
 await page.goto("/investimentos");
 let modal=await open();
 await modal.getByLabel("Valor informado").fill("1100");
 await modal.getByLabel("Motivo da avaliação").fill("Extrato de renda fixa");
 await modal.getByLabel("Data da avaliação").fill("2027-01-15");
 let response=page.waitForResponse(r=>r.url().endsWith("/update-balance")&&r.request().method()==="POST");
 await modal.getByRole("button",{name:"Confirmar Operação"}).click();expect((await response).ok()).toBe(true);
 await page.reload();modal=await open();await modal.getByRole("button",{name:"Resgatar",exact:true}).click();
 await modal.getByLabel("Valor informado").fill("220");await modal.getByLabel("Conta",{exact:true}).selectOption(a.id);
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await modal.screenshot({path:path.join(dir,`san-c-resgate-modal-${width}.png`),animations:"disabled"});await page.screenshot({path:path.join(dir,`san-c-resgate-${width}.png`),animations:"disabled"});}
 response=page.waitForResponse(r=>r.url().endsWith("/investments/operation")&&r.request().method()==="POST");
 await modal.getByRole("button",{name:"Confirmar Operação"}).click();expect((await response).ok()).toBe(true);
 await page.reload();
 let asset=(await json(page,"/investments")).find((v:{id:string})=>v.id===i.id);
 expect([asset.quantity,asset.totalCost,asset.valuationAmount]).toEqual([800,800,880]);
 modal=await open();await modal.getByRole("button",{name:"Resgatar",exact:true}).click();
 await modal.getByLabel("Valor informado").fill("880");await modal.getByLabel("Taxas / retenções").fill("1");await modal.getByLabel("Conta",{exact:true}).selectOption(a.id);
 response=page.waitForResponse(r=>r.url().endsWith("/investments/operation")&&r.request().method()==="POST");
 await modal.getByRole("button",{name:"Confirmar Operação"}).click();expect((await response).ok()).toBe(true);
 await page.reload();asset=(await json(page,"/investments")).find((v:{id:string})=>v.id===i.id);
 expect([asset.quantity,asset.totalCost,asset.valuationAmount]).toEqual([0,0,0]);
 expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(2099);
 await writeFile(path.join(dir,"san-c-history.json"),JSON.stringify(await json(page,`/investments/${i.id}/history`),null,2));
});

test("SAN-C2 compensar aquisição pela UI, reload e auditoria preservada",async({page})=>{
 await start(page,"correction");
 const a=await post(page,"/accounts",{name:`${ns}-source`,type:"CHECKING",initialBalance:1000,color:"#10b981"});
 const i=await post(page,"/investments",{ticker:"SANCORR",name:"Compensação saneamento",type:"STOCK",openingQuantity:0,openingCost:0});
 await post(page,"/investments/operation",{investmentId:i.id,type:"BUY",quantity:20,price:10,fees:2,date:"2027-01-15",accountId:a.id});
 const original=(await json(page,`/investments/${i.id}/history`))[0];
 const invalid=await page.request.post(`/api/investments/operation/${original.id}/corrections`,{data:{operationId:crypto.randomUUID(),date:"2027-01-15",reason:"Fronteira decimal",returnedFees:2}});
 expect(invalid.status()).toBe(400);
 await page.goto("/investimentos");await page.getByText("SANCORR",{exact:true}).click();
 await page.getByRole("button",{name:"Compensar operação",exact:true}).click();
 const modal=page.getByRole("dialog",{name:"Compensar operação",exact:true});
 await modal.getByLabel("Motivo",{exact:true}).fill("Cancelamento E18 comprovado");
 await modal.getByLabel("Taxas devolvidas",{exact:true}).fill("2");
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await modal.screenshot({path:path.join(dir,`san-c2-modal-${width}.png`),animations:"disabled"});}
 const response=page.waitForResponse(r=>r.url().endsWith("/corrections")&&r.request().method()==="POST");
 await modal.getByRole("button",{name:"Confirmar compensação",exact:true}).click();expect((await response).ok()).toBe(true);
 await page.reload();await page.getByText("SANCORR",{exact:true}).click();
 await expect(page.getByRole("region",{name:"Compensações registradas"}).getByText(/Cancelamento E18 comprovado/)).toBeVisible();
 expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(1000);
 const asset=(await json(page,"/investments")).find((v:{id:string})=>v.id===i.id);
 expect([asset.quantity,asset.totalCost,asset.valuationAmount]).toEqual([0,0,0]);
 const history=await json(page,`/investments/${i.id}/history`);expect(history).toHaveLength(1);expect(history[0].costDelta).toBe(202);
 const corrections=await json(page,`/investments/${i.id}/corrections`);expect(corrections).toHaveLength(1);
 await writeFile(path.join(dir,"san-c2-audit.json"),JSON.stringify({history,corrections},null,2));
});
