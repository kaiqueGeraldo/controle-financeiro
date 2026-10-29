import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const runtime=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),read=file=>JSON.parse(fs.readFileSync(file));
const base='1c4173f2e9a8bd459a9f2ecd4acf2d803245be88';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim();
const labels=['directed-affected','restored-fixture-control','auth-restored-control','opening-restored-control'];
const inputs=labels.map(label=>({label,items:read(path.join(runtime,label,'inputs.json'))}));
const files=git('diff','--name-only',base,'HEAD').split('\n').filter(f=>f.startsWith('controle-financeiro-'));
const sources=files.map(file=>{const sha256=hash(fs.readFileSync(path.join(root,file)));const proofs=inputs.filter(p=>p.items.some(i=>i.file===file&&i.sha256===sha256)).map(p=>p.label);assert.ok(proofs.length,file+' is not bound to tested bytes');return {file,sha256,proofInputs:proofs};});
for(const name of ['fixture','auth','opening']){
 const receipt=read(path.join(runtime,name+'-counterproof.json'));
 if(name==='fixture')assert.ok(receipt.files.length===2&&receipt.files.every(f=>f.restored===true));else assert.equal(receipt.restored,true);
 assert.deepEqual(receipt.steps.map(s=>s.exit),[1,0]);
}
const preservation=read(path.join(runtime,'preservation-final.json'));assert.equal(preservation.priorManifest.checked,97);assert.deepEqual(preservation.priorManifest.differences,[]);
const summary={at:new Date(),base,codeHead:git('rev-parse','HEAD'),commits:git('log','--format=%H %s',base+'..HEAD').split('\n'),sources,preservation:{readmeSha256:preservation.files[0].sha256,priorManifest:preservation.priorManifest,initialReceiptSha256:hash(fs.readFileSync(path.join(runtime,'preservation-initial.json'))),finalReceiptSha256:hash(fs.readFileSync(path.join(runtime,'preservation-final.json')))},resources:{ownJavaNodeChromeProcessesObserved:0,activeTestcontainersObserved:0,scope:'CIM filtered by this checkout/runtime and Docker label, inspected after all tests; no global cleanup'},checks:read(path.join(runtime,'checks-final.json')),approval:'not granted; local partial remediation awaiting independent review; remote failure remains open'};
fs.writeFileSync(path.join(import.meta.dirname,'conferencia-final.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({sources:sources.length,allBoundToTestedBytes:true,protected:97,codeHead:summary.codeHead}));
