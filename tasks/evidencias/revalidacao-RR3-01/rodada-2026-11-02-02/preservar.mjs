import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../../..'),runtime=path.resolve(process.argv[2]),mode=process.argv[3]??'initial',git=(wd,...a)=>execFileSync('git',['-c','core.longpaths=true',...a],{cwd:wd,encoding:'utf8',windowsHide:true}).trim(),main=path.dirname(git(root,'rev-parse','--path-format=absolute','--git-common-dir')),sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const base='c38679933551487e49086e65715243768cba4e44',candidate='155b249d475faa3741b31c9eeaa732b08b5cdbe9',start='8f52b2078bdf8e515dd118c874ff649464182365';
assert.equal(path.dirname(runtime),path.resolve(main,'../controle-financeiro-runtimes/preparacao-adocao'));assert.match(path.basename(runtime),/^revalidacao-rr3-01-/);
execFileSync('git',['merge-base','--is-ancestor',base,candidate],{cwd:root});execFileSync('git',['merge-base','--is-ancestor',candidate,'HEAD'],{cwd:root});
assert.equal(git(root,'branch','--show-current'),'codex/saneamento-pr3-expanded');
assert.equal(git(root,'diff',candidate,'HEAD','--','controle-financeiro-backend','controle-financeiro-frontend','.github','docs/sdd','.gitignore'),'');
const protected97=read(path.join(main,'tasks/evidencias/validacao-remota-consolidacao/preservacao-inicial.json')).files,manifest=read(path.join(root,'tasks/evidencias/saneamento-PR3-expanded/inventario.json')),prior=read(path.join(root,'tasks/evidencias/saneamento-PR3-expanded-residual/PRESERVACAO.json')),changes=new Map(prior.manifest36.authorizedChanges.map(c=>[c.file,c]));
assert.equal(protected97.length,97);assert.equal(manifest.files.length,36);assert.equal(changes.size,7);
for(const f of protected97)assert.equal(sha(path.resolve(main,f.file)),f.sha256,f.file);
for(const f of manifest.files)assert.equal(sha(path.join(root,f.file)),changes.get(f.file)?.after??f.sha256,f.file);
for(const f of changes.values())assert.equal(sha(f.archivedBefore),f.before,f.archivedBefore);
assert.equal(sha(path.join(main,'README.md')),'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
assert.ok(!fs.existsSync(path.join(main,'.r3')));assert.ok(!fs.existsSync(path.join(root,'.r3')));
const data={at:new Date(),reviewDate:'2026-11-02 America/Sao_Paulo',root,main,runtime,mode,base,candidate,start,head:git(root,'rev-parse','HEAD'),branch:git(root,'branch','--show-current'),status:git(root,'status','--short'),mainState:{head:git(main,'rev-parse','HEAD'),branch:git(main,'branch','--show-current'),status:git(main,'status','--short'),readme:sha(path.join(main,'README.md'))},worktreeReadme:sha(path.join(root,'README.md')),worktrees:git(main,'worktree','list','--porcelain'),preservation:{protected97:97,manifest36:36,sevenOriginals:[...changes.values()],r3Absent:true},sourceCandidateEquivalent:true};
if(mode==='initial'){
 assert.equal(data.head,start);assert.equal(data.status,'');assert.ok(!fs.existsSync(runtime));fs.mkdirSync(runtime);
 data.files=git(root,'ls-files').split('\n').map(file=>({file,sha256:sha(path.join(root,file))}));
}else{
 const original=read(path.join(runtime,'initial.json'));assert.equal(data.mainState.status,original.mainState.status);assert.equal(data.mainState.head,original.mainState.head);assert.equal(data.worktreeReadme,original.worktreeReadme);
 for(const f of original.files)assert.equal(sha(path.join(root,f.file)),f.sha256,f.file);
 data.initialFileCount=original.files.length;data.allInitialTrackedBytesPreserved=true;data.initialSha256=sha(path.join(runtime,'initial.json'));
}
fs.writeFileSync(path.join(runtime,mode+'.json'),JSON.stringify(data,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...data,files:data.files?.length,preservation:{protected97:97,manifest36:36,originals:7}}));
