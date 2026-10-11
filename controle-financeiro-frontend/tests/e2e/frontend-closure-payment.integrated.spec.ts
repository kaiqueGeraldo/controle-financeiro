import {expect,test,type Page} from "@playwright/test";
import {writeFile} from "node:fs/promises";
import path from "node:path";
import {registerSyntheticUser,syntheticUser} from "./support/synthetic-auth";
const dir=process.env.CF_REVIEW_EVIDENCE!;
const ns=process.env.CF_E2E_NAMESPACE!;
const observations=new Map<string,unknown[]>();
test.beforeEach(async({page},info)=>{
 const events:unknown[]=[];observations.set(info.title,events);
 page.on('request',r=>{if(r.url().includes('/api/'))events.push({event:'request',time:Date.now(),method:r.method(),path:new URL(r.url()).pathname});});
 page.on('response',r=>{if(r.url().includes('/api/'))events.push({event:'response',time:Date.now(),status:r.status(),path:new URL(r.url()).pathname});});
 page.on('pageerror',e=>events.push({event:'pageerror',message:e.message}));
 await page.exposeFunction('reviewPassive',(data:unknown)=>events.push(data));
 await page.addInitScript(()=>{
  document.addEventListener('click',e=>{
   const target=(e.target as Element).closest('button');
   if(target) void (window as unknown as {reviewPassive:(x:unknown)=>Promise<void>}).reviewPassive({event:'click',time:performance.now(),button:target.getAttribute('aria-label')??target.textContent});
  },true);
 });
});
test.afterEach(async({page},info)=>{
 const id=info.title.includes('120')?'120':'20';
 const events=observations.get(info.title)??[];
 if(!page.isClosed()){
  events.push({event:'terminal',dialogs:await page.getByRole('dialog').allTextContents().catch(()=>['unavailable'])});
  await page.screenshot({path:path.join(dir,`D-terminal-${id}.png`)}).catch(()=>undefined);
 }
 await writeFile(path.join(dir,`D-passive-${id}.json`),JSON.stringify(events,null,2));
});
async function start(page:Page,suffix:string){await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));await registerSyntheticUser(page,syntheticUser("A",`${ns}-${suffix}`));}
async function post(page:Page,url:string,data:unknown){
 // Synthetic fixtures explicitly serialize the new opening contract; legacy commands retain their transport.
 if(url==="/investments"&&data&&typeof data==="object"){
   const payload={...data} as Record<string,unknown>;
   for(const field of ["openingQuantity","openingCost","openingValue"])if(payload[field]!=null)payload[field]=String(payload[field]);
   data=payload;
 }
 const r=await page.request.post(`/api${url}`,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;
}
async function json(page:Page,url:string){const r=await page.request.get(`/api${url}`);expect(r.ok(),await r.text()).toBe(true);return r.json();}

for(const payment of [20,120])test(`SAN-BC-card compra, exclusão e reembolso após pagamento ${payment} pela UI`,async({page})=>{
 await start(page,`goal-card-${payment}`);
 const a=await post(page,"/accounts",{name:"SAN banco cartão",type:"CHECKING",initialBalance:1000,color:"#10b981"});
 const c=await post(page,"/cards",{name:`SAN cartão ${payment}`,last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"});
 let paymentPosts=0;
 page.on("request",request=>{if(request.method()==="POST"&&request.url().endsWith(`/cards/${c.id}/pay`))paymentPosts++;});
 const g=await post(page,"/goals",{title:`SAN meta cartão ${payment}`,targetValue:1000,deadline:"2028-01-01",type:"MONETARY",useChecklist:true,color:"BLUE"});
 const name=`SAN compra cartão ${payment}`;
 await page.goto("/metas");await page.getByText(g.title,{exact:true}).click();await page.getByRole("button",{name:/Adicionar.*item/i}).click();
 await page.getByPlaceholder("Nome do item (ex: Processador)").fill(name);await page.getByPlaceholder(/Valor|Estimado|Preço/i).fill("120");
 const added=page.waitForResponse(r=>r.url().endsWith(`/goals/${g.id}/items`)&&r.request().method()==="POST");await page.getByRole("button",{name:"Adicionar",exact:true}).click();expect((await added).ok()).toBe(true);
 await page.reload();await page.getByText(g.title,{exact:true}).click();await page.getByRole("button",{name:`Comprar ${name}`,exact:true}).click();
 await page.locator("select").filter({has:page.locator(`option[value="CARD_${c.id}"]`)}).selectOption(`CARD_${c.id}`);
 const bought=page.waitForResponse(r=>r.url().endsWith("/purchase")&&r.request().method()==="PATCH");await page.getByRole("button",{name:"Confirmar",exact:true}).click();expect((await bought).ok()).toBe(true);
 await page.goto("/cartoes");await page.getByRole("button",{name:`Ver fatura de ${c.name}, final 4242`}).click();
 await page.getByRole("dialog",{name:`${c.name} •••• 4242`}).getByRole("button",{name:/^(Pagar|Adiantar)/}).click();
 const pay=page.getByRole("dialog",{name:`Pagar Fatura - ${c.name}`,exact:true});await pay.getByRole("button",{name:"Adiantamento",exact:true}).click();await pay.getByLabel("Valor do Pagamento").fill(String(payment));await pay.getByLabel("Pagar com").selectOption(a.id);
 const paid=page.waitForResponse(r=>r.url().endsWith(`/cards/${c.id}/pay`)&&r.request().method()==="POST");await pay.getByRole("button",{name:"Confirmar Pagamento",exact:true}).click();expect((await paid).ok()).toBe(true);await expect(pay).toHaveCount(0);
  const paidState=await json(page,`/cards/${c.id}/invoice?month=1&year=2027`);
 expect(paidState.payableAmount).toBe(120-payment);
 await page.reload();
 await page.screenshot({path:path.join(dir,`D-after-payment-${payment}.png`)});
 await writeFile(path.join(dir,`D-after-payment-${payment}.json`),JSON.stringify({payment,paymentPosts,paidState}));
 await page.goto("/metas");await page.getByText(g.title,{exact:true}).click();await page.getByRole("button",{name:"Deletar Meta",exact:true}).click();
 const deleted=page.waitForResponse(r=>r.url().endsWith(`/goals/${g.id}`)&&r.request().method()==="DELETE");await page.getByRole("dialog",{name:"Excluir Meta",exact:true}).getByRole("button",{name:"Excluir",exact:true}).click();expect((await deleted).status()).toBe(204);
 await page.reload();const history=page.getByRole("region",{name:"Histórico de compras"});await expect(history.getByText(name,{exact:true})).toBeVisible();
 const refunded=page.waitForResponse(r=>r.url().endsWith("/refund")&&r.request().method()==="POST");await history.getByRole("button",{name:"Reembolsar compra",exact:true}).click();expect((await refunded).ok()).toBe(true);
 await page.reload();await expect(history.getByText("Reembolsada",{exact:true})).toBeVisible();
 const invoice=await json(page,`/cards/${c.id}/invoice?month=1&year=2027`);expect(invoice.payableAmount).toBe(0);
 expect((await json(page,"/cards")).find((v:{id:string})=>v.id===c.id).creditBalance).toBe(payment);
 expect(paymentPosts).toBe(1);
 expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(1000-payment);
 const fact=(await json(page,"/goals/purchases"))[0];const retry=await page.request.post(`/api/goals/items/${fact.itemId}/refund`);expect(retry.status()).toBe(400);
 expect((await json(page,"/accounts")).find((v:{id:string})=>v.id===a.id).balance).toBe(1000-payment);
 expect((await json(page,"/cards")).find((v:{id:string})=>v.id===c.id).creditBalance).toBe(payment);
 await writeFile(path.join(dir,`san-b-card-${payment}.json`),JSON.stringify({invoice,fact},null,2));
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await history.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,`san-b-card-${payment}-${width}.png`),animations:"disabled"});}
});
