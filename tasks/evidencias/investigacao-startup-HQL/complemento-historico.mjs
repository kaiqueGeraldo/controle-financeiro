import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const out='tasks/evidencias/investigacao-startup-HQL';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base='../controle-financeiro-runtimes/preparacao-adocao';
const specs=[
 ['revalidacao-20261027-01','porta-pg16-reports','PortLifecycleProbeTest'],
 ['revalidacao-20261027-01','porta-pg17-reports','PortLifecycleProbeTest'],
 ['revisao-20261026-01','counterproofs/writer-passes-maintenance-reports','AdoptionRuntimeTest']
];
const reports=[];
for(const [run,dir,clazz] of specs){
 const file=path.join(base,run,dir,`TEST-com.controlefinanceiro.api.migration.${clazz}.xml`),xml=fs.readFileSync(file,'utf8');
 const failures=[...xml.matchAll(/<testcase\b[\s\S]*?<\/testcase>/g)].filter(m=>/<(?:failure|error)\b/.test(m[0])).map(m=>{
  const s=m[0],failure=s.match(/<(?:failure|error)\b[\s\S]*?<\/(?:failure|error)>/)?.[0];
  return {name:s.match(/name="([^"]+)"/)?.[1],seconds:Number(s.match(/time="([^"]+)"/)?.[1]),
   classification:/BindException/.test(failure)?'post-readiness-bind-error':/Expected HTTP/.test(failure)?'startup-budget':'other-expected-or-functional-failure',
   failureSnapshot:failure?.replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&')};
 });
 reports.push({file,sha256:sha(file),failures});
}
const parserLog=path.join(base,'revisao-20261026-02/hql-parser-nested.log');
const catalogue=fs.readFileSync(parserLog,'utf8').trim().split(/\r?\n/).map(l=>JSON.parse(l)).filter(x=>x.event==='begin');
const current=JSON.parse(fs.readFileSync(path.join(out,'resultados.json')));
const mappings=[];
for(const r of current.records.filter(r=>r.hql))for(const query of r.queries){
 const match=catalogue.find(c=>c.sha256===query.hash);
 if(query.origin.endsWith('.forHql'))assert.ok(match,'Enhancer input must map to unchanged packaged annotation');
 const tagged=match??catalogue.find(c=>query.method.includes(c.method.replace('#','.')));
 assert.ok(tagged,'Every call must identify a repository method');
 assert.ok(query.method.includes(tagged.method.replace('#','.')),'Live constructor/method tag must match packaged metadata');
 mappings.push({scenario:r.name,hash:query.hash,origin:query.origin,method:tagged.method,kind:tagged.kind,
  hashMatchesPackagedAnnotation:!!match,mappingKind:match?'annotation-hash':'live-method-after-query-enhancement'});
}
const hqlSets=current.records.filter(r=>r.hql).map(r=>r.queries.filter(q=>q.origin.endsWith('.forHql')).map(q=>q.hash));
fs.writeFileSync(path.join(out,'historico-complemento.json'),JSON.stringify({reports,metadata:{file:parserLog,sha256:sha(parserLog),catalogueQueries:catalogue.length,verifiedLiveCalls:mappings.length,mappings,
 hqlHashSetsEqual:JSON.stringify([...hqlSets[0]].sort())===JSON.stringify([...hqlSets[1]].sort()),hqlSequenceEqual:JSON.stringify(hqlSets[0])===JSON.stringify(hqlSets[1])}},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({reports:reports.map(r=>({file:r.file,failures:r.failures.map(f=>({name:f.name,classification:f.classification}))})),liveCalls:mappings.length,hashMatchedCalls:mappings.filter(m=>m.hashMatchesPackagedAnnotation).length,catalogueQueries:catalogue.length}));
