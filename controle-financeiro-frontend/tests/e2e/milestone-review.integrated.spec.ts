import {expect,test,type Page} from "@playwright/test";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {registerSyntheticUser,syntheticUser} from "./support/synthetic-auth";

const dir=process.env.CF_REVIEW_EVIDENCE!;
const ns=process.env.CF_E2E_NAMESPACE!;
async function start(page:Page,suffix:string){
  if(suffix==="visual"){
    // Offset only calendar Date. Native performance/RAF/Web Animations keep one timeline.
    await page.addInitScript(()=>{
      const OriginalDate=Date;
      const offset=OriginalDate.parse("2027-01-15T12:00:00Z")-OriginalDate.now();
      globalThis.Date=new Proxy(OriginalDate,{
        construct(target,args){return Reflect.construct(target,args.length?args:[OriginalDate.now()+offset]);},
        apply(){return new OriginalDate(OriginalDate.now()+offset).toString();},
        get(target,key,receiver){return key==="now"?()=>OriginalDate.now()+offset:Reflect.get(target,key,receiver);},
      });
    });
  }else await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));
  await registerSyntheticUser(page,syntheticUser("A",`${ns}-${suffix}`));
}
async function post(page:Page,url:string,data:unknown){
  const r=await page.request.post(`/api${url}`,{data});
  expect(r.ok(),`${url}: ${r.status()} ${await r.text()}`).toBe(true);
  return (await r.text())?r.json():null;
}
async function json(page:Page,url:string){const r=await page.request.get(`/api${url}`);expect(r.ok(),await r.text()).toBe(true);return r.json();}
async function capture(page:Page,name:string){
  await mkdir(dir,{recursive:true});
  await page.screenshot({path:path.join(dir,`${name}.png`),fullPage:true,animations:"disabled"});
  await writeFile(path.join(dir,`${name}.txt`),await page.locator("body").innerText());
}
async function account(page:Page,name:string){return post(page,"/accounts",{name,type:"CHECKING",initialBalance:1000,color:"#10b981"});}

test("UI01 abertura real, lançamento, lacunas de previsão/transferência e arquivo",async({page})=>{
  await start(page,"account"); await page.goto("/contas");
  await page.getByTitle("Nova Conta",{exact:true}).click();
  const modal=page.getByRole("dialog",{name:"Gerenciar Contas"});
  await modal.getByPlaceholder("Nome (ex: Nubank)").fill(`${ns}-account`);
  await modal.getByPlaceholder("Saldo Atual").fill("1000.00");
  const created=page.waitForResponse(r=>r.url().endsWith("/api/accounts")&&r.request().method()==="POST");
  await modal.getByRole("button",{name:"Salvar",exact:true}).click(); expect((await created).status()).toBe(200);
  await modal.getByRole("button",{name:"Fechar modal"}).click();
  await page.reload();
  const a=(await json(page,"/accounts")).find((x:{name:string})=>x.name===`${ns}-account`); expect(a.balance).toBe(1000);
  expect((await json(page,"/dashboard/flow?month=1&year=2027")).income).toBe(0);
  await page.goto("/extrato"); await page.getByRole("button",{name:"Lançar",exact:true}).click();
  const form=page.getByRole("dialog",{name:"Nova Transação",exact:true});
  await capture(page,"ui01-new-transaction");
  expect.soft(await form.getByRole("button",{name:/Transfer/}).count(),"FIN-02 transfer UI").toBeGreaterThan(0);
  expect.soft(await form.locator('input[type="checkbox"],button[role="switch"]').count(),"pending state control").toBeGreaterThan(0);
  await form.getByPlaceholder("0,00").fill("120.00");
  await form.getByPlaceholder("Ex: Mercado, Salário...").fill(`${ns}-expense`);
  const cats=await json(page,"/categories?type=EXPENSE");
  await form.locator("select").nth(0).selectOption(cats[0].id);await form.locator("select").nth(1).selectOption(a.id);
  const saved=page.waitForResponse(r=>r.url().endsWith("/api/transactions")&&r.request().method()==="POST");
  await form.getByRole("button",{name:"Salvar Transação"}).click(); expect((await saved).status()).toBe(200);
  await page.reload(); expect((await json(page,"/accounts")).find((x:{id:string})=>x.id===a.id).balance).toBe(880);
  expect((await json(page,"/transactions/summary?month=1&year=2027")).exits).toBe(120);
  await capture(page,"ui01-extract");
  // Archived position: request is an API-layer subprobe, then real screen reload.
  expect((await page.request.delete(`/api/accounts/${a.id}`)).status()).toBe(204);
  await page.goto("/");await expect(page.getByText("Subtotal de ativos conhecidos",{exact:true})).toBeVisible();
  await capture(page,"ui01-archived-dashboard");
  expect.soft(await page.getByText("Subtotal de ativos conhecidos",{exact:true}).locator("..").innerText()).toContain("880,00");
});

test("UI02 parcela, dois pagamentos legítimos iguais, saldo pagável e conflito",async({page})=>{
  await start(page,"card");const a=await account(page,`${ns}-card-account`);
  const c=await post(page,"/cards",{name:`${ns}-card`,last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"});
  await page.goto("/cartoes");
  // Purchase fixtures are API-layer setup; payments below are full UI journeys.
  const cats=await json(page,"/categories?type=EXPENSE");
  await post(page,"/cards/transaction",{cardId:c.id,categoryId:cats[0].id,description:`${ns}-purchase`,amount:300,date:"2027-01-10",time:null,totalInstallments:3});
  await page.reload();await page.getByRole("button",{name:`Ver fatura de ${c.name}, final 4242`}).click();
  const detail=page.getByRole("dialog",{name:`${c.name} •••• 4242`});
  for(let n=0;n<2;n++){
    await detail.getByRole("button",{name:/^(Pagar|Adiantar)/}).click();
    const pay=page.getByRole("dialog",{name:`Pagar Fatura - ${c.name}`,exact:true});
    if(n===1)expect.soft(await pay.getByLabel("Valor do Pagamento").inputValue(),"remaining payable is 80").toBe("80.00");
    await pay.getByLabel("Pagar com").selectOption(a.id);await pay.getByLabel("Valor do Pagamento").fill("20.00");
    const response=page.waitForResponse(r=>r.url().endsWith(`/api/cards/${c.id}/pay`)&&r.request().method()==="POST");
    await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();const r=await response;
    await writeFile(path.join(dir,`ui02-payment-${n}.json`),JSON.stringify({request:r.request().postDataJSON(),status:r.status(),response:await r.text()},null,2));
    expect.soft(r.status(),"a distinct intentional partial payment must succeed").toBe(200);
    if(r.ok())await expect(pay).toHaveCount(0);else{await expect(pay.getByRole("alert")).toBeVisible();await capture(page,"ui02-conflict");await pay.getByRole("button",{name:"Fechar modal"}).click();}
  }
  await page.reload(); const persisted=await json(page,"/accounts");
  expect.soft(persisted.find((x:{id:string})=>x.id===a.id).balance).toBe(960);
  await writeFile(path.join(dir,"ui02-invoice.json"),JSON.stringify(await json(page,`/cards/${c.id}/invoice?month=1&year=2027`),null,2));
});

test("UI03 reserva, compra com saldo da meta e exclusão",async({page})=>{
  await start(page,"goal");const a=await account(page,`${ns}-goal-account`);
  const g=await post(page,"/goals",{title:`${ns}-goal`,targetValue:1000,deadline:"2028-01-01",type:"MONETARY",useChecklist:true,color:"BLUE"});
  await post(page,`/goals/${g.id}/deposit`,{accountId:a.id,amount:300,note:"Reserva sintética"});
  const savedItem=await post(page,`/goals/${g.id}/items`,{name:"Notebook sintético",estimatedPrice:120});
  await page.goto("/metas");await page.getByText(g.title,{exact:true}).click();
  await writeFile(path.join(dir,"ui03-goals.json"),JSON.stringify(await json(page,"/goals"),null,2));
  await capture(page,"ui03-checklist");
  const visibleItem=page.getByText("Notebook sintético",{exact:true});
  expect.soft(await visibleItem.count(),"persisted checklist item must survive GET and reload").toBe(1);
  if(await visibleItem.count()){
  const item=page.getByText("Notebook sintético",{exact:true}).locator("..").locator("..");
  await item.locator("button").first().click();
  await page.locator("select").filter({has:page.locator('option[value="GOAL_BALANCE"]')}).selectOption("GOAL_BALANCE");
  const purchase=page.waitForResponse(r=>r.url().includes("/purchase")&&r.request().method()==="PATCH");
  await page.getByRole("button",{name:"Confirmar",exact:true}).click();const pr=await purchase;
  await writeFile(path.join(dir,"ui03-purchase.json"),JSON.stringify({request:pr.request().postDataJSON(),status:pr.status(),body:await pr.text()},null,2));
  expect.soft(pr.status(),"reservation must be consumed via real source").toBe(200);
  await capture(page,"ui03-purchase-rejected");
  }else{
    // UI journey is blocked. This is explicitly a separate HTTP compatibility probe.
    const pr=await page.request.patch(`/api/goals/items/${savedItem.id}/purchase`,{data:{paidPrice:120}});
    await writeFile(path.join(dir,"ui03-purchase-api-only.json"),JSON.stringify({layer:"HTTP only; checklist missing prevents UI purchase",status:pr.status(),body:await pr.text()},null,2));
  }
  await page.getByRole("button",{name:"Deletar Meta",exact:true}).click();
  await page.locator("select").filter({has:page.locator('option[value="'+a.id+'"]')}).last().selectOption(a.id);
  const clickable=await page.getByRole("button",{name:"Excluir",exact:true}).click({trial:true,timeout:5000}).then(()=>true,()=>false);
  expect.soft(clickable,"delete control must be reachable without bypassing overlay").toBe(true);
  let dr,layer;
  if(clickable){
    const deletion=page.waitForResponse(r=>r.url().includes(`/api/goals/${g.id}?`)&&r.request().method()==="DELETE");
    await page.getByRole("button",{name:"Excluir",exact:true}).click();dr=await deletion;layer="UI";
  }else{
    await capture(page,"ui03-delete-overlay");
    dr=await page.request.delete(`/api/goals/${g.id}?targetAccountId=${a.id}`);layer="HTTP only; UI deletion blocked by overlay";
  }
  await writeFile(path.join(dir,"ui03-delete.json"),JSON.stringify({layer,url:dr.url(),status:dr.status(),body:await dr.text()},null,2));
  expect.soft(dr.status(),"intent deletion must release reservation").toBe(204);
  await capture(page,"ui03-delete-rejected");
  await page.reload();expect((await json(page,"/accounts")).find((x:{id:string})=>x.id===a.id).balance).toBe(1000);
});

test("UI06 renda fixa resgate parcial mantém custo e ganho da posição",async({page})=>{
  await start(page,"fixed");const a=await account(page,`${ns}-fixed-account`);
  const i=await post(page,"/investments",{ticker:"RVFIX",name:"Renda fixa review",type:"FIXED_INCOME",openingQuantity:1000,openingCost:1000,openingValue:1100,valuationDate:"2027-01-14",valuationSource:"USER_PROVIDED"});
  await page.goto("/investimentos");await page.getByText(i.ticker,{exact:true}).click();
  await page.getByRole("button",{name:"Aportar",exact:true}).click();
  const form=page.getByRole("dialog",{name:`${i.ticker} - Operação`,exact:true});
  await form.getByRole("button",{name:"Resgatar",exact:true}).click();
  await form.getByPlaceholder("0,00").fill("220.00");await form.locator("select").selectOption(a.id);
  const response=page.waitForResponse(r=>r.url().endsWith("/api/investments/operation")&&r.request().method()==="POST");
  await form.getByRole("button",{name:"Confirmar Operação"}).click();const result=await response;
  await writeFile(path.join(dir,"ui06-request.json"),JSON.stringify({request:result.request().postDataJSON(),status:result.status(),body:await result.text()},null,2));
  expect(result.status()).toBe(200);await page.reload();
  const asset=(await json(page,"/investments")).find((x:{id:string})=>x.id===i.id);
  const flow=await json(page,"/dashboard/flow?month=1&year=2027");
  await writeFile(path.join(dir,"ui06-observed.json"),JSON.stringify({asset,flow},null,2));
  expect.soft(asset.quantity).toBe(800);expect.soft(asset.totalCost).toBe(800);expect.soft(asset.valuationAmount).toBe(880);expect.soft(flow.investmentResult).toBe(20);
  expect((await json(page,"/accounts")).find((x:{id:string})=>x.id===a.id).balance).toBe(1220);
});

test("UI04 visual dirigido 360 768 1440, vazio, indisponível, loading e erro",async({page})=>{
  await start(page,"visual");
  await post(page,"/investments",{ticker:"RVVIS",name:"Avaliação desconhecida",type:"STOCK",openingQuantity:10,openingCost:200});
  for(const width of [360,768,1440]){
    await page.setViewportSize({width,height:width===360?800:width===768?1024:900});
    for(const [route,label] of [["/","dashboard"],["/contas","accounts"],["/extrato","extract"],["/investimentos","investments"],["/resumo-anual","annual"]]){
      await page.goto(route);await expect(page.locator("h1").first()).toBeVisible();
      const readyText:Record<string,string>={dashboard:"Resultado gerencial do mês",accounts:"Carteira Física",extract:"Nenhuma movimentação encontrada.",investments:"RVVIS",annual:"Custo investido"};
      await expect(page.getByText(readyText[label],{exact:true}).first()).toBeVisible();
      await page.getByText(readyText[label],{exact:true}).first().scrollIntoViewIfNeeded();
      // Playwright visibility allows opacity 0; wait for Framer's ancestor fade.
      await expect.poll(()=>page.getByText(readyText[label],{exact:true}).first().evaluate(element=>{
        for(let current:Element|null=element;current;current=current.parentElement){
          if(Number(getComputedStyle(current).opacity)<0.99)return false;
        }
        return true;
      })).toBe(true);
      await capture(page,`visual-${width}-${label}`);
      expect.soft(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`${width} ${label} horizontal overflow`).toBe(true);
    }
  }
  await page.setViewportSize({width:360,height:800});
  let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});
  const started=Promise.withResolvers<void>();
  await page.route("**/api/transactions?*",async route=>{started.resolve();await gate;await route.continue();});
  await page.goto("/extrato");await started.promise;await capture(page,"visual-360-loading");release();await page.unrouteAll({behavior:"wait"});
});

test("UI07 erro de leitura explícito com respostas 503 observadas",async({page})=>{
  await start(page,"outage");await page.setViewportSize({width:360,height:800});
  const requests:string[]=[];
  await page.route(url=>url.pathname.startsWith("/api/transactions"),async route=>{
    requests.push(route.request().url());
    await route.fulfill({status:503,contentType:"application/json",body:'{"message":"Synthetic review outage"}'});
  });
  const failed=page.waitForResponse(r=>r.url().includes("/api/transactions")&&r.status()===503);
  await page.goto("/extrato");await failed;
  await expect.soft(page.getByRole("button",{name:"Tentar novamente"})).toBeVisible();
  await capture(page,"visual-360-error");
  await writeFile(path.join(dir,"ui07-outage.json"),JSON.stringify({layer:"visual fault injection; HTTP 503 observed",requests},null,2));
  expect(requests.length).toBeGreaterThan(0);
});

test("UI05 investimento compra e venda reais, caixa versus resultado e XLSX",async({page})=>{
  await start(page,"investment");const a=await account(page,`${ns}-investment-account`);
  const i=await post(page,"/investments",{ticker:"RVBUY",name:"Ativo review",type:"STOCK"});
  for(const [kind,quantity,price] of [["Comprar","10","20.00"],["Vender","4","25.00"]]){
    await page.goto("/investimentos");await page.getByText(i.ticker,{exact:true}).click();
    await page.getByRole("button",{name:"Aportar",exact:true}).click();
    const form=page.getByRole("dialog",{name:`${i.ticker} - Operação`,exact:true});
    await form.getByRole("button",{name:kind,exact:true}).click();
    await form.getByPlaceholder("0",{exact:true}).fill(quantity);await form.getByPlaceholder("0,00").fill(price);
    await form.locator("select").selectOption(a.id);
    const sent=page.waitForResponse(r=>r.url().endsWith("/api/investments/operation")&&r.request().method()==="POST");
    await form.getByRole("button",{name:"Confirmar Operação"}).click();expect((await sent).status()).toBe(200);
    await expect(form).toHaveCount(0);await page.reload();
  }
  expect((await json(page,"/accounts")).find((x:{id:string})=>x.id===a.id).balance).toBe(900);
  const assets=await json(page,"/investments");expect(assets[0].quantity).toBe(6);expect(assets[0].totalCost).toBe(120);
  const flow=await json(page,"/dashboard/flow?month=1&year=2027");expect(flow.income).toBe(0);expect(flow.expense).toBe(0);expect(flow.investmentResult).toBe(20);
  const cash=await json(page,"/transactions/summary?month=1&year=2027");expect(cash).toEqual({entries:100,exits:200,balance:-100});
  const exported=await page.request.get("/api/transactions/export?month=1&year=2027");expect(exported.status()).toBe(200);
  await writeFile(path.join(dir,"ui05-export.xlsx"),await exported.body());
  await page.goto("/resumo-anual");await expect(page.locator("h1").first()).toBeVisible();await capture(page,"ui05-annual");
  // Owner isolation through the same BFF with a distinct authenticated browser context.
  const second=await page.context().browser()!.newContext({baseURL:"http://127.0.0.1:3107"});const other=await second.newPage();
  await start(other,"isolation");
  expect((await json(other,"/accounts")).some((x:{id:string})=>x.id===a.id)).toBe(false);
  const denied=await other.request.get(`/api/investments/${i.id}/history`);expect(denied.status()).toBeGreaterThanOrEqual(400);
  expect((await json(page,"/accounts")).find((x:{id:string})=>x.id===a.id).balance).toBe(900);await second.close();
});
