import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';

const here=import.meta.dirname,repo=process.cwd();
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024}).trim();
const sha=file=>hash(fs.readFileSync(file));
const beforeFile=path.join(here,'preservation-before.json');
if(process.argv[2]==='initial'){
  assert(!fs.existsSync(beforeFile),'Initial preservation must never be overwritten');
  const previous=JSON.parse(fs.readFileSync('tasks/evidencias/revalidacao-RCI034-01-R1/preservation-before.json'));
  const missing=previous.filter(f=>!fs.existsSync(f.path));
  assert.deepEqual(missing,[],'A historical input is missing; investigate before publication');
  const paths=new Set(previous.map(f=>f.path));
  for(const file of git('ls-files','-z').split('\0').filter(Boolean))paths.add(file);
  const files=[...paths].sort().map(file=>({path:file,sha256:sha(file)}));
  writeJson(beforeFile,{at:new Date().toISOString(),files});
  const base='272001f7b4c39aebd18bdcd856109f9a0f6c1213';
  const head=git('rev-parse','HEAD');
  const changed=git('diff','--name-only','-z',`${base}..${head}`).split('\0').filter(Boolean);
  const tree=git('ls-tree','-rlz',head).split('\0').filter(Boolean).map(line=>{
    const [metadata,file]=line.split('\t');const parts=metadata.trim().split(/\s+/);
    return {path:file,bytes:Number(parts[3]),blob:parts[2]};
  }).filter(f=>changed.includes(f.path));
  const forbidden=changed.filter(file=>file==='README.md'||/(^|\/)(node_modules|target|\.next|\.git|runtimes)(\/|$)|(^|\/)\.env(?:\.|$)|\.(jar|zip|exe|p12|pfx|pem|key)$/i.test(file));
  const readme=sha('README.md');
  assert.equal(readme,'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
  assert.deepEqual(forbidden,[]);
  writeJson(path.join(here,'git-initial.json'),{
    at:new Date().toISOString(),branch:git('branch','--show-current'),head,
    approvedHead:'4d20fb00f929f70cd2fe30b7a3d9aab004526547',base,
    remote:git('remote','-v'),status:git('status','--short'),staged:git('diff','--cached','--name-status'),
    ancestry:git('merge-base',base,head),localTrackingDivergence:git('rev-list','--left-right','--count','origin/main...HEAD'),
    commits:git('log','--format=%H %s',`${base}..${head}`).split('\n'),
    publication:{files:tree.length,totalBytes:tree.reduce((sum,f)=>sum+f.bytes,0),largeFiles:tree.filter(f=>f.bytes>1024*1024),forbidden,changedPaths:changed,secretContentInspection:'not certified by path inventory; historical synthetic probes must not be mistaken for real credentials'},
    readme:{sha256:readme,excluded:true},preservedFiles:files.length,
    priorInventory:{files:previous.length,changedSincePriorSnapshot:previous.filter(f=>sha(f.path)!==f.sha256).map(f=>f.path),note:'prior snapshot predates accepted documentary commits; this execution preserves observed initial bytes'},
  });
  console.log(JSON.stringify({head,files:tree.length,bytes:tree.reduce((sum,f)=>sum+f.bytes,0),largeFiles:tree.filter(f=>f.bytes>1024*1024),forbidden,preserved:files.length,readme}));
}else if(process.argv[2]==='final'){
  const before=JSON.parse(fs.readFileSync(beforeFile));
  const changes=before.files.filter(f=>!fs.existsSync(f.path)||sha(f.path)!==f.sha256).map(f=>({path:f.path,before:f.sha256,after:fs.existsSync(f.path)?sha(f.path):null}));
  const allowed=new Set(['tasks/README.md','tasks/05-release/CF-034-gates-ci.md','.github/scripts/ci.mjs','.github/scripts/publish-evidence.mjs']);
  const unexpected=changes.filter(f=>!allowed.has(f.path));
  writeJson(path.join(here,'preservation-final.json'),{at:new Date().toISOString(),checked:before.files.length,changes,unexpected,readme:sha('README.md'),head:git('rev-parse','HEAD'),status:git('status','--short'),staged:git('diff','--cached','--name-status')});
  assert.deepEqual(unexpected,[]);
  assert.equal(sha('README.md'),'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
  console.log(JSON.stringify({checked:before.files.length,authorizedChanges:changes.length,unexpected:unexpected.length,readme:sha('README.md')}));
}else throw new Error('initial|final');
