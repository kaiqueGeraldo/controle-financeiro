import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {backendSelection} from './checkout/.github/scripts/suites.mjs';
import {requireBackendReports} from './checkout/.github/scripts/ci.mjs';

assert.equal(process.platform,'linux');
const root=path.join(import.meta.dirname,'checkout');
const windows='com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest';
const common='com.controlefinanceiro.api.utils.DateUtilTest';
const selections={};for(const suite of ['smoke','expanded']){
 selections[suite]=backendSelection(root,suite,process.platform);
 assert.ok(!selections[suite].selected.includes(windows));assert.ok(selections[suite].selected.includes(common));
}
const result={controller:{platform:process.platform,node:process.version},selections,scope:'Directed common DateUtilTest only; full Linux backend suite NOT executed',executions:[]};
for(const mode of ['legacy','corrected']){
 const selected=mode==='legacy'?[common,windows]:[common];
 const reports=path.join(import.meta.dirname,mode+'-reports');
 const args=['-cp','classes:dependencies/*','ExecucaoPlataforma',reports,mode,...selected];
 const output=execFileSync('java',args,{cwd:import.meta.dirname,encoding:'utf8'});
 let rejection,counts;try{counts=requireBackendReports(reports,{selected});}catch(error){rejection=error.message;}
 if(mode==='legacy')assert.match(rejection,/skipped/);else assert.deepEqual(counts,{tests:3,failures:0,errors:0,skipped:0});
 const xmls=fs.readdirSync(reports).map(file=>({file,sha256:createHash('sha256').update(fs.readFileSync(path.join(reports,file))).digest('hex')}));
 result.executions.push({mode,selected,command:['java',...args],output,counts,rejection,xmls});
}
fs.writeFileSync(path.join(import.meta.dirname,'linux-result.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.executions));
