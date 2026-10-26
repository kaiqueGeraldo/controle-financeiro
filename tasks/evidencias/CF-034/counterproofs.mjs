import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {hash,snapshot,sourceFor,writeJson} from '../../../.github/scripts/source.mjs';

const [mode,rootArg,outputArg]=process.argv.slice(2);
if(!['package','lint','date'].includes(mode)||!rootArg||!outputArg)throw new Error('mode(package|lint|date), isolated checkout, NEW output required');
const root=path.resolve(rootArg),output=path.resolve(outputArg);
if(!root.includes(`${path.sep}controle-financeiro-runtimes${path.sep}CF-034${path.sep}`)||fs.existsSync(path.join(root,'.git'))||fs.existsSync(output))throw new Error('Only a disposable CF034 export and new evidence directory allowed');
fs.mkdirSync(output,{recursive:true});
const source=sourceFor(root),descriptor=path.join(root,'.ci-source.json'),descriptorBytes=fs.readFileSync(descriptor);
const jarReceipt=mode==='package'?JSON.parse(fs.readFileSync(path.join(root,'.ci-backend.json'))):null;
const relative=mode==='package'?`controle-financeiro-backend/target/${jarReceipt.jar}`:'controle-financeiro-frontend/src/utils/date.ts';
const target=path.join(root,relative),original=fs.readFileSync(target),before=hash(original);
let gate,control;
try{
  if(mode==='package'){const changed=Buffer.from(original);changed[10]^=1;fs.writeFileSync(target,changed);}
  else{
    let text=original.toString('utf8');
    if(mode==='lint')text+='\nexport const cf034LintProbe: any = 1;\n';
    else{
      const start=text.indexOf('export function localDateString('),end=text.indexOf('\n}',start)+2;
      if(start<0||end<start)throw new Error('Unique calendar mutation anchor required');
      text=text.slice(0,start)+'export function localDateString(date: Date = new Date()): string { return date.toISOString().slice(0,10); }'+text.slice(end);
    }
    fs.writeFileSync(target,text);
    snapshot(root,{...source,counterproof:{mode,approvedSourceDigest:source.digest,mutatedPath:relative}});
  }
  const child=spawnSync(process.execPath,[path.join(root,'.github/scripts/ci.mjs'),mode==='package'?'package':'all',root,path.join(output,'gate')],{env:process.env,encoding:'utf8',windowsHide:true,maxBuffer:1024*1024});
  fs.writeFileSync(path.join(output,'launcher.log'),String(child.stdout??'')+String(child.stderr??''));
  gate={exit:child.status,result:JSON.parse(fs.readFileSync(path.join(output,'gate/result.json')))};
  const expected=mode==='package'?'Package changed':mode==='lint'?'lint failed':'unit failed';
  if(child.status===0||gate.result.status!=='failed'||!gate.result.error.includes(expected))throw new Error(`Not the intended failure: ${gate.result.error}`);
  if(gate.result.artifact)throw new Error('A failed required gate approved an artifact');
  if(mode!=='package'&&gate.result.steps.some(s=>['backend','e2e'].includes(s.name)))throw new Error('Downstream gate ran after failed frontend');
}finally{
  fs.writeFileSync(target,original);fs.writeFileSync(descriptor,descriptorBytes);
  const after=hash(fs.readFileSync(target));
  writeJson(path.join(output,'counterproof.json'),{mode,originCommit:source.commit,originDigest:source.digest,path:relative,before,after,restored:before===after,gate,control,remoteRunner:'not exercised'});
  if(after!==before)throw new Error('Restoration mismatch');
}
sourceFor(root);
console.log(`Expected ${mode} failure propagated; source/artifact restored by SHA256`);
