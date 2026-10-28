import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.argv[2]),variant=process.argv[3]??'current';
assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-')));
assert.equal(fs.existsSync(root),false);fs.mkdirSync(root);
assert.ok(['current','profile','old-checks'].includes(variant));
fs.writeFileSync(path.join(root,'environment.json'),JSON.stringify({at:new Date().toISOString(),node:process.version,uv:process.versions.uv,platform:process.platform,architecture:process.arch,release:os.release(),logicalCpus:os.cpus().length,cpuModel:os.cpus()[0]?.model,totalMemoryBytes:os.totalmem(),freeMemoryBytes:os.freemem(),javaHome:process.env.JAVA_HOME,noArtificialWarmup:true,osCachesNotReset:true},null,2)+'\n');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const source='tasks/evidencias/preparacao-local-adocao/',snapshot=path.join(root,'snapshot');
const modules=['.github/scripts/owned-process.mjs','.github/scripts/owned-process.ps1','.github/scripts/owned-job-probe.ps1','.github/scripts/owned-command.mjs',...['counterproofs.mjs','counterproof-supervision.mjs','counterproof-checkpoint.mjs','counterproof-observation.mjs'].map(f=>source+f)];
const originals=new Map(),sourceHashes={};
for(const file of modules){const b=fs.readFileSync(file),to=path.join(snapshot,file);fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b);originals.set(to,b);sourceHashes[file]=sha(b);}
function oldEnvironment(code){return code.slice(code.indexOf('function verifyEnvironment() {'),code.indexOf('\nconst store=new ProofStore'));}
let executedHash;
if(variant==='old-checks') {
  const file=path.join(snapshot,source+'counterproofs.mjs'),current=fs.readFileSync(file,'utf8');
  const old=execFileSync('git',['show','acaa6ed9374f8c9a205d92955f0f4f946b17aa8a:'+source+'counterproofs.mjs'],{encoding:'utf8'});
  const after=current.replace(oldEnvironment(current),oldEnvironment(old)).replace('superviseCounterproof,runOwnedCommand,','superviseCounterproof,verifyOwnedBoundary,runOwnedCommand,');assert.notEqual(after,current);
  fs.writeFileSync(file,after);executedHash=sha(after);
}
if(variant==='profile') {
  const file=path.join(snapshot,'.github/scripts/owned-job-probe.ps1');let code=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');
  const mark=phase=>`if($env:RESIDUAL_JOB_TRACE){[IO.File]::AppendAllText((Join-Path $env:RESIDUAL_JOB_TRACE ($PID.ToString()+'.tsv')),('${phase}'+[char]9+[Diagnostics.Stopwatch]::GetTimestamp()+[char]9+[Diagnostics.Stopwatch]::Frequency+[char]10))}`;
  code=code.replace("$ErrorActionPreference='Stop'","$ErrorActionPreference='Stop'\n"+mark('script-enter'));
  const method='static void Mark(string phase){var dir=Environment.GetEnvironmentVariable("RESIDUAL_JOB_TRACE");if(dir!=null)System.IO.File.AppendAllText(System.IO.Path.Combine(dir,Process.GetCurrentProcess().Id+".tsv"),phase+"\\t"+Stopwatch.GetTimestamp()+"\\t"+Stopwatch.Frequency+"\\n");}\n';
  code=code.replace(' public static string[] Members(string name) {',method+' public static string[] Members(string name) { Mark("members-enter");');
  code=code.replace('finally{Marshal.FreeHGlobal(b);CloseHandle(h);}','finally{Marshal.FreeHGlobal(b);CloseHandle(h);Mark("members-leave");}');
  code=code.replace(' public static long[] Counts(string name,int workerPid) {',' public static long[] Counts(string name,int workerPid) { Mark("counts-enter");');
  code=code.replace('}finally{CloseHandle(h);}','}finally{CloseHandle(h);Mark("counts-leave");}');
  code=code.replace('$config=[Text.Encoding]',mark('type-ready')+'\n$config=[Text.Encoding]');
  code=code.replaceAll('exit 0',mark('reply-ready')+';exit 0');
  assert.notEqual(code,originals.get(file).toString());fs.writeFileSync(file,code);executedHash=sha(code);
}
const tools=path.join(root,'tools');fs.mkdirSync(tools);
const original=fs.readFileSync('tasks/evidencias/saneamento-RVPLA-03/process-probes.mjs');
const adapted=original.toString().replaceAll('preparacao-adocao/rvpla03-','preparacao-adocao/rvpla05-residual-');
fs.writeFileSync(path.join(tools,'process-probes.mjs'),adapted);
for(const file of ['OwnedTree.java','tool-fixture.ps1','stop-own.ps1'])fs.copyFileSync('tasks/evidencias/saneamento-RVPLA-03/'+file,path.join(tools,file));
const metrics=path.join(root,'metrics');if(variant==='profile')fs.mkdirSync(metrics);
const trace=path.join(import.meta.dirname,'trace.mjs'),fd=fs.openSync(path.join(root,'probe.log'),'wx');
let status,error;const begin=process.hrtime.bigint();
try {
  const result=spawnSync(process.execPath,['--import',pathToFileURL(trace).href,path.join(tools,'process-probes.mjs'),path.join(root,'execution'),path.join(snapshot,source+'counterproofs.mjs'),'control'],{env:{...process.env,RESIDUAL_TRACE_ROOT:path.join(root,'execution'),RESIDUAL_TRACE_LOG:path.join(root,'trace.jsonl'),...(variant==='profile'?{RESIDUAL_JOB_TRACE:metrics}:{})},windowsHide:true,stdio:['ignore',fd,fd]});
  status=result.status;error=result.error?.message;
}finally{fs.closeSync(fd);for(const[file,bytes]of originals)fs.writeFileSync(file,bytes);}
const rows=fs.readFileSync(path.join(root,'trace.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const b=rows.find(r=>r.event==='spawned'&&r.resume&&r.executable.toLowerCase().startsWith('node'));
const close=b?rows.find(r=>r.event==='child-close'&&r.pid===b.pid&&r.childPid===b.childPid):null;
const cut=b?rows.find(r=>r.event==='execFileSync-start'&&r.pid===b.pid&&r.mode==='identity'&&r.targetPid===b.childPid):null;
const own=b?rows.filter(r=>r.pid===b.childPid):[],queries=own.filter(r=>r.event==='execFileSync-end'),guardians=own.filter(r=>r.event==='spawned');
const restored=Object.fromEntries([...originals].map(([file,bytes])=>{assert.equal(sha(fs.readFileSync(file)),sha(bytes));return[path.relative(snapshot,file),sha(bytes)];}));
const result={variant,status,error,totalScriptMs:Number(process.hrtime.bigint()-begin)/1e6,resumePid:b?.childPid,resumeCloseMs:close?Number(BigInt(close.ns)-BigInt(b.ns))/1e6:null,deadlineCleanupMs:cut?Number(BigInt(cut.ns)-BigInt(b.ns))/1e6:null,originalGatePassed:status===0&&!cut,queryCount:queries.length,queryMs:queries.reduce((n,r)=>n+r.ms,0),queries:queries.map(r=>({mode:r.mode,jobName:r.jobName,ms:r.ms})),guardianCount:guardians.length,commandGuardianCount:guardians.filter(r=>r.kind==='command').length,tools:guardians.filter(r=>r.kind==='command').map(r=>r.tool),originalProbeSha256:sha(original),adaptedProbeSha256:sha(adapted),traceSha256:sha(fs.readFileSync(trace)),sourceHashes,executedHash,restored,node:process.version,uv:process.versions.uv,javaHome:process.env.JAVA_HOME,appendOverhead:rows.filter(r=>r.event==='process-exit').map(r=>({pid:r.pid,ms:r.instrumentationAppendMs}))};
fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,queries:undefined,sourceHashes:undefined,restored:undefined,appendOverhead:undefined}));
