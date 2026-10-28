import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';

// Explicit paths and Git deltas only. Never walk the historical runtime archive.
const out='tasks/evidencias/consolidacao-pre-adocao';
const candidate='56eb80b5cb867539d94995ec58b63ce2dbc519fa';
const producer='24844b594e4ed8fe906e0fc6eaee32bdd58f31a0';
const expectedReadme='6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca';
const jar='../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024}).trim();
const hash=async file=>{const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(file))h.update(b);return h.digest('hex');};
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const read=name=>JSON.parse(fs.readFileSync(path.join(out,name),'utf8'));
const references=[
 'preparacao-local-adocao/inputs.json','preparacao-local-adocao/package.json',
 'preparacao-local-adocao/image.json','preparacao-local-adocao/packaged-resources.json',
 'revisao-prontidao-CF034-CF017/preservacao-final.json','revisao-prontidao-CF034-CF017/proveniencia-verificada.json',
 'revisao-preparacao-local-adocao/preservacao-final.json','revisao-preparacao-local-adocao/pacote-verificado.json',
 'revalidacao-preparacao-local-adocao/README.md','revalidacao-preparacao-local-adocao/preservacao-final.json',
 'revalidacao-RVPLA-03/README.md','revalidacao-RVPLA-03/preservacao-final.json',
 'revalidacao-RVPLA-04/README.md','revalidacao-RVPLA-04/preservacao-final.json',
 'revalidacao-RVPLA-05/README.md','revalidacao-RVPLA-05/preservacao-final.json',
 'revalidacao-RVPLA-05-residual/README.md','revalidacao-RVPLA-05-residual/preservacao-final.json',
 'revalidacao-RVPLA-05-residual/runtime-files.json','revalidacao-TCP-reuso-nativo/README.md',
 'revalidacao-TCP-reuso-nativo/preservacao-final.json','revalidacao-TCP-reuso-nativo/runtime-files.json',
 'investigacao-startup-HQL/runtime-files.json','investigacao-startup-HQL/preservacao-final.json',
 'revisao-startup-HQL/README.md','revisao-startup-HQL/MATRIZ.md',
 'revisao-startup-HQL/preservacao-inicial.json','revisao-startup-HQL/preservacao-final.json',
 'revisao-startup-HQL/leitor-conferencia.json','revisao-startup-HQL/conferencia.json',
].map(p=>'tasks/evidencias/'+p);
const codePaths=git('diff','--name-only','origin/main',candidate,'--','.github','controle-financeiro-backend','controle-financeiro-frontend').split('\n').filter(Boolean);
const migrations=git('ls-files','controle-financeiro-backend/src/main/resources/db/migration').split('\n').filter(Boolean);
const protectedPaths=[...new Set([...codePaths,...migrations,...references,jar])];
fs.mkdirSync(out,{recursive:true});
const phase=process.argv[2];
if(phase==='inicial'){
 assert.equal(git('rev-parse','HEAD'),candidate);
 assert.equal(git('branch','--show-current'),'codex/consolidacao-pre-adocao');
 assert.equal(git('diff','--cached','--name-only'),'');
 assert.equal(await hash('README.md'),expectedReadme);
 assert.equal(git('diff','--name-only','--','.github','controle-financeiro-backend','controle-financeiro-frontend'),'');
 const files=[];for(const file of protectedPaths)files.push({file,sha256:await hash(file)});
 assert.equal(files.find(f=>f.file===jar).sha256,'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
 save('preservacao-inicial.json',{at:new Date().toISOString(),candidate,producer,branch:git('branch','--show-current'),
  mainRemote:git('rev-parse','origin/main'),mainLocal:git('rev-parse','main'),readmeSha256:expectedReadme,
  status:git('status','--short'),index:git('diff','--cached','--name-only'),files,
  scope:'Changed/relevant files and existing manifests by hash; no recursive archive inventory, restore or cleanup.'});
 console.log(JSON.stringify({phase,checked:files.length,readmeSha256:expectedReadme}));
}else if(phase==='git'){
 const remote=git('rev-parse','origin/main'),base=git('merge-base','origin/main',candidate);
 const changes=git('diff','--name-only',remote,candidate).split('\n').filter(Boolean);
 const groups={};for(const file of changes){const parts=file.split('/');const group=parts[0]==='tasks'&&parts[1]==='evidencias'?parts.slice(0,3).join('/'):parts[0];groups[group]=(groups[group]??0)+1;}
 const branches=git('for-each-ref','--format=%(refname:short) %(objectname)','refs/heads').split('\n').filter(Boolean).map(line=>{
  const [name,tip]=line.split(' '),ancestor=target=>spawnSync('git',['merge-base','--is-ancestor',tip,target],{windowsHide:true}).status===0;
  return {name,tip,containedInCandidate:ancestor(candidate),containedInRemoteMain:ancestor(remote),tree:git('rev-parse',tip+'^{tree}')};
 });
 const commits=git('log','--reverse','--format=%H%x09%s',remote+'..'+candidate).split('\n').filter(Boolean).map(line=>{const [sha,subject]=line.split('\t');return {sha,subject};});
 const deltas={};for(const key of ['.github/scripts','controle-financeiro-backend/src/main','controle-financeiro-backend/src/test','controle-financeiro-backend/pom.xml','controle-financeiro-backend/Dockerfile.release','controle-financeiro-frontend','.github/workflows'])deltas[key]=git('diff','--name-only',producer,candidate,'--',key).split('\n').filter(Boolean);
 save('reconciliacao-git.json',{at:new Date().toISOString(),remoteUrl:git('remote','get-url','origin'),remote,base,candidate,
  remoteLocalCounts:git('rev-list','--left-right','--count',remote+'...'+candidate),mainLocal:git('rev-parse','main'),
  mainLocalVsRemote:git('rev-list','--left-right','--count','main...origin/main'),commits,branches,
  changedFileCount:changes.length,groups,codePaths,producer,deltasFromProducer:deltas,
  productCommits:{backend:git('log','-1','--format=%H','--','controle-financeiro-backend/src/main'),frontend:git('log','-1','--format=%H','--','controle-financeiro-frontend/src'),scripts:git('log','-1','--format=%H','--','.github/scripts'),counterproofs:git('log','-1','--format=%H','--','tasks/evidencias/preparacao-local-adocao/counterproofs.mjs'),testHarness:git('log','-1','--format=%H','--','controle-financeiro-backend/src/test')},
  patchTreeAtPriorIntegration:{mainTree:git('rev-parse',remote+'^{tree}'),cf034Tree:git('rev-parse','codex/cf034-ci-local^{tree}')},
  queries:['git fetch --no-tags origin +refs/heads/main:refs/remotes/origin/main','git merge-base origin/main '+candidate,'git rev-list --left-right --count origin/main...'+candidate],
  priorRemoteRefs:'Only origin/main refreshed; other remote-tracking refs are historical, local branch tips tested directly.'});
 console.log(JSON.stringify({phase,remote,base,commits:commits.length,changedFileCount:changes.length,groups,productCommits:read('reconciliacao-git.json').productCommits}));
}else if(phase==='final'){
 const initial=read('preservacao-inicial.json');
 assert.equal(await hash('README.md'),expectedReadme);
 for(const item of initial.files)assert.equal(await hash(item.file),item.sha256,item.file);
 assert.equal(git('diff',candidate,'--','.github','controle-financeiro-backend','controle-financeiro-frontend'),'');
 assert.equal(migrations.length,16);
 const newFiles=[];for(const file of fs.readdirSync(out).filter(p=>p!=='preservacao-final.json')){
  const full=path.join(out,file);assert.ok(fs.statSync(full).isFile());newFiles.push({file,bytes:fs.statSync(full).size,sha256:await hash(full)});
 }
 save('preservacao-final.json',{at:new Date().toISOString(),headBeforeFinalReceiptCommit:git('rev-parse','HEAD'),
  branch:git('branch','--show-current'),initialReceiptSha256:await hash(path.join(out,'preservacao-inicial.json')),
  checkedProtectedPaths:initial.files.length,readmeSha256:expectedReadme,migrations:migrations.length,
  productHarnessDiffFromCandidate:'',index:git('diff','--cached','--name-only'),status:git('status','--short'),newFiles,
  scope:'No recursive old runtime inventory; unchanged referenced manifest bytes, relevant sources/migrations and p05 JAR checked. Final commit SHA is reported outside its own contents.'});
 console.log(JSON.stringify({phase,protected:initial.files.length,newFiles:newFiles.length,readmeSha256:expectedReadme}));
}else throw Error('Usage: conferir.mjs inicial|git|final');
