import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),runtime=path.resolve(process.argv[2]??'');
assert.match(path.basename(runtime),/^saneamento-expanded-plataformas-[a-z0-9-]+$/);
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const initial=read(path.join(runtime,'initial.json'));assert.equal(root,initial.root);
const allowed=new Set(['.github/scripts/ci.mjs','.github/workflows/ci.yml','tasks/05-release/CF-034-gates-ci.md','tasks/05-release/CF-036-publicacao.md']);
const changes=[];
for(const item of initial.files){const after=hash(path.join(root,item.file));if(after!==item.sha256){assert.ok(allowed.has(item.file),'Unexpected delta: '+item.file);assert.equal(hash(path.join(runtime,'originals',item.file)),item.sha256);changes.push({file:item.file,before:item.sha256,after,archived:path.join(runtime,'originals',item.file)});}}
for(const item of initial.references)assert.equal(hash(item.file),item.sha256,item.file);
const prior=initial.prior,oldInitial=read(path.join(prior,'initial.json')),oldFinal=read(path.join(prior,'preservation-final-1793724101715.json'));
const oldChanges=new Map(oldFinal.authorizedChanges.map(x=>[x.file,x]));assert.equal(oldChanges.size,11);
for(const item of oldFinal.authorizedChanges){assert.equal(hash(item.archived),item.before);if(hash(path.join(root,item.file))!==item.after){assert.ok(allowed.has(item.file));assert.equal(hash(path.join(runtime,'originals',item.file)),item.after);}}
const baseline=read(oldInitial.references[0].file);let immutable=0;for(const item of baseline.files){if(!oldChanges.has(item.file)){assert.equal(hash(path.join(root,item.file)),item.sha256,item.file);immutable++;}}
assert.equal(immutable,1113);
for(const ref of oldInitial.references)assert.equal(hash(ref.file),ref.sha256,ref.file);
const oldResults=read(path.join(root,'tasks/evidencias/excecao-zoom-expanded/RESULTADOS.json'));for(const ref of oldResults.evidence)assert.equal(hash(ref.path),ref.sha256,ref.path);
const history=read(oldInitial.references[1].file);for(const item of history.files)assert.equal(hash(item.file),item.sha256,item.file);
const protectedManifest=read(oldInitial.references[4].file);const main=path.resolve(root,'../../controle-financeiro');for(const item of protectedManifest.protected97)assert.equal(hash(path.resolve(main,item.file)),item.sha256,item.file);
const assisted=path.resolve(runtime,'../zoom-assistido-20261103-06'),prepared=read(path.join(assisted,'prepared.json')),adapted=read(path.join(assisted,'assisted-package.json')),patches=new Map(adapted.changes.map(x=>[x.relative,x]));let packageFiles=0;
for(const item of prepared.files.filter(x=>x.tree==='s')){const patch=patches.get(item.copy);if(patch){assert.equal(patch.original,item.actual);assert.equal(hash(patch.archived),item.actual);}assert.equal(hash(path.join(assisted,'s',item.copy)),patch?.actual??item.actual,item.file);packageFiles++;}
for(const item of adapted.extras){assert.equal(hash(path.join(assisted,'s',item.relative)),item.sha256);packageFiles++;}
const git=(cwd,...a)=>execFileSync('git',a,{cwd,encoding:'utf8',windowsHide:true}).trim();const state=cwd=>({head:git(cwd,'rev-parse','HEAD'),branch:git(cwd,'branch','--show-current'),status:git(cwd,'status','--short'),readme:hash(path.join(cwd,'README.md'))});
const principal=state(main);assert.equal(principal.head,'c16e6545488c8f13efda4dab9efa8aa896fcddaa');assert.equal(principal.status,'M README.md');assert.equal(principal.readme,'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');assert.equal(principal.readme,initial.readmes.main);assert.equal(hash(path.join(root,'README.md')),initial.readmes.worktree);
assert.ok(!fs.existsSync(path.join(root,'.r3'))&&!fs.existsSync(path.join(main,'.r3')));git(root,'merge-base','--is-ancestor',initial.head,'HEAD');
const receipt={at:new Date(),base:initial.head,initialTracked:initial.files.length,unchanged:initial.files.length-changes.length,authorizedChanges:changes,prior1113Unchanged:immutable,prior11Deltas:{count:11,allOriginalBytesVerified:true,priorVersionsSupersededOnlyWithinAuthorizedNewScope:changes.map(x=>x.file)},historicalEvidenceReferences:oldResults.evidence.length,historicalArtifacts:history.files.length,protected97:protectedManifest.protected97.length,assistedPackageFiles:packageFiles,readmes:{main:principal.readme,worktree:hash(path.join(root,'README.md'))},principal,worktree:state(root),publication:state('C:/Users/Aluga.com/.codex/worktrees/publicacao-limpa/controle-financeiro'),references:initial.references,r3Absent:true,cleanup:'No clean/reset/general removal; historical outputs and stopped diagnostic containers retained'};
const file=path.join(runtime,'preservation-final-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:file,sha256:hash(file),prior1113Unchanged:immutable,authorizedChanges:changes,assistedPackageFiles:packageFiles,principal,worktree:receipt.worktree}));
