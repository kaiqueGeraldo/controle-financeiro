import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {requireNewRuntime} from '../revisao-expanded-plataformas-docker/runtime-path.mjs';

const runtime=process.env.CF_EXPANDED_LOCAL_RUNTIME;
assert.ok(runtime&&path.isAbsolute(runtime),'CF_EXPANDED_LOCAL_RUNTIME required');
const fixture=fs.mkdtempSync(path.join(runtime,'path-controls-'));
const allowed=path.join(fixture,'allowed');fs.mkdirSync(allowed);
const root=path.resolve(import.meta.dirname,'../../..');
const preparer=path.join(root,'tasks/evidencias/revisao-expanded-plataformas-docker/preparar-proxima.mjs');
const runPreparation=(name,destination)=>{const result=spawnSync(process.execPath,[preparer,destination],{cwd:root,encoding:'utf8',windowsHide:true});fs.writeFileSync(path.join(fixture,name+'.stdout.log'),result.stdout??'',{flag:'wx'});fs.writeFileSync(path.join(fixture,name+'.stderr.log'),result.stderr??'',{flag:'wx'});return result;};

test('accepts expected expanded-local and historical names as absolute new destinations',()=>{
 for(const name of ['expanded-local-20261103-02','revisao-plataformas-docker-test'])assert.equal(requireNewRuntime(path.join(allowed,name),allowed),path.join(fs.realpathSync.native(allowed),name));
});
test('rejects outside root, root itself and prefix lookalike',()=>{
 for(const destination of [path.join(fixture,'expanded-local-outside'),allowed,path.join(allowed+'-other','expanded-local-outside')])assert.throws(()=>requireNewRuntime(destination,allowed),/outside/);
});
test('rejects traversal, relative paths and unrelated basenames',()=>{
 assert.throws(()=>requireNewRuntime(allowed+path.sep+'child'+path.sep+'..'+path.sep+'expanded-local-x',allowed),/traversal/);
 assert.throws(()=>requireNewRuntime('expanded-local-x',allowed),/Absolute/);
 assert.throws(()=>requireNewRuntime(path.join(allowed,'arbitrary-name'),allowed),/name/);
});
test('protects an existing destination and its bytes',()=>{
 const existing=path.join(allowed,'expanded-local-existing');fs.mkdirSync(existing);fs.writeFileSync(path.join(existing,'identity'),'keep');
 assert.throws(()=>requireNewRuntime(existing,allowed),/must be new/);assert.equal(fs.readFileSync(path.join(existing,'identity'),'utf8'),'keep');
});
test('rejects junctions to both external and internal directories without traversing them',()=>{
 const external=path.join(fixture,'external');fs.mkdirSync(external);
 const internal=path.join(allowed,'internal');fs.mkdirSync(internal);
 for(const [name,target] of [['external-link',external],['internal-link',internal]]){
  const link=path.join(allowed,name);fs.symlinkSync(target,link,process.platform==='win32'?'junction':'dir');
  try{assert.throws(()=>requireNewRuntime(path.join(link,'expanded-local-x'),allowed),/link or junction/);}finally{fs.unlinkSync(link);}
 }
});
test('real preparer rejects a destination outside the authorized root',()=>{
 const outside=path.resolve(root,'../../expanded-local-refused-operational-control');assert.equal(fs.existsSync(outside),false);
 const result=runPreparation('outside',outside);assert.notEqual(result.status,0);assert.equal(fs.existsSync(outside),false);assert.match(result.stderr,/outside authorized root/);
});
test('real preparer protects an existing runtime',()=>{
 const existing=path.join(runtime,'expanded-local-existing-control');fs.mkdirSync(existing);fs.writeFileSync(path.join(existing,'identity'),'keep');
 const result=runPreparation('existing',existing);assert.notEqual(result.status,0);assert.equal(fs.readFileSync(path.join(existing,'identity'),'utf8'),'keep');assert.match(result.stderr,/must be new/);
});
test('real preparer exports all expected current input files and a valid manifest',async()=>{
 const destination=path.join(runtime,'expanded-local-directed-control');
 const result=runPreparation('expected',destination);assert.equal(result.status,0,result.stderr);
 const candidate=result.stdout.trim();assert.equal(candidate,path.join(destination,'candidate'));
 const {sourceFor}=await import(pathToFileURL(path.join(root,'.github/scripts/source.mjs')));
 const source=sourceFor(candidate);assert.equal(source.files.length,860);assert.equal(source.digest,'d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660');
 assert.equal(source.reviewedInputCommit,'0aac7ccd25934ec022939464486da9fb28610279');
 assert.ok(source.executionScripts.some(f=>f.path.endsWith('/runtime-path.mjs')));
 assert.ok(fs.existsSync(path.join(candidate,'.github/scripts/ci.mjs')));
 assert.equal(fs.existsSync(path.join(candidate,'controle-financeiro-backend/target')),false);
});
