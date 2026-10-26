import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve('../controle-financeiro-runtimes/preparacao-adocao');
const out='tasks/evidencias/revisao-preparacao-local-adocao';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const reports=[];
for(const run of ['p03','p04','p05']) {
  for(const entry of fs.readdirSync(path.join(root,run),{withFileTypes:true})) {
    if(!entry.isDirectory()||!entry.name.endsWith('reports'))continue;
    const p=path.join(root,run,entry.name,'TEST-com.controlefinanceiro.api.migration.AdoptionRuntimeTest.xml');
    if(!fs.existsSync(p))continue;
    const xml=fs.readFileSync(p,'utf8');
    const cases=[...xml.matchAll(/<testcase\b[\s\S]*?<\/testcase>/g)].map(m=>{
      const text=m[0],failed=/<failure\b/.test(text);
      const logs=[...text.matchAll(/log=target[\\/]adoption-processes[\\/]([a-z0-9-]+\.log)/g)].map(x=>x[1]);
      return {name:text.match(/name="([^"]+)"/)?.[1],seconds:Number(text.match(/time="([^"]+)"/)?.[1]),failed,
        logs:[...new Set(logs)].map(file=>{
          const log=path.join(root,run,'checkout/controle-financeiro-backend/target/adoption-processes',file);
          if(!fs.existsSync(log))return {file,missing:true};
          const lines=fs.readFileSync(log,'utf8').split(/\r?\n/);
          return {file,sha256:sha(log),milestones:lines.filter(l=>/Starting Controle|profiles? (?:is|are)|HikariPool.*(?:Starting|Added|Start completed)|Flyway|Hibernate|HHH000204|EntityManagerFactory|Tomcat.*(?:initialized|started)|Root WebApplicationContext|Started Controle|DispatcherServlet|MARKET|shutdown|Unsafe adoption|SchemaManagementException/.test(l))};
        })};
    });
    reports.push({run,report:entry.name,sha256:sha(p),cases});
  }
}
fs.writeFileSync(path.join(out,'startups-originais.json'),JSON.stringify({at:new Date().toISOString(),reports},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(reports.map(r=>({run:r.run,report:r.report,cases:r.cases.length,failures:r.cases.filter(c=>c.failed).map(c=>({name:c.name,seconds:c.seconds,logs:c.logs.map(l=>l.file)}))})),null,2));
