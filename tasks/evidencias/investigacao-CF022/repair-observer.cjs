const fs=require('node:fs'),path=require('node:path');
const root=process.cwd();
const file=path.join(root,'.cf22/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/browser.cjs');
let s=fs.readFileSync(file,'utf8');
fs.writeFileSync(path.join(__dirname,'browser-observer-run01.cjs.txt'),s);
s=s.replace('try {\n        const page =','let tracingStarted=false;\n      try {\n        const page =');
s=s.replace('await expect(page).toHaveURL(/\\/$/);',`// Synchronize cold dev route compilation outside the habit experiment.
        expect((await page.request.get('/')).status()).toBe(200);
        await expect(page).toHaveURL(/\\/$/);`);
s=s.replace('await context.tracing.start({ screenshots: true, snapshots: true });','await context.tracing.start({ screenshots: true, snapshots: true }); tracingStarted=true;');
s=s.replace('} catch (error) {\n        const pages',"} catch (error) {\n        console.error('ORIGINAL ERROR',error);\n        const pages");
s=s.replace('await context.tracing.stop({ path:', 'if(tracingStarted)await context.tracing.stop({ path:');
fs.writeFileSync(file,s);
fs.writeFileSync(path.join(__dirname,'browser-observer-run02.cjs.txt'),s);
console.log('Original errors preserved; tracing guarded; cold authenticated page compilation observed before navigation assertion.');
