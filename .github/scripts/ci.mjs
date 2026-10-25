import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash,sourceFor,writeJson} from './source.mjs';
import {backendSelection} from './suites.mjs';
import {sanitizeText} from './sanitize.mjs';
import {spawnOwned} from './owned-process.mjs';
import {cancellation} from './cancellation.mjs';

export function requireCounts(counts,label){
  if(!counts.tests||counts.failures||counts.errors||counts.skipped)throw new Error(`${label}: invalid counts ${JSON.stringify(counts)}`);
  return counts;
}
export async function sequence(stages,run){for(const stage of stages)await run(stage);}
export function junitCounts(directory){
  const counts={tests:0,failures:0,errors:0,skipped:0};
  for(const file of fs.readdirSync(directory).filter(p=>p.startsWith('TEST-')&&p.endsWith('.xml'))){
    const text=fs.readFileSync(path.join(directory,file),'utf8');
    const suite=text.match(/<testsuite\b[^>]*>/)?.[0];if(!suite)throw new Error(`Missing testsuite: ${file}`);
    for(const key of Object.keys(counts)){const v=suite.match(new RegExp(`\\b${key}="(\\d+)"`));if(!v)throw new Error(`Missing ${key}: ${file}`);counts[key]+=Number(v[1]);}
  }return counts;
}
export function requireReportedClasses(directory,required){
  const reported=fs.readdirSync(directory).filter(f=>f.startsWith('TEST-')&&f.endsWith('.xml')).map(f=>f.slice(5,-4));
  const missing=required.filter(name=>!reported.some(r=>r===name||r.startsWith(name+'$')));
  if(missing.length)throw new Error(`Mandatory classes have no report: ${missing.join(',')}`);
}
const safe=text=>{try{return sanitizeText(text);}catch{return 'Diagnostic withheld: sanitization failed';}};

async function main(){
  const [stage='all',rootArg,outArg]=process.argv.slice(2);
  if(!['all','frontend','backend','e2e','package'].includes(stage)||!rootArg||!outArg)throw new Error('Usage: node .github/scripts/ci.mjs <all|frontend|backend|e2e|package> <isolated-root> <new-output-dir>');
  const root=path.resolve(rootArg),out=path.resolve(outArg);
  if(fs.existsSync(out))throw new Error('Never reuse an evidence directory');
  fs.mkdirSync(out,{recursive:true});
  const control=cancellation(out);
  const source=sourceFor(root),front=path.join(root,'controle-financeiro-frontend'),back=path.join(root,'controle-financeiro-backend');
  const report={source:{commit:source.commit,digest:source.digest,originalTreeChanges:source.originalTreeChanges},node:process.version,platform:process.platform,stage,started:new Date().toISOString(),steps:[],status:'running'};
  const ci=process.env.GITHUB_ACTIONS==='true'?{repository:process.env.GITHUB_REPOSITORY,workflow:process.env.GITHUB_WORKFLOW,runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,job:process.env.GITHUB_JOB,event:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,headRef:process.env.GITHUB_HEAD_REF,baseRef:process.env.GITHUB_BASE_REF,checkoutSha:source.commit,runnerOS:process.env.RUNNER_OS,runnerArch:process.env.RUNNER_ARCH}:null;
  report.ci=ci;
  const env={...process.env,BACKEND_API_URL:'http://127.0.0.1:65535',PLAYWRIGHT_BROWSERS_PATH:'0',NEXT_TELEMETRY_DISABLED:'1'};
  for(const key of Object.keys(env))if(/^(SPRING_|RESEND_|BRAPI_|JWT_|DATABASE_URL|BACKEND_API_URL$)/.test(key)&&key!=='BACKEND_API_URL')delete env[key];
  const npmCandidates=[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),path.resolve(path.dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')];
  if(process.platform!=='win32'){try{npmCandidates.push(fs.realpathSync(execFileSync('which',['npm'],{encoding:'utf8'}).trim()));}catch{}}
  const npm=npmCandidates.find(p=>fs.existsSync(p));if(!npm)throw new Error('npm CLI unavailable');
  async function command(name,executable,args,cwd){
    control.check();
    const display=value=>value.replaceAll(out,'${EVIDENCE_ROOT}').replaceAll(root,'${SOURCE_ROOT}');
    const start=Date.now();const entry={name,command:[path.basename(executable),...args.map(display)],cwd:path.relative(root,cwd),started:new Date().toISOString(),exit:null};report.steps.push(entry);
    const log=fs.createWriteStream(path.join(out,`${name}.log`));
    await new Promise((resolve,reject)=>{
      const child=spawnOwned(executable,args,{cwd,env,shell:false,windowsHide:true});control.attach(child);
      entry.ownerPid=child.pid;entry.ownership=process.platform==='win32'?'Windows Job Object; private owner pipe':'POSIX process group; remote validation pending';
      // Complete raw originals stay private. Redaction per chunk is unsafe.
      for(const stream of [child.stdout,child.stderr])stream.on('data',data=>log.write(data));
      child.once('error',error=>{entry.error=safe(error.message);log.end();reject(error);});
      child.once('close',code=>{control.detach(child);entry.exit=code;entry.durationMs=Date.now()-start;log.end(()=>code===0?resolve():reject(new Error(`${name} failed (${code}); see ${name}.log`)));});
    });
    control.check();
    console.log(`${name}: passed`);
  }
  const runNpm=(name,args)=>command(name,process.execPath,[npm,...args],front);
  const maven=(name,args)=>process.platform==='win32'?command(name,process.env.ComSpec??'cmd.exe',['/d','/c','mvnw.cmd','--batch-mode',...args],back):command(name,'sh',['./mvnw','--batch-mode',...args],back);
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
    await runNpm('components',['run','test:component','--','--reporter=json',`--outputFile=${path.join(out,'components.json')}`]);
    const vitest=JSON.parse(fs.readFileSync(path.join(out,'components.json')));
    report.components=requireCounts({tests:vitest.numTotalTests,failures:vitest.numFailedTests,errors:vitest.numRuntimeErrorTestSuites??0,skipped:(vitest.numPendingTests??0)+(vitest.numTodoTests??0)},'components');
    await runNpm('build',['run','build']);
    await runNpm('browser-install',['run','test:e2e:install']);
    writeJson(path.join(root,'.ci-frontend.json'),{source:source.digest,status:'passed'});
  }
  async function backend(){
    invalidate(['backend','e2e']);
    await maven('maven-version',['--version']);
    const reports=path.join(out,'surefire');
    const selection=backendSelection(root,process.env.CF034_SUITE==='expanded'?'expanded':'smoke');
    writeJson(path.join(out,'backend-selection.json'),selection);report.selection=selection;
    try{await maven('backend',['-Duser.timezone=UTC','-Dspring.test.context.cache.maxSize=4','-DfailIfNoTests=true',`-Dtest=${selection.selected.join(',')}`,`-Dcf034.reportsDirectory=${reports}`,'verify']);}
    finally{if(fs.existsSync(reports))report.backend=junitCounts(reports);}
    report.backend=requireCounts(junitCounts(reports),'backend');
    requireReportedClasses(reports,selection.selected);
    const jars=fs.readdirSync(path.join(back,'target')).filter(f=>f.endsWith('.jar'));
    if(jars.length!==1)throw new Error('Verify must produce exactly one executable JAR');
    writeJson(path.join(root,'.ci-backend.json'),{source:source.digest,status:'passed',counts:report.backend,jar:jars[0],jarSha256:hash(fs.readFileSync(path.join(back,'target',jars[0])))});
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
    report.artifact={file:jars[0],sha256:hash(bytes),bytes:bytes.length,commit:source.commit,sourceDigest:source.digest,reproducibleBinary:'not claimed',publication:'gate artifact; platform upload tracked separately'};
    writeJson(path.join(out,'package-manifest.json'),{...report.artifact,ci,toolchain:{node:process.version,mavenJava:'see sanitized maven-version.log from this run'},originalTreeChanges:source.originalTreeChanges,sourceFiles:source.files,gates:{frontend:JSON.parse(fs.readFileSync(path.join(root,'.ci-frontend.json'))),backend:verified,e2e:JSON.parse(fs.readFileSync(path.join(root,'.ci-e2e.json')))},commands:report.steps,dependencies:{pomSha256:hash(fs.readFileSync(path.join(back,'pom.xml'))),lockSha256:hash(fs.readFileSync(path.join(front,'package-lock.json')))}});
  }
  try{
    await sequence(stage==='all'?['frontend','backend','e2e','package']:[stage],async name=>{control.check();await ({frontend,backend,e2e,package:packageArtifact})[name]();control.check();});
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
