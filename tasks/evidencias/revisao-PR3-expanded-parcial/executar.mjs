import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';

const origin=path.resolve(import.meta.dirname,'../../..');
const original=path.dirname(execFileSync('git',['rev-parse','--path-format=absolute','--git-common-dir'],{cwd:origin,encoding:'utf8',windowsHide:true}).trim());
const parent=path.resolve(original,'../controle-financeiro-runtimes/preparacao-adocao');
const [mode,runtimeArg,label,...tests]=process.argv.slice(2);
const runtime=path.resolve(runtimeArg??'');
assert.equal(path.dirname(runtime),parent);
assert.match(path.basename(runtime),/^revisao-pr3-parcial-[a-z0-9-]+$/);
const receiptPath=path.join(runtime,'inputs-candidate.json');
const sourceDirectory=fs.existsSync(receiptPath)?JSON.parse(fs.readFileSync(receiptPath)).sourceDirectory??'subject':'s';
const subject=path.join(runtime,sourceDirectory);
const git=(...args)=>execFileSync('git',args,{cwd:origin,encoding:'utf8',windowsHide:true}).trim();
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});

if(mode==='prepare') {
  assert.equal(git('rev-parse','26dce7db'),'26dce7dbc98b140d22095b6948c539e01fc1128c');
  assert.equal(git('diff','26dce7db','--','controle-financeiro-backend','controle-financeiro-frontend','.github','docs/sdd'),'');
  fs.mkdirSync(runtime);
  const prior=path.join(original,'tasks/evidencias/validacao-remota-consolidacao/preservacao-inicial.json');
  const manifest=JSON.parse(fs.readFileSync(prior));
  assert.equal(manifest.files.length,97);
  for(const f of manifest.files)assert.equal(sha(path.resolve(original,f.file)),f.sha256,f.file);
  assert.equal(sha(path.join(original,'README.md')),'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
  const names=git('ls-files','controle-financeiro-backend','controle-financeiro-frontend','scripts','.github','docs/sdd').split('\n').filter(Boolean);
  const inputs=[];
  for(const file of names){
    const from=path.join(origin,file),to=path.join(subject,file);
    fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);
    assert.equal(sha(from),sha(to));inputs.push({file,sha256:sha(to)});
  }
  write(path.join(runtime,'inputs-candidate.json'),{head:'26dce7dbc98b140d22095b6948c539e01fc1128c',preparedFromHead:git('rev-parse','HEAD'),sourceDirectory,files:inputs});
  write(path.join(runtime,'preservation-initial.json'),{at:new Date(),original,origin,manifest:prior,manifestSha256:sha(prior),checked:97,files:manifest.files,mainReadme:sha(path.join(original,'README.md')),worktreeReadme:sha(path.join(origin,'README.md')),worktrees:git('worktree','list','--porcelain'),mainStatus:execFileSync('git',['status','--short'],{cwd:original,encoding:'utf8'}),subjectPolicy:'Physical copy of tracked sources and dependencies; no Git metadata, secrets, or historical runtimes copied.'});
  const destination=path.join(subject,'controle-financeiro-frontend/node_modules');
  if(process.env.REVIEW_DEPENDENCY_SOURCE){
    // Only immutable installed dependencies are linked; source files are physical copies.
    const link=(from,to)=>{if(fs.statSync(from).isDirectory()){fs.mkdirSync(to);for(const name of fs.readdirSync(from))link(path.join(from,name),path.join(to,name));}else fs.linkSync(from,to);};
    link(process.env.REVIEW_DEPENDENCY_SOURCE,destination);
  }else fs.cpSync(path.join(origin,'controle-financeiro-frontend/node_modules'),destination,{recursive:true,dereference:true,errorOnExist:true,force:false});
  console.log(JSON.stringify({prepared:runtime,files:inputs.length,protected:97}));
  process.exit(0);
}
assert.ok(fs.existsSync(path.join(runtime,'inputs-candidate.json')));
assert.match(label??'',/^[a-z0-9-]+$/);
const out=path.join(runtime,label);fs.mkdirSync(out);
const jdk=path.join(original,'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
const env={...process.env,JAVA_HOME:jdk,PATH:path.join(jdk,'bin')+path.delimiter+process.env.PATH,CF_BROWSER_DIAGNOSTICS:'1',PLAYWRIGHT_BROWSERS_PATH:'0',NEXT_TELEMETRY_DISABLED:'1',TEMP:path.join(out,'temp'),TMP:path.join(out,'temp')};
fs.mkdirSync(env.TEMP);
for(const key of Object.keys(env))if(/^(SPRING_|RESEND_|BRAPI_|JWT_|DATABASE_URL|BACKEND_API_URL|NODE_OPTIONS|CF_E2E_)/.test(key))delete env[key];
const candidate=JSON.parse(fs.readFileSync(path.join(runtime,'inputs-candidate.json')));
const actualSource=path.resolve(process.env.REVIEW_SUBJECT_PATH??subject);
const extras=[];
if(fs.existsSync(path.join(actualSource,'f'))){
 for(const {file} of candidate.files.filter(f=>f.file.startsWith('controle-financeiro-frontend/')))extras.push('f/'+file.slice('controle-financeiro-frontend/'.length));
 for(const name of ['reviewer-visual.integrated.spec.ts','playwright.reviewer-visual.config.ts'])if(fs.existsSync(path.join(actualSource,'f/tests/e2e',name)))extras.push('f/tests/e2e/'+name);
}
const collect=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())collect(p);else if(/^Reviewer.*\.java$/.test(e.name))extras.push(path.relative(actualSource,p));}};
collect(path.join(actualSource,'controle-financeiro-backend/src/test/java'));
write(path.join(out,'inputs.json'),[...candidate.files.map(f=>f.file),...extras].map(file=>({file,sha256:sha(path.join(actualSource,file))})));
let args,command,cwd;
const quote=s=>"'"+s.replaceAll("'","''")+"'";
if(mode==='maven'){
  assert.ok(tests.length);
  args=['--offline','--batch-mode','-Duser.timezone=UTC','-Dspring.test.context.cache.maxSize=4','-DfailIfNoTests=true','-Dsurefire.failIfNoSpecifiedTests=true',`-Dtest=${tests.join(',')}`,`-Dcf034.reportsDirectory=${path.join(out,'surefire')}`,`-Dcf.browser.evidence=${path.join(out,'browsers')}`,`-Dreview.evidence=${out}`,`-Ddiagnostic.run=${out}`,`-Dcf023.evidence=${out}`,`-Dpr3.probe.evidence=${out}`];
  if(process.env.REVIEW_ORDER)args.push(`-Dsurefire.runOrder=${process.env.REVIEW_ORDER}`);
  if(process.env.REVIEW_GREP)args.push(`-Dreview.grep=${process.env.REVIEW_GREP}`);
  if(process.env.DIAGNOSTIC_GREP)args.push(`-Ddiagnostic.grep=${process.env.DIAGNOSTIC_GREP}`);
  args.push('test');command=`& './mvnw.cmd' ${args.map(quote).join(' ')}; exit $LASTEXITCODE`;
  cwd=path.join(process.env.REVIEW_SUBJECT_PATH??subject,'controle-financeiro-backend');
}else if(mode==='node'){
  args=tests;command=`& ${quote(process.execPath)} ${args.map(quote).join(' ')}; exit $LASTEXITCODE`;cwd=subject;
}else throw Error('unknown mode');
const fd=fs.openSync(path.join(out,'execution.log'),'wx'),started=new Date();
const r=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{cwd,env,windowsHide:true,stdio:['ignore',fd,fd],timeout:20*60*1000});
fs.closeSync(fd);
const dir=path.join(out,'surefire');
const reports=fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>f.endsWith('.xml')).map(file=>({file,sha256:sha(path.join(dir,file)),suite:fs.readFileSync(path.join(dir,file),'utf8').match(/<testsuite\b[^>]*>/)?.[0]})):[];
write(path.join(out,'execution.json'),{label,started,finished:new Date(),candidate:candidate.head,origin,subject:actualSource,cwd,node:process.version,jdk,args,exit:r.status,error:r.error?.message,logSha256:sha(path.join(out,'execution.log')),reports});
console.log(JSON.stringify({label,exit:r.status,error:r.error?.message,reports:reports.map(x=>x.suite),out}));
process.exitCode=r.status??1;
