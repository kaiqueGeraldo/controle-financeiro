# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> B uso diário pela UI, reconciliação, reload e logout/login
- Location: tests\cf032\journeys.spec.ts:92:5

# Error details

```
Error: {"timestamp":"2026-10-22T22:57:21.128936200Z","status":400,"error":"Regra de Negócio","message":"O pagamento excede o saldo devido de 90.00.","path":"/cards/17af053e-75fc-4544-9504-f7199a1c7cc8/pay","fields":{}}

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=f6e1]:
  - generic [ref=f6e2]:
    - complementary "Navegação principal" [ref=f6e3]:
      - generic [ref=f6e4]:
        - generic [ref=f6e5]: P
        - generic [ref=f6e6]:
          - heading "Pessoa Sintética A" [level=2] [ref=f6e7]
          - generic [ref=f6e8]: cf003-a-cf032-9eab2cbb-b@example.invalid
      - navigation [ref=f6e10]:
        - link "Dashboard" [ref=f6e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f6e19] [cursor=pointer]:
          - /url: /contas
        - link "Configuração inicial" [ref=f6e24] [cursor=pointer]:
          - /url: /onboarding
        - link "Extrato" [ref=f6e30] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f6e36] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f6e41] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f6e46] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f6e53] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f6e61] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f6e68] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f6e75]:
        - button "Privacidade" [ref=f6e76] [cursor=pointer]
        - button "Configurações" [ref=f6e84] [cursor=pointer]
        - button "Sair da Conta" [ref=f6e89] [cursor=pointer]
    - main [ref=f6e95]:
      - generic [ref=f6e96]:
        - generic [ref=f6e98]:
          - generic [ref=f6e99]:
            - heading "Carteira" [level=1] [ref=f6e100]
            - paragraph [ref=f6e101]: Gestão de crédito e faturas.
          - generic [ref=f6e102]:
            - button "Lançar Compra" [ref=f6e103] [cursor=pointer]
            - button "Novo Cartão" [ref=f6e108] [cursor=pointer]
        - main [ref=f6e111]:
          - generic [ref=f6e112]:
            - generic [ref=f6e117]:
              - paragraph [ref=f6e118]: Limite Global
              - generic [ref=f6e119]: R$ 1.000,00
            - generic [ref=f6e125]:
              - paragraph [ref=f6e126]: Faturas Abertas
              - generic [ref=f6e127]: R$ 90,00
            - generic [ref=f6e133]:
              - paragraph [ref=f6e134]: Disponível
              - generic [ref=f6e135]: R$ 910,00
          - heading "Cartões Ativos" [level=2] [ref=f6e137]
          - button "Ver fatura de Cartão sintético, final null" [ref=f6e139] [cursor=pointer]:
            - generic [ref=f6e140]:
              - img "Logo da bandeira null" [ref=f6e142]
              - generic [ref=f6e151]:
                - paragraph [ref=f6e152]: ••••
                - generic [ref=f6e153]:
                  - paragraph [ref=f6e154]: Cartão sintético
                  - paragraph [ref=f6e155]: Vence dia 28
            - generic [ref=f6e157]:
              - generic [ref=f6e158]:
                - paragraph [ref=f6e159]: Fatura Atual
                - generic [ref=f6e160]: R$ 90,00
              - generic [ref=f6e161]:
                - paragraph [ref=f6e162]: Disponível
                - generic [ref=f6e163]: R$ 910,00
  - alert [ref=f6e166]
  - generic [ref=f6e167]:
    - generic [ref=f6e168] [cursor=pointer]
    - dialog [ref=f6e169]:
      - generic [ref=f6e170]:
        - generic [ref=f6e171]:
          - button "Mês anterior da fatura" [ref=f6e172] [cursor=pointer]
          - generic [ref=f6e175]: novembro de 2026
          - button "Próximo mês da fatura" [ref=f6e179] [cursor=pointer]
        - button "Fechar detalhes da fatura" [ref=f6e182] [cursor=pointer]
      - generic [ref=f6e187]:
        - generic [ref=f6e188]:
          - paragraph [ref=f6e189]: Cartão sintético ••••
          - paragraph [ref=f6e190]: R$ 90,00
          - paragraph [ref=f6e191]: "Consumo original · Saldo pagável: R$ 90,00 · Crédito: R$ 0,00"
          - generic [ref=f6e192]:
            - generic "Data em que as compras passam para o próximo mês" [ref=f6e193]: "Fecha: 20 de nov"
            - generic "Data limite para pagamento" [ref=f6e195]: "Vence: 28 de nov"
        - generic [ref=f6e197]: Aberta
      - generic [ref=f6e198]:
        - generic [ref=f6e199]:
          - generic [ref=f6e205]:
            - paragraph [ref=f6e206]: CF032 compra parcelada (2/3)
            - paragraph [ref=f6e207]:
              - text: 15/10/2026
              - generic [ref=f6e209]: Alimentação
            - group [ref=f6e210]:
              - generic "Horário e registro" [ref=f6e211] [cursor=pointer]
          - generic [ref=f6e212]:
            - generic [ref=f6e213]: R$ 40,00
            - generic [ref=f6e214]:
              - button [ref=f6e215] [cursor=pointer]
              - button [ref=f6e219] [cursor=pointer]
        - generic [ref=f6e223]:
          - generic [ref=f6e229]:
            - paragraph [ref=f6e230]: Parcela futura declarada
            - paragraph [ref=f6e231]:
              - text: 09/10/2026
              - generic [ref=f6e233]: Pagamento de Fatura
            - group [ref=f6e234]:
              - generic "Horário e registro" [ref=f6e235] [cursor=pointer]
          - generic [ref=f6e236]:
            - generic [ref=f6e237]: R$ 50,00
            - generic [ref=f6e238]:
              - button [ref=f6e239] [cursor=pointer]
              - button [ref=f6e243] [cursor=pointer]
      - generic [ref=f6e247]:
        - generic [ref=f6e248]:
          - 'button "Limite: R$ 1.000,00" [ref=f6e249] [cursor=pointer]'
          - button "Excluir" [ref=f6e253] [cursor=pointer]
        - button "Adiantar Fatura" [ref=f6e257] [cursor=pointer]
  - dialog [ref=f6e262]:
    - generic [ref=f6e263]:
      - heading "Pagar Fatura - Cartão sintético" [level=2] [ref=f6e264]
      - button "Fechar modal" [ref=f6e265]
    - generic [ref=f6e270]:
      - paragraph [ref=f6e271]: "Saldo pagável: R$ 90,00 · Consumo original: R$ 90,00 · Crédito no cartão: R$ 0,00"
      - group [ref=f6e272]:
        - generic [ref=f6e273]:
          - button "Fechamento" [ref=f6e274]
          - button "Adiantamento" [ref=f6e275]
        - generic [ref=f6e276]:
          - text: Pagar com
          - combobox "Pagar com" [ref=f6e281] [cursor=pointer]:
            - 'option "Carteira Física (Saldo: R$ 100.00)"'
            - 'option "Corrente sintética (Saldo: R$ 1107.90)" [selected]'
            - 'option "Poupança sintética (Saldo: R$ 300.00)"'
        - generic [ref=f6e282]:
          - text: Valor do Pagamento
          - spinbutton "Valor do Pagamento" [ref=f6e286]: "200.00"
        - alert [ref=f6e287]:
          - paragraph [ref=f6e290]: "Pagamento recusado: O pagamento excede o saldo devido de 90.00."
        - generic [ref=f6e291]:
          - generic [ref=f6e292]:
            - text: Data do Pagamento
            - textbox "Data do Pagamento" [ref=f6e293]: 2026-10-22
          - generic [ref=f6e294]:
            - text: Hora
            - textbox "Horário informado (opcional)" [ref=f6e295]: 06:00
      - button "Confirmar Pagamento" [ref=f6e296] [cursor=pointer]
```

# Test source

```ts
  1   | import {test,expect,type Page} from "@playwright/test";
  2   | import {randomUUID} from "node:crypto";
  3   | import {day,record,rows,at,json,post,save,register,sql,paint,e01,transaction,paymentForm,download,login,logout,request} from "./support";
  4   | 
  5   | const network=new Map<string,unknown[]>();
  6   | test.beforeEach(async({page},info)=>{
  7   |  const events:unknown[]=[];network.set(info.title,events);
  8   |  page.on("request",r=>{if(new URL(r.url()).pathname.startsWith("/api/"))events.push({event:"request",method:r.method(),path:new URL(r.url()).pathname,at:Date.now()});});
  9   |  page.on("response",r=>{if(new URL(r.url()).pathname.startsWith("/api/"))events.push({event:"response",status:r.status(),path:new URL(r.url()).pathname,at:Date.now()});});
  10  |  page.on("pageerror",e=>events.push({event:"pageerror",message:e.message}));
  11  | });
  12  | test.afterEach(async({page},info)=>{
  13  |  const name=info.title.match(/^[A-Z][0-9]?/)?.[0]??"test";
  14  |  await save(`${name}-result`,{title:info.title,status:info.status,expectedStatus:info.expectedStatus,errors:info.errors.map(e=>e.message),browser:page.context().browser()?.version()});
  15  |  await save(`${name}-network`,network.get(info.title));
  16  |  if(info.status!==info.expectedStatus&&!page.isClosed())await save(`${name}-failure-dom`,{text:await page.locator("body").innerText()});
  17  | });
  18  | 
  19  | async function financial(page:Page,email:string,name:string,accounts:string,debt:string){
  20  |  const state=await sql(page,email,name);expect(state.accountTotal,`${name} account balances in SQL`).toBe(accounts);expect(state.debt,`${name} unpaid debt in SQL`).toBe(debt);return state;
  21  | }
  22  | 
  23  | test("A cadastro, rascunho, aplicação E01, recibo e releitura",async({page})=>{
  24  |  const person=await register(page,"a");await page.goto("/onboarding");
  25  |  const auxiliaryStatus=(await page.request.get("/api/accounts")).status();const browserStatus=(await request(page).get("/api/accounts")).status();
  26  |  await save("A-cookie-transport",{auxiliaryStatus,browserStatus,cookies:(await page.context().cookies()).map(({name,secure,httpOnly,sameSite,domain,path})=>({name,secure,httpOnly,sameSite,domain,path}))});
  27  |  expect(browserStatus).toBe(200);
  28  |  await page.getByLabel("Nome preferido (opcional)").fill("CF032 rascunho persistido");
  29  |  await page.getByLabel("Confirmo que os saldos não incluem movimentos que registrarei novamente").check();
  30  |  await page.getByLabel("Confirmo que o caixa da corretora não inclui o valor dos ativos aplicados").check();
  31  |  await page.getByRole("button",{name:"Salvar rascunho",exact:true}).click();
  32  |  await expect(page.getByRole("status").filter({hasText:"Últimas respostas confirmadas"})).toBeVisible();
  33  |  await page.reload();await expect(page.getByLabel("Nome preferido (opcional)")).toHaveValue("CF032 rascunho persistido");
  34  |  expect((await sql(page,person.email,"A-draft")).applications).toBe(0);
  35  |  const fixture=await e01(page,"a",person);const state=await financial(page,person.email,"A-applied","1300.00","350.00");
  36  |  expect(state.netWorth).toBe("1451.00");expect(state.investmentTotal).toBe("501.00");
  37  |  expect(state.applications).toBe(16);expect(rows(state.receipts).filter(r=>r.kind==="ONBOARDING_COMPLETE")).toHaveLength(1);
  38  |  expect(rows(state.transactions)).toHaveLength(1);expect(rows(state.transactions)[0]).toMatchObject({is_paid:false,amount:"80.00"});
  39  |  expect(at(fixture.receipt,"summary","metrics","reservedAccounts","value")).toBe("350.00");
  40  |  expect(at(fixture.receipt,"summary","metrics","reservedInvestments","value")).toBe("200.00");
  41  |  expect(rows(state.investments).find(i=>i.position_mode==="MONETARY")).toMatchObject({quantity:null,total_cost:null,valuation_amount:"500.00",acquisition_date:null,historical_source:null});
  42  |  await page.reload();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();
  43  |  expect(at(await json(page,"/onboarding"),"data","completedReceipt")).toEqual(fixture.receipt);
  44  |  await paint(page,page.getByRole("heading",{name:"Entrevista concluída",exact:true}),"A-completed");
  45  |  await save("A-api-receipt",fixture.receipt);
  46  | });
  47  | 
  48  | async function daily(page:Page,suffix:string,ui:boolean){
  49  |  const f=await e01(page,suffix);const a=String(f.checking.id),b=String(f.savings.id),email=f.person.email;
  50  |  if(ui){await transaction(page,a,"INCOME","CF032 receita","250.10");await transaction(page,a,"EXPENSE","CF032 despesa","40.20");await transaction(page,a,"TRANSFER","CF032 transferência","100.00",b);}
  51  |  else {
  52  |   const inc=rows(await json(page,"/categories?type=INCOME"))[0],exp=rows(await json(page,"/categories?type=EXPENSE"))[0];
  53  |   await post(page,"/transactions",{description:"CF032 receita",amount:250.10,date:day,time:"12:34:56",type:"INCOME",accountId:a,categoryId:inc.id,isPaid:true,operationId:randomUUID()});
  54  |   await post(page,"/transactions",{description:"CF032 despesa",amount:40.20,date:day,type:"EXPENSE",accountId:a,categoryId:exp.id,isPaid:true,operationId:randomUUID()});
  55  |   await post(page,"/transactions",{description:"CF032 transferência",amount:100,date:day,type:"TRANSFER",accountId:a,destinationAccountId:b,isPaid:true,fee:2,operationId:randomUUID()});
  56  |  }
  57  |  await financial(page,email,`${suffix}-cash`,"1507.90","350.00");
  58  |  const cats=rows(await json(page,"/categories?type=EXPENSE"));
  59  |  if(ui){
  60  |   await page.goto("/cartoes");await page.getByTitle("Lançar Compra",{exact:true}).click();const modal=page.getByRole("dialog",{name:"Nova Despesa no Crédito"});
  61  |   await modal.getByPlaceholder("0,00").fill("120.00");await modal.getByPlaceholder("Ex: Uber, Amazon, Jantar...").fill("CF032 compra parcelada");
  62  |   await modal.locator('input[type="date"]').fill("2026-10-15");await modal.locator("select").nth(0).selectOption(String(f.card.id));await modal.locator("select").nth(1).selectOption(String(cats[0].id));await modal.locator("select").nth(2).selectOption("3");
  63  |   const response=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/cards/transaction"&&r.request().method()==="POST");
  64  |   await modal.getByRole("button",{name:/Salvar|Lançar|Confirmar/}).click();const result=await response;expect(result.ok(),await result.text()).toBe(true);await expect(modal).toHaveCount(0);
  65  |  }else await post(page,"/cards/transaction",{cardId:f.card.id,categoryId:cats[0].id,description:"CF032 compra parcelada",amount:120,date:"2026-10-15",time:null,totalInstallments:3});
  66  |  await financial(page,email,`${suffix}-purchase`,"1507.90","470.00");
  67  |  const pay=await paymentForm(page,f.card,a,"200.00");const paid=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/cards/${f.card.id}/pay`&&r.request().method()==="POST");
> 68  |  await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();const paidResponse=await paid;expect(paidResponse.ok(),await paidResponse.text()).toBe(true);await expect(pay).toHaveCount(0);
      |                                                                                                                                                       ^ Error: {"timestamp":"2026-10-22T22:57:21.128936200Z","status":400,"error":"Regra de Negócio","message":"O pagamento excede o saldo devido de 90.00.","path":"/cards/17af053e-75fc-4544-9504-f7199a1c7cc8/pay","fields":{}}
  69  |  await financial(page,email,`${suffix}-payment`,"1307.90","270.00");
  70  |  const stock=rows(await json(page,"/investments")).find(i=>i.type==="STOCK");expect(stock).toBeTruthy();
  71  |  if(ui){
  72  |   await page.goto("/investimentos");await page.getByText(String(stock!.name),{exact:true}).click();await page.getByRole("button",{name:"Aportar",exact:true}).click();
  73  |   const modal=page.getByRole("dialog",{name:`${stock!.ticker} - Operação`,exact:true});await modal.getByPlaceholder("0",{exact:true}).fill("2");await modal.getByPlaceholder("0,00",{exact:true}).fill("10");await modal.getByLabel("Taxas / retenções").fill("1");await modal.getByLabel("Conta",{exact:true}).selectOption(a);
  74  |   await paint(page,modal.getByRole("button",{name:"Confirmar Operação",exact:true}),"B-stock-operation");
  75  |   const op=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/investments/operation"&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar Operação",exact:true}).click();const applied=await op;expect(applied.ok(),await applied.text()).toBe(true);await expect(modal).toHaveCount(0);
  76  |  }else await post(page,"/investments/operation",{investmentId:stock!.id,type:"BUY",quantity:2,price:10,fees:1,date:day,accountId:a,operationId:randomUUID()});
  77  |  const goals=rows(await json(page,"/goals"));const trip=goals.find(g=>g.currentValue===500);expect(trip).toBeTruthy();
  78  |  if(ui){
  79  |   await page.goto("/metas");await page.getByRole("button",{name:`Ver detalhes da meta ${trip!.title}`}).click();await page.getByRole("button",{name:"Aporte Avulso",exact:true}).click();
  80  |   const modal=page.getByRole("dialog",{name:"Guardar Dinheiro",exact:true});await modal.getByPlaceholder("0",{exact:true}).fill("100");await modal.locator("select").selectOption(a);
  81  |   const deposited=page.waitForResponse(r=>r.url().includes(`/goals/${trip!.id}/deposit`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar Aporte",exact:true}).click();const response=await deposited;expect(response.ok(),await response.text()).toBe(true);await expect(modal).toHaveCount(0);
  82  |  }else {const r=await request(page).put(`/api/goals/${trip!.id}/allocations`,{data:{accountId:a,amount:"400.00"}});expect(r.status(),await r.text()).toBe(204);}
  83  |  const final=await financial(page,email,`${suffix}-final`,"1286.90","270.00");
  84  |  expect(final.netWorth).toBe("1518.57");expect(final.investmentTotal).toBe("501.67");expect(final.reservedAccounts).toBe("450.00");expect(final.reservedInvestments).toBe("200.00");
  85  |  expect(rows(final.investments).find(i=>i.type==="STOCK"||i.ticker===stock!.ticker)).toMatchObject({quantity:"5.00000000",total_cost:"21.60",valuation_amount:"1.67"});
  86  |  expect(rows(final.allocations).find(r=>r.account_id===a)).toMatchObject({amount:"400.00"});
  87  |  expect(rows(final.accounts).find(r=>r.id===a)).toMatchObject({balance:"886.90"});
  88  |  await save(`${suffix}-api`,{accounts:await json(page,"/accounts/position"),cards:await json(page,"/cards"),annual:await json(page,"/annual-summary?year=2026"),cash:await json(page,"/transactions/summary?month=10&year=2026")});
  89  |  return f;
  90  | }
  91  | 
  92  | test("B uso diário pela UI, reconciliação, reload e logout/login",async({page})=>{
  93  |  const f=await daily(page,"B",true);await page.goto("/contas");await page.reload();await expect(page.getByText("Corrente sintética",{exact:true}).first()).toBeVisible();
  94  |  await paint(page,page.getByText("Corrente sintética",{exact:true}).first(),"B-accounts");
  95  |  const before=await sql(page,f.person.email);await logout(page);await login(page,f.person);await page.goto("/extrato");await page.reload();
  96  |  await expect(page.getByText("CF032 receita",{exact:true})).toBeVisible();expect(await sql(page,f.person.email,"B-new-session")).toEqual(before);
  97  |  expect(at(await json(page,"/onboarding"),"data","completedReceipt")).toEqual(f.receipt);
  98  |  await paint(page,page.getByText("CF032 receita",{exact:true}),"B-new-session");
  99  | });
  100 | 
  101 | test("C relatório e XLSX real com datas, origens, estados e totais independentes",async({page})=>{
  102 |  const f=await daily(page,"C",false);
  103 |  await page.goto("/resumo-anual");await expect(page.getByRole("heading",{name:"Posição atual de investimentos",exact:true})).toBeVisible();
  104 |  await paint(page,page.getByRole("heading",{name:"Posição atual de investimentos",exact:true}),"C-annual");
  105 |  const annual=await json(page,"/annual-summary?year=2026");await save("C-annual-api",annual);
  106 |  expect(at(annual,"balance","observed","income")).toBe("250.10");expect(at(annual,"balance","observed","expense")).toBe("162.20");expect(at(annual,"balance","observed","balance")).toBe("87.90");
  107 |  expect(at(annual,"investments","totalCost")).toBeNull();expect(at(annual,"investments","totalValue")).toBe(501.67);
  108 |  const cash=await json(page,"/transactions/summary?month=10&year=2026");
  109 |  expect(Number(at(cash,"observed","balance"))).toBe(-13.10);expect(at(cash,"coverage","state")).toBe("PARTIAL");
  110 |  const book=await download(page,"C-october.xlsx");const all=JSON.stringify(book);
  111 |  expect(all).toContain("250.10");expect(all).toContain("162.20");expect(all).toContain("87.90");
  112 |  expect(JSON.stringify(book["Cobertura"])).toContain("PARTIAL");expect(all).toContain("22/10/2026");expect(all).toContain("15/10/2026");
  113 |  const extract=book["Extrato Financeiro"];expect(Array.isArray(extract)).toBe(true);
  114 |  const lines=extract as unknown[][];
  115 |  expect(lines.find(r=>r[2]==="CF032 receita")?.slice(0,3)).toEqual(["22/10/2026","12:34:56","CF032 receita"]);
  116 |  expect(lines.filter(r=>r[2]==="CF032 receita")).toHaveLength(1);
  117 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[6]).toBe("250.1");
  118 |  expect(lines.find(r=>r[2]==="CF032 despesa")?.[6]).toBe("40.2");
  119 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[7]).toBe("SETTLED");
  120 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[8]).toBe("USER");
  121 |  const purchases=book["Consumo cartão"];expect(Array.isArray(purchases)).toBe(true);expect(JSON.stringify(purchases)).toContain("120.0");
  122 |  // A distinct period cannot acquire October flows; the current position remains dated.
  123 |  const older=await json(page,"/annual-summary?year=2025");await save("C-previous-year-api",older);
  124 |  expect(at(older,"investments","valuationAsOf")).toBe(day);
  125 |  await financial(page,f.person.email,"C-exported","1286.90","270.00");
  126 | });
  127 | 
  128 | test("E legado conserva proveniência, UNKNOWN e complemento sem histórico fictício",async({page})=>{
  129 |  const person=await register(page,"legacy");const seeded=await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`);expect(seeded.ok(),await seeded.text()).toBe(true);
  130 |  const before=await sql(page,person.email,"E-before");const account=rows(before.accounts)[0];
  131 |  await page.goto("/onboarding");await expect(page.getByRole("heading",{name:"Organize seu ponto de partida"})).toBeVisible();
  132 |  const sections:Record<string,{answer:string;items:unknown[]}>=Object.fromEntries(["accounts","cards","investments","goals","allocations","forecasts"].map(k=>[k,{answer:"NONE",items:[]}]));
  133 |  sections.accounts={answer:"PROVIDED",items:[{tempId:randomUUID(),action:"LINK",ref:{kind:"ACCOUNT",id:account.id}}]};
  134 |  const payload={context:{currency:"BRL",baseDate:day,boundaryAcknowledged:true,cashOnlyAcknowledged:true},currentStep:"REVIEW",sections};
  135 |  const saved=await request(page).put("/api/onboarding/draft",{data:{contractVersion:1,expectedVersion:"0",action:"SAVE",payload}});expect(saved.status(),await saved.text()).toBe(200);
  136 |  await page.reload();await page.getByRole("button",{name:"Preparar revisão financeira"}).click();await expect(page.getByRole("heading",{name:"Confira antes de registrar"})).toBeVisible();
  137 |  const pending=at(await json(page,"/onboarding"),"data","pendingIntent");
  138 |  expect(at(pending,"summary","metrics","netWorth","value")).toBe("1000.00");expect(at(pending,"summary","metrics","freeAccountCash","state")).toBe("UNKNOWN");expect(at(pending,"summary","metrics","reservedAccounts","value")).toBeNull();
  139 |  await paint(page,page.getByRole("heading",{name:"Confira antes de registrar"}),"E-legacy-unknown");
  140 |  await page.getByRole("button",{name:"Confirmar informações e registrar posições"}).click();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();await page.reload();
  141 |  const after=await sql(page,person.email,"E-after");expect(after.accounts).toEqual(before.accounts);expect(after.legacyReservations).toEqual(before.legacyReservations);expect(rows(after.transactions)).toHaveLength(0);expect(rows(after.investments)).toHaveLength(0);expect(rows(after.allocations)).toHaveLength(0);
  142 |  await save("E-receipt",at(await json(page,"/onboarding"),"data","completedReceipt"));
  143 | });
  144 | 
  145 | test("E2 fonte legada incerta bloqueia nova destinação também no uso cotidiano",async({page})=>{
  146 |  const person=await register(page,"legacy-capacity");
  147 |  const seeded=await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`);expect(seeded.ok(),await seeded.text()).toBe(true);
  148 |  const before=await sql(page,person.email,"E2-before");const account=rows(before.accounts)[0];
  149 |  const goal=record(await post(page,"/goals",{title:"Nova destinação na fonte incerta",targetValue:600,deadline:"2027-06-30",type:"MONETARY",useChecklist:false,color:"BLUE"}));
  150 |  const attempt=await request(page).put(`/api/goals/${goal.id}/allocations`,{data:{accountId:account.id,amount:"0.01"}});
  151 |  const after=await sql(page,person.email,"E2-after-attempt");
  152 |  await save("E2-response",{status:attempt.status(),body:await attempt.text(),expected:"400 without new allocation; SPEC-001 §5/5.1 source risk survives a new goal ID"});
  153 |  await page.goto("/metas");await paint(page,page.getByRole("button",{name:`Ver detalhes da meta ${goal.title}`}),"E2-source-capacity");
  154 |  expect(attempt.status(),"Unknown source reservation must prevent allocating even0.01 through a different goal").toBe(400);
  155 |  expect(rows(after.allocations)).toHaveLength(0);expect(after.accounts).toEqual(before.accounts);
  156 | });
  157 | 
  158 | test("F contas a receber: baixas parciais, calendário e persistência",async({page})=>{
  159 |  const f=await e01(page,"receivable");const forecast=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content"))[0];expect(forecast.amount).toBe(80);
  160 |  for(const [index,amount,total,remaining] of [[0,"30.00","1330.00",50],[1,"50.00","1380.00",0]] as const){
  161 |   await page.goto("/extrato");await page.getByRole("button",{name:"Mês seguinte do extrato",exact:true}).click();
  162 |   await page.getByText(String(forecast.description),{exact:true}).first().click();await page.getByRole("button",{name:"Baixar previsão",exact:true}).click();
  163 |   const modal=page.getByRole("dialog",{name:"Baixar previsão",exact:true});await modal.getByLabel("Valor da baixa").fill(amount);await modal.getByLabel("Data efetiva").fill(index===0?"2026-10-21":day);
  164 |   const response=page.waitForResponse(r=>r.url().endsWith(`/transactions/${forecast.id}/settlements`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar baixa",exact:true}).click();const r=await response;expect(r.ok(),await r.text()).toBe(true);await expect(modal).toHaveCount(0);await page.reload();
  165 |   await financial(page,f.person.email,`F-${index}`,total,"350.00");const current=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content")).find(t=>t.id===forecast.id);expect(current).toMatchObject({date:"2026-11-05",remainingAmount:remaining});
  166 |  }
  167 |  const book=await download(page,"F-receivables.xlsx");expect(JSON.stringify(book)).toContain("21/10/2026");expect(JSON.stringify(book)).toContain("22/10/2026");
  168 | });
```