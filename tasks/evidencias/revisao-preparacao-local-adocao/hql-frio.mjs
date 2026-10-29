import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(process.argv[2]);
if(!root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep))throw new Error('Runtime de revisão');
const jar=path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar');
const java=path.resolve('controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1/bin/java.exe');
const entries=fs.readFileSync(path.join(root,'hql-parser.log'),'utf8').split(/\r?\n/).filter(l=>l.startsWith('{')).map(l=>JSON.parse(l));
const selected=entries.filter(x=>x.event==='begin').sort((a,b)=>b.chars-a.chars).slice(0,5);
const results=[];let i=0;
for(const x of selected){
  const file=path.join(root,'hql-cold-'+(++i)+'.log'),fd=fs.openSync(file,'wx');
  const start=performance.now();let result;
  try{result=spawnSync(java,['-Xmx384m','-Dloader.main=HqlParserProbe','-Dloader.path='+path.join(root,'probe-classes'),
    '-cp',jar,'org.springframework.boot.loader.launch.PropertiesLauncher',jar,x.method],{stdio:['ignore',fd,fd],timeout:30000});}
  finally{fs.closeSync(fd);}
  results.push({method:x.method,querySha256:x.sha256,chars:x.chars,status:result.status,error:result.error?.code,
    processMs:performance.now()-start,deadlineMs:30000,log:path.basename(file)});
}
fs.writeFileSync(path.join(root,'hql-cold-results.json'),JSON.stringify({at:new Date().toISOString(),
  scope:'Five longest HQL annotations each parsed first in a fresh JVM; no Spring context or database. Not an application startup acceptance test.',results},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(results));
