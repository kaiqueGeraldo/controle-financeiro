import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {backendSelection,historicalBrowserHarnesses} from './suites.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const windows='com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest';
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
// Independent identity oracle: every concrete test source, before any OS filter.
function mandatory(suite){return walk(path.join(root,'controle-financeiro-backend/src/test/java')).filter(f=>/Tests?\.java$/.test(f)).flatMap(file=>{
 const text=fs.readFileSync(file,'utf8'),name=path.basename(file,'.java');
 if(/\babstract\s+class\b/.test(text)||(suite==='smoke'&&historicalBrowserHarnesses.includes(name)))return [];
 return [`${text.match(/package\s+([^;]+);/)[1]}.${name}`];
}).sort();}
test('Linux plus mandatory Windows job preserve every original class identity in both suites',()=>{
 for(const suite of ['smoke','expanded']){
  const linux=backendSelection(root,suite,'linux'),native=backendSelection(root,suite,'win32','platform-only');
  assert.deepEqual(native.selected,[windows]);
  assert.deepEqual(linux.selected,mandatory(suite).filter(name=>name!==windows));
  assert.deepEqual([...linux.selected,...native.selected].sort(),mandatory(suite));
  assert.deepEqual(linux.routed.map(r=>r.name),[windows]);
  assert.deepEqual(backendSelection(root,suite,'win32').selected,mandatory(suite));
 }
});
test('expanded keeps every historical harness and every common smoke test',()=>{
 const smoke=backendSelection(root,'smoke','linux'),expanded=backendSelection(root,'expanded','linux');
 assert.deepEqual(smoke.deferred.map(d=>d.name).sort(),expanded.selected.filter(n=>historicalBrowserHarnesses.includes(n.split('.').at(-1))).sort());
 assert.deepEqual(expanded.selected.filter(n=>!smoke.selected.includes(n)).sort(),smoke.deferred.map(d=>d.name).sort());
 assert.deepEqual(expanded.deferred,[]);
});
test('unknown/missing target JVM platform and unknown suites/scopes fail closed',()=>{
 for(const platform of [undefined,'darwin','windows','Linux',''])assert.throws(()=>backendSelection(root,'smoke',platform),/Unknown target JVM platform/);
 assert.throws(()=>backendSelection(root,'typo','linux'),/Unknown backend suite/);
 assert.throws(()=>backendSelection(root,'smoke','linux','typo'),/Unknown backend scope/);
});
function fixture(t,sources){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cpa01-selection-'));
 const dir=path.join(root,'controle-financeiro-backend/src/test/java');fs.mkdirSync(dir,{recursive:true});
 for(const [name,body] of Object.entries(sources))fs.writeFileSync(path.join(dir,name+'.java'),'package example;\n'+body);
 return root;
}
test('class conditions route future Linux-only tests without a second list',t=>{
 const root=fixture(t,{CommonTest:'class CommonTest {}',LinuxTest:'@EnabledOnOs(OS.LINUX)\nclass LinuxTest {}',WindowsTest:'@EnabledOnOs(OS.WINDOWS)\nclass WindowsTest {}'});
 assert.deepEqual(backendSelection(root,'smoke','linux').selected,['example.CommonTest','example.LinuxTest']);
 assert.deepEqual(backendSelection(root,'smoke','win32','platform-only').selected,['example.WindowsTest']);
 assert.deepEqual(backendSelection(root,'smoke','linux','platform-only').selected,['example.LinuxTest']);
});
test('method, nested, unsupported and disabled OS conditions cannot silently lose common tests',t=>{
 for(const body of ['class MixedTest { @EnabledOnOs(OS.WINDOWS) @Test void only() {} @Test void common() {} }','@EnabledOnOs(OS.MAC) class MixedTest {}','@EnabledOnOs({OS.WINDOWS, OS.LINUX}) class MixedTest {}','@DisabledOnOs(OS.WINDOWS) class MixedTest {}','class MixedTest { @EnabledOnOs(OS.WINDOWS) class Nested {} }']){
  const root=fixture(t,{MixedTest:body});assert.throws(()=>backendSelection(root,'smoke','linux'),/Unsupported OS condition/);
 }
});
test('empty common and platform-only selections are errors',t=>{
 const root=fixture(t,{CommonTest:'class CommonTest {}'});
 assert.throws(()=>backendSelection(root,'smoke','win32','platform-only'),/Empty mandatory/);
 const empty=fixture(t,{});assert.throws(()=>backendSelection(empty,'smoke','linux'),/Empty mandatory/);
});
test('every CI entry reaches unconditional Windows before required/package and expanded',()=>{
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/ci.yml'),'utf8');
 const jobs=Object.fromEntries([...workflow.matchAll(/^  ([\w-]+):\n([\s\S]*?)(?=^  [\w-]+:|$(?![\s\S]))/gm)].map(m=>[m[1],m[2]]));
 assert.match(workflow,/push:\n    branches: \[main\]/);
 assert.match(workflow,/pull_request:\n    branches: \[main\]/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(jobs['windows-native'],/runs-on: windows-latest/);
 assert.doesNotMatch(jobs['windows-native'].split('    steps:')[0],/\bif:/);
 assert.match(jobs['windows-native'],/ci\.mjs windows-native/);
 assert.doesNotMatch(workflow,/continue-on-error/);
 assert.match(jobs.required,/needs: windows-native/);
 assert.doesNotMatch(jobs.required.split('    steps:')[0],/\bif:/);
 assert.match(jobs.required,/runs-on: ubuntu-latest/);
 assert.match(jobs.required,/ci\.mjs all/);
 assert.match(jobs.expanded,/needs: required/);
 assert.match(jobs.expanded,/inputs.suite == 'expanded'/);
 assert.match(jobs['windows-native'],/publish-evidence\.mjs/);
 assert.match(jobs['windows-native'],/windows-native-diagnosis-\$\{\{ github.sha \}\}/);
 assert.doesNotMatch(jobs['windows-native'],/\*\.jar|tested-package/);
});
