# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf15-matrix.integrated.spec.ts >> Matriz CF014: investimentos histórico carregado e ação/modal
- Location: tests\e2e\rf15-matrix.integrated.spec.ts:47:5

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator: getByRole('button', { name: 'Aportar', exact: true })
Expected: focused
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "soft toBeFocused" getByRole('button', { name: 'Aportar', exact: true }) with timeout 15000ms
  - waiting for getByRole('button', { name: 'Aportar', exact: true })

```

```yaml
- button "Abrir menu de navegação"
- text: Controle Financeiro
- main:
  - heading "Investimentos" [level=1]
  - button "Novo Ativo"
  - main:
    - text: Investimentos avaliados R$ 0,00
    - paragraph: Subtotal conhecido; há avaliações indisponíveis.
    - text: Rentabilidade Geral Indisponível Custo ou avaliação indisponível
    - heading "Sua Carteira" [level=2]
    - heading "RF15" [level=3]
    - text: Outro Avaliação indisponível Alocação Indisponível
- alert
```

# Test source

```ts
  1  | import {settleVisual} from './support/rf15-visual';
  2  | import {expect,test,type Page} from '@playwright/test';
  3  | import {writeFile} from 'node:fs/promises';
  4  | import path from 'node:path';
  5  | import {registerSyntheticUser,syntheticUser} from './support/synthetic-auth';
  6  | const dir=process.env.CF_REVIEW_EVIDENCE!;
  7  | async function start(page:Page,key:string){await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-'+key));await page.setViewportSize({width:360,height:800});}
  8  | async function post(page:Page,url:string,data:unknown){const r=await page.request.post('/api'+url,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;}
  9  | async function shot(page:Page,name:string){for(const dialog of await page.getByRole('dialog').all())await expect(dialog).toHaveCSS('opacity','1');await settleVisual(page);await page.screenshot({path:path.join(dir,name+'.png')});}
  10 | 
  11 | test('Matriz CF013: PAID real após fechamento, reload e saldo devido',async({page})=>{
  12 |  await start(page,'paid');const account=await post(page,'/accounts',{name:'Banco PAID',type:'CHECKING',initialBalance:1000,color:'#10b981'});
  13 |  const card=await post(page,'/cards',{name:'Cartão PAID',last4Digits:'4242',limit:1000,closingDay:31,dueDay:5,brand:'VISA',color:'#7c3aed'});
  14 |  const cats=await (await page.request.get('/api/categories?type=EXPENSE')).json();
  15 |  await post(page,'/cards/transaction',{cardId:card.id,categoryId:cats[0].id,description:'Compra PAID',amount:120,date:'2027-01-15',time:null,totalInstallments:1});
  16 |  await page.goto('/cartoes');const opener=page.getByRole('button',{name:'Ver fatura de Cartão PAID, final 4242'});await opener.click();
  17 |  const invoice=page.getByRole('dialog',{name:'Cartão PAID •••• 4242',exact:true});
  18 |  await invoice.getByRole('button',{name:'Adiantar Fatura'}).click();
  19 |  const pay=page.getByRole('dialog',{name:'Pagar Fatura - Cartão PAID',exact:true});
  20 |  await pay.getByRole('button',{name:'Fechamento',exact:true}).click();await pay.getByLabel('Pagar com').selectOption(account.id);
  21 |  const response=page.waitForResponse(r=>r.url().endsWith(`/cards/${card.id}/pay`)&&r.request().method()==='POST');
  22 |  await pay.getByRole('button',{name:'Confirmar Pagamento'}).click();expect((await response).ok()).toBe(true);await expect(pay).toHaveCount(0);
  23 |  const api=await (await page.request.get(`/api/cards/${card.id}/invoice?month=1&year=2027`)).json();expect(api.status).toBe('PAID');expect(api.payableAmount).toBe(0);
  24 |  await page.reload();await opener.click();await expect(invoice.getByRole('button',{name:'Fatura Paga'})).toBeDisabled();await expect(invoice.getByText('Compra PAID',{exact:true})).toBeVisible();await shot(page,'matrix-paid');
  25 |  await writeFile(path.join(dir,'matrix-paid.json'),JSON.stringify(api,null,2));
  26 | });
  27 | 
  28 | test('Matriz CF014: metas hoje/concluída e formulário monetário longo',async({page})=>{
  29 |  await start(page,'goals');
  30 |  await post(page,'/goals',{title:'Prazo hoje RF15',type:'NUMERIC',targetValue:100,deadline:'2027-01-16',color:'BLUE',useChecklist:false});
  31 |  const complete=await post(page,'/goals',{title:'Concluída RF15',type:'NUMERIC',targetValue:1,deadline:'2027-01-16',color:'BLUE',useChecklist:false});
  32 |  await post(page,`/goals/${complete.id}/deposit`,{amount:1,note:'Conclusão sintética'});
  33 |  await page.clock.setFixedTime(new Date('2027-01-16T12:00:00Z'));await page.goto('/metas');await expect(page.getByText('Prazo hoje RF15',{exact:true})).toBeVisible();await expect(page.getByText('Concluído',{exact:true})).toBeVisible();await expect(page.getByText('Atrasado',{exact:true})).toHaveCount(0);await shot(page,'matrix-goals-today');
  34 |  await page.reload();await expect(page.getByText('Concluído',{exact:true})).toBeVisible();
  35 |  const opener=page.getByRole('button',{name:'Nova Meta',exact:true});await opener.click();const modal=page.getByRole('dialog',{name:'Nova Meta',exact:true});
  36 |  await modal.getByRole('button',{name:'Criar Meta'}).focus();await expect(modal.getByRole('button',{name:'Criar Meta'})).toBeInViewport();await shot(page,'matrix-goal-form-bottom');
  37 |  await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);
  38 |  // Detalhe monetário com checklist longo: observação explícita, não inferência de aceite pelo formulário comum.
  39 |  const monetary=await post(page,'/goals',{title:'Meta monetária longa RF15',type:'MONETARY',targetValue:1000,deadline:'2027-12-31',color:'BLUE',useChecklist:true});
  40 |  for(let i=0;i<10;i++)await post(page,`/goals/${monetary.id}/items`,{name:`Item ${i} longo para rolagem da meta`,estimatedPrice:100});
  41 |  await page.reload();await page.getByText('Meta monetária longa RF15',{exact:true}).click();await expect(page.getByText('Item 9 longo para rolagem da meta',{exact:true})).toBeAttached();
  42 |  await page.getByText('Item 9 longo para rolagem da meta',{exact:true}).scrollIntoViewIfNeeded();await shot(page,'matrix-goal-detail-bottom');
  43 |  await page.keyboard.press('Escape');
  44 |  await writeFile(path.join(dir,'matrix-goal-detail.json'),JSON.stringify({dialogs:await page.getByRole('dialog').count(),detailStillOpen:await page.getByRole('heading',{name:'Meta monetária longa RF15',exact:true}).count(),focused:await page.evaluate(()=>({tag:document.activeElement?.tagName,aria:document.activeElement?.getAttribute('aria-label')}))},null,2));
  45 | });
  46 | 
  47 | test('Matriz CF014: investimentos histórico carregado e ação/modal',async({page})=>{
  48 |  await start(page,'investment');const account=await post(page,'/accounts',{name:'Banco histórico RF15',type:'CHECKING',initialBalance:1000,color:'#10b981'});
  49 |  const asset=await post(page,'/investments',{ticker:'RF15',name:'Ativo sintético com histórico RF15',type:'OTHER'});
  50 |  for(let i=0;i<8;i++)await post(page,'/investments/operation',{operationId:crypto.randomUUID(),investmentId:asset.id,type:'BUY',quantity:1,price:10,fees:0,date:'2027-01-15',accountId:account.id});
  51 |  const history=await (await page.request.get(`/api/investments/${asset.id}/history`)).json();expect(history).toHaveLength(8);
  52 |  await page.goto('/investimentos');await page.getByText('RF15',{exact:true}).click();await expect(page.getByText('Histórico de Movimentações',{exact:true})).toBeVisible();
  53 |  await expect(page.getByTitle('Compensar operação')).toHaveCount(8);
  54 |  await expect(page.getByText('Histórico de Movimentações',{exact:true}).locator('../..')).toHaveCSS('opacity','1');
  55 |  await page.getByTitle('Compensar operação').last().scrollIntoViewIfNeeded();await shot(page,'matrix-investment-history');
  56 |  const action=page.getByRole('button',{name:'Aportar',exact:true});await action.focus();await page.keyboard.press('Enter');
  57 |  const modal=page.getByRole('dialog',{name:'RF15 - Operação',exact:true});await expect(modal).toBeVisible();await modal.getByRole('button',{name:'Confirmar Operação'}).focus();await expect(modal.getByRole('button',{name:'Confirmar Operação'})).toBeInViewport();await shot(page,'matrix-investment-operation');
> 58 |  await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);await expect.soft(action).toBeFocused();
     |                                                                                                   ^ Error: expect(locator).toBeFocused() failed
  59 |  await page.keyboard.press('Escape');
  60 |  await writeFile(path.join(dir,'matrix-investment-detail.json'),JSON.stringify({focused:await page.evaluate(()=>({tag:document.activeElement?.tagName,text:document.activeElement?.textContent?.slice(0,150)})),historyRows:history.length,dialogs:await page.getByRole('dialog').count(),detailStillOpen:await page.getByText('Histórico de Movimentações',{exact:true}).count()},null,2));
  61 | });
  62 | 
  63 | test('Matriz CF014: hábito formulário longo e detalhe diário',async({page})=>{
  64 |  await start(page,'habit-long');await page.goto('/habitos');const opener=page.getByRole('button',{name:'Novo Hábito'});await opener.click();const modal=page.getByRole('dialog',{name:'Novo Hábito',exact:true});
  65 |  await modal.getByPlaceholder('Ex: Beber 3L de Água').fill('Hábito diário com descrição extensa para inspeção');
  66 |  await modal.getByRole('button',{name:'Meta na Semana'}).click();await modal.getByPlaceholder('Ex: 4').fill('2');
  67 |  await modal.getByRole('button',{name:'Criar Hábito'}).focus();await expect(modal.getByRole('button',{name:'Criar Hábito'})).toBeInViewport();await shot(page,'matrix-habit-form-bottom');
  68 |  await page.keyboard.press('Escape');await expect(opener).toBeFocused();
  69 |  const habit=await post(page,'/habits',{name:'Hábito diário longo RF15',description:'Descrição sintética extensa para verificar as ações e o calendário. '.repeat(3),frequency:'DAILY',icon:'Flame',color:'BLUE'});
  70 |  await page.reload();await page.getByRole('button',{name:`Ver detalhes do hábito ${habit.name}`}).focus();await page.keyboard.press('Enter');await expect(page.locator('form').filter({hasText:habit.description})).toBeVisible();await expect(page.locator('form').getByRole('heading',{name:habit.name,exact:true})).toBeVisible();await shot(page,'matrix-habit-detail');
  71 |  await page.keyboard.press('Escape');
  72 |  await writeFile(path.join(dir,'matrix-habit-detail.json'),JSON.stringify({dialogs:await page.getByRole('dialog').count(),detailStillOpen:await page.locator('form').filter({hasText:habit.description}).count()},null,2));
  73 | });
  74 | 
```