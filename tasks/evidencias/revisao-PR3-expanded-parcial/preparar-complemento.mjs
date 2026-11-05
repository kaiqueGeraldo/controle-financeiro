import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const runtime=path.resolve(process.argv[2]);
const root=path.resolve(import.meta.dirname,'../../..');
const subject=path.join(runtime,JSON.parse(fs.readFileSync(path.join(runtime,'inputs-candidate.json'))).sourceDirectory??'subject');
const visualOnly=/^visual-(only|v[0-9]+)$/.test(process.argv[3]??'');
assert.ok(fs.existsSync(path.join(runtime,'candidate-directed/execution.json')));
// Short physical frontend path avoids the Windows executable-path limit.
// Source checkout and original harness files remain unchanged.
const front='controle-financeiro-frontend/',short='f/';
if(!visualOnly)for(const name of execFileSync('git',['ls-files',front],{cwd:root,encoding:'utf8'}).trim().split('\n')){
 const to=path.join(subject,short,name.slice(front.length));fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(root,name),to);
}
const link=(from,to)=>{if(fs.statSync(from).isDirectory()){fs.mkdirSync(to);for(const name of fs.readdirSync(from))link(path.join(from,name),path.join(to,name));}else fs.linkSync(from,to);};
if(!visualOnly)link(path.join(subject,front,'node_modules'),path.join(subject,short,'node_modules'));
const file='controle-financeiro-frontend/tests/e2e/milestone-remediation.integrated.spec.ts';
const text=fs.readFileSync(path.join(root,file),'utf8');
const start=text.indexOf('test("SAN-D1 duas intenções'),end=text.indexOf('test("SAN-B criar item',start);
assert.ok(start>0&&end>start);
const payment=text.slice(start,end).replace('test("SAN-D1 duas intenções iguais, saldo pagável, recibo e conflito",','for(const kind of ["playwright","civil"] as const)test("REVIEW presence "+kind,').replace('await start(page,"payment");','await start(page,"payment-"+kind,kind);');
const spec=fs.readFileSync(path.join(import.meta.dirname,'visual-probe.ts.txt'),'utf8')+'\n'+payment;
const java='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/';
function clone(file,oldName,newName){return fs.readFileSync(path.join(root,file),'utf8').replaceAll(oldName,newName).replaceAll('resolveSibling("controle-financeiro-frontend")','resolveSibling("f")');}
const wrapper=clone(java+'MilestoneRemediationBrowserTest.java','MilestoneRemediationBrowserTest','ReviewerVisualBrowserProbe').replace('tests/e2e/playwright.milestone-remediation.config.ts','tests/e2e/playwright.reviewer-visual.config.ts');
const files={
 'f/tests/e2e/reviewer-visual.integrated.spec.ts':spec,
 'f/tests/e2e/playwright.reviewer-visual.config.ts':"import {defineConfig} from '@playwright/test';\nimport base from './playwright.milestone-remediation.config';\nexport default defineConfig({...base,testMatch:['**/reviewer-visual.integrated.spec.ts']});\n",
 'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/ReviewerVisualBrowserProbe.java':wrapper,
 [java+'ReviewerOpeningBrowserProbe.java']:clone(java+'IntegratedMilestoneBrowserReviewTest.java','IntegratedMilestoneBrowserReviewTest','ReviewerOpeningBrowserProbe'),
 [java+'infra/security/ReviewerAuthBrowserProbe.java']:clone(java+'infra/security/UserIsolationBrowserIntegrationTest.java','UserIsolationBrowserIntegrationTest','ReviewerAuthBrowserProbe'),
 'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/ReviewerDecimalContractProbe.java':fs.readFileSync(path.join(import.meta.dirname,'decimal-probe.java.txt'),'utf8'),
 'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/ReviewerContextLifecycleProbe.java':fs.readFileSync(path.join(import.meta.dirname,'lifecycle-probe.java.txt'),'utf8'),
};
const hashes=[];
for(const [file,content] of Object.entries(files)){if(visualOnly&&file!=='f/tests/e2e/reviewer-visual.integrated.spec.ts')continue;fs.writeFileSync(path.join(subject,file),content);hashes.push({file,sha256:createHash('sha256').update(fs.readFileSync(path.join(subject,file))).digest('hex')});}
fs.writeFileSync(path.join(runtime,visualOnly?`independent-${process.argv[3]==='visual-only'?'visual-v2':process.argv[3]}.json`:'independent-probes.json'),JSON.stringify({source:file,scope:'Additional observers in disposable copy; original assertions and files unchanged',files:hashes},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({independentFiles:hashes.length}));
