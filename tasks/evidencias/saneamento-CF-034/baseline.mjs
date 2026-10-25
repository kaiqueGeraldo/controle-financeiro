import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const runtime=path.resolve(process.argv[2]);
assert(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));
assert(!fs.existsSync(runtime));fs.mkdirSync(runtime,{recursive:true});
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const here=import.meta.dirname;
const inventory=JSON.parse(fs.readFileSync('tasks/evidencias/revisao-CF-034/preservation-before.json'));
const changed=inventory.filter(f=>!fs.existsSync(f.path)||sha(f.path)!==f.sha256);
assert.equal(inventory.length,3165);assert.deepEqual(changed,[]);
const originals=['review.mjs','cancellation.mjs','supplement.mjs'];
const hashes=originals.map(name=>({path:'tasks/evidencias/revisao-CF-034/'+name,sha256:sha('tasks/evidencias/revisao-CF-034/'+name)}));
fs.writeFileSync(path.join(here,'baseline-inputs.json'),JSON.stringify({at:new Date().toISOString(),runtime,inventoryFiles:inventory.length,changed,readmeSha256:sha('README.md'),probes:hashes},null,2)+'\n');
for(const name of originals.slice(0,2)){
  let text=fs.readFileSync('tasks/evidencias/revisao-CF-034/'+name,'utf8');
  text=text.replaceAll(/(['"])\.\.\/\.\.\/\.\.\/(\.github\/scripts\/[^'"]+)\1/g,(_,quote,relative)=>quote+pathToFileURL(path.resolve(relative)).href+quote);
  // Relocate outputs only. Inputs, sentinel lifetimes, assertions and commands remain original.
  if(name==='review.mjs')text=text.replace("here=path.join(repo,'tasks/evidencias/revisao-CF-034')",'here='+JSON.stringify(runtime));
  else text=text.replace("write('tasks/evidencias/revisao-CF-034/cancellation.json',result)",'write('+JSON.stringify(path.join(runtime,'cancellation.json'))+',result)');
  const file=path.join(runtime,name);fs.writeFileSync(file,text);
  const args=name==='review.mjs'?['probes',path.join(runtime,'probes')]:[path.join(runtime,'cancel')];
  const result=spawnSync(process.execPath,[file,...args],{encoding:'utf8',windowsHide:true,maxBuffer:10*1024*1024});
  fs.writeFileSync(path.join(runtime,name+'.execution.json'),JSON.stringify({exit:result.status,signal:result.signal,stdout:result.stdout,stderr:result.stderr,copySha256:sha(file)},null,2)+'\n');
  assert.equal(result.status,0,result.stderr);
  console.log(name+': original assertions reproduced');
}
for(const name of ['probes.json','cancellation.json'])fs.copyFileSync(path.join(runtime,name),path.join(here,'before-'+name));
