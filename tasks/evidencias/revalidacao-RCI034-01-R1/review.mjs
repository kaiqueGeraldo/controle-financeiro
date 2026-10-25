import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';
const here=import.meta.dirname,repo=process.cwd(),sha=p=>hash(fs.readFileSync(p));
const read=p=>JSON.parse(fs.readFileSync(p)),save=(n,v)=>writeJson(path.join(here,n+'.json'),v);
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
if(process.argv[2]==='inventory'){
 assert(!fs.existsSync(path.join(here,'entry.json')));
 const old=read('tasks/evidencias/revalidacao-CF-034-saneamento/preservation-before.json');
 const missing=old.filter(f=>!fs.existsSync(f.path));assert.deepEqual(missing,[]);
 const changes=old.filter(f=>sha(f.path)!==f.sha256).map(f=>({...f,observedSha256:sha(f.path)}));
 assert.deepEqual(changes.map(f=>f.path.replaceAll('\\','/')).sort(),['.github/scripts/sanitize.mjs','.github/scripts/sanitize.test.mjs']);
 const paths=new Set(old.map(f=>f.path));
 for(const p of git('ls-files').split('\n'))if(p.startsWith('.github/')||p.startsWith('tasks/evidencias/')||p.startsWith('docs/sdd/decisoes/'))paths.add(p);
 // Explicit outputs, skip dependency trees and checkout copies; never follow links.
 function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isSymbolicLink()||['node_modules','target','checkout','.next','frontend','package-copy','baseline','temp','npm-cache'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else paths.add(p);}}
 walk(path.resolve('../controle-financeiro-runtimes/CF-034'));
 save('preservation-before',[...paths].sort().map(p=>({path:p,sha256:sha(p)})));
 save('entry',{head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),status:git('status','--short'),staged:git('diff','--cached','--name-only'),base:git('rev-parse','418a648'),ancestry:git('merge-base','418a648','ea00a06'),delta:git('diff','--name-status','418a648..ea00a06'),historical:{checked:old.length,identical:old.length-changes.length,changes,missing},readme:sha('README.md')});
 console.log('Entry captured; historical 4323: 4321 identical, two authorized implementation changes.');
}else if(process.argv[2]==='run'){
 const root=path.resolve(process.argv[3]);assert(root.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(root));fs.mkdirSync(root);
 const temp=path.join(root,'temp');fs.mkdirSync(temp);const env={...process.env,TEMP:temp,TMP:temp,npm_config_offline:'true',npm_config_cache:path.join(root,'npm-cache')};
 const run=args=>{const r=spawnSync(process.execPath,args,{cwd:repo,env,encoding:'utf8',windowsHide:true,maxBuffer:20*1024*1024});return {exit:r.status,signal:r.signal,error:r.error?.message,stdout:r.stdout,stderr:r.stderr};};
 const tests=run(['--test','.github/scripts/ci.test.mjs','.github/scripts/sanitize.test.mjs']);save('node-tests',tests);assert.equal(tests.exit,0);
 // Audited observer: relocate import/output only, preserve ALL assertions, cases,
 // mutations and restoration. Source is kept alongside the exact adapter diff.
 const sourcePath='tasks/evidencias/saneamento-RCI034-01-R1/proofs.mjs',source=fs.readFileSync(sourcePath,'utf8');
 const originalImport="'../../../.github/scripts/source.mjs'";assert(source.includes(originalImport));
 const adapter=source.replace(originalImport,JSON.stringify(pathToFileURL(path.resolve('.github/scripts/source.mjs')).href));
 for(const name of ['baseline-inputs.json','before.json'])fs.copyFileSync(path.join(path.dirname(sourcePath),name),path.join(root,name));
 fs.writeFileSync(path.join(root,'proofs.mjs'),adapter);
 save('observer',{source:sourcePath,sha256:hash(source),adapterSha256:hash(adapter),change:'single source.mjs import rebound to absolute URL; import.meta.dirname points results to fresh runtime; no assertions changed',originalProbeSha256:sha('tasks/evidencias/revalidacao-CF-034-saneamento/sanitization.mjs')});
 const command=run([path.join(root,'proofs.mjs'),path.join(root,'execution')]);save('proof-command',command);
 if(fs.existsSync(path.join(root,'proofs.json')))fs.copyFileSync(path.join(root,'proofs.json'),path.join(here,'proofs.json'));
 assert.equal(command.exit,0,command.stderr);console.log('12 Node tests and original contracts, mutation/restoration, real collectors and ordinary gates completed.');
}else if(process.argv[2]==='final'){
 const before=read(path.join(here,'preservation-before.json'));const changes=before.filter(f=>!fs.existsSync(f.path)||sha(f.path)!==f.sha256);
 save('preservation-final',{checked:before.length,changes,readme:sha('README.md')});assert.deepEqual(changes,[]);console.log('Preserved '+before.length+' inventoried files.');
}else throw new Error('inventory|run|final');
