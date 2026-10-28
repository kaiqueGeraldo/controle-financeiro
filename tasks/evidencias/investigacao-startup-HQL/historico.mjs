import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const base=path.resolve('../controle-financeiro-runtimes/preparacao-adocao');
const out='tasks/evidencias/investigacao-startup-HQL';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const decode=s=>s.replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const specs=[
 ['p03','pg17-reports','AdoptionRuntimeTest','classes','pg17.log'],
 ['p05','jar-reports','AdoptionRuntimeTest','jar','jar.log'],
 ['p05','image-reports','AdoptionRuntimeTest','image','image.log'],
 ['p04','counterproofs/restored-witness-reports','AdoptionRuntimeTest','image','counterproofs/restored-witness.log'],
 ['revisao-20261026-01','original40-reports','AdoptionRuntimeTest','jar','original40.log'],
 ['saneamento-startup-01','original-three-reports','AdoptionRuntimeTest','jar','original-three.log'],
 ['tcp-nativo-20261028-01','historico-pg16-reports','PortLifecycleProbeTest','jar','historico-pg16.log']
];
const files=[];
function register(file){const rel=path.relative(process.cwd(),file).replaceAll('\\','/');const old=files.find(x=>x.file===rel);if(!old)files.push({file:rel,sha256:sha(file),bytes:fs.statSync(file).size});return rel;}
const markers=/Starting Controle|profiles? (?:is|are)|Finished Spring Data|Tomcat.*(?:initialized|started)|Added connection|Initialized JPA|HQL parser|Started Controle|Dispatcher|BindException|Port \d+ was already|APPLICATION FAILED|shutdown|MARKET:|open-in-view/;
const reports=[];
for(const [run,dir,clazz,mode,commandLog] of specs){
 const root=path.join(base,run),xmlFile=path.join(root,dir,`TEST-com.controlefinanceiro.api.migration.${clazz}.xml`);
 if(!fs.existsSync(xmlFile)){reports.push({run,dir,missing:xmlFile});continue;}
 const xml=fs.readFileSync(xmlFile,'utf8');register(xmlFile);
 const suite=xml.match(/<testsuite\b[^>]+>/)?.[0]??'';
 const commandFile=path.join(root,commandLog);if(fs.existsSync(commandFile))register(commandFile);
 const properties=Object.fromEntries([...xml.matchAll(/<property name="([^"]+)" value="([^"]*)"\s*\/>/g)].map(m=>[decode(m[1]),decode(m[2])]));
 const selected={};for(const key of ['java.version','java.vm.version','java.vendor','java.home','sun.java.command','preparation.jar','preparation.image','cf017.postgres.major','test','user.timezone'])if(properties[key])selected[key]=properties[key];
 const failures=[];
 for(const m of xml.matchAll(/<testcase\b[\s\S]*?<\/testcase>/g)){
  const testcase=m[0];if(!/<(?:failure|error)\b/.test(testcase))continue;
  const name=decode(testcase.match(/name="([^"]+)"/)?.[1]??'');
  const failure=decode(testcase.match(/<(?:failure|error)\b[\s\S]*?<\/(?:failure|error)>/)?.[0]??'');
  const ids=[...new Set([...testcase.matchAll(/(?:adoption-processes[\\/]|log=target[\\/]adoption-processes[\\/])([a-z0-9-]+\.log)/g)].map(m=>m[1]))];
  const logs=[];
  for(const id of ids){const f=path.join(root,'checkout/controle-financeiro-backend/target/adoption-processes',id);
   if(!fs.existsSync(f)){logs.push({id,missing:true});continue;}
   register(f);const text=fs.readFileSync(f,'utf8');
   logs.push({id,file:path.relative(process.cwd(),f).replaceAll('\\','/'),sha256:sha(f),milestones:text.split(/\r?\n/).filter(l=>markers.test(l)),lastLines:text.split(/\r?\n/).filter(Boolean).slice(-4),pid:text.match(/with PID (\d+)/)?.[1],postgres:text.match(/Database version: ([^\r\n]+)/)?.[1],jdbc:text.match(/Database JDBC URL \[([^\]]+)/)?.[1],applicationFailed:/APPLICATION FAILED/.test(text),bindFailure:/BindException|Port \d+ was already/.test(text)});
  }
  failures.push({name,junitSeconds:Number(testcase.match(/time="([^"]+)"/)?.[1]),endpoint:failure.match(/Expected HTTP \d+ at ([^;\s]+)/)?.[1]??null,
   classification:/BindException/.test(failure)?'post-readiness-bind-error':/Expected HTTP/.test(failure)?(logs.some(l=>l.bindFailure)?'startup-bind-failure':'startup-budget-not-explained-by-TCP'):'other',
   failureSnapshotMilestones:failure.split(/\r?\n/).filter(l=>markers.test(l)),logs});
 }
 reports.push({run,report:register(xmlFile),mode,commandLog:fs.existsSync(commandFile)?register(commandFile):null,
  suiteAttributes:suite,properties:selected,failures});
}
// Preserve the original stack-capture identities; do not copy entire historical trees.
const sampleRoot=path.join(base,'revisao-20261026-01/original40-samples');
const stacks=[];
for(const file of fs.readdirSync(sampleRoot)){
 const f=path.join(sampleRoot,file);if(!fs.statSync(f).isFile())continue;
 register(f);
 if(file.endsWith('-threads.txt')){
  const text=fs.readFileSync(f,'utf8').replaceAll('\0','');
  const main=text.match(/"main"[\s\S]*?(?=\n"|$)/)?.[0];
  stacks.push({file:path.relative(process.cwd(),f).replaceAll('\\','/'),sha256:sha(f),main:main??null,valid:!!main});
 }
}
fs.writeFileSync(path.join(out,'historico-verificado.json'),JSON.stringify({at:new Date().toISOString(),reports,stacks,files,
 limitations:'JUnit durations include preparation and cleanup, not measured bootstrap. No historical exact process t0/CPU-load/exit-before-cleanup is invented. Reports overlap; totals must not be added.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(reports.map(r=>({run:r.run,report:r.report,missing:r.missing,failures:r.failures?.map(f=>({name:f.name,endpoint:f.endpoint,classification:f.classification,logs:f.logs.map(l=>l.id)}))})),null,2));
