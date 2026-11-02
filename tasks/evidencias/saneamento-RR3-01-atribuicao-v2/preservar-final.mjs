import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const rt=path.resolve(process.argv[2]),phase=process.argv[3]??'preservation-final',root=path.resolve(import.meta.dirname,'../../..'),read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')),sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),initial=read(path.join(rt,'initial.json')),git=(wd,...a)=>execFileSync('git',['-c','core.longpaths=true',...a],{cwd:wd,encoding:'utf8',windowsHide:true}).trim();
const changed=['controle-financeiro-frontend/tests/e2e/support/text-geometry.ts','controle-financeiro-frontend/tests/e2e/playwright.text-geometry.config.ts'];
for(const f of initial.files)if(!changed.includes(f.file))assert.equal(sha(path.join(root,f.file)),f.sha256,f.file);
for(const f of initial.protected97)assert.equal(sha(path.resolve(initial.main,f.file)),f.sha256,f.file);
const byFile=new Map(initial.changes.map(c=>[c.file,c]));for(const f of initial.manifest36.files)assert.equal(sha(path.join(root,f.file)),byFile.get(f.file)?.after??f.sha256,f.file);
for(const f of initial.changes)assert.equal(sha(f.archivedBefore),f.before);
assert.equal(sha(initial.manifest1053.path),initial.manifest1053.sha256);const manifest1053=read(initial.manifest1053.path);for(const f of manifest1053.files)if(!changed.includes(f.file))assert.equal(sha(path.join(root,f.file)),f.sha256,f.file);
assert.equal(sha(path.join(initial.main,'README.md')),initial.mainState.readme);assert.equal(sha(path.join(root,'README.md')),initial.worktreeReadme);assert.equal(git(initial.main,'status','--short'),initial.mainState.status);assert.equal(git(initial.main,'rev-parse','HEAD'),initial.mainState.head);assert.equal(git(root,'branch','--show-current'),initial.branch);assert.ok(!fs.existsSync(path.join(initial.main,'.r3')));assert.ok(!fs.existsSync(path.join(root,'.r3')));
const archives=[];
for(const file of changed){
 const before=initial.files.find(f=>f.file===file).sha256,dest=path.join(rt,'originals',file);fs.mkdirSync(path.dirname(dest),{recursive:true});
 if(!fs.existsSync(dest)){
  const source=file.endsWith('text-geometry.ts')?path.join(rt,'before/s/f/tests/e2e/support/text-geometry.ts'):path.resolve(initial.main,'../controle-financeiro-runtimes/preparacao-adocao/revalidacao-rr3-01-02/s/f/tests/e2e/playwright.text-geometry.config.ts');
  assert.equal(sha(source),before);fs.copyFileSync(source,dest,fs.constants.COPYFILE_EXCL);
 }
 assert.equal(sha(dest),before);archives.push({file,before,after:sha(path.join(root,file)),archivedBefore:dest});
}
const result={at:new Date(),phase,root,base:initial.base,head:git(root,'rev-parse','HEAD'),branch:initial.branch,status:git(root,'status','--short'),main:initial.mainState,worktreeReadme:initial.worktreeReadme,trackedInitial:initial.files.length,unchangedInitialExceptAuthorized:initial.files.length-changed.length,protected97:true,manifest36:true,originals7:true,manifest1053:{...initial.manifest1053,unchangedExceptAuthorized:1051},authorizedChanges:archives,independentProbesPreserved:true,r3Absent:true,worktrees:git(root,'worktree','list','--porcelain')};
fs.writeFileSync(path.join(rt,phase+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
