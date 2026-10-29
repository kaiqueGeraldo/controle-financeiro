import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const out=import.meta.dirname;
const base='434e293f76c3b6ff345fe03f2091149291316aac';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
async function hash(file){const digest=createHash('sha256');for await(const bytes of fs.createReadStream(file))digest.update(bytes);return digest.digest('hex');}
const readme='6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca';
const changed=new Set(['.github/scripts/suites.mjs','.github/scripts/ci.mjs','.github/workflows/ci.yml','controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionNativeSocketsTest.java','tasks/evidencias/consolidacao-pre-adocao/PUBLICACAO-CI.md']);
const prior='tasks/evidencias/consolidacao-pre-adocao/preservacao-inicial.json';
const previous=JSON.parse(fs.readFileSync(prior));
const phase=process.argv[2];
if(phase==='inicial'){
 assert.equal(git('rev-parse','HEAD'),base);
 assert.equal(git('branch','--show-current'),'codex/saneamento-cpa01-selecao-testes');
 assert.equal(git('diff','--cached','--name-only'),'');
 assert.equal(await hash('README.md'),readme);
 const references=git('ls-files','tasks/evidencias/consolidacao-pre-adocao').split('\n').filter(Boolean);
 const files=[];for(const file of new Set([...previous.files.map(f=>f.file),...references,prior,'README.md',...changed]))files.push({file,sha256:await hash(file),expectedChange:changed.has(file)});
 for(const old of previous.files)assert.equal(files.find(f=>f.file===old.file).sha256,old.sha256,old.file);
 const result={at:new Date().toISOString(),base,branch:git('branch','--show-current'),mainTracking:git('rev-parse','origin/main'),mergeBase:git('merge-base','origin/main',base),priorManifest:{file:prior,sha256:await hash(prior)},files,status:git('status','--short'),index:git('diff','--cached','--name-only'),scope:'Existing manifests by reference/hash; directly relevant sources only; no historical runtime traversal.'};
 fs.writeFileSync(path.join(out,'preservacao-inicial.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({phase,files:files.length,readmeSha256:readme}));
}else if(phase==='final'){
 const initial=JSON.parse(fs.readFileSync(path.join(out,'preservacao-inicial.json')));
 const files=[];
 for(const item of initial.files){const current=await hash(item.file);if(!item.expectedChange)assert.equal(current,item.sha256,item.file);files.push({...item,finalSha256:current,unchanged:current===item.sha256});}
 assert.equal(await hash('README.md'),readme);
 const productDiff=git('diff',base,'--','controle-financeiro-backend/src/main','controle-financeiro-backend/pom.xml','controle-financeiro-frontend');assert.equal(productDiff,'');
 const migrations=git('ls-files','controle-financeiro-backend/src/main/resources/db/migration').split('\n').filter(Boolean);assert.equal(migrations.length,16);
 const jar='../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar';assert.equal(await hash(jar),'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
 const inventory=[];for(const file of fs.readdirSync(out).filter(f=>f!=='preservacao-final.json')){const full=path.join(out,file);assert.ok(fs.statSync(full).isFile());inventory.push({file,bytes:fs.statSync(full).size,sha256:await hash(full)});}
 const result={at:new Date().toISOString(),base,headBeforeReceiptCommit:git('rev-parse','HEAD'),branch:git('branch','--show-current'),initialReceiptSha256:await hash(path.join(out,'preservacao-inicial.json')),files,inventory,readmeSha256:readme,jarSha256:await hash(jar),migrations:migrations.length,productDiff,status:git('status','--short'),index:git('diff','--cached','--name-only'),approval:'saneado localmente; aguardando revisão independente; parecer C não alterado'};
 fs.writeFileSync(path.join(out,'preservacao-final.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({phase,protected:files.filter(f=>!f.expectedChange).length,jarSha256:result.jarSha256,migrations:16}));
}else throw Error('Use inicial|final');
