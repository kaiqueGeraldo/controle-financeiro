# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf15-residual.integrated.spec.ts >> Residual CF014: rascunhos, camadas e retorno dos detalhes
- Location: tests\e2e\rf15-residual.integrated.spec.ts:94:5

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('button', { name: 'Ver detalhes do hábito Hábito rascunho' })
Expected: focused
Received: inactive
Timeout:  15000ms

Call log:
  - Expect "toBeFocused" getByRole('button', { name: 'Ver detalhes do hábito Hábito rascunho' }) with timeout 15000ms
  - waiting for getByRole('button', { name: 'Ver detalhes do hábito Hábito rascunho' })
    33 × locator resolved to <div tabindex="0" role="button" aria-label="Ver detalhes do hábito Hábito rascunho" class="bg-bg-surface border border-border-divider rounded-2xl p-5 flex flex-col justify-between transition-colors h-full min-h-40 cursor-pointer hover:border-border-divider shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-bg-base">…</div>
       - unexpected value "inactive"

```

```yaml
- button "Ver detalhes do hábito Hábito rascunho":
  - heading "Hábito rascunho" [level=3]
  - text: 0 dias seguidos
  - button "Marcar Feito"
```

# Test source

```ts
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
  85  |       await expect(d.getByText('janeiro de 2027',{exact:true})).toBeVisible();
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
  128 |   const debug: unknown[] = [];
  129 |   if (process.env.CF_ESCAPE_DEBUG === '1') {
  130 |     const cdp = await page.context().newCDPSession(page);
  131 |     await cdp.send('Debugger.enable');
  132 |     cdp.on('Debugger.paused', async event => {
  133 |       try {
  134 |         const result = await cdp.send('Debugger.evaluateOnCallFrame', {callFrameId:event.callFrames[0].callFrameId,
  135 |           expression:'JSON.stringify({editing:editing.current,saving:isSaving,ref:dialogRef.current?.tagName,active:document.activeElement?.tagName})', returnByValue:true});
  136 |         debug.push(result);
  137 |       } finally {await cdp.send('Debugger.resume');}
  138 |     });
  139 |     for (const file of await readdir('.next/dev/static/chunks')) {
  140 |       if (!file.endsWith('.js') || !file.startsWith('src_')) continue;
  141 |       const source = await readFile(path.join('.next/dev/static/chunks',file),'utf8');
  142 |       const marker = source.indexOf('Escape nativo pode');
  143 |       if (marker < 0) continue;
  144 |       const lineNumber = source.slice(0,source.indexOf('const handleClose =',marker)).split('\n').length;
  145 |       await cdp.send('Debugger.setBreakpointByUrl',{lineNumber,urlRegex:file.replaceAll('.','\\.')});
  146 |     }
  147 |   }
  148 |   await page.evaluate(() => {
  149 |     const events: unknown[] = [];
  150 |     (window as unknown as {escapeEvents: unknown[]}).escapeEvents = events;
  151 |     document.addEventListener('keydown', event => {
  152 |       if(event.key === 'Escape') events.push({phase:'capture',time:performance.now(),prevented:event.defaultPrevented,active:document.activeElement?.outerHTML.slice(0,300)});
  153 |     },true);
  154 |     window.addEventListener('keydown', event => {
  155 |       if(event.key === 'Escape') events.push({phase:'bubble',time:performance.now(),prevented:event.defaultPrevented});
  156 |     });
  157 |   });
  158 |   await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  159 |   await evidence(page,'habit-rapid-escape');
  160 |   await writeFile(path.join(dir,'habit-handler-debug.json'),JSON.stringify(debug,null,2));
  161 |   await writeFile(path.join(dir,'habit-escape-events.json'),JSON.stringify(await page.evaluate(() => (window as unknown as {escapeEvents: unknown[]}).escapeEvents),null,2));
> 162 |   await expect(habitOpener).toBeFocused();
      |                             ^ Error: expect(locator).toBeFocused() failed
  163 |   await page.reload(); await expect(habitOpener).toBeVisible(); await expect(page.getByText('Rascunho hábito')).toHaveCount(0);
  164 | });
  165 | 
```