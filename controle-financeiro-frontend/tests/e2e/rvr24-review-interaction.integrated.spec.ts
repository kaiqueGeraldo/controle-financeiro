import {expect,test,type Page} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {registerSyntheticUser,syntheticUser} from './support/synthetic-auth';
const dir=process.env.CF_REVIEW_EVIDENCE!;
function gate(){let release!:()=>void;const promise=new Promise<void>(r=>{release=r;});return {promise,release};}
async function post(page:Page,url:string,data:unknown){const r=await page.request.post('/api'+url,{data});expect(r.ok(),await r.text()).toBe(true);return r.json();}
async function open(page:Page,ticker:string){
  const button=page.getByRole('button',{name:`Ver detalhes do investimento ${ticker}`});
  await button.focus();await page.keyboard.press('Enter');
  await page.getByRole('dialog',{name:`Detalhes do investimento ${ticker}`,exact:true}).getByRole('button',{name:'Aportar',exact:true}).click();
  return page.getByRole('dialog',{name:`${ticker} - Operação`,exact:true});
}
async function closeBoth(page:Page){await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(1);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);}
async function painted(page:Page){
  // A nonzero box/visible locator does not prove Framer has painted the layer.
  await expect.poll(()=>page.getByRole('dialog').evaluateAll(dialogs=>dialogs.length===2&&dialogs.every(el=>{
    for(let p:Element|null=el;p;p=p.parentElement)if(Number(getComputedStyle(p).opacity)!==1)return false;
    return true;
  }))).toBe(true);
}

for(const mode of ['late-recovery'] as const)test(`Revisor RVR24 interação real: ${mode}`,async({page})=>{
  await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
  await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-'+mode));
  const account=await post(page,'/accounts',{name:'Conta ciclo',type:'CHECKING',initialBalance:1000,color:'BLUE'});
  const a=await post(page,'/investments',{ticker:'CICLOA',name:'Ciclo A',type:'OTHER'});
  const b=await post(page,'/investments',{ticker:'CICLOB',name:'Ciclo B',type:'OTHER'});
  await page.goto('/investimentos');const first=await open(page,'CICLOA');
  await first.getByPlaceholder('0',{exact:true}).fill('2');await first.getByPlaceholder('0,00',{exact:true}).fill('10');
  await first.getByLabel('Conta',{exact:true}).selectOption(account.id);
  const committed=gate(),delivery=gate();const commands:Record<string,unknown>[]=[];
  await page.route('**/api/investments/operation',async route=>{
    commands.push(route.request().postDataJSON());const response=await route.fetch();expect(response.ok(),await response.text()).toBe(true);
    committed.release();await delivery.promise;
    if(String(mode)==='ABA')await route.fulfill({response});else await route.abort('connectionclosed');
  });
  await first.getByRole('button',{name:'Confirmar Operação'}).click();await committed.promise;
  await closeBoth(page);let current=await open(page,'CICLOB');
  if(String(mode)==='ABA'){await closeBoth(page);current=await open(page,'CICLOA');}
  await expect(current).toBeVisible();await expect(current.getByRole('alert')).toContainText('Operação anterior: CICLOA');
  await painted(page);
  await page.screenshot({path:path.join(dir,`${mode}-before-delivery.png`)});
  delivery.release();
  if(String(mode)!=='ABA'){
    await expect(current.getByRole('button',{name:'Consultar recibo'})).toBeEnabled();
    if(mode==='late-recovery'){
      const ready=gate(),recoverDelivery=gate();
      await page.route('**/api/financial-intents/*',async route=>{const response=await route.fetch();expect(response.ok()).toBe(true);ready.release();await recoverDelivery.promise;await route.fulfill({response});});
      await current.getByRole('button',{name:'Consultar recibo'}).click();await ready.promise;
      await closeBoth(page);current=await open(page,'CICLOB');recoverDelivery.release();
    }else await current.getByRole('button',{name:'Consultar recibo'}).click();
  }
  await expect(current).toBeVisible();await expect(current.getByRole('button',{name:'Confirmar Operação'})).toBeEnabled();
  // A's receipt unlocks the next intention but never clears or submits this new draft.
  await current.getByPlaceholder('0',{exact:true}).fill('7');await current.getByPlaceholder('0,00',{exact:true}).fill('3');
  await current.getByPlaceholder('0',{exact:true}).focus();
  const operationId=String(commands[0].operationId);
  const receipt=await (await page.request.get('/api/financial-intents/'+operationId)).json();
  const accounts=await (await page.request.get('/api/accounts')).json();
  const assets=await (await page.request.get('/api/investments')).json();
  const history=await (await page.request.get(`/api/investments/${a.id}/history`)).json();
  expect(commands).toHaveLength(1);expect(receipt).toMatchObject({operationId,kind:'INVESTMENT_OPERATION',result:{quantity:2,price:10,totalValue:20}});
  expect(accounts.find((x:{id:string})=>x.id===account.id).balance).toBe(980);
  expect(assets.find((x:{id:string})=>x.id===a.id)).toMatchObject({quantity:2,totalCost:20});
  expect(assets.find((x:{id:string})=>x.id===b.id)).toMatchObject({quantity:0,totalCost:0});expect(history).toHaveLength(1);
  await expect(current.getByPlaceholder('0',{exact:true})).toHaveValue('7');await expect(current.getByPlaceholder('0,00',{exact:true})).toHaveValue('3');
  await expect(current.getByPlaceholder('0',{exact:true})).toBeFocused();
  await writeFile(path.join(dir,`${mode}.json`),JSON.stringify({commands,receipt,accounts,assets,history,dialog:await current.innerText()},null,2));
  await painted(page);
  await page.screenshot({path:path.join(dir,`${mode}-preserved.png`)});
  const quantity = current.getByPlaceholder('0',{exact:true});
  await quantity.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('17');
  await expect(quantity).toHaveValue('17');
  await page.keyboard.press('Tab');
  const paintedState = await quantity.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width/2, rect.y + rect.height/2);
    const ancestors = [];
    for (let p: Element|null = el; p; p=p.parentElement) {
      const style = getComputedStyle(p);
      ancestors.push({tag:p.tagName,opacity:style.opacity,visibility:style.visibility,display:style.display});
    }
    return {hitInput:hit===el,ancestors,value:(el as HTMLInputElement).value};
  });
  expect(paintedState.hitInput).toBe(true);
  expect(paintedState.ancestors.every(p=>Number(p.opacity)===1 && p.visibility==='visible' && p.display!=='none')).toBe(true);
  await writeFile(path.join(dir,'interaction.json'),JSON.stringify(paintedState,null,2));
  await page.screenshot({path:path.join(dir,'interaction-preserved.png')});
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Aportar',exact:true})).toBeFocused();
  await page.reload();await open(page,'CICLOB');
  const reloaded=await (await page.request.get(`/api/investments/${a.id}/history`)).json();expect(reloaded).toHaveLength(1);
  expect(commands).toHaveLength(1);
});
