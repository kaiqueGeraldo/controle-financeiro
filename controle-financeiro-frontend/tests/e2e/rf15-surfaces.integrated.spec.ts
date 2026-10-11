import {settleVisual} from './support/rf15-visual';
import {expect,test,type Page} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {registerSyntheticUser,syntheticUser} from './support/synthetic-auth';
const dir=process.env.CF_REVIEW_EVIDENCE!;
async function start(page:Page,key:string){await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-'+key));}
async function post(page:Page,url:string,data:unknown){const r=await page.request.post('/api'+url,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;}

test('RF15-02: contas ativas/arquivadas, temas, privacidade acessível e reload',async({page})=>{
  await start(page,'privacy');
  const archived=await post(page,'/accounts',{name:'Arquivada RF15',type:'CHECKING',initialBalance:1234.56,color:'#10b981'});
  await post(page,'/accounts',{name:'Ativa negativa RF15',type:'CHECKING',initialBalance:-125.45,color:'#10b981'});
  expect((await page.request.delete('/api/accounts/'+archived.id)).ok()).toBe(true);
  await page.setViewportSize({width:360,height:800});
  for(const theme of ['dark','light']){
    for(const privateMode of [false,true,false]){
      expect((await page.request.patch('/api/users/me/preferences',{data:{privacyMode:privateMode}})).ok()).toBe(true);
      await page.goto('/contas');await expect(page.getByRole('region',{name:'Posição de contas arquivadas'})).toBeVisible();
      await page.evaluate(t=>{document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.classList.toggle('light',t==='light');document.documentElement.setAttribute('data-theme',t);},theme);
      await page.reload();await expect(page.getByText('Ativa negativa RF15',{exact:true})).toBeVisible();
      await page.evaluate(t=>{document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.classList.toggle('light',t==='light');document.documentElement.setAttribute('data-theme',t);},theme);
      const amounts=page.getByText(/1\.234,56|125,45/);
      expect(await amounts.count()).toBeGreaterThanOrEqual(3);
      for(const amount of await amounts.all()){
        if(privateMode){await expect(amount).toHaveCSS('color','rgba(0, 0, 0, 0)');expect(await amount.evaluate(el=>!!el.closest('[aria-hidden="true"]'))).toBe(true);}
        else expect(await amount.evaluate(el=>!!el.closest('[aria-hidden="true"]'))).toBe(false);
      }
      const aria=await page.locator('main').first().ariaSnapshot();
      if(privateMode)expect(aria).not.toMatch(/1\.234,56|125,45/);else expect(aria).toMatch(/1\.234,56/);
      await writeFile(path.join(dir,`privacy-${theme}-${privateMode}.txt`),aria);
      await settleVisual(page);await page.screenshot({path:path.join(dir,`privacy-${theme}-${privateMode}-top.png`)});
      await page.getByText('Ativa negativa RF15',{exact:true}).scrollIntoViewIfNeeded();
      await settleVisual(page);await page.screenshot({path:path.join(dir,`privacy-${theme}-${privateMode}-negative.png`)});
    }
  }
});

test('RF15-03: teclado real, containment, edição cancelável e retorno',async({page})=>{
  await start(page,'keyboard');
  const a=await post(page,'/accounts',{name:'Conta detalhe RF15',type:'CHECKING',initialBalance:0,color:'#10b981'});
  const cats=await (await page.request.get('/api/categories?type=INCOME')).json();
  await post(page,'/transactions',{description:'Receita extensa RF15 para detalhe por teclado',type:'INCOME',amount:123456789.12,date:'2027-01-15',accountId:a.id,categoryId:cats[0].id,isPaid:true});
  await page.setViewportSize({width:768,height:1024});await page.goto('/extrato');
  const opener=page.getByRole('button',{name:'Ver detalhes de Receita extensa RF15 para detalhe por teclado',exact:true});
  await opener.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Detalhes de Receita extensa RF15 para detalhe por teclado',exact:true});
  const close=dialog.getByRole('button',{name:'Fechar detalhes do lançamento'});await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');await expect(close).toBeFocused();
  await expect(dialog).toHaveCSS('opacity','1');await expect(dialog.getByText('Situação: SETTLED').locator('..')).toHaveCSS('opacity','1');await settleVisual(page);await page.screenshot({path:path.join(dir,'detail-768.png')});
  await dialog.getByRole('button',{name:'Editar',exact:true}).click();
  await page.keyboard.press('Escape');await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Editar',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();
  await page.keyboard.press('Enter');await expect(close).toBeFocused();
  await page.setViewportSize({width:360,height:800});
  await expect(dialog.getByText('Situação: SETTLED').locator('..')).toHaveCSS('opacity','1');
  const amount=dialog.getByText(/123\.456\.789,12/,{exact:false}).first();
  expect(await amount.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await settleVisual(page);await page.screenshot({path:path.join(dir,'detail-360.png')});
  await page.keyboard.press('Escape');await expect(opener).toBeFocused();
});
