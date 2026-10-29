import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),out=import.meta.dirname,candidate='81b20bca7c95c452fa04899f583a1b0b5007853e',base='e837748a600c356e2e9d4f60291240cebf523916';
const runtime=path.resolve(process.argv[2]??'');
assert.ok(path.basename(runtime).startsWith('revalidacao-cpa01-r1-'));
assert.equal(path.dirname(runtime),path.resolve(root,'../controle-financeiro-runtimes/preparacao-adocao'));
assert.equal(fs.existsSync(runtime),false,'New runtime only');fs.mkdirSync(runtime);
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file)));
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
assert.equal(git('rev-parse','HEAD'),candidate);assert.equal(git('branch','--show-current'),'codex/saneamento-cpa01-selecao-testes');assert.equal(git('merge-base',base,candidate),base);assert.equal(git('diff','--cached','--name-only'),'');
assert.equal(hash('README.md'),'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
const prior=read('tasks/evidencias/saneamento-CPA-01-R1/preservacao-final.json');
const mutable=new Set(['tasks/README.md','tasks/evidencias/consolidacao-pre-adocao/PUBLICACAO-CI.md','tasks/evidencias/consolidacao-pre-adocao/PROPOSTA-PR.md']);
const protectedFiles=prior.files.filter(item=>!mutable.has(item.file)).map(item=>({file:item.file,sha256:hash(item.file)}));
for(const item of prior.files)assert.equal(hash(item.file),item.finalSha256,item.file);
for(const item of prior.inventory){const file='tasks/evidencias/saneamento-CPA-01-R1/'+item.file;assert.equal(hash(file),item.sha256);protectedFiles.push({file,sha256:hash(file)});}
for(const file of ['.github/scripts/required.mjs','.github/scripts/required.test.mjs','tasks/evidencias/saneamento-CPA-01-R1/preservacao-final.json'])protectedFiles.push({file,sha256:hash(file)});
assert.equal(hash('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar'),'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
write('preservacao-inicial.json',{at:new Date().toISOString(),candidate,base,branch:git('branch','--show-current'),status:git('status','--short'),index:git('diff','--cached','--name-only'),localTrackingOriginMain:git('rev-parse','origin/main'),localMain:git('rev-parse','main'),localExclusiveCommits:Number(git('rev-list','--count','origin/main..HEAD')),files:protectedFiles,scope:'Existing manifests referenced; only explicit protected files rehashed. No old runtime reinventory.'});
const implementation=read('tasks/evidencias/saneamento-CPA-01-R1/validacao.json');
const conference=read('tasks/evidencias/saneamento-CPA-01-R1/conferencia.json');
assert.equal(hash(implementation.inputsManifest.file),implementation.inputsManifest.sha256);
const inputs=JSON.parse(fs.readFileSync(implementation.inputsManifest.file));for(const item of inputs.files)assert.equal(hash(item.file),item.sha256);
for(const item of conference.runtimeReferences)assert.equal(hash(item.file),item.sha256);
const matrix=read('tasks/evidencias/saneamento-CPA-01-R1/matriz-resultados.json');assert.equal(matrix.rows.length,82);assert.equal(matrix.rows.filter(row=>row.expected).length,4);
// Audit the recorded decisions; the independent 500-case cube is the new executable oracle.
for(const row of matrix.rows)assert.equal(row.observed.approved,row.expected);
assert.equal(implementation.mutations.length,6);for(const mutant of implementation.mutations){assert.equal(mutant.negative.exit,1);assert.equal(mutant.restored.exit,0);for(const[file,sha]of Object.entries(mutant.restoredHashes))assert.equal(hash(file),sha);}
const steps=[];
function run(label,args,{cwd=root,env={},expected=0,tests}={}){
 const start=Date.now(),result=spawnSync(process.execPath,args,{cwd,env:{...process.env,...env},shell:false,windowsHide:true,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
 const log=path.join(runtime,label+'.log'),content=(result.stdout??'')+(result.stderr??'');fs.writeFileSync(log,content,{flag:'wx'});
 const record={label,args,cwd,exit:result.status,durationMs:Date.now()-start,log,sha256:hash(log),tests:Number(content.match(/# tests (\d+)/)?.[1]??0),pass:Number(content.match(/# pass (\d+)/)?.[1]??0),fail:Number(content.match(/# fail (\d+)/)?.[1]??0),skipped:Number(content.match(/# skipped (\d+)/)?.[1]??0)};steps.push(record);
 assert.equal(result.error,undefined,JSON.stringify(result.error));assert.equal(result.status,expected,label+' '+content.slice(-1000));
 if(tests!==undefined){assert.equal(record.tests,tests);if(expected===0){assert.equal(record.pass,tests);assert.equal(record.skipped,0);}}
 if(expected!==0){assert.match(content,/ERR_ASSERTION|AssertionError/);assert.doesNotMatch(content,/SyntaxError|ERR_MODULE_NOT_FOUND|Cannot find module/);assert.ok(record.fail>0);}
 console.log(JSON.stringify({label,exit:record.exit,tests:record.tests,fail:record.fail}));return record;
}
const contractArgs=['--test','--test-reporter=tap','.github/scripts/ci.test.mjs','.github/scripts/suites.test.mjs','.github/scripts/sanitize.test.mjs','.github/scripts/required.test.mjs'];
run('contratos-candidato',contractArgs,{tests:32});
run('sete-probes-originais',['--test','--test-reporter=tap','tasks/evidencias/revalidacao-CPA-01/independentes.test.mjs'],{env:{CPA_REVIEW_RUNTIME:runtime},tests:7});
run('independentes-candidato',['--test','--test-reporter=tap',path.join(out,'independentes.test.mjs')],{env:{CPA_R1_TARGET:root,CPA_R1_ORIGINAL:root,CPA_R1_MATRIX:path.join(out,'matriz-resultados.json')},tests:6});
const {backendSelection}=await import(pathToFileURL(path.join(root,'.github/scripts/suites.mjs')));
const identity=read('tasks/evidencias/revalidacao-CPA-01/identidades.json'),windows='com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest',selections={};
for(const suite of ['smoke','expanded']){const linux=backendSelection(root,suite,'linux'),native=backendSelection(root,suite,'win32','platform-only');assert.deepEqual(linux.selected,identity.expected[suite].filter(name=>name!==windows));assert.deepEqual(native.selected,[windows]);assert.deepEqual([...linux.selected,...native.selected].sort(),identity.expected[suite]);selections[suite]={linux:linux.selected.length,windows:native.selected.length,union:identity.expected[suite].length,deferred:linux.deferred.length};}
assert.equal(identity.historical.length,15);
assert.equal(git('diff','--name-only',base,candidate,'--','controle-financeiro-backend','controle-financeiro-frontend','.github/scripts/ci.mjs','.github/scripts/suites.mjs','.github/scripts/ci.test.mjs'),'');
write('conferencia-implementador.json',{at:new Date().toISOString(),inputs:implementation.inputsManifest,filesRehashed:inputs.files.length,runtimeReferencesRehashed:conference.runtimeReferences.length,recordedMatrix:{rows:82,approved:4,rejected:78,allRecordedExpectationsMatch:true,executedThisReview:false},mutants:implementation.mutations.map(m=>({name:m.name,negative:m.negative.exit,restored:m.restored.exit})),countsOverlap:'32 contracts include 9 evaluator/workflow tests. Seven prior probes overlap selector/report contracts. 82 cases and six mutations are not additive coverage. Independent cube and seven mutations below are separate runs of overlapping criteria.',selections,identityReference:{file:'tasks/evidencias/revalidacao-CPA-01/identidades.json',sha256:hash('tasks/evidencias/revalidacao-CPA-01/identidades.json')},acceptedProductAndSelectorDeltaEmpty:true});
const source=path.join(runtime,'source');fs.mkdirSync(source);
const selected=inputs.files.map(item=>path.relative(root,path.resolve(item.file)));
const copied=[];for(const file of selected){assert.equal(file.startsWith('..'),false);const target=path.join(source,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target,fs.constants.COPYFILE_EXCL);assert.equal(hash(target),hash(path.join(root,file)));copied.push({file,sha256:hash(target)});}
fs.writeFileSync(path.join(runtime,'inputs.json'),JSON.stringify({candidate,files:copied},null,2)+'\n',{flag:'wx'});
const evaluatorFile='.github/scripts/required.mjs',workflowFile='.github/workflows/ci.yml';
const originals=Object.fromEntries([evaluatorFile,workflowFile].map(file=>[file,fs.readFileSync(path.join(source,file))]));
const mutations=[
 {name:'sem-always',changes:[[workflowFile,'    if: ${{ always() }}\n','']]},
 {name:'aprovar-incondicional',changes:[[evaluatorFile,"export function evaluateRequired(needsJson,eventName,suite=''){","export function evaluateRequired(needsJson,eventName,suite=''){return {approved:true,required:['windows-native','linux'],notApplicable:['expanded'],problems:[]};"]]},
 {name:'aceitar-skip-obrigatorio',changes:[[evaluatorFile,'if(result!==wanted){',"if(result!==wanted&&result!=='skipped'){"]]},
 {name:'omitir-windows',changes:[[evaluatorFile,"'windows-native':'always',",''],[workflowFile,'needs: [windows-native, linux, expanded]','needs: [linux, expanded]']]},
 {name:'job-ausente-aprovado',changes:[[evaluatorFile,'if(!Object.hasOwn(needs,job)){problems.push(`${job}: missing job`);continue;}','if(!Object.hasOwn(needs,job)){continue;}']]},
 {name:'resultado-ausente-aprovado',changes:[[evaluatorFile,'{problems.push(`${job}: missing result`);continue;}','{continue;}']]},
 {name:'expanded-interpretado-como-smoke',changes:[[evaluatorFile,"const expanded=eventName==='workflow_dispatch'&&suite==='expanded';",'const expanded=false;']]},
];
const mutantResults=[];
for(const mutation of mutations){
 const changes=[];
 try{
  for(const[file,from,to]of mutation.changes){const current=fs.readFileSync(path.join(source,file),'utf8');assert.equal(current.split(from).length,2,'Unique mutation anchor');const changed=current.replace(from,to);fs.writeFileSync(path.join(source,file),changed);changes.push({file,from,to,mutantSha256:hash(path.join(source,file))});}
  const negative=run(mutation.name,['--test','--test-reporter=tap',path.join(out,'independentes.test.mjs')],{cwd:source,env:{CPA_R1_TARGET:source,CPA_R1_ORIGINAL:root},expected:1,tests:6});
  mutantResults.push({name:mutation.name,changes,negative});
 }finally{for(const[file,bytes]of Object.entries(originals))fs.writeFileSync(path.join(source,file),bytes);}
 const restoredHashes=Object.fromEntries(Object.keys(originals).map(file=>{assert.equal(hash(path.join(source,file)),hash(path.join(root,file)));return[file,hash(path.join(source,file))];}));
 const restored=run(mutation.name+'-restaurado',['--test','--test-reporter=tap',path.join(out,'independentes.test.mjs')],{cwd:source,env:{CPA_R1_TARGET:source,CPA_R1_ORIGINAL:root},tests:6});
 Object.assign(mutantResults.at(-1),{restoredHashes,restored});
}
run('contratos-restaurados',contractArgs,{cwd:source,tests:32});
for(const item of protectedFiles)assert.equal(hash(item.file),item.sha256,item.file);
for(const item of copied)assert.equal(hash(path.join(source,item.file)),item.sha256,item.file);
for(const step of steps)fs.copyFileSync(step.log,path.join(out,path.basename(step.log)),fs.constants.COPYFILE_EXCL);
write('validacao.json',{at:new Date().toISOString(),candidate,base,runtime,controller:{platform:process.platform,node:process.version},inputs:{file:path.join(runtime,'inputs.json'),sha256:hash(path.join(runtime,'inputs.json')),files:copied.length},steps,mutations:mutantResults,selections,protectedPathsChecked:protectedFiles.length,restoredInputsMatchCandidate:true,schedulerExecuted:false,remoteRulesQueried:false,productTestsRerun:false,implementationChanged:false});
console.log(JSON.stringify({complete:true,contracts:32,originalProbes:7,independentTests:6,statusCube:500,mutants:mutantResults.length,protected:protectedFiles.length}));
