import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {snapshot,writeJson} from './source.mjs';

const destination=path.resolve(process.argv[2]??'');
const repo=process.cwd();
const allowed=path.resolve(repo,'../controle-financeiro-runtimes/CF-034')+path.sep;
if(!destination.startsWith(allowed)||fs.existsSync(destination))throw new Error('Choose a NEW execution under ../controle-financeiro-runtimes/CF-034/');
fs.mkdirSync(destination,{recursive:true});
const list=execFileSync('git',['-c','core.quotepath=false','ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const selected=list.filter(p=>fs.existsSync(p)).filter(p=>p.startsWith('.github/')||p.startsWith('controle-financeiro-backend/')||p.startsWith('controle-financeiro-frontend/')||p==='tasks/evidencias/CF-028/examples.json');
for(const file of selected){
  if(/(^|\/)(node_modules|target|\.next|\.git)(\/|$)|(^|\/)\.env(?:\.|$)/.test(file))throw new Error(`Forbidden export input: ${file}`);
  const target=path.join(destination,'checkout',file);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);
}
const checkout=path.join(destination,'checkout');
const metadata={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),originalTreeChanges:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().split('\n'),excludedPreexistingReadme:true,export:'tracked inputs plus explicit untracked CI sources; no environment files, dependencies or caches'};
snapshot(checkout,metadata);
writeJson(path.join(destination,'preparation.json'),{...metadata,checkout});
console.log(checkout);
