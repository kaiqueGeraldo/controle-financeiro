import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const runtime=path.resolve(process.argv[2]),out=import.meta.dirname,stages=[];
const run=(name,args,env={})=>spawnSync(process.execPath,[path.join(out,name),...args],{env:{...process.env,...env},windowsHide:true,stdio:'inherit'}).status;
for(const [kind,grep]of [['income-directed','UI01 '],['gain-directed','UI05 |UI06 '],['reserve-directed','UI03 ']]){
 const stage={kind,started:new Date(),restored:false};stages.push(stage);fs.writeFileSync(path.join(runtime,'directed-counters-progress.json'),JSON.stringify(stages,null,2)+'\n');
 assert.equal(run('contraprovar.mjs',['apply',runtime,kind]),0);
 try {stage.exit=run('executar.mjs',['run',runtime,'counter-'+kind,'IntegratedMilestoneBrowserReviewTest'],{REVALIDATE_GREP:grep});}
 finally{assert.equal(run('contraprovar.mjs',['restore',runtime,kind]),0);stage.restored=true;stage.finished=new Date();fs.writeFileSync(path.join(runtime,'directed-counters-progress.json'),JSON.stringify(stages,null,2)+'\n');}
 assert.equal(stage.exit,1);
 const pw=JSON.parse(fs.readFileSync(path.join(runtime,'counter-'+kind,'browsers/IntegratedMilestoneBrowserReviewTest/playwright-private.json')));
 assert.ok(pw.stats.unexpected>0);assert.equal(pw.stats.skipped,0);assert.equal(pw.stats.expected,0);
}
const exit=run('executar.mjs',['run',runtime,'restored-and-boundaries','IntegratedMilestoneBrowserReviewTest','MilestoneRemediationBrowserTest','UserIsolationBrowserIntegrationTest','RevalidationCredentialBoundaryProbe','RevalidationVisualProbe','Rf15RemediationBrowserTest','CredentialExpiryClockTest'],{REVALIDATE_GREP:'UI01 |UI03 |UI05 |UI06 |SAN-D1 |Independent live|B/C: preferências|RF15-02:'});
fs.writeFileSync(path.join(runtime,'directed-counters-complete.json'),JSON.stringify({stages,restoredGroupExit:exit},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stages,restoredGroupExit:exit,visualFailureExpected:true}));
