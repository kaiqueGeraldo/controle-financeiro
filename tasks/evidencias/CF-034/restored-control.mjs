import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {sourceFor,writeJson} from '../../../.github/scripts/source.mjs';
const [rootArg,outArg]=process.argv.slice(2);
if(!rootArg||!outArg)throw new Error('isolated root and new output required');
const root=path.resolve(rootArg),out=path.resolve(outArg),source=sourceFor(root);
if(fs.existsSync(path.join(root,'.git'))||fs.existsSync(out))throw new Error('Only an isolated export and new output');
fs.mkdirSync(out,{recursive:true});
const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const steps=[];
for(const [name,args] of [['lint',['run','lint','--','--max-warnings=0']],['unit',['test']]]){
  const child=spawnSync(process.execPath,[npm,...args],{cwd:path.join(root,'controle-financeiro-frontend'),env:process.env,encoding:'utf8',windowsHide:true,maxBuffer:1024*1024});
  const log=String(child.stdout??'')+String(child.stderr??'');fs.writeFileSync(path.join(out,name+'.log'),log);
  steps.push({name,command:['npm',...args],exit:child.status});
  if(child.status!==0)throw new Error(`Restored ${name} failed`);
}
sourceFor(root);
const log=fs.readFileSync(path.join(out,'unit.log'),'utf8');
const runs=[...log.matchAll(/# tests (\d+)/g)].map(m=>Number(m[1]));
if(runs.length!==3||runs.some(n=>n!==6)||[...log.matchAll(/# (?:fail|skipped|todo|cancelled) (\d+)/g)].some(m=>Number(m[1])!==0))throw new Error('Restored temporal controls incomplete');
writeJson(path.join(out,'control.json'),{commit:source.commit,digest:source.digest,status:'passed',steps,tests:18,timezones:3,sourceRestored:true});
console.log('Restored lint and 18 temporal controls passed');
