import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),runtime=path.resolve(process.argv[2]??'');
assert.match(path.basename(runtime),/^excecao-zoom-expanded-[a-z0-9-]+$/);
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const initial=read(path.join(runtime,'initial.json'));
assert.equal(initial.root,root);
const git=(cwd,...args)=>execFileSync('git',['-c','core.longpaths=true',...args],{cwd,encoding:'utf8',windowsHide:true}).trim();
const allowed=new Set(['.github/scripts/ci.mjs','.github/scripts/prepare.mjs','.github/scripts/source.mjs','.github/scripts/suites.mjs','.github/workflows/ci.yml','controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/Rf15RemediationBrowserTest.java','controle-financeiro-frontend/tests/e2e/playwright.rf15.config.ts','tasks/02-frontend/CF-010-componentes-comuns.md','tasks/02-frontend/CF-015-revisao-marco-frontend.md','tasks/05-release/CF-034-gates-ci.md','tasks/05-release/CF-036-publicacao.md']);
const before=new Map(initial.files.map(x=>[x.file,x]));
const changes=[];
for(const item of initial.files){
 assert.equal(hash(path.join(runtime,'originals',item.file)),item.sha256,'Archived original: '+item.file);
 const current=hash(path.join(root,item.file));
 if(current!==item.sha256){assert.ok(allowed.has(item.file),'Unexpected delta: '+item.file);changes.push({file:item.file,before:item.sha256,after:current,archived:path.join(runtime,'originals',item.file)});}
}
for(const reference of initial.references)assert.equal(hash(reference.file),reference.sha256,reference.file);
function originalOrAuthorized(file,expected){
 const current=hash(path.join(root,file));if(current===expected)return;
 assert.ok(allowed.has(file),'Unexpected historical delta: '+file);
 assert.equal(before.get(file)?.sha256,expected,'Expected original differs: '+file);
 assert.equal(hash(path.join(runtime,'originals',file)),expected);
}
const baseline=read(initial.references[0].file);assert.equal(baseline.files.length,1124);
for(const item of baseline.files)originalOrAuthorized(item.file,item.sha256);
const history=read(initial.references[1].file);for(const item of history.files)assert.equal(hash(item.file),item.sha256,item.file);
const prior=read(initial.references[4].file);
for(const item of prior.files)originalOrAuthorized(item.file,item.sha256);
for(const item of prior.protected97)assert.equal(hash(path.resolve(initial.main,item.file)),item.sha256,item.file);
const manifest36Path=path.join(root,'tasks/evidencias/saneamento-PR3-expanded/inventario.json'),manifest36=read(manifest36Path),deltas7=new Map(prior.originals7.map(x=>[x.file,x]));
for(const item of manifest36.files)originalOrAuthorized(item.file,deltas7.get(item.file)?.after??item.sha256);
for(const item of prior.originals7)assert.equal(hash(item.archivedBefore),item.before,item.archivedBefore);
assert.equal(hash(prior.manifest1053.path),prior.manifest1053.sha256);
const old=read(prior.manifest1053.path),deltas2=new Map(prior.manifest1053.files.filter(x=>x.authorizedDelta).map(x=>[x.file,x]));
for(const item of old.files){const delta=deltas2.get(item.file);originalOrAuthorized(item.file,delta?.candidate??item.sha256);if(delta)assert.equal(hash(delta.archived),item.sha256);}
const assisted=path.resolve(runtime,'../zoom-assistido-20261103-06'),prepared=read(path.join(assisted,'prepared.json')),adapted=read(path.join(assisted,'assisted-package.json')),patches=new Map(adapted.changes.map(x=>[x.relative,x]));let packageFiles=0;
for(const item of prepared.files.filter(x=>x.tree==='s')){const patch=patches.get(item.copy);if(patch){assert.equal(patch.original,item.actual);assert.equal(hash(patch.archived),item.actual);}assert.equal(hash(path.join(assisted,'s',item.copy)),patch?.actual??item.actual,item.file);packageFiles++;}
for(const item of adapted.extras){assert.equal(hash(path.join(assisted,'s',item.relative)),item.sha256,item.relative);packageFiles++;}
const state=cwd=>({head:git(cwd,'rev-parse','HEAD'),branch:git(cwd,'branch','--show-current'),status:git(cwd,'status','--short'),readme:hash(path.join(cwd,'README.md'))});
const principal=state(initial.main);assert.deepEqual(principal,initial.principal);
assert.equal(hash(path.join(root,'README.md')),initial.worktree.readme);
assert.ok(!fs.existsSync(path.join(root,'.r3'))&&!fs.existsSync(path.join(initial.main,'.r3')));
git(root,'merge-base','--is-ancestor',initial.worktree.head,'HEAD');
const baselineChanged=baseline.files.filter(x=>hash(path.join(root,x.file))!==x.sha256).length;
const report={at:new Date(),base:initial.worktree.head,baseline1124:{files:1124,currentUnchanged:1124-baselineChanged,authorizedDeltas:baselineChanged,allOriginalBytesArchivedAndVerified:true},initialTracked:initial.files.length,currentUnchanged:initial.files.length-changes.length,authorizedChanges:changes,protected97:prior.protected97.length,prior1087:prior.files.length,records36:manifest36.files.length,archivedOriginals7:prior.originals7.length,manifest1053:{files:old.files.length,priorAuthorizedDeltas:deltas2.size,originalsVerified:true},historicalArtifacts:history.files.length,assistedPackage:{path:assisted,filesVerified:packageFiles,preparedSha256:hash(path.join(assisted,'prepared.json')),adaptedSha256:hash(path.join(assisted,'assisted-package.json'))},references:initial.references,principal,worktree:state(root),publication:state('C:/Users/Aluga.com/.codex/worktrees/publicacao-limpa/controle-financeiro'),r3Absent:true,destructiveCleanup:false};
const file=path.join(runtime,'preservation-final-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:file,receiptSha256:hash(file),baseline1124:report.baseline1124,authorizedChanges:changes.map(x=>x.file),protected97:report.protected97,historicalArtifacts:report.historicalArtifacts,assistedPackageFiles:packageFiles,principal,worktree:report.worktree,publication:report.publication}));
