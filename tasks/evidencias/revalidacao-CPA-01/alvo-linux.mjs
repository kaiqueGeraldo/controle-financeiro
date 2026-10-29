import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
import {backendSelection} from './checkout/.github/scripts/suites.mjs';
import {requireBackendReports,junitCounts} from './checkout/.github/scripts/ci.mjs';
import {backendSelection as oldSelection} from './baseline-suites.mjs';
assert.equal(process.platform,'linux');
const root=path.join(import.meta.dirname,'checkout'),expected=JSON.parse(fs.readFileSync('expected-identities.json'));
const windows='com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest',common='com.controlefinanceiro.api.utils.DateUtilTest';
const selections={};
for(const suite of ['smoke','expanded']){
 assert.deepEqual(oldSelection(root,suite).selected,expected[suite]);
 const selection=backendSelection(root,suite,process.platform);
 assert.deepEqual(selection.selected,expected[suite].filter(n=>n!==windows));
 assert.deepEqual(backendSelection(root,suite,'win32','platform-only').selected,[windows]);
 selections[suite]=selection;
}
const executions=[];
for(const mode of ['legacy','corrected']){
 const full=mode==='legacy'?oldSelection(root,'smoke').selected:selections.smoke.selected;
 const selected=full.filter(n=>[common,windows].includes(n));
 const reports=path.join(import.meta.dirname,mode+'-reports');
 const classpath=(mode==='legacy'?'legacy-classes:':'')+'classes:dependencies/*';
 const args=['-cp',classpath,'ExecutarJUnit',reports,...selected];
 const output=execFileSync('java',args,{encoding:'utf8'});
 let rejection;const counts=junitCounts(reports);
 try{requireBackendReports(reports,{selected});}catch(error){rejection=error.message;}
 if(mode==='legacy'){assert.deepEqual(counts,{tests:4,failures:0,errors:0,skipped:1});assert.match(rejection,/skipped/);}
 else{assert.deepEqual(counts,{tests:3,failures:0,errors:0,skipped:0});assert.equal(rejection,undefined);}
 executions.push({mode,selected,command:['java',...args],counts,rejection,output,xmls:fs.readdirSync(reports).map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(reports,file))).digest('hex')}))});
}
const result={at:new Date().toISOString(),controller:{platform:process.platform,node:process.version},selections,executions,
 scope:'Real Linux JVM and controller in disposable container; 3 common cases only, not the full Linux suite; JUnit XML summary bridge, not Maven/Surefire',remoteActions:false,nativeLinuxSupervisorCertified:false};
fs.writeFileSync('linux-result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({controller:result.controller,counts:executions.map(e=>({mode:e.mode,counts:e.counts,rejection:e.rejection}))}));
