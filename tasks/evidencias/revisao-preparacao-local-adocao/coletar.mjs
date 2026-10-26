import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const run=path.resolve(process.argv[2]??'');
const allowed=path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep;
if(!run.startsWith(allowed)||!path.basename(run).startsWith('revisao-'))throw new Error('Runtime de revisão exigido');
const out='tasks/evidencias/revisao-preparacao-local-adocao';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sha=p=>hash(fs.readFileSync(p));
const rows=[];
function sanitize(text){return text
  .replace(/jdbc:postgresql:\/\/[^\s\]<>"']+/gi,'<JDBC_LOCAL_WITHHELD>')
  .replace(/(Bearer\s+)[A-Za-z0-9_.-]+/g,'$1<TOKEN_WITHHELD>')
  .replace(/(password\s*[=:]\s*)[^\s,;]+/gi,'$1<PASSWORD_WITHHELD>');}
function copy(relative,dest=relative,sourceRoot=run){
  const src=path.join(sourceRoot,relative);if(!fs.existsSync(src))return;
  const bytes=fs.readFileSync(src),clean=Buffer.from(sanitize(bytes.toString('utf8')));
  const target=path.join(out,'execucao',dest);fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,clean,{flag:'wx'});
  rows.push({source:path.relative(run,src),sourceSha256:hash(bytes),collected:path.relative(out,target),collectedSha256:hash(clean),sanitized:!bytes.equals(clean)});
}
function suite(folder){
  const dir=path.join(run,folder);if(!fs.existsSync(dir))return null;
  const files=fs.readdirSync(dir).filter(f=>/^TEST-.*\.xml$/.test(f));
  const reports=files.map(file=>{
    const xml=fs.readFileSync(path.join(dir,file),'utf8'),tag=xml.match(/<testsuite\b[^>]*>/)?.[0];
    const counts={};for(const key of ['tests','failures','errors','skipped'])counts[key]=Number(tag?.match(new RegExp('\\b'+key+'="(\\d+)"'))?.[1]??NaN);
    if(Object.values(counts).some(n=>!Number.isFinite(n)))throw new Error('Relatório incompleto '+file);
    const cases=[...xml.matchAll(/<testcase\b[\s\S]*?(?:<\/testcase>|\/>)/g)].map(m=>{
      const c=m[0];return {name:c.match(/\bname="([^"]+)"/)?.[1],seconds:Number(c.match(/\btime="([^"]+)"/)?.[1]??0),
        failed:/<(?:failure|error)\b/.test(c),processes:[...c.matchAll(/ADOPTION_PROCESS[^\r\n<]*/g)].map(x=>x[0])};});
    return {file,sha256:sha(path.join(dir,file)),...counts,cases};
  });
  const totals={tests:0,failures:0,errors:0,skipped:0};for(const r of reports)for(const k of Object.keys(totals))totals[k]+=r[k];
  return {directory:folder,classes:files.length,totals,reports};
}
const reports={};
for(const folder of ['pg17-reports','pg16-reports','startup-reports','original40-reports'])reports[folder]=suite(folder);
for(const dir of ['counterproofs','counterproofs-independent'])if(fs.existsSync(path.join(run,dir))){
  for(const entry of fs.readdirSync(path.join(run,dir),{withFileTypes:true}))
    if(entry.isDirectory()&&entry.name.endsWith('-reports'))reports[dir+'/'+entry.name]=suite(dir+'/'+entry.name);
}
for(const file of ['pg17-independent.log','pg17-independent-02.log','pg16-independent.log','startup-diagnostic.log','original40.log','counterproofs-independent.log','counterproofs-directed.log','frontend-install.log','bff.log','bff.json','startup/results.json','original40-samples/samples.json','counterproofs/results.json','counterproofs/witness.json','image-verification.json','package-counterproof-independent.json'])copy(file);
for(const dir of ['startup','original40-samples','counterproofs','counterproofs-independent']){
  const full=path.join(run,dir);if(!fs.existsSync(full))continue;
  for(const e of fs.readdirSync(full,{withFileTypes:true}))if(e.isFile()&&/\.(log|txt|json)$/.test(e.name)
    &&!rows.some(r=>r.source===path.join(dir,e.name)))copy(path.join(dir,e.name));
}
const secondary=process.argv[3]?path.resolve(process.argv[3]):null;
if(secondary){
  if(!secondary.startsWith(allowed)||!path.basename(secondary).startsWith('revisao-'))throw new Error('Segundo runtime inválido');
  for(const file of fs.readdirSync(secondary))if(/^hql-.*\.(?:log|json)$/.test(file))copy(file,path.join('hql',file),secondary);
}
const procdir='checkout/controle-financeiro-backend/target/adoption-processes';
if(fs.existsSync(path.join(run,procdir)))for(const file of fs.readdirSync(path.join(run,procdir)))copy(path.join(procdir,file),path.join('processos',file));
const bff=fs.existsSync(path.join(run,'bff.json'))?JSON.parse(fs.readFileSync(path.join(run,'bff.json'))):null;
const summary={at:new Date().toISOString(),runtime:run,reports,bff:bff?{tests:bff.numTotalTests,failed:bff.numFailedTests,pending:bff.numPendingTests,errors:bff.numRuntimeErrorTestSuites}:null,
  collection:rows,scope:'Fresh directed executions; do not add overlapping diagnostic/original/counterproof cases to claim a full financial suite. Original raw logs remain external.'};
fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({reports:Object.fromEntries(Object.entries(reports).map(([k,v])=>[k,v?.totals??null])),bff:summary.bff,files:rows.length}));
