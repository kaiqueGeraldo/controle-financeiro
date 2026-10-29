import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';

const repo=process.cwd(),out=import.meta.dirname,runtime=path.resolve(process.argv[2]??'');
assert.ok(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep)&&path.basename(runtime).startsWith('cpa01-r1-'));
assert.ok(!fs.existsSync(runtime));fs.mkdirSync(runtime,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),fileHash=file=>hash(fs.readFileSync(file));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const checkout=path.join(runtime,'checkout');fs.mkdirSync(checkout);
const files=git('ls-files','--cached','--others','--exclude-standard','.github','controle-financeiro-backend/src/test/java').split('\n').filter(Boolean),inputs=[];
for(const file of files){const dest=path.join(checkout,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);assert.equal(fileHash(dest),fileHash(file));inputs.push({file,sha256:fileHash(dest)});}
fs.writeFileSync(path.join(runtime,'inputs.json'),JSON.stringify({base:git('rev-parse','HEAD'),files:inputs},null,2)+'\n');
const tmp=path.join(runtime,'temp');fs.mkdirSync(tmp);
const env={...process.env,TEMP:tmp,TMP:tmp,CPA_REVIEW_RUNTIME:runtime};
const steps=[];
function run(label,args,options={}){
 const start=Date.now(),result=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,cwd:checkout,env,maxBuffer:16*1024*1024,...options});
 const log=path.join(runtime,label+'.log');fs.writeFileSync(log,(result.stdout??'')+(result.stderr??'')+(result.error?.message??''));
 const step={label,args,exit:result.status,durationMs:Date.now()-start,log,sha256:fileHash(log)};steps.push(step);return step;
}
const success=(...args)=>{const result=run(...args);assert.equal(result.exit,0,result.log);return result;};
const contractArgs=['--test','--test-reporter=tap','.github/scripts/ci.test.mjs','.github/scripts/suites.test.mjs','.github/scripts/sanitize.test.mjs','.github/scripts/required.test.mjs'];
let receipt;
try{
 success('contratos-ci',contractArgs);
 const independent='tasks/evidencias/revalidacao-CPA-01/independentes.test.mjs';
 success('probes-independentes',['--test','--test-reporter=tap',path.join(repo,independent)]);
 const module=await import(pathToFileURL(path.join(checkout,'.github/scripts/required.mjs')));
 const require=createRequire(path.join(repo,'controle-financeiro-frontend/package.json')),yaml=require('js-yaml');
 const workflow=yaml.load(fs.readFileSync(path.join(checkout,'.github/workflows/ci.yml'),'utf8'));
 const baseline=yaml.load(execFileSync('git',['show','e837748a600c356e2e9d4f60291240cebf523916:.github/workflows/ci.yml'],{encoding:'utf8'}));
 const jobs=workflow.jobs,needs=value=>typeof value==='string'?[value]:value;
 assert.deepEqual(workflow.on,baseline.on);
 assert.equal(jobs.required.if,'${{ always() }}');assert.equal(jobs.required.name,undefined);
 assert.deepEqual(needs(jobs.required.needs).sort(),Object.keys(module.jobRequirements).sort());
 assert.equal(jobs.required.steps.at(-1).run,'node .github/scripts/required.mjs');assert.equal(jobs.required.steps.at(-1).if,undefined);
 assert.equal(jobs.required.steps.at(-1).env.NEEDS_JSON,'${{ toJSON(needs) }}');
 for(const job of Object.values(jobs)){assert.equal(job['continue-on-error'],undefined);for(const step of job.steps)assert.equal(step['continue-on-error'],undefined);}
 // The old execution job is moved intact, except adding aggregator contracts.
 const expectedLinux=structuredClone(baseline.jobs.required),expectedWindows=structuredClone(baseline.jobs['windows-native']);
 for(const job of [expectedLinux,expectedWindows])for(const step of job.steps)if(step.run?.startsWith('node --test '))step.run+=' .github/scripts/required.test.mjs';
 assert.deepEqual(jobs.linux,expectedLinux);assert.deepEqual(jobs['windows-native'],expectedWindows);
 assert.deepEqual(jobs.expanded,{...baseline.jobs.expanded,needs:'linux'});
 const packageStep=jobs.linux.steps.find(step=>step.with?.name?.startsWith('tested-package-'));assert.ok(packageStep);assert.equal(packageStep.if,undefined);
 const workflowContract={yamlSha256:fileHash(path.join(checkout,'.github/workflows/ci.yml')),parser:{version:require('js-yaml/package.json').version},events:workflow.on,needs:Object.fromEntries(Object.entries(jobs).map(([name,job])=>[name,needs(job.needs)??[]])),aggregateCondition:jobs.required.if,expectedNeeds:Object.keys(module.jobRequirements),workerAndPackageUnchangedExceptContractCommand:true,expandedChangedOnlyNeeds:true,noContinueOnError:true,aggregateFinalCommand:jobs.required.steps.at(-1).run,checkName:'CI integrated gates / required',remoteRulesQueried:false,schedulerExecuted:false};
 save('workflow-contrato.json',workflowContract);
 const rows=[];
 for(const [event,suite] of [['push',''],['pull_request',''],['workflow_dispatch','smoke'],['workflow_dispatch','expanded']]){
  const required=suite==='expanded'?['windows-native','linux','expanded']:['windows-native','linux'];
  const good=()=>Object.fromEntries(['windows-native','linux','expanded'].map(job=>[job,{result:required.includes(job)?'success':'skipped'}]));
  const record=(label,payload,expected)=>{const result=module.evaluateRequired(typeof payload==='string'?payload:JSON.stringify(payload),event,suite);assert.equal(result.approved,expected,label);rows.push({event,suite:suite||'not supplied',label,expected,observed:result});};
  record('all mandatory success',good(),true);
  for(const job of required){
   for(const status of ['failure','cancelled','skipped','unknown']){const data=good();data[job].result=status;record(job+' '+status,data,false);}
   const absent=good();delete absent[job];record(job+' absent',absent,false);
   const noResult=good();delete noResult[job].result;record(job+' no result',noResult,false);
  }
  const multiple=good();multiple['windows-native'].result='failure';multiple.linux.result='failure';record('combined failures',multiple,false);
  for(const invalid of ['','{}','{invalid','null','[]'])record('payload '+JSON.stringify(invalid),invalid,false);
 }
 save('matriz-resultados.json',{evaluatorSha256:fileHash(path.join(checkout,'.github/scripts/required.mjs')),kind:'Actual evaluator executed locally, not a parallel scheduler implementation',rows});
 const policy=path.join(checkout,'.github/scripts/required.mjs'),workflowFile=path.join(checkout,'.github/workflows/ci.yml');
 const originals=new Map([[policy,fs.readFileSync(policy)],[workflowFile,fs.readFileSync(workflowFile)]]),mutations=[];
 const experiments=[
  {name:'sem-condicao-de-status',changes:[[workflowFile,'    if: ${{ always() }}\n','']]},
  {name:'aprovar-sem-verificar',changes:[[policy,"export function evaluateRequired(needsJson,eventName,suite=''){","export function evaluateRequired(needsJson,eventName,suite=''){ return {approved:true,required:['windows-native','linux'],notApplicable:['expanded'],problems:[]};"]]},
  {name:'aceitar-skipped',changes:[[policy,'if(result!==wanted){',"if(result!==wanted&&result!=='skipped'){"]]},
  {name:'omitir-windows',changes:[[policy,"'windows-native':'always',",''],[workflowFile,'needs: [windows-native, linux, expanded]','needs: [linux, expanded]']]},
  {name:'job-ausente-como-sucesso',changes:[[policy,'if(!Object.hasOwn(needs,job)){problems.push(`${job}: missing job`);continue;}','if(!Object.hasOwn(needs,job)){continue;}']]},
  {name:'resultado-ausente-como-sucesso',changes:[[policy,"{problems.push(`${job}: missing result`);continue;}",'{continue;}']]},
 ];
 for(const experiment of experiments){
  const changes=[];for(const [file,from,to] of experiment.changes){const text=fs.readFileSync(file,'utf8');assert.ok(text.includes(from),experiment.name);fs.writeFileSync(file,text.replace(from,to));changes.push({file:path.relative(checkout,file),from,to,mutantSha256:fileHash(file)});}
  const negative=run(experiment.name,['--test','--test-reporter=tap','.github/scripts/required.test.mjs']);
  assert.equal(negative.exit,1,experiment.name+' survived');assert.match(fs.readFileSync(negative.log,'utf8'),/ERR_ASSERTION|AssertionError/);
  for(const [file,bytes] of originals){fs.writeFileSync(file,bytes);assert.equal(fileHash(file),hash(bytes));}
  const restored=success(experiment.name+'-restaurado',['--test','--test-reporter=tap','.github/scripts/required.test.mjs']);
  mutations.push({name:experiment.name,changes,negative,restored,restoredHashes:Object.fromEntries([...originals].map(([file,bytes])=>[path.relative(checkout,file),hash(bytes)]))});
 }
 success('contratos-finais',contractArgs);
 for(const input of inputs)assert.equal(fileHash(path.join(checkout,input.file)),input.sha256,input.file);
 receipt={at:new Date().toISOString(),base:git('rev-parse','HEAD'),runtime,controller:{platform:process.platform,node:process.version},inputsManifest:{file:path.join(runtime,'inputs.json'),sha256:fileHash(path.join(runtime,'inputs.json')),files:inputs.length},steps,workflowContract,mutations,matrixRows:rows.length,independentProbe:{file:independent,sha256:fileHash(independent)},sourceRestored:true,remoteCi:false,financialTests:false,startup:false,newJar:false,schedulingCertified:false};
 for(const name of ['contratos-ci','probes-independentes','contratos-finais'])fs.copyFileSync(path.join(runtime,name+'.log'),path.join(out,name+'.log'),fs.constants.COPYFILE_EXCL);
}catch(error){receipt={at:new Date().toISOString(),runtime,steps,error:error.message};throw error;}
finally{save(receipt.error?path.basename(runtime)+'-falha.json':'validacao.json',receipt);}
console.log(JSON.stringify({matrixRows:receipt.matrixRows,mutations:receipt.mutations.length,restored:receipt.sourceRestored,remoteCi:false}));
