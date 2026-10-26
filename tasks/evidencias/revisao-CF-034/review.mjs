import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {sourceFor,snapshot} from '../../../.github/scripts/source.mjs';
import {junitCounts,requireReportedClasses} from '../../../.github/scripts/ci.mjs';
const repo=process.cwd(), here=path.join(repo,'tasks/evidencias/revisao-CF-034');
const runtime=path.resolve(process.argv[3]??'../controle-financeiro-runtimes/CF-034/rv01');
const old=path.resolve('../controle-financeiro-runtimes/CF-034/11');
const read=p=>JSON.parse(fs.readFileSync(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const digest=p=>sha(fs.readFileSync(p));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20*1024*1024}).trim();
const run=(args,cwd=repo,env=process.env)=>{const r=spawnSync(process.execPath,args,{cwd,env,encoding:'utf8',windowsHide:true,maxBuffer:10*1024*1024});return {exit:r.status,signal:r.signal,error:r.error?.message,stdout:r.stdout,stderr:r.stderr};};
function protectedFiles(){
 const p=read('tasks/evidencias/CF-034/preservation.json');
 const paths=new Set(['README.md',...p.files.map(f=>f.path),...p.historicalAudit.files.map(f=>f.path)]);
 const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isSymbolicLink()||['node_modules','target','.next','checkout','frontend'].includes(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())walk(f);else paths.add(f);}};
 walk('tasks/evidencias/CF-034');
 const root=path.resolve('../controle-financeiro-runtimes/CF-034');
 for(const e of fs.readdirSync(root,{withFileTypes:true}))if(e.isDirectory()&&path.join(root,e.name)!==runtime)walk(path.join(root,e.name));
 const source=read(path.join(old,'checkout/.ci-source.json'));
 for(const f of source.files){paths.add(f.path);paths.add(path.join(old,'checkout',f.path));}
 for(const name of ['source','frontend','backend','e2e'])paths.add(path.join(old,'checkout',`.ci-${name}.json`));
 return [...paths].sort().map(p=>({path:p,sha256:digest(p)}));
}
if(process.argv[2]==='audit'){
 assert(!fs.existsSync(path.join(here,'audit.json')),'new review output required');
 const protectedBefore=protectedFiles();write(path.join(here,'preservation-before.json'),protectedBefore);
 const root=path.join(old,'checkout'),out=path.join(old,'evidence-01');
 const source=sourceFor(root),manifest=read(path.join(out,'package-manifest.json')),result=read(path.join(out,'result.json'));
 assert.equal(source.files.length,810);assert.deepEqual(manifest.sourceFiles,source.files);
 for(const f of source.files)assert.equal(digest(f.path),f.sha256,f.path);
 assert.equal(manifest.sha256,digest(path.join(out,manifest.file)));
 assert.equal(manifest.sha256,'28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8');
 assert.equal(result.artifact.sha256,manifest.sha256);assert.equal(result.source.digest,source.digest);
 assert.equal(manifest.sourceDigest,source.digest);assert.deepEqual(manifest.commands,result.steps);
 assert.equal(result.stage,'all');assert.equal(result.status,'passed');assert(result.steps.every(s=>s.exit===0));
 const scopes=['.github','controle-financeiro-backend','controle-financeiro-frontend','tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json'];
 assert.equal(git('diff','--name-only',source.commit,'64603a3','--',...scopes),'');
 const reports={};
 for(const folder of ['surefire','e2e-surefire']){
  const summary=read(`tasks/evidencias/CF-034/runs/required-11/${folder}-summary.json`),directory=path.join(out,folder);
  const cases=[];
  for(const s of summary.suites){const file=path.join(directory,s.file);assert.equal(digest(file),s.sha256);const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/<testcase\b([^>]*?)(?:\/?>)/g))cases.push({suite:s.file,attributes:m[1]});assert(!/<(?:flakyFailure|rerunFailure|rerunError|flakyError)\b/.test(text));}
  assert.deepEqual(junitCounts(directory),summary.counts);assert.equal(cases.length,summary.counts.tests);
  if(folder==='surefire')requireReportedClasses(directory,result.selection.selected);
  reports[folder]={counts:summary.counts,classes:summary.suites.length,cases:cases.length,rawHashesVerified:true};
  write(path.join(here,`${folder}-cases.json`),cases);
 }
 const v=read(path.join(out,'components.json')),vs=read('tasks/evidencias/CF-034/runs/required-11/components-summary.json');
 assert.equal(digest(path.join(out,'components.json')),vs.rawSha256);
 const assertions=v.testResults.flatMap(f=>f.assertionResults);assert.equal(assertions.length,620);assert(assertions.every(a=>a.status==='passed'));
 write(path.join(here,'component-cases.json'),v.testResults.map(f=>({file:path.relative(root,f.name).replaceAll('\\','/'),cases:f.assertionResults.map(a=>({title:a.fullName,status:a.status}))})));
 const bs=read('tasks/evidencias/CF-034/runs/required-11/browser-summary.json');assert.equal(digest(path.join(out,'browser/playwright.json')),bs.rawSha256);
 assert(bs.cases.every(c=>c.runs.length===1&&c.runs[0].status==='passed'));
 const observations=read('tasks/evidencias/CF-034/runs/required-11/browser-observations.json');for(const f of observations.observations)assert.equal(digest(path.join(out,'browser',f.file)),f.sha256);
 const historical=read('tasks/evidencias/CF-034/historical-hashes.json');let reconstructed=0;
 for(const e of historical.entries){const b=fs.readFileSync(e.path),lf=Buffer.from(b.toString().replaceAll('\r\n','\n'));assert.equal(sha(b).toUpperCase(),e.observedSha256);if([b,lf,Buffer.from(lf.toString().replaceAll('\n','\r\n'))].some(x=>sha(x).toUpperCase()===e.originalSha256))reconstructed++;for(const base of e.bases){const bytes=execFileSync('git',['show',`${base.base}:${e.path}`],{maxBuffer:20*1024*1024});assert.equal(sha(bytes).toUpperCase(),base.sha256);assert.equal(sha(bytes),sha(lf));}}
 assert.equal(reconstructed,10);
 const negatives=['lint','date','package'].map(n=>{const c=read(`tasks/evidencias/CF-034/runs/negative-${n}/counterproof.json`);assert.equal(c.gate.exit,1);assert.equal(c.gate.result.status,'failed');assert.equal(c.before,c.after);assert(!c.gate.result.artifact);return {mode:n,commit:c.originCommit,exit:c.gate.exit,error:c.gate.result.error,steps:c.gate.result.steps.map(s=>s.name),restored:c.restored};});
 const temporal=fs.readFileSync(path.join(out,'unit.log'),'utf8');assert.equal([...temporal.matchAll(/# tests 6/g)].length,3);
 const trace=read('tasks/evidencias/CF-034/package-trace.json');assert.equal(digest(path.join(out,'result.json')),trace.resultSha256);assert.equal(digest(path.join(out,'package-manifest.json')),trace.manifestSha256);
 write(path.join(here,'audit.json'),{at:new Date().toISOString(),branch:git('branch','--show-current'),head:git('rev-parse','HEAD'),status:git('status','--short'),sourceCommit:source.commit,sourceDigest:source.digest,inputs:source.files.length,inputsMatchCurrentBytes:true,relevantDiffTo64603a3:[],artifact:result.artifact,commands:result.steps,reports,components:{cases:assertions.length,allPassed:true},browser:bs,observationsChecked:observations.observations.length,negativeControls:negatives,historical:{versioned:67,reconstructed,unresolved:67-reconstructed},protectedFiles:protectedBefore.length});
 console.log('Audit passed: 810 inputs, raw reports/cases, artifact and historical objects verified.');
}else if(process.argv[2]==='probes'){
 assert(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(runtime));fs.mkdirSync(runtime);
 const result={at:new Date().toISOString(),runtime};
 // Unmodified contract tests, with their temporary files confined to this execution.
 const temp=path.join(runtime,'temp');fs.mkdirSync(temp);
 result.contract=run(['--test','.github/scripts/ci.test.mjs'],repo,{...process.env,TEMP:temp,TMP:temp});assert.equal(result.contract.exit,0);
 // Synthetic sentinel-only logs; no real credential is read or generated.
 const logs=path.join(runtime,'sanitization');fs.mkdirSync(logs);
 const sentinels={jwt:'eyJTEST.header.signature',plain:'SENTINEL_PLAIN',json:'SENTINEL_JSON',bearer:'SENTINEL_BEARER',cookie:'SENTINEL_COOKIE'};
 fs.writeFileSync(path.join(logs,'backend.log'),`diagnostic=keep\npassword=${sentinels.plain}\n${JSON.stringify({password:sentinels.json})}\nAuthorization: Bearer ${sentinels.bearer}\nCookie: session=${sentinels.cookie}\ntoken=${sentinels.jwt}\n`);
 write(path.join(logs,'result.json'),{status:'failed',error:'synthetic failure retained'});
 result.collector=run(['.github/scripts/publish-evidence.mjs',logs]);assert.equal(result.collector.exit,0);
 const sanitized=fs.readFileSync(path.join(logs,'public/backend.log'),'utf8');
 result.sanitization={syntheticOnly:true,output:sanitized,leaked:Object.fromEntries(Object.entries(sentinels).map(([k,v])=>[k,sanitized.includes(v)])),diagnosisPreserved:sanitized.includes('diagnostic=keep')};
 assert.equal(result.sanitization.leaked.plain,false);assert.equal(result.sanitization.leaked.jwt,false);assert.equal(result.sanitization.leaked.json,true);assert.equal(result.sanitization.leaked.bearer,true);assert.equal(result.sanitization.leaked.cookie,true);
 // Copy all recorded inputs and real receipts, never mutate the old execution.
 const copy=path.join(runtime,'checkout'),src=read(path.join(old,'checkout/.ci-source.json'));
 for(const f of src.files){const dest=path.join(copy,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(old,'checkout',f.path),dest);}
 for(const n of ['source','frontend','backend','e2e'])fs.copyFileSync(path.join(old,'checkout',`.ci-${n}.json`),path.join(copy,`.ci-${n}.json`));
 const target=path.join(copy,'controle-financeiro-backend/target');fs.mkdirSync(target);fs.copyFileSync(path.join(old,'evidence-01/api-0.0.1.jar'),path.join(target,'api-0.0.1.jar'));
 const packageOut=path.join(runtime,'reused-package');
 result.reuse=run([path.join(copy,'.github/scripts/ci.mjs'),'package',copy,packageOut]);assert.equal(result.reuse.exit,0);
 const reused=read(path.join(packageOut,'result.json'));assert.equal(reused.status,'passed');assert.deepEqual(reused.steps,[]);
 result.reuse={...result.reuse,result:reused,manifestCommands:read(path.join(packageOut,'package-manifest.json')).commands,meaning:'old gates accepted; not new tests or compilation'};
 // Required-report checks use the real CLI on a minimal synthetic command fixture.
 for(const mode of ['child-failure','missing-report']){
  const fixture=path.join(runtime,mode),front=path.join(fixture,'controle-financeiro-frontend');fs.mkdirSync(front,{recursive:true});
  const scripts={lint:'node lint.mjs',typecheck:'node ok.mjs',test:'node tap.mjs','test:component':'node ok.mjs',build:'node ok.mjs','test:e2e:install':'node ok.mjs'};
  write(path.join(front,'package.json'),{name:'synthetic-review-only',version:'1.0.0',scripts});write(path.join(front,'package-lock.json'),{name:'synthetic-review-only',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'synthetic-review-only',version:'1.0.0'}}});
  fs.writeFileSync(path.join(front,'lint.mjs'),mode==='child-failure'?'process.exit(23);':'console.log("synthetic lint control");');fs.writeFileSync(path.join(front,'ok.mjs'),'console.log("synthetic zero exit, no report");');fs.writeFileSync(path.join(front,'tap.mjs'),'for(let i=0;i<3;i++)console.log("# tests 1\\n# fail 0\\n# skipped 0");');
  snapshot(fixture,{commit:'synthetic-review-fixture',originalTreeChanges:[]});
  const output=path.join(runtime,mode+'-output');const child=run(['.github/scripts/ci.mjs','all',fixture,output],repo,{...process.env,npm_config_cache:path.join(runtime,'npm-cache'),npm_config_offline:'true'});
  assert.equal(child.exit,1);const report=read(path.join(output,'result.json'));assert.equal(report.status,'failed');assert(!report.artifact);assert(!report.steps.some(s=>['build','backend','e2e'].includes(s.name)));
  if(mode==='child-failure'){assert.equal(report.steps.at(-1).exit,23);assert.match(report.error,/lint failed/);}else{assert.equal(report.steps.at(-1).name,'components');assert.match(report.error,/ENOENT/);}
  result[mode]={...child,report};
 }
 write(path.join(here,'probes.json'),result);console.log('Probes completed; sanitizer leak and old receipt acceptance reproduced, fail-closed controls passed.');
}else if(process.argv[2]==='final'){
 const before=read(path.join(here,'preservation-before.json'));const changed=before.filter(f=>!fs.existsSync(f.path)||digest(f.path)!==f.sha256);
 write(path.join(here,'preservation-final.json'),{at:new Date().toISOString(),checked:before.length,changed,readmeSha256:digest('README.md'),status:git('status','--short')});assert.deepEqual(changed,[]);console.log('Protected files unchanged: '+before.length);
}else throw new Error('audit | probes | final');
