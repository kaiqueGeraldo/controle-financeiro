# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf15-residual-privacy.integrated.spec.ts >> Residual RF15-02: ativação no meio da transição, dados novos privados e liberação
- Location: tests\e2e\rf15-residual-privacy.integrated.spec.ts:6:5

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /1\.734,56/
Received string:  "- main:
  - heading \"Minhas Contas\" [level=1]
  - paragraph: Gerencie onde seu dinheiro está guardado.
  - button \"Nova Conta\"
  - main:
    - paragraph: Subtotal de ativos conhecidos
    - text: Posição indisponível
    - paragraph: Dívida e crédito de cartões não incluídos.
    - paragraph: Conta Corrente
    - text: Posição indisponível
    - paragraph: Investimentos avaliados
    - text: R$ 0,00
    - heading \"Contas Ativas\" [level=2]"
```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e2]:
    - complementary "Navegação principal" [ref=f2e3]:
      - generic [ref=f2e4]:
        - generic [ref=f2e5]: P
        - generic [ref=f2e6]:
          - heading "Pessoa Sintética A" [level=2] [ref=f2e7]
          - generic [ref=f2e8]: cf003-a-closure-df7d8281-privacy-cycle@example.invalid
      - navigation [ref=f2e10]:
        - link "Dashboard" [ref=f2e11] [cursor=pointer]:
          - /url: /
        - link "Minhas Contas" [ref=f2e19] [cursor=pointer]:
          - /url: /contas
        - link "Extrato" [ref=f2e24] [cursor=pointer]:
          - /url: /extrato
        - link "Cartões de Crédito" [ref=f2e30] [cursor=pointer]:
          - /url: /cartoes
        - link "Planejamento" [ref=f2e35] [cursor=pointer]:
          - /url: /planejamento
        - link "Metas" [ref=f2e40] [cursor=pointer]:
          - /url: /metas
        - link "Investimentos" [ref=f2e47] [cursor=pointer]:
          - /url: /investimentos
        - link "Resumo Anual" [ref=f2e55] [cursor=pointer]:
          - /url: /resumo-anual
        - link "Hábitos" [ref=f2e62] [cursor=pointer]:
          - /url: /habitos
      - generic [ref=f2e69]:
        - button "Privacidade" [active] [ref=f2e70] [cursor=pointer]
        - button "Configurações" [ref=f2e78] [cursor=pointer]
        - button "Sair da Conta" [ref=f2e83] [cursor=pointer]
    - main [ref=f2e89]:
      - generic [ref=f2e90]:
        - generic [ref=f2e92]:
          - generic [ref=f2e93]:
            - heading "Minhas Contas" [level=1] [ref=f2e94]
            - paragraph [ref=f2e95]: Gerencie onde seu dinheiro está guardado.
          - generic [ref=f2e96]:
            - button "Organizar" [ref=f2e97] [cursor=pointer]
            - button "Nova Conta" [ref=f2e102] [cursor=pointer]
        - main [ref=f2e105]:
          - paragraph [ref=f2e106]:
            - text: "Posição atual em 15/01/2027: inclui contas arquivadas. Saldo em contas arquivadas:"
            - generic [ref=f2e107]: R$ 0,00
            - text: .
          - generic [ref=f2e108]:
            - generic [ref=f2e114]:
              - paragraph [ref=f2e115]: Subtotal de ativos conhecidos
              - generic [ref=f2e116]: R$ 1.734,56
              - paragraph [ref=f2e117]: Dívida e crédito de cartões não incluídos.
            - generic [ref=f2e124]:
              - paragraph [ref=f2e125]: Conta Corrente
              - generic [ref=f2e126]: R$ 1.734,56
            - generic [ref=f2e132]:
              - paragraph [ref=f2e133]: Investimentos avaliados
              - generic [ref=f2e134]: R$ 0,00
          - heading "Contas Ativas" [level=2] [ref=f2e136]
          - generic [ref=f2e137]:
            - button "Ver extrato da conta Carteira Física" [ref=f2e139] [cursor=pointer]:
              - generic [ref=f2e140]:
                - generic [ref=f2e146]:
                  - heading "Carteira Física" [level=3] [ref=f2e147]
                  - paragraph [ref=f2e148]: Carteira Física
                - button "Opções da conta Carteira Física" [ref=f2e150]
              - generic [ref=f2e155]:
                - paragraph [ref=f2e156]: Saldo Atual
                - generic [ref=f2e157]: R$ 0,00
            - button "Ver extrato da conta Conta ciclo privado" [ref=f2e160] [cursor=pointer]:
              - generic [ref=f2e161]:
                - generic [ref=f2e168]:
                  - heading "Conta ciclo privado" [level=3] [ref=f2e169]
                  - paragraph [ref=f2e170]: Conta Corrente
                - button "Opções da conta Conta ciclo privado" [ref=f2e172]
              - generic [ref=f2e177]:
                - paragraph [ref=f2e178]: Saldo Atual
                - generic [ref=f2e179]: R$ 1.234,56
            - button "Ver extrato da conta Conta nova privada" [ref=f2e182] [cursor=pointer]:
              - generic [ref=f2e183]:
                - generic [ref=f2e190]:
                  - heading "Conta nova privada" [level=3] [ref=f2e191]
                  - paragraph [ref=f2e192]: Conta Corrente
                - button "Opções da conta Conta nova privada" [ref=f2e194]
              - generic [ref=f2e199]:
                - paragraph [ref=f2e200]: Saldo Atual
                - generic [ref=f2e201]: R$ 500,00
            - button "Nova Conta" [ref=f2e203] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=f2e212] [cursor=pointer]
  - alert [ref=f2e216]
```

# Test source

```ts
  1  | import {expect, test} from '@playwright/test';
  2  | import {writeFile} from 'node:fs/promises';
  3  | import path from 'node:path';
  4  | import {registerSyntheticUser, syntheticUser} from './support/synthetic-auth';
  5  | 
  6  | test('Residual RF15-02: ativação no meio da transição, dados novos privados e liberação', async ({page}) => {
  7  |   const dir = process.env.CF_REVIEW_EVIDENCE!;
  8  |   await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
  9  |   await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-privacy-cycle'));
  10 |   const create = async (name: string, initialBalance: number) => {
  11 |     const r = await page.request.post('/api/accounts',{data:{name,type:'CHECKING',initialBalance,color:'#10b981'}});
  12 |     expect(r.ok(),await r.text()).toBe(true);
  13 |   };
  14 |   await create('Conta ciclo privado',1234.56);
  15 |   await page.setViewportSize({width:1440,height:900});
  16 |   await page.goto('/contas');
  17 |   await expect(page.getByText('Conta ciclo privado',{exact:true})).toBeVisible();
  18 |   const samples: unknown[] = [];
  19 |   await page.exposeFunction('privateCycleSample',(sample: unknown) => samples.push(sample));
  20 |   await page.evaluate(() => {
  21 |     const inspect = () => {
  22 |       for (const el of document.querySelectorAll('main [aria-hidden="true"]')) {
  23 |         if (!/1\.234,56|1\.734,56|500,00/.test(el.textContent ?? '')) continue;
  24 |         const style = getComputedStyle(el), box = el.getBoundingClientRect();
  25 |         const alpha = style.color === 'transparent' ? 0 : style.color.startsWith('rgba(') ? Number(style.color.split(',').at(-1)!.replace(')','')) : style.color.includes('/') ? Number(style.color.split('/').at(-1)!.replace(')','')) : 1;
  26 |         void (window as unknown as {privateCycleSample:(sample: unknown) => Promise<void>}).privateCycleSample({
  27 |           text:el.textContent,visibility:style.visibility,alpha,width:box.width,height:box.height,
  28 |           exposed:style.visibility === 'visible' && alpha > 0 && box.width > 0 && box.height > 0,
  29 |         });
  30 |       }
  31 |     };
  32 |     new MutationObserver(inspect).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-hidden','class','style']});
  33 |     let frames = 0;
  34 |     const frame = () => {inspect(); if (++frames < 600) requestAnimationFrame(frame);};
  35 |     requestAnimationFrame(frame);
  36 |     // Complemento controlado: congelar uma transição ancestral no ponto intermediário.
  37 |     // A animação Framer original permanece coberta pelo probe independente intacto.
  38 |     const transition = document.querySelector('main')!.animate([{opacity:0.3},{opacity:1}],{duration:300,fill:'both'});
  39 |     transition.pause(); transition.currentTime = 150;
  40 |   });
  41 |   await page.getByRole('button',{name:'Privacidade',exact:true}).click();
  42 |   await expect(page.locator('main [aria-hidden="true"]').filter({hasText:'1.234,56'}).first()).toBeAttached();
  43 |   expect(await page.locator('main').first().ariaSnapshot()).not.toMatch(/1\.234,56/);
  44 |   await page.screenshot({path:path.join(dir,'privacy-mid-transition.png')});
  45 |   await create('Conta nova privada',500);
  46 |   await page.evaluate(() => window.dispatchEvent(new Event('refreshFinance')));
  47 |   await expect(page.getByText('Conta nova privada',{exact:true})).toBeVisible();
  48 |   await expect(page.locator('main [aria-hidden="true"]').filter({hasText:'1.734,56'}).first()).toBeAttached();
  49 |   expect(await page.locator('main').first().ariaSnapshot()).not.toMatch(/1\.234,56|1\.734,56|500,00/);
  50 |   await page.screenshot({path:path.join(dir,'privacy-data-change.png')});
  51 |   await page.reload();
  52 |   await expect(page.getByText('Conta nova privada',{exact:true})).toBeVisible();
  53 |   expect(await page.locator('main').first().ariaSnapshot()).not.toMatch(/1\.234,56|1\.734,56|500,00/);
  54 |   await page.getByRole('button',{name:'Privacidade',exact:true}).click();
  55 |   await expect(page.locator('main [aria-hidden="true"]').filter({hasText:'1.734,56'})).toHaveCount(0);
> 56 |   expect(await page.locator('main').first().ariaSnapshot()).toMatch(/1\.734,56/);
     |                                                             ^ Error: expect(received).toMatch(expected)
  57 |   await page.screenshot({path:path.join(dir,'privacy-released.png')});
  58 |   await writeFile(path.join(dir,'privacy-cycle.json'),JSON.stringify(samples,null,2));
  59 |   expect(samples.length).toBeGreaterThan(0);
  60 |   expect(samples.filter(sample => (sample as {exposed:boolean}).exposed)).toEqual([]);
  61 | });
  62 | 
```