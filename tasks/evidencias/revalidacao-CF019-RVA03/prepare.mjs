import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(), evidence=path.join(root,'tasks/evidencias/revalidacao-CF019-RVA03');
const runtime=path.join(root,'.rv3');
if(fs.existsSync(runtime))throw Error('Do not overwrite runtime');
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const preserved=[];
for(const folder of ['investigacao-CF019-RVA03','revalidacao-CF-016-CF-021/browser/falha-pagamento120']){
 const base=path.join(root,'tasks/evidencias',folder);
 for(const item of fs.readdirSync(base,{recursive:true,withFileTypes:true}))if(item.isFile()){
  const p=path.join(item.parentPath,item.name);preserved.push({path:path.relative(root,p),sha256:hash(p)});
 }
}
preserved.push({path:'README.md',sha256:hash(path.join(root,'README.md'))});
fs.writeFileSync(path.join(evidence,'preservation-initial.json'),JSON.stringify(preserved,null,2));
fs.mkdirSync(runtime);fs.writeFileSync(path.join(runtime,'.gitignore'),'*\n');
const zip=path.join(runtime,'candidate.zip');
execFileSync('git',['archive','18c7150','--format=zip',`--output=${zip}`,'controle-financeiro-backend','controle-financeiro-frontend']);
execFileSync('tar',['-xf',zip,'-C',runtime]);
const front=path.join(runtime,'controle-financeiro-frontend');
fs.symlinkSync(path.join(root,'controle-financeiro-frontend/node_modules'),path.join(front,'node_modules'),'junction');
function replace(file,from,to){const p=path.join(front,file),s=fs.readFileSync(p,'utf8');if(!s.includes(from))throw Error(file);fs.writeFileSync(p,s.replace(from,to));}
replace('next.config.ts','const nextConfig: NextConfig = {',`const nextConfig: NextConfig = {\n  turbopack: {root: ${JSON.stringify(root.replaceAll('\\','/'))}},`);
// Only extend observations after the original terminal evidence has been saved.
replace('tests/e2e/cf019-rva03.integrated.spec.ts',' await page.screenshot({path:path.join(dir,prefix+\'-reload.png\')});',` await page.screenshot({path:path.join(dir,prefix+'-reload-early.png')});
 const detail=page.getByRole('dialog',{name:\x60\x24{c.name} •••• 4242\x60,exact:true});
 await expect(detail.getByText('Compra Meta: '+name,{exact:true})).toBeVisible();
 await expect(detail.locator('.animate-pulse')).toHaveCount(0);
 await expect(detail).toHaveCSS('opacity','1');
 if(payment===120)await expect(detail.getByRole('button',{name:'Fatura Zerada',exact:true})).toBeVisible();
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 await page.screenshot({path:path.join(dir,prefix+'-reload.png')});
 await detail.getByRole('button',{name:'Fechar detalhes da fatura',exact:true}).click();
 await expect(detail).toHaveCount(0);
 await page.getByRole('button',{name:\x60Ver fatura de \x24{c.name}, final 4242\x60}).click();
 await expect(detail.getByText('Compra Meta: '+name,{exact:true})).toBeVisible();
 await writeFile(path.join(dir,prefix+'-interaction.json'),JSON.stringify({closedAndReopened:true,postCount:paymentPosts}));`);
replace('tests/e2e/cf019-rva03.integrated.spec.ts',' expect(paymentPosts).toBe(1);expect(account.balance)',` if(mode==='date-only'){
  await expect(pay).toHaveCount(0);
  const detail=page.getByRole('dialog',{name:\x60\x24{c.name} •••• 4242\x60,exact:true});
  await expect(detail.locator('.animate-spin')).toHaveCount(0);
  await detail.getByRole('button',{name:'Fechar detalhes da fatura',exact:true}).click();
  await expect(detail).toHaveCount(0);
  await page.getByRole('button',{name:\x60Ver fatura de \x24{c.name}, final 4242\x60}).click();
  await expect(detail.getByText('Compra Meta: '+name,{exact:true})).toBeVisible();
 }
 expect(paymentPosts).toBe(1);expect(account.balance)`);
for(const file of ['next.config.ts','tests/e2e/cf019-rva03.integrated.spec.ts']){
 let diff;try{diff=execFileSync('git',['diff','--no-index','--',path.join(root,'controle-financeiro-frontend',file),path.join(front,file)],{encoding:'utf8'});}catch(e){if(e.status!==1)throw e;diff=e.stdout;}
 fs.writeFileSync(path.join(evidence,path.basename(file)+'.patch'),diff);
}
fs.writeFileSync(path.join(evidence,'runtime.txt'),runtime+'\nCandidate 18c7150. Product sources unmodified. Native clocks versus original, four cases, no retry.\n');
