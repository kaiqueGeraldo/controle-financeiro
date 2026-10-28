import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=path.resolve(process.argv[2]);
assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep)&&path.basename(root).startsWith('startup-hql-'));
const out='tasks/evidencias/investigacao-startup-HQL';
const digest=async file=>{const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex');};
const before=JSON.parse(fs.readFileSync(path.join(out,'preservacao-inicial.json')));
const checked=[];
for(const item of [...before.inputs,...before.historical]){
 const actual=await digest(item.file);assert.equal(actual,item.sha256,'Protected bytes changed: '+item.file);
 checked.push({file:item.file,sha256:actual,bytes:fs.statSync(item.file).size});
}
const historical=JSON.parse(fs.readFileSync(path.join(out,'historico-verificado.json')));
for(const item of historical.files)assert.equal(await digest(item.file),item.sha256,'Historical evidence changed: '+item.file);
const extra=JSON.parse(fs.readFileSync(path.join(out,'historico-complemento.json')));
for(const item of [...extra.reports,extra.metadata])assert.equal(await digest(item.file),item.sha256);
const readme=await digest('README.md');assert.equal(readme,before.readmeSha256);
const sourceFiles=before.inputs.filter(x=>x.file.includes('/src/main/'));
const diff=execFileSync('git',['diff','--name-only',before.base,'--','controle-financeiro-backend','controle-financeiro-frontend','.github'],{encoding:'utf8'}).trim();
assert.equal(diff,'','No product/harness/CI change in the canonical checkout');
const selected=['execution-receipt.json','database-ready.json','ambiente-inicial.json','ambiente-final.json','image-jar-sha256.txt','image-java-version.txt','experimentos.log','analysis-attempt-01.json'];
for(const name of ['native-control','image-control','native-instrumented','image-instrumented'])for(const file of ['observation.json','process.log','jfr-dump.txt','jfr-summary.txt','original-failure.txt']){
 const relative=path.join(name,file);if(fs.existsSync(path.join(root,relative)))selected.push(relative);
}
const xml='reports/TEST-com.controlefinanceiro.api.migration.StartupHqlProbeTest.xml';selected.push(xml);
const receipts=[];
for(const file of selected){
 const source=path.join(root,file),raw=fs.readFileSync(source,'utf8').replace(/^\uFEFF/,'');
 // Synthetic credential only; normalized text is a review copy, originals stay untouched.
 const text=raw.replaceAll('synthetic-adoption-secret-at-least-32-chars','[synthetic-secret-redacted]').replace(/\r\n/g,'\n').split('\n').map(l=>l.trimEnd()).join('\n');
 const dest=path.join(out,'execucao',file);fs.mkdirSync(path.dirname(dest),{recursive:true});assert.ok(!fs.existsSync(dest));
 fs.writeFileSync(dest,text);
 receipts.push({source:path.join(root,file),file:path.relative(out,dest).replaceAll('\\','/'),originalSha256:await digest(source),collectedSha256:await digest(dest),transform:'UTF8, remove BOM, CRLF to LF, trailing whitespace, synthetic credential redacted'});
}
const inventory=[];
async function walk(folder){
 for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  const file=path.join(folder,entry.name);assert.ok(!entry.isSymbolicLink(),'Do not traverse links');
  if(entry.isDirectory())await walk(file);else if(entry.isFile())inventory.push({file:path.relative(root,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:await digest(file)});
 }
}
await walk(root);
fs.writeFileSync(path.join(out,'runtime-files.json'),JSON.stringify({root,at:new Date().toISOString(),files:inventory},null,2)+'\n',{flag:'wx'});
const final={at:new Date().toISOString(),headBeforeDocumentationCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),readmeSha256:readme,protectedCanonicalInputs:before.inputs.length,
 mainSourcesChecked:sourceFiles.length,migrations:sourceFiles.filter(x=>x.file.includes('/db/migration/')).length,historicalReferences:before.historical.length,historicalOccurrenceFiles:historical.files.length,
 additionalHistoricalReports:extra.reports.length,canonicalProductHarnessDiff:diff,checked,collection:receipts,runtimeFiles:inventory.length,runtimeBytes:inventory.reduce((n,f)=>n+f.bytes,0),
 scope:'Only relevant historical files/manifests rehashed; no recursive copy or assertion of entire historical trees. New runtime alone inventoried.'};
fs.writeFileSync(path.join(out,'preservacao-final.json'),JSON.stringify(final,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({readme,inputs:before.inputs.length,mainSources:sourceFiles.length,migrations:final.migrations,collected:receipts.length,runtimeFiles:inventory.length,runtimeBytes:final.runtimeBytes}));
