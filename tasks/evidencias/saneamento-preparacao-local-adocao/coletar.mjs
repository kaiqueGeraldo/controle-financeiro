import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync}from'node:child_process';
const parent=path.resolve('../controle-financeiro-runtimes/preparacao-adocao'),out=path.resolve('tasks/evidencias/saneamento-preparacao-local-adocao');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f));
const collected=[];
function copy(run,file,name=run+'/'+file) {
 const source=path.join(parent,run,file),bytes=fs.readFileSync(source);
 let text=bytes.toString('utf8').replace(/jdbc:postgresql:[^\s"'<>]*/g,'[JDBC_REDACTED]')
  .replace(/((?:JWT_SECRET|BRAPI_TOKEN|RESEND_API_KEY|SPRING_DATASOURCE_PASSWORD)=)[^\s",]+/g,'$1[synthetic-redacted]');
 const previous=path.join(out,'execucao',name);
 // Keep collected paths portable on Windows; original names remain in this map.
 if(previous.length>235)name='artefatos/'+sha(Buffer.from(source)).slice(0,16)+path.extname(file);
 const target=path.join(out,'execucao',name);fs.mkdirSync(path.dirname(target),{recursive:true});
 if(previous!==target&&fs.existsSync(previous)) {
  const allowed=path.join(out,'execucao')+path.sep;
  if(!path.resolve(previous).startsWith(allowed)||!path.resolve(target).startsWith(allowed))throw Error('Collected move outside evidence directory');
  if(hash(previous)!==sha(Buffer.from(text)))throw Error('Do not move changed evidence');
  fs.renameSync(previous,target); // Own uncommitted copy only; never the runtime original.
 }else fs.writeFileSync(target,text);
 collected.push({source,target:path.relative(out,target).replaceAll('\\','/'),originalSha256:sha(bytes),collectedSha256:sha(Buffer.from(text)),sanitized:!bytes.equals(Buffer.from(text))});
}
function tree(run,relative,filter) {
 for(const entry of fs.readdirSync(path.join(parent,run,relative),{withFileTypes:true})) {
  const file=path.join(relative,entry.name);if(entry.isDirectory())tree(run,file,filter);else if(filter(file))copy(run,file);
 }
}
const runs=['saneamento-resume-original-01','saneamento-resume-original-02','saneamento-resume-git-original-01',
 'saneamento-resume-corrigido-01','saneamento-resume-corrigido-02','saneamento-resume-corrigido-03',
 'saneamento-resume-mutante-01','saneamento-resume-mutante-02','saneamento-resume-mutante-03','saneamento-runner-01','saneamento-runner-02','saneamento-runner-03'];
for(const run of runs)for(const file of fs.readdirSync(path.join(parent,run)))if(/\.(log|json)$/.test(file))copy(run,file);
for(const run of ['saneamento-resume-real-01','saneamento-resume-real-02','saneamento-quiescencia-01']) {
 for(const file of ['first.log','resume.log','inputs.json'])copy(run,file);
 if(fs.existsSync(path.join(parent,run,'audit.log')))copy(run,'audit.log');
 if(run==='saneamento-quiescencia-01')for(const file of ['child-active.log','quiescence.json'])copy(run,file);
 tree(run,'counterproofs/v2',file=>/\.(json|jsonl|log|xml)$/.test(file));
}
for(const file of ['inputs.json','agent-hashes.json','original-three.log','port-before.log','timeline.log','timeline.json','startup-analysis.json','startup-analysis-final.json','jfr-summary.log','jfr-print-help.log'])copy('saneamento-startup-01',file);
for(const folder of ['native','image','original-three-reports','port-before-reports','timeline-reports','checkout/controle-financeiro-backend/target/adoption-processes'])tree('saneamento-startup-01',folder,file=>/\.(xml|log)$/.test(file));
for(const file of ['inputs.json','pg17.log','pg16.log','image.log'])copy('saneamento-portas-01',file);
for(const folder of ['pg17-reports','pg16-reports','image-reports'])tree('saneamento-portas-01',folder,file=>/\.xml$/.test(file));
for(const file of ['inputs.json','port-mutant.log','port-mutant.json'])copy('saneamento-port-mutante-01',file);
tree('saneamento-port-mutante-01','port-mutant-reports',file=>/\.xml$/.test(file));
function junit(run,folder) {
 const reports=fs.readdirSync(path.join(parent,run,folder)).filter(f=>f.endsWith('.xml')).map(file=>{
  const xml=fs.readFileSync(path.join(parent,run,folder,file),'utf8'),header=xml.match(/<testsuite\b([^>]*)>/)[1];
  const attrs=Object.fromEntries([...header.matchAll(/([\w.-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  return {file,name:attrs.name,tests:Number(attrs.tests),failures:Number(attrs.failures),errors:Number(attrs.errors),skipped:Number(attrs.skipped),sha256:hash(path.join(parent,run,folder,file))};
 });
 return {reports,totals:reports.reduce((n,r)=>{for(const k of ['tests','failures','errors','skipped'])n[k]+=r[k];return n;},{tests:0,failures:0,errors:0,skipped:0})};
}
const reports={originalThree:junit('saneamento-startup-01','original-three-reports'),portBefore:junit('saneamento-startup-01','port-before-reports'),
 timeline:junit('saneamento-startup-01','timeline-reports'),pg17:junit('saneamento-portas-01','pg17-reports'),pg16:junit('saneamento-portas-01','pg16-reports'),image:junit('saneamento-portas-01','image-reports'),portMutant:junit('saneamento-port-mutante-01','port-mutant-reports')};
for(const name of ['portBefore','timeline','pg17','pg16','image']){const r=reports[name].totals;if(!r.tests||r.failures||r.errors||r.skipped)throw Error('Unexpected regression: '+name);}
if(reports.originalThree.totals.tests!==3||reports.originalThree.totals.failures!==1||reports.portMutant.totals.failures!==1)throw Error('Original/mutant failures must remain recorded');
const tested=JSON.parse(fs.readFileSync(path.join(parent,'saneamento-portas-01/inputs.json'))),old=JSON.parse(fs.readFileSync(path.join(parent,'p05/inputs.json')));
const changed=tested.inputs.filter(x=>old.inputs.find(y=>y.file===x.file)?.sha256!==x.sha256).map(x=>x.file);
if(changed.length!==2||changed.some(f=>!f.endsWith('/migration/AdoptionRuntimeTest.java')&&!f.endsWith('/migration/AdoptionPortAllocationTest.java')))throw Error('Unexpected product/source change');
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
const blobs=new Map(git(['ls-tree','-r','HEAD','--','.github','controle-financeiro-backend','controle-financeiro-frontend',
 'tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json']).split('\n').map(line=>{const [meta,file]=line.split('\t');return[file,meta.split(' ')[2]];}));
for(const input of tested.inputs)if(hash(input.file)!==input.sha256||blobs.get(input.file)!==input.normalizedBlob)throw Error('Tested input not at code HEAD: '+input.file);
for(const input of old.inputs)if(hash(path.join(parent,'p05/checkout',input.file))!==input.sha256)throw Error('Historical packaged source changed');
const jar=hash(path.join(parent,'p05/package/api.jar'));if(jar!=='b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b')throw Error('Historical JAR changed');
const tap=fs.readFileSync(path.join(parent,'saneamento-runner-03/tests.log'),'utf8');
const nodeTests=Object.fromEntries(['tests','pass','fail','skipped'].map(k=>[k,Number(tap.match(new RegExp('^# '+k+' (\\d+)','m'))?.[1])]));
if(nodeTests.tests!==28||nodeTests.pass!==28||nodeTests.fail||nodeTests.skipped)throw Error('Unexpected checkpoint regression');
const pg=major=>{const log=fs.readFileSync(path.join(parent,'saneamento-portas-01/pg'+major+'.log'),'utf8');return {server:log.match(/CF017_SERVER ([^\r\n]+)/)?.[1],clients:[...log.matchAll(/CF017_CLIENT ([^\r\n]+)/g)].map(x=>x[1])};};
const receipt={at:new Date().toISOString(),base:'07c396371029d9942b8667e5c638c04a9e6aeb4b',codeHead:git(['rev-parse','HEAD']),reports,
 toolchain:{node:process.version,pg16:pg(16),pg17:pg(17),javaNative:'21.0.12.1+1',javaImage:'21.0.12+8',wrapper:'3.9.12',diagnosticByteBuddy:'1.17.8'},
 finalNodeTests:{...nodeTests,source:'saneamento-runner-03/tests.log'},
 counting:'Independent overlapping invocations; no aggregate unique-test total. Diagnostic wrapper success is not startup approval.',
 sourceEquivalence:{testedInputs:tested.inputs.length,historicalPackageInputs:old.inputs.length,changedInputs:changed,allProductionInputsIdentical:true,allTestedInputsMatchCodeHead:true},
 package:{newPackage:false,inputCommit:old.commit,sha256:jar,reason:'Only observers/tests changed; product JAR/image unchanged'},
 boundary:'Source restoration and process quiescence. Compiled mutants remain quarantined in disposable target directories; scoped proof does not certify a positive startup witness.',collected};
fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({codeHead:receipt.codeHead,collected:collected.length,reports:Object.fromEntries(Object.entries(reports).map(([k,v])=>[k,v.totals])),changedInputs:changed,jar}));
