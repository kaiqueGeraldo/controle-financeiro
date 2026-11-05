import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const runtime=path.resolve(process.argv[2]),out=import.meta.dirname,stages=[],file=path.join(runtime,'sequence-progress.json');
const run=(name,args,env={})=>{const result=spawnSync(process.execPath,[path.join(out,name),...args],{env:{...process.env,...env},windowsHide:true,stdio:'inherit'});return result.status;};
for(const [kind,grep,classes]of [
 ['clock','SAN-D1 ',['MilestoneRemediationBrowserTest']],
 ['credential','', ['UserIsolationBrowserIntegrationTest']]
]){
 const stage={kind,started:new Date(),restored:false};stages.push(stage);fs.writeFileSync(file,JSON.stringify(stages,null,2)+'\n');
 assert.equal(run('contraprovar.mjs',['apply',runtime,kind]),0);
 try {stage.exit=run('executar.mjs',['run',runtime,'counter-'+kind,...classes],{REVALIDATE_GREP:grep});}
 finally {assert.equal(run('contraprovar.mjs',['restore',runtime,kind]),0);stage.restored=true;stage.finished=new Date();fs.writeFileSync(file,JSON.stringify(stages,null,2)+'\n');}
 if(kind!=='clock')assert.equal(stage.exit,1,'counterproof must fail for its intended mechanism; inspect reports');
}
console.log(JSON.stringify({stages}));
