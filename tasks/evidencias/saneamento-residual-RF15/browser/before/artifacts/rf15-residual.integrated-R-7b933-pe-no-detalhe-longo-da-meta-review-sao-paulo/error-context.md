# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf15-residual.integrated.spec.ts >> Residual CF014: Escape no detalhe longo da meta
- Location: tests\e2e\rf15-residual.integrated.spec.ts:27:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('heading', { name: 'Meta residual longa', exact: true })
Expected: 1
Received: 2
Timeout:  15000ms

Call log:
  - Expect "toHaveCount" getByRole('heading', { name: 'Meta residual longa', exact: true }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Meta residual longa', exact: true })
    33 × locator resolved to 2 elements
       - unexpected value "2"

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e3]:
    - generic [ref=f1e5]:
      - button "Abrir menu de navegação" [ref=f1e6] [cursor=pointer]
      - generic [ref=f1e8]: Controle Financeiro
    - main [ref=f1e10]:
      - generic [ref=f1e11]:
        - generic [ref=f1e13]:
          - heading "Metas & Objetivos" [level=1] [ref=f1e15]
          - button "Nova Meta" [ref=f1e16] [cursor=pointer]
        - main [ref=f1e18]:
          - generic [ref=f1e20]:
            - generic [ref=f1e21]:
              - generic [ref=f1e22]: Patrimônio Alvo
              - generic [ref=f1e30]: R$ 0,00
              - paragraph [ref=f1e31]:
                - text: de
                - generic [ref=f1e32]: R$ 1.000,00
                - text: previstos
            - generic [ref=f1e34]:
              - generic [ref=f1e35]: Conquista Global
              - generic [ref=f1e36]: 0%
          - heading "Seus Objetivos" [level=2] [ref=f1e40]
          - generic [ref=f1e42]:
            - generic:
              - generic:
                - generic:
                  - generic:
                    - heading "Meta residual longa" [level=3]
                    - generic:
                      - generic: Iniciando
                      - generic: 31/12/2027
              - generic:
                - generic:
                  - generic: R$ 0,00
                  - generic: 0%
          - region "Histórico de compras" [ref=f1e43]:
            - heading "Histórico de compras" [level=2] [ref=f1e44]
            - paragraph [ref=f1e45]: Compras permanecem aqui mesmo após excluir o item ou a meta. Reembolso no cartão reduz a dívida e devolve o excedente como crédito no cartão.
            - button "Atualizar compras" [ref=f1e46]
            - paragraph [ref=f1e47]: Nenhuma compra registrada.
        - generic [ref=f1e48]:
          - generic [ref=f1e49] [cursor=pointer]
          - generic [ref=f1e50]:
            - button [ref=f1e51] [cursor=pointer]
            - generic [ref=f1e55]:
              - generic [ref=f1e62]:
                - paragraph [ref=f1e63]: Geral
                - generic [ref=f1e64]:
                  - heading "Meta residual longa" [level=3] [ref=f1e65]
                  - button [ref=f1e66] [cursor=pointer]
                - generic [ref=f1e70]:
                  - generic [ref=f1e71]: Iniciando
                  - generic [ref=f1e72]: "Alvo: R$ 1.000,00"
              - generic [ref=f1e74]:
                - generic [ref=f1e75]:
                  - paragraph [ref=f1e76]: Progresso Atual
                  - generic [ref=f1e77]: R$ 0,00
                - generic [ref=f1e79]:
                  - generic [ref=f1e80]: "Destinado nas fontes:"
                  - generic [ref=f1e84]: R$ 0,00
              - generic [ref=f1e85]:
                - button "Checklist" [ref=f1e86] [cursor=pointer]
                - button "Histórico" [ref=f1e90] [cursor=pointer]
            - generic [ref=f1e96]:
              - button "Adicionar Item" [ref=f1e97] [cursor=pointer]
              - list [ref=f1e99]:
                - listitem [ref=f1e100]:
                  - generic [ref=f1e102]:
                    - button "Comprar Item 0 longo para rolagem da meta" [ref=f1e111] [cursor=pointer]
                    - paragraph [ref=f1e115]: Item 0 longo para rolagem da meta
                    - generic [ref=f1e116]:
                      - generic [ref=f1e117]: R$ 100,00
                      - button "Remover item" [ref=f1e118] [cursor=pointer]
                - listitem [ref=f1e122]:
                  - generic [ref=f1e124]:
                    - button "Comprar Item 1 longo para rolagem da meta" [ref=f1e133] [cursor=pointer]
                    - paragraph [ref=f1e137]: Item 1 longo para rolagem da meta
                    - generic [ref=f1e138]:
                      - generic [ref=f1e139]: R$ 100,00
                      - button "Remover item" [ref=f1e140] [cursor=pointer]
                - listitem [ref=f1e144]:
                  - generic [ref=f1e146]:
                    - button "Comprar Item 2 longo para rolagem da meta" [ref=f1e155] [cursor=pointer]
                    - paragraph [ref=f1e159]: Item 2 longo para rolagem da meta
                    - generic [ref=f1e160]:
                      - generic [ref=f1e161]: R$ 100,00
                      - button "Remover item" [ref=f1e162] [cursor=pointer]
                - listitem [ref=f1e166]:
                  - generic [ref=f1e168]:
                    - button "Comprar Item 3 longo para rolagem da meta" [ref=f1e177] [cursor=pointer]
                    - paragraph [ref=f1e181]: Item 3 longo para rolagem da meta
                    - generic [ref=f1e182]:
                      - generic [ref=f1e183]: R$ 100,00
                      - button "Remover item" [ref=f1e184] [cursor=pointer]
                - listitem [ref=f1e188]:
                  - generic [ref=f1e190]:
                    - button "Comprar Item 4 longo para rolagem da meta" [ref=f1e199] [cursor=pointer]
                    - paragraph [ref=f1e203]: Item 4 longo para rolagem da meta
                    - generic [ref=f1e204]:
                      - generic [ref=f1e205]: R$ 100,00
                      - button "Remover item" [ref=f1e206] [cursor=pointer]
                - listitem [ref=f1e210]:
                  - generic [ref=f1e212]:
                    - button "Comprar Item 5 longo para rolagem da meta" [ref=f1e221] [cursor=pointer]
                    - paragraph [ref=f1e225]: Item 5 longo para rolagem da meta
                    - generic [ref=f1e226]:
                      - generic [ref=f1e227]: R$ 100,00
                      - button "Remover item" [ref=f1e228] [cursor=pointer]
                - listitem [ref=f1e232]:
                  - generic [ref=f1e234]:
                    - button "Comprar Item 6 longo para rolagem da meta" [ref=f1e243] [cursor=pointer]
                    - paragraph [ref=f1e247]: Item 6 longo para rolagem da meta
                    - generic [ref=f1e248]:
                      - generic [ref=f1e249]: R$ 100,00
                      - button "Remover item" [ref=f1e250] [cursor=pointer]
                - listitem [ref=f1e254]:
                  - generic [ref=f1e256]:
                    - button "Comprar Item 7 longo para rolagem da meta" [ref=f1e265] [cursor=pointer]
                    - paragraph [ref=f1e269]: Item 7 longo para rolagem da meta
                    - generic [ref=f1e270]:
                      - generic [ref=f1e271]: R$ 100,00
                      - button "Remover item" [ref=f1e272] [cursor=pointer]
                - listitem [ref=f1e276]:
                  - generic [ref=f1e278]:
                    - button "Comprar Item 8 longo para rolagem da meta" [ref=f1e287] [cursor=pointer]
                    - paragraph [ref=f1e291]: Item 8 longo para rolagem da meta
                    - generic [ref=f1e292]:
                      - generic [ref=f1e293]: R$ 100,00
                      - button "Remover item" [ref=f1e294] [cursor=pointer]
                - listitem [ref=f1e298]:
                  - generic [ref=f1e300]:
                    - button "Comprar Item 9 longo para rolagem da meta" [ref=f1e309] [cursor=pointer]
                    - paragraph [ref=f1e313]: Item 9 longo para rolagem da meta
                    - generic [ref=f1e314]:
                      - generic [ref=f1e315]: R$ 100,00
                      - button "Remover item" [ref=f1e316] [cursor=pointer]
            - generic [ref=f1e320]:
              - button "Deletar Meta" [ref=f1e321] [cursor=pointer]
              - button "Aporte Avulso" [ref=f1e322] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=f1e329] [cursor=pointer]
  - alert [ref=f1e333]
```

# Test source

```ts
  1  | import {expect, test, type Page} from '@playwright/test';
  2  | import {writeFile} from 'node:fs/promises';
  3  | import path from 'node:path';
  4  | import {registerSyntheticUser, syntheticUser} from './support/synthetic-auth';
  5  | import {settleVisual} from './support/rf15-visual';
  6  | 
  7  | const dir = process.env.CF_REVIEW_EVIDENCE!;
  8  | async function start(page: Page, key: string) {
  9  |   await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
  10 |   await registerSyntheticUser(page, syntheticUser('A', process.env.CF_E2E_NAMESPACE + key));
  11 |   await page.setViewportSize({width: 360, height: 800});
  12 | }
  13 | async function post(page: Page, url: string, data: unknown) {
  14 |   const response = await page.request.post('/api' + url, {data});
  15 |   expect(response.ok(), await response.text()).toBe(true);
  16 |   return response.json();
  17 | }
  18 | async function evidence(page: Page, name: string) {
  19 |   await settleVisual(page);
  20 |   await page.screenshot({path: path.join(dir, name + '.png')});
  21 |   await writeFile(path.join(dir, name + '.json'), JSON.stringify({
  22 |     snapshot: await page.locator('body').ariaSnapshot(),
  23 |     focus: await page.evaluate(() => ({tag: document.activeElement?.tagName, label: document.activeElement?.getAttribute('aria-label')})),
  24 |   }, null, 2));
  25 | }
  26 | 
  27 | test('Residual CF014: Escape no detalhe longo da meta', async ({page}) => {
  28 |   await start(page, '-goal');
  29 |   const goal = await post(page, '/goals', {title:'Meta residual longa', type:'MONETARY', targetValue:1000, deadline:'2027-12-31', color:'BLUE', useChecklist:true});
  30 |   for (let i = 0; i < 10; i++) await post(page, `/goals/${goal.id}/items`, {name:`Item ${i} longo para rolagem da meta`, estimatedPrice:100});
  31 |   await page.goto('/metas');
  32 |   await page.getByText(goal.title, {exact:true}).click();
  33 |   await page.getByText('Item 9 longo para rolagem da meta', {exact:true}).scrollIntoViewIfNeeded();
  34 |   await evidence(page, 'goal-before-escape');
  35 |   await page.keyboard.press('Escape');
  36 |   await evidence(page, 'goal-after-escape');
> 37 |   await expect(page.getByRole('heading', {name:goal.title, exact:true})).toHaveCount(1);
     |                                                                          ^ Error: expect(locator).toHaveCount(expected) failed
  38 |   await expect(page.getByRole('button', {name:`Ver detalhes da meta ${goal.title}`})).toBeFocused();
  39 | });
  40 | 
  41 | test('Residual CF014: Escape no detalhe diário do hábito', async ({page}) => {
  42 |   await start(page, '-habit');
  43 |   const habit = await post(page, '/habits', {name:'Hábito residual diário', description:'Descrição sintética extensa para verificar as ações e o calendário. '.repeat(3), frequency:'DAILY', icon:'Flame', color:'BLUE'});
  44 |   await page.goto('/habitos');
  45 |   const opener = page.getByRole('button', {name:`Ver detalhes do hábito ${habit.name}`});
  46 |   await opener.focus(); await page.keyboard.press('Enter');
  47 |   const detail = page.locator('form').filter({hasText:habit.description});
  48 |   await expect(detail).toBeVisible();
  49 |   await evidence(page, 'habit-before-escape');
  50 |   await page.keyboard.press('Escape');
  51 |   await evidence(page, 'habit-after-escape');
  52 |   await expect(detail).toHaveCount(0);
  53 |   await expect(opener).toBeFocused();
  54 | });
  55 | 
```