import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [runtimeArg,cause,stageLabel=cause]=process.argv.slice(2),runtime=path.resolve(runtimeArg),root=path.resolve(import.meta.dirname,'../../..');
assert.ok(['fixtures','diagnostics'].includes(cause));
assert.match(stageLabel,/^[a-z0-9-]+$/);
assert.equal(spawnSync('git',['diff','--cached','--quiet'],{cwd:root,windowsHide:true}).status,0,'index must be empty');
const prefix='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/';
const histories=['Cf014HistoryReviewTest.java','Cf014HistoryDiagnosticTest.java'].map(n=>prefix+n);
const user=prefix+'infra/security/UserIsolationBrowserIntegrationTest.java',browser=prefix+'infra/security/browser.cjs';
const selected=cause==='fixtures'?[...histories,prefix+'migration/IsolatedHistorySchemaInitializer.java',prefix+'Pr3FixtureIsolationProbe.java']:[...histories,...['MilestoneRemediationBrowserTest.java','Rf15RemediationBrowserTest.java','IntegratedMilestoneBrowserReviewTest.java','support/BrowserEvidence.java','Pr3BrowserEvidenceProbe.java'].map(n=>prefix+n),user,browser];
const temporary=cause==='fixtures'?histories:[user,browser];
const backup=temporary.map(file=>({file,bytes:fs.readFileSync(path.join(root,file))}));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const directory=path.join(runtime,'staging-'+stageLabel);fs.mkdirSync(directory);
for(const item of backup)fs.writeFileSync(path.join(directory,path.basename(item.file)),item.bytes,{flag:'wx'});
try {
 for(const item of backup){
  let text=item.bytes.toString();
  if(cause==='fixtures'){
   assert.ok(text.includes('evidence=com.controlefinanceiro.api.support.BrowserEvidence.directory(getClass(),evidence);'));
   text=text.replace('evidence=com.controlefinanceiro.api.support.BrowserEvidence.directory(getClass(),evidence);','Files.createDirectories(evidence);');
  }else if(item.file===user){
   text=text.replace(/@org\.springframework\.context\.annotation\.Import\(UserIsolationBrowserIntegrationTest\.CredentialClock\.class\)\r?\n/,'');
   const start=text.indexOf('    /** Edge middleware'),end=text.indexOf('    @LocalServerPort',start);assert.ok(start>=0&&end>start);
   text=text.slice(0,start)+text.slice(end);
  }else {
   const start=text.indexOf('  // The ownership journey'),end=text.indexOf('  const browser = await chromium.launch();',start);assert.ok(start>=0&&end>start);
   text=text.slice(0,start)+text.slice(end);
  }
  fs.writeFileSync(path.join(root,item.file),text);
 }
 execFileSync('git',['add','--',...selected],{cwd:root,windowsHide:true});
} finally {
 for(const item of backup){fs.writeFileSync(path.join(root,item.file),item.bytes);assert.equal(hash(fs.readFileSync(path.join(root,item.file))),hash(item.bytes));}
 fs.writeFileSync(path.join(directory,'restored.json'),JSON.stringify({cause,selected,files:backup.map(x=>({file:x.file,sha256:hash(x.bytes),restored:true}))},null,2)+'\n');
}
console.log(JSON.stringify({cause,selected,workingFilesRestored:true}));
