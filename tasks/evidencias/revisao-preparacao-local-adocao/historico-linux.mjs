import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const run=path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p04');
const file=path.join(run,'counterproofs/restored-witness-reports/TEST-com.controlefinanceiro.api.migration.AdoptionRuntimeTest.xml');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const xml=fs.readFileSync(file,'utf8');
const cases=[...xml.matchAll(/<testcase\b[\s\S]*?<\/testcase>/g)].map(m=>{
  const s=m[0];return {name:s.match(/name="([^"]+)"/)?.[1],failed:s.includes('<failure'),
    logs:[...new Set([...s.matchAll(/log=target[\\/]adoption-processes[\\/]([a-z0-9-]+\.log)/g)].map(x=>x[1]))].map(name=>{
      const p=path.join(run,'checkout/controle-financeiro-backend/target/adoption-processes',name);
      return {file:name,sha256:sha(p),milestones:fs.readFileSync(p,'utf8').split(/\r?\n/).filter(l=>/Starting Controle|profile is active|Tomcat (?:initialized|started)|HikariPool.*(?:Starting|Added connection|Start completed)|EntityManagerFactory|QueryEnhancerFactories|Started Controle/.test(l))};
    })};
});
const result={at:new Date().toISOString(),source:file,sourceSha256:sha(file),cases,
  limit:'Read-only extraction of the original p04 restored Linux witness, not a rerun; historical resource samples are unavailable.'};
fs.writeFileSync('tasks/evidencias/revisao-preparacao-local-adocao/startups-linux-originais.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({cases:cases.length,failures:cases.filter(x=>x.failed).length,logs:cases.flatMap(x=>x.logs).length}));
