import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=import.meta.dirname,base='434e293f76c3b6ff345fe03f2091149291316aac',candidate='193916a1778f1322f5368f66d30a83286766b147';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024}).trim();
const hash=async file=>{const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(file))h.update(b);return h.digest('hex');};
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const readme='6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca';
if(process.argv[2]==='inicial'){
 assert.equal(git('rev-parse','HEAD'),candidate);assert.equal(git('merge-base',base,candidate),base);
 assert.equal(git('branch','--show-current'),'codex/saneamento-cpa01-selecao-testes');
 assert.equal(git('diff','--cached','--name-only'),'');assert.equal(await hash('README.md'),readme);
 const changed=git('diff','--name-only',base,candidate,'--','.github','controle-financeiro-backend').split('\n').filter(Boolean);
 const refs=['consolidacao-pre-adocao/CondicaoLinux.java','consolidacao-pre-adocao/verificar.mjs','consolidacao-pre-adocao/preservacao-inicial.json','consolidacao-pre-adocao/preservacao-final.json','consolidacao-pre-adocao/verificacoes.json','consolidacao-pre-adocao/reconciliacao-git.json','saneamento-CPA-01/README.md','saneamento-CPA-01/preservacao-inicial.json','saneamento-CPA-01/preservacao-final.json','saneamento-CPA-01/conferencia.json','saneamento-CPA-01/validacao-windows.json','saneamento-CPA-01/validacao-linux.json','saneamento-CPA-01/reproducao-original.json','saneamento-CPA-01/reproducao-original-depois.json','saneamento-CPA-01/selecoes.json'].map(f=>'tasks/evidencias/'+f);
 const migrations=git('ls-files','controle-financeiro-backend/src/main/resources/db/migration').split('\n').filter(Boolean);
 const files=[];for(const file of new Set([...changed,...refs,...migrations,'README.md','../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar']))files.push({file,sha256:await hash(file)});
 assert.equal(files.find(f=>f.file.endsWith('/p05/package/api.jar')).sha256,'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
 save('preservacao-inicial.json',{at:new Date().toISOString(),base,candidate,branch:git('branch','--show-current'),mainTracking:git('rev-parse','origin/main'),status:git('status','--short'),index:'',files,scope:'Relevant immutable files and existing manifests by hash. No historical archive traversal or cleanup.'});
 console.log(JSON.stringify({phase:'initial',protected:files.length,readmeSha256:readme}));
}else if(process.argv[2]==='final'){
 const initial=JSON.parse(fs.readFileSync(path.join(out,'preservacao-inicial.json')));
 for(const item of initial.files)assert.equal(await hash(item.file),item.sha256,item.file);
 assert.equal(git('diff',candidate,'--','.github','controle-financeiro-backend','controle-financeiro-frontend'),'');
 const inventory=[];for(const file of fs.readdirSync(out).filter(f=>f!=='preservacao-final.json')){const full=path.join(out,file);assert.ok(fs.statSync(full).isFile());inventory.push({file,bytes:fs.statSync(full).size,sha256:await hash(full)});}
 save('preservacao-final.json',{at:new Date().toISOString(),candidate,headBeforeFinalReceiptCommit:git('rev-parse','HEAD'),branch:git('branch','--show-current'),checkedProtectedPaths:initial.files.length,readmeSha256:await hash('README.md'),migrations:16,implementationDiffFromCandidate:'',initialReceiptSha256:await hash(path.join(out,'preservacao-inicial.json')),inventory,status:git('status','--short'),index:git('diff','--cached','--name-only'),scope:'No old runtime reinventory. Final commit identity reported outside its own contents.'});
 console.log(JSON.stringify({phase:'final',protected:initial.files.length,newEvidenceFiles:inventory.length}));
}else throw Error('Use inicial|final');
