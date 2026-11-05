import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..'),runtime=path.resolve(process.argv[2]??'');
assert.match(path.basename(runtime),/^excecao-zoom-expanded-[a-z0-9-]+$/);
const label=process.argv[3]??'contracts';assert.match(label,/^contracts(?:-[0-9]+)?$/);
const directory=path.join(runtime,label);fs.mkdirSync(directory);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function run(file,args,cwd){const r=spawnSync(process.execPath,args,{cwd,encoding:'utf8',windowsHide:true});fs.writeFileSync(file,(r.stdout??'')+(r.stderr??''),{flag:'wx'});return r;}
const original=fs.readFileSync(path.join(root,'.github/scripts/zoom-coverage.mjs'));
const baseline=run(path.join(directory,'baseline.log'),['--test',...['ci','suites','sanitize','required','zoom-coverage'].map(x=>'.github/scripts/'+x+'.test.mjs')],root);assert.equal(baseline.status,0);
const mutations=[
 ['third-exclusion',s=>s.replace('c=a.filter(x=>!blocked.has(identity(x)))','c=a.filter(x=>!blocked.has(identity(x))).slice(1)').replace("assert.deepEqual([...b,...c].map(identity).sort(),ids,'A must equal B union C');",'')],
 ['missing-exception',s=>s.replace('return {version:1,decision,label,','return {version:1,label,')],
 ['generic-skip',s=>s.replace("assert.equal(x.test.status,'expected','Unexpected skip/failure/flaky');",'').replace("assert.equal(x.test.results[0].status,'passed','Unexpected skip/error/failure');",'').replace("for(const k of ['unexpected','skipped','flaky'])", "for(const k of ['unexpected','flaky'])")],
 ['omitted-required',s=>s.replace("assert.deepEqual(identities(actual),identities(manifest.C),'Mandatory identity missing, unknown, or extra exclusion');",'')],
];
const results=[];
for(const [name,mutate] of mutations){
 const target=path.join(directory,name);fs.mkdirSync(target);for(const f of ['source.mjs','zoom-coverage.mjs','zoom-coverage.test.mjs'])fs.copyFileSync(path.join(root,'.github/scripts',f),path.join(target,f));
 const file=path.join(target,'zoom-coverage.mjs'),modified=mutate(original.toString());assert.notEqual(modified,original.toString());fs.writeFileSync(file,modified);fs.writeFileSync(path.join(target,'mutation.mjs.txt'),modified);
 const r=run(path.join(target,'mutant.log'),['--test','zoom-coverage.test.mjs'],target);assert.notEqual(r.status,0,'Mutation survived: '+name);assert.doesNotMatch((r.stdout??'')+(r.stderr??''),/SyntaxError|ERR_MODULE_NOT_FOUND/);
 fs.writeFileSync(file,original);assert.equal(hash(fs.readFileSync(file)),hash(original));const control=run(path.join(target,'restored.log'),['--test','zoom-coverage.test.mjs'],target);assert.equal(control.status,0);
 results.push({name,mutantExit:r.status,restoredExit:control.status,restoredSha256:hash(fs.readFileSync(file))});
}
fs.writeFileSync(path.join(directory,'counterproofs.json'),JSON.stringify({originalSha256:hash(original),results},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(results));
