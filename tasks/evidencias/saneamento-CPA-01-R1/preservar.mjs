import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const out=import.meta.dirname,base='e837748a600c356e2e9d4f60291240cebf523916';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
async function hash(file){const h=createHash('sha256');for await(const bytes of fs.createReadStream(file))h.update(bytes);return h.digest('hex');}
const readme='6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca';
const jar='../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar';
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const changed=new Set(['.github/workflows/ci.yml','.github/scripts/suites.test.mjs','tasks/README.md','tasks/evidencias/consolidacao-pre-adocao/PUBLICACAO-CI.md','tasks/evidencias/consolidacao-pre-adocao/PROPOSTA-PR.md']);
if(process.argv[2]==='inicial'){
 assert.equal(git('rev-parse','HEAD'),base);assert.equal(git('branch','--show-current'),'codex/saneamento-cpa01-selecao-testes');
 assert.equal(git('diff','--cached','--name-only'),'');assert.equal(await hash('README.md'),readme);
 assert.equal(git('diff','193916a1778f1322f5368f66d30a83286766b147',base,'--','.github','controle-financeiro-backend','controle-financeiro-frontend'),'');
 const previous='tasks/evidencias/revalidacao-CPA-01/preservacao-inicial.json';
 const old=JSON.parse(fs.readFileSync(previous));
 const refs=git('ls-files','tasks/evidencias/revalidacao-CPA-01').split('\n').filter(Boolean);
 const inputs=[...new Set([...old.files.map(f=>f.file),...refs,...changed,previous,jar,'README.md'])];
 const files=[];for(const file of inputs)files.push({file,sha256:await hash(file),expectedChange:changed.has(file)});
 for(const item of old.files)assert.equal(await hash(item.file),item.sha256,item.file);
 assert.equal(await hash(jar),'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
 save('preservacao-inicial.json',{at:new Date().toISOString(),base,branch:git('branch','--show-current'),mainTracking:git('rev-parse','origin/main'),mergeBase:git('merge-base','HEAD','origin/main'),mainRefRefreshed:false,status:git('status','--short'),index:'',previousManifest:{file:previous,sha256:await hash(previous)},files,scope:'Relevant sources and existing manifests by reference/hash; no old runtime traversal.'});
 console.log(JSON.stringify({phase:'initial',files:files.length,readmeSha256:readme}));
}else if(process.argv[2]==='final'){
 const initial=JSON.parse(fs.readFileSync(path.join(out,'preservacao-inicial.json')));
 const files=[];for(const item of initial.files){const finalSha256=await hash(item.file);if(!item.expectedChange)assert.equal(finalSha256,item.sha256,item.file);files.push({...item,finalSha256,unchanged:finalSha256===item.sha256});}
 assert.equal(git('diff',base,'--','controle-financeiro-backend','controle-financeiro-frontend','.github/scripts/ci.mjs','.github/scripts/suites.mjs','.github/scripts/ci.test.mjs','.github/scripts/sanitize.mjs'),'');
 assert.equal(await hash('README.md'),readme);
 const migrations=git('ls-files','controle-financeiro-backend/src/main/resources/db/migration').split('\n').filter(Boolean);assert.equal(migrations.length,16);
 const inventory=[];for(const file of fs.readdirSync(out).filter(f=>f!=='preservacao-final.json')){const full=path.join(out,file);assert.ok(fs.statSync(full).isFile());inventory.push({file,bytes:fs.statSync(full).size,sha256:await hash(full)});}
 save('preservacao-final.json',{at:new Date().toISOString(),base,headBeforeReceiptCommit:git('rev-parse','HEAD'),branch:git('branch','--show-current'),initialReceiptSha256:await hash(path.join(out,'preservacao-inicial.json')),files,inventory,readmeSha256:readme,jarSha256:await hash(jar),migrations:16,productAndAcceptedSelectorsUnchanged:true,status:git('status','--short'),index:git('diff','--cached','--name-only'),state:'CPA-01/R1 saneado localmente, aguardando revisão independente; parecer C preservado'});
 console.log(JSON.stringify({phase:'final',protected:files.filter(f=>!f.expectedChange).length,migrations:16,jarSha256:await hash(jar)}));
}else throw Error('Use inicial|final');
