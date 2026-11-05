import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const [runtimeArg,readinessMode,selected='cf015']=process.argv.slice(2);
assert.ok(['cf015','rf15','both'].includes(selected));
assert.ok(readinessMode===undefined||readinessMode==='--compile-ready');
const runtime=path.resolve(runtimeArg??'');
assert.match(path.basename(runtime),/^zoom-assistido-[a-z0-9-]+$/);
const root=path.resolve(import.meta.dirname,'../../..');
const main=path.resolve(root,'../../controle-financeiro');
assert.equal(path.dirname(runtime),path.resolve(main,'../controle-financeiro-runtimes/preparacao-adocao'));
const out=path.join(runtime,'diagnostico-frio');
fs.mkdirSync(out);
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const prepared=JSON.parse(fs.readFileSync(path.join(runtime,'prepared.json')));
assert.ok(!fs.existsSync(path.join(runtime,'s/f/.next')),'Cold frontend required');
for(const item of prepared.files) assert.equal(hash(path.join(runtime,'s',item.copy)),item.actual,item.file);
const scenarios=selected==='both'?['cf015','rf15']:[selected];
const java=path.join(runtime,'s/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/Rf15RemediationBrowserTest.java');
const originals=[];
function edit(file,modify) {
  const before=fs.readFileSync(file,'utf8'), after=modify(before);
  assert.notEqual(after,before);
  const archived=path.join(out,path.basename(file)+'.original');
  fs.writeFileSync(archived,before,{flag:'wx'});
  fs.writeFileSync(file,after);
  originals.push({file,archived,before:hash(archived),after:hash(file)});
}
for(const scenario of scenarios) {
const owner=scenario==='cf015'?'cf015-native-zoom':'rf15-native-chrome';
const filename=scenario==='cf015'?'cf015.native-zoom.integrated.spec.ts':'rf15-native-chrome.integrated.spec.ts';
const title=scenario==='cf015'?'R10: zoom nativo 200% com ações, rolagem e foco':'RF15: zoom nativo Chrome 200% com ações, rolagem e foco';
const spec=path.join(runtime,'s/f/tests/e2e',filename);
edit(spec,text=>{
  text=text.replace('test('+JSON.stringify(title),'test('+JSON.stringify('Diagnóstico '+scenario.toUpperCase()+': preparação e fatura antes do zoom'));
  text=text.replace('  try {','  let context: import("@playwright/test").BrowserContext | undefined;\n  let page: import("@playwright/test").Page | undefined;\n  const events: unknown[] = []; const pending: Promise<void>[] = []; let registered = false; let preparationReady = false;\n  const started = Date.now();\n  try {');
  text=text.replace('    const context =','    context =');
  text=text.replace('    const page = await context.newPage();',String.raw`
    // The Playwright runner starts tracing; close this context explicitly to flush it.
    page = await context.newPage();
    page.on("request",request=>{ const u=new URL(request.url()); if(u.pathname.startsWith("/api/auth")) events.push({type:"request",at:Date.now()-started,path:u.pathname,method:request.method()}); });
    page.on("response",response=>{ const u=new URL(response.url()); if(u.pathname.startsWith("/api/auth")) pending.push((async()=>{ const item: Record<string,unknown>={type:"response",at:Date.now()-started,path:u.pathname,status:response.status()}; if(response.status()>=400) item.problem=await response.text(); events.push(item); })()); });
    page.on("requestfailed",request=>events.push({type:"requestfailed",at:Date.now()-started,path:new URL(request.url()).pathname,failure:request.failure()}));
    page.on("pageerror",error=>events.push({type:"pageerror",at:Date.now()-started,message:error.message}));
    await page.addInitScript("window.__zoomDiagnostic=[]; document.addEventListener('submit', e => {window.__zoomDiagnostic.push({type:'submit',at:performance.now(),trusted:e.isTrusted,fields:Array.from(e.target.querySelectorAll('input')).map(i=>({name:i.name,length:i.value.length,valid:i.validity.valid,ariaInvalid:i.getAttribute('aria-invalid')}))})},true); document.addEventListener('invalid',e=>window.__zoomDiagnostic.push({type:'invalid',name:e.target.name,valid:false}),true);");
`);
  const registration='    await registerSyntheticUser(page, fixtureUser("B", process.env.CF_E2E_NAMESPACE!, "'+owner+'", "zoom"));';
  assert.ok(text.includes(registration));
  text=text.replace(registration,registration+'\n    registered = true;');
  const ready='    await writeFile(path.join(directory, "ready.json"), JSON.stringify({ browser: browser.version(), before, project: info.project.name }, null, 2));';
  assert.ok(text.includes(ready));
  text=text.replace(ready,ready+String.raw`
    const session=await page.request.get("/api/auth/user");
    expect(session.status()).toBe(200);
    const user=await session.json();
    expect(user.email).toBe(fixtureUser("B",process.env.CF_E2E_NAMESPACE!,"cf015-native-zoom","zoom").email);
    await page.reload();
    await expect(page.getByRole("button",{name:"Ver fatura de Cartão sintético para zoom, final 4242"})).toBeVisible();
    const preparationOpener=page.getByRole("button",{name:"Ver fatura de Cartão sintético para zoom, final 4242"});
    await preparationOpener.click();
    const preparationInvoice=page.getByRole("dialog",{name:"Cartão sintético para zoom •••• 4242",exact:true});
    await expect(preparationInvoice).toBeVisible();
    await expect(preparationInvoice.getByText("Compra 12 com descrição longa para zoom",{exact:true})).toBeAttached();
    await page.screenshot({path:path.join(directory,"invoice-preparation-100.png")});
    await page.keyboard.press("Escape");
    await expect(preparationInvoice).toHaveCount(0);
    preparationReady=true;
    return; // Preparation prefix only. Native zoom and the full scenario are NOT executed or approved.
`);
  text=text.replace('  } finally { await browser.close(); }',String.raw`
  } finally {
    if(page && context) {
      await Promise.allSettled(pending);
      const fields=await page.locator("input").evaluateAll(inputs=>inputs.map(input=>({name:input.getAttribute("name"),ariaInvalid:input.getAttribute("aria-invalid"),valid:(input as HTMLInputElement).validity.valid,length:(input as HTMLInputElement).value.length}))).catch(()=>[]);
      const cookies=(await context.cookies()).map(cookie=>({name:cookie.name,domain:cookie.domain,expires:cookie.expires,httpOnly:cookie.httpOnly}));
      const browserState=await page.evaluate("({events:window.__zoomDiagnostic??[],browserNow:new Date().toISOString(),url:location.href})").catch(()=>null);
      await writeFile(path.join(directory,"diagnosis.json"),JSON.stringify({scope:"Preparation only; no full scenario approval",registered,preparationReady,events,fields,cookies,browserState,alerts:await page.getByRole("alert").allTextContents().catch(()=>[])},null,2));
      await page.screenshot({path:path.join(directory,"diagnosis.png")}).catch(()=>{});
      await context.close(); // Flush runner trace before browser.close().
    }
    await browser.close();
  }`);
  return text.replace('fixtureUser("B",process.env.CF_E2E_NAMESPACE!,"cf015-native-zoom","zoom").email','fixtureUser("B",process.env.CF_E2E_NAMESPACE!,"'+owner+'","zoom").email');
});
}
edit(java,text=>{
  text=text.replace('"--trace=retain-on-failure"','"--trace=on"');
  const before='        Process p=pb.start();';
  const snapshot=String.raw`        Files.writeString(evidence.resolve("database-before.json"),new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(Map.of("users",sql.queryForObject("select count(*) from users",Integer.class),"namespaceUsers",sql.queryForObject("select count(*) from users where email like ?",Integer.class,"%"+namespace+"%"))));
`;
  text=text.replace(before,snapshot+before);
  const after='        StringBuilder persisted=';
  assert.ok(text.includes(after));
  text=text.replace(after,String.raw`        Files.writeString(evidence.resolve("database-after.json"),new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(Map.of("users",sql.queryForObject("select count(*) from users",Integer.class),"namespaceUsers",sql.queryForObject("select count(*) from users where email like ?",Integer.class,"%"+namespace+"%"),"accounts",sql.queryForObject("select count(*) from accounts",Integer.class),"cards",sql.queryForObject("select count(*) from credit_cards",Integer.class),"purchases",sql.queryForObject("select count(*) from card_transactions",Integer.class))));
`+after);
  return text;
});
if(readinessMode==='--compile-ready') {
  edit(path.join(runtime,'s/f/tests/e2e/playwright.rf15.config.ts'),text=>{
    assert.ok(text.includes('export default defineConfig({ ...base,'));
    return text.replace('export default defineConfig({ ...base,',"export default defineConfig({ ...base, globalSetup: './support/zoom-readiness.mjs',");
  });
  fs.copyFileSync(path.join(import.meta.dirname,'preparacao.mjs'),path.join(runtime,'s/f/tests/e2e/support/zoom-readiness.mjs'));
}
fs.writeFileSync(path.join(out,'instrumentation.json'),JSON.stringify({candidate:prepared.candidate,originals,scope:'Runtime-only observer and stopping after original preparation; original helper/15s unchanged'},null,2));
const env={...process.env};
for(const key of Object.keys(env)) if(/^(SPRING_|RESEND_|BRAPI_|JWT_|DB_|DATABASE_|BACKEND_API_URL|NODE_OPTIONS|CF_|REVALIDATE_|RESIDUAL_|RF15_|PLAYWRIGHT_)/.test(key)) delete env[key];
const jdk=path.join(main,'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
fs.mkdirSync(path.join(out,'temp'));
Object.assign(env,{JAVA_HOME:jdk,PATH:path.join(jdk,'bin')+path.delimiter+process.env.PATH,CF_BROWSER_DIAGNOSTICS:'1',PLAYWRIGHT_BROWSERS_PATH:'0',NEXT_TELEMETRY_DISABLED:'1',TEMP:path.join(out,'temp'),TMP:path.join(out,'temp')});
if(readinessMode==='--compile-ready')env.ZOOM_READINESS_DIR=path.join(out,'readiness');
const args=['--offline','--batch-mode','-Duser.timezone=UTC','-Dtest=Rf15RemediationBrowserTest','-Dreview.grep=Diagnóstico '+(selected==='both'?'(CF015|RF15)':selected.toUpperCase())+': preparação e fatura antes do zoom$','-Dcf034.reportsDirectory='+path.join(out,'surefire'),'-Dcf.browser.evidence='+path.join(out,'browsers'),'test'];
const selection=spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test','--config','tests/e2e/playwright.rf15.config.ts','--grep',args.find(value=>value.startsWith('-Dreview.grep=')).slice('-Dreview.grep='.length),'--list'],{cwd:path.join(runtime,'s/f'),env,encoding:'utf8',windowsHide:true});
fs.writeFileSync(path.join(out,'selection.txt'),selection.stdout+selection.stderr,{flag:'wx'});
assert.equal(selection.status,0,'Diagnostic parser/selection must pass before starting services');
assert.match(selection.stdout,scenarios.length===2?/Total: 2 tests in 2 files/:/Total: 1 test in 1 file/);
assert.ok(!fs.existsSync(path.join(runtime,'s/f/.next')),'Listing must not warm the frontend');
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const command="& './mvnw.cmd' "+args.map(quote).join(' ')+'; exit $LASTEXITCODE';
const fd=fs.openSync(path.join(out,'maven.log'),'wx');
const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{cwd:path.join(runtime,'s/controle-financeiro-backend'),env,windowsHide:true,stdio:['ignore',fd,fd],timeout:15*60*1000});
fs.closeSync(fd);
fs.writeFileSync(path.join(out,'execution.json'),JSON.stringify({at:new Date(),exit:result.status,error:result.error?.message,args,logSha256:hash(path.join(out,'maven.log'))},null,2));
console.log(JSON.stringify({exit:result.status,evidence:out,fullScenariosExecuted:false}));
process.exitCode=result.status??1;
