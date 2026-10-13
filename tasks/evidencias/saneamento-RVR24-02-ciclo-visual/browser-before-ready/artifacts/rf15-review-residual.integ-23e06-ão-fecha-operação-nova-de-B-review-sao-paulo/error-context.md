# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf15-review-residual.integrated.spec.ts >> Revisor CF014: resposta tardia de A não fecha operação nova de B
- Location: tests\e2e\rf15-review-residual.integrated.spec.ts:109:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: 'REVISB - Operação', exact: true })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'REVISB - Operação', exact: true }) with timeout 15000ms
  - waiting for getByRole('dialog', { name: 'REVISB - Operação', exact: true })

```

```yaml
- complementary "Navegação principal":
  - text: P
  - heading "Pessoa Sintética A" [level=2]
  - text: cf003-a-closure-45ea3922-late-selection@example.invalid
  - navigation:
    - link "Dashboard":
      - /url: /
    - link "Minhas Contas":
      - /url: /contas
    - link "Extrato":
      - /url: /extrato
    - link "Cartões de Crédito":
      - /url: /cartoes
    - link "Planejamento":
      - /url: /planejamento
    - link "Metas":
      - /url: /metas
    - link "Investimentos":
      - /url: /investimentos
    - link "Resumo Anual":
      - /url: /resumo-anual
    - link "Hábitos":
      - /url: /habitos
  - button "Privacidade"
  - button "Configurações"
  - button "Sair da Conta"
- main:
  - heading "Investimentos" [level=1]
  - paragraph: Acompanhe a evolução do seu patrimônio.
  - button "Novo Ativo"
  - main:
    - text: Investimentos avaliados R$ 0,00
    - paragraph: Subtotal conhecido; há avaliações indisponíveis.
    - text: Rentabilidade Geral Indisponível Custo ou avaliação indisponível
    - heading "Sua Carteira" [level=2]
    - button "Ver detalhes do investimento REVISA":
      - heading "REVISA" [level=3]
      - text: Outro Avaliação indisponível Alocação Indisponível
    - button "Ver detalhes do investimento REVISB":
      - heading "REVISB" [level=3]
      - text: Outro Avaliação indisponível Alocação Indisponível
  - dialog "Detalhes do investimento REVISB":
    - button "Excluir Ativo"
    - button "Fechar detalhe do investimento"
    - text: Outro
    - heading "REVISB" [level=3]
    - paragraph: Ativo B
    - paragraph: Saldo Atual
    - paragraph: Indisponível
    - paragraph: Rentabilidade
    - paragraph: Indisponível
    - paragraph: Preço Médio
    - paragraph: R$ 0,00
    - paragraph: Cotação Atual
    - paragraph: Indisponível
    - paragraph: "Avaliação: data indisponível · origem desconhecida"
    - button "Vender / Resgatar"
    - button "Aportar"
    - heading "Histórico de Movimentações" [level=4]
    - paragraph: Nenhum registro encontrado.
    - region "Compensações registradas":
      - heading "Compensações registradas" [level=4]
      - paragraph: Nenhuma compensação registrada.
- alert
```

# Test source

```ts
  33  | }
  34  | async function fill(page: Page, accountId: string) {
  35  |   const modal = page.getByRole('dialog',{name:'REVISA - Operação',exact:true});
  36  |   await modal.getByPlaceholder('0',{exact:true}).fill('2');
  37  |   await modal.getByPlaceholder('0,00',{exact:true}).fill('10');
  38  |   await modal.getByLabel('Conta',{exact:true}).selectOption(accountId);
  39  | }
  40  | async function persisted(page: Page, accountId: string, assetId: string, otherId: string, operationId: string) {
  41  |   const receipt = await page.request.get('/api/financial-intents/' + operationId);
  42  |   expect(receipt.status()).toBe(200);
  43  |   const result = await receipt.json();
  44  |   expect(result.operationId).toBe(operationId); expect(result.kind).toBe('INVESTMENT_OPERATION');
  45  |   const accounts = await (await page.request.get('/api/accounts')).json();
  46  |   const assets = await (await page.request.get('/api/investments')).json();
  47  |   const history = await (await page.request.get(`/api/investments/${assetId}/history`)).json();
  48  |   expect(accounts.find((a:{id:string})=>a.id===accountId).balance).toBe(980);
  49  |   expect(assets.find((a:{id:string})=>a.id===assetId)).toMatchObject({quantity:2,totalCost:20});
  50  |   expect(assets.find((a:{id:string})=>a.id===otherId)).toMatchObject({quantity:0,totalCost:0});
  51  |   expect(history).toHaveLength(1);
  52  |   return {receipt:result,accounts,assets,history};
  53  | }
  54  | 
  55  | test('Revisor CF014: editar por mouse e teclado não envia; salvar persiste uma vez',async({page})=>{
  56  |   await start(page,'-habit-save');
  57  |   const habit=await post(page,'/habits',{name:'Hábito legítimo',description:'Original',frequency:'DAILY',icon:'Flame',color:'BLUE'});
  58  |   await page.goto('/habitos');
  59  |   await page.getByRole('button',{name:`Ver detalhes do hábito ${habit.name}`}).click();
  60  |   const d=page.getByRole('dialog',{name:`Detalhes do hábito ${habit.name}`});
  61  |   const writes:unknown[]=[];
  62  |   page.on('request',r=>{if(r.method()!=='GET'&&r.url().includes('/api/habits'))writes.push({method:r.method(),body:r.postDataJSON()});});
  63  |   await d.getByRole('button',{name:'Editar Hábito'}).click();
  64  |   await expect(d.locator('input').first()).toHaveValue(habit.name);
  65  |   await d.getByRole('button',{name:'Cancelar',exact:true}).click();
  66  |   await d.getByRole('button',{name:'Editar Hábito'}).focus(); await page.keyboard.press('Enter');
  67  |   await expect(d.locator('input').first()).toHaveValue(habit.name);
  68  |   expect(writes).toEqual([]);
  69  |   await d.getByPlaceholder('Descrição (Opcional)').fill('Edição legítima persistida');
  70  |   const saved=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().includes('/api/habits/'));
  71  |   await d.getByRole('button',{name:/Salvar/}).click(); expect((await saved).ok()).toBe(true);
  72  |   await expect(page.getByRole('button',{name:'Editar Hábito'})).toBeVisible();
  73  |   expect(writes).toHaveLength(1);
  74  |   await page.reload(); await page.getByRole('button',{name:`Ver detalhes do hábito ${habit.name}`}).click();
  75  |   await expect(page.getByText('Edição legítima persistida',{exact:true})).toBeVisible();
  76  |   await shot(page,'habit-legitimate',{writes});
  77  | });
  78  | 
  79  | for(const mode of ['confirmed','lost'] as const) test(`Revisor CF014: investimento ${mode}, identidade e releitura financeira`,async({page})=>{
  80  |   const {account,asset,other}=await seed(page,'-investment-'+mode);
  81  |   await page.goto('/investimentos'); const {detail,modal}=await open(page); await fill(page,account.id);
  82  |   const commands:Record<string,unknown>[]=[];
  83  |   await page.route('**/api/investments/operation',async route=>{
  84  |     if(route.request().method()!=='POST'){await route.continue();return;}
  85  |     commands.push(route.request().postDataJSON());
  86  |     const response=await route.fetch(); expect(response.ok(),await response.text()).toBe(true);
  87  |     if(mode==='lost') await route.abort('connectionclosed'); else await route.fulfill({response});
  88  |   });
  89  |   await modal.getByRole('button',{name:'Confirmar Operação'}).click();
  90  |   if(mode==='lost') {
  91  |     await expect(modal.getByRole('alert')).toContainText('Não foi possível confirmar');
  92  |     await expect(modal.getByRole('button',{name:'Confirmar Operação'})).toBeDisabled();
  93  |     await expect(detail).toBeVisible();
  94  |     await modal.getByRole('button',{name:'Consultar recibo'}).click();
  95  |   }
  96  |   await expect(modal).toHaveCount(0);
  97  |   await expect(detail).toBeVisible();
  98  |   await expect(detail.getByTitle('Compensar operação')).toHaveCount(1);
  99  |   await expect(detail.getByRole('button',{name:'Aportar',exact:true})).toBeFocused();
  100 |   expect(commands).toHaveLength(1);
  101 |   const data=await persisted(page,account.id,asset.id,other.id,String(commands[0].operationId));
  102 |   await shot(page,'investment-'+mode,{commands,...data,detail:await detail.innerText()});
  103 |   await page.reload();
  104 |   await page.getByRole('button',{name:'Ver detalhes do investimento REVISA'}).click();
  105 |   await expect(page.getByTitle('Compensar operação')).toHaveCount(1);
  106 |   await persisted(page,account.id,asset.id,other.id,String(commands[0].operationId));
  107 | });
  108 | 
  109 | test('Revisor CF014: resposta tardia de A não fecha operação nova de B',async({page})=>{
  110 |   const {account,asset,other}=await seed(page,'-late-selection');
  111 |   await page.goto('/investimentos');const {modal}=await open(page);await fill(page,account.id);
  112 |   let release!:()=>void, committed!:()=>void;
  113 |   const gate=new Promise<void>(r=>{release=r;});const ready=new Promise<void>(r=>{committed=r;});
  114 |   const commands:Record<string,unknown>[]=[];
  115 |   await page.route('**/api/investments/operation',async route=>{
  116 |     commands.push(route.request().postDataJSON());
  117 |     const response=await route.fetch();expect(response.ok(),await response.text()).toBe(true);committed();
  118 |     await gate; await route.fulfill({response});
  119 |   });
  120 |   await modal.getByRole('button',{name:'Confirmar Operação'}).click();await ready;
  121 |   await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);
  122 |   await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  123 |   const next=await open(page,'REVISB');
  124 |   await expect(next.modal).toBeVisible();
  125 |   const response=page.waitForResponse(r=>r.url().endsWith('/api/investments/operation')&&r.request().method()==='POST');
  126 |   release();await response;
  127 |   // A confirmed old callback calls closeOperation after its awaited receipt validation.
  128 |   // Wait for either the legitimate preserved recovery UI or removal, then assert the contract.
  129 |   await expect(page.getByRole('button',{name:'Confirmar Operação'}).or(page.getByRole('button',{name:'Aportar',exact:true}))).not.toHaveCount(0);
  130 |   const data=await persisted(page,account.id,asset.id,other.id,String(commands[0].operationId));
  131 |   await shot(page,'investment-late-selection',{commands,...data,dialogs:await page.getByRole('dialog').allTextContents()});
  132 |   expect(commands).toHaveLength(1);
> 133 |   await expect(next.modal).toBeVisible();
      |                            ^ Error: expect(locator).toBeVisible() failed
  134 |   await expect(next.detail).toBeVisible();
  135 | });
  136 | 
```