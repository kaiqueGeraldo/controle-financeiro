import {settleVisual} from './support/rf15-visual';
import {expect,test,type Page} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {registerSyntheticUser,syntheticUser} from './support/synthetic-auth';
const dir=process.env.CF_REVIEW_EVIDENCE!;
async function start(page:Page,key:string){await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-'+key));await page.setViewportSize({width:360,height:800});}
async function post(page:Page,url:string,data:unknown){const r=await page.request.post('/api'+url,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;}
async function shot(page:Page,name:string){for(const dialog of await page.getByRole('dialog').all())await expect(dialog).toHaveCSS('opacity','1');await settleVisual(page);await page.screenshot({path:path.join(dir,name+'.png')});}

test('Matriz CF013: PAID real após fechamento, reload e saldo devido',async({page})=>{
 await start(page,'paid');const account=await post(page,'/accounts',{name:'Banco PAID',type:'CHECKING',initialBalance:1000,color:'#10b981'});
 const card=await post(page,'/cards',{name:'Cartão PAID',last4Digits:'4242',limit:1000,closingDay:31,dueDay:5,brand:'VISA',color:'#7c3aed'});
 const cats=await (await page.request.get('/api/categories?type=EXPENSE')).json();
 await post(page,'/cards/transaction',{cardId:card.id,categoryId:cats[0].id,description:'Compra PAID',amount:120,date:'2027-01-15',time:null,totalInstallments:1});
 await page.goto('/cartoes');const opener=page.getByRole('button',{name:'Ver fatura de Cartão PAID, final 4242'});await opener.click();
 const invoice=page.getByRole('dialog',{name:'Cartão PAID •••• 4242',exact:true});
 await invoice.getByRole('button',{name:'Adiantar Fatura'}).click();
 const pay=page.getByRole('dialog',{name:'Pagar Fatura - Cartão PAID',exact:true});
 await pay.getByRole('button',{name:'Fechamento',exact:true}).click();await pay.getByLabel('Pagar com').selectOption(account.id);
 const response=page.waitForResponse(r=>r.url().endsWith(`/cards/${card.id}/pay`)&&r.request().method()==='POST');
 await pay.getByRole('button',{name:'Confirmar Pagamento'}).click();expect((await response).ok()).toBe(true);await expect(pay).toHaveCount(0);
 const api=await (await page.request.get(`/api/cards/${card.id}/invoice?month=1&year=2027`)).json();expect(api.status).toBe('PAID');expect(api.payableAmount).toBe(0);
 await page.reload();await opener.click();await expect(invoice.getByRole('button',{name:'Fatura Paga'})).toBeDisabled();await expect(invoice.getByText('Compra PAID',{exact:true})).toBeVisible();await shot(page,'matrix-paid');
 await writeFile(path.join(dir,'matrix-paid.json'),JSON.stringify(api,null,2));
});

test('Matriz CF014: metas hoje/concluída e formulário monetário longo',async({page})=>{
 await start(page,'goals');
 await post(page,'/goals',{title:'Prazo hoje RF15',type:'NUMERIC',targetValue:100,deadline:'2027-01-16',color:'BLUE',useChecklist:false});
 const complete=await post(page,'/goals',{title:'Concluída RF15',type:'NUMERIC',targetValue:1,deadline:'2027-01-16',color:'BLUE',useChecklist:false});
 await post(page,`/goals/${complete.id}/deposit`,{amount:1,note:'Conclusão sintética'});
 await page.clock.setFixedTime(new Date('2027-01-16T12:00:00Z'));await page.goto('/metas');await expect(page.getByText('Prazo hoje RF15',{exact:true})).toBeVisible();await expect(page.getByText('Concluído',{exact:true})).toBeVisible();await expect(page.getByText('Atrasado',{exact:true})).toHaveCount(0);await shot(page,'matrix-goals-today');
 await page.reload();await expect(page.getByText('Concluído',{exact:true})).toBeVisible();
 const opener=page.getByRole('button',{name:'Nova Meta',exact:true});await opener.click();const modal=page.getByRole('dialog',{name:'Nova Meta',exact:true});
 await modal.getByRole('button',{name:'Criar Meta'}).focus();await expect(modal.getByRole('button',{name:'Criar Meta'})).toBeInViewport();await shot(page,'matrix-goal-form-bottom');
 await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);
 // Detalhe monetário com checklist longo: observação explícita, não inferência de aceite pelo formulário comum.
 const monetary=await post(page,'/goals',{title:'Meta monetária longa RF15',type:'MONETARY',targetValue:1000,deadline:'2027-12-31',color:'BLUE',useChecklist:true});
 for(let i=0;i<10;i++)await post(page,`/goals/${monetary.id}/items`,{name:`Item ${i} longo para rolagem da meta`,estimatedPrice:100});
 await page.reload();await page.getByText('Meta monetária longa RF15',{exact:true}).click();await expect(page.getByText('Item 9 longo para rolagem da meta',{exact:true})).toBeAttached();
 await page.getByText('Item 9 longo para rolagem da meta',{exact:true}).scrollIntoViewIfNeeded();await shot(page,'matrix-goal-detail-bottom');
 await page.keyboard.press('Escape');
 await writeFile(path.join(dir,'matrix-goal-detail.json'),JSON.stringify({dialogs:await page.getByRole('dialog').count(),detailStillOpen:await page.getByRole('heading',{name:'Meta monetária longa RF15',exact:true}).count(),focused:await page.evaluate(()=>({tag:document.activeElement?.tagName,aria:document.activeElement?.getAttribute('aria-label')}))},null,2));
});

test('Matriz CF014: investimentos histórico carregado e ação/modal',async({page})=>{
 await start(page,'investment');const account=await post(page,'/accounts',{name:'Banco histórico RF15',type:'CHECKING',initialBalance:1000,color:'#10b981'});
 const asset=await post(page,'/investments',{ticker:'RF15',name:'Ativo sintético com histórico RF15',type:'OTHER'});
 for(let i=0;i<8;i++)await post(page,'/investments/operation',{operationId:crypto.randomUUID(),investmentId:asset.id,type:'BUY',quantity:1,price:10,fees:0,date:'2027-01-15',accountId:account.id});
 const history=await (await page.request.get(`/api/investments/${asset.id}/history`)).json();expect(history).toHaveLength(8);
 await page.goto('/investimentos');await page.getByText('RF15',{exact:true}).click();await expect(page.getByText('Histórico de Movimentações',{exact:true})).toBeVisible();
 await expect(page.getByTitle('Compensar operação')).toHaveCount(8);
 await expect(page.getByText('Histórico de Movimentações',{exact:true}).locator('../..')).toHaveCSS('opacity','1');
 await page.getByTitle('Compensar operação').last().scrollIntoViewIfNeeded();await shot(page,'matrix-investment-history');
 const action=page.getByRole('button',{name:'Aportar',exact:true});await action.focus();await page.keyboard.press('Enter');
 const modal=page.getByRole('dialog',{name:'RF15 - Operação',exact:true});await expect(modal).toBeVisible();await modal.getByRole('button',{name:'Confirmar Operação'}).focus();await expect(modal.getByRole('button',{name:'Confirmar Operação'})).toBeInViewport();await shot(page,'matrix-investment-operation');
 await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);await expect.soft(action).toBeFocused();
 await page.keyboard.press('Escape');
 await writeFile(path.join(dir,'matrix-investment-detail.json'),JSON.stringify({focused:await page.evaluate(()=>({tag:document.activeElement?.tagName,text:document.activeElement?.textContent?.slice(0,150)})),historyRows:history.length,dialogs:await page.getByRole('dialog').count(),detailStillOpen:await page.getByText('Histórico de Movimentações',{exact:true}).count()},null,2));
});

test('Matriz CF014: hábito formulário longo e detalhe diário',async({page})=>{
 await start(page,'habit-long');await page.goto('/habitos');const opener=page.getByRole('button',{name:'Novo Hábito'});await opener.click();const modal=page.getByRole('dialog',{name:'Novo Hábito',exact:true});
 await modal.getByPlaceholder('Ex: Beber 3L de Água').fill('Hábito diário com descrição extensa para inspeção');
 await modal.getByRole('button',{name:'Meta na Semana'}).click();await modal.getByPlaceholder('Ex: 4').fill('2');
 await modal.getByRole('button',{name:'Criar Hábito'}).focus();await expect(modal.getByRole('button',{name:'Criar Hábito'})).toBeInViewport();await shot(page,'matrix-habit-form-bottom');
 await page.keyboard.press('Escape');await expect(opener).toBeFocused();
 const habit=await post(page,'/habits',{name:'Hábito diário longo RF15',description:'Descrição sintética extensa para verificar as ações e o calendário. '.repeat(3),frequency:'DAILY',icon:'Flame',color:'BLUE'});
 await page.reload();await page.getByRole('button',{name:`Ver detalhes do hábito ${habit.name}`}).focus();await page.keyboard.press('Enter');await expect(page.locator('form').filter({hasText:habit.description})).toBeVisible();await expect(page.locator('form').getByRole('heading',{name:habit.name,exact:true})).toBeVisible();await shot(page,'matrix-habit-detail');
 await page.keyboard.press('Escape');
 await writeFile(path.join(dir,'matrix-habit-detail.json'),JSON.stringify({dialogs:await page.getByRole('dialog').count(),detailStillOpen:await page.locator('form').filter({hasText:habit.description}).count()},null,2));
});
