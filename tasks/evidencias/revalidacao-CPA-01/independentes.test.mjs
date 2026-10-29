import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backendSelection} from '../../../.github/scripts/suites.mjs';
import {requireBackendReports,freshOutput,mavenInvocation} from '../../../.github/scripts/ci.mjs';

const runtime=process.env.CPA_REVIEW_RUNTIME;
assert.ok(runtime,'An explicit new review runtime is required');
function fixture(sources){const root=fs.mkdtempSync(path.join(runtime,'independent-'));const dir=path.join(root,'controle-financeiro-backend/src/test/java');fs.mkdirSync(dir,{recursive:true});for(const [name,body]of Object.entries(sources))fs.writeFileSync(path.join(dir,name+'.java'),'package independent;\n'+body);return root;}
const common='class CommonTest {}',windows='@EnabledOnOs(OS.WINDOWS)\nclass OtherWindowsTest {}',linux='@EnabledOnOs(OS.LINUX)\nclass DifferentLinuxTest {}';
test('explicit Linux target on this controller keeps common and Linux, routes arbitrary Windows class',()=>{
 const root=fixture({CommonTest:common,OtherWindowsTest:windows,DifferentLinuxTest:linux});
 assert.deepEqual(backendSelection(root,'smoke','linux').selected,['independent.CommonTest','independent.DifferentLinuxTest']);
 assert.deepEqual(backendSelection(root,'smoke','win32','platform-only').selected,['independent.OtherWindowsTest']);
 assert.deepEqual(backendSelection(root,'expanded','linux').routed.map(r=>r.name),['independent.OtherWindowsTest']);
});
test('absent and unsupported target never falls back to host platform',()=>{for(const target of [undefined,null,'','Windows','windows','Linux','darwin','aix'])assert.throws(()=>backendSelection(process.cwd(),'smoke',target),/Unknown target JVM platform/);});
test('unsupported direct OS annotations fail closed instead of omitting a class',()=>{
 for(const body of ['class CommonTest { @EnabledOnOs(OS.WINDOWS) void method() {} }','@DisabledOnOs(OS.LINUX) class CommonTest {}','@org.junit.jupiter.api.condition.EnabledOnOs(OS.WINDOWS) class CommonTest {}','@EnabledOnOs({OS.WINDOWS,OS.LINUX}) class CommonTest {}'])assert.throws(()=>backendSelection(fixture({CommonTest:body}),'smoke','linux'),/Unsupported OS condition/);
});
test('unrecognized annotation is not silently routed away',()=>{const root=fixture({CommonTest:'@CustomWindowsCondition class CommonTest {}'});assert.deepEqual(backendSelection(root,'smoke','linux').selected,['independent.CommonTest']);});
test('all report failure modes reject even when another mandatory class is green',()=>{
 const dir=fs.mkdtempSync(path.join(runtime,'reports-'));
 const good='tests="3" failures="0" errors="0" skipped="0"';
 fs.writeFileSync(path.join(dir,'TEST-independent.CommonTest.xml'),'<testsuite '+good+'/>');
 const selected=['independent.CommonTest','independent.OtherWindowsTest'];
 assert.throws(()=>requireBackendReports(dir,{selected}),/OtherWindowsTest/);
 for(const attrs of ['tests="1" failures="0" errors="0" skipped="1"','tests="1" failures="1" errors="0" skipped="0"','tests="1" failures="0" errors="1" skipped="0"']){fs.writeFileSync(path.join(dir,'TEST-independent.OtherWindowsTest.xml'),'<testsuite '+attrs+'/>');assert.throws(()=>requireBackendReports(dir,{selected}),/invalid counts/);}
 fs.writeFileSync(path.join(dir,'TEST-independent.OtherWindowsTest.xml'),'<testsuite tests="1" failures="0" errors="0" skipped="0"/>');
 assert.equal(requireBackendReports(dir,{selected}).tests,4);
 assert.throws(()=>requireBackendReports(dir,{selected:[]}),/Empty mandatory/);
 assert.throws(()=>requireBackendReports(dir,{selected:[...selected,'independent.OmittedTest']}),/OmittedTest/);
});
test('old execution output cannot be reopened as fresh proof',()=>{const root=fs.mkdtempSync(path.join(runtime,'fresh-'));const source=path.join(root,'checkout');fs.mkdirSync(source);const old=freshOutput(source,path.join(root,'run-1'));fs.writeFileSync(path.join(old,'TEST-old.xml'),'<testsuite tests="1"/>');assert.throws(()=>freshOutput(source,old),/Never reuse/);assert.throws(()=>freshOutput(source,path.join(source,'reports')),/outside/);});
test('Maven controller aliases match the actual workflow platforms',()=>{assert.equal(mavenInvocation('win32',['test']).executable,'powershell.exe');assert.equal(mavenInvocation('linux',['test']).executable,'sh');for(const platform of [undefined,'windows-latest','ubuntu-latest'])assert.throws(()=>mavenInvocation(platform,['test']),/Unknown Maven JVM platform/);});
