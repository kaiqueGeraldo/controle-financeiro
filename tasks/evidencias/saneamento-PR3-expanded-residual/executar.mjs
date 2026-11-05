import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const [mode,runtimeArg,label,...tests]=process.argv.slice(2);
assert.ok(runtimeArg,'runtime required');
const origin=path.resolve(import.meta.dirname,'../../..');
const main=path.dirname(execFileSync('git',['rev-parse','--path-format=absolute','--git-common-dir'],{cwd:origin,encoding:'utf8'}).trim());
const parent=path.resolve(main,'../controle-financeiro-runtimes/saneamento-PR3-expanded-residual');
const runtime=path.resolve(runtimeArg),subject=path.join(runtime,'s');
assert.equal(path.dirname(runtime),parent,'own external runtime only');
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const names=()=>execFileSync('git',['ls-files','controle-financeiro-backend','controle-financeiro-frontend','scripts','.github'],{cwd:origin,encoding:'utf8'}).trim().split('\n').filter(Boolean);
const mapped=f=>f.replace(/^controle-financeiro-frontend\//,'f/');
const record=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
if(mode==='prepare'){
 assert.ok(!fs.existsSync(runtime),'never reuse an existing runtime');fs.mkdirSync(runtime,{recursive:true});
 const files=[];
 for(const f of names()){
  const to=path.join(subject,mapped(f));fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(origin,f),to);
  // Resource path is the only wrapper change, because the physical frontend has a short name.
  let replaced=false;
  if(f.endsWith('.java')){const text=fs.readFileSync(to,'utf8');if(text.includes('resolveSibling("controle-financeiro-frontend")')){fs.writeFileSync(to,text.replaceAll('resolveSibling("controle-financeiro-frontend")','resolveSibling("f")'));replaced=true;}}
  files.push({file:f,copy:mapped(f),source:sha(path.join(origin,f)),actual:sha(to),resourcePathOnly:replaced});
 }
 function link(from,to){const s=fs.lstatSync(from);assert.ok(!s.isSymbolicLink(),'dependency link requires explicit analysis: '+from);if(s.isDirectory()){fs.mkdirSync(to);for(const n of fs.readdirSync(from))link(path.join(from,n),path.join(to,n));}else{assert.ok(s.isFile());fs.linkSync(from,to);}}
 link(path.join(origin,'controle-financeiro-frontend/node_modules'),path.join(subject,'f/node_modules'));
 record(path.join(runtime,'prepared.json'),{at:new Date(),origin,subject,head:execFileSync('git',['rev-parse','HEAD'],{cwd:origin,encoding:'utf8'}).trim(),policy:'Physical sources; hardlinks only immutable installed dependencies; no Git/secrets/history copied',files});console.log(JSON.stringify({prepared:runtime,files:files.length}));process.exit(0);
}
assert.equal(mode,'run');assert.match(label??'',/^[a-z0-9-]+$/);assert.ok(tests.length);const out=path.join(runtime,label);fs.mkdirSync(out);
const prepared=JSON.parse(fs.readFileSync(path.join(runtime,'prepared.json')));
const inputs=[];function collect(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','target','.next','.git','artifacts'].includes(e.name))continue;const full=path.join(dir,e.name);if(e.isDirectory())collect(full);else if(e.isFile())inputs.push({file:path.relative(subject,full),sha256:sha(full)});else throw Error('unexpected link '+full);}}collect(subject);record(path.join(out,'inputs.json'),inputs);
const jdk=path.join(main,'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
const env={...process.env,JAVA_HOME:jdk,PATH:path.join(jdk,'bin')+path.delimiter+process.env.PATH,CF_BROWSER_DIAGNOSTICS:'1',PLAYWRIGHT_BROWSERS_PATH:'0',NEXT_TELEMETRY_DISABLED:'1',TEMP:path.join(out,'temp'),TMP:path.join(out,'temp')};fs.mkdirSync(env.TEMP);
for(const key of Object.keys(env))if(/^(SPRING_|RESEND_|BRAPI_|JWT_|DATABASE_URL|BACKEND_API_URL|NODE_OPTIONS|CF_E2E_)/.test(key))delete env[key];
const args=['--offline','--batch-mode','-Duser.timezone=UTC','-Dspring.test.context.cache.maxSize=4','-DfailIfNoTests=true','-Dsurefire.failIfNoSpecifiedTests=true','-Dtest='+tests.join(','),'-Dcf034.reportsDirectory='+path.join(out,'surefire'),'-Dcf.browser.evidence='+path.join(out,'browsers'),'-Dreview.evidence='+out,'-Dcf023.evidence='+out,'-Dpr3.probe.evidence='+out];
if(process.env.RESIDUAL_GREP)args.push('-Dreview.grep='+process.env.RESIDUAL_GREP);
if(process.env.RESIDUAL_ORDER)args.push('-Dsurefire.runOrder='+process.env.RESIDUAL_ORDER);
if(process.env.RESIDUAL_PROPERTIES){const properties=JSON.parse(process.env.RESIDUAL_PROPERTIES);for(const [key,value] of Object.entries(properties)){assert.match(key,/^(residual\.[a-z.]+|cf023\.frontend\.runtime)$/);assert.equal(typeof value,'string');args.push('-D'+key+'='+value);}}
args.push('test');const quote=s=>"'"+s.replaceAll("'","''")+"'";const command="& './mvnw.cmd' "+args.map(quote).join(' ')+'; exit $LASTEXITCODE';
const fd=fs.openSync(path.join(out,'maven.log'),'wx'),started=new Date();
const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{cwd:path.join(subject,'controle-financeiro-backend'),env,windowsHide:true,stdio:['ignore',fd,fd],timeout:30*60*1000});fs.closeSync(fd);
const reportsDir=path.join(out,'surefire'),reports=fs.existsSync(reportsDir)?fs.readdirSync(reportsDir).filter(f=>f.endsWith('.xml')).map(f=>({file:f,sha256:sha(path.join(reportsDir,f)),suite:fs.readFileSync(path.join(reportsDir,f),'utf8').match(/<testsuite\b[^>]*>/)?.[0]})):[];
record(path.join(out,'execution.json'),{label,started,finished:new Date(),origin,subject,jdk,node:process.version,platform:process.platform,args,exit:result.status,error:result.error?.message,reports,logSha256:sha(path.join(out,'maven.log'))});console.log(JSON.stringify({label,exit:result.status,reports:reports.map(r=>r.suite),out}));process.exitCode=result.status??1;
