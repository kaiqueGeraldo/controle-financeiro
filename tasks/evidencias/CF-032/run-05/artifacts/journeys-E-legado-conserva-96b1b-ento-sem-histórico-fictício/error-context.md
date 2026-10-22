# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> E legado conserva proveniência, UNKNOWN e complemento sem histórico fictício
- Location: tests\cf032\journeys.spec.ts:117:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 6

@@ -3,6 +3,12 @@
      "attribution": "{\"reservationId\":\"5834c2ca-db2c-4e03-bdbc-2f6fb6b3f214\",\"revision\":\"0\",\"goal\":{\"state\":\"KNOWN\",\"value\":{\"kind\":\"GOAL\",\"id\":\"a133c834-0521-4201-ade3-a477d69941dc\"}},\"nominal\":{\"state\":\"UNKNOWN\",\"value\":null,\"knownSubtotal\":null,\"outsideIndividualRange\":null,\"missingPaths\":[\"/legacy/nominal\"]},\"attribution\":{\"state\":\"UNBOUNDED\",\"excluded\":[]}}",
      "evidence": "[]",
      "id": "5834c2ca-db2c-4e03-bdbc-2f6fb6b3f214",
      "revision": 0,
    },
+   Object {
+     "attribution": "{\"reservationId\":\"a133c834-0521-4201-ade3-a477d69941dc\",\"revision\":\"0\",\"goal\":{\"state\":\"KNOWN\",\"value\":{\"kind\":\"GOAL\",\"id\":\"a133c834-0521-4201-ade3-a477d69941dc\"}},\"nominal\":{\"state\":\"UNKNOWN\",\"value\":null,\"knownSubtotal\":null,\"outsideIndividualRange\":null,\"missingPaths\":[\"/existing/goals/a133c834-0521-4201-ade3-a477d69941dc/progress\"]},\"attribution\":{\"state\":\"UNBOUNDED\",\"excluded\":[]}}",
+     "evidence": "[]",
+     "id": "a133c834-0521-4201-ade3-a477d69941dc",
+     "revision": 0,
+   },
  ]
```

# Page snapshot

```yaml
- generic [ref=f3e1]:
  - generic [ref=f3e2]:
    - complementary "Navegação principal" [ref=f3e3]:
      - generic [ref=f3e4]:
        - generic [ref=f3e5]: P
        - generic [ref=f3e6]:
          - heading "Pessoa Sintética A" [level=2] [ref=f3e7]
          - generic [ref=f3e8]: cf003-a-cf032-74b55e82-legacy@example.invalid
      - navigation [ref=f3e10]:
        - link "Dashboard" [ref=f3e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f3e19] [cursor=pointer]:
          - /url: /contas
        - link "Configuração inicial" [ref=f3e24] [cursor=pointer]:
          - /url: /onboarding
        - link "Extrato" [ref=f3e30] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f3e36] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f3e41] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f3e46] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f3e53] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f3e61] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f3e68] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f3e75]:
        - button "Privacidade" [ref=f3e76] [cursor=pointer]
        - button "Configurações" [ref=f3e84] [cursor=pointer]
        - button "Sair da Conta" [ref=f3e89] [cursor=pointer]
    - main [ref=f3e95]:
      - generic [ref=f3e96]:
        - generic [ref=f3e97]:
          - generic [ref=f3e98]:
            - paragraph [ref=f3e99]: Configuração inicial voluntária
            - heading "Organize seu ponto de partida" [level=1] [ref=f3e100]
            - paragraph [ref=f3e101]: Registre o que já existe na data-base. Salvar respostas não altera saldos; somente a confirmação final registra as posições.
          - button "Ir ao dashboard" [ref=f3e102]
        - heading "Entrevista concluída" [active] [level=2] [ref=f3e103]
        - paragraph [ref=f3e104]: Recibo confirmado pelo servidor. Este resumo preserva a captura aceita; correções posteriores devem ser feitas nos módulos regulares.
        - region "Revisão financeira preparada" [ref=f3e105]:
          - generic [ref=f3e106]:
            - heading "Revisão financeira" [level=2] [ref=f3e107]
            - paragraph [ref=f3e108]: "Aberturas na data-base: 22/10/2026. Registros existentes na revisão: 22/10/2026, 06:00:00 (São Paulo)."
            - paragraph [ref=f3e109]: Esta captura inclui os registros existentes uma vez. Não reconstrói posição histórica. Reservas não somam patrimônio; dívida e crédito são mostrados separadamente. Investimento livre não é caixa.
          - generic [ref=f3e110]:
            - generic [ref=f3e111]:
              - term [ref=f3e112]: Saldo das contas
              - definition [ref=f3e113]:
                - generic [ref=f3e114]: R$ 1.000,00
            - generic [ref=f3e117]:
              - term [ref=f3e118]: Investimentos
              - definition [ref=f3e119]:
                - generic [ref=f3e120]: R$ 0,00
            - generic [ref=f3e123]:
              - term [ref=f3e124]: Crédito nos cartões
              - definition [ref=f3e125]:
                - generic [ref=f3e126]: R$ 0,00
            - generic [ref=f3e129]:
              - term [ref=f3e130]: Dívida dos cartões
              - definition [ref=f3e131]:
                - generic [ref=f3e132]: R$ 0,00
            - generic [ref=f3e135]:
              - term [ref=f3e136]: Patrimônio
              - definition [ref=f3e137]:
                - generic [ref=f3e138]: R$ 1.000,00
            - generic [ref=f3e141]:
              - term [ref=f3e142]: Reservas em contas
              - definition [ref=f3e143]:
                - generic [ref=f3e146]:
                  - text: Não reconciliado / indisponível
                  - generic [ref=f3e147]: Há 2 informação(ões) pendente(s) nesta medida.
            - generic [ref=f3e148]:
              - term [ref=f3e149]: Reservas em investimentos
              - definition [ref=f3e150]:
                - generic [ref=f3e151]: R$ 0,00
            - generic [ref=f3e154]:
              - term [ref=f3e155]: Caixa livre gerencial
              - definition [ref=f3e156]:
                - generic [ref=f3e159]:
                  - text: Não reconciliado / indisponível
                  - generic [ref=f3e160]: Há 1 informação(ões) pendente(s) nesta medida.
            - generic [ref=f3e161]:
              - term [ref=f3e162]: Investimentos não destinados
              - definition [ref=f3e163]:
                - generic [ref=f3e164]: R$ 0,00
          - generic [ref=f3e167]:
            - heading "Carteira Física" [level=3] [ref=f3e168]
            - generic [ref=f3e169]:
              - generic [ref=f3e170]:
                - term [ref=f3e171]: Saldo informado
                - definition [ref=f3e172]:
                  - generic [ref=f3e173]: R$ 1.000,00
              - generic [ref=f3e174]:
                - term [ref=f3e175]: Reserva comprovada e pendências
                - definition [ref=f3e176]:
                  - generic [ref=f3e179]:
                    - text: Não reconciliado / indisponível
                    - generic [ref=f3e180]: Há 1 informação(ões) pendente(s) nesta medida.
              - generic [ref=f3e181]:
                - term [ref=f3e182]: Valor livre
                - definition [ref=f3e183]:
                  - generic [ref=f3e186]:
                    - text: Não reconciliado / indisponível
                    - generic [ref=f3e187]: Há 1 informação(ões) pendente(s) nesta medida.
              - generic [ref=f3e188]:
                - term [ref=f3e189]: Capacidade para nova destinação
                - definition [ref=f3e190]:
                  - generic [ref=f3e193]:
                    - text: Não reconciliado / indisponível
                    - generic [ref=f3e194]: Há 1 informação(ões) pendente(s) nesta medida.
            - paragraph [ref=f3e195]: Disponibilidade não confirmada. Confirme a origem ou o encerramento da reserva para destinar mais desta fonte.
          - generic [ref=f3e196]:
            - heading "Legado sem origem — financeira" [level=3] [ref=f3e197]
            - generic [ref=f3e198]:
              - term [ref=f3e199]: Progresso por reservas
              - definition [ref=f3e200]:
                - generic [ref=f3e203]:
                  - text: Não reconciliado / indisponível
                  - generic [ref=f3e204]: Há 2 informação(ões) pendente(s) nesta medida.
              - term [ref=f3e205]: Cobertura financeira comprovada
              - definition [ref=f3e206]:
                - generic [ref=f3e209]:
                  - text: Não reconciliado / indisponível
                  - generic [ref=f3e210]: Há 2 informação(ões) pendente(s) nesta medida.
          - region "Reservas anteriores" [ref=f3e211]:
            - heading "Reservas anteriores, contadas uma vez" [level=3] [ref=f3e212]
            - generic [ref=f3e213]:
              - paragraph [ref=f3e214]: Reserva anterior 1
              - generic [ref=f3e217]:
                - text: Não reconciliado / indisponível
                - generic [ref=f3e218]: Há 1 informação(ões) pendente(s) nesta medida.
              - paragraph [ref=f3e219]: Origem ainda não confirmada. O valor nominal não é progresso monetário autorizado.
            - generic [ref=f3e220]:
              - paragraph [ref=f3e221]: Reserva anterior 2
              - generic [ref=f3e224]:
                - text: Não reconciliado / indisponível
                - generic [ref=f3e225]: Há 1 informação(ões) pendente(s) nesta medida.
              - paragraph [ref=f3e226]: Origem ainda não confirmada. O valor nominal não é progresso monetário autorizado.
        - link "Entrar no dashboard" [ref=f3e227] [cursor=pointer]:
          - /url: /
  - alert [ref=f3e228]
```

# Test source

```ts
  30  |  expect(rows(state.transactions)).toHaveLength(1);expect(rows(state.transactions)[0]).toMatchObject({is_paid:false,amount:"80.00"});
  31  |  expect(at(fixture.receipt,"summary","metrics","reservedAccounts","value")).toBe("350.00");
  32  |  expect(at(fixture.receipt,"summary","metrics","reservedInvestments","value")).toBe("200.00");
  33  |  expect(rows(state.investments).find(i=>i.position_mode==="MONETARY")).toMatchObject({quantity:null,total_cost:null,valuation_amount:"500.00",acquisition_date:null,historical_source:null});
  34  |  await page.reload();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();
  35  |  expect(at(await json(page,"/onboarding"),"data","completedReceipt")).toEqual(fixture.receipt);
  36  |  await paint(page,page.getByRole("heading",{name:"Entrevista concluída",exact:true}),"A-completed");
  37  |  await save("A-api-receipt",fixture.receipt);
  38  | });
  39  | 
  40  | async function daily(page:Page,suffix:string,ui:boolean){
  41  |  const f=await e01(page,suffix);const a=String(f.checking.id),b=String(f.savings.id),email=f.person.email;
  42  |  if(ui){await transaction(page,a,"INCOME","CF032 receita","250.10");await transaction(page,a,"EXPENSE","CF032 despesa","40.20");await transaction(page,a,"TRANSFER","CF032 transferência","100.00",b);}
  43  |  else {
  44  |   const inc=rows(await json(page,"/categories?type=INCOME"))[0],exp=rows(await json(page,"/categories?type=EXPENSE"))[0];
  45  |   await post(page,"/transactions",{description:"CF032 receita",amount:250.10,date:day,time:"12:34:56",type:"INCOME",accountId:a,categoryId:inc.id,isPaid:true,operationId:randomUUID()});
  46  |   await post(page,"/transactions",{description:"CF032 despesa",amount:40.20,date:day,type:"EXPENSE",accountId:a,categoryId:exp.id,isPaid:true,operationId:randomUUID()});
  47  |   await post(page,"/transactions",{description:"CF032 transferência",amount:100,date:day,type:"TRANSFER",accountId:a,destinationAccountId:b,isPaid:true,fee:2,operationId:randomUUID()});
  48  |  }
  49  |  await financial(page,email,`${suffix}-cash`,"1507.90","350.00");
  50  |  const cats=rows(await json(page,"/categories?type=EXPENSE"));
  51  |  if(ui){
  52  |   await page.goto("/cartoes");await page.getByTitle("Lançar Compra",{exact:true}).click();const modal=page.getByRole("dialog",{name:"Nova Despesa no Crédito"});
  53  |   await modal.getByPlaceholder("0,00").fill("120.00");await modal.getByPlaceholder("Ex: Uber, Amazon, Jantar...").fill("CF032 compra parcelada");
  54  |   await modal.locator('input[type="date"]').fill("2026-10-15");await modal.locator("select").nth(0).selectOption(String(f.card.id));await modal.locator("select").nth(1).selectOption(String(cats[0].id));await modal.locator("select").nth(2).selectOption("3");
  55  |   const response=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/cards/transaction"&&r.request().method()==="POST");
  56  |   await modal.getByRole("button",{name:/Salvar|Lançar|Confirmar/}).click();const result=await response;expect(result.ok(),await result.text()).toBe(true);await expect(modal).toHaveCount(0);
  57  |  }else await post(page,"/cards/transaction",{cardId:f.card.id,categoryId:cats[0].id,description:"CF032 compra parcelada",amount:120,date:"2026-10-15",time:null,totalInstallments:3});
  58  |  await financial(page,email,`${suffix}-purchase`,"1507.90","470.00");
  59  |  const pay=await paymentForm(page,f.card,a,"200.00");const paid=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/cards/${f.card.id}/pay`&&r.request().method()==="POST");
  60  |  await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();const paidResponse=await paid;expect(paidResponse.ok(),await paidResponse.text()).toBe(true);await expect(pay).toHaveCount(0);
  61  |  await financial(page,email,`${suffix}-payment`,"1307.90","270.00");
  62  |  const stock=rows(await json(page,"/investments")).find(i=>i.type==="STOCK");expect(stock).toBeTruthy();
  63  |  if(ui){
  64  |   await page.goto("/investimentos");await page.getByText(String(stock!.ticker),{exact:true}).click();await page.getByRole("button",{name:"Aportar",exact:true}).click();
  65  |   const modal=page.getByRole("dialog",{name:`${stock!.ticker} - Operação`,exact:true});await modal.getByPlaceholder("0",{exact:true}).fill("2");await modal.getByPlaceholder("0,00",{exact:true}).fill("10");await modal.getByLabel("Taxas / retenções").fill("1");await modal.getByLabel("Conta",{exact:true}).selectOption(a);
  66  |   const op=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/investments/operation"&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar Operação",exact:true}).click();const applied=await op;expect(applied.ok(),await applied.text()).toBe(true);await expect(modal).toHaveCount(0);
  67  |  }else await post(page,"/investments/operation",{investmentId:stock!.id,type:"BUY",quantity:2,price:10,fees:1,date:day,accountId:a,operationId:randomUUID()});
  68  |  const goals=rows(await json(page,"/goals"));const trip=goals.find(g=>g.currentValue===500);expect(trip).toBeTruthy();
  69  |  if(ui){
  70  |   await page.goto("/metas");await page.getByRole("button",{name:`Ver detalhes da meta ${trip!.title}`}).click();await page.getByRole("button",{name:"Aporte Avulso",exact:true}).click();
  71  |   const modal=page.getByRole("dialog",{name:"Guardar Dinheiro",exact:true});await modal.getByPlaceholder("0",{exact:true}).fill("100");await modal.locator("select").selectOption(a);
  72  |   const deposited=page.waitForResponse(r=>r.url().includes(`/goals/${trip!.id}/deposit`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar Aporte",exact:true}).click();const response=await deposited;expect(response.ok(),await response.text()).toBe(true);await expect(modal).toHaveCount(0);
  73  |  }else {const r=await request(page).put(`/api/goals/${trip!.id}/allocations`,{data:{accountId:a,amount:"400.00"}});expect(r.status(),await r.text()).toBe(204);}
  74  |  const final=await financial(page,email,`${suffix}-final`,"1286.90","270.00");
  75  |  expect(final.netWorth).toBe("1518.57");expect(final.investmentTotal).toBe("501.67");expect(final.reservedAccounts).toBe("450.00");expect(final.reservedInvestments).toBe("200.00");
  76  |  expect(rows(final.investments).find(i=>i.type==="STOCK"||i.ticker===stock!.ticker)).toMatchObject({quantity:"5.00000000",total_cost:"21.60",valuation_amount:"1.67"});
  77  |  expect(rows(final.allocations).find(r=>r.account_id===a)).toMatchObject({amount:"400.00"});
  78  |  expect(rows(final.accounts).find(r=>r.id===a)).toMatchObject({balance:"886.90"});
  79  |  await save(`${suffix}-api`,{accounts:await json(page,"/accounts/position"),cards:await json(page,"/cards"),annual:await json(page,"/annual-summary?year=2026"),cash:await json(page,"/transactions/summary?month=10&year=2026")});
  80  |  return f;
  81  | }
  82  | 
  83  | test("B uso diário pela UI, reconciliação, reload e logout/login",async({page})=>{
  84  |  const f=await daily(page,"B",true);await page.goto("/contas");await page.reload();await expect(page.getByText("Corrente sintética",{exact:true}).first()).toBeVisible();
  85  |  await paint(page,page.getByText("Corrente sintética",{exact:true}).first(),"B-accounts");
  86  |  const before=await sql(page,f.person.email);await logout(page);await login(page,f.person);await page.goto("/extrato");await page.reload();
  87  |  await expect(page.getByText("CF032 receita",{exact:true})).toBeVisible();expect(await sql(page,f.person.email,"B-new-session")).toEqual(before);
  88  |  expect(at(await json(page,"/onboarding"),"data","completedReceipt")).toEqual(f.receipt);
  89  |  await paint(page,page.getByText("CF032 receita",{exact:true}),"B-new-session");
  90  | });
  91  | 
  92  | test("C relatório e XLSX real com datas, origens, estados e totais independentes",async({page})=>{
  93  |  const f=await daily(page,"C",false);
  94  |  await page.goto("/resumo-anual");await expect(page.getByRole("heading",{name:"Posição atual de investimentos",exact:true})).toBeVisible();
  95  |  await paint(page,page.getByRole("heading",{name:"Posição atual de investimentos",exact:true}),"C-annual");
  96  |  const annual=await json(page,"/annual-summary?year=2026");await save("C-annual-api",annual);
  97  |  const cash=await json(page,"/transactions/summary?month=10&year=2026");
  98  |  expect(Number(at(cash,"observed","balance"))).toBe(-13.10);expect(at(cash,"coverage","state")).toBe("PARTIAL");
  99  |  const book=await download(page,"C-october.xlsx");const all=JSON.stringify(book);
  100 |  expect(all).toContain("250.10");expect(all).toContain("162.20");expect(all).toContain("87.90");
  101 |  expect(JSON.stringify(book["Cobertura"])).toContain("PARTIAL");expect(all).toContain("22/10/2026");expect(all).toContain("15/10/2026");
  102 |  const extract=book["Extrato Financeiro"];expect(Array.isArray(extract)).toBe(true);
  103 |  const lines=extract as unknown[][];
  104 |  expect(lines.find(r=>r[2]==="CF032 receita")?.slice(0,3)).toEqual(["22/10/2026","12:34:56","CF032 receita"]);
  105 |  expect(lines.filter(r=>r[2]==="CF032 receita")).toHaveLength(1);
  106 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[6]).toBe("250.1");
  107 |  expect(lines.find(r=>r[2]==="CF032 despesa")?.[6]).toBe("40.2");
  108 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[7]).toBe("SETTLED");
  109 |  expect(lines.find(r=>r[2]==="CF032 receita")?.[8]).toBe("USER");
  110 |  const purchases=book["Consumo cartão"];expect(Array.isArray(purchases)).toBe(true);expect(JSON.stringify(purchases)).toContain("120.0");
  111 |  // A distinct period cannot acquire October flows; the current position remains dated.
  112 |  const older=await json(page,"/annual-summary?year=2025");await save("C-previous-year-api",older);
  113 |  expect(at(older,"investments","valuationAsOf")).toBe(day);
  114 |  await financial(page,f.person.email,"C-exported","1286.90","270.00");
  115 | });
  116 | 
  117 | test("E legado conserva proveniência, UNKNOWN e complemento sem histórico fictício",async({page})=>{
  118 |  const person=await register(page,"legacy");const seeded=await page.request.post(`${process.env.CF032_OBSERVER}/legacy?email=${encodeURIComponent(person.email)}`);expect(seeded.ok(),await seeded.text()).toBe(true);
  119 |  const before=await sql(page,person.email,"E-before");const account=rows(before.accounts)[0];
  120 |  await page.goto("/onboarding");await expect(page.getByRole("heading",{name:"Organize seu ponto de partida"})).toBeVisible();
  121 |  const sections:Record<string,{answer:string;items:unknown[]}>=Object.fromEntries(["accounts","cards","investments","goals","allocations","forecasts"].map(k=>[k,{answer:"NONE",items:[]}]));
  122 |  sections.accounts={answer:"PROVIDED",items:[{tempId:randomUUID(),action:"LINK",ref:{kind:"ACCOUNT",id:account.id}}]};
  123 |  const payload={context:{currency:"BRL",baseDate:day,boundaryAcknowledged:true,cashOnlyAcknowledged:true},currentStep:"REVIEW",sections};
  124 |  const saved=await request(page).put("/api/onboarding/draft",{data:{contractVersion:1,expectedVersion:"0",action:"SAVE",payload}});expect(saved.status(),await saved.text()).toBe(200);
  125 |  await page.reload();await page.getByRole("button",{name:"Preparar revisão financeira"}).click();await expect(page.getByRole("heading",{name:"Confira antes de registrar"})).toBeVisible();
  126 |  const pending=at(await json(page,"/onboarding"),"data","pendingIntent");
  127 |  expect(at(pending,"summary","metrics","netWorth","value")).toBe("1000.00");expect(at(pending,"summary","metrics","freeAccountCash","state")).toBe("UNKNOWN");expect(at(pending,"summary","metrics","reservedAccounts","value")).toBeNull();
  128 |  await paint(page,page.getByRole("heading",{name:"Confira antes de registrar"}),"E-legacy-unknown");
  129 |  await page.getByRole("button",{name:"Confirmar informações e registrar posições"}).click();await expect(page.getByRole("heading",{name:"Entrevista concluída",exact:true})).toBeVisible();await page.reload();
> 130 |  const after=await sql(page,person.email,"E-after");expect(after.accounts).toEqual(before.accounts);expect(after.legacyReservations).toEqual(before.legacyReservations);expect(rows(after.transactions)).toHaveLength(0);expect(rows(after.investments)).toHaveLength(0);expect(rows(after.allocations)).toHaveLength(0);
      |                                                                                                                                      ^ Error: expect(received).toEqual(expected) // deep equality
  131 |  await save("E-receipt",at(await json(page,"/onboarding"),"data","completedReceipt"));
  132 | });
  133 | 
  134 | test("F contas a receber: baixas parciais, calendário e persistência",async({page})=>{
  135 |  const f=await e01(page,"receivable");const forecast=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content"))[0];expect(forecast.amount).toBe(80);
  136 |  for(const [index,amount,total,remaining] of [[0,"30.00","1330.00",50],[1,"50.00","1380.00",0]] as const){
  137 |   await page.goto("/extrato");await page.getByRole("button",{name:"Mês seguinte do extrato",exact:true}).click();
  138 |   await page.getByText(String(forecast.description),{exact:true}).first().click();await page.getByRole("button",{name:"Baixar previsão",exact:true}).click();
  139 |   const modal=page.getByRole("dialog",{name:"Baixar previsão",exact:true});await modal.getByLabel("Valor da baixa").fill(amount);await modal.getByLabel("Data efetiva").fill(index===0?"2026-10-21":day);
  140 |   const response=page.waitForResponse(r=>r.url().endsWith(`/transactions/${forecast.id}/settlements`)&&r.request().method()==="POST");await modal.getByRole("button",{name:"Confirmar baixa",exact:true}).click();const r=await response;expect(r.ok(),await r.text()).toBe(true);await expect(modal).toHaveCount(0);await page.reload();
  141 |   await financial(page,f.person.email,`F-${index}`,total,"350.00");const current=rows(at(await json(page,"/transactions?month=11&year=2026&size=100"),"content")).find(t=>t.id===forecast.id);expect(current).toMatchObject({date:"2026-11-05",remainingAmount:remaining});
  142 |  }
  143 |  const book=await download(page,"F-receivables.xlsx");expect(JSON.stringify(book)).toContain("21/10/2026");expect(JSON.stringify(book)).toContain("22/10/2026");
  144 | });
  145 | 
  146 | test("G resposta perdida após commit SQL, recuperação e replay de efeito único",async({page})=>{
  147 |  const f=await e01(page,"lost");const pay=await paymentForm(page,f.card,String(f.checking.id),"200.00");
  148 |  let requests=0;let body:unknown;let receipt:unknown;
  149 |  let resolveLost!:()=>void;const committedAndLost=new Promise<void>(resolve=>{resolveLost=resolve;});
  150 |  await page.route(`**/api/cards/${f.card.id}/pay`,async route=>{
  151 |   requests++;body=route.request().postDataJSON();const response=await route.fetch();expect(response.status()).toBe(200);receipt=await response.json();
  152 |   const committed=await financial(page,f.person.email,"G-committed-before-response-loss","1100.00","150.00");expect(rows(committed.payments)).toHaveLength(1);
  153 |   await route.abort("failed");resolveLost();
  154 |  });
  155 |  await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();await committedAndLost;
  156 |  await expect(pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"})).toBeEnabled();await expect(pay.getByRole("button",{name:"Confirmar Pagamento"})).toBeDisabled();
  157 |  await paint(page,pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}),"G-result-unknown");
  158 |  await page.unroute(`**/api/cards/${f.card.id}/pay`);await pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}).click();await expect(pay).toHaveCount(0);
  159 |  const replay=await request(page).post(`/api/cards/${f.card.id}/pay`,{data:body});expect(replay.status()).toBe(200);expect(await replay.json()).toEqual(receipt);
  160 |  await page.reload();const final=await financial(page,f.person.email,"G-reloaded","1100.00","150.00");expect(rows(final.payments)).toHaveLength(1);expect(rows(final.transactions).filter(t=>t.origin==="INVOICE_PAYMENT")).toHaveLength(1);expect(requests).toBe(1);
  161 |  expect(rows(final.payments)[0].operation_id).toBe(record(body).operationId);
  162 |  await save("G-protocol",{browserRequests:requests,explicitReplays:1,financialEffects:1,body,receipt,replay:await replay.json()});
  163 | });
  164 | 
  165 | test("H dois usuários intercalados, ownership, exportação e troca de sessão",async({page,browser})=>{
  166 |  const a=await register(page,"owners","A");const ctx=await browser.newContext({baseURL:"http://127.0.0.1:3142",timezoneId:"America/Sao_Paulo",locale:"pt-BR"});
  167 |  try{
  168 |   const other=await ctx.newPage();const b=await register(other,"owners","B");
  169 |   const aa=record(await post(page,"/accounts",{name:"EXCLUSIVO A",type:"CHECKING",initialBalance:1000,color:"#10b981"}));const bb=record(await post(other,"/accounts",{name:"EXCLUSIVO B",type:"CHECKING",initialBalance:2300,color:"#10b981"}));
  170 |   // Observable barrier: each command awaits its own HTTP commit before alternation.
  171 |   await transaction(page,String(aa.id),"INCOME","RECEITA EXCLUSIVA A","10.00");await transaction(other,String(bb.id),"EXPENSE","DESPESA EXCLUSIVA B","20.00");
  172 |   const before=await sql(other,b.email,"H-B-before");
  173 |   const bCard=record(await post(other,"/cards",{name:"CARTÃO EXCLUSIVO B",last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"}));
  174 |   expect((await request(page).get(`/api/cards/${bCard.id}/invoice?month=10&year=2026`)).status()).toBe(404);
  175 |   const bReceipt=rows(before.receipts).find(r=>r.kind==="TRANSACTION_CREATE");expect(bReceipt).toBeTruthy();
  176 |   expect((await request(other).get(`/api/financial-intents/${bReceipt!.id}`)).status()).toBe(200);
  177 |   expect((await request(page).get(`/api/financial-intents/${bReceipt!.id}`)).status()).toBe(404);
  178 |   const forbidden=await request(page).put(`/api/accounts/${bb.id}`,{data:{name:"INVASÃO",type:"CHECKING",color:"#10b981"}});expect(forbidden.status()).toBe(404);
  179 |   const transfer=await request(page).post("/api/transactions",{data:{description:"Tentativa cruzada",amount:1,date:day,type:"TRANSFER",accountId:aa.id,destinationAccountId:bb.id,isPaid:true,fee:0,operationId:randomUUID()}});expect(transfer.status()).toBe(404);
  180 |   expect(await sql(other,b.email,"H-B-after")).toEqual(before);expect(before.accountTotal).toBe("2280.00");expect((await sql(page,a.email,"H-A")).accountTotal).toBe("1010.00");
  181 |   await page.goto("/contas");await other.goto("/contas");await expect(page.getByText("EXCLUSIVO A",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toHaveCount(0);await expect(other.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(other.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);
  182 |   const exportsA=await download(page,"H-A.xlsx"),exportsB=await download(other,"H-B.xlsx");expect(JSON.stringify(exportsA)).not.toContain("EXCLUSIVO B");expect(JSON.stringify(exportsB)).not.toContain("EXCLUSIVO A");expect(JSON.stringify(exportsA)).toContain("RECEITA EXCLUSIVA A");expect(JSON.stringify(exportsB)).toContain("DESPESA EXCLUSIVA B");
  183 |   await logout(page);await login(page,b);await page.goto("/contas");await page.reload();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);await paint(page,page.getByText("EXCLUSIVO B",{exact:true}),"H-B-new-session");
  184 |   await logout(page);await login(page,a);expect((await sql(page,a.email)).accountTotal).toBe("1010.00");
  185 |  }finally{await ctx.close();}
  186 | });
  187 | 
  188 | for(const [index,zone] of ["America/Sao_Paulo","UTC","Pacific/Kiritimati"].entries())test(`T${index} prazo e hábito em ${zone}`,async({browser})=>{
  189 |  const context=await browser.newContext({baseURL:"http://127.0.0.1:3142",timezoneId:zone,locale:"pt-BR",viewport:{width:[360,768,1440][index],height:1000}});
  190 |  try{
  191 |   const page=await context.newPage();const f=await e01(page,`temporal-${index}`);const g=rows(await json(page,"/goals")).find(g=>g.type==="NUMERIC");expect(g).toBeTruthy();
  192 |   const habit=record(await post(page,"/habits",{name:"CF032 leitura diária",icon:"BookOpen",color:"BLUE",frequency:"DAILY",goalId:g!.id}));
  193 |   await page.goto("/habitos");const card=page.getByRole("button",{name:"Ver detalhes do hábito CF032 leitura diária"});
  194 |   await paint(page,card.getByRole("button",{name:"Marcar Feito"}),`T${index}-ready`);
  195 |   const toggle=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Marcar Feito"}).click();const marked=await toggle;expect(marked.status()).toBe(200);expect(marked.request().postDataJSON()).toEqual({date:day});await page.reload();await expect(card.getByRole("button",{name:"Feito Hoje"})).toBeVisible();
  196 |   expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(5);
  197 |   const undo=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Feito Hoje"}).click();expect((await undo).status()).toBe(200);await page.reload();
  198 |   const future=await request(page).post(`/api/habits/${habit.id}/toggle`,{data:{date:"2026-10-23"}});expect(future.status()).toBe(400);expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(4);
  199 |   const state=await financial(page,f.person.email,`T${index}-final`,"1300.00","350.00");expect(rows(state.habitLogs)).toEqual([{log_date:day,status:"PENDING",goal_history_id:null}]);
  200 |   await page.goto("/metas");
  201 |   const yesterday=page.getByRole("button",{name:"Ver detalhes da meta Prazo ontem"}),today=page.getByRole("button",{name:"Ver detalhes da meta Prazo hoje"}),tomorrow=page.getByRole("button",{name:"Ver detalhes da meta Prazo amanhã"});
  202 |   await expect(yesterday).toContainText("Atrasado");await expect(today).not.toContainText("Atrasado");await expect(tomorrow).not.toContainText("Atrasado");
  203 |   await expect(today).toContainText("22/10/2026");await expect(tomorrow).toContainText("23/10/2026");
  204 |   await paint(page,today,`T${index}-deadlines`);
  205 |  }finally{await context.close();}
  206 | });
  207 | 
```