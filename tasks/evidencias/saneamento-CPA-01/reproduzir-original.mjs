import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Execute the historical verifier byte-for-byte, with its original assertions.
// Only its filesystem context changes; no historical receipt is overwritten.
const repo=process.cwd(),runtime=path.resolve(process.argv[2]??'');
const phase=process.argv[3]??'antes';
assert.ok(['antes','depois'].includes(phase));
const sourceRoot=phase==='antes'?repo:path.resolve(process.argv[4]);
assert.ok(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep));
assert.ok(path.basename(runtime).startsWith('cpa01-'));
assert.ok(!fs.existsSync(runtime));fs.mkdirSync(runtime,{recursive:true});
const checkout=path.join(runtime,'source');fs.mkdirSync(checkout);
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const originals=['tasks/evidencias/consolidacao-pre-adocao/verificar.mjs','tasks/evidencias/consolidacao-pre-adocao/CondicaoLinux.java','tasks/evidencias/investigacao-startup-HQL/jfr-stream.mjs','tasks/evidencias/investigacao-startup-HQL/jfr-stream.test.mjs'];
const files=execFileSync('git',['ls-files','.github/scripts','controle-financeiro-backend/src/test/java'],{encoding:'utf8'}).trim().split('\n').concat(originals);
const inputs=[];for(const file of files.filter(file=>fs.existsSync(path.join(sourceRoot,file)))){const original=path.join(sourceRoot,file),copy=path.join(checkout,file);fs.mkdirSync(path.dirname(copy),{recursive:true});fs.copyFileSync(original,copy);assert.equal(hash(copy),hash(original));inputs.push({file,sha256:hash(copy)});}
fs.mkdirSync(path.join(checkout,'controle-financeiro-backend/target'),{recursive:true});
fs.symlinkSync(path.join(repo,'controle-financeiro-backend/target/temurin21'),path.join(checkout,'controle-financeiro-backend/target/temurin21'),'junction');
const output=path.join(runtime,'controle-financeiro-runtimes/preparacao-adocao/consolidacao-original');
const env={...process.env,GIT_DIR:path.join(repo,'.git'),GIT_WORK_TREE:repo};
const args=['tasks/evidencias/consolidacao-pre-adocao/verificar.mjs',output];
const result=spawnSync(process.execPath,args,{cwd:checkout,env,encoding:'utf8',windowsHide:true});
fs.writeFileSync(path.join(runtime,'original.log'),(result.stdout??'')+(result.stderr??''));
const receipt={at:new Date().toISOString(),phase,sourceRoot,candidate:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),controller:process.platform,originalVerifierUnmodified:true,assertionsUnmodified:true,checkout,output,inputs,command:[process.execPath,...args],exit:result.status,logSha256:hash(path.join(runtime,'original.log')),gitContext:'Read-only original metadata; all verifier outputs isolated',nativeLinuxExecuted:false};
if(result.status===0){
 const originalOut=path.join(checkout,'tasks/evidencias/consolidacao-pre-adocao');
 for(const name of ['verificacoes.json','junit-condition.log','contratos-ci-sanitizacao.log'])fs.copyFileSync(path.join(originalOut,name),path.join(import.meta.dirname,(phase==='antes'?'':'depois-')+'original-'+name),fs.constants.COPYFILE_EXCL);
 receipt.result=JSON.parse(fs.readFileSync(path.join(originalOut,'verificacoes.json')));
}
fs.writeFileSync(path.join(import.meta.dirname,phase==='antes'?'reproducao-original.json':'reproducao-original-depois.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
assert.equal(result.status,0,result.stderr);console.log(result.stdout);
