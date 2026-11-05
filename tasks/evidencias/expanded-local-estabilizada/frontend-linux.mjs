import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {sourceFor} from '../../../.github/scripts/source.mjs';
const [sourceArg,outArg]=process.argv.slice(2);assert.ok(sourceArg&&outArg);
const source=fs.realpathSync.native(sourceArg),out=path.resolve(outArg);assert.ok(!fs.existsSync(out));fs.mkdirSync(out);
const input=sourceFor(source);assert.equal(fs.existsSync(path.join(source,'controle-financeiro-frontend/node_modules')),false);
const docker=(...args)=>execFileSync('docker',['--context','desktop-linux',...args],{encoding:'utf8',windowsHide:true}).trim();
const image=docker('image','inspect','cf-excecao-zoom:20261103-01','--format','{{.Id}}'),name='cf-expanded-frontend-'+randomUUID();
const copy="import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';\nconst manifest=JSON.parse(fs.readFileSync('/inputs/.ci-source.json'));const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');\nfor(const f of manifest.files){const target=path.resolve('/work/s',f.path);assert.ok(target.startsWith('/work/s/'));assert.equal(hash(path.join('/inputs',f.path)),f.sha256);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join('/inputs',f.path),target);assert.equal(hash(target),f.sha256);}\nfs.copyFileSync('/inputs/.ci-source.json','/work/s/.ci-source.json');\nconst {sourceFor}=await import(pathToFileURL('/work/s/.github/scripts/source.mjs'));assert.equal(sourceFor('/work/s').digest,manifest.digest);\nfs.writeFileSync('/evidence/native-inputs.json',JSON.stringify({at:new Date(),platform:process.platform,node:process.version,files:manifest.files.length,digest:manifest.digest,commit:manifest.commit,allBytesMatch:true,filesystem:'fresh /work/s inside container writable Linux layer; dependencies installed there'},null,2)+'\\n');\n";
fs.writeFileSync(path.join(out,'copy.mjs'),copy,{flag:'wx'});
const script="set -eu\nnode /evidence/copy.mjs\ncd /work/s\nnode --test .github/scripts/ci.test.mjs .github/scripts/suites.test.mjs .github/scripts/sanitize.test.mjs .github/scripts/required.test.mjs .github/scripts/zoom-coverage.test.mjs .github/scripts/paths.test.mjs .github/scripts/components.test.mjs > /evidence/contracts.log 2>&1\nnode .github/scripts/ci.mjs frontend /work/s /evidence/frontend\nnode --input-type=module -e \"import {sourceFor} from './.github/scripts/source.mjs';console.log(sourceFor('/work/s').digest);\" > /evidence/native-after.digest\n";
fs.writeFileSync(path.join(out,'run.sh'),script,{flag:'wx'});
const args=['create','--name',name,'--label','cf.expanded.runtime='+path.basename(path.dirname(out)),'--shm-size=1g','--mount','type=bind,source='+source+',target=/inputs,readonly','--mount','type=bind,source='+out+',target=/evidence','--env','CF034_SUITE=expanded','--env','PLAYWRIGHT_BROWSERS_PATH=0','--entrypoint','sh',image,'/evidence/run.sh'];
const id=docker(...args);const started=new Date().toISOString();
fs.writeFileSync(path.join(out,'invocation.json'),JSON.stringify({started,input:{commit:input.commit,digest:input.digest},controller:'Windows Docker CLI; Node runner inside Linux',image,id,name,args},null,2)+'\n',{flag:'wx'});
let result;const collected=[];
try{
 const fd=fs.openSync(path.join(out,'controller.log'),'wx');
 result=spawnSync('docker',['--context','desktop-linux','start','-a',id],{windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 for(const [remote,local] of [['/work/s/.ci-source.json','source-manifest.json'],['/work/s/.ci-frontend.json','frontend-marker.json'],['/work/s/controle-financeiro-frontend/.next/BUILD_ID','BUILD_ID']]){
  const copied=spawnSync('docker',['--context','desktop-linux','cp',id+':'+remote,path.join(out,local)],{encoding:'utf8',windowsHide:true});
  if(copied.status===0)collected.push(local);
 }
 fs.writeFileSync(path.join(out,'execution.json'),JSON.stringify({started,finished:new Date().toISOString(),exit:result.status,error:result.error?.message,id,image,collected,logSha256:createHash('sha256').update(fs.readFileSync(path.join(out,'controller.log'))).digest('hex')},null,2)+'\n',{flag:'wx'});
}finally{
 const inspected=JSON.parse(docker('inspect',id))[0];assert.equal(inspected.Name,'/'+name);assert.equal(inspected.Config.Labels['cf.expanded.runtime'],path.basename(path.dirname(out)));
 docker('rm','-f','-v',id);
 fs.writeFileSync(path.join(out,'cleanup.json'),JSON.stringify({at:new Date().toISOString(),id,removed:true,remainingById:docker('ps','-aq','--filter','id='+id)},null,2)+'\n',{flag:'wx'});
}
assert.equal(result.status,0,'Linux frontend failed; preserve first occurrence');
console.log(JSON.stringify({frontendLinux:'passed',out,inputDigest:input.digest}));
