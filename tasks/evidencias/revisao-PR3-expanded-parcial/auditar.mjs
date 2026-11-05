import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),original=path.dirname(execFileSync('git',['rev-parse','--path-format=absolute','--git-common-dir'],{cwd:root,encoding:'utf8',windowsHide:true}).trim());
const runtime=path.resolve(process.argv[2]);
const old=path.resolve(original,'../controle-financeiro-runtimes/preparacao-adocao/pr3-expanded-20261029-01');
const remote=path.resolve(old,'../ci-remota-20261028-01');
const read=f=>JSON.parse(fs.readFileSync(f));
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
function counts(text){const head=text.match(/<testsuite\b[^>]*>/)?.[0];return Object.fromEntries(['tests','failures','errors','skipped'].map(k=>[k,Number(head?.match(new RegExp(`\\b${k}="(\\d+)"`))?.[1])]));}
// Read ZIP entries in memory, without extracting or modifying historical evidence.
function zip(file){
 const b=fs.readFileSync(file);let e=b.length-22;
 while(e>=Math.max(0,b.length-65557)&&b.readUInt32LE(e)!==0x06054b50)e--;
 assert.ok(e>=0,'ZIP central directory');let c=b.readUInt32LE(e+16),n=b.readUInt16LE(e+10),entries=new Map();
 for(let i=0;i<n;i++){
  assert.equal(b.readUInt32LE(c),0x02014b50);
  const method=b.readUInt16LE(c+10),size=b.readUInt32LE(c+20),len=b.readUInt16LE(c+28),extra=b.readUInt16LE(c+30),comment=b.readUInt16LE(c+32),offset=b.readUInt32LE(c+42),name=b.subarray(c+46,c+46+len).toString();
  const start=offset+30+b.readUInt16LE(offset+26)+b.readUInt16LE(offset+28),data=b.subarray(start,start+size);
  entries.set(name,()=>{assert.ok(method===0||method===8);return (method===8?inflateRawSync(data):data).toString('utf8');});c+=46+len+extra+comment;
 }return entries;
}
const history=read(path.join(root,'tasks/evidencias/saneamento-PR3-expanded/validacao.json'));
const runs=history.runs.map(r=>{
 const loopback=r.label==='linux-loopback',dir=path.join(old,loopback?'linux-fixtures':r.label),record=path.join(dir,loopback?'loopback-execution.json':'execution.json'),log=path.join(dir,loopback?'loopback.log':'maven.log');
 const reports=(r.reports??[]).map(p=>{const file=path.join(dir,loopback?'loopback-surefire':'surefire',p.file);assert.equal(hash(file),p.sha256);return {file:p.file,sha256:hash(file),counts:counts(fs.readFileSync(file,'utf8'))};});
 assert.equal(hash(record),r.recordSha256);assert.equal(hash(log),r.logSha256);
 return {label:r.label,recordSha256:hash(record),logSha256:hash(log),exit:r.exit,started:r.started,finished:r.finished,reports};
});
const sources=read(path.join(root,'tasks/evidencias/saneamento-PR3-expanded/conferencia-final.json')).sources.map(f=>{assert.equal(hash(path.join(root,f.file)),f.sha256);return {file:f.file,sha256:f.sha256,proofInputs:f.proofInputs};});
const traces=[];
for(const f of walk(old).filter(f=>f.endsWith('.zip')&&f.includes('browsers')&&(f.includes('directed-affected')||f.includes('auth-clock-mutant')||f.includes('after-opening')))){
 const entries=zip(f),network=[],events=[];
 for(const [name,get] of entries){
  if(!/\.(network|trace)$/.test(name))continue;
  for(const line of get().split('\n').filter(Boolean)){
   let event;try{event=JSON.parse(line);}catch{continue;}
   const s=event.snapshot;if(s?.request?.url){
    const pathname=new URL(s.request.url).pathname;
    if(pathname.startsWith('/api/')){
     const item={method:s.request.method,path:pathname,status:s.response.status};
     const bodyHash=s.response.content?._sha1,bodyFile=s.response.content?._file??(bodyHash?'resources/'+bodyHash:undefined);
     if(bodyFile&&entries.has(bodyFile)&&/\/api\/(dashboard\/flow|investments|goals)/.test(pathname)&&s.response.status===200){
      try{const body=JSON.parse(entries.get(bodyFile)());
       if(pathname.endsWith('/flow'))item.flow={income:body.income,expense:body.expense,investmentResult:body.investmentResult,coverage:body.coverage,observed:body.observed};
      }catch{}
     }
     network.push(item);
    }
   }
   if(event.type==='before'&&['boundingBox','selectOption','click'].includes(event.method))events.push({type:'before',callId:event.callId,method:event.method,selector:event.params?.selector});
   if(event.type==='after'&&(event.error||event.result?.value===null))events.push({type:'after',callId:event.callId,error:event.error?.message,result:event.result});
  }
 }
 traces.push({file:path.relative(old,f),sha256:hash(f),network,events});
}
const remoteZip=path.join(remote,'dispatch-expanded.zip'),remoteLog=path.join(remote,'dispatch-expanded/backend.log');
assert.equal(hash(remoteZip),'d55c613d47eede475c71700f1ea06250b8b92f7e131b6f9dec914decdd193598');
assert.equal(hash(remoteLog),'4b61514685e034041c6c42d330dede8be5942994d7aa821898deb60c95b19037');
const remoteEntries=[...zip(remoteZip).keys()];
const log=fs.readFileSync(remoteLog,'utf8').split('\n');
const remoteFailures=log.flatMap((line,i)=>/Tests run:.*<<< (FAILURE|ERROR)! -- in/.test(line)?[{line:i+1,text:line,assertion:log.slice(i+1,i+8).join('\n')}]:[]);
assert.equal(remoteFailures.length,6);
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const report={at:new Date(),oldRuntime:old,remoteRuntime:remote,runs,sources,traces,remote:{zipSha256:hash(remoteZip),logSha256:hash(remoteLog),entries:remoteEntries,rawXmlOrTraces:remoteEntries.filter(n=>/\.xml$|trace.*\.zip|playwright.*\.json/.test(n)),failures:remoteFailures},diffNames:git('diff','--name-only','1c4173f2..26dce7db').split('\n'),gatesDiff:git('diff','1c4173f2..26dce7db','--','.github','controle-financeiro-backend/src/main','controle-financeiro-frontend/src','controle-financeiro-backend/pom.xml','controle-financeiro-frontend/package.json','controle-financeiro-frontend/package-lock.json')};
assert.equal(report.gatesDiff,'');
fs.writeFileSync(path.join(runtime,'historical-audit-private.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({runs:runs.length,rawReports:runs.reduce((n,r)=>n+r.reports.length,0),sources:sources.length,traces:traces.length,remoteFailures:remoteFailures.length,remoteRawXmlOrTraces:report.remote.rawXmlOrTraces,productGatesDependencyDiffEmpty:true}));
