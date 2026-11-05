import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';
import {sourceFor,snapshot,hash} from '../../../.github/scripts/source.mjs';
import {componentInputs,reuseComponents} from '../../../.github/scripts/component-reuse.mjs';
import {requireComponentCoverage} from '../../../.github/scripts/components.mjs';
import {backendSelection} from '../../../.github/scripts/suites.mjs';
import {requireBackendReports} from '../../../.github/scripts/ci.mjs';
import {verifyDirectory,validateResults,browserCases,identity} from '../../../.github/scripts/zoom-coverage.mjs';
import {artifactDirectory} from '../../../controle-financeiro-frontend/tests/e2e/support/artifacts.mjs';
import {javaArgfileText,writeNativeArgfile} from '../../../.github/scripts/maven-argfile.mjs';
const [out,short]=process.argv.slice(2),repo=path.resolve(import.meta.dirname,'../../..'),run='C:/cf-exp/1104d',read=f=>JSON.parse(fs.readFileSync(f)),prior='C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/preparacao-adocao/componentes-completo-20261103-01';
const checks=[],record=(name,extra={})=>checks.push({name,passed:true,...extra});
const source=sourceFor(run+'/s'),jarHash=hash(fs.readFileSync(run+'/all/api-0.0.1.jar'));
assert.deepEqual(backendSelection(repo,'expanded','win32'),read(run+'/all/backend-selection.json'));record('HEAD selection exactly equals executed116, including native contract');
const reused=reuseComponents(run+'/reuse',source),baseline=read(prior+'/current-source.json');assert.deepEqual(componentInputs(source),componentInputs(baseline));record('Final HEAD validator accepts preserved Windows626 and unchanged Linux input closure',reused.coverage);
const changed=structuredClone(source);changed.files.find(f=>f.path.endsWith('/support/server-clock.cjs')).sha256='isolated-drift';assert.throws(()=>reuseComponents(run+'/reuse',changed),/Component inputs changed/);record('Final validator rejects shared preload drift in cloned manifest');
const winReceipt=read(run+'/reuse/component-reuse.json'),winReport=read(winReceipt.report),winAudit=read(winReceipt.audit),winContext=winAudit.context;
for(const [name,mutate] of [
 ['component identity missing',r=>r.testResults[0].assertionResults.pop()],
 ['component required skip',r=>r.testResults[0].assertionResults[0].status='pending'],
 ['component failure',r=>r.testResults[0].assertionResults[0].status='failed']]){const clone=structuredClone(winReport);mutate(clone);assert.throws(()=>requireComponentCoverage(clone,winAudit,winContext,winReceipt.root+'/controle-financeiro-frontend'));record('Reject '+name);}
assert.throws(()=>requireComponentCoverage(winReport,winAudit,{...winContext,runId:'another-run'},winReceipt.root+'/controle-financeiro-frontend'));record('Reject incompatible component provenance');
const observer=read(prior+'/linux-02/observation/observer.json'),completed=observer.completed,collected=observer.collected;
assert.equal(new Set(collected.map(x=>x.id)).size,626);assert.equal(new Set(completed.map(x=>x.id)).size,626);assert.deepEqual(collected.map(x=>x.id).sort(),completed.map(x=>x.id).sort());assert.equal(observer.remainingActive.length,0);assert.equal(observer.errors.length,0);assert.equal(observer.reason,'passed');
const events=observer.events;assert.equal(events.filter(x=>x.event==='start').length,626);assert.equal(events.filter(x=>x.event==='end').length,626);record('Linux observer:626 unique IDs,626 starts/ends, no lost workers',{files:new Set(observer.moduleEvents.map(x=>x.file)).size});
const zdir=run+'/all/browsers/Rf15RemediationBrowserTest/zoom-selection',manifest=read(zdir+'/manifest.json'),universe=read(zdir+'/universe.json'),z=read(zdir+'/results.json'),invocation=read(zdir+'/invocation.json'),context=read(run+'/all/result.json').zoomException.context;
const positive=verifyDirectory(zdir,context);assert.equal(positive.tests,23);assert.equal(manifest.A.length,25);assert.equal(manifest.B.length,2);record('RF15 exact25=2+23 and23 actual original required identities',{tests:positive.tests});
for(const [name,mutate] of [
 ['missing mandatory RF15 identity',r=>{let s=r.suites;while(!s[0].specs?.length)s=s[0].suites;s[0].specs.pop();}],
 ['required RF15 skip',r=>{const t=browserCases(r)[0].test;t.status='skipped';t.results[0].status='skipped';}],
 ['failed RF15 result',r=>browserCases(r)[0].test.results[0].status='failed'],
 ['retry RF15 result',r=>browserCases(r)[0].test.results.push(structuredClone(browserCases(r)[0].test.results[0]))],
 ['incompatible RF15 provenance',r=>r.config.metadata.zoomException.runId='another-run'],
 ['old RF15 report',r=>r.stats.startTime='2000-01-01T00:00:00.000Z']]){
 const clone=structuredClone(z);mutate(clone);assert.throws(()=>validateResults(manifest,browserCases(universe),context,clone,invocation.started));record('Reject '+name);
}
const cloneDir=path.join(out,'junit-clone');fs.mkdirSync(cloneDir);for(const f of fs.readdirSync(run+'/all/surefire').filter(f=>f.startsWith('TEST-')&&f.endsWith('.xml')))fs.copyFileSync(run+'/all/surefire/'+f,path.join(cloneDir,f));
const chosen=path.join(cloneDir,'TEST-com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest.xml'),original=fs.readFileSync(chosen),before=hash(original),selection=read(run+'/all/backend-selection.json');
fs.unlinkSync(chosen);assert.throws(()=>requireBackendReports(cloneDir,selection),/AdoptionNativeSocketsTest/);fs.writeFileSync(chosen,original);record('Reject missing Windows mandatory report, restored by hash');
for(const kind of ['skipped','failures','errors']){try{fs.writeFileSync(chosen,original.toString().replace(kind+'="0"',kind+'="1"'));assert.throws(()=>requireBackendReports(cloneDir,selection),/invalid counts/);record('Reject Java '+kind);}finally{fs.writeFileSync(chosen,original);assert.equal(hash(fs.readFileSync(chosen)),before);}}
assert.equal(requireBackendReports(cloneDir,selection).tests,928);
const fixture=path.join(out,'guard-clone');fs.mkdirSync(fixture);fs.mkdirSync(fixture+'/controle-financeiro-frontend');fs.writeFileSync(fixture+'/controle-financeiro-frontend/input.ts','preserved');snapshot(fixture,{commit:'isolated-control'});const guardBefore=hash(fs.readFileSync(fixture+'/controle-financeiro-frontend/input.ts'));
fs.writeFileSync(fixture+'/controle-financeiro-frontend/unwanted-output.json','synthetic artifact');assert.throws(()=>sourceFor(fixture),/file set changed/);fs.unlinkSync(fixture+'/controle-financeiro-frontend/unwanted-output.json');assert.equal(hash(fs.readFileSync(fixture+'/controle-financeiro-frontend/input.ts')),guardBefore);sourceFor(fixture);record('Source guard rejects generated output; exact fixture restoration');
process.env.CF_SOURCE_ROOT=run+'/s';process.env.CF_REVIEW_EVIDENCE=short+'/external';assert.equal(artifactDirectory('download','legacy'),path.join(short,'external','download'));process.env.CF_REVIEW_EVIDENCE=run+'/s/controle-financeiro-frontend/tests/artifacts';assert.throws(()=>artifactDirectory('download','legacy'),/outside/);record('Physical artifact resolver accepts external output and rejects sources');
// Real launch uses the exact original executable/cwd, new private TEMP, no product service.
const b=read(run+'/prepare/browser.json'),require=createRequire(run+'/s/controle-financeiro-frontend/package.json'),{chromium}=require('playwright');process.env.PLAYWRIGHT_BROWSERS_PATH='0';
assert.equal(hash(fs.readFileSync(b.executable)),b.sha256);assert.equal(hash(fs.readFileSync(b.oldExecutable)),b.sha256);const old=spawnSync(b.oldExecutable,['--version'],{encoding:'utf8',windowsHide:true,timeout:10000});assert.equal(old.error?.code,'ENOENT');
let browser;try{browser=await chromium.launch();const page=await browser.newPage({acceptDownloads:true});await page.setContent('<title>Independent path control</title><a download="synthetic.txt" href="data:text/plain,synthetic">download</a>');assert.equal(await page.title(),'Independent path control');await page.screenshot({path:path.join(out,'browser-control.png')});const event=page.waitForEvent('download');await page.getByRole('link').click();const d=await event;await d.saveAs(path.join(out,'synthetic-download.txt'));assert.equal(fs.readFileSync(path.join(out,'synthetic-download.txt'),'utf8'),'synthetic');record('Real short-root Chromium launch/page/screenshot/download/close versus old ENOENT',{executable:b.executable,sha256:b.sha256,temp:process.env.TEMP,version:browser.version()});}finally{await browser?.close();}
const argfile=path.join(short,'unicode.args');const codepage=writeNativeArgfile(argfile,javaArgfileText(['-Dreview=ações com espaço','-version']));const jdk='C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1/bin/java.exe';const java=spawnSync(jdk,['@'+argfile],{encoding:'utf8',windowsHide:true});assert.equal(java.status,0);record('JDK21 executes strict native Unicode argfile',{nativeCodePage:codepage,sha256:hash(fs.readFileSync(argfile))});
assert.throws(()=>writeNativeArgfile(path.join(short,'unrepresentable.args'),javaArgfileText(['unrepresentable-\u{1f600}'])),/encoding failed/);assert.equal(fs.existsSync(path.join(short,'unrepresentable.args')),false);record('Native encoder rejects unrepresentable input before file creation');
assert.equal(sourceFor(run+'/s').digest,source.digest);assert.equal(hash(fs.readFileSync(run+'/all/api-0.0.1.jar')),jarHash);record('Executed863 inputs and package unchanged after controls');
fs.writeFileSync(path.join(out,'controles.json'),JSON.stringify({at:new Date().toISOString(),head:'9334264d4d96e8b64a2de16090ef4c5a77496441',candidate:source.commit,validatorSha256:hash(fs.readFileSync(repo+'/.github/scripts/component-reuse.mjs')),checks,scope:'No product suite rerun, no financial API mocked, mutations only in isolated clones'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:checks.length,checks:checks.map(x=>x.name)}));
