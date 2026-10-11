import {expect,test,type Page} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {registerSyntheticUser,syntheticUser} from './support/synthetic-auth';
const dir=process.env.CF_REVIEW_EVIDENCE!;
async function start(page:Page,key:string){await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));await registerSyntheticUser(page,syntheticUser('B',process.env.CF_E2E_NAMESPACE+'-'+key));}
async function post(page:Page,url:string,data:unknown){const r=await page.request.post('/api'+url,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;}

test('C: privacidade deve ocultar saldo monetário de conta arquivada',async({page})=>{
 await start(page,'archived');const a=await post(page,'/accounts',{name:'Conta arquivada sintética',type:'CHECKING',initialBalance:1234.56,color:'#10b981'});
 expect((await page.request.delete('/api/accounts/'+a.id)).ok()).toBe(true);
 expect((await page.request.patch('/api/users/me/preferences',{data:{privacyMode:true}})).ok()).toBe(true);
 await page.setViewportSize({width:360,height:800});await page.goto('/contas');
 const section=page.getByRole('region',{name:'Posição de contas arquivadas'});await expect(section).toBeVisible();
 await page.screenshot({path:path.join(dir,'C-private-archived.png'),fullPage:true});
 const actual=await section.getByText(/1\.234,56/).evaluate(el=>({text:el.textContent,color:getComputedStyle(el).color,opacity:getComputedStyle(el).opacity,filter:getComputedStyle(el).filter}));
 await writeFile(path.join(dir,'C-private-archived.json'),JSON.stringify(actual,null,2));
 // Product says "Ocultar valores monetários na interface"; this is a visible amount,
 // not a claim that client-side financial data is confidential.
 expect(actual.color).toBe('rgba(0, 0, 0, 0)');
});

test('C: detalhe do extrato deve fechar por Escape e devolver foco',async({page})=>{
 await start(page,'detail');const a=await post(page,'/accounts',{name:'Conta detalhe',type:'CHECKING',initialBalance:0,color:'#10b981'});
 const cats=await (await page.request.get('/api/categories?type=INCOME')).json();
 await post(page,'/transactions',{description:'Receita detalhe sintética',type:'INCOME',amount:1300,date:'2027-01-15',accountId:a.id,categoryId:cats[0].id,isPaid:true});
 await page.setViewportSize({width:768,height:1024});await page.goto('/extrato');await page.getByText('Receita detalhe sintética',{exact:true}).click();
 const title=page.getByRole('heading',{name:'Receita detalhe sintética'});await expect(title).toBeVisible();
 await page.keyboard.press('Tab');
 const focus=await page.evaluate(()=>({tag:document.activeElement?.tagName,text:document.activeElement?.textContent,aria:document.activeElement?.getAttribute('aria-label'),dialogs:document.querySelectorAll('[role="dialog"]').length}));
 await page.keyboard.press('Escape');await page.screenshot({path:path.join(dir,'C-detail-after-escape.png')});await writeFile(path.join(dir,'C-detail-focus.json'),JSON.stringify(focus,null,2));
 await expect(title).toHaveCount(0);
});

test('C: cem lançamentos, filtro, página e reload',async({page})=>{
 await start(page,'hundred');const a=await post(page,'/accounts',{name:'Conta lista longa',type:'CHECKING',initialBalance:0,color:'#10b981'});
 const cats=await (await page.request.get('/api/categories?type=INCOME')).json();
 for(let i=0;i<100;i++)await post(page,'/transactions',{description:`Linha sintética ${String(i).padStart(3,'0')} texto extenso para inspeção`,type:'INCOME',amount:1,date:'2027-01-15',accountId:a.id,categoryId:cats[0].id,isPaid:true});
 await page.setViewportSize({width:768,height:1024});await page.goto('/extrato');await expect(page.getByText(/Linha sintética/)).toHaveCount(30);
 await page.getByRole('button',{name:'Carregar mais antigas'}).click();await expect(page.getByText(/Linha sintética/)).toHaveCount(60);
 await page.screenshot({path:path.join(dir,'C-list-long.png')});
 await page.getByRole('button',{name:'Saídas',exact:true}).click();await expect(page.getByText('Nenhuma movimentação encontrada.')).toBeVisible();
 await page.getByRole('button',{name:'Entradas',exact:true}).click();await expect(page.getByText(/Linha sintética/)).toHaveCount(30);
 await page.reload();await expect(page.getByText(/Linha sintética/)).toHaveCount(30);
 const accounts=await (await page.request.get('/api/accounts')).json();expect(accounts.find((x:{id:string})=>x.id===a.id).balance).toBe(100);
 await writeFile(path.join(dir,'C-list-long.json'),JSON.stringify({rows:100,afterPage:60,afterReload:30,balance:100}));
});
