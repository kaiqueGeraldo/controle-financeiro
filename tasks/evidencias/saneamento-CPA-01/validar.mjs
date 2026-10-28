import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {snapshot} from '../../../.github/scripts/source.mjs';
import {backendSelection} from '../../../.github/scripts/suites.mjs';
import {requireBackendReports} from '../../../.github/scripts/ci.mjs';

const repo=process.cwd(),out=import.meta.dirname,runtime=path.resolve(process.argv[2]??'');
assert.ok(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep)&&path.basename(runtime).startsWith('cpa01-'));
assert.ok(!fs.existsSync(runtime));fs.mkdirSync(runtime,{recursive:true});
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
const steps=[];
function run(label,command,args,options={}){
 const start=Date.now(),result=spawnSync(command,args,{cwd:repo,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024,...options});
 const log=path.join(runtime,label+'.log');fs.writeFileSync(log,(result.stdout??'')+(result.stderr??'')+(result.error?.message??''));
 const record={label,command:[command,...args],exit:result.status,durationMs:Date.now()-start,log,sha256:hash(log)};steps.push(record);
 return record;
}
function successful(label,command,args,options){const result=run(label,command,args,options);assert.equal(result.exit,0,label+'; see '+result.log);return result;}
const checkout=path.join(runtime,'checkout');fs.mkdirSync(checkout);
const files=git('ls-files','--cached','--others','--exclude-standard','.github','controle-financeiro-backend').split('\n').filter(f=>f&&!f.split('/').some(p=>['target','.git','node_modules'].includes(p))&&!/(^|\/)\.env($|\.)/.test(f));
for(const file of files){const dest=path.join(checkout,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);assert.equal(hash(dest),hash(file));}
const metadata={commit:git('rev-parse','HEAD'),branch:git('branch','--show-current'),originalTreeChanges:git('status','--short').split('\n'),export:'CPA-01 directed isolated checkout; modified inputs bound by SHA-256; no package build'};
const source=snapshot(checkout,metadata);
const temp=path.join(runtime,'temp');fs.mkdirSync(temp);
const jdk=path.join(repo,'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
const env={...process.env,TEMP:temp,TMP:temp,JAVA_HOME:jdk,PATH:path.join(jdk,'bin')+path.delimiter+process.env.PATH,MAVEN_ARGS:'--offline'};
let result;
try{
 successful('node-contracts',process.execPath,['--test','.github/scripts/ci.test.mjs','.github/scripts/suites.test.mjs','.github/scripts/sanitize.test.mjs'],{cwd:checkout,env});
 const selections={};for(const suite of ['smoke','expanded'])for(const platform of ['linux','win32'])selections[suite+'-'+platform]=backendSelection(checkout,suite,platform);
 selections.windowsNative=backendSelection(checkout,'smoke','win32','platform-only');
 fs.writeFileSync(path.join(runtime,'selecoes.json'),JSON.stringify(selections,null,2)+'\n',{flag:'wx'});
 // Mutate only the isolated source; restore exact bytes before each control.
 const selector=path.join(checkout,'.github/scripts/suites.mjs'),original=fs.readFileSync(selector),mutations=[];
 for(const [label,before,after] of [
  ['selecao-antiga','if(platform&&platform!==targetPlatform)','if(false&&platform&&platform!==targetPlatform)'],
  ['omissao-obrigatoria','selected.push(qualified);',"if(name!=='DateUtilTest')selected.push(qualified);"],
 ]){
  assert.ok(original.toString().includes(before));fs.writeFileSync(selector,original.toString().replace(before,after));
  const mutation=run(label,process.execPath,['--test','.github/scripts/suites.test.mjs'],{cwd:checkout,env});assert.notEqual(mutation.exit,0,label+' survived');
  mutations.push({label,sha256:hash(selector),detected:true,step:mutation});fs.writeFileSync(selector,original);assert.equal(hash(selector),hash(path.join(repo,'.github/scripts/suites.mjs')));
 }
 successful('restored-contracts',process.execPath,['--test','.github/scripts/ci.test.mjs','.github/scripts/suites.test.mjs','.github/scripts/sanitize.test.mjs'],{cwd:checkout,env});
 const gateControls=[];
 for(const [label,names,attributes] of [
  ['skip-inesperado',['example.RequiredTest'],'tests="1" failures="0" errors="0" skipped="1"'],
  ['falha-real',['example.RequiredTest'],'tests="1" failures="1" errors="0" skipped="0"'],
  ['relatorio-ausente',['example.MissingTest'],'tests="1" failures="0" errors="0" skipped="0"'],
  ['selecao-vazia',[],'tests="1" failures="0" errors="0" skipped="0"'],
  ['zero-execucoes',['example.RequiredTest'],'tests="0" failures="0" errors="0" skipped="0"'],
 ]){
  const dir=path.join(runtime,label);fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'TEST-example.RequiredTest.xml'),`<testsuite ${attributes}/>`);
  let rejection;try{requireBackendReports(dir,{selected:names});}catch(error){rejection=error.message;}
  assert.ok(rejection,label);gateControls.push({label,rejection,xmlSha256:hash(path.join(dir,'TEST-example.RequiredTest.xml'))});
 }
 const windowsOut=path.join(runtime,'windows-native');
 successful('windows-native',process.execPath,[path.join(checkout,'.github/scripts/ci.mjs'),'windows-native',checkout,windowsOut],{env});
 const windows=JSON.parse(fs.readFileSync(path.join(windowsOut,'result.json')));assert.equal(windows.status,'passed');assert.deepEqual(windows.selection.selected,selections.windowsNative.selected);assert.deepEqual(windows.backend,{tests:1,failures:0,errors:0,skipped:0});
 successful('windows-public',process.execPath,[path.join(checkout,'.github/scripts/publish-evidence.mjs'),windowsOut],{env});
 fs.copyFileSync(path.join(windowsOut,'public/result.json'),path.join(out,'windows-result.json'),fs.constants.COPYFILE_EXCL);
 fs.copyFileSync(path.join(windowsOut,'public/collection.json'),path.join(out,'windows-collection.json'),fs.constants.COPYFILE_EXCL);
 const xml=path.join(windowsOut,'surefire/TEST-com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest.xml');
 // Raw XML contains environment properties; retain privately, publish its hash.
 result={at:new Date().toISOString(),controller:{platform:process.platform,node:process.version},runtime,source:{...metadata,digest:source.digest,manifestSha256:hash(path.join(checkout,'.ci-source.json'))},steps,mutations,gateControls,windows:{status:windows.status,counts:windows.backend,xmlSha256:hash(xml),xmlPrivate:xml,sourceDigest:windows.source.digest},restoredSelectorSha256:hash(selector),remoteCi:false,productSuitesExecuted:false,newJar:false};
 fs.copyFileSync(path.join(runtime,'selecoes.json'),path.join(out,'selecoes.json'),fs.constants.COPYFILE_EXCL);
}catch(error){result={at:new Date().toISOString(),runtime,steps,error:error.message};throw error;}
finally{const name=result.error?path.basename(runtime)+'-falha.json':'validacao-windows.json';fs.writeFileSync(path.join(out,name),JSON.stringify(result,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({contracts:'passed',mutations:result.mutations.map(m=>m.label),windows:result.windows}));
