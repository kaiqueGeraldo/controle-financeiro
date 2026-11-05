import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const runtime=path.resolve(process.argv[2]);const meta=JSON.parse(fs.readFileSync(path.join(runtime,'prepared.json')));const root=path.resolve(import.meta.dirname,'../../..');assert.equal(meta.origin,root);
const cold=path.join(meta.subject,'cold');assert.ok(!fs.existsSync(cold));fs.mkdirSync(cold);
for(const rel of execFileSync('git',['ls-files','controle-financeiro-frontend'],{cwd:root,encoding:'utf8'}).trim().split('\n')){const to=path.join(cold,rel.slice('controle-financeiro-frontend/'.length));fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(root,rel),to);}
function link(from,to){const s=fs.lstatSync(from);assert.ok(!s.isSymbolicLink());if(s.isDirectory()){fs.mkdirSync(to);for(const n of fs.readdirSync(from))link(path.join(from,n),path.join(to,n));}else fs.linkSync(from,to);}
link(path.join(meta.subject,'f/node_modules'),path.join(cold,'node_modules'));
const dir='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/infra/security';
let java=execFileSync('git',['show','965b93c7:'+dir+'/UserIsolationBrowserIntegrationTest.java'],{cwd:root,encoding:'utf8'});java=java.replaceAll('UserIsolationBrowserIntegrationTest','ResidualColdAuthBrowserProbe').replace('resolveSibling("controle-financeiro-frontend")','resolveSibling("cold")').replace('infra/security/browser.cjs','infra/security/residual-browser.cjs').replace('runner.environment().put("PLAYWRIGHT_BROWSERS_PATH","0");','runner.environment().put("PLAYWRIGHT_BROWSERS_PATH","0");\n            runner.environment().put("RESIDUAL_OBSERVE_LATE","1");');fs.writeFileSync(path.join(meta.subject,dir,'ResidualColdAuthBrowserProbe.java'),java);
let driver=execFileSync('git',['show','965b93c7:'+dir+'/browser.cjs'],{cwd:root,encoding:'utf8'});
driver=driver.replace("const events = [];","const events = [];\n  const epoch=performance.now();\n  page.on('requestfinished',r=>events.push({kind:'finished',at:performance.now()-epoch,path:new URL(r.url()).pathname,timing:r.timing()}));");
driver=driver.replaceAll("{ kind: 'request',","{ kind: 'request', at:performance.now()-epoch,").replaceAll("{ kind: 'response',","{ kind: 'response', at:performance.now()-epoch,").replaceAll("{ kind: 'console',","{ kind: 'console', at:performance.now()-epoch,");
driver=driver.replace("    await page.getByRole('button', { name: registration ? 'Criar Conta' : 'Entrar', exact: true }).click();","    events.push({kind:'auth-click',owner,registration,at:performance.now()-epoch});\n    await page.getByRole('button', { name: registration ? 'Criar Conta' : 'Entrar', exact: true }).click();");
driver=driver.replace("      await page.screenshot({ path: path.join(evidence, 'last-state.png'), fullPage: true });",`      if(primaryFailure && process.env.RESIDUAL_OBSERVE_LATE==='1'){
        events.push({kind:'terminal-assertion-failed',at:performance.now()-epoch,message:primaryFailure.message});
        // Diagnostic continuation cannot turn the original failed assertion into a pass.
        try {
          const remaining=deadline-Date.now();
          if(remaining>0){const response=await page.waitForResponse(r=>new URL(r.url()).pathname==='/'&&r.status()===200,{timeout:remaining});await response.finished();events.push({kind:'late-protected-response',status:response.status(),at:performance.now()-epoch});}
          await page.getByRole('heading',{level:1}).first().waitFor({state:'visible',timeout:Math.max(1,deadline-Date.now())});
          events.push({kind:'late-paint',at:performance.now()-epoch,path:new URL(page.url()).pathname,heading:await page.getByRole('heading',{level:1}).first().innerText()});
        }catch(observationError){events.push({kind:'late-observation-error',at:performance.now()-epoch,message:observationError.message});}
      }
      await page.screenshot({ path: path.join(evidence, 'last-state.png'), fullPage: true });`);
fs.writeFileSync(path.join(meta.subject,dir,'residual-browser.cjs'),driver);
fs.writeFileSync(path.join(runtime,'cold-preparation.json'),JSON.stringify({at:new Date(),cold,cacheAbsentAtPreparation:!fs.existsSync(path.join(cold,'.next')),sameMandatoryJourney:true,timeoutAfterClick:5000,lateObservationCannotApprove:true},null,2)+'\n',{flag:'wx'});
console.log('One identified cold preparation ready; original 5s assertion unchanged');
