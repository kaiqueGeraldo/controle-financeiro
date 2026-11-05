import {wrapperDefinitions} from './browser-wrappers.mjs';
import {requireWrapperDiagnostics} from './wrapper-diagnostics.mjs';
import {reuseComponents} from './component-reuse.mjs';
import {javaArgfileInvocation} from './maven-argfile.mjs';
import fs from 'node:fs';
import {physicalPath} from './paths.mjs';
import {requireComponentCoverage} from './components.mjs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash,sourceFor,writeJson} from './source.mjs';
import {backendSelection} from './suites.mjs';
import {sanitizeText} from './sanitize.mjs';
import {spawnOwned} from './owned-process.mjs';
import {cancellation} from './cancellation.mjs';
import {decision as zoomDecision,label as zoomLabel,deferred as zoomDeferred,verifyDirectory,browserCases} from './zoom-coverage.mjs';

export function requireCounts(counts,label){
  if(!counts.tests||counts.failures||counts.errors||counts.skipped)throw new Error(`${label}: invalid counts ${JSON.stringify(counts)}`);
  return counts;
}
export async function sequence(stages,run){for(const stage of stages)await run(stage);}
export function mavenInvocation(platform,args,options={}){
  if(platform==='linux')return {executable:'sh',args:['./mvnw','--batch-mode',...args]};
  if(platform==='win32'&&options.argfile)return javaArgfileInvocation(platform,args);
  if(platform!=='win32')throw new Error(`Unknown Maven JVM platform: ${platform}`);
  // The owned Windows launcher quotes argv using Win32 rules. cmd /c parses
  // embedded quotes differently; use a literal PowerShell invocation instead.
  const literal=value=>"'"+value.replaceAll("'","''")+"'";
  const script=`& './mvnw.cmd' ${['--batch-mode',...args].map(literal).join(' ')}; exit $LASTEXITCODE`;
  return {executable:'powershell.exe',args:['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')]};
}
export function junitCounts(directory){
  const counts={tests:0,failures:0,errors:0,skipped:0};
  for(const file of fs.readdirSync(directory).filter(p=>p.startsWith('TEST-')&&p.endsWith('.xml'))){
    const text=fs.readFileSync(path.join(directory,file),'utf8');
    const suite=text.match(/<testsuite\b[^>]*>/)?.[0];if(!suite)throw new Error(`Missing testsuite: ${file}`);
    for(const key of Object.keys(counts)){const v=suite.match(new RegExp(`\\b${key}="(\\d+)"`));if(!v)throw new Error(`Missing ${key}: ${file}`);counts[key]+=Number(v[1]);}
  }return counts;
}
export function requireReportedClasses(directory,required){
  if(!required.length)throw new Error('Empty mandatory backend selection');
  const reported=fs.readdirSync(directory).filter(f=>f.startsWith('TEST-')&&f.endsWith('.xml')).map(f=>f.slice(5,-4));
  const missing=required.filter(name=>!reported.some(r=>r===name||r.startsWith(name+'$')));
  if(missing.length)throw new Error(`Mandatory classes have no report: ${missing.join(',')}`);
}
export function requireBackendReports(directory,selection){
  requireReportedClasses(directory,selection.selected);
  return requireCounts(junitCounts(directory),'backend');
}
export function freshOutput(rootArg,outArg){
  const root=physicalPath(rootArg),out=physicalPath(outArg);
  if(out===root||out.startsWith(root+path.sep))throw new Error('Evidence must be outside the source checkout');
  if(fs.existsSync(out))throw new Error('Never reuse an evidence directory');
  fs.mkdirSync(out,{recursive:true});return out;
}
export function componentSummary(vitest,root){
  return {
    counts:{tests:vitest.numTotalTests,failures:vitest.numFailedTests,errors:vitest.numRuntimeErrorTestSuites??0,skipped:(vitest.numPendingTests??0)+(vitest.numTodoTests??0)},
    failedFiles:(vitest.testResults??[]).filter(result=>result.status==='failed').map(result=>({
      file:path.relative(root,result.name),
      tests:(result.assertionResults??[]).filter(assertion=>assertion.status==='failed').map(assertion=>assertion.fullName),
    })),
  };
}
export function financialEvidence(report,directory){
  const root=fs.realpathSync.native(directory);
  const cases=browserCases(report).map(({project,file,titles,test})=>({
    project,file:file.replaceAll('\\','/'),titles,expectedStatus:test.expectedStatus,status:test.status,
    results:(test.results??[]).map(result=>({status:result.status,retry:result.retry,durationMs:result.duration})),
  }));
  const checkpoints=fs.readdirSync(root).filter(name=>/^(?:A|B|C|E2?|F|G|H|K|L|T[0-2])-[A-Za-z0-9-]+(?:\.xlsx\.analysis)?\.json$/.test(name)&&!name.endsWith('-network.json')).sort().map(file=>{
    const target=path.join(root,file);
    if(!fs.lstatSync(target).isFile()||!fs.realpathSync.native(target).startsWith(root+path.sep))throw new Error('Unsafe financial checkpoint path');
    const bytes=fs.readFileSync(target);return {file,sha256:hash(bytes),bytes:bytes.length};
  });
  return {cases,checkpoints,contents:'private; only identities, statuses and checkpoint file hashes published'};
}
const safe=text=>{try{return sanitizeText(text);}catch{return 'Diagnostic withheld: sanitization failed';}};

async function main(){
  const [stage='all',rootArg,outArg]=process.argv.slice(2);
  if(!['all','remaining','frontend','backend','windows-native','e2e','package','diagnose'].includes(stage)||!rootArg||!outArg)throw new Error('Usage: node .github/scripts/ci.mjs <all|remaining|frontend|backend|windows-native|e2e|package> <isolated-root> <new-output-dir>');
  const root=physicalPath(rootArg),out=freshOutput(root,outArg);
  const control=cancellation(out);
  const source=sourceFor(root),front=path.join(root,'controle-financeiro-frontend'),back=path.join(root,'controle-financeiro-backend');
  const report={source:{commit:source.commit,digest:source.digest,originalTreeChanges:source.originalTreeChanges},node:process.version,platform:process.platform,stage,started:new Date().toISOString(),steps:[],status:'running'};
  const zoomContext=process.env.CF034_SUITE==='expanded'?{candidate:source.commit,digest:source.digest,runId:control.runId,decisionSha:hash(fs.readFileSync(path.join(root,'docs/sdd/decisoes/005-excecao-temporaria-zoom-expanded.md')))}:null;
  if(zoomContext)report.zoomException={decision:zoomDecision,label:zoomLabel,deferred:zoomDeferred,context:zoomContext,status:'pending verification; not full visual acceptance'};
  const ci=process.env.GITHUB_ACTIONS==='true'?{repository:process.env.GITHUB_REPOSITORY,workflow:process.env.GITHUB_WORKFLOW,runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,job:process.env.GITHUB_JOB,event:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,headRef:process.env.GITHUB_HEAD_REF,baseRef:process.env.GITHUB_BASE_REF,checkoutSha:source.commit,runnerOS:process.env.RUNNER_OS,runnerArch:process.env.RUNNER_ARCH}:null;
  report.ci=ci;
  report.diagnosticOnly=stage==='diagnose';
  report.e2ePlanned=stage==='all'||stage==='remaining'||stage==='e2e';
  report.browserPlan=backendSelection(root,process.env.CF034_SUITE==='expanded'?'expanded':'smoke',process.platform).selected.filter(q=>Object.values(wrapperDefinitions).some(d=>d.qualified===q));
  if(stage==='diagnose')report.browserPlan=report.browserPlan.filter(q=>/\.(MilestoneRemediationBrowserTest|Rf15RemediationBrowserTest)$/.test(q));
  const env={...process.env,BACKEND_API_URL:'http://127.0.0.1:65535',PLAYWRIGHT_BROWSERS_PATH:'0',NEXT_TELEMETRY_DISABLED:'1',CF_SOURCE_ROOT:root,CF_TEST_ARTIFACTS:path.join(out,'frontend-artifacts')};
  for(const key of Object.keys(env))if(/^(SPRING_|RESEND_|BRAPI_|JWT_|DATABASE_URL|BACKEND_API_URL$)/.test(key)&&key!=='BACKEND_API_URL')delete env[key];
  for(const key of Object.keys(env))if(key.startsWith('CF_ZOOM_'))delete env[key];
  if(zoomContext)Object.assign(env,{CF_ZOOM_EXCEPTION:zoomDecision,CF_ZOOM_CANDIDATE:zoomContext.candidate,CF_ZOOM_DIGEST:zoomContext.digest,CF_ZOOM_RUN:zoomContext.runId,CF_ZOOM_DECISION_SHA:zoomContext.decisionSha,CF_BROWSER_DIAGNOSTICS:'1'});
  const npmCandidates=[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),path.resolve(path.dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')];
  if(process.platform!=='win32'){try{npmCandidates.push(fs.realpathSync(execFileSync('which',['npm'],{encoding:'utf8'}).trim()));}catch{}}
  const npm=npmCandidates.find(p=>fs.existsSync(p));if(!npm)throw new Error('npm CLI unavailable');
  async function command(name,executable,args,cwd,extraEnv={}){
    control.check();
    const display=value=>value.replaceAll(out,'${EVIDENCE_ROOT}').replaceAll(root,'${SOURCE_ROOT}');
    const start=Date.now();const entry={name,command:[path.basename(executable),...args.map(display)],cwd:path.relative(root,cwd),environment:extraEnv,started:new Date().toISOString(),exit:null};report.steps.push(entry);
    const log=fs.createWriteStream(path.join(out,`${name}.log`));
    await new Promise((resolve,reject)=>{
      const child=spawnOwned(executable,args,{cwd,env:{...env,...extraEnv},shell:false,windowsHide:true});control.attach(child);
      entry.ownerPid=child.pid;entry.ownership=process.platform==='win32'?'Windows Job Object; private owner pipe':'POSIX process group; remote validation pending';
      // Complete raw originals stay private. Redaction per chunk is unsafe.
      for(const stream of [child.stdout,child.stderr])stream.on('data',data=>log.write(data));
      child.once('error',error=>{entry.error=safe(error.message);log.end();reject(error);});
      child.once('close',code=>{control.detach(child);entry.exit=code;entry.durationMs=Date.now()-start;log.end(()=>code===0?resolve():reject(new Error(`${name} failed (${code}); see ${name}.log`)));});
    });
    control.check();
    console.log(`${name}: passed`);
  }
  const runNpm=(name,args,extraEnv)=>command(name,process.execPath,[npm,...args],front,extraEnv);
  const maven=(name,args)=>{if(process.env.CF_MAVEN_HOME){process.env.CF_MAVEN_BACKEND=back;process.env.CF_MAVEN_ARGFILE_ROOT=out;}const invocation=mavenInvocation(process.platform,args,{argfile:!!process.env.CF_MAVEN_HOME});return command(name,invocation.executable,invocation.args,back);};
  function invalidate(names){for(const name of names){const marker=path.join(root,`.ci-${name}.json`);if(fs.existsSync(marker))fs.unlinkSync(marker);}}
  async function frontend(){
    invalidate(['frontend','backend','e2e']);
    await runNpm('install',['ci','--no-audit','--no-fund']);
    await runNpm('lint',['run','lint','--','--max-warnings=0']);
    await runNpm('typecheck',['run','typecheck']);
    await runNpm('unit',['test']);
    const tests=[...fs.readFileSync(path.join(out,'unit.log'),'utf8').matchAll(/# tests (\d+)/g)].map(m=>Number(m[1]));
    if(tests.length!==3||tests.some(n=>n===0))throw new Error('Three nonempty timezone runs required');
    if([...fs.readFileSync(path.join(out,'unit.log'),'utf8').matchAll(/# (?:skipped|todo|cancelled|fail) (\d+)/g)].some(m=>Number(m[1])!==0))throw new Error('Unit tests contain skips, todos, cancellation or failures');
    report.unit={timezones:3,tests:tests.reduce((a,b)=>a+b,0)};
    if(process.env.CF_COMPONENT_REUSE){const reused=reuseComponents(process.env.CF_COMPONENT_REUSE,source);report.components=reused.counts;report.componentCoverage=reused.coverage;report.componentReuse=reused.proof;writeJson(path.join(out,'component-reuse.json'),reused.proof);}else{
    const componentFile=path.join(out,'components.json'),auditFile=path.join(out,'component-audit.json');
    const componentContext={candidate:source.commit,digest:source.digest,runId:control.runId};
    // These civil-midnight fixtures require the browser's São Paulo timezone.
    // The separate temporal unit gate still runs all three declared timezones.
    try{await runNpm('components',['run','test:component','--','--reporter=default','--reporter=json','--reporter=./tests/component/audit-reporter.mjs',`--outputFile=${componentFile}`],{TZ:'America/Sao_Paulo',CF_TEST_TIMEZONE:'America/Sao_Paulo',CF_COMPONENT_AUDIT:auditFile,CF_COMPONENT_CONTEXT:JSON.stringify(componentContext)});}
    finally{
      if(fs.existsSync(componentFile)){
        const summary=componentSummary(JSON.parse(fs.readFileSync(componentFile)),root);
        report.components=summary.counts;report.componentFailures=summary.failedFiles;
        // Only counts and committed test identifiers; raw assertion messages/DOM stay private.
        console.log(safe(JSON.stringify({components:summary})));
      }
    }
    requireCounts(report.components,'components');
    report.componentCoverage=requireComponentCoverage(JSON.parse(fs.readFileSync(componentFile)),JSON.parse(fs.readFileSync(auditFile)),componentContext,front);
    }
    await runNpm('build',['run','build']);
    await runNpm('browser-install',['run','test:e2e:install']);
    writeJson(path.join(root,'.ci-frontend.json'),{source:source.digest,status:'passed',componentReuse:report.componentReuse??null});
  }
  async function backend(scope='all'){
    if(scope==='all')invalidate(['backend','e2e']);
    // Maven below launches a local JVM on this process platform. Container
    // callers must run this controller inside the target container as well.
    const selection=backendSelection(root,process.env.CF034_SUITE==='expanded'?'expanded':'smoke',process.platform,scope==='diagnostic'?'all':scope);
    if(scope==='diagnostic'){selection.selected=selection.selected.filter(q=>/\.(MilestoneRemediationBrowserTest|Rf15RemediationBrowserTest)$/.test(q));report.browserPlan=selection.selected;}
    writeJson(path.join(out,'backend-selection.json'),selection);report.selection=selection;
    await maven('maven-version',['--version']);
    const reports=path.join(out,'surefire');
    try{await maven('backend',['-Duser.timezone=UTC','-Dspring.test.context.cache.maxSize=4','-DfailIfNoTests=true','-Dsurefire.failIfNoSpecifiedTests=true',`-Dtest=${selection.selected.join(',')}`,`-Dcf034.reportsDirectory=${reports}`,`-Dcf.browser.evidence=${path.join(out,'browsers')}`,scope==='all'?'verify':'test']);}
    finally{if(fs.existsSync(reports))report.backend=junitCounts(reports);}
    report.backend=requireBackendReports(reports,selection);
    report.wrapperDiagnostics=requireWrapperDiagnostics(out,selection,source,ci);
    if(zoomContext&&selection.selected.includes('com.controlefinanceiro.api.Rf15RemediationBrowserTest'))report.zoomCoverage=verifyDirectory(path.join(out,'browsers/Rf15RemediationBrowserTest/zoom-selection'),zoomContext);
    report.junitReports=fs.readdirSync(reports).filter(f=>f.startsWith('TEST-')&&f.endsWith('.xml')).sort().map(file=>({file,sha256:hash(fs.readFileSync(path.join(reports,file)))}));
    if(scope==='platform-only'||scope==='diagnostic')return;
    const jars=fs.readdirSync(path.join(back,'target')).filter(f=>f.endsWith('.jar'));
    if(jars.length!==1)throw new Error('Verify must produce exactly one executable JAR');
    writeJson(path.join(root,'.ci-backend.json'),{source:source.digest,status:'passed',counts:report.backend,jar:jars[0],jarSha256:hash(fs.readFileSync(path.join(back,'target',jars[0])))});
  }
  async function windowsNative(){
    if(process.platform!=='win32')throw new Error('windows-native requires a real Windows controller and local Windows JVM');
    await backend('platform-only');
  }
  function prerequisite(name){const record=JSON.parse(fs.readFileSync(path.join(root,`.ci-${name}.json`)));if(record.status!=='passed'||record.source!==source.digest)throw new Error(`Missing current ${name} gate`);}
  async function e2e(){
    invalidate(['e2e']);
    prerequisite('frontend');prerequisite('backend');
    const runtime=path.join(out,'e2e-runtime');fs.mkdirSync(runtime);fs.symlinkSync(front,path.join(runtime,'frontend'),process.platform==='win32'?'junction':'dir');
    fs.copyFileSync(path.join(root,'tasks/evidencias/CF-028/examples.json'),path.join(runtime,'e01.json'));
    const evidence=path.join(out,'browser');fs.mkdirSync(evidence);
    Object.assign(env,{CF032_RUNTIME:runtime,CF032_REPO:root,CF032_EVIDENCE:evidence,CF032_HEAD:source.commit,CF032_GREP:process.env.CF034_SUITE==='expanded'?'':'A cadastro|B uso diário|G resposta perdida|H dois usuários|K limite disponível|L investimento válido'});
    try{await maven('e2e',['-Duser.timezone=UTC','-Dspring.test.context.cache.maxSize=4','-Dtest=FinancialJourneyPostgresE2E','-Dsurefire.failIfNoSpecifiedTests=true',`-Dcf034.reportsDirectory=${path.join(out,'e2e-surefire')}`,'test']);}
    finally{if(fs.existsSync(path.join(out,'e2e-surefire')))report.e2eJava=junitCounts(path.join(out,'e2e-surefire'));}
    report.e2eJava=requireCounts(junitCounts(path.join(out,'e2e-surefire')),'E2E Java');
    const playwright=JSON.parse(fs.readFileSync(path.join(evidence,'playwright.json')));
    report.browser=requireCounts({tests:playwright.stats.expected,failures:playwright.stats.unexpected,errors:playwright.errors?.length??0,skipped:playwright.stats.skipped},'browser');
    report.financialEvidence=financialEvidence(playwright,evidence);
    report.financialDiagnostics=requireWrapperDiagnostics(out,{selected:[wrapperDefinitions.FinancialJourneyPostgresE2E.qualified]},source,ci);
    if(playwright.stats.flaky)throw new Error('Flaky E2E is not approval');
    if(process.env.CF034_SUITE!=='expanded'&&report.browser.tests!==6)throw new Error('All six mandatory browser journeys must run');
    writeJson(path.join(root,'.ci-e2e.json'),{source:source.digest,status:'passed',counts:report.browser});
  }
  async function packageArtifact(){
    for(const name of ['frontend','backend','e2e'])prerequisite(name);
    sourceFor(root);
    const jars=fs.readdirSync(path.join(back,'target')).filter(f=>f.endsWith('.jar'));
    if(jars.length!==1)throw new Error('Exactly one executable package required');
    const jar=path.join(back,'target',jars[0]),bytes=fs.readFileSync(jar),artifact=path.join(out,jars[0]);
    const verified=JSON.parse(fs.readFileSync(path.join(root,'.ci-backend.json')));
    if(verified.jar!==jars[0]||verified.jarSha256!==hash(bytes))throw new Error('Package changed after the verified build');
    fs.copyFileSync(jar,artifact);
    report.artifact={file:jars[0],sha256:hash(bytes),bytes:bytes.length,commit:source.commit,sourceDigest:source.digest,reproducibleBinary:'not claimed',publication:'gate artifact; platform upload tracked separately',acceptance:zoomContext?zoomLabel:'smoke gate artifact; no integral acceptance',zoomException:report.zoomException??null};
    writeJson(path.join(out,'package-manifest.json'),{...report.artifact,ci,toolchain:{node:process.version,mavenJava:'see sanitized maven-version.log from this run'},originalTreeChanges:source.originalTreeChanges,sourceFiles:source.files,gates:{frontend:JSON.parse(fs.readFileSync(path.join(root,'.ci-frontend.json'))),backend:verified,e2e:JSON.parse(fs.readFileSync(path.join(root,'.ci-e2e.json')))},commands:report.steps,dependencies:{pomSha256:hash(fs.readFileSync(path.join(back,'pom.xml'))),lockSha256:hash(fs.readFileSync(path.join(front,'package-lock.json')))}});
  }
  try{
    if(stage==='remaining'){prerequisite('frontend');report.frontendPrerequisite=JSON.parse(fs.readFileSync(path.join(root,'.ci-frontend.json')));}
    await sequence(stage==='all'?['frontend','backend','e2e','package']:stage==='diagnose'?['frontend','diagnostic']:stage==='remaining'?['backend','e2e','package']:[stage],async name=>{control.check();await ({frontend,backend,diagnostic:()=>backend('diagnostic'),'windows-native':windowsNative,e2e,package:packageArtifact})[name]();control.check();});
    report.status='passed';
  }catch(error){
    report.status=control.cancelled?'cancelled':'failed';report.error=control.cancelled?'Execution cancelled; subsequent gates blocked':safe(error.message);process.exitCode=control.cancelled?130:1;
    if(control.cancelled){
      invalidate(['frontend','backend','e2e']);delete report.artifact;
      const manifest=path.join(out,'package-manifest.json');
      if(fs.existsSync(manifest))fs.renameSync(manifest,path.join(out,'unapproved-package-manifest.json'));
    }
    console.error(report.error);
  }
  finally{control.close();report.runId=control.runId;report.finished=new Date().toISOString();writeJson(path.join(out,'result.json'),report);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(safe(error.message));process.exitCode=1;});
