import {expect,test,type Page} from "@playwright/test";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {registerSyntheticUser,syntheticUser} from "./support/synthetic-auth";
const dir=process.env.CF_REVIEW_EVIDENCE!;
const ns=process.env.CF_E2E_NAMESPACE!;
async function start(page:Page,suffix:string){await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));await registerSyntheticUser(page,syntheticUser("A",`${ns}-${suffix}`));}
async function post(page:Page,url:string,data:unknown){const r=await page.request.post(`/api${url}`,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;}
async function json(page:Page,url:string){const r=await page.request.get(`/api${url}`);expect(r.ok(),await r.text()).toBe(true);return r.json();}

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
