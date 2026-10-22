# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> G resposta perdida após commit SQL, recuperação e replay de efeito único
- Location: tests\cf032\journeys.spec.ts:170:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 400
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
          - generic [ref=f2e8]: cf003-a-cf032-9eab2cbb-lost@example.invalid
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
          - button "Ver fatura de Cartão sintético, final null" [ref=f2e139] [cursor=pointer]:
            - generic [ref=f2e140]:
              - img "Logo da bandeira null" [ref=f2e142]
              - generic [ref=f2e151]:
                - paragraph [ref=f2e152]: ••••
                - generic [ref=f2e153]:
                  - paragraph [ref=f2e154]: Cartão sintético
                  - paragraph [ref=f2e155]: Vence dia 28
            - generic [ref=f2e157]:
              - generic [ref=f2e158]:
                - paragraph [ref=f2e159]: Fatura Atual
                - generic [ref=f2e160]: R$ 50,00
              - generic [ref=f2e161]:
                - paragraph [ref=f2e162]: Disponível
                - generic [ref=f2e163]: R$ 950,00
  - alert [ref=f2e166]
  - generic [ref=f2e167]:
    - generic [ref=f2e168] [cursor=pointer]
    - dialog [ref=f2e169]:
      - generic [ref=f2e170]:
        - generic [ref=f2e171]:
          - button "Mês anterior da fatura" [ref=f2e172] [cursor=pointer]
          - generic [ref=f2e175]: novembro de 2026
          - button "Próximo mês da fatura" [ref=f2e179] [cursor=pointer]
        - button "Fechar detalhes da fatura" [ref=f2e182] [cursor=pointer]
      - generic [ref=f2e187]:
        - generic [ref=f2e188]:
          - paragraph [ref=f2e189]: Cartão sintético ••••
          - paragraph [ref=f2e190]: R$ 50,00
          - paragraph [ref=f2e191]: "Consumo original · Saldo pagável: R$ 50,00 · Crédito: R$ 0,00"
          - generic [ref=f2e192]:
            - generic "Data em que as compras passam para o próximo mês" [ref=f2e193]: "Fecha: 20 de nov"
            - generic "Data limite para pagamento" [ref=f2e195]: "Vence: 28 de nov"
        - generic [ref=f2e197]: Aberta
      - generic [ref=f2e199]:
        - generic [ref=f2e205]:
          - paragraph [ref=f2e206]: Parcela futura declarada
          - paragraph [ref=f2e207]:
            - text: 09/10/2026
            - generic [ref=f2e209]: Pagamento de Fatura
          - group [ref=f2e210]:
            - generic "Horário e registro" [ref=f2e211] [cursor=pointer]
        - generic [ref=f2e212]:
          - generic [ref=f2e213]: R$ 50,00
          - generic [ref=f2e214]:
            - button [ref=f2e215] [cursor=pointer]
            - button [ref=f2e219] [cursor=pointer]
      - generic [ref=f2e223]:
        - generic [ref=f2e224]:
          - 'button "Limite: R$ 1.000,00" [ref=f2e225] [cursor=pointer]'
          - button "Excluir" [ref=f2e229] [cursor=pointer]
        - button "Adiantar Fatura" [ref=f2e233] [cursor=pointer]
  - dialog [ref=f2e238]:
    - generic [ref=f2e239]:
      - heading "Pagar Fatura - Cartão sintético" [level=2] [ref=f2e240]
      - button "Fechar modal" [ref=f2e241]
    - generic [ref=f2e246]:
      - paragraph [ref=f2e247]: "Saldo pagável: R$ 50,00 · Consumo original: R$ 50,00 · Crédito no cartão: R$ 0,00"
      - group [ref=f2e248]:
        - generic [ref=f2e249]:
          - button "Fechamento" [disabled] [ref=f2e250]
          - button "Adiantamento" [disabled] [ref=f2e251]
        - generic [ref=f2e252]:
          - text: Pagar com
          - combobox "Pagar com" [disabled] [ref=f2e257] [cursor=pointer]:
            - 'option "Carteira Física (Saldo: R$ 100.00)" [disabled]'
            - 'option "Corrente sintética (Saldo: R$ 1000.00)" [disabled] [selected]'
            - 'option "Poupança sintética (Saldo: R$ 200.00)" [disabled]'
        - generic [ref=f2e258]:
          - text: Valor do Pagamento
          - spinbutton "Valor do Pagamento" [disabled] [ref=f2e262]: "200.00"
        - generic [ref=f2e263]:
          - generic [ref=f2e264]:
            - text: Data do Pagamento
            - textbox "Data do Pagamento" [disabled] [ref=f2e265]: 2026-10-22
          - generic [ref=f2e266]:
            - text: Hora
            - textbox "Horário informado (opcional)" [disabled] [ref=f2e267]: 06:00
      - button [disabled] [ref=f2e268] [cursor=pointer]
```

# Test source

```ts
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
  169 | 
  170 | test("G resposta perdida após commit SQL, recuperação e replay de efeito único",async({page})=>{
  171 |  const f=await e01(page,"lost");const pay=await paymentForm(page,f.card,String(f.checking.id),"200.00");
  172 |  let requests=0;let body:unknown;let receipt:unknown;
  173 |  let resolveLost!:()=>void;const committedAndLost=new Promise<void>(resolve=>{resolveLost=resolve;});
  174 |  await page.route(`**/api/cards/${f.card.id}/pay`,async route=>{
> 175 |   requests++;body=route.request().postDataJSON();const response=await route.fetch();expect(response.status()).toBe(200);receipt=await response.json();
      |                                                                                                               ^ Error: expect(received).toBe(expected) // Object.is equality
  176 |   const committed=await financial(page,f.person.email,"G-committed-before-response-loss","1100.00","150.00");expect(rows(committed.payments)).toHaveLength(1);
  177 |   await route.abort("failed");resolveLost();
  178 |  });
  179 |  await pay.getByRole("button",{name:"Confirmar Pagamento"}).click();await committedAndLost;
  180 |  await expect(pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"})).toBeEnabled();await expect(pay.getByRole("button",{name:"Confirmar Pagamento"})).toBeDisabled();
  181 |  await paint(page,pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}),"G-result-unknown");
  182 |  await page.unroute(`**/api/cards/${f.card.id}/pay`);await pay.getByRole("button",{name:"Atualizar dados sem repetir pagamento"}).click();await expect(pay).toHaveCount(0);
  183 |  const replay=await request(page).post(`/api/cards/${f.card.id}/pay`,{data:body});expect(replay.status()).toBe(200);expect(await replay.json()).toEqual(receipt);
  184 |  const conflict=await request(page).post(`/api/cards/${f.card.id}/pay`,{data:{...record(body),amount:201}});expect(conflict.status()).toBe(409);
  185 |  await page.reload();const final=await financial(page,f.person.email,"G-reloaded","1100.00","150.00");expect(rows(final.payments)).toHaveLength(1);expect(rows(final.transactions).filter(t=>t.origin==="INVOICE_PAYMENT")).toHaveLength(1);expect(requests).toBe(1);
  186 |  expect(rows(final.payments)[0].operation_id).toBe(record(body).operationId);
  187 |  await save("G-protocol",{initialBrowserPosts:requests,explicitReplays:1,rejectedContentConflicts:1,totalPostAttempts:3,financialEffects:1,body,receipt,replay:await replay.json()});
  188 | });
  189 | 
  190 | test("H dois usuários intercalados, ownership, exportação e troca de sessão",async({page,browser})=>{
  191 |  const a=await register(page,"owners","A");const ctx=await browser.newContext({baseURL:"http://127.0.0.1:3142",timezoneId:"America/Sao_Paulo",locale:"pt-BR"});
  192 |  try{
  193 |   const other=await ctx.newPage();const b=await register(other,"owners","B");
  194 |   const aa=record(await post(page,"/accounts",{name:"EXCLUSIVO A",type:"CHECKING",initialBalance:1000,color:"#10b981"}));const bb=record(await post(other,"/accounts",{name:"EXCLUSIVO B",type:"CHECKING",initialBalance:2300,color:"#10b981"}));
  195 |   // Observable barrier: each command awaits its own HTTP commit before alternation.
  196 |   await transaction(page,String(aa.id),"INCOME","RECEITA EXCLUSIVA A","10.00");await transaction(other,String(bb.id),"EXPENSE","DESPESA EXCLUSIVA B","20.00");
  197 |   const before=await sql(other,b.email,"H-B-before");
  198 |   const bCard=record(await post(other,"/cards",{name:"CARTÃO EXCLUSIVO B",last4Digits:"4242",limit:1000,closingDay:20,dueDay:28,brand:"VISA",color:"#7c3aed"}));
  199 |   expect((await request(page).get(`/api/cards/${bCard.id}/invoice?month=10&year=2026`)).status()).toBe(404);
  200 |   const bReceipt=rows(before.receipts).find(r=>r.kind==="TRANSACTION_CREATE");expect(bReceipt).toBeTruthy();
  201 |   expect((await request(other).get(`/api/financial-intents/${bReceipt!.id}`)).status()).toBe(200);
  202 |   expect((await request(page).get(`/api/financial-intents/${bReceipt!.id}`)).status()).toBe(404);
  203 |   const forbidden=await request(page).put(`/api/accounts/${bb.id}`,{data:{name:"INVASÃO",type:"CHECKING",color:"#10b981"}});expect(forbidden.status()).toBe(404);
  204 |   const transfer=await request(page).post("/api/transactions",{data:{description:"Tentativa cruzada",amount:1,date:day,type:"TRANSFER",accountId:aa.id,destinationAccountId:bb.id,isPaid:true,fee:0,operationId:randomUUID()}});expect(transfer.status()).toBe(404);
  205 |   expect(await sql(other,b.email,"H-B-after")).toEqual(before);expect(before.accountTotal).toBe("2280.00");expect((await sql(page,a.email,"H-A")).accountTotal).toBe("1010.00");
  206 |   await page.goto("/contas");await other.goto("/contas");await expect(page.getByText("EXCLUSIVO A",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toHaveCount(0);await expect(other.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(other.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);
  207 |   const exportsA=await download(page,"H-A.xlsx"),exportsB=await download(other,"H-B.xlsx");expect(JSON.stringify(exportsA)).not.toContain("EXCLUSIVO B");expect(JSON.stringify(exportsB)).not.toContain("EXCLUSIVO A");expect(JSON.stringify(exportsA)).toContain("RECEITA EXCLUSIVA A");expect(JSON.stringify(exportsB)).toContain("DESPESA EXCLUSIVA B");
  208 |   await logout(page);await login(page,b);await page.goto("/contas");await page.reload();await expect(page.getByText("EXCLUSIVO B",{exact:true})).toBeVisible();await expect(page.getByText("EXCLUSIVO A",{exact:true})).toHaveCount(0);await paint(page,page.getByText("EXCLUSIVO B",{exact:true}),"H-B-new-session");
  209 |   await logout(page);await login(page,a);expect((await sql(page,a.email)).accountTotal).toBe("1010.00");
  210 |  }finally{await ctx.close();}
  211 | });
  212 | 
  213 | for(const [index,zone] of ["America/Sao_Paulo","UTC","Pacific/Kiritimati"].entries())test.describe(`Calendar ${zone}`,()=>{
  214 |  test.use({timezoneId:zone,viewport:{width:[360,768,1440][index],height:1000}});
  215 |  test(`T${index} prazo e hábito em ${zone}`,async({page})=>{
  216 |   const f=await e01(page,`temporal-${index}`);const g=rows(await json(page,"/goals")).find(g=>g.type==="NUMERIC");expect(g).toBeTruthy();
  217 |   const habit=record(await post(page,"/habits",{name:"CF032 leitura diária",icon:"BookOpen",color:"BLUE",frequency:"DAILY",goalId:g!.id}));
  218 |   await page.goto("/habitos");const card=page.getByRole("button",{name:"Ver detalhes do hábito CF032 leitura diária"});
  219 |   await paint(page,card.getByRole("button",{name:"Marcar Feito"}),`T${index}-ready`);
  220 |   const toggle=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Marcar Feito"}).click();const marked=await toggle;expect(marked.status()).toBe(200);expect(marked.request().postDataJSON()).toEqual({date:day});await page.reload();await expect(card.getByRole("button",{name:"Feito Hoje"})).toBeVisible();
  221 |   expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(5);
  222 |   const undo=page.waitForResponse(r=>r.url().endsWith(`/habits/${habit.id}/toggle`)&&r.request().method()==="POST");await card.getByRole("button",{name:"Feito Hoje"}).click();expect((await undo).status()).toBe(200);await page.reload();
  223 |   const future=await request(page).post(`/api/habits/${habit.id}/toggle`,{data:{date:"2026-10-23"}});expect(future.status()).toBe(400);expect(rows(await json(page,"/goals")).find(x=>x.id===g!.id)?.currentValue).toBe(4);
  224 |   const state=await financial(page,f.person.email,`T${index}-final`,"1300.00","350.00");expect(rows(state.habitLogs)).toEqual([{log_date:day,status:"PENDING",goal_history_id:null}]);
  225 |   await page.goto("/metas");
  226 |   const yesterday=page.getByRole("button",{name:"Ver detalhes da meta Prazo ontem"}),today=page.getByRole("button",{name:"Ver detalhes da meta Prazo hoje"}),tomorrow=page.getByRole("button",{name:"Ver detalhes da meta Prazo amanhã"});
  227 |   await expect(yesterday).toContainText("Atrasado");await expect(today).not.toContainText("Atrasado");await expect(tomorrow).not.toContainText("Atrasado");
  228 |   await expect(today).toContainText("22/10/2026");await expect(tomorrow).toContainText("23/10/2026");
  229 |   await paint(page,today,`T${index}-deadlines`);
  230 |  });
  231 | });
  232 | 
```