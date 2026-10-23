# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> R3 horário original, resposta API, releitura e XLSX
- Location: tests\cf032\journeys.spec.ts:311:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "12:34:56"
Received: "12:34"
```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - generic [ref=f2e2]:
    - complementary "Navegação principal" [ref=f2e3]:
      - generic [ref=f2e4]:
        - generic [ref=f2e5]: P
        - generic [ref=f2e6]:
          - heading "Pessoa Sintética A" [level=2] [ref=f2e7]
          - generic [ref=f2e8]: cf003-a-cf032-2d26dfd3-review-time-api@example.invalid
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
            - generic [ref=f2e101]:
              - heading "Extrato" [level=1] [ref=f2e102]
              - paragraph [ref=f2e103]: Histórico completo de movimentações.
            - generic [ref=f2e104]:
              - button "Mês anterior do extrato" [ref=f2e105] [cursor=pointer]
              - generic [ref=f2e108]: outubro de 2026
              - button "Mês seguinte do extrato" [ref=f2e109] [cursor=pointer]
            - button "Lançar" [ref=f2e112] [cursor=pointer]
          - generic [ref=f2e114]:
            - generic [ref=f2e115]:
              - button "Tudo" [ref=f2e116] [cursor=pointer]
              - button "Entradas" [ref=f2e117] [cursor=pointer]
              - button "Saídas" [ref=f2e118] [cursor=pointer]
              - button "Transferências" [ref=f2e119] [cursor=pointer]: Transf.
            - button "Todas as Contas" [ref=f2e120]
          - button "Exportar período" [ref=f2e127]
        - main [ref=f2e128]:
          - status [ref=f2e129]:
            - paragraph [ref=f2e130]: "Total do período indisponível: Período parcialmente coberto; somente valores registrados estão disponíveis."
            - paragraph [ref=f2e131]: "Base conhecida: 09/10/2026. Referência: 22/10/2026."
            - generic [ref=f2e132]:
              - paragraph [ref=f2e133]: "Subtotais observados nos registros (não representam o total completo):"
              - paragraph [ref=f2e134]:
                - text: "Entradas:"
                - generic [ref=f2e135]: R$ 1,23
              - paragraph [ref=f2e136]:
                - text: "Saídas:"
                - generic [ref=f2e137]: R$ 0,00
              - paragraph [ref=f2e138]:
                - text: "Fluxo líquido:"
                - generic [ref=f2e139]: R$ 1,23
          - generic [ref=f2e140]:
            - generic [ref=f2e146]:
              - paragraph [ref=f2e147]: Entradas de caixa realizadas
              - generic [ref=f2e148]: Indisponível
            - generic [ref=f2e154]:
              - paragraph [ref=f2e155]: Saídas de caixa realizadas
              - generic [ref=f2e156]: Indisponível
            - generic [ref=f2e162]:
              - paragraph [ref=f2e163]: Fluxo líquido do período
              - generic [ref=f2e164]: Indisponível
          - generic [ref=f2e166]:
            - heading "qui., 22 de out." [level=3] [ref=f2e167]
            - button "Ver detalhes de R3 segundos explícitos" [ref=f2e169] [cursor=pointer]:
              - generic [ref=f2e175]:
                - generic [ref=f2e176]: R3 segundos explícitos
                - generic [ref=f2e178]:
                  - generic "Horário informado" [ref=f2e183]: 12:34:56
                  - generic [ref=f2e184]: Ajuste de Saldo
                  - generic [ref=f2e185]: Realizado
                  - generic [ref=f2e187]: Corrente sintética
              - generic [ref=f2e191]: + R$ 1,23
  - alert [ref=f2e194]
```

# Test source

```ts
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
  261 | 
  262 | // Append to the runtime-only journeys.spec.ts; original tests remain unchanged.
  263 | test("R1 controle positivo de reserva conhecida e débito real com legado incerto",async({page})=>{
  264 |  const f=await e01(page,"review-known");
  265 |  const goal=record(await post(page,"/goals",{title:"Reserva independente conhecida",targetValue:600,deadline:"2027-06-30",type:"MONETARY",useChecklist:false,color:"BLUE"}));
  266 |  const before=await sql(page,f.person.email,"R1-known-before");
  267 |  const allowed=await request(page).put(`/api/goals/${goal.id}/allocations`,{data:{accountId:f.checking.id,amount:"0.01"}});
  268 |  expect(allowed.status()).toBe(204);
  269 |  const after=await sql(page,f.person.email,"R1-known-after");
  270 |  expect(after.accountTotal).toBe(before.accountTotal);expect(after.netWorth).toBe(before.netWorth);
  271 |  expect(after.reservedAccounts).toBe("350.01");
  272 |  await logout(page);
  273 |  const person=await register(page,"review-unknown-debit");
  274 |  expect((await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`)).ok()).toBe(true);
  275 |  const legacy=await sql(page,person.email,"R1-legacy-before");
  276 |  await transaction(page,String(rows(legacy.accounts)[0].id),"EXPENSE","Débito real não é nova reserva","1.00");
  277 |  const spent=await sql(page,person.email,"R1-legacy-after");
  278 |  expect(spent.accountTotal).toBe("999.00");expect(spent.legacyReservations).toEqual(legacy.legacyReservations);
  279 |  expect(rows(spent.allocations)).toHaveLength(0);
  280 | });
  281 | 
  282 | test("R2 nova sessão do cartão e seleção das duas posições sem ticker",async({page})=>{
  283 |  const f=await e01(page,"review-session");
  284 |  await logout(page);await login(page,f.person);await page.goto("/cartoes");
  285 |  const card=rows(await json(page,"/cards"))[0];
  286 |  const available=page.getByText("Disponível",{exact:true}).first().locator("..");
  287 |  await paint(page,available,"R2-card-session");
  288 |  await save("R2-card-session",{card,visible:await available.innerText()});
  289 |  await expect.soft(available).toContainText("656,00");
  290 |  const positions=rows(await json(page,"/investments"));
  291 |  expect(positions).toHaveLength(2);expect(positions.every(p=>p.ticker===null)).toBe(true);
  292 |  const visits:unknown[]=[];
  293 |  for(let index=0;index<2;index++){
  294 |   await page.goto("/investimentos");
  295 |   const buttons=page.getByRole("button",{name:"Ver detalhes do investimento null",exact:true});
  296 |   await expect(buttons).toHaveCount(2);
  297 |   const history=page.waitForResponse(r=>/\/api\/investments\/[^/]+\/history$/.test(new URL(r.url()).pathname));
  298 |   await buttons.nth(index).click();const response=await history;
  299 |   expect(response.status()).toBe(200);
  300 |   const id=new URL(response.url()).pathname.split("/")[3];
  301 |   expect(positions.some(p=>p.id===id)).toBe(true);
  302 |   const dialog=page.getByRole("dialog",{name:"Detalhes do investimento null",exact:true});
  303 |   await expect(dialog).toBeVisible();
  304 |   visits.push({id,name:positions.find(p=>p.id===id)?.name,dialog:await dialog.innerText()});
  305 |  }
  306 |  expect(new Set(visits.map(v=>record(v).id)).size).toBe(2);
  307 |  await save("R2-selection",{positions,visits,sql:await sql(page,f.person.email,"R2-selection")});
  308 | });
  309 | 
  310 | // Runtime-only independent probe: establish API versus export precision directly.
  311 | test("R3 horário original, resposta API, releitura e XLSX",async({page})=>{
  312 |  const f=await e01(page,"review-time-api");
  313 |  const category=rows(await json(page,"/categories?type=INCOME"))[0];
  314 |  const input={description:"R3 segundos explícitos",amount:1.23,date:day,time:"12:34:56",type:"INCOME",accountId:f.checking.id,categoryId:category.id,isPaid:true,operationId:randomUUID()};
  315 |  const response=await post(page,"/transactions",input);
  316 |  const list=await json(page,"/transactions?month=10&year=2026&size=100");
  317 |  const line=rows(at(list,"content")).find(t=>t.description===input.description);
  318 |  await save("R3-api",{input,response,line});
  319 |  expect(line?.time).toBe("12:34:56");
  320 |  const state=await sql(page,f.person.email,"R3-time");
  321 |  expect(rows(state.transactions).find(t=>t.description===input.description)?.time).toBe("12:34:56");
  322 |  const book=await download(page,"R3-time.xlsx");
  323 |  const lineExport=(book["Extrato Financeiro"] as unknown[][]).find(row=>row[2]===input.description);
> 324 |  expect(lineExport?.[1]).toBe("12:34:56");
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  325 | });
  326 | 
```