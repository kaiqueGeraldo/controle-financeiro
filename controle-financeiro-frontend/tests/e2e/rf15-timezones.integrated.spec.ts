import {expect,test} from '@playwright/test';
import path from 'node:path';
import {registerSyntheticUser,syntheticUser} from './support/synthetic-auth';
for(const [zone,late] of [['America/Sao_Paulo',false],['UTC',true],['Pacific/Kiritimati',true]] as const){
 test.describe(zone,()=>{
  test.use({timezoneId:zone});
  test('RF15-04: mesmo instante em fusos divergentes, vencimento civil e saldo parcial',async({page})=>{
   await page.clock.setFixedTime(new Date('2027-02-06T01:30:00Z'));
   await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-'+zone.replaceAll('/','-')));
   const post=async(url:string,data:unknown)=>{const r=await page.request.post('/api'+url,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;};
   const c=await post('/cards',{name:'Cartão fusos',last4Digits:'4242',limit:1000,closingDay:31,dueDay:5,brand:'VISA',color:'#7c3aed'});
   const a=await post('/accounts',{name:'Banco fusos',type:'CHECKING',initialBalance:1000,color:'#10b981'});
   const cats=await (await page.request.get('/api/categories?type=EXPENSE')).json();
   await post('/cards/transaction',{cardId:c.id,categoryId:cats[0].id,description:'Compra janeiro',amount:120,date:'2027-01-15',time:null,totalInstallments:1});
   await post(`/cards/${c.id}/pay`,{operationId:crypto.randomUUID(),accountId:a.id,amount:20,date:'2027-01-15',time:null,month:1,year:2027,isPrepayment:true});
   await page.goto('/cartoes');await page.getByRole('button',{name:'Ver fatura de Cartão fusos, final 4242'}).click();
   const dialog=page.getByRole('dialog',{name:'Cartão fusos •••• 4242',exact:true});
   await dialog.getByRole('button',{name:'Mês anterior da fatura'}).click();
   await expect(dialog.getByText('Compra janeiro',{exact:true})).toBeVisible();
   await expect(dialog.getByText('Fecha: 31 de jan')).toBeVisible();await expect(dialog.getByText('Vence: 05 de fev')).toBeVisible();
   await expect(dialog.getByRole('button',{name:late?'Pagar Atrasada':'Adiantar Fatura'})).toBeVisible();
   await expect(dialog.getByText(/Saldo pagável: R\$\s*100,00/)).toBeVisible();
   await page.screenshot({path:path.join(process.env.CF_REVIEW_EVIDENCE!,`dates-${zone.replaceAll('/','-')}.png`),animations:'disabled'});
   await dialog.getByRole('button',{name:'Próximo mês da fatura'}).click();await expect(dialog.getByText('Fecha: 28 de fev')).toBeVisible();await expect(dialog.getByText('Vence: 05 de mar')).toBeVisible();
  });
 });
}
