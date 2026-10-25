import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {writeJson} from '../../../.github/scripts/source.mjs';
const execution=path.resolve(process.argv[2]??'');
if(process.platform!=='win32'||!execution.includes(`${path.sep}controle-financeiro-runtimes${path.sep}CF-034${path.sep}`))throw new Error('Only the disposable Windows runtime');
const front=path.join(execution,'checkout/controle-financeiro-frontend');
const require=createRequire(path.join(front,'package.json'));
const {chromium}=require('@playwright/test');
const browsers=path.join(front,'node_modules/playwright-core/.local-browsers');
const short=path.join(execution,'b');
if(fs.existsSync(short))throw new Error('New junction required');
fs.symlinkSync(browsers,short,'junction');
const suffix='chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe';
const longExe=path.join(browsers,suffix),shortExe=path.join(short,suffix);
const report={long:{path:longExe,length:longExe.length,exists:fs.existsSync(longExe)},short:{path:shortExe,length:shortExe.length,exists:fs.existsSync(shortExe)},sameRealPath:fs.realpathSync(longExe)===fs.realpathSync(shortExe),productURLExercised:false,nativeZoomExercised:false};
for(const [name,executablePath] of [['long',longExe],['short',shortExe]]){
  let browser;
  try{browser=await chromium.launch({headless:true,executablePath});report[name].launched=true;report[name].version=browser.version();}
  catch(error){report[name].launched=false;report[name].error=String(error.message).split('\n')[0];}
  finally{if(browser)await browser.close();}
}
writeJson(path.join(execution,'browser-path-diagnostic.json'),report);
if(!report.sameRealPath||report.long.launched||!report.short.launched)throw new Error('Path-length hypothesis not demonstrated');
console.log(JSON.stringify(report));
