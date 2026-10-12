# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf15-residual.integrated.spec.ts >> Residual CF014: Escape no detalhe diário do hábito
- Location: tests\e2e\rf15-residual.integrated.spec.ts:41:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('form').filter({ hasText: 'Descrição sintética extensa para verificar as ações e o calendário. Descrição sintética extensa para verificar as ações e o calendário. Descrição sintética extensa para verificar as ações e o calendário. ' })
Expected: 0
Received: 1
Timeout:  15000ms

Call log:
  - Expect "toHaveCount" locator('form').filter({ hasText: 'Descrição sintética extensa para verificar as ações e o calendário. Descrição sintética extensa para verificar as ações e o calendário. Descrição sintética extensa para verificar as ações e o calendário. ' }) with timeout 15000ms
  - waiting for locator('form').filter({ hasText: 'Descrição sintética extensa para verificar as ações e o calendário. Descrição sintética extensa para verificar as ações e o calendário. Descrição sintética extensa para verificar as ações e o calendário. ' })
    33 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e3]:
    - generic [ref=f1e5]:
      - button "Abrir menu de navegação" [ref=f1e6] [cursor=pointer]
      - generic [ref=f1e8]: Controle Financeiro
    - main [ref=f1e10]:
      - generic [ref=f1e11]:
        - generic [ref=f1e13]:
          - heading "Hábitos" [level=1] [ref=f1e15]
          - button "Novo Hábito" [ref=f1e17] [cursor=pointer]
        - main [ref=f1e19]:
          - generic [ref=f1e25]:
            - heading "O Perdão Automático está ativo" [level=3] [ref=f1e26]
            - paragraph [ref=f1e27]: "Baseado no livro \"Hábitos Atômicos\": se você esquecer de registrar um dia por um imprevisto (mas tiver cumprido no dia anterior), o sistema protegerá sua ofensiva. Nunca falhe duas vezes."
          - generic [ref=f1e28]:
            - button "Ver detalhes do hábito Hábito residual diário" [active]:
              - generic:
                - generic:
                  - generic:
                    - heading "Hábito residual diário" [level=3]
                    - generic:
                      - generic: "0"
                      - text: dias seguidos
              - button "Marcar Feito"
        - generic [ref=f1e29]:
          - generic [ref=f1e30] [cursor=pointer]
          - generic [ref=f1e31]:
            - button [ref=f1e32] [cursor=pointer]
            - generic [ref=f1e36]:
              - generic [ref=f1e43]:
                - heading "Hábito residual diário" [level=3] [ref=f1e44]
                - paragraph [ref=f1e45]: Descrição sintética extensa para verificar as ações e o calendário. Descrição sintética extensa para verificar as ações e o calendário. Descrição sintética extensa para verificar as ações e o calendário.
              - generic [ref=f1e46]:
                - generic [ref=f1e50]:
                  - paragraph [ref=f1e51]: Ofensiva Atual
                  - paragraph [ref=f1e52]: 0 dias
                - generic [ref=f1e53]:
                  - paragraph [ref=f1e54]: Recorde Pessoal
                  - paragraph [ref=f1e55]: 0 dias
            - generic [ref=f1e56]:
              - paragraph [ref=f1e57]: Últimos 28 dias · horário de Brasília
              - generic [ref=f1e58]:
                - generic "19/12/2026" [ref=f1e59]
                - generic "20/12/2026" [ref=f1e60]
                - generic "21/12/2026" [ref=f1e61]
                - generic "22/12/2026" [ref=f1e62]
                - generic "23/12/2026" [ref=f1e63]
                - generic "24/12/2026" [ref=f1e64]
                - generic "25/12/2026" [ref=f1e65]
                - generic "26/12/2026" [ref=f1e66]
                - generic "27/12/2026" [ref=f1e67]
                - generic "28/12/2026" [ref=f1e68]
                - generic "29/12/2026" [ref=f1e69]
                - generic "30/12/2026" [ref=f1e70]
                - generic "31/12/2026" [ref=f1e71]
                - generic "01/01/2027" [ref=f1e72]
                - generic "02/01/2027" [ref=f1e73]
                - generic "03/01/2027" [ref=f1e74]
                - generic "04/01/2027" [ref=f1e75]
                - generic "05/01/2027" [ref=f1e76]
                - generic "06/01/2027" [ref=f1e77]
                - generic "07/01/2027" [ref=f1e78]
                - generic "08/01/2027" [ref=f1e79]
                - generic "09/01/2027" [ref=f1e80]
                - generic "10/01/2027" [ref=f1e81]
                - generic "11/01/2027" [ref=f1e82]
                - generic "12/01/2027" [ref=f1e83]
                - generic "13/01/2027" [ref=f1e84]
                - generic "14/01/2027" [ref=f1e85]
                - generic "15/01/2027" [ref=f1e86]
            - generic [ref=f1e87]:
              - button "Excluir" [ref=f1e88] [cursor=pointer]
              - button "Editar Hábito" [ref=f1e92] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=f1e98] [cursor=pointer]
  - alert [ref=f1e102]
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
  37 |   await expect(page.getByRole('heading', {name:goal.title, exact:true})).toHaveCount(1);
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
> 52 |   await expect(detail).toHaveCount(0);
     |                        ^ Error: expect(locator).toHaveCount(expected) failed
  53 |   await expect(opener).toBeFocused();
  54 | });
  55 | 
```