import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {setCivilDateOnly} from './support/civil-date-clock';
import {settleVisual} from './support/rf15-visual';
const dir=process.env.CF_REVIEW_EVIDENCE!;
test('CF014 revisão independente: jornada original com histórico persistido',async({page})=>{
  await setCivilDateOnly(page,new Date('2027-01-15T12:00:00Z'));
  await page.goto('/auth');
  await page.locator('input[name="email"]').fill('cf014-diagnostic@example.invalid');
  await page.locator('input[name="senha"]').fill('Cf014-Synthetic-2026');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page).toHaveURL(/\/$/);
  await page.setViewportSize({width:360,height:800});
  const writes:string[]=[];
  page.on('request',r=>{if(r.method()!=='GET'&&/\/api\/(investments|transactions|accounts|cards|goals)/.test(r.url()))writes.push(r.method()+' '+r.url());});
  await page.context().tracing.start({screenshots:true,snapshots:true,sources:false});
  try {
    const response=await page.request.get('/api/investments/cf014000-0000-4000-8000-000000000010/history');
    expect(response.status()).toBe(200);
    const history=await response.json();expect(history).toHaveLength(8);
    await page.goto('/investimentos');await page.getByText('RF15',{exact:true}).click();
    await expect(page.getByText('Histórico de Movimentações',{exact:true})).toBeVisible();
    await expect(page.getByTitle('Compensar operação')).toHaveCount(8);
    await expect(page.getByText('Histórico de Movimentações',{exact:true}).locator('../..')).toHaveCSS('opacity','1');
    await page.getByTitle('Compensar operação').last().scrollIntoViewIfNeeded();
    await settleVisual(page);await page.screenshot({path:path.join(dir,'review-original-history.png')});
    const action=page.getByRole('button',{name:'Aportar',exact:true});await action.focus();await page.keyboard.press('Enter');
    const modal=page.getByRole('dialog',{name:'RF15 - Operação',exact:true});await expect(modal).toBeVisible();
    await modal.getByRole('button',{name:'Confirmar Operação'}).focus();await expect(modal.getByRole('button',{name:'Confirmar Operação'})).toBeInViewport();
    await expect(modal).toHaveCSS('opacity','1');await settleVisual(page);
    await page.screenshot({path:path.join(dir,'review-original-operation.png')});
    await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);await expect(action).toBeFocused();
    await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Histórico de Movimentações',{exact:true})).toHaveCount(0);
    expect(writes).toEqual([]);
    await writeFile(path.join(dir,'review-original.json'),JSON.stringify({historyIds:history.map((r:{id:string})=>r.id),writes,returnedFocus:true,dialogs:0,detailStillOpen:false},null,2));
  }finally{await page.context().tracing.stop({path:path.join(dir,'review-original-trace.zip')});}
});
