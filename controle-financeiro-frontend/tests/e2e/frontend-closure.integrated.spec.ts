import {expect,test,type Page} from "@playwright/test";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {registerSyntheticUser,syntheticUser} from "./support/synthetic-auth";
const dir=process.env.CF_REVIEW_EVIDENCE!;
const ns=process.env.CF_E2E_NAMESPACE!;
async function shot(page:Page,name:string){await mkdir(dir,{recursive:true});await page.screenshot({path:path.join(dir,name+".png"),fullPage:true});}
async function post(page:Page,url:string,data:unknown){const r=await page.request.post('/api'+url,{data});expect(r.ok(),await r.text()).toBe(true);return (await r.text())?r.json():null;}

test('B: recuperação real com caixa falsa, rejeição e login após reload',async({page})=>{
 const user=syntheticUser('A',ns+'-recovery');
 await page.setViewportSize({width:360,height:800});
 await registerSyntheticUser(page,user);
 await page.context().clearCookies();await page.goto('/auth');
 await page.getByRole('button',{name:'Esqueceu a senha?'}).click();
 await page.getByLabel('E-mail Cadastrado').fill(user.email);
 await page.getByRole('button',{name:'Receber Código'}).click();
 await expect(page.getByLabel('Código de 6 dígitos')).toBeVisible();
 const code=await readFile(path.join(process.env.CF_MAILBOX!,user.email+'.txt'),'utf8');
 const wrong=code==='000000'?'999999':'000000';
 await page.getByLabel('Código de 6 dígitos').fill(wrong);
 await page.getByLabel('Criar Nova Senha').fill('Synthetic-New-2026');
 await page.getByRole('button',{name:'Redefinir Senha'}).click();
 await expect(page.getByRole('alert').filter({hasText:'Código inválido'})).toBeVisible();
 await shot(page,'B-recovery-invalid-mobile');
 await page.getByLabel('Código de 6 dígitos').fill(code);
 await page.getByLabel('Criar Nova Senha').focus();await page.keyboard.press('Tab');
 await expect(page.getByRole('button',{name:'Mostrar nova senha'})).toBeFocused();await page.keyboard.press('Tab');
 await expect(page.getByRole('button',{name:'Redefinir Senha'})).toBeFocused();await page.keyboard.press('Enter');
 await expect(page.getByText('Senha redefinida com sucesso! Faça seu login.')).toBeVisible();
 await page.reload();
 const old=await page.request.post('/api/auth/login',{data:{email:user.email,senha:user.password}});expect(old.ok()).toBe(false);
 const replay=await page.request.post('/api/auth/reset-password',{data:{email:user.email,token:code,novaSenha:'Another-Synthetic-2026'}});expect(replay.ok()).toBe(false);
 await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.locator('input[name="senha"]').fill('Synthetic-New-2026');
 await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/\/$/);
 await shot(page,'B-recovered-dashboard');
 await writeFile(path.join(dir,'B-recovery.json'),JSON.stringify({fakeEmail:true,invalidRejected:true,oldPasswordStatus:old.status(),reusedCodeStatus:replay.status(),loginAfterReload:true}));
});

test('B/C: preferências persistidas, erro recuperável, privacidade e valores',async({page})=>{
 await registerSyntheticUser(page,syntheticUser('A',ns+'-privacy'));
 const a=await post(page,'/accounts',{name:'Conta sintética longa privacidade',type:'CHECKING',initialBalance:-125.45,color:'#10b981'});
 await post(page,'/accounts',{name:'Conta com valor extenso',type:'CHECKING',initialBalance:1234567.89,color:'#10b981'});
 await page.setViewportSize({width:768,height:1024});await page.goto('/configuracoes');
 const privacy=page.getByRole('switch',{name:'Modo Privacidade'});await expect(privacy).toHaveAttribute('aria-checked','false');
 await privacy.focus();await page.keyboard.press('Space');await expect(privacy).toHaveAttribute('aria-checked','true');
 await page.reload();await expect(privacy).toHaveAttribute('aria-checked','true');
 await page.route('**/api/users/me/preferences',route=>route.fulfill({status:503,contentType:'application/json',body:'{"message":"Falha sintética"}'}));
 await privacy.click();await expect(page.getByRole('alert').filter({hasText:'Erro ao alterar preferência'})).toContainText('Erro ao alterar preferência');await expect(privacy).toHaveAttribute('aria-checked','true');
 await shot(page,'B-preference-error');await page.unroute('**/api/users/me/preferences');
 await page.goto('/contas');await expect(page.getByText('Conta sintética longa privacidade',{exact:true})).toBeVisible();
 await shot(page,'C-accounts-private');
 const styles=await page.getByText(/125,45/).evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,color:getComputedStyle(n).color,background:getComputedStyle(n).backgroundColor})));
 await writeFile(path.join(dir,'C-privacy-styles.json'),JSON.stringify(styles,null,2));
 await page.goto('/configuracoes');await privacy.click();await expect(privacy).toHaveAttribute('aria-checked','false');await page.reload();await expect(privacy).toHaveAttribute('aria-checked','false');
 await page.setViewportSize({width:360,height:800});await page.goto('/contas');await expect(page.getByText(/125,45/).first()).toBeVisible();await shot(page,'C-accounts-money-mobile');
 const persisted=await (await page.request.get('/api/accounts')).json();expect(persisted.find((x:{id:string})=>x.id===a.id).balance).toBe(-125.45);
});

test('E: interação semanal passiva com persistência e reload',async({page})=>{
 const events:unknown[]=[];
 page.on('request',r=>{if(r.url().includes('/habits'))events.push({event:'request',method:r.method(),path:new URL(r.url()).pathname});});
 page.on('response',r=>{if(r.url().includes('/habits'))events.push({event:'response',status:r.status(),path:new URL(r.url()).pathname});});
 try {
 await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));await registerSyntheticUser(page,syntheticUser('A',ns+'-weekly'));
 const goal=await post(page,'/goals',{title:'Meta semanal sintética',type:'NUMERIC',targetValue:100,deadline:'2028-01-04',color:'BLUE',useChecklist:false});
 await page.setViewportSize({width:1440,height:900});await page.goto('/habitos');await page.getByRole('button',{name:'Novo Hábito'}).click();
 const modal=page.getByRole('dialog',{name:'Novo Hábito',exact:true});await modal.getByPlaceholder('Ex: Beber 3L de Água').fill('Hábito semanal sintético');
 await modal.getByRole('button',{name:'Meta na Semana'}).click();await modal.getByPlaceholder('Ex: 4').fill('2');await modal.locator('select').selectOption(goal.id);
 await modal.getByRole('button',{name:'Criar Hábito'}).click();
 const card=page.getByRole('button',{name:'Ver detalhes do hábito Hábito semanal sintético'});await expect(card).toBeVisible();await page.setViewportSize({width:360,height:800});await shot(page,'E-weekly-before');
 const response=page.waitForResponse(r=>r.url().includes('/toggle')&&r.request().method()==='POST');
 const [,marked]=await Promise.all([card.getByRole('button',{name:'Avançar Progresso'}).click(),response]);expect(marked.status()).toBe(200);
 expect(marked.request().postDataJSON()).toEqual({date:'2027-01-15'});
 await page.reload();await expect(card.getByRole('button',{name:'Feito Hoje'})).toBeVisible();await shot(page,'E-weekly-marked');
 let goals=await (await page.request.get('/api/goals')).json();expect(goals.find((x:{id:string})=>x.id===goal.id).currentValue).toBe(1);
 await card.getByRole('button',{name:'Feito Hoje'}).click();await page.reload();await expect(card.getByRole('button',{name:'Avançar Progresso'})).toBeVisible();
 goals=await (await page.request.get('/api/goals')).json();expect(goals.find((x:{id:string})=>x.id===goal.id).currentValue).toBe(0);
 } finally {await writeFile(path.join(dir,'E-weekly-network.json'),JSON.stringify(events,null,2));if(!page.isClosed()) await shot(page,'E-weekly-terminal').catch(()=>undefined);}
});
