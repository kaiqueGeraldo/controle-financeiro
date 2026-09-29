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
