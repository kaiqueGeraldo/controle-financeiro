import {expect,test} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {registerSyntheticUser,syntheticUser} from './support/synthetic-auth';
const dir=process.env.CF_REVIEW_EVIDENCE!;
test('B: download recusado não cria arquivo e binário válido preserva XLSX',async({page})=>{
 await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-download'));
 await page.goto('/configuracoes');const files:string[]=[];page.on('download',d=>files.push(d.suggestedFilename()));
 await page.route('**/api/transactions/export',r=>r.fulfill({status:500,contentType:'application/json',body:'{"message":"Falha sintética"}'}));
 await page.getByRole('button',{name:/Exportar Dados/}).click();await expect(page.getByRole('alert').filter({hasText:'Erro ao exportar a planilha'})).toBeVisible();expect(files).toEqual([]);
 await page.screenshot({path:path.join(dir,'B-download-error.png'),fullPage:true});await page.unroute('**/api/transactions/export');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:/Exportar Dados/}).click();const download=await pending;const file=await download.path();expect(file).not.toBeNull();const bytes=await readFile(file!);expect(bytes.subarray(0,2).toString()).toBe('PK');expect(bytes.length).toBeGreaterThan(1000);
 await writeFile(path.join(dir,'B-download.json'),JSON.stringify({failedDownloadCount:0,successCount:files.length,xlsxZipSignature:bytes.subarray(0,2).toString(),bytes:bytes.length}));
});
test('D: competência de fechamento conserva vencimento contratual no detalhe',async({page})=>{
 await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-dates'));
 const post=async(url:string,data:unknown)=>{const r=await page.request.post('/api'+url,{data});expect(r.ok(),await r.text()).toBe(true);const body=await r.text();return body ? JSON.parse(body) : null;};
 const c=await post('/cards',{name:'Cartão data contratual',last4Digits:'4242',limit:1000,closingDay:31,dueDay:5,brand:'VISA',color:'#7c3aed'});
 await page.setViewportSize({width:360,height:800});await page.goto('/cartoes');await page.getByRole('button',{name:'Ver fatura de Cartão data contratual, final 4242'}).click();
 const invoice=page.getByRole('dialog',{name:'Cartão data contratual •••• 4242',exact:true});await expect(invoice).toBeVisible();await page.screenshot({path:path.join(dir,'D-empty-invoice.png')});await page.keyboard.press('Escape');
 const cats=await (await page.request.get('/api/categories?type=EXPENSE')).json();
 await post('/cards/transaction',{cardId:c.id,categoryId:cats[0].id,description:'Compra antes do fechamento',amount:120,date:'2027-01-15',time:null,totalInstallments:1});
 const api=await (await page.request.get(`/api/cards/${c.id}/invoice?month=1&year=2027`)).json();expect(api.dueDate).toBe('2027-02-05');
 await page.reload();await page.getByRole('button',{name:'Ver fatura de Cartão data contratual, final 4242'}).click();await expect(invoice).toBeVisible();await expect(invoice.getByText('Compra antes do fechamento',{exact:true})).toBeVisible();
 await page.screenshot({path:path.join(dir,'D-invoice-dates.png')});await writeFile(path.join(dir,'D-invoice-dates.json'),JSON.stringify({api,ui:await invoice.innerText()},null,2));
 await expect.soft(invoice.getByText(/Fecha: 31 de jan/i)).toBeVisible();
 await expect.soft(invoice.getByText(/Vence: 05 de fev/i)).toBeVisible();
 await expect.soft(invoice.getByRole('button',{name:'Pagar Atrasada'})).toHaveCount(0);
});
