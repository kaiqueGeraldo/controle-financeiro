import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const runtime=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..'),base='c38679933551487e49086e65715243768cba4e44',file='controle-financeiro-frontend/tests/e2e/support/text-geometry.ts';
assert.match(path.basename(runtime),/^rr3-01-/);const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')),git=(wd,...a)=>execFileSync('git',['-c','core.longpaths=true',...a],{cwd:wd,encoding:'utf8',windowsHide:true}).trim();
const initial=read(path.join(runtime,'initial.json')),prepared=read(path.join(runtime,'prepared.json')),candidate=sha(path.join(root,file));
assert.equal(candidate,sha(path.join(runtime,'s/f/tests/e2e/support/text-geometry.ts')));assert.equal(candidate,read(path.join(runtime,'counterproof-restoration.json')).restoredSha256);assert.ok(read(path.join(runtime,'counterproof-complete.json')));
const staticRuns=[];
for(const [label,exit] of [['before-static',1],['after-static',0],['counter-old-static',1],['counter-restored-static',0]]){
 const out=path.join(runtime,label),run=read(path.join(out,'execution.json')),data=read(path.join(out,'geometry-independent.json'));assert.equal(run.exit,exit);
 assert.deepEqual(data.unexpected.map(r=>r.kind),exit===1?['filter-opacity','pointerless-overlay']:[]);
 assert.equal(run.probeSha256,sha(path.join(root,'tasks/evidencias/revalidacao-PR3-expanded-residual/geometry.mjs')));
 staticRuns.push({label,exit,observerSha256:run.observerSha256,recordSha256:sha(path.join(out,'geometry-independent.json')),cases:data.results.map(r=>({kind:r.kind,expected:r.expected,accepted:r.accepted,failures:r.observed.failures,paint:r.observed.paint}))});
}
const liveRuns=[];
for(const [label,exit,count] of [['before-live',1,1],['after-live-consumer',0,2],['counter-old-live',1,1],['counter-restored-live',0,1]]){
 const out=path.join(runtime,label),run=read(path.join(out,'execution.json')),inputs=read(path.join(out,'inputs.json'));assert.equal(run.exit,exit);assert.equal(run.reports.length,count);
 assert.equal(run.inputsSha256,sha(path.join(out,'inputs.json')));assert.equal(run.logSha256,sha(path.join(out,'maven.log')));
 for(const r of run.reports)assert.equal(sha(path.join(out,'surefire',r.file)),r.sha256);
 const probeHash=sha(path.join(root,'tasks/evidencias/revalidacao-PR3-expanded-residual/live-geometry.ts.txt'));
 assert.equal(inputs.find(i=>i.file==='f/tests/e2e/rr3.live-geometry.probe.ts').sha256,probeHash);
 const observed=read(path.join(out,'browsers/RR3LiveGeometryProbe/live-geometry.json'));
 assert.deepEqual(observed.observations.filter(o=>o.observed.ok).map(o=>o.kind),exit===1?['baseline','filter-opacity','pointerless-overlay','restored']:['baseline','restored']);
 assert.deepEqual({quantity:observed.stored.quantity,totalCost:observed.stored.totalCost,valuationAmount:observed.stored.valuationAmount},{quantity:10,totalCost:200,valuationAmount:null});
 liveRuns.push({label,exit,inputsSha256:run.inputsSha256,observerSha256:inputs.find(i=>i.file==='f/tests/e2e/support/text-geometry.ts').sha256,liveProbeSha256:probeHash,reports:run.reports,observations:observed.observations.map(o=>({kind:o.kind,ok:o.observed.ok,failures:o.observed.failures,paint:o.observed.paint})),stored:{ticker:observed.stored.ticker,quantity:10,totalCost:200,valuationAmount:null},recordSha256:sha(path.join(out,'browsers/RR3LiveGeometryProbe/live-geometry.json'))});
}
const consumer=[];
for(const width of [360,768,1440]){
 const f=path.join(runtime,'after-live-consumer/browsers/MilestoneRemediationBrowserTest/san-e2-geometry-'+width+'.json'),data=read(f);
 assert.equal(data.ok,true);assert.ok(data.paint.stable);assert.ok(data.paint.glyphPixels.every(n=>n>0));consumer.push({width,sha256:sha(f),paint:data.paint});
}
const controls=[];
for(const [label,count] of [['regression',23],['scroll-control',1]]){
 const f=path.join(runtime,label,'results.json'),data=read(f);assert.equal(data.stats.expected,count);assert.equal(data.stats.unexpected,0);assert.equal(data.stats.skipped,0);assert.equal(data.stats.flaky,0);controls.push({label,stats:data.stats,sha256:sha(f)});
}
const originalChecks=initial.sources.filter(s=>s.file!==file).map(s=>{assert.equal(sha(path.join(root,s.file)),s.sha256,s.file);return s;});
const immutable=prepared.files.filter(s=>s.file!==file);for(const s of immutable)assert.equal(sha(path.join(root,s.file)),s.source,s.file);
for(const s of initial.protected97)assert.equal(sha(path.resolve(initial.main,s.file)),s.sha256,s.file);
const changes=new Map(initial.sevenOriginals.map(s=>[s.file,s]));for(const s of initial.manifest36.files)assert.equal(sha(path.join(root,s.file)),changes.get(s.file)?.after??s.sha256,s.file);
for(const s of initial.sevenOriginals)assert.equal(sha(s.archivedBefore),s.before,s.archivedBefore);
assert.equal(sha(path.join(initial.main,'README.md')),initial.mainReadme);assert.equal(sha(path.join(root,'README.md')),initial.worktreeReadme);
assert.equal(git(initial.main,'rev-parse','HEAD'),initial.mainHead);assert.equal(git(initial.main,'branch','--show-current'),initial.mainBranch);assert.equal(git(initial.main,'status','--short'),initial.mainStatus);
assert.equal(git(root,'branch','--show-current'),initial.branch);execFileSync('git',['merge-base','--is-ancestor',base,'HEAD'],{cwd:root});assert.ok(!fs.existsSync(path.join(initial.main,'.r3')));assert.ok(!fs.existsSync(path.join(root,'.r3')));
const preservation={at:new Date(),root,branch:initial.branch,headAtCheck:git(root,'rev-parse','HEAD'),base,main:{path:initial.main,head:initial.mainHead,branch:initial.mainBranch,status:git(initial.main,'status','--short'),readmeSha256:initial.mainReadme},worktreeReadmeSha256:initial.worktreeReadme,protected97:{count:97,allMatchInitial:true},manifest36:{count:36,unchangedThisTask:true,priorAuthorizedChanges:7,originalsVerified:initial.sevenOriginals},previousReviewAndConsumer:{count:originalChecks.length,files:originalChecks,unchanged:true},trackedBackendFrontendGithub:{count:prepared.files.length,unchangedExceptObserver:immutable.length,observer:{before:initial.sources.find(s=>s.file===file).sha256,after:candidate}},r3Absent:true,worktrees:git(initial.main,'worktree','list','--porcelain'),noRelocation:true,noHistoricalRuntimeDeletion:true,initialReceiptSha256:sha(path.join(runtime,'initial.json')),preparedReceiptSha256:sha(path.join(runtime,'prepared.json'))};
const results={at:new Date(),base,root,runtime,candidateObserverSha256:candidate,staticRuns,liveRuns,consumer,controls,beforeDiagnostics:{sha256:sha(path.join(runtime,'before-diagnostics.json')),pixels:read(path.join(runtime,'before-diagnostics.json')).pixels},counterproof:{restorationSha256:sha(path.join(runtime,'counterproof-restoration.json')),completeSha256:sha(path.join(runtime,'counterproof-complete.json'))},checks:{typescript:{command:'node controle-financeiro-frontend/node_modules/typescript/bin/tsc --noEmit --incremental false --project controle-financeiro-frontend/tsconfig.json',cwd:root,exit:0,source:'Tool transcript chunk b7364e / session 73344; no persisted stdout, no diagnostics'},ci:{command:'node --test .github/scripts/ci.test.mjs .github/scripts/required.test.mjs .github/scripts/suites.test.mjs .github/scripts/sanitize.test.mjs',cwd:path.join(runtime,'s'),exit:0,tests:32,failures:0,skips:0,source:'Tool transcript chunk 49a5a7; summary transcribed, raw stdout in conversation',sourcesUnchanged:true}},native:{classification:'C',executed:false,confirmationCreated:false},expandedExecuted:false,independentReviewPending:true};
const lintFile=path.join(runtime,'eslint.json'),lint=read(lintFile);assert.equal(lint.length,3);for(const row of lint){assert.equal(row.errorCount,0);assert.equal(row.warningCount,0);}
results.checks.eslint={exit:0,sha256:sha(lintFile),files:lint.map(row=>({file:row.filePath,sha256:sha(row.filePath),errors:row.errorCount,warnings:row.warningCount}))};
for(const [name,data] of [['RESULTADOS.json',results],['PRESERVACAO.json',preservation]])fs.writeFileSync(path.join(import.meta.dirname,name),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({staticRuns:staticRuns.map(r=>({label:r.label,exit:r.exit})),liveRuns:liveRuns.map(r=>({label:r.label,exit:r.exit})),controls:controls.map(r=>({label:r.label,passed:r.stats.expected})),consumerWidths:consumer.map(r=>r.width),preserved:{protected:97,manifest:36,originals:7,previousSources:originalChecks.length,trackedUnchanged:immutable.length},candidate}));
