import {expect, test, type Page} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {registerSyntheticUser, syntheticUser} from './support/synthetic-auth';

const dir = process.env.CF_REVIEW_EVIDENCE!;
async function start(page: Page, tag: string) {
  await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
  await registerSyntheticUser(page, syntheticUser('A', process.env.CF_E2E_NAMESPACE + tag));
}
async function post(page: Page, url: string, data: unknown) {
  const r = await page.request.post('/api' + url, {data});
  expect(r.ok(), await r.text()).toBe(true);
  return (await r.text()) ? r.json() : null;
}
async function shot(page: Page, name: string, data: unknown) {
  await writeFile(path.join(dir, name + '.json'), JSON.stringify(data, null, 2));
  await page.screenshot({path:path.join(dir, name + '.png')});
}
async function seed(page: Page, tag: string) {
  await start(page, tag);
  const account = await post(page, '/accounts', {name:'Conta independente',type:'CHECKING',initialBalance:1000,color:'BLUE'});
  const asset = await post(page, '/investments', {ticker:'REVISA',name:'Ativo A',type:'OTHER'});
  const other = await post(page, '/investments', {ticker:'REVISB',name:'Ativo B',type:'OTHER'});
  return {account, asset, other};
}
async function open(page: Page, ticker = 'REVISA') {
  const opener = page.getByRole('button',{name:`Ver detalhes do investimento ${ticker}`});
  await opener.focus(); await page.keyboard.press('Enter');
  const detail = page.getByRole('dialog',{name:`Detalhes do investimento ${ticker}`,exact:true});
  await detail.getByRole('button',{name:'Aportar',exact:true}).click();
  return {detail, modal:page.getByRole('dialog',{name:`${ticker} - Operação`,exact:true})};
}
async function fill(page: Page, accountId: string) {
  const modal = page.getByRole('dialog',{name:'REVISA - Operação',exact:true});
  await modal.getByPlaceholder('0',{exact:true}).fill('2');
  await modal.getByPlaceholder('0,00',{exact:true}).fill('10');
  await modal.getByLabel('Conta',{exact:true}).selectOption(accountId);
}
async function persisted(page: Page, accountId: string, assetId: string, otherId: string, operationId: string) {
  const receipt = await page.request.get('/api/financial-intents/' + operationId);
  expect(receipt.status()).toBe(200);
  const result = await receipt.json();
  expect(result.operationId).toBe(operationId); expect(result.kind).toBe('INVESTMENT_OPERATION');
  const accounts = await (await page.request.get('/api/accounts')).json();
  const assets = await (await page.request.get('/api/investments')).json();
  const history = await (await page.request.get(`/api/investments/${assetId}/history`)).json();
  expect(accounts.find((a:{id:string})=>a.id===accountId).balance).toBe(980);
  expect(assets.find((a:{id:string})=>a.id===assetId)).toMatchObject({quantity:2,totalCost:20});
  expect(assets.find((a:{id:string})=>a.id===otherId)).toMatchObject({quantity:0,totalCost:0});
  expect(history).toHaveLength(1);
  return {receipt:result,accounts,assets,history};
}

test('Revisor CF014: editar por mouse e teclado não envia; salvar persiste uma vez',async({page})=>{
  await start(page,'-habit-save');
  const habit=await post(page,'/habits',{name:'Hábito legítimo',description:'Original',frequency:'DAILY',icon:'Flame',color:'BLUE'});
  await page.goto('/habitos');
  await page.getByRole('button',{name:`Ver detalhes do hábito ${habit.name}`}).click();
  const d=page.getByRole('dialog',{name:`Detalhes do hábito ${habit.name}`});
  const writes:unknown[]=[];
  page.on('request',r=>{if(r.method()!=='GET'&&r.url().includes('/api/habits'))writes.push({method:r.method(),body:r.postDataJSON()});});
  await d.getByRole('button',{name:'Editar Hábito'}).click();
  await expect(d.locator('input').first()).toHaveValue(habit.name);
  await d.getByRole('button',{name:'Cancelar',exact:true}).click();
  await d.getByRole('button',{name:'Editar Hábito'}).focus(); await page.keyboard.press('Enter');
  await expect(d.locator('input').first()).toHaveValue(habit.name);
  expect(writes).toEqual([]);
  await d.getByPlaceholder('Descrição (Opcional)').fill('Edição legítima persistida');
  const saved=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().includes('/api/habits/'));
  await d.getByRole('button',{name:/Salvar/}).click(); expect((await saved).ok()).toBe(true);
  await expect(page.getByRole('button',{name:'Editar Hábito'})).toBeVisible();
  expect(writes).toHaveLength(1);
  await page.reload(); await page.getByRole('button',{name:`Ver detalhes do hábito ${habit.name}`}).click();
  await expect(page.getByText('Edição legítima persistida',{exact:true})).toBeVisible();
  await shot(page,'habit-legitimate',{writes});
});

for(const mode of ['confirmed','lost'] as const) test(`Revisor CF014: investimento ${mode}, identidade e releitura financeira`,async({page})=>{
  const {account,asset,other}=await seed(page,'-investment-'+mode);
  await page.goto('/investimentos'); const {detail,modal}=await open(page); await fill(page,account.id);
  const commands:Record<string,unknown>[]=[];
  await page.route('**/api/investments/operation',async route=>{
    if(route.request().method()!=='POST'){await route.continue();return;}
    commands.push(route.request().postDataJSON());
    const response=await route.fetch(); expect(response.ok(),await response.text()).toBe(true);
    if(mode==='lost') await route.abort('connectionclosed'); else await route.fulfill({response});
  });
  await modal.getByRole('button',{name:'Confirmar Operação'}).click();
  if(mode==='lost') {
    await expect(modal.getByRole('alert')).toContainText('Não foi possível confirmar');
    await expect(modal.getByRole('button',{name:'Confirmar Operação'})).toBeDisabled();
    await expect(detail).toBeVisible();
    await modal.getByRole('button',{name:'Consultar recibo'}).click();
  }
  await expect(modal).toHaveCount(0);
  await expect(detail).toBeVisible();
  await expect(detail.getByTitle('Compensar operação')).toHaveCount(1);
  await expect(detail.getByRole('button',{name:'Aportar',exact:true})).toBeFocused();
  expect(commands).toHaveLength(1);
  const data=await persisted(page,account.id,asset.id,other.id,String(commands[0].operationId));
  await shot(page,'investment-'+mode,{commands,...data,detail:await detail.innerText()});
  await page.reload();
  await page.getByRole('button',{name:'Ver detalhes do investimento REVISA'}).click();
  await expect(page.getByTitle('Compensar operação')).toHaveCount(1);
  await persisted(page,account.id,asset.id,other.id,String(commands[0].operationId));
});

test('Revisor CF014: resposta tardia de A não fecha operação nova de B',async({page})=>{
  const {account,asset,other}=await seed(page,'-late-selection');
  await page.goto('/investimentos');const {modal}=await open(page);await fill(page,account.id);
  let release!:()=>void, committed!:()=>void;
  const gate=new Promise<void>(r=>{release=r;});const ready=new Promise<void>(r=>{committed=r;});
  const commands:Record<string,unknown>[]=[];
  await page.route('**/api/investments/operation',async route=>{
    commands.push(route.request().postDataJSON());
    const response=await route.fetch();expect(response.ok(),await response.text()).toBe(true);committed();
    await gate; await route.fulfill({response});
  });
  await modal.getByRole('button',{name:'Confirmar Operação'}).click();await ready;
  await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  const next=await open(page,'REVISB');
  await expect(next.modal).toBeVisible();
  const response=page.waitForResponse(r=>r.url().endsWith('/api/investments/operation')&&r.request().method()==='POST');
  release();await response;
  // A confirmed old callback calls closeOperation after its awaited receipt validation.
  // Wait for either the legitimate preserved recovery UI or removal, then assert the contract.
  await expect(page.getByRole('button',{name:'Confirmar Operação'}).or(page.getByRole('button',{name:'Aportar',exact:true}))).not.toHaveCount(0);
  const data=await persisted(page,account.id,asset.id,other.id,String(commands[0].operationId));
  await shot(page,'investment-late-selection',{commands,...data,dialogs:await page.getByRole('dialog').allTextContents()});
  expect(commands).toHaveLength(1);
  await expect(next.modal).toBeVisible();
  await expect(next.detail).toBeVisible();
});
