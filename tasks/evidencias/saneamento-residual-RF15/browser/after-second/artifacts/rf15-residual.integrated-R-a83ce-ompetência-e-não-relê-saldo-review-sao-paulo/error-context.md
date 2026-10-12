# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf15-residual.integrated.spec.ts >> Residual RF15-04: Pacific/Kiritimati visibilitychange isolado mantém competência e não relê saldo
- Location: tests\e2e\rf15-residual.integrated.spec.ts:61:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: 'Fatura residual •••• 4242', exact: true }).getByText('Janeiro de 2027', { exact: true })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'Fatura residual •••• 4242', exact: true }).getByText('Janeiro de 2027', { exact: true }) with timeout 15000ms
  - waiting for getByRole('dialog', { name: 'Fatura residual •••• 4242', exact: true }).getByText('Janeiro de 2027', { exact: true })

```

```yaml
- button "Abrir menu de navegação"
- text: Controle Financeiro
- main:
  - heading "Carteira" [level=1]
  - button "Lançar Compra"
  - button "Novo Cartão"
  - main:
    - paragraph: Limite Global
    - text: R$ 1.000,00
    - paragraph: Faturas Abertas
    - text: R$ 120,00
    - paragraph: Disponível
    - text: R$ 880,00
    - heading "Cartões Ativos" [level=2]
    - button "Ver fatura de Fatura residual, final 4242":
      - img "Logo da bandeira VISA"
      - paragraph: •••• 4242
      - paragraph: Fatura residual
      - paragraph: Vence dia 5
      - paragraph: Fatura Atual
      - text: R$ 120,00
      - paragraph: Disponível
      - text: R$ 880,00
- alert
- dialog "Fatura residual •••• 4242":
  - button "Mês anterior da fatura"
  - text: janeiro de 2027
  - button "Próximo mês da fatura"
  - button "Fechar detalhes da fatura"
  - paragraph: Fatura residual •••• 4242
  - paragraph: R$ 120,00
  - paragraph: "Consumo original · Saldo pagável: R$ 120,00 · Crédito: R$ 0,00"
  - text: "Fecha: 31 de jan Vence: 05 de fev Aberta"
  - paragraph: Compra residual
  - paragraph: 15/01/2027 Alimentação
  - group: Horário e registro
  - text: R$ 120,00
  - button
  - button
  - 'button "Limite: R$ 1.000,00"'
  - button "Excluir"
  - button "Pagar Atrasada"
```

# Test source

```ts
  1   | import {expect, test, type Page} from '@playwright/test';
  2   | import {writeFile} from 'node:fs/promises';
  3   | import path from 'node:path';
  4   | import {registerSyntheticUser, syntheticUser} from './support/synthetic-auth';
  5   | import {settleVisual} from './support/rf15-visual';
  6   | 
  7   | const dir = process.env.CF_REVIEW_EVIDENCE!;
  8   | async function start(page: Page, key: string) {
  9   |   await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
  10  |   await registerSyntheticUser(page, syntheticUser('A', process.env.CF_E2E_NAMESPACE + key));
  11  |   await page.setViewportSize({width: 360, height: 800});
  12  | }
  13  | async function post(page: Page, url: string, data: unknown) {
  14  |   const response = await page.request.post('/api' + url, {data});
  15  |   expect(response.ok(), await response.text()).toBe(true);
  16  |   return (await response.text()) ? response.json() : null;
  17  | }
  18  | async function evidence(page: Page, name: string) {
  19  |   await settleVisual(page);
  20  |   await page.screenshot({path: path.join(dir, name + '.png')});
  21  |   await writeFile(path.join(dir, name + '.json'), JSON.stringify({
  22  |     snapshot: await page.locator('body').ariaSnapshot(),
  23  |     focus: await page.evaluate(() => ({tag: document.activeElement?.tagName, label: document.activeElement?.getAttribute('aria-label')})),
  24  |   }, null, 2));
  25  | }
  26  | 
  27  | test('Residual CF014: Escape no detalhe longo da meta', async ({page}) => {
  28  |   await start(page, '-goal');
  29  |   const goal = await post(page, '/goals', {title:'Meta residual longa', type:'MONETARY', targetValue:1000, deadline:'2027-12-31', color:'BLUE', useChecklist:true});
  30  |   for (let i = 0; i < 10; i++) await post(page, `/goals/${goal.id}/items`, {name:`Item ${i} longo para rolagem da meta`, estimatedPrice:100});
  31  |   await page.goto('/metas');
  32  |   await page.getByText(goal.title, {exact:true}).click();
  33  |   await page.getByText('Item 9 longo para rolagem da meta', {exact:true}).scrollIntoViewIfNeeded();
  34  |   await evidence(page, 'goal-before-escape');
  35  |   await page.keyboard.press('Escape');
  36  |   await evidence(page, 'goal-after-escape');
  37  |   await expect(page.getByRole('heading', {name:goal.title, exact:true})).toHaveCount(1);
  38  |   await expect(page.getByRole('button', {name:`Ver detalhes da meta ${goal.title}`})).toBeFocused();
  39  | });
  40  | 
  41  | test('Residual CF014: Escape no detalhe diário do hábito', async ({page}) => {
  42  |   await start(page, '-habit');
  43  |   const habit = await post(page, '/habits', {name:'Hábito residual diário', description:'Descrição sintética extensa para verificar as ações e o calendário. '.repeat(3), frequency:'DAILY', icon:'Flame', color:'BLUE'});
  44  |   await page.goto('/habitos');
  45  |   const opener = page.getByRole('button', {name:`Ver detalhes do hábito ${habit.name}`});
  46  |   await opener.focus(); await page.keyboard.press('Enter');
  47  |   const detail = page.locator('form').filter({hasText:habit.description});
  48  |   await expect(detail).toBeVisible();
  49  |   await evidence(page, 'habit-before-escape');
  50  |   await page.keyboard.press('Escape');
  51  |   await evidence(page, 'habit-after-escape');
  52  |   await expect(detail).toHaveCount(0);
  53  |   await expect(opener).toBeFocused();
  54  | });
  55  | 
  56  | for (const [zone, before, after] of [
  57  |   ['America/Sao_Paulo','2027-02-06T02:59:59Z','2027-02-06T03:00:00Z'],
  58  |   ['UTC','2027-02-05T23:59:59Z','2027-02-06T00:00:00Z'],
  59  |   ['Pacific/Kiritimati','2027-02-05T09:59:59Z','2027-02-05T10:00:00Z'],
  60  | ]) for (const event of ['focus','visibilitychange']) {
  61  |   test(`Residual RF15-04: ${zone} ${event} isolado mantém competência e não relê saldo`, async ({browser}) => {
  62  |     const context = await browser.newContext({baseURL:process.env.CF_TEST_BASE_URL, timezoneId:zone, locale:'pt-BR'});
  63  |     const page = await context.newPage();
  64  |     try {
  65  |       await start(page, '-'+zone.replaceAll('/','-')+'-'+event);
  66  |       await page.clock.setFixedTime(new Date(before));
  67  |       const card = await post(page,'/cards',{name:'Fatura residual', last4Digits:'4242',limit:1000,closingDay:31,dueDay:5,brand:'VISA',color:'#7c3aed'});
  68  |       const cats = await (await page.request.get('/api/categories?type=EXPENSE')).json();
  69  |       await post(page,'/cards/transaction',{cardId:card.id,categoryId:cats[0].id,description:'Compra residual',amount:120,date:'2027-01-15',time:null,totalInstallments:1});
  70  |       await page.goto('/cartoes');
  71  |       await page.getByRole('button',{name:'Ver fatura de Fatura residual, final 4242'}).click();
  72  |       const d = page.getByRole('dialog',{name:'Fatura residual •••• 4242',exact:true});
  73  |       await d.getByRole('button',{name:'Mês anterior da fatura'}).click();
  74  |       await expect(d.getByText('Compra residual',{exact:true})).toBeVisible();
  75  |       await expect(d.getByRole('button',{name:'Adiantar Fatura'})).toBeVisible();
  76  |       const requests: string[] = [];
  77  |       page.on('request', r => {if(r.url().includes('/api/cards')) requests.push(r.url());});
  78  |       await page.clock.setFixedTime(new Date(after));
  79  |       // FixedTime changes Date only: no timer, other event, navigation or data refresh.
  80  |       await page.evaluate(event => {
  81  |         if(event === 'focus') window.dispatchEvent(new Event('focus'));
  82  |         else {if(document.visibilityState !== 'visible') throw new Error('Page must be visible'); document.dispatchEvent(new Event('visibilitychange'));}
  83  |       },event);
  84  |       await expect(d.getByRole('button',{name:'Pagar Atrasada'})).toBeVisible();
> 85  |       await expect(d.getByText('Janeiro de 2027',{exact:true})).toBeVisible();
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  86  |       await expect(d.getByText('Fecha: 31 de jan')).toBeVisible();
  87  |       await expect(d.getByText('Vence: 05 de fev')).toBeVisible();
  88  |       expect(requests).toEqual([]);
  89  |       await evidence(page, 'calendar-'+zone.replaceAll('/','-')+'-'+event);
  90  |     } finally {await context.close();}
  91  |   });
  92  | }
  93  | 
  94  | test('Residual CF014: rascunhos, camadas e retorno dos detalhes', async ({page}) => {
  95  |   await start(page,'-layers');
  96  |   const goal = await post(page,'/goals',{title:'Meta camadas',type:'MONETARY',targetValue:1000,deadline:'2027-12-31',color:'BLUE',useChecklist:true});
  97  |   await post(page,`/goals/${goal.id}/items`,{name:'Item preservado',estimatedPrice:100});
  98  |   await page.goto('/metas');
  99  |   const opener = page.getByRole('button',{name:'Ver detalhes da meta Meta camadas'});
  100 |   await opener.focus(); await page.keyboard.press('Enter');
  101 |   const detail = page.getByRole('dialog',{name:'Detalhes da meta Meta camadas'});
  102 |   await expect(detail.getByRole('button',{name:'Fechar detalhe da meta'})).toBeFocused();
  103 |   await page.keyboard.press('Shift+Tab'); expect(await detail.evaluate(d=>d.contains(document.activeElement))).toBe(true);
  104 |   await detail.getByRole('button',{name:'Editar meta'}).click();
  105 |   await detail.locator('input').first().fill('Rascunho meta');
  106 |   await page.keyboard.press('Escape'); await expect(detail).toBeVisible();
  107 |   await detail.getByRole('button',{name:'Editar meta'}).click();
  108 |   await expect(detail.locator('input').first()).toHaveValue('Meta camadas');
  109 |   await page.keyboard.press('Escape');
  110 |   const remove = detail.getByRole('button',{name:'Remover item'});
  111 |   await remove.click();
  112 |   const child = page.getByRole('dialog',{name:'Excluir Sub-item'});
  113 |   await expect(child).toBeVisible(); await page.keyboard.press('Escape');
  114 |   await expect(child).toHaveCount(0); await expect(detail).toBeVisible(); await expect(remove).toBeFocused();
  115 |   await evidence(page,'goal-nested-return');
  116 |   await page.keyboard.press('Escape'); await expect(opener).toBeFocused();
  117 |   expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
  118 | 
  119 |   const habit = await post(page,'/habits',{name:'Hábito rascunho',description:'Original preservado',frequency:'DAILY',icon:'Flame',color:'BLUE'});
  120 |   await page.goto('/habitos');
  121 |   const habitOpener = page.getByRole('button',{name:`Ver detalhes do hábito ${habit.name}`});
  122 |   await habitOpener.click();
  123 |   const h = page.getByRole('dialog',{name:`Detalhes do hábito ${habit.name}`});
  124 |   await expect(h.getByRole('button',{name:'Fechar detalhe do hábito'})).toBeFocused();
  125 |   await h.getByRole('button',{name:'Editar Hábito'}).click(); await h.locator('input').first().fill('Rascunho hábito');
  126 |   await page.keyboard.press('Escape'); await expect(h).toBeVisible();
  127 |   await h.getByRole('button',{name:'Editar Hábito'}).click(); await expect(h.locator('input').first()).toHaveValue(habit.name);
  128 |   await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await expect(habitOpener).toBeFocused();
  129 |   await page.reload(); await expect(habitOpener).toBeVisible(); await expect(page.getByText('Rascunho hábito')).toHaveCount(0);
  130 | });
  131 | 
```