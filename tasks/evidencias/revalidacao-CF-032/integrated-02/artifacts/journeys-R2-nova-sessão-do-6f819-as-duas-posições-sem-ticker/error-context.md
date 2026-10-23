# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> R2 nova sessão do cartão e seleção das duas posições sem ticker
- Location: tests\cf032\journeys.spec.ts:281:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('button', { name: 'Ver detalhes do investimento null', exact: true })
Expected: 2
Received: 0
Timeout:  12000ms

Call log:
  - Expect "toHaveCount" getByRole('button', { name: 'Ver detalhes do investimento null', exact: true }) with timeout 12000ms
  - waiting for getByRole('button', { name: 'Ver detalhes do investimento null', exact: true })
    27 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [active] [ref=f5e1]:
  - generic [ref=f5e2]:
    - complementary "Navegação principal" [ref=f5e3]:
      - generic [ref=f5e4]:
        - generic [ref=f5e5]: P
        - generic [ref=f5e6]:
          - heading "Pessoa Sintética A" [level=2] [ref=f5e7]
          - generic [ref=f5e8]: cf003-a-cf032-4c89f0bf-review-session@example.invalid
      - navigation [ref=f5e10]:
        - link "Dashboard" [ref=f5e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f5e19] [cursor=pointer]:
          - /url: /contas
        - link "Configuração inicial" [ref=f5e24] [cursor=pointer]:
          - /url: /onboarding
        - link "Extrato" [ref=f5e30] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f5e36] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f5e41] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f5e46] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f5e53] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f5e61] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f5e68] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f5e75]:
        - button "Privacidade" [ref=f5e76] [cursor=pointer]
        - button "Configurações" [ref=f5e84] [cursor=pointer]
        - button "Sair da Conta" [ref=f5e89] [cursor=pointer]
    - main [ref=f5e95]:
      - generic [ref=f5e96]:
        - generic [ref=f5e98]:
          - generic [ref=f5e99]:
            - heading "Investimentos" [level=1] [ref=f5e100]
            - paragraph [ref=f5e101]: Acompanhe a evolução do seu patrimônio.
          - button "Novo Ativo" [ref=f5e102] [cursor=pointer]
        - main [ref=f5e105]:
          - generic [ref=f5e106]:
            - generic [ref=f5e107]:
              - generic [ref=f5e108]: Investimentos avaliados
              - generic [ref=f5e114]: R$ 501,00
            - generic [ref=f5e115]:
              - generic [ref=f5e116]: Rentabilidade Geral
              - generic [ref=f5e124]:
                - text: Indisponível
                - generic [ref=f5e125]: Custo ou avaliação indisponível
          - heading "Sua Carteira" [level=2] [ref=f5e127]
          - generic [ref=f5e128]:
            - button "Ver detalhes do investimento Renda fixa sintética" [ref=f5e130] [cursor=pointer]:
              - generic [ref=f5e137]:
                - heading "Renda fixa sintética" [level=3] [ref=f5e138]
                - text: Renda Fixa
              - generic [ref=f5e139]: R$ 500,00
              - generic [ref=f5e141]:
                - generic [ref=f5e142]: Alocação
                - generic [ref=f5e143]: 100%
            - button "Ver detalhes do investimento Ação sintética" [ref=f5e148] [cursor=pointer]:
              - generic [ref=f5e154]:
                - heading "Ação sintética" [level=3] [ref=f5e155]
                - text: Ação
              - generic [ref=f5e156]:
                - generic [ref=f5e157]: R$ 1,00
                - generic [ref=f5e160]:
                  - text: 66.67%
                  - generic [ref=f5e164]: (+R$ 0,40)
              - generic [ref=f5e165]:
                - generic [ref=f5e166]: Alocação
                - generic [ref=f5e167]: 0%
  - alert [ref=f5e171]
```

# Test source

```ts
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
  238 |  await expect(page.getByText("Ação sintética",{exact:true}),"SPEC-001 allows missing identifier; position name must still identify it").toBeVisible();
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
  261 | // Append to the runtime-only journeys.spec.ts; original tests remain unchanged.
  262 | test("R1 controle positivo de reserva conhecida e débito real com legado incerto",async({page})=>{
  263 |  const f=await e01(page,"review-known");
  264 |  const goal=record(await post(page,"/goals",{title:"Reserva independente conhecida",targetValue:600,deadline:"2027-06-30",type:"MONETARY",useChecklist:false,color:"BLUE"}));
  265 |  const before=await sql(page,f.person.email,"R1-known-before");
  266 |  const allowed=await request(page).put(`/api/goals/${goal.id}/allocations`,{data:{accountId:f.checking.id,amount:"0.01"}});
  267 |  expect(allowed.status()).toBe(204);
  268 |  const after=await sql(page,f.person.email,"R1-known-after");
  269 |  expect(after.accountTotal).toBe(before.accountTotal);expect(after.netWorth).toBe(before.netWorth);
  270 |  expect(after.reservedAccounts).toBe("350.01");
  271 |  await logout(page);
  272 |  const person=await register(page,"review-unknown-debit");
  273 |  expect((await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`)).ok()).toBe(true);
  274 |  const legacy=await sql(page,person.email,"R1-legacy-before");
  275 |  await transaction(page,String(rows(legacy.accounts)[0].id),"EXPENSE","Débito real não é nova reserva","1.00");
  276 |  const spent=await sql(page,person.email,"R1-legacy-after");
  277 |  expect(spent.accountTotal).toBe("999.00");expect(spent.legacyReservations).toEqual(legacy.legacyReservations);
  278 |  expect(rows(spent.allocations)).toHaveLength(0);
  279 | });
  280 | 
  281 | test("R2 nova sessão do cartão e seleção das duas posições sem ticker",async({page})=>{
  282 |  const f=await e01(page,"review-session");
  283 |  await logout(page);await login(page,f.person);await page.goto("/cartoes");
  284 |  const card=rows(await json(page,"/cards"))[0];
  285 |  const available=page.getByText("Disponível",{exact:true}).first().locator("..");
  286 |  await paint(page,available,"R2-card-session");
  287 |  await save("R2-card-session",{card,visible:await available.innerText()});
  288 |  await expect.soft(available).toContainText("656,00");
  289 |  const positions=rows(await json(page,"/investments"));
  290 |  expect(positions).toHaveLength(2);expect(positions.every(p=>p.ticker===null)).toBe(true);
  291 |  const visits:unknown[]=[];
  292 |  for(let index=0;index<2;index++){
  293 |   await page.goto("/investimentos");
  294 |   const buttons=page.getByRole("button",{name:"Ver detalhes do investimento null",exact:true});
> 295 |   await expect(buttons).toHaveCount(2);
      |                         ^ Error: expect(locator).toHaveCount(expected) failed
  296 |   const history=page.waitForResponse(r=>/\/api\/investments\/[^/]+\/history$/.test(new URL(r.url()).pathname));
  297 |   await buttons.nth(index).click();const response=await history;
  298 |   expect(response.status()).toBe(200);
  299 |   const id=new URL(response.url()).pathname.split("/")[3];
  300 |   expect(positions.some(p=>p.id===id)).toBe(true);
  301 |   const dialog=page.getByRole("dialog",{name:"Detalhes do investimento null",exact:true});
  302 |   await expect(dialog).toBeVisible();
  303 |   visits.push({id,name:positions.find(p=>p.id===id)?.name,dialog:await dialog.innerText()});
  304 |  }
  305 |  expect(new Set(visits.map(v=>record(v).id)).size).toBe(2);
  306 |  await save("R2-selection",{positions,visits,sql:await sql(page,f.person.email,"R2-selection")});
  307 | });
  308 | 
  309 | // Runtime-only independent probe: establish API versus export precision directly.
  310 | test("R3 horário original, resposta API, releitura e XLSX",async({page})=>{
  311 |  const f=await e01(page,"review-time-api");
  312 |  const category=rows(await json(page,"/categories?type=INCOME"))[0];
  313 |  const input={description:"R3 segundos explícitos",amount:1.23,date:day,time:"12:34:56",type:"INCOME",accountId:f.checking.id,categoryId:category.id,isPaid:true,operationId:randomUUID()};
  314 |  const response=await post(page,"/transactions",input);
  315 |  const list=await json(page,"/transactions?month=10&year=2026&size=100");
  316 |  const line=rows(at(list,"content")).find(t=>t.description===input.description);
  317 |  await save("R3-api",{input,response,line});
  318 |  expect(line?.time).toBe("12:34:56");
  319 |  const state=await sql(page,f.person.email,"R3-time");
  320 |  expect(rows(state.transactions).find(t=>t.description===input.description)?.time).toBe("12:34:56");
  321 |  const book=await download(page,"R3-time.xlsx");
  322 |  const lineExport=(book["Extrato Financeiro"] as unknown[][]).find(row=>row[2]===input.description);
  323 |  expect(lineExport?.[1]).toBe("12:34:56");
  324 | });
  325 | 
  326 | import { registerRemediationProbes } from "./remediation.probes"; registerRemediationProbes();
  327 | 
```