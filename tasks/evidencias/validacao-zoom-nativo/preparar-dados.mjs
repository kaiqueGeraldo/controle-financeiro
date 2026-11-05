import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawn, spawnSync} from 'node:child_process';

const [runtimeArg]=process.argv.slice(2);
assert.ok(runtimeArg, 'runtime required');
const runtime=path.resolve(runtimeArg), output=path.join(runtime,'preparation');
const front=path.join(runtime,'p','f');
const {chromium}=createRequire(path.join(front,'package.json'))('@playwright/test');
const backend=JSON.parse(fs.readFileSync(path.join(output,'backend-ready.json')));
assert.match(backend.url,/^http:\/\/127\.0\.0\.1:\d+$/);
const url='http://127.0.0.1:3117';
const env={...process.env,BACKEND_API_URL:backend.url,CF_E2E_SERVER_CLOCK:'1',
  CF_E2E_AUTH_NOW:'2027-01-15T12:00:00Z',NODE_OPTIONS:'--require ./tests/e2e/support/server-clock.cjs',
  NEXT_TELEMETRY_DISABLED:'1',PLAYWRIGHT_BROWSERS_PATH:'0'};
const stdout=fs.openSync(path.join(output,'next.log'),'wx');
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3117'],
  {cwd:front,env,windowsHide:true,stdio:['ignore',stdout,stdout]});
let browser;
try {
  const deadline=Date.now()+120000;
  while (!/Ready in/.test(fs.readFileSync(path.join(output,'next.log'),'utf8'))) {
    if (server.exitCode!==null) throw Error('Preparation frontend exited');
    if (Date.now()>deadline) throw Error('Preparation frontend readiness timeout');
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({baseURL:url,viewport:{width:1440,height:900},locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
  const page=await context.newPage();
  await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
  const user={name:'Pessoa Sintética Preparação Zoom',email:'zoom-preparacao-'+randomBytes(6).toString('hex')+'@example.invalid',password:randomBytes(20).toString('base64url')+'aA1!'};
  fs.writeFileSync(path.join(output,'credentials.private.json'),JSON.stringify({url,...user},null,2),{flag:'wx'});
  await page.goto('/auth?modo=cadastro');
  await page.locator('input[name="nome"]').fill(user.name);
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="senha"]').fill(user.password);
  await page.locator('input[name="confirmarSenha"]').fill(user.password);
  await page.getByRole('button',{name:'Criar Conta'}).click();
  await page.waitForURL(url+'/');
  const post=async(endpoint,data)=>{
    const response=await page.request.post('/api'+endpoint,{data});
    assert.ok(response.ok(), 'Synthetic preparation request failed: '+endpoint+' '+response.status());
    return (await response.text()) ? response.json() : undefined;
  };
  const account=await post('/accounts',{name:'Conta sintética longa para zoom',type:'CHECKING',initialBalance:123456789.12,color:'#10b981'});
  const card=await post('/cards',{name:'Cartão sintético para zoom',last4Digits:'4242',limit:123456789.12,closingDay:31,dueDay:5,brand:'VISA',color:'#7c3aed'});
  const categoryResponse=await page.request.get('/api/categories?type=EXPENSE');
  assert.ok(categoryResponse.ok());
  const categories=await categoryResponse.json();
  for(let i=1;i<=12;i++) await post('/cards/transaction',{cardId:card.id,categoryId:categories[0].id,description:`Compra ${i} com descrição longa para zoom`,amount:1234.56,date:'2027-01-15',time:null,totalInstallments:1});
  await page.goto('/cartoes');
  await page.getByRole('heading',{name:'Carteira',exact:true}).waitFor();
  await page.getByRole('button',{name:'Ver fatura de Cartão sintético para zoom, final 4242'}).waitFor();
  await page.reload();
  await page.getByRole('button',{name:'Ver fatura de Cartão sintético para zoom, final 4242'}).waitFor();
  await page.screenshot({path:path.join(output,'carteira-preparacao.png')});
  const metrics=await page.evaluate(()=>({width:innerWidth,height:innerHeight,outerWidth,outerHeight,dpr:devicePixelRatio,scale:visualViewport?.scale}));
  const receipt={at:new Date(),scope:'Environment preparation only; no native zoom test executed',url:page.url(),title:await page.title(),browser:browser.version(),accountId:account.id,cardId:card.id,cardName:card.name,purchases:12,reload:true,metrics,candidate:JSON.parse(fs.readFileSync(path.join(runtime,'prepared.json'))).candidate};
  fs.writeFileSync(path.join(output,'readiness.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({preparationReady:true,url:receipt.url,browser:receipt.browser,purchases:12,nativeZoomExecuted:false}));
} finally {
  if (browser) await browser.close();
  if (server.exitCode===null) spawnSync('taskkill.exe',['/PID',String(server.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
  fs.closeSync(stdout);
  fs.writeFileSync(path.join(output,'stop'),'preparation complete',{flag:'wx'});
}
