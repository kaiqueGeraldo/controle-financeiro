# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> G resposta perdida após commit SQL, recuperação e replay de efeito único
- Location: tests\cf032\journeys.spec.ts:146:5

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByRole('dialog', { name: 'Cartão sintético •••• null' }).getByRole('button', { name: /^(Pagar|Adiantar)/ })

```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e2]:
    - complementary "Navegação principal" [ref=f2e3]:
      - generic [ref=f2e4]:
        - generic [ref=f2e5]: P
        - generic [ref=f2e6]:
          - heading "Pessoa Sintética A" [level=2] [ref=f2e7]
          - generic [ref=f2e8]: cf003-a-cf032-74b55e82-lost@example.invalid
      - navigation [ref=f2e10]:
        - link "Dashboard" [ref=f2e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f2e19] [cursor=pointer]:
          - /url: /contas
        - link "Configuração inicial" [ref=f2e24] [cursor=pointer]:
          - /url: /onboarding
        - link "Extrato" [ref=f2e30] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f2e36] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f2e41] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f2e46] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f2e53] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f2e61] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f2e68] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f2e75]:
        - button "Privacidade" [ref=f2e76] [cursor=pointer]
        - button "Configurações" [ref=f2e84] [cursor=pointer]
        - button "Sair da Conta" [ref=f2e89] [cursor=pointer]
    - main [ref=f2e95]:
      - generic [ref=f2e96]:
        - generic [ref=f2e98]:
          - generic [ref=f2e99]:
            - heading "Carteira" [level=1] [ref=f2e100]
            - paragraph [ref=f2e101]: Gestão de crédito e faturas.
          - generic [ref=f2e102]:
            - button "Lançar Compra" [ref=f2e103] [cursor=pointer]
            - button "Novo Cartão" [ref=f2e108] [cursor=pointer]
        - main [ref=f2e111]:
          - generic [ref=f2e112]:
            - generic [ref=f2e117]:
              - paragraph [ref=f2e118]: Limite Global
              - generic [ref=f2e119]: R$ 1.000,00
            - generic [ref=f2e125]:
              - paragraph [ref=f2e126]: Faturas Abertas
              - generic [ref=f2e127]: R$ 50,00
            - generic [ref=f2e133]:
              - paragraph [ref=f2e134]: Disponível
              - generic [ref=f2e135]: R$ 950,00
          - heading "Cartões Ativos" [level=2] [ref=f2e137]
          - generic [ref=f2e138]:
            - button "Ver fatura de Cartão sintético, final null":
              - generic:
                - generic:
                  - img "Logo da bandeira null"
                - generic:
                  - paragraph: ••••
                  - generic:
                    - paragraph: Cartão sintético
                    - paragraph: Vence dia 28
              - generic:
                - generic:
                  - generic:
                    - paragraph: Fatura Atual
                    - generic: R$ 50,00
                  - generic:
                    - paragraph: Disponível
                    - generic: R$ 950,00
  - alert [ref=f2e139]
  - generic [ref=f2e140]:
    - generic [ref=f2e141] [cursor=pointer]
    - dialog [ref=f2e142]:
      - generic [ref=f2e143]:
        - generic [ref=f2e144]:
          - button "Mês anterior da fatura" [ref=f2e145] [cursor=pointer]
          - generic [ref=f2e148]: novembro de 2026
          - button "Próximo mês da fatura" [ref=f2e152] [cursor=pointer]
        - button "Fechar detalhes da fatura" [active] [ref=f2e155] [cursor=pointer]
      - generic [ref=f2e160]:
        - generic [ref=f2e161]:
          - paragraph [ref=f2e162]: Cartão sintético ••••
          - paragraph [ref=f2e163]: R$ 50,00
          - paragraph [ref=f2e164]: "Consumo original · Saldo pagável: R$ 50,00 · Crédito: R$ 0,00"
          - generic [ref=f2e165]:
            - generic "Data em que as compras passam para o próximo mês" [ref=f2e166]: "Fecha: 20 de nov"
            - generic "Data limite para pagamento" [ref=f2e168]: "Vence: 28 de nov"
        - generic [ref=f2e170]: Aberta
      - generic [ref=f2e172]:
        - generic [ref=f2e178]:
          - paragraph [ref=f2e179]: Parcela futura declarada
          - paragraph [ref=f2e180]:
            - text: 09/10/2026
            - generic [ref=f2e182]: Pagamento de Fatura
          - group [ref=f2e183]:
            - generic "Horário e registro" [ref=f2e184] [cursor=pointer]
        - generic [ref=f2e185]:
          - generic [ref=f2e186]: R$ 50,00
          - generic [ref=f2e187]:
            - button [ref=f2e188] [cursor=pointer]
            - button [ref=f2e192] [cursor=pointer]
      - generic [ref=f2e196]:
        - generic [ref=f2e197]:
          - 'button "Limite: R$ 1.000,00" [ref=f2e198] [cursor=pointer]'
          - button "Excluir" [ref=f2e202] [cursor=pointer]
        - button "Adiantar Fatura" [ref=f2e206] [cursor=pointer]
```

# Test source

```ts
  1   | import {expect,type Page,type Locator} from "@playwright/test";
  2   | import {readFile,writeFile} from "node:fs/promises";
  3   | import path from "node:path";
  4   | import {syntheticUser,registerSyntheticUser,type SyntheticUser} from "../e2e/support/synthetic-auth";
  5   | import {setCivilDateOnly} from "../e2e/support/civil-date-clock";
  6   | 
  7   | export const out=process.env.CF032_EVIDENCE!;
  8   | export const day="2026-10-22";
  9   | export type Row=Record<string,unknown>;
  10  | export function record(value:unknown):Row {if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Expected object");return value as Row;}
  11  | export function rows(value:unknown):Row[]{if(!Array.isArray(value))throw new Error("Expected list");return value.map(record);}
  12  | export function at(value:unknown,...keys:string[]):unknown{return keys.reduce<unknown>((v,k)=>record(v)[k],value);}
  13  | // Chromium sends Secure cookies on trustworthy loopback origins. APIRequestContext
  14  | // has different cookie rules on HTTP; use actual browser fetch for BFF probes.
  15  | // No token is copied into Node or an evidence file.
  16  | export function request(page:Page){
  17  |  const send=async(url:string,method:string,options?:{data:unknown})=>{
  18  |   if(!url.startsWith("/api/"))throw new Error("BFF request must use this app's origin");
  19  |   const result=await page.evaluate(async({url,method,data})=>{
  20  |    const response=await fetch(url,{method,credentials:"same-origin",headers:data===undefined?undefined:{"Content-Type":"application/json"},body:data===undefined?undefined:JSON.stringify(data)});
  21  |    return {status:response.status,body:await response.text()};
  22  |   },{url,method,data:options?.data});
  23  |   return {status:()=>result.status,ok:()=>result.status>=200&&result.status<300,text:async()=>result.body,json:async():Promise<unknown>=>JSON.parse(result.body)};
  24  |  };
  25  |  return {get:(url:string)=>send(url,"GET"),post:(url:string,options?:{data:unknown})=>send(url,"POST",options),put:(url:string,options:{data:unknown})=>send(url,"PUT",options)};
  26  | }
  27  | export async function json(page:Page,url:string):Promise<unknown>{const r=await request(page).get(`/api${url}`);expect(r.ok(),`${url}: ${r.status()} ${await r.text()}`).toBe(true);return r.json();}
  28  | export async function post(page:Page,url:string,data:unknown):Promise<unknown>{const r=await request(page).post(`/api${url}`,{data});expect(r.ok(),`${url}: ${r.status()} ${await r.text()}`).toBe(true);return (await r.text())?r.json():null;}
  29  | export async function save(name:string,data:unknown){await writeFile(path.join(out,`${name}.json`),JSON.stringify(data,null,2));}
  30  | export async function register(page:Page,suffix:string,alias:"A"|"B"="A"):Promise<SyntheticUser>{
  31  |  await setCivilDateOnly(page,new Date("2026-10-22T09:00:00Z"));
  32  |  const person=syntheticUser(alias,`${process.env.CF_E2E_NAMESPACE}-${suffix}`);
  33  |  await registerSyntheticUser(page,person);
  34  |  return person;
  35  | }
  36  | export async function sql(page:Page,email:string,name?:string):Promise<Row>{
  37  |  const url=new URL("/snapshot",process.env.CF032_OBSERVER);url.searchParams.set("email",email);if(name)url.searchParams.set("name",name);
  38  |  const r=await page.request.get(url.toString());expect(r.ok(),await r.text()).toBe(true);return record(await r.json());
  39  | }
  40  | export async function paint(page:Page,action:Locator,name:string){
  41  |  await expect(action).toBeVisible();await action.scrollIntoViewIfNeeded();
  42  |  await expect.poll(()=>action.evaluate(element=>{
  43  |   const r=element.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);let opacity=1;
  44  |   for(let p:Element|null=element;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);
  45  |   return opacity>=0.99&&!!hit&&(hit===element||element.contains(hit));
  46  |  }),{message:`${name} must be painted and accept input`}).toBe(true);
  47  |  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  48  |  await page.screenshot({path:path.join(out,`${name}.png`),fullPage:true});
  49  |  await save(`${name}-paint`,await page.evaluate(()=>({zone:Intl.DateTimeFormat().resolvedOptions().timeZone,date:new Date().toISOString(),performance:performance.now(),timeline:document.timeline.currentTime,native:[performance.now,setTimeout,setInterval,requestAnimationFrame].map(f=>f.toString().includes("[native code]")),viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth})));
  50  | }
  51  | export async function e01(page:Page,suffix:string,existingPerson?:SyntheticUser){
  52  |  const person=existingPerson??await register(page,suffix);
  53  |  const accounts=rows(await json(page,"/accounts"));expect(accounts).toHaveLength(1);
  54  |  const categories=rows(await json(page,"/categories?type=INCOME"));expect(categories.length).toBeGreaterThan(0);
  55  |  const example=record(JSON.parse(await readFile(path.join(process.env.CF032_RUNTIME!,"e01.json"),"utf8")));
  56  |  const draft=JSON.parse(JSON.stringify(example.draft).replaceAll("00000000-0000-4000-8000-000000000901",String(accounts[0].id)).replaceAll("00000000-0000-4000-8000-000000000902",String(categories[0].id)));
  57  |  if(suffix.startsWith("temporal-")){
  58  |   const goals=rows(at(draft,"payload","sections","goals","items"));
  59  |   for(const [i,title,date] of [[0,"Prazo ontem","2026-10-21"],[1,"Prazo hoje",day],[2,"Prazo amanhã","2026-10-23"]] as const){goals[i].title=title;goals[i].deadline=date;}
  60  |  }
  61  |  const current=at(await json(page,"/onboarding"),"data","version");
  62  |  draft.expectedVersion=current;
  63  |  const r=await request(page).put("/api/onboarding/draft",{data:draft});expect(r.status(),await r.text()).toBe(200);
  64  |  await page.goto("/onboarding");await page.getByRole("button",{name:"Preparar revisão financeira"}).click();
  65  |  await expect(page.getByRole("heading",{name:"Confira antes de registrar"})).toBeVisible();
  66  |  const pending=at(await json(page,"/onboarding"),"data","pendingIntent");
  67  |  expect(at(pending,"summary","metrics","netWorth","value")).toBe("1451.00");
  68  |  expect(at(pending,"summary","metrics","freeAccountCash","value")).toBe("950.00");
  69  |  expect((await sql(page,person.email)).accountTotal).toBe("0.00");
  70  |  await page.getByRole("button",{name:"Confirmar informações e registrar posições"}).click();
  71  |  await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();
  72  |  const receipt=at(await json(page,"/onboarding"),"data","completedReceipt");
  73  |  const list=rows(await json(page,"/accounts"));
  74  |  const checking=list.find(a=>a.balance===1000);const savings=list.find(a=>a.balance===200);expect(checking).toBeTruthy();expect(savings).toBeTruthy();
  75  |  const card=rows(await json(page,"/cards"))[0];
  76  |  return {person,checking:checking!,savings:savings!,card,receipt};
  77  | }
  78  | export async function transaction(page:Page,accountId:string,type:"INCOME"|"EXPENSE"|"TRANSFER",description:string,amount:string,destination?:string){
  79  |  await page.goto("/extrato");await page.getByRole("button",{name:"Lançar",exact:true}).click();
  80  |  const modal=page.getByRole("dialog",{name:"Nova Transação",exact:true});
  81  |  await modal.getByRole("button",{name:{INCOME:"Receita",EXPENSE:"Despesa",TRANSFER:"Transferência"}[type],exact:true}).click();
  82  |  await modal.getByLabel("Valor do lançamento").fill(amount);await modal.getByLabel("Descrição do lançamento").fill(description);
  83  |  await modal.getByLabel("Data do lançamento").fill(day);await modal.getByLabel("Conta do lançamento").selectOption(accountId);
  84  |  if(type==="TRANSFER"){await modal.getByLabel("Conta destino").selectOption(destination!);await modal.getByLabel("Taxa da transferência").fill("2.00");}
  85  |  else {const cats=rows(await json(page,`/categories?type=${type}`));await modal.getByLabel("Categoria do lançamento").selectOption(String(cats[0].id));}
  86  |  const response=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/transactions"&&r.request().method()==="POST");
  87  |  await modal.getByRole("button",{name:"Salvar Transação"}).click();const saved=await response;expect(saved.status(),await saved.text()).toBe(200);await expect(modal).toHaveCount(0);
  88  |  return record(await saved.json());
  89  | }
  90  | export async function paymentForm(page:Page,card:Row,accountId:string,amount:string){
  91  |  await page.goto("/cartoes");await page.getByRole("button",{name:`Ver fatura de ${card.name}, final ${card.last4Digits}`}).click();
  92  |  const invoice=page.getByRole("dialog",{name:`${card.name} •••• ${card.last4Digits}`});
> 93  |  await invoice.getByRole("button",{name:/^(Pagar|Adiantar)/}).click();
      |                                                               ^ Error: locator.click: Test timeout of 120000ms exceeded.
  94  |  const pay=page.getByRole("dialog",{name:`Pagar Fatura - ${card.name}`,exact:true});
  95  |  await pay.getByRole("button",{name:"Adiantamento",exact:true}).click();await pay.getByLabel("Valor do Pagamento").fill(amount);await pay.getByLabel("Pagar com").selectOption(accountId);
  96  |  return pay;
  97  | }
  98  | export async function download(page:Page,name:string){
  99  |  await page.goto("/extrato");const promise=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar período",exact:true}).click();
  100 |  const file=await promise;expect(await file.failure()).toBeNull();await file.saveAs(path.join(out,name));
  101 |  const r=await page.request.get(`${process.env.CF032_OBSERVER}/xlsx?file=${encodeURIComponent(name)}`);expect(r.ok(),await r.text()).toBe(true);return record(await r.json());
  102 | }
  103 | export async function login(page:Page,person:SyntheticUser){await page.goto("/auth");await page.locator('input[name="email"]').fill(person.email);await page.locator('input[name="senha"]').fill(person.password);await page.getByRole("button",{name:"Entrar",exact:true}).click();await expect(page).toHaveURL(/\/$/);}
  104 | export async function logout(page:Page){await page.goto("/configuracoes");await page.getByText("Sair da Conta",{exact:true}).click();await expect(page).toHaveURL(/\/auth/);expect((await page.context().cookies()).some(c=>c.name==="token")).toBe(false);}
  105 | 
```