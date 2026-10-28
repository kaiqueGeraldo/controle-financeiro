import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {sourceFor} from '../../../.github/scripts/source.mjs';

const out=import.meta.dirname,base='434e293f76c3b6ff345fe03f2091149291316aac';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=name=>JSON.parse(fs.readFileSync(path.join(out,name)));
const windows=read('validacao-windows.json'),linux=read('validacao-linux.json'),before=read('reproducao-original.json'),after=read('reproducao-original-depois.json');
const tested=sourceFor(path.join(windows.runtime,'checkout'));
assert.equal(tested.digest,windows.windows.sourceDigest);
for(const file of tested.files)assert.equal(hash(file.path),file.sha256,file.path);
assert.deepEqual(before.inputs,after.inputs,'Historical verifier, selectors and assertions must remain identical before/after');
const code='.github/scripts/ci.mjs',original=git('show',base+':'+code),current=fs.readFileSync(code,'utf8');
assert.equal(current.match(/export function requireCounts[\s\S]*?\n}/)[0],original.match(/export function requireCounts[\s\S]*?\n}/)[0]);
const tcp='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionNativeSocketsTest.java';
const oldTcp=git('show',base+':'+tcp).replace('    @EnabledOnOs(OS.WINDOWS)\n','');
const newTcp=fs.readFileSync(tcp,'utf8').replace(/\r\n/g,'\n').trim().replace('@EnabledOnOs(OS.WINDOWS)\n','');
assert.equal(newTcp,oldTcp,'Only annotation placement changes; assertions/body stay exact');
assert.equal(git('diff',base,'--','controle-financeiro-backend/src/main','controle-financeiro-frontend','controle-financeiro-backend/pom.xml'),'');
assert.equal(fs.readdirSync(path.join(windows.runtime,'checkout/controle-financeiro-backend/target')).filter(f=>f.endsWith('.jar')).length,0);
const selected=read('selecoes.json');
for(const suite of ['smoke','expanded'])assert.equal(selected[suite+'-linux'].selected.length+selected.windowsNative.selected.length,before.result.selections[suite].selectedClasses);
const runtimeReferences=[];
const keep=(file,kind)=>{assert.ok(fs.statSync(file).isFile());runtimeReferences.push({file,kind,bytes:fs.statSync(file).size,sha256:hash(file)});};
for(const receipt of [windows,linux,before,after]){
 for(const step of receipt.steps??receipt.result?.steps??[])if(step.log)keep(step.log,'new execution log');
}
keep(path.join(windows.runtime,'checkout/.ci-source.json'),'existing execution source manifest by hash');
for(const name of ['result.json','backend-selection.json','maven-version.log','backend.log','public/result.json','public/collection.json'])keep(path.join(windows.runtime,'windows-native',name),'Windows directed current output');
keep(windows.windows.xmlPrivate,'private current Surefire XML; hash only in Git');
keep(path.join(linux.runtime,'linux-result.json'),'Linux current directed output');
for(const mode of ['legacy','corrected'])for(const name of fs.readdirSync(path.join(linux.runtime,mode+'-reports')))keep(path.join(linux.runtime,mode+'-reports',name),'Linux JUnit summary XML bridge');
const failed=read('cpa01-validacao-01-falha.json');
for(const step of failed.steps)keep(step.log,'preserved failed first Windows invocation');
keep(path.join(failed.runtime,'windows-native/maven-version.log'),'preserved cmd argument failure');
// Preserve useful logs without publishing raw Maven XML/environment properties.
for(const [file,dest] of [[path.join(windows.runtime,'node-contracts.log'),'contratos-windows.log'],[path.join(windows.runtime,'restored-contracts.log'),'contratos-restaurados.log'],[path.join(linux.runtime,'linux-contracts.log'),'contratos-linux.log'],[path.join(linux.runtime,'linux-toolchain.log'),'toolchain-linux.log'],[path.join(linux.runtime,'linux-directed.log'),'execucao-linux.log']])fs.copyFileSync(file,path.join(out,dest),fs.constants.COPYFILE_EXCL);
const result={at:new Date().toISOString(),base,implementation:git('rev-parse','HEAD'),branch:git('branch','--show-current'),mainTracking:git('rev-parse','origin/main'),mergeBase:git('merge-base',base,'origin/main'),remoteRefRefreshed:false,changesBeforeBranch:'only preexisting README.md; hash confirmed',testedSourceDigest:tested.digest,testedFilesMatchCurrent:true,originalProofInputsIdenticalBeforeAfter:true,requireCountsUnchanged:true,testBodyAndAssertionsUnchanged:true,noNewJar:true,workflowYamlParsedLocally:true,workflowSemanticsCoveredByContracts:true,reviewState:'saneado localmente; aguardando revisão independente; parecer C preservado',runtimeReferences};
fs.writeFileSync(path.join(out,'conferencia.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({testedFiles:tested.files.length,sourceDigest:tested.digest,originalInputsEqual:true,gateUnchanged:true,runtimeReferences:runtimeReferences.length}));
