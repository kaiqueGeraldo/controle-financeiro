# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> F contas a receber: baixas parciais, calendário e persistência
- Location: tests\cf032\journeys.spec.ts:129:5

# Error details

```
Error: /accounts: 401 {"timestamp":"2026-10-22T22:44:09.234337500Z","status":401,"error":"Autenticação necessária","message":"Autenticação necessária para acessar este recurso.","path":"/accounts","fields":{}}

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: Carregando layout...
  - alert [ref=e3]: Finanças - Dashboard
```

# Test source

```ts
  1  | import {expect,type Page,type Locator} from "@playwright/test";
  2  | import {readFile,writeFile} from "node:fs/promises";
  3  | import path from "node:path";
  4  | import {syntheticUser,registerSyntheticUser,type SyntheticUser} from "../e2e/support/synthetic-auth";
  5  | import {setCivilDateOnly} from "../e2e/support/civil-date-clock";
  6  | 
  7  | export const out=process.env.CF032_EVIDENCE!;
  8  | export const day="2026-10-22";
  9  | export type Row=Record<string,unknown>;
  10 | export function record(value:unknown):Row {if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Expected object");return value as Row;}
  11 | export function rows(value:unknown):Row[]{if(!Array.isArray(value))throw new Error("Expected list");return value.map(record);}
  12 | export function at(value:unknown,...keys:string[]):unknown{return keys.reduce<unknown>((v,k)=>record(v)[k],value);}
> 13 | export async function json(page:Page,url:string):Promise<unknown>{const r=await page.request.get(`/api${url}`);expect(r.ok(),`${url}: ${r.status()} ${await r.text()}`).toBe(true);return r.json();}
     |                                                                                                                                                                         ^ Error: /accounts: 401 {"timestamp":"2026-10-22T22:44:09.234337500Z","status":401,"error":"Autenticação necessária","message":"Autenticação necessária para acessar este recurso.","path":"/accounts","fields":{}}
  14 | export async function post(page:Page,url:string,data:unknown):Promise<unknown>{const r=await page.request.post(`/api${url}`,{data});expect(r.ok(),`${url}: ${r.status()} ${await r.text()}`).toBe(true);return (await r.text())?r.json():null;}
  15 | export async function save(name:string,data:unknown){await writeFile(path.join(out,`${name}.json`),JSON.stringify(data,null,2));}
  16 | export async function register(page:Page,suffix:string,alias:"A"|"B"="A"):Promise<SyntheticUser>{
  17 |  await setCivilDateOnly(page,new Date("2026-10-22T09:00:00Z"));
  18 |  const person=syntheticUser(alias,`${process.env.CF_E2E_NAMESPACE}-${suffix}`);
  19 |  await registerSyntheticUser(page,person);
  20 |  return person;
  21 | }
  22 | export async function sql(page:Page,email:string,name?:string):Promise<Row>{
  23 |  const url=new URL("/snapshot",process.env.CF032_OBSERVER);url.searchParams.set("email",email);if(name)url.searchParams.set("name",name);
  24 |  const r=await page.request.get(url.toString());expect(r.ok(),await r.text()).toBe(true);return record(await r.json());
  25 | }
  26 | export async function paint(page:Page,action:Locator,name:string){
  27 |  await expect(action).toBeVisible();await action.scrollIntoViewIfNeeded();
  28 |  await expect.poll(()=>action.evaluate(element=>{
  29 |   const r=element.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);let opacity=1;
  30 |   for(let p:Element|null=element;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);
  31 |   return opacity>=0.99&&!!hit&&(hit===element||element.contains(hit));
  32 |  }),{message:`${name} must be painted and accept input`}).toBe(true);
  33 |  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  34 |  await page.screenshot({path:path.join(out,`${name}.png`),fullPage:true});
  35 |  await save(`${name}-paint`,await page.evaluate(()=>({zone:Intl.DateTimeFormat().resolvedOptions().timeZone,date:new Date().toISOString(),performance:performance.now(),timeline:document.timeline.currentTime,native:[performance.now,setTimeout,setInterval,requestAnimationFrame].map(f=>f.toString().includes("[native code]")),viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth})));
  36 | }
  37 | export async function e01(page:Page,suffix:string,existingPerson?:SyntheticUser){
  38 |  const person=existingPerson??await register(page,suffix);
  39 |  const accounts=rows(await json(page,"/accounts"));expect(accounts).toHaveLength(1);
  40 |  const categories=rows(await json(page,"/categories?type=INCOME"));expect(categories.length).toBeGreaterThan(0);
  41 |  const example=record(JSON.parse(await readFile(path.join(process.env.CF032_RUNTIME!,"e01.json"),"utf8")));
  42 |  const draft=JSON.parse(JSON.stringify(example.draft).replaceAll("00000000-0000-4000-8000-000000000901",String(accounts[0].id)).replaceAll("00000000-0000-4000-8000-000000000902",String(categories[0].id)));
  43 |  if(suffix.startsWith("temporal-")){
  44 |   const goals=rows(at(draft,"payload","sections","goals","items"));
  45 |   for(const [i,title,date] of [[0,"Prazo ontem","2026-10-21"],[1,"Prazo hoje",day],[2,"Prazo amanhã","2026-10-23"]] as const){goals[i].title=title;goals[i].deadline=date;}
  46 |  }
  47 |  const current=at(await json(page,"/onboarding"),"data","version");
  48 |  draft.expectedVersion=current;
  49 |  const r=await page.request.put("/api/onboarding/draft",{data:draft});expect(r.status(),await r.text()).toBe(200);
  50 |  await page.goto("/onboarding");await page.getByRole("button",{name:"Preparar revisão financeira"}).click();
  51 |  await expect(page.getByRole("heading",{name:"Confira antes de registrar"})).toBeVisible();
  52 |  const pending=at(await json(page,"/onboarding"),"data","pendingIntent");
  53 |  expect(at(pending,"summary","metrics","netWorth","value")).toBe("1451.00");
  54 |  expect(at(pending,"summary","metrics","freeAccountCash","value")).toBe("950.00");
  55 |  expect((await sql(page,person.email)).accountTotal).toBe("0.00");
  56 |  await page.getByRole("button",{name:"Confirmar informações e registrar posições"}).click();
  57 |  await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();
  58 |  const receipt=at(await json(page,"/onboarding"),"data","completedReceipt");
  59 |  const list=rows(await json(page,"/accounts"));
  60 |  const checking=list.find(a=>a.balance===1000);const savings=list.find(a=>a.balance===200);expect(checking).toBeTruthy();expect(savings).toBeTruthy();
  61 |  const card=rows(await json(page,"/cards"))[0];
  62 |  return {person,checking:checking!,savings:savings!,card,receipt};
  63 | }
  64 | export async function transaction(page:Page,accountId:string,type:"INCOME"|"EXPENSE"|"TRANSFER",description:string,amount:string,destination?:string){
  65 |  await page.goto("/extrato");await page.getByRole("button",{name:"Lançar",exact:true}).click();
  66 |  const modal=page.getByRole("dialog",{name:"Nova Transação",exact:true});
  67 |  await modal.getByRole("button",{name:{INCOME:"Receita",EXPENSE:"Despesa",TRANSFER:"Transferência"}[type],exact:true}).click();
  68 |  await modal.getByLabel("Valor do lançamento").fill(amount);await modal.getByLabel("Descrição do lançamento").fill(description);
  69 |  await modal.getByLabel("Data do lançamento").fill(day);await modal.getByLabel("Conta do lançamento").selectOption(accountId);
  70 |  if(type==="TRANSFER"){await modal.getByLabel("Conta destino").selectOption(destination!);await modal.getByLabel("Taxa da transferência").fill("2.00");}
  71 |  else {const cats=rows(await json(page,`/categories?type=${type}`));await modal.getByLabel("Categoria do lançamento").selectOption(String(cats[0].id));}
  72 |  const response=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/transactions"&&r.request().method()==="POST");
  73 |  await modal.getByRole("button",{name:"Salvar Transação"}).click();const saved=await response;expect(saved.status(),await saved.text()).toBe(200);await expect(modal).toHaveCount(0);
  74 |  return record(await saved.json());
  75 | }
  76 | export async function paymentForm(page:Page,card:Row,accountId:string,amount:string){
  77 |  await page.goto("/cartoes");await page.getByRole("button",{name:`Ver fatura de ${card.name}, final ${card.last4Digits}`}).click();
  78 |  const invoice=page.getByRole("dialog",{name:`${card.name} •••• ${card.last4Digits}`});
  79 |  await invoice.getByRole("button",{name:/^(Pagar|Adiantar)/}).click();
  80 |  const pay=page.getByRole("dialog",{name:`Pagar Fatura - ${card.name}`,exact:true});
  81 |  await pay.getByRole("button",{name:"Adiantamento",exact:true}).click();await pay.getByLabel("Valor do Pagamento").fill(amount);await pay.getByLabel("Pagar com").selectOption(accountId);
  82 |  return pay;
  83 | }
  84 | export async function download(page:Page,name:string){
  85 |  await page.goto("/extrato");const promise=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar período",exact:true}).click();
  86 |  const file=await promise;expect(await file.failure()).toBeNull();await file.saveAs(path.join(out,name));
  87 |  const r=await page.request.get(`${process.env.CF032_OBSERVER}/xlsx?file=${encodeURIComponent(name)}`);expect(r.ok(),await r.text()).toBe(true);return record(await r.json());
  88 | }
  89 | export async function login(page:Page,person:SyntheticUser){await page.goto("/auth");await page.locator('input[name="email"]').fill(person.email);await page.locator('input[name="senha"]').fill(person.password);await page.getByRole("button",{name:"Entrar",exact:true}).click();await expect(page).toHaveURL(/\/$/);}
  90 | export async function logout(page:Page){await page.goto("/configuracoes");await page.getByText("Sair da Conta",{exact:true}).click();await expect(page).toHaveURL(/\/auth/);expect((await page.context().cookies()).some(c=>c.name==="token")).toBe(false);}
  91 | 
```