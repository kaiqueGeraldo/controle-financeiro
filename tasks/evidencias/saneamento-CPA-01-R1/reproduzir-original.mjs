import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';

const repo=process.cwd(),out=import.meta.dirname,runtime=path.resolve(process.argv[2]??'');
assert.ok(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep)&&path.basename(runtime).startsWith('cpa01-r1-'));
assert.ok(!fs.existsSync(runtime));fs.mkdirSync(runtime,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const original='tasks/evidencias/revalidacao-CPA-01/executar.mjs',bytes=fs.readFileSync(original);
assert.deepEqual(bytes,execFileSync('git',['show','e837748a600c356e2e9d4f60291240cebf523916:'+original]));
const text=bytes.toString('utf8'),start=text.indexOf(" const require=createRequire("),end=text.indexOf(' // Re-run the original independent verifier');
assert.ok(start>0&&end>start);
// Exact original status proof and ALL its assertions. The surrounding review
// also runs Java/product probes; those unrelated sections are not repeated.
const section=text.slice(start,end);
const source=path.join(runtime,'source');fs.mkdirSync(path.join(source,'.github/workflows'),{recursive:true});
const workflow=execFileSync('git',['show','e837748a600c356e2e9d4f60291240cebf523916:.github/workflows/ci.yml']);
fs.writeFileSync(path.join(source,'.github/workflows/ci.yml'),workflow);
const wrapper=path.join(runtime,'original-workflow-proof.mjs');
fs.writeFileSync(wrapper,`import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import{createRequire}from 'node:module';const repo=${JSON.stringify(repo)},candidate='193916a1778f1322f5368f66d30a83286766b147';const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');const save=(name,value)=>fs.writeFileSync(path.join(${JSON.stringify(runtime)},name),JSON.stringify(value,null,2)+String.fromCharCode(10),{flag:'wx'});`+String.fromCharCode(10)+section);
const execution=spawnSync(process.execPath,[wrapper],{cwd:source,encoding:'utf8',windowsHide:true});
fs.writeFileSync(path.join(runtime,'original.log'),(execution.stdout??'')+(execution.stderr??''));assert.equal(execution.status,0,execution.stderr);
const result=JSON.parse(fs.readFileSync(path.join(runtime,'workflow-contrato.json')));
const failure=result.rows.find(r=>r.windowsResult==='failure');assert.equal(failure.requiredState,'skipped');assert.equal(failure.packageReachable,false);assert.equal(result.jobIf.required,null);
const receipt={at:new Date().toISOString(),runtime,original:{file:original,sha256:hash(bytes),excerptSha256:hash(section),assertionsUnchanged:true,scope:'Exact original workflow-status section only; Java/product sections not repeated'},workflowSha256:hash(workflow),controller:{platform:process.platform,node:process.version},exit:execution.status,logSha256:hash(fs.readFileSync(path.join(runtime,'original.log'))),result,proofKind:'Local original contract + official needs semantics; no Actions scheduler executed'};
fs.writeFileSync(path.join(out,'reproducao-original.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({windowsFailure:failure,requiredIf:result.jobIf.required,originalAssertionsUnchanged:true}));
