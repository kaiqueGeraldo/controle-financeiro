import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const parent=path.resolve('../controle-financeiro-runtimes/preparacao-adocao'),out=import.meta.dirname;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),artifacts=[],binaries=[],inventory=[];
const skip=new Set(['checkout','tools','snapshot','mutant-source','classes','unit','temp','bin']);
const runtimes=fs.readdirSync(parent).filter(n=>n.startsWith('rvpla05-residual-')).sort();
const sanitize=text=>text.replace(/jdbc:postgresql:\/\/[^\s\]<>"']+/gi,'<JDBC_LOCAL_WITHHELD>').replace(/(Bearer\s+)[A-Za-z0-9_.-]+/g,'$1<TOKEN_WITHHELD>').replace(/(password\s*[=:]\s*)[^\s,;]+/gi,'$1<PASSWORD_WITHHELD>');
function collect(source,relative) {
  const raw=fs.readFileSync(source),utf16=raw[0]===255&&raw[1]===254;
  const text=raw.toString(utf16?'utf16le':'utf8').replace(/^\uFEFF/,''),clean=Buffer.from(sanitize(text));
  let target=path.join(out,'execucao',relative);
  if(target.length>235)target=path.join(out,'execucao/compactos',hash(source).slice(0,16)+'-'+path.basename(source).replace('com.controlefinanceiro.api.migration.',''));
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,clean,{flag:'wx'});
  artifacts.push({source,target:path.relative(out,target).replaceAll('\\','/'),originalSha256:hash(raw),collectedSha256:hash(clean),decodedAs:utf16?'utf16le':'utf8',sanitized:!raw.equals(clean),expectedInvalidJson:source.includes('corrupted-mailbox')&&text==='{'});
}
function walk(dir,relative,collectable=true) {
  for(const e of fs.readdirSync(dir,{withFileTypes:true})) {
    assert.equal(e.isSymbolicLink(),false);const file=path.join(dir,e.name),next=path.join(relative,e.name);
    if(e.isDirectory()){walk(file,next,collectable&&!skip.has(e.name)&&!e.name.startsWith('sources-'));continue;}
    const raw=fs.readFileSync(file);inventory.push({source:file,relative:next.replaceAll('\\','/'),bytes:raw.length,sha256:hash(raw)});
    if(/\.(exe|dll|class)$/.test(e.name))binaries.push({source:file,sha256:hash(raw)});
    if(collectable&&(/\.(json|jsonl|log|xml|txt|identity|tsv|tmp|pid)$/.test(e.name)||['armed','parent-ready','child-ready','after-complete','query-captured','maven-called','docker-called','exit-reason','test-release'].includes(e.name)))collect(file,next);
  }
}
for(const name of runtimes)walk(path.join(parent,name),name);
const interrupted=path.join(parent,'rvpla05-residual-profile-01/execution/late-wrapper/checkout/controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/infra/migration/LegacyPreflight.java');
collect(interrupted,'rvpla05-residual-profile-01/input-at-interruption.java.txt');
const read=file=>JSON.parse(fs.readFileSync(path.join(parent,file)));
const measurements=['01','02','03'].map(i=>read('rvpla05-residual-after-'+i+'/results.json'));
for(const m of measurements){assert.equal(m.originalGatePassed,true);assert.ok(m.resumeCloseMs<20000);assert.equal(m.queryCount,9);assert.equal(m.commandGuardianCount,3);assert.deepEqual(m.sourceHashes,measurements[0].sourceHashes);}
const real=read('rvpla05-residual-real-01/results.json');assert.equal(real.auditPassed,true);
const result={at:new Date().toISOString(),base:'acaa6ed9374f8c9a205d92955f0f4f946b17aa8a',implementationHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtimes,measurements,baseline:read('rvpla05-residual-before-01/results.json'),profile:read('rvpla05-residual-profile-01/results.json'),costMutation:read('rvpla05-residual-cost-mutation-01/results.json'),checks:read('rvpla05-residual-checks-01/results.json'),fence:read('rvpla05-residual-fence-01/results.json'),confirmation:read('rvpla05-residual-confirmation-01/results.json'),regressions:read('rvpla05-residual-regressions-01/results.json'),foreign:read('rvpla05-residual-regressions-01/foreign-controlled/results.json'),resources:read('rvpla05-residual-final-01/results.json'),real,artifacts,binaries,limits:'No sums of overlapping cases. Profile is censored/negative; old-cost counterproof passed20s but restores structural costs. Raw logs retained, decoding/sanitization explicit. No release binary generated, no production performance claim.'};
fs.writeFileSync(path.join(out,'runtime-files.json'),JSON.stringify({at:new Date().toISOString(),files:inventory.length,hashes:inventory},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({runtimes:runtimes.length,artifacts:artifacts.length,inventoriedFiles:inventory.length,diagnosticBinaries:binaries.length,realInputs:real.inputsRestored,auditPassed:true}));
