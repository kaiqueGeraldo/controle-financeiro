# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf15-independent.integrated.spec.ts >> Independente: contas privadas não expõem valores durante animação inicial
- Location: tests\e2e\rf15-independent.integrated.spec.ts:9:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 66

- Array []
+ Array [
+   Object {
+     "alpha": 0.03,
+     "color": "rgba(255, 255, 255, 0.03)",
+     "hidden": true,
+     "opacity": 0.941099,
+     "text": "R$ 1.234,56",
+     "time": 5435,
+   },
+   Object {
+     "alpha": 0.0312882,
+     "color": "oklab(0.706992 -0.043759 -0.159072 / 0.0312882)",
+     "hidden": true,
+     "opacity": 0.941099,
+     "text": "R$ 1.234,56",
+     "time": 5436,
+   },
+   Object {
+     "alpha": 0.008,
+     "color": "rgba(255, 255, 255, 0.008)",
+     "hidden": true,
+     "opacity": 0.923117,
+     "text": "R$ 1.234,56",
+     "time": 5449,
+   },
+   Object {
+     "alpha": 0.00707174,
+     "color": "oklab(0.706992 -0.043759 -0.159072 / 0.00707174)",
+     "hidden": true,
+     "opacity": 0.923117,
+     "text": "R$ 1.234,56",
+     "time": 5450,
+   },
+   Object {
+     "alpha": 0.008,
+     "color": "rgba(255, 255, 255, 0.008)",
+     "hidden": true,
+     "opacity": 0.923115,
+     "text": "R$ 1.234,56",
+     "time": 5461,
+   },
+   Object {
+     "alpha": 0.00706997,
+     "color": "oklab(0.706992 -0.043759 -0.159072 / 0.00706997)",
+     "hidden": true,
+     "opacity": 0.923115,
+     "text": "R$ 1.234,56",
+     "time": 5462,
+   },
+   Object {
+     "alpha": 0.00168768,
+     "color": "oklab(0.706992 -0.043759 -0.159072 / 0.00168768)",
+     "hidden": true,
+     "opacity": 0.913282,
+     "text": "R$ 1.234,56",
+     "time": 5476,
+   },
+   Object {
+     "alpha": 2.83561e-10,
+     "color": "oklab(0.706992 -0.043759 -0.159072 / 2.83561e-10)",
+     "hidden": true,
+     "opacity": 0.902926,
+     "text": "R$ 1.234,56",
+     "time": 5489,
+   },
+ ]
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
          - heading "Minhas Contas" [level=1] [ref=f1e15]
          - button "Nova Conta" [ref=f1e17] [cursor=pointer]
        - main [ref=f1e19]:
          - paragraph [ref=f1e20]:
            - text: "Posição atual em 15/01/2027: inclui contas arquivadas. Saldo em contas arquivadas:"
            - generic:
              - generic [aria-hidden]: R$ 1.234,56
              - generic: Valor oculto
            - text: .
          - region "Posição de contas arquivadas" [ref=f1e21]:
            - paragraph [ref=f1e22]:
              - text: Conta arquivada animação · Arquivada ·
              - generic:
                - generic [aria-hidden]: R$ 1.234,56
                - generic: Valor oculto
          - generic [ref=f1e23]:
            - generic [ref=f1e29]:
              - paragraph [ref=f1e30]: Subtotal de ativos conhecidos
              - generic:
                - generic [aria-hidden]: R$ 1.234,56
                - generic: Valor oculto
              - paragraph [ref=f1e31]: Dívida e crédito de cartões não incluídos.
            - generic [ref=f1e38]:
              - paragraph [ref=f1e39]: Conta Corrente
              - generic:
                - generic [aria-hidden]: R$ 1.234,56
                - generic: Valor oculto
            - generic [ref=f1e45]:
              - paragraph [ref=f1e46]: Investimentos avaliados
              - generic:
                - generic [aria-hidden]: R$ 0,00
                - generic: Valor oculto
          - heading "Contas Ativas" [level=2] [ref=f1e48]
          - generic [ref=f1e49]:
            - generic "Ver extrato da conta Carteira Física" [ref=f1e51]:
              - generic [ref=f1e58]:
                - heading "Carteira Física" [level=3] [ref=f1e59]
                - paragraph [ref=f1e60]: Carteira Física
              - generic [ref=f1e61]:
                - paragraph [ref=f1e62]: Saldo Atual
                - generic:
                  - generic [aria-hidden]: R$ 0,00
                  - generic: Valor oculto
            - button "Nova Conta" [ref=f1e64] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=f1e73] [cursor=pointer]
  - alert [ref=f1e77]
```

# Test source

```ts
  1  | import {expect,test,type Page} from '@playwright/test';
  2  | import {writeFile} from 'node:fs/promises';
  3  | import path from 'node:path';
  4  | import {registerSyntheticUser,syntheticUser} from './support/synthetic-auth';
  5  | import {settleVisual} from './support/rf15-visual';
  6  | const dir=process.env.CF_REVIEW_EVIDENCE!;
  7  | async function post(page:Page,url:string,data:unknown){const r=await page.request.post('/api'+url,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;}
  8  | 
  9  | test('Independente: contas privadas não expõem valores durante animação inicial',async({page})=>{
  10 |  await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
  11 |  await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-accounts-animation'));
  12 |  const a=await post(page,'/accounts',{name:'Conta arquivada animação',type:'CHECKING',initialBalance:1234.56,color:'#10b981'});
  13 |  expect((await page.request.delete('/api/accounts/'+a.id)).ok()).toBe(true);
  14 |  expect((await page.request.patch('/api/users/me/preferences',{data:{privacyMode:true}})).ok()).toBe(true);
  15 |  const samples:unknown[]=[];let firstShot:Promise<void>|undefined;
  16 |  await page.exposeFunction('recordPrivateFrame',(sample:unknown)=>{
  17 |    samples.push(sample);
  18 |    firstShot??=page.screenshot({path:path.join(dir,'accounts-animation-first.png')}).then(()=>undefined);
  19 |  });
  20 |  await page.addInitScript(()=>{
  21 |    let recorded=0;
  22 |    const frame=()=>{
  23 |      for(const el of document.querySelectorAll('main span')){
  24 |        if(el.children.length!==0 || !/1\.234,56/.test(el.textContent??''))continue;
  25 |        const style=getComputedStyle(el),rect=el.getBoundingClientRect();
  26 |        const alpha=style.color==='transparent'?0:style.color.startsWith('rgba(')?Number(style.color.split(',').at(-1)!.replace(')','')):style.color.includes('/')?Number(style.color.split('/').at(-1)!.replace(')','')):1;
  27 |        let opacity=1;for(let node:Element|null=el;node;node=node.parentElement)opacity*=Number(getComputedStyle(node).opacity);
  28 |        const visible=rect.width>0&&rect.height>0&&rect.top<innerHeight&&rect.bottom>0&&style.visibility==='visible'&&opacity>0;
  29 |        if(visible&&alpha>0&&recorded++<30){
  30 |          void (window as unknown as {recordPrivateFrame:(sample:unknown)=>Promise<void>}).recordPrivateFrame({time:performance.now(),color:style.color,alpha,opacity,hidden:!!el.closest('[aria-hidden="true"]'),text:el.textContent});
  31 |        }
  32 |      }
  33 |      requestAnimationFrame(frame);
  34 |    };requestAnimationFrame(frame);
  35 |  });
  36 |  await page.setViewportSize({width:360,height:800});await page.goto('/contas');await expect(page.getByRole('region',{name:'Posição de contas arquivadas'})).toBeVisible();await settleVisual(page);
  37 |  await firstShot;await writeFile(path.join(dir,'accounts-animation.json'),JSON.stringify({samples,accessible:await page.locator('main').first().ariaSnapshot()},null,2));
  38 |  await page.screenshot({path:path.join(dir,'accounts-animation-stable.png')});
> 39 |  expect(samples).toEqual([]);
     |                  ^ Error: expect(received).toEqual(expected) // deep equality
  40 | });
  41 | 
  42 | test('Independente: fatura aberta atravessa vencimento e revalida ao ganhar foco',async({page})=>{
  43 |  await page.clock.setFixedTime(new Date('2027-02-06T02:59:59Z'));
  44 |  await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-midnight'));
  45 |  const c=await post(page,'/cards',{name:'Virada independente',last4Digits:'4242',limit:1000,closingDay:31,dueDay:5,brand:'VISA',color:'#7c3aed'});
  46 |  const cats=await (await page.request.get('/api/categories?type=EXPENSE')).json();
  47 |  await post(page,'/cards/transaction',{cardId:c.id,categoryId:cats[0].id,description:'Compra virada',amount:120,date:'2027-01-15',time:null,totalInstallments:1});
  48 |  await page.goto('/cartoes');await page.getByRole('button',{name:'Ver fatura de Virada independente, final 4242'}).click();
  49 |  const d=page.getByRole('dialog',{name:'Virada independente •••• 4242',exact:true});await d.getByRole('button',{name:'Mês anterior da fatura'}).click();
  50 |  await expect(d.getByText('Compra virada',{exact:true})).toBeVisible();await expect(d.getByRole('button',{name:'Adiantar Fatura'})).toBeVisible();
  51 |  await page.clock.setFixedTime(new Date('2027-02-06T03:00:00Z'));
  52 |  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  53 |  await settleVisual(page);
  54 |  await writeFile(path.join(dir,'midnight.json'),JSON.stringify({local:await page.evaluate(()=>new Date().toString()),ui:await d.innerText()},null,2));
  55 |  await page.screenshot({path:path.join(dir,'midnight.png')});
  56 |  await expect(d.getByRole('button',{name:'Pagar Atrasada'})).toBeVisible();
  57 | });
  58 | 
  59 | test('Independente: privacidade na navegação e descarte real do rascunho',async({page})=>{
  60 |  await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
  61 |  await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-transition'));
  62 |  const a=await post(page,'/accounts',{name:'Conta transição',type:'CHECKING',initialBalance:0,color:'#10b981'});
  63 |  const cats=await (await page.request.get('/api/categories?type=INCOME')).json();
  64 |  await post(page,'/transactions',{description:'Receita protegida independente',type:'INCOME',amount:1300,date:'2027-01-15',accountId:a.id,categoryId:cats[0].id,isPaid:true});
  65 |  await page.goto('/configuracoes');const toggle=page.getByRole('switch',{name:'Modo Privacidade'});await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','true');
  66 |  const exposed:string[]=[];
  67 |  await page.exposeFunction('recordExposure',(text:string)=>exposed.push(text));
  68 |  await page.addInitScript(()=>{
  69 |    const inspect=()=>{
  70 |      for(const el of document.querySelectorAll('main span')){
  71 |        if(el.children.length===0 && /1\.300,00/.test(el.textContent??'')){
  72 |          const color=getComputedStyle(el).color;
  73 |          const hidden=!!el.closest('[aria-hidden="true"]');
  74 |          const box=el.getBoundingClientRect();
  75 |          if(box.width && box.height && (!hidden || (color!=='rgba(0, 0, 0, 0)' && color!=='transparent'))){
  76 |            void (window as unknown as {recordExposure:(text:string)=>Promise<void>}).recordExposure(JSON.stringify({hidden,color}));
  77 |          }
  78 |        }
  79 |      }
  80 |    };
  81 |    new MutationObserver(inspect).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-hidden','class']});
  82 |    const frame=()=>{inspect();requestAnimationFrame(frame);};requestAnimationFrame(frame);
  83 |  });
  84 |  await page.goto('/extrato');await expect(page.getByText('Receita protegida independente',{exact:true})).toBeVisible();await settleVisual(page);
  85 |  const snapshot=await page.locator('main').first().ariaSnapshot();expect(snapshot).not.toMatch(/1\.300,00/);
  86 |  await writeFile(path.join(dir,'privacy-transition.json'),JSON.stringify({snapshot,exposed},null,2));await page.screenshot({path:path.join(dir,'privacy-transition.png')});
  87 |  expect.soft(exposed).toEqual([]);
  88 |  await page.goto('/configuracoes');await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','false');await page.goto('/extrato');
  89 |  const opener=page.getByRole('button',{name:'Ver detalhes de Receita protegida independente'});await opener.focus();await page.keyboard.press('Enter');
  90 |  const d=page.getByRole('dialog',{name:'Detalhes de Receita protegida independente'});await expect(d).toBeVisible();expect(await d.ariaSnapshot()).toMatch(/1\.300,00/);
  91 |  await d.getByRole('button',{name:'Editar',exact:true}).click();const description=d.locator('input').first();const old=await description.inputValue();await description.fill('Rascunho descartável');await page.keyboard.press('Escape');await expect(d.getByRole('button',{name:'Editar',exact:true})).toBeVisible();
  92 |  await d.getByRole('button',{name:'Editar',exact:true}).click();await expect(description).toHaveValue(old);await page.keyboard.press('Escape');await page.keyboard.press('Escape');await expect(opener).toBeFocused();
  93 |  await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
  94 |  await page.reload();await expect(page.getByText('Receita protegida independente',{exact:true})).toBeVisible();await expect(page.getByText('Rascunho descartável',{exact:true})).toHaveCount(0);
  95 | });
  96 | 
```