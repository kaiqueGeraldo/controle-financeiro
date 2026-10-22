import {expect,type Page,type Locator} from "@playwright/test";
import {readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {syntheticUser,registerSyntheticUser,type SyntheticUser} from "../e2e/support/synthetic-auth";
import {setCivilDateOnly} from "../e2e/support/civil-date-clock";

export const out=process.env.CF032_EVIDENCE!;
export const day="2026-10-22";
export type Row=Record<string,unknown>;
export function record(value:unknown):Row {if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Expected object");return value as Row;}
export function rows(value:unknown):Row[]{if(!Array.isArray(value))throw new Error("Expected list");return value.map(record);}
export function at(value:unknown,...keys:string[]):unknown{return keys.reduce<unknown>((v,k)=>record(v)[k],value);}
// Chromium sends Secure cookies on trustworthy loopback origins. APIRequestContext
// has different cookie rules on HTTP; use actual browser fetch for BFF probes.
// No token is copied into Node or an evidence file.
export function request(page:Page){
 const send=async(url:string,method:string,options?:{data:unknown})=>{
  if(!url.startsWith("/api/"))throw new Error("BFF request must use this app's origin");
  const result=await page.evaluate(async({url,method,data})=>{
   const response=await fetch(url,{method,credentials:"same-origin",headers:data===undefined?undefined:{"Content-Type":"application/json"},body:data===undefined?undefined:JSON.stringify(data)});
   return {status:response.status,body:await response.text()};
  },{url,method,data:options?.data});
  return {status:()=>result.status,ok:()=>result.status>=200&&result.status<300,text:async()=>result.body,json:async():Promise<unknown>=>JSON.parse(result.body)};
 };
 return {get:(url:string)=>send(url,"GET"),post:(url:string,options?:{data:unknown})=>send(url,"POST",options),put:(url:string,options:{data:unknown})=>send(url,"PUT",options)};
}
export async function json(page:Page,url:string):Promise<unknown>{const r=await request(page).get(`/api${url}`);expect(r.ok(),`${url}: ${r.status()} ${await r.text()}`).toBe(true);return r.json();}
export async function post(page:Page,url:string,data:unknown):Promise<unknown>{const r=await request(page).post(`/api${url}`,{data});expect(r.ok(),`${url}: ${r.status()} ${await r.text()}`).toBe(true);return (await r.text())?r.json():null;}
export async function save(name:string,data:unknown){await writeFile(path.join(out,`${name}.json`),JSON.stringify(data,null,2));}
export async function register(page:Page,suffix:string,alias:"A"|"B"="A"):Promise<SyntheticUser>{
 await setCivilDateOnly(page,new Date("2026-10-22T09:00:00Z"));
 const person=syntheticUser(alias,`${process.env.CF_E2E_NAMESPACE}-${suffix}`);
 await registerSyntheticUser(page,person);
 return person;
}
export async function sql(page:Page,email:string,name?:string):Promise<Row>{
 const url=new URL("/snapshot",process.env.CF032_OBSERVER);url.searchParams.set("email",email);if(name)url.searchParams.set("name",name);
 const r=await page.request.get(url.toString());expect(r.ok(),await r.text()).toBe(true);return record(await r.json());
}
export async function paint(page:Page,action:Locator,name:string){
 await expect(action).toBeVisible();await action.scrollIntoViewIfNeeded();
 await expect.poll(()=>action.evaluate(element=>{
  const r=element.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);let opacity=1;
  for(let p:Element|null=element;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);
  return opacity>=0.99&&!!hit&&(hit===element||element.contains(hit));
 }),{message:`${name} must be painted and accept input`}).toBe(true);
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 await page.screenshot({path:path.join(out,`${name}.png`),fullPage:true});
 await save(`${name}-paint`,await page.evaluate(()=>({zone:Intl.DateTimeFormat().resolvedOptions().timeZone,date:new Date().toISOString(),performance:performance.now(),timeline:document.timeline.currentTime,native:[performance.now,setTimeout,setInterval,requestAnimationFrame].map(f=>f.toString().includes("[native code]")),viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth})));
}
export async function e01(page:Page,suffix:string,existingPerson?:SyntheticUser,stockIdentifier?:string){
 const person=existingPerson??await register(page,suffix);
 const accounts=rows(await json(page,"/accounts"));expect(accounts).toHaveLength(1);
 const categories=rows(await json(page,"/categories?type=INCOME"));expect(categories.length).toBeGreaterThan(0);
 const example=record(JSON.parse(await readFile(path.join(process.env.CF032_RUNTIME!,"e01.json"),"utf8")));
 const draft=JSON.parse(JSON.stringify(example.draft).replaceAll("00000000-0000-4000-8000-000000000901",String(accounts[0].id)).replaceAll("00000000-0000-4000-8000-000000000902",String(categories[0].id)));
 if(stockIdentifier){const stock=rows(at(draft,"payload","sections","investments","items")).find(i=>i.type==="STOCK");expect(stock).toBeTruthy();stock!.identifier=stockIdentifier;}
 if(suffix.startsWith("temporal-")){
  const goals=rows(at(draft,"payload","sections","goals","items"));
  for(const [i,title,date] of [[0,"Prazo ontem","2026-10-21"],[1,"Prazo hoje",day],[2,"Prazo amanhã","2026-10-23"]] as const){goals[i].title=title;goals[i].deadline=date;}
 }
 const current=at(await json(page,"/onboarding"),"data","version");
 draft.expectedVersion=current;
 const r=await request(page).put("/api/onboarding/draft",{data:draft});expect(r.status(),await r.text()).toBe(200);
 await page.goto("/onboarding");await page.getByRole("button",{name:"Preparar revisão financeira"}).click();
 await expect(page.getByRole("heading",{name:"Confira antes de registrar"})).toBeVisible();
 const pending=at(await json(page,"/onboarding"),"data","pendingIntent");
 expect(at(pending,"summary","metrics","netWorth","value")).toBe("1451.00");
 expect(at(pending,"summary","metrics","freeAccountCash","value")).toBe("950.00");
 expect((await sql(page,person.email)).accountTotal).toBe("0.00");
 await page.getByRole("button",{name:"Confirmar informações e registrar posições"}).click();
 await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();
 const receipt=at(await json(page,"/onboarding"),"data","completedReceipt");
 const list=rows(await json(page,"/accounts"));
 const checking=list.find(a=>a.balance===1000);const savings=list.find(a=>a.balance===200);expect(checking).toBeTruthy();expect(savings).toBeTruthy();
 const card=rows(await json(page,"/cards"))[0];
 return {person,checking:checking!,savings:savings!,card,receipt};
}
export async function transaction(page:Page,accountId:string,type:"INCOME"|"EXPENSE"|"TRANSFER",description:string,amount:string,destination?:string){
 await page.goto("/extrato");await page.getByRole("button",{name:"Lançar",exact:true}).click();
 const modal=page.getByRole("dialog",{name:"Nova Transação",exact:true});
 await modal.getByRole("button",{name:{INCOME:"Receita",EXPENSE:"Despesa",TRANSFER:"Transferência"}[type],exact:true}).click();
 await modal.getByLabel("Valor do lançamento").fill(amount);await modal.getByLabel("Descrição do lançamento").fill(description);
 await modal.getByLabel("Data do lançamento").fill(day);await modal.getByLabel("Conta do lançamento").selectOption(accountId);
 if(type==="TRANSFER"){await modal.getByLabel("Conta destino").selectOption(destination!);await modal.getByLabel("Taxa da transferência").fill("2.00");}
 else {const cats=rows(await json(page,`/categories?type=${type}`));await modal.getByLabel("Categoria do lançamento").selectOption(String(cats[0].id));}
 const response=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/transactions"&&r.request().method()==="POST");
 await modal.getByRole("button",{name:"Salvar Transação"}).click();const saved=await response;expect(saved.status(),await saved.text()).toBe(200);await expect(modal).toHaveCount(0);
 return record(await saved.json());
}
export async function paymentForm(page:Page,card:Row,accountId:string,amount:string){
 await page.goto("/cartoes");await page.getByRole("button",{name:`Ver fatura de ${card.name}, final ${card.last4Digits}`}).click();
 // last4Digits is optional in SPEC-001; React renders null as no text in the title.
 const invoice=page.getByRole("dialog",{name:`${card.name} •••• ${card.last4Digits??""}`.trim()});
 // At22/10, the active cycle after closing20 is November. The oracle pays the
 // October opening debt, so select that competence explicitly before submission.
 await expect(invoice.getByText(/novembro de 2026/i,{exact:true})).toBeVisible();
 const target=page.waitForResponse(r=>{
  const url=new URL(r.url());return url.pathname===`/api/cards/${card.id}/invoice`&&url.searchParams.get("month")==="10"&&url.searchParams.get("year")==="2026";
 });
 await invoice.getByRole("button",{name:"Mês anterior da fatura"}).click();
 const selected=await target;expect(selected.ok(),await selected.text()).toBe(true);expect(await selected.json()).toMatchObject({month:10,year:2026});
 await expect(invoice.getByText(/outubro de 2026/i,{exact:true})).toBeVisible();
 await invoice.getByRole("button",{name:/^(Pagar|Adiantar)/}).click();
 const pay=page.getByRole("dialog",{name:`Pagar Fatura - ${card.name}`,exact:true});
 await pay.getByRole("button",{name:"Adiantamento",exact:true}).click();await pay.getByLabel("Valor do Pagamento").fill(amount);await pay.getByLabel("Pagar com").selectOption(accountId);
 return pay;
}
export async function download(page:Page,name:string){
 await page.goto("/extrato");const promise=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar período",exact:true}).click();
 const file=await promise;expect(await file.failure()).toBeNull();await file.saveAs(path.join(out,name));
 const r=await page.request.get(`${process.env.CF032_OBSERVER}/xlsx?file=${encodeURIComponent(name)}`);expect(r.ok(),await r.text()).toBe(true);return record(await r.json());
}
export async function login(page:Page,person:SyntheticUser){await page.goto("/auth");await page.locator('input[name="email"]').fill(person.email);await page.locator('input[name="senha"]').fill(person.password);await page.getByRole("button",{name:"Entrar",exact:true}).click();await expect(page).toHaveURL(/\/$/);}
export async function logout(page:Page){await page.goto("/configuracoes");await page.getByText("Sair da Conta",{exact:true}).click();await page.getByRole("dialog",{name:"Sair da Conta",exact:true}).getByRole("button",{name:"Sair",exact:true}).click();await expect(page).toHaveURL(/\/auth/);expect((await page.context().cookies()).some(c=>c.name==="token")).toBe(false);}
