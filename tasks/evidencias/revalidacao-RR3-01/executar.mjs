import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {execFileSync,spawnSync} from 'node:child_process';
const [mode,arg,label,...tests]=process.argv.slice(2),root=path.resolve(import.meta.dirname,'../../..'),runtime=path.resolve(arg),subject=path.join(runtime,'s');
const git=(...a)=>execFileSync('git',['-c','core.longpaths=true',...a],{cwd:root,encoding:'utf8',windowsHide:true}).trim(),main=path.dirname(git('rev-parse','--path-format=absolute','--git-common-dir'));
assert.equal(path.dirname(runtime),path.resolve(main,'../controle-financeiro-runtimes/preparacao-adocao'));assert.match(path.basename(runtime),/^revalidacao-rr3-01-/);
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),write=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
if(mode==='prepare'){
 assert.ok(!fs.existsSync(subject));fs.mkdirSync(subject);
 const files=[];for(const rel of git('ls-files','controle-financeiro-backend','controle-financeiro-frontend','.github').split('\n')){
  const target=path.join(subject,rel.replace(/^controle-financeiro-frontend\//,'f/'));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,rel),target);
  let pathOnly=false;if(rel.endsWith('.java')){const b=fs.readFileSync(target,'utf8');if(b.includes('resolveSibling("controle-financeiro-frontend")')){fs.writeFileSync(target,b.replaceAll('resolveSibling("controle-financeiro-frontend")','resolveSibling("f")'));pathOnly=true;}}
  files.push({file:rel,copy:path.relative(subject,target),source:sha(path.join(root,rel)),actual:sha(target),pathOnly});
 }
 function links(from,to){const s=fs.lstatSync(from);assert.ok(!s.isSymbolicLink(),'unexpected dependency link');if(s.isDirectory()){fs.mkdirSync(to);for(const n of fs.readdirSync(from))links(path.join(from,n),path.join(to,n));}else {assert.ok(s.isFile());fs.linkSync(from,to);}}
 links(path.join(root,'controle-financeiro-frontend/node_modules'),path.join(subject,'f/node_modules'));
 write(path.join(runtime,'prepared.json'),{at:new Date(),root,subject,candidate:git('rev-parse','HEAD'),files,policy:'Byte exact sources; only Java frontend physical path mapped to f; immutable installed dependency file hardlinks; no env or prior cache'});
 console.log(JSON.stringify({prepared:subject,files:files.length}));process.exit(0);
}
assert.equal(mode,'run');assert.match(label,/^[a-z0-9-]+$/);assert.ok(tests.length);const out=path.join(runtime,label);fs.mkdirSync(out);
const inputs=[];function collect(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','target','.next','artifacts'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())collect(f);else {assert.ok(e.isFile());inputs.push({file:path.relative(subject,f).replaceAll('\\','/'),sha256:sha(f)});}}}collect(subject);write(path.join(out,'inputs.json'),inputs);
const jdk=path.join(main,'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1'),env={...process.env,JAVA_HOME:jdk,PATH:path.join(jdk,'bin')+path.delimiter+process.env.PATH,CF_BROWSER_DIAGNOSTICS:'1',PLAYWRIGHT_BROWSERS_PATH:'0',NEXT_TELEMETRY_DISABLED:'1',TEMP:path.join(out,'temp'),TMP:path.join(out,'temp')};fs.mkdirSync(env.TEMP);
for(const k of Object.keys(env))if(/^(SPRING_|RESEND_|BRAPI_|JWT_|DATABASE_URL|BACKEND_API_URL|NODE_OPTIONS|CF_E2E_)/.test(k))delete env[k];
const args=['--offline','--batch-mode','-Duser.timezone=UTC','-Dspring.test.context.cache.maxSize=4','-DfailIfNoTests=true','-Dsurefire.failIfNoSpecifiedTests=true','-Dtest='+tests.join(','),'-Dcf034.reportsDirectory='+path.join(out,'surefire'),'-Dcf.browser.evidence='+path.join(out,'browsers'),'-Dreview.evidence='+out,'-Dcf023.evidence='+out,'-Dcf023.frontend.runtime='+path.join(runtime,'n')];
if(process.env.REVALIDATE_GREP)args.push('-Dreview.grep='+process.env.REVALIDATE_GREP);args.push('test');
const literal=s=>"'"+s.replaceAll("'","''")+"'",command="& './mvnw.cmd' "+args.map(literal).join(' ')+'; exit $LASTEXITCODE',log=path.join(out,'maven.log'),fd=fs.openSync(log,'wx'),started=new Date();
const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{cwd:path.join(subject,'controle-financeiro-backend'),env,windowsHide:true,stdio:['ignore',fd,fd],timeout:30*60*1000});fs.closeSync(fd);
const reportsDir=path.join(out,'surefire'),reports=fs.existsSync(reportsDir)?fs.readdirSync(reportsDir).filter(n=>n.endsWith('.xml')).map(file=>({file,sha256:sha(path.join(reportsDir,file)),suite:fs.readFileSync(path.join(reportsDir,file),'utf8').match(/<testsuite\b[^>]*>/)?.[0]})):[];
write(path.join(out,'execution.json'),{at:new Date(),started,root,subject,label,jdk,node:process.version,platform:process.platform,args,exit:result.status,error:result.error?.message,inputsSha256:sha(path.join(out,'inputs.json')),logSha256:sha(log),reports});console.log(JSON.stringify({label,exit:result.status,reports:reports.map(r=>r.suite)}));process.exitCode=result.status??1;
