import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const writeJson=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
function walk(root,relative=''){
  return fs.readdirSync(path.join(root,relative),{withFileTypes:true}).flatMap(entry=>{
    const p=path.posix.join(relative,entry.name);
    if(/(^|\/)(node_modules|target|\.next|\.git|test-results|playwright-report)(\/|$)/.test(p)||entry.name==='.ci-source.json'||entry.name==='next-env.d.ts'||entry.name.endsWith('.tsbuildinfo')||/^\.env(?:\.|$)/.test(entry.name))return [];
    if(entry.isSymbolicLink())throw new Error(`Source symlink is not allowed: ${p}`);
    return entry.isDirectory()?walk(root,p):[{path:p,sha256:hash(fs.readFileSync(path.join(root,p)))}];
  });
}
function sourceFiles(root){
  const inputs=['.github','controle-financeiro-backend','controle-financeiro-frontend','tasks/evidencias/CF-028'];
  return inputs.flatMap(p=>fs.existsSync(path.join(root,p))?walk(root,p):[]).sort((a,b)=>a.path.localeCompare(b.path,'en'));
}
export function snapshot(root,metadata){
  const files=sourceFiles(root);
  const source={...metadata,files,digest:hash(JSON.stringify(files))};
  writeJson(path.join(root,'.ci-source.json'),source);return source;
}
export function sourceFor(root){
  const record=path.join(root,'.ci-source.json');
  if(!fs.existsSync(record)){
    if(process.env.GITHUB_ACTIONS!=='true')throw new Error('Run prepare.mjs first; local gates only use an isolated export');
    const changes=execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim();
    if(changes)throw new Error('CI checkout contains unrecorded changes');
    snapshot(root,{commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),originalTreeChanges:[],export:'GitHub clean checkout'});
  }
  const source=JSON.parse(fs.readFileSync(record));
  if(!source.files.length||hash(JSON.stringify(source.files))!==source.digest)throw new Error('Invalid source manifest');
  for(const file of source.files)if(hash(fs.readFileSync(path.join(root,file.path)))!==file.sha256)throw new Error(`Source changed: ${file.path}`);
  if(hash(JSON.stringify(sourceFiles(root)))!==source.digest)throw new Error('Source file set changed after the recorded snapshot');
  return source;
}
