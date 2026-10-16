const fs=require('fs'),path=require('path');
const e='tasks/evidencias/investigacao-CF022',p='.cf22/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/browser.cjs';
let s=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
fs.writeFileSync(path.join(e,'browser-observer-run02-actual.cjs.txt'),s);
s=s.replace('      \n      try {\n        const page =','      let tracingStarted=false;\n      try {\n        const page =');
s=s.replace('} catch (error) {\n        const pages',"} catch (error) {\n        console.error('ORIGINAL ERROR',error);\n        const pages");
if(!s.includes('let tracingStarted=false;')||!s.includes("console.error('ORIGINAL ERROR'"))throw Error('Observer patch absent');
fs.writeFileSync(p,s);fs.writeFileSync(path.join(e,'browser-observer-run03.cjs.txt'),s);
