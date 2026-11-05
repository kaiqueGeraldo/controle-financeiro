import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {physicalPath} from './paths.mjs';
import {freshOutput} from './ci.mjs';

test('physical paths resolve aliases before new outputs and preserve the outside-source guard',()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'physical-root-')),root=path.join(parent,'source'),alias=path.join(parent,'alias');fs.mkdirSync(root);fs.symlinkSync(root,alias,process.platform==='win32'?'junction':'dir');
 try{
  assert.equal(physicalPath(alias),fs.realpathSync.native(root));
  assert.equal(physicalPath(path.join(alias,'new','output')),path.join(fs.realpathSync.native(root),'new','output'));
  assert.throws(()=>freshOutput(root,path.join(alias,'reports')),/outside/);
  assert.throws(()=>freshOutput(alias,path.join(root,'reports')),/outside/);
  const out=freshOutput(alias,path.join(parent,'reports'));assert.equal(out,path.join(fs.realpathSync.native(parent),'reports'));fs.rmdirSync(out);
 }finally{if(process.platform==='win32')fs.rmdirSync(alias);else fs.unlinkSync(alias);fs.rmdirSync(root);fs.rmdirSync(parent);}
});
