import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import {execFileSync}from'node:child_process';
import {hash}from'../preparacao-local-adocao/counterproof-checkpoint.mjs';
const out='tasks/evidencias/revalidacao-preparacao-local-adocao',runtime=path.resolve(process.argv[2]),oldRuntime=path.resolve('../controle-financeiro-runtimes/preparacao-adocao');
const sha=f=>hash(fs.readFileSync(f)),git=args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:8*1024*1024}).trim();
const verified=[];
for(const name of ['revisao-preparacao-local-adocao','saneamento-preparacao-local-adocao']){
 const folder='tasks/evidencias/'+name,record=JSON.parse(fs.readFileSync(folder+'/resultados.json'));
 for(const item of record.collection??record.collected){const source=path.isAbsolute(item.source)?item.source:path.resolve(record.runtime,item.source),target=path.join(folder,item.collected??item.target);
  assert.equal(sha(source),item.sourceSha256??item.originalSha256,source);assert.equal(sha(target),item.collectedSha256,target);verified.push({source,target,sourceSha256:sha(source),collectedSha256:sha(target)});}
}
const current=JSON.parse(fs.readFileSync(path.join(runtime,'inputs.json'))),old=JSON.parse(fs.readFileSync(path.join(oldRuntime,'p05/inputs.json')));
assert.equal(current.commit,'aa068d17aba41855c3f5f5fb5385b6dfd2babc4a');assert.equal(current.inputs.length,832);
const oldMap=new Map(old.inputs.map(x=>[x.file,x])),delta=current.inputs.filter(x=>!oldMap.has(x.file)||oldMap.get(x.file).normalizedBlob!==x.normalizedBlob).map(x=>x.file);
assert.deepEqual(delta.sort(),['controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionPortAllocationTest.java','controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionRuntimeTest.java']);
for(const x of current.inputs)assert.equal(sha(path.join(runtime,'checkout',x.file)),x.sha256,x.file);
const productionDiff=git(['diff','--name-only','07c3963..aa068d1','--','controle-financeiro-backend/src/main','controle-financeiro-backend/pom.xml','controle-financeiro-backend/Dockerfile','controle-financeiro-backend/Dockerfile.release','controle-financeiro-frontend','.github']);assert.equal(productionDiff,'');
const startupRoot=path.join(oldRuntime,'saneamento-startup-01'),timeline=JSON.parse(fs.readFileSync(path.join(startupRoot,'timeline.json'))),analysis=JSON.parse(fs.readFileSync(path.join(startupRoot,'startup-analysis-final.json')));
const startup=timeline.map(r=>{const log=path.join(startupRoot,r.mode,'process.log'),lines=fs.readFileSync(log,'utf8').split(/\r?\n/),events=lines.filter(l=>l.includes('BOOT_QUERY_END|')).map(l=>l.slice(l.indexOf('BOOT_QUERY_END|')).split('|')).filter(p=>p[2].endsWith('.forHql'));
 const summary={mode:r.mode,readyMs:r.readyMs,within40:r.readyMs>=0&&r.readyMs<=40000,queries:events.length,distinctHashes:new Set(events.map(p=>p[3])).size,totalQueryMs:events.reduce((n,p)=>n+Number(p[4])/1e6,0),maxQueryMs:Math.max(...events.map(p=>Number(p[4])/1e6)),logSha256:sha(log)};
 const previous=analysis.analysis.find(x=>x.mode===r.mode);assert.equal(summary.queries,76);assert.equal(summary.distinctHashes,76);assert.equal(summary.readyMs,previous.readyMs);assert.ok(Math.abs(summary.totalQueryMs-previous.hql.totalMs)<0.001);return summary;});
assert.equal(fs.statSync(path.join(startupRoot,'native.jfr')).size,0);assert.equal(sha(path.join(startupRoot,'agent/image.jfr')),analysis.jfr.sha256);
const observer=hash(Buffer.concat(['counterproofs.mjs','counterproof-checkpoint.mjs','counterproof-observation.mjs'].map(f=>fs.readFileSync('tasks/evidencias/preparacao-local-adocao/'+f))));
const facts={at:new Date().toISOString(),base:'07c396371029d9942b8667e5c638c04a9e6aeb4b',candidate:current.commit,changeNames:git(['diff','--name-status','07c3963..aa068d1']).split('\n'),productionDiff,exportedInputs:832,previousPackageInputs:831,changedInputs:delta,jarSha256:sha(path.join(oldRuntime,'p05/package/api.jar')),packageProducer:old.commit,observerSha256:observer,previousProofFilesVerified:verified.length,verified,startupRecalculated:startup,nativeJfrValid:false,linuxJfrSha256:analysis.jfr.sha256,linuxJfrBytes:fs.statSync(path.join(startupRoot,'agent/image.jfr')).size,testsNewInThisAudit:0,scope:'Read-only checks of original and collected bytes; query timings recomputed from original logs. No additional HQL startup experiment: the existing instrumented observations did not reproduce the slow occurrence.'};
fs.writeFileSync(out+'/base-proveniencia.json',JSON.stringify(facts,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...facts,changeNames:undefined,verified:undefined}));
