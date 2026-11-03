import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawn,spawnSync} from 'node:child_process';

const [mode,runtimeArg,scenario,label]=process.argv.slice(2);
assert.ok(runtimeArg,'runtime required');
const root=path.resolve(import.meta.dirname,'../../..'), runtime=path.resolve(runtimeArg);
const git=(...args)=>execFileSync('git',['-c','core.longpaths=true',...args],{cwd:root,encoding:'utf8',windowsHide:true}).trim();
const main=path.dirname(git('rev-parse','--path-format=absolute','--git-common-dir'));
assert.equal(path.dirname(runtime),path.resolve(main,'../controle-financeiro-runtimes/preparacao-adocao'));
assert.match(path.basename(runtime),/^zoom-assistido-[a-z0-9-]+$/);
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
const jdk=path.join(main,'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
const nativeNames={cf015:'R10: zoom nativo 200% com ações, rolagem e foco',rf15:'RF15: zoom nativo Chrome 200% com ações, rolagem e foco'};
// Playwright grep sees project/file/title, so anchor the complete test name at the end.
const nativePattern=scenario==='cf015'||scenario==='rf15'?nativeNames[scenario]+'$':'('+nativeNames.cf015+'|'+nativeNames.rf15+')$';
function environment(out) {
  const env={...process.env};
  for(const key of Object.keys(env)) if(/^(SPRING_|RESEND_|BRAPI_|JWT_|DB_|DATABASE_|BACKEND_API_URL|NODE_OPTIONS|CF_|REVALIDATE_|RESIDUAL_|RF15_|PLAYWRIGHT_)/.test(key)) delete env[key];
  Object.assign(env,{JAVA_HOME:jdk,PATH:path.join(jdk,'bin')+path.delimiter+process.env.PATH,CF_BROWSER_DIAGNOSTICS:'1',PLAYWRIGHT_BROWSERS_PATH:'0',NEXT_TELEMETRY_DISABLED:'1',TEMP:path.join(out,'temp'),TMP:path.join(out,'temp')});
  fs.mkdirSync(env.TEMP,{recursive:true});
  return env;
}
function maven(tree,out,args,async=false) {
  const literal=value=>"'"+value.replaceAll("'","''")+"'";
  const command="& './mvnw.cmd' "+['--offline','--batch-mode','-Duser.timezone=UTC',...args].map(literal).join(' ')+'; exit $LASTEXITCODE';
  const fd=fs.openSync(path.join(out,'maven.log'),'wx');
  const options={cwd:path.join(runtime,tree,'controle-financeiro-backend'),env:environment(out),windowsHide:true,stdio:['ignore',fd,fd]};
  const argv=['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')];
  if(async) {const child=spawn('powershell.exe',argv,options);fs.closeSync(fd);return child;}
  const result=spawnSync('powershell.exe',argv,{...options,timeout:15*60*1000});
  fs.closeSync(fd);
  write(path.join(out,'execution.json'),{at:new Date(),args,exit:result.status,error:result.error?.message,logSha256:hash(path.join(out,'maven.log'))});
  assert.equal(result.status,0,'See '+path.join(out,'maven.log'));
}
function dependencyLinks(from,to) {
  const stat=fs.lstatSync(from);
  assert.ok(!stat.isSymbolicLink(),'Dependency links require explicit review: '+from);
  if(stat.isDirectory()) {fs.mkdirSync(to);for(const name of fs.readdirSync(from)) dependencyLinks(path.join(from,name),path.join(to,name));}
  else {assert.ok(stat.isFile());fs.linkSync(from,to);}
}
if(mode==='prepare') {
  assert.ok(fs.existsSync(path.join(runtime,'initial.json')),'Run preservation initial first');
  assert.ok(!fs.existsSync(path.join(runtime,'s')));
  const names=git('ls-files','controle-financeiro-backend','controle-financeiro-frontend','.github').split('\n');
  const files=[];
  const trees=scenario==='native-only'?['s']:['s','p'];
  for(const tree of trees) {
    for(const file of names) {
      const copy=file.replace(/^controle-financeiro-frontend\//,'f/');
      const target=path.join(runtime,tree,copy);
      fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);
      let pathOnly=false;
      if(file.endsWith('.java')) {const text=fs.readFileSync(target,'utf8');if(text.includes('resolveSibling("controle-financeiro-frontend")')) {fs.writeFileSync(target,text.replaceAll('resolveSibling("controle-financeiro-frontend")','resolveSibling("f")'));pathOnly=true;}}
      files.push({tree,file,copy,source:hash(path.join(root,file)),actual:hash(target),pathOnly});
    }
    dependencyLinks(path.join(root,'controle-financeiro-frontend/node_modules'),path.join(runtime,tree,'f/node_modules'));
  }
  if(trees.includes('p')) fs.copyFileSync(path.join(import.meta.dirname,'../validacao-zoom-nativo/ZoomPreparationEnvironmentTest.java.txt'),path.join(runtime,'p/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/ZoomPreparationEnvironmentTest.java'));
  write(path.join(runtime,'prepared.json'),{at:new Date(),root,candidate:git('rev-parse','HEAD'),trees,files,policy:'Sources physically copied; only Java sibling resource path mapped to f. Existing immutable dependencies hardlinked. No env, old caches, target, history or credentials copied. If present, p only contains an extra environment preparation fixture; s preserves original scenarios.'});
  console.log(JSON.stringify({prepared:true,filesPerCopy:names.length,runtime}));
} else if(mode==='compile') {
  const out=path.join(runtime,'compile');fs.mkdirSync(out);
  maven('s',out,['test-compile']);
  console.log(JSON.stringify({compiled:true,nativeTestsExecuted:false}));
} else if(mode==='list') {
  assert.match(scenario??'selection',/^[a-z0-9-]+$/);
  const out=path.join(runtime,scenario??'selection');fs.mkdirSync(out);
  const result=spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test','--config','tests/e2e/playwright.rf15.config.ts','--grep',nativePattern,'--list'],{cwd:path.join(runtime,'s/f'),env:environment(out),encoding:'utf8',windowsHide:true});
  fs.writeFileSync(path.join(out,'list.txt'),result.stdout+result.stderr,{flag:'wx'});
  assert.equal(result.status,0);
  assert.match(result.stdout,scenario==='cf015'||scenario==='rf15'?/Total: 1 test in 1 file/:/Total: 2 tests in 2 files/);
  console.log(result.stdout);
} else if(mode==='readiness') {
  const out=path.join(runtime,'preparation');fs.mkdirSync(out);
  const child=maven('p',out,['-Dtest=ZoomPreparationEnvironmentTest','-Dzoom.preparation.output='+out,'-Dcf034.reportsDirectory='+path.join(out,'surefire'),'test'],true);
  const completion=new Promise((resolve,reject)=>{child.once('exit',code=>resolve(code));child.once('error',reject);});
  try {
    const deadline=Date.now()+180000;
    while(!fs.existsSync(path.join(out,'backend-ready.json'))) {
      if(child.exitCode!==null) throw Error('Preparation backend exited: '+child.exitCode);
      if(Date.now()>deadline) throw Error('Preparation backend startup timeout');
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    const result=spawnSync(process.execPath,[path.join(import.meta.dirname,'../validacao-zoom-nativo/preparar-dados.mjs'),runtime],{env:environment(out),encoding:'utf8',windowsHide:true,timeout:240000});
    fs.writeFileSync(path.join(out,'prepare-data.log'),(result.stdout??'')+(result.stderr??''),{flag:'wx'});
    assert.equal(result.status,0,'See prepare-data.log');
  } finally {
    if(!fs.existsSync(path.join(out,'stop'))) fs.writeFileSync(path.join(out,'stop'),'stop');
    const code=await Promise.race([completion,new Promise(resolve=>setTimeout(()=>resolve('timeout'),30000))]);
    write(path.join(out,'lifecycle.json'),{at:new Date(),backendExit:code,childPid:child.pid});
    assert.equal(code,0,'Preparation environment did not exit cleanly');
  }
  console.log(fs.readFileSync(path.join(out,'readiness.json'),'utf8'));
} else if(mode==='run') {
  assert.ok(['cf015','rf15'].includes(scenario),'One scenario per invocation; original 15-minute harness bound remains');
  assert.match(label??'',/^[a-z0-9-]+$/,'Unique invocation label required');
  const prepared=JSON.parse(fs.readFileSync(path.join(runtime,'prepared.json')));
  const adapted=JSON.parse(fs.readFileSync(path.join(runtime,'assisted-package.json')));
  assert.equal(adapted.candidate,prepared.candidate);
  assert.equal(adapted.preparedSha256,hash(path.join(runtime,'prepared.json')));
  const changed=new Map(adapted.changes.map(item=>[item.relative,item]));
  for(const item of prepared.files.filter(item=>item.tree==='s')) {
    const patch=changed.get(item.copy);
    if(patch) {assert.equal(patch.original,item.actual);assert.equal(hash(patch.archived),item.actual);}
    assert.equal(hash(path.join(runtime,'s',item.copy)),patch?.actual??item.actual,item.file);
  }
  for(const item of adapted.extras)assert.equal(hash(path.join(runtime,'s',item.relative)),item.sha256,item.relative);
  assert.ok(!fs.existsSync(path.join(runtime,'s/f/.next')),'Original frontend must be cold; prepare a new runtime after any invocation');
  const out=path.join(runtime,label);fs.mkdirSync(out);
  const name=nativeNames[scenario];
  write(path.join(out,'candidate.json'),{at:new Date(),candidate:prepared.candidate,scenario,name,packageManifest:path.join(runtime,'prepared.json'),packageSha256:hash(path.join(runtime,'prepared.json'))});
  process.env.ZOOM_ASSISTED_EXECUTION=label;
  process.env.ZOOM_ASSISTED_CANDIDATE=prepared.candidate;
  process.env.ZOOM_ASSISTED_PACKAGE=hash(path.join(runtime,'assisted-package.json'));
  process.env.ZOOM_READINESS_DIR=path.join(out,'readiness');
  console.log('OPERADOR: acompanhe a janela de teste com URL http://127.0.0.1:3107/cartoes. Registre 100%, aplique 200% no menu nativo e registre o indicador. Não ajuste a janela pessoal. Siga RETOMADA.md.');
  console.log('Evidence root: '+path.join(out,'browsers/Rf15RemediationBrowserTest/visual'));
  // Original Java harness; runtime adaptation preserves all functional assertions. No zoom or human signal is fabricated.
  maven('s',out,['-Dtest=Rf15RemediationBrowserTest','-DfailIfNoTests=true','-Dsurefire.failIfNoSpecifiedTests=true','-Dreview.grep='+nativePattern,'-Dcf034.reportsDirectory='+path.join(out,'surefire'),'-Dcf.browser.evidence='+path.join(out,'browsers'),'test']);
  console.log(JSON.stringify({originalHarnessFinished:true,scenario,evidence:out,reviewRequired:true}));
} else throw Error('Modes: prepare, compile, list, readiness, run');
