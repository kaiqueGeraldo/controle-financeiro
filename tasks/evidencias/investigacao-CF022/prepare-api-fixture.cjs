const fs=require('fs'),path=require('path');
const file='.cf22/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/browser.cjs';
let s=fs.readFileSync(file,'utf8');
const start=s.indexOf("        await page.goto('/auth?modo=cadastro');"),end=s.indexOf('        await context.tracing.start',start);
if(start<0||end<0)throw Error('Missing fixture boundary');
s=s.slice(0,start)+`        // Explicit synthetic fixture through the real BFF/backend. Auth UI is outside CF022.
        const email=namespace+'-'+key+'@example.invalid',senha='Synthetic-Cf022-2026';
        expect((await page.request.post('/api/auth/register',{data:{nome:'Pessoa Sintética CF022',email,senha}})).status()).toBe(200);
        const login=await page.request.post('/api/auth/login',{data:{email,senha}});expect(login.status()).toBe(200);
        const {token}=await login.json();expect(typeof token).toBe('string');
        await context.addCookies([{name:'token',value:token,url:baseURL,httpOnly:true,sameSite:'Lax'}]);
        await page.goto('/');await expect(page).toHaveURL(/\\/$/);
`+s.slice(end);
fs.writeFileSync(file,s);fs.writeFileSync('tasks/evidencias/investigacao-CF022/browser-fixture-api.cjs.txt',s);
