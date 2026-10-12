import {expect,test,type Page} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {registerSyntheticUser,syntheticUser} from './support/synthetic-auth';
import {settleVisual} from './support/rf15-visual';
const dir=process.env.CF_REVIEW_EVIDENCE!;
async function post(page:Page,url:string,data:unknown){const r=await page.request.post('/api'+url,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;}

test('Independente: contas privadas não expõem valores durante animação inicial',async({page})=>{
 await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
 await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-accounts-animation'));
 const a=await post(page,'/accounts',{name:'Conta arquivada animação',type:'CHECKING',initialBalance:1234.56,color:'#10b981'});
 expect((await page.request.delete('/api/accounts/'+a.id)).ok()).toBe(true);
 expect((await page.request.patch('/api/users/me/preferences',{data:{privacyMode:true}})).ok()).toBe(true);
 const samples:unknown[]=[];let firstShot:Promise<void>|undefined;
 await page.exposeFunction('recordPrivateFrame',(sample:unknown)=>{
   samples.push(sample);
   firstShot??=page.screenshot({path:path.join(dir,'accounts-animation-first.png')}).then(()=>undefined);
 });
 await page.addInitScript(()=>{
   let recorded=0;
   const frame=()=>{
     for(const el of document.querySelectorAll('main span')){
       if(el.children.length!==0 || !/1\.234,56/.test(el.textContent??''))continue;
       const style=getComputedStyle(el),rect=el.getBoundingClientRect();
       const alpha=style.color==='transparent'?0:style.color.startsWith('rgba(')?Number(style.color.split(',').at(-1)!.replace(')','')):style.color.includes('/')?Number(style.color.split('/').at(-1)!.replace(')','')):1;
       let opacity=1;for(let node:Element|null=el;node;node=node.parentElement)opacity*=Number(getComputedStyle(node).opacity);
       const visible=rect.width>0&&rect.height>0&&rect.top<innerHeight&&rect.bottom>0&&style.visibility==='visible'&&opacity>0;
       if(visible&&alpha>0&&recorded++<30){
         void (window as unknown as {recordPrivateFrame:(sample:unknown)=>Promise<void>}).recordPrivateFrame({time:performance.now(),color:style.color,alpha,opacity,hidden:!!el.closest('[aria-hidden="true"]'),text:el.textContent});
       }
     }
     requestAnimationFrame(frame);
   };requestAnimationFrame(frame);
 });
 await page.setViewportSize({width:360,height:800});await page.goto('/contas');await expect(page.getByRole('region',{name:'Posição de contas arquivadas'})).toBeVisible();await settleVisual(page);
 await firstShot;await writeFile(path.join(dir,'accounts-animation.json'),JSON.stringify({samples,accessible:await page.locator('main').first().ariaSnapshot()},null,2));
 await page.screenshot({path:path.join(dir,'accounts-animation-stable.png')});
 expect(samples).toEqual([]);
});

test('Independente: fatura aberta atravessa vencimento e revalida ao ganhar foco',async({page})=>{
 await page.clock.setFixedTime(new Date('2027-02-06T02:59:59Z'));
 await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-midnight'));
 const c=await post(page,'/cards',{name:'Virada independente',last4Digits:'4242',limit:1000,closingDay:31,dueDay:5,brand:'VISA',color:'#7c3aed'});
 const cats=await (await page.request.get('/api/categories?type=EXPENSE')).json();
 await post(page,'/cards/transaction',{cardId:c.id,categoryId:cats[0].id,description:'Compra virada',amount:120,date:'2027-01-15',time:null,totalInstallments:1});
 await page.goto('/cartoes');await page.getByRole('button',{name:'Ver fatura de Virada independente, final 4242'}).click();
 const d=page.getByRole('dialog',{name:'Virada independente •••• 4242',exact:true});await d.getByRole('button',{name:'Mês anterior da fatura'}).click();
 await expect(d.getByText('Compra virada',{exact:true})).toBeVisible();await expect(d.getByRole('button',{name:'Adiantar Fatura'})).toBeVisible();
 await page.clock.setFixedTime(new Date('2027-02-06T03:00:00Z'));
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await settleVisual(page);
 await writeFile(path.join(dir,'midnight.json'),JSON.stringify({local:await page.evaluate(()=>new Date().toString()),ui:await d.innerText()},null,2));
 await page.screenshot({path:path.join(dir,'midnight.png')});
 await expect(d.getByRole('button',{name:'Pagar Atrasada'})).toBeVisible();
});

test('Independente: privacidade na navegação e descarte real do rascunho',async({page})=>{
 await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
 await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-transition'));
 const a=await post(page,'/accounts',{name:'Conta transição',type:'CHECKING',initialBalance:0,color:'#10b981'});
 const cats=await (await page.request.get('/api/categories?type=INCOME')).json();
 await post(page,'/transactions',{description:'Receita protegida independente',type:'INCOME',amount:1300,date:'2027-01-15',accountId:a.id,categoryId:cats[0].id,isPaid:true});
 await page.goto('/configuracoes');const toggle=page.getByRole('switch',{name:'Modo Privacidade'});await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','true');
 const exposed:string[]=[];
 await page.exposeFunction('recordExposure',(text:string)=>exposed.push(text));
 await page.addInitScript(()=>{
   const inspect=()=>{
     for(const el of document.querySelectorAll('main span')){
       if(el.children.length===0 && /1\.300,00/.test(el.textContent??'')){
         const color=getComputedStyle(el).color;
         const hidden=!!el.closest('[aria-hidden="true"]');
         const box=el.getBoundingClientRect();
         if(box.width && box.height && (!hidden || (color!=='rgba(0, 0, 0, 0)' && color!=='transparent'))){
           void (window as unknown as {recordExposure:(text:string)=>Promise<void>}).recordExposure(JSON.stringify({hidden,color}));
         }
       }
     }
   };
   new MutationObserver(inspect).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-hidden','class']});
   const frame=()=>{inspect();requestAnimationFrame(frame);};requestAnimationFrame(frame);
 });
 await page.goto('/extrato');await expect(page.getByText('Receita protegida independente',{exact:true})).toBeVisible();await settleVisual(page);
 const snapshot=await page.locator('main').first().ariaSnapshot();expect(snapshot).not.toMatch(/1\.300,00/);
 await writeFile(path.join(dir,'privacy-transition.json'),JSON.stringify({snapshot,exposed},null,2));await page.screenshot({path:path.join(dir,'privacy-transition.png')});
 expect.soft(exposed).toEqual([]);
 await page.goto('/configuracoes');await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','false');await page.goto('/extrato');
 const opener=page.getByRole('button',{name:'Ver detalhes de Receita protegida independente'});await opener.focus();await page.keyboard.press('Enter');
 const d=page.getByRole('dialog',{name:'Detalhes de Receita protegida independente'});await expect(d).toBeVisible();expect(await d.ariaSnapshot()).toMatch(/1\.300,00/);
 await d.getByRole('button',{name:'Editar',exact:true}).click();const description=d.locator('input').first();const old=await description.inputValue();await description.fill('Rascunho descartável');await page.keyboard.press('Escape');await expect(d.getByRole('button',{name:'Editar',exact:true})).toBeVisible();
 await d.getByRole('button',{name:'Editar',exact:true}).click();await expect(description).toHaveValue(old);await page.keyboard.press('Escape');await page.keyboard.press('Escape');await expect(opener).toBeFocused();
 await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
 await page.reload();await expect(page.getByText('Receita protegida independente',{exact:true})).toBeVisible();await expect(page.getByText('Rascunho descartável',{exact:true})).toHaveCount(0);
});
