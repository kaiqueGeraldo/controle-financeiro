import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const [mode,arg,label]=process.argv.slice(2),runtime=path.resolve(arg),root=path.resolve(import.meta.dirname,'../../..'),s=path.join(runtime,'s'),review=path.join(root,'tasks/evidencias/revalidacao-PR3-expanded-residual');
assert.match(path.basename(runtime),/^rr3-01-/);const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
if(mode==='live'){
 const b=path.join(s,'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api');
 const java=fs.readFileSync(path.join(b,'MilestoneRemediationBrowserTest.java'),'utf8').replaceAll('MilestoneRemediationBrowserTest','RR3LiveGeometryProbe').replace('tests/e2e/playwright.milestone-remediation.config.ts','tests/e2e/playwright.rr3-live.config.ts');
 fs.writeFileSync(path.join(b,'RR3LiveGeometryProbe.java'),java,{flag:'wx'});
 const src=path.join(review,'live-geometry.ts.txt'),dest=path.join(s,'f/tests/e2e/rr3.live-geometry.probe.ts');fs.copyFileSync(src,dest);assert.equal(sha(src),sha(dest));
 fs.writeFileSync(path.join(s,'f/tests/e2e/playwright.rr3-live.config.ts'),"import {defineConfig} from '@playwright/test';import base from './playwright.milestone-review.config';export default defineConfig({...base,testMatch:['**/rr3.live-geometry.probe.ts']});\n",{flag:'wx'});
 console.log(JSON.stringify({liveSource:sha(src),copy:sha(dest)}));
}else{
 assert.equal(mode,'static');assert.match(label,/^[a-z0-9-]+$/);const stage=path.join(runtime,label),front=path.join(stage,'s/f'),dest=path.join(front,'tests/e2e/support/text-geometry.ts');
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(s,'f/tests/e2e/support/text-geometry.ts'),dest);fs.symlinkSync(path.join(s,'f/node_modules'),path.join(front,'node_modules'),'junction');
 const probe=path.join(review,'geometry.mjs'),started=new Date(),r=spawnSync(process.execPath,[probe,stage],{cwd:root,encoding:'utf8',windowsHide:true,timeout:120000,env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:'0'}});
 fs.writeFileSync(path.join(stage,'stdout.txt'),r.stdout??'',{flag:'wx'});fs.writeFileSync(path.join(stage,'stderr.txt'),r.stderr??'',{flag:'wx'});
 const receipt={started,ended:new Date(),probe,probeSha256:sha(probe),observerSha256:sha(dest),exit:r.status,error:r.error?.message,stdout:r.stdout,stderr:r.stderr};
 fs.writeFileSync(path.join(stage,'execution.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));process.exitCode=r.status??1;
}
