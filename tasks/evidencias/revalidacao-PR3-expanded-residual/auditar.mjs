import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..');
const main=path.dirname(execFileSync('git',['rev-parse','--path-format=absolute','--git-common-dir'],{cwd:root,encoding:'utf8',windowsHide:true}).trim());
const runtime=path.resolve(process.argv[2]);
assert.equal(path.dirname(runtime),path.resolve(main,'../controle-financeiro-runtimes/preparacao-adocao'));
assert.match(path.basename(runtime),/^revalidacao-pr3-residual-/);
const phase=process.argv[3]??'initial';
fs.mkdirSync(runtime,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(f));
const sha=b=>createHash('sha256').update(b).digest('hex');
const hash=f=>sha(fs.readFileSync(f));
const git=(cwd,...a)=>execFileSync('git',a,{cwd,encoding:'utf8',windowsHide:true}).trim();
const base=git(root,'rev-parse','965b93c7'),candidate=git(root,'rev-parse','4f22d41f');
execFileSync('git',['merge-base','--is-ancestor',base,candidate],{cwd:root});
const evidence=path.join(root,'tasks/evidencias/saneamento-PR3-expanded-residual');
const results=read(path.join(evidence,'RESULTADOS.json'));
const historical=results.runtime,organization=results.organizationRuntime;
const protectedFile=path.join(main,'tasks/evidencias/validacao-remota-consolidacao/preservacao-inicial.json');
const protected97=read(protectedFile);
assert.equal(protected97.files.length,97);
for(const f of protected97.files)assert.equal(hash(path.resolve(main,f.file)),f.sha256,f.file);
const manifestFile=path.join(root,'tasks/evidencias/saneamento-PR3-expanded/inventario.json'),manifest=read(manifestFile);
assert.equal(hash(manifestFile),'b16f787dfa72e721c59803c64696fd4d51be9aa557a5dc61214948f3f3c4f9e0');
const preserved=read(path.join(evidence,'PRESERVACAO.json'));
const changes=[];
for(const f of manifest.files){
 const actual=hash(path.join(root,f.file));
 if(actual===f.sha256)continue;
 const documented=preserved.manifest36.authorizedChanges.find(c=>c.file===f.file);
 assert.ok(documented,'undocumented change '+f.file);
 assert.equal(documented.before,f.sha256);assert.equal(documented.after,actual);
 assert.equal(hash(documented.archivedBefore),f.sha256);
 const blob=execFileSync('git',['-c','core.longpaths=true','show',base+':'+f.file],{cwd:root});
 assert.ok([blob,Buffer.from(blob.toString().replace(/\r?\n/g,'\r\n'))].some(b=>sha(b)===f.sha256));
 changes.push({...documented,archivedVerified:true,gitBaseVerified:true});
}
assert.equal(changes.length,7);
const independentChanges=git(root,'diff','--name-only',base,candidate,'--','tasks/evidencias/revisao-PR3-expanded-parcial').split('\n').filter(Boolean);
assert.deepEqual(independentChanges.sort(),['auditar.mjs','consolidar.mjs','executar.mjs'].map(f=>'tasks/evidencias/revisao-PR3-expanded-parcial/'+f).sort());
const independentDiff=git(root,'diff',base,candidate,'--','tasks/evidencias/revisao-PR3-expanded-parcial');
assert.equal((independentDiff.match(/^\+const .*original=/gm)??[]).length,3);
const before=read(path.join(organization,'worktree-before.json')),after=read(path.join(organization,'worktree-after.json'));
assert.equal(before.files,36114);assert.equal(after.files,before.files);assert.equal(after.bytes,before.bytes);
const comparable=after.entries.map((entry,i)=>entry.path==='.git'?{...entry,mtimeMs:before.entries[i].mtimeMs}:entry);
assert.deepEqual(comparable,before.entries);
const links=before.entries.filter(e=>e.type==='link').map(e=>{
 const actual=fs.readlinkSync(path.join(root,e.path));assert.equal(actual,e.target);assert.ok(fs.existsSync(path.join(root,e.path)));return {...e,exists:true};
});
const independent=read(path.join(organization,'independent-sources-before.json'));
for(const f of independent)assert.equal(hash(path.join(root,f.file)),f.sha256,f.file);
const counts=s=>Object.fromEntries(['tests','failures','errors','skipped'].map(k=>[k,Number(s.match(new RegExp('\\b'+k+'="(\\d+)"'))?.[1])]));
const runs=[];
for(const run of results.runs){
 const folder=path.join(historical,run.label),data=read(path.join(folder,'execution.json'));
 assert.equal(hash(path.join(folder,'execution.json')),run.executionSha256);
 assert.equal(hash(path.join(folder,'inputs.json')),run.inputsSha256);
 assert.equal(hash(path.join(folder,'maven.log')),run.logSha256);
 const reports=[];
 for(const report of run.reports){
  const file=path.join(folder,'surefire',report.file);assert.equal(hash(file),report.sha256);
  const xml=fs.readFileSync(file,'utf8'),suite=xml.match(/<testsuite\b[^>]*>/)[0];
  reports.push({file:report.file,sha256:hash(file),...counts(suite),cases:[...xml.matchAll(/<testcase\b[^>]*name="([^"]+)"[^>]*>/g)].map(m=>m[1])});
 }
 runs.push({label:run.label,exit:data.exit,selected:data.args.find(a=>a.startsWith('-Dtest=')),grep:data.args.find(a=>a.startsWith('-Dreview.grep=')),reports});
}
for(const binding of results.criticalSourceBinding){
 assert.equal(hash(path.join(root,binding.file)),binding.currentSha256);
 let b=fs.readFileSync(path.join(root,binding.file));
 if(binding.resourcePathOnly)b=Buffer.from(b.toString().replaceAll('resolveSibling("controle-financeiro-frontend")','resolveSibling("f")'));
 assert.equal(sha(b),binding.testedCopySha256);
 const inputs=read(path.join(historical,'restored-controls/inputs.json'));
 assert.equal(inputs.find(f=>f.file.replaceAll('\\','/')===binding.file.replace('controle-financeiro-frontend/','f/'))?.sha256,binding.testedCopySha256);
}
const originalRemote=path.resolve(main,'../controle-financeiro-runtimes/preparacao-adocao/ci-remota-20261028-01');
const remoteFiles=[['dispatch-expanded.zip','d55c613d47eede475c71700f1ea06250b8b92f7e131b6f9dec914decdd193598'],['dispatch-expanded/backend.log','4b61514685e034041c6c42d330dede8be5942994d7aa821898deb60c95b19037']].map(([file,expected])=>{assert.equal(hash(path.join(originalRemote,file)),expected);return{file,sha256:expected}});
const productDiff=git(root,'diff',base,candidate,'--','controle-financeiro-backend/src/main','controle-financeiro-frontend/src','.github','docs/sdd','controle-financeiro-backend/pom.xml','controle-financeiro-frontend/package.json','controle-financeiro-frontend/package-lock.json');
assert.equal(productDiff,'');
assert.equal(hash(path.join(main,'README.md')),'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
assert.equal(hash(path.join(root,'README.md')),'e7d3458fbd8ac227520be27996ce23c73e8c3be2086d8cfbd51ad59568f4cee0');
assert.ok(!fs.existsSync(path.join(main,'.r3')));
const publication='C:/Users/Aluga.com/.codex/worktrees/publicacao-limpa/controle-financeiro';
const record={at:new Date(),phase,root,main,runtime,base,candidate,head:git(root,'rev-parse','HEAD'),branch:git(root,'branch','--show-current'),status:git(root,'status','--short'),worktrees:git(main,'worktree','list','--porcelain'),mainState:{head:git(main,'rev-parse','HEAD'),branch:git(main,'branch','--show-current'),status:git(main,'status','--short'),readme:hash(path.join(main,'README.md'))},publication:{head:git(publication,'rev-parse','HEAD'),status:git(publication,'status','--short')},worktreeReadme:hash(path.join(root,'README.md')),protected97:97,manifest97Sha256:hash(protectedFile),records36:36,unchanged36:29,changes,independentHistorical21:independent.length,operationalIndependentChanges:independentChanges,links,relocation:{files:before.files,bytes:before.bytes,originalReceiptsAllEntriesEqual:true,r3Absent:true},productDependenciesGatesDiffEmpty:true,runs,criticalBindings:results.criticalSourceBinding,remoteFiles};
fs.writeFileSync(path.join(runtime,'audit-'+phase+'.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({phase,head:record.head,main:record.mainState,worktreeStatus:record.status,protected97:97,records36:36,changed:changes.length,historicalRunsVerified:runs.length,classes88:runs.find(r=>r.label==='restored-controls').reports.map(r=>({file:r.file,tests:r.tests})),relocation:record.relocation,links:links.length}));
