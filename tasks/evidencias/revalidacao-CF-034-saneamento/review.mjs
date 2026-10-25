import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {hash,writeJson,snapshot} from '../../../.github/scripts/source.mjs';
const repo=process.cwd(),here=import.meta.dirname;
const read=p=>JSON.parse(fs.readFileSync(p));
const digest=p=>hash(fs.readFileSync(p));
const runtime=path.resolve(process.argv[3]??'../controle-financeiro-runtimes/CF-034/v01');
const run=(args,env={})=>{const c=spawnSync(process.execPath,args,{cwd:repo,env:{...process.env,...env},encoding:'utf8',windowsHide:true,maxBuffer:20*1024*1024});return {exit:c.status,signal:c.signal,error:c.error?.message,stdout:c.stdout,stderr:c.stderr};};
const save=(name,v)=>writeJson(path.join(here,name+'.json'),v);
if(process.argv[2]==='inventory'){
 assert(!fs.existsSync(path.join(here,'inventory.json')));
 const previous=read('tasks/evidencias/revisao-CF-034/preservation-before.json');
 const missing=previous.filter(f=>!fs.existsSync(f.path)),changes=previous.filter(f=>fs.existsSync(f.path)&&digest(f.path)!==f.sha256).map(f=>({...f,currentSha256:digest(f.path)}));
 assert.equal(missing.length,0);assert.equal(changes.length,4);
 const allowed=['.github/scripts/ci.mjs','.github/scripts/publish-evidence.mjs','.github/workflows/ci.yml','tasks/evidencias/CF-034/collect.mjs'];
 assert.deepEqual(changes.map(f=>f.path.replaceAll('\\','/')).sort(),allowed.sort());
 const baseline=read('tasks/evidencias/saneamento-CF-034/baseline-inputs.json');
 for(const p of baseline.probes)assert.equal(digest(p.path),p.sha256);
 const paths=new Set(previous.map(f=>f.path));
 const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
 for(const p of tracked)if(p.startsWith('.github/')||p.startsWith('tasks/evidencias/revisao-CF-034/')||p.startsWith('tasks/evidencias/saneamento-CF-034/'))paths.add(p);
 function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isSymbolicLink()||['node_modules','target','checkout','frontend','.next'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else paths.add(p);}}
 for(const d of fs.readdirSync(path.resolve('../controle-financeiro-runtimes/CF-034'),{withFileTypes:true}))if(d.isDirectory())walk(path.resolve('../controle-financeiro-runtimes/CF-034',d.name));
 const protectedFiles=[...paths].sort().map(p=>({path:p,sha256:digest(p)}));
 save('preservation-before',protectedFiles);
 save('inventory',{head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),historical:{total:previous.length,identical:previous.length-changes.length,changes,missing},originalProbes:baseline.probes,protected:protectedFiles.length,readme:digest('README.md')});
 console.log('Inventory verified: 3165 historical paths, 3161 identical, four authorized implementation changes, no missing files.');
}else if(process.argv[2]==='run'){
 assert(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(runtime));fs.mkdirSync(runtime);
 const temp=path.join(runtime,'temp');fs.mkdirSync(temp);
 const env={TEMP:temp,TMP:temp,npm_config_offline:'true',npm_config_cache:path.join(runtime,'npm-cache')};
 const tests=run(['--test','.github/scripts/ci.test.mjs','.github/scripts/sanitize.test.mjs'],env);save('eight-tests',tests);assert.equal(tests.exit,0);
 // Relocate existing proof observers, preserving their assertions and historical files.
 const old=path.resolve('../controle-financeiro-runtimes/CF-034/11/checkout'),base=path.join(runtime,'baseline'),copy=path.join(base,'probes/checkout');
 const source=read(path.join(old,'.ci-source.json'));
 for(const f of source.files){const dest=path.join(copy,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(old,f.path),dest);}
 for(const n of ['source','frontend','backend','e2e'])fs.copyFileSync(path.join(old,`.ci-${n}.json`),path.join(copy,`.ci-${n}.json`));
 fs.mkdirSync(path.join(copy,'controle-financeiro-backend/target'));fs.copyFileSync(path.join(old,'controle-financeiro-backend/target/api-0.0.1.jar'),path.join(copy,'controle-financeiro-backend/target/api-0.0.1.jar'));
 const san=path.join(base,'probes/sanitization');fs.mkdirSync(san,{recursive:true});for(const f of ['backend.log','result.json'])fs.copyFileSync(path.resolve('../controle-financeiro-runtimes/CF-034/rv01/sanitization',f),path.join(san,f));
 const transformations=[];
 for(const name of ['proofs','supplement']){
  const file=`tasks/evidencias/saneamento-CF-034/${name}.mjs`,original=fs.readFileSync(file,'utf8');
  let text=original.replaceAll(/(['"])\.\.\/\.\.\/\.\.\/(\.github\/scripts\/[^'"]+)\1/g,(_,q,f)=>q+pathToFileURL(path.resolve(f)).href+q);
  if(name==='proofs'){const anchor="const baseline=path.resolve('../controle-financeiro-runtimes/CF-034/s01');";assert(text.includes(anchor));text=text.replace(anchor,'const baseline='+JSON.stringify(base)+';');}
  const executable=path.join(runtime,name+'.mjs');fs.writeFileSync(executable,text);
  transformations.push({file,originalSha256:hash(original),relocatedSha256:hash(text),changes:'imports to absolute module URLs; proofs baseline redirected to fresh private copy; no assertion/timeouts changed'});
  const output=run([executable,path.join(runtime,name+'-execution')],env);save('rerun-'+name,output);
  for(const suffix of [name+'.json'])if(fs.existsSync(path.join(runtime,suffix)))fs.copyFileSync(path.join(runtime,suffix),path.join(here,'rerun-'+suffix));
  assert.equal(output.exit,0,output.stderr);
 }
 save('relocations',transformations);
 console.log('Eight tests and relocated proof/mutation/supplement observers completed; originals untouched.');
}else if(process.argv[2]==='final'){
 const before=read(path.join(here,'preservation-before.json'));const changed=before.filter(f=>!fs.existsSync(f.path)||digest(f.path)!==f.sha256);
 save('preservation-final',{checked:before.length,changed,readme:digest('README.md')});assert.deepEqual(changed,[]);console.log('All entry inventory bytes preserved: '+before.length);
}else throw new Error('inventory|run|final');
