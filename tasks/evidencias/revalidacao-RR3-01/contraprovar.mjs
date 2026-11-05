import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const runtime=path.resolve(process.argv[2]),dir=import.meta.dirname,run=(script,args,env={})=>spawnSync(process.execPath,[path.join(dir,script),...args],{env:{...process.env,...env},stdio:'inherit',windowsHide:true}).status,stages=[];
assert.equal(run('provas-originais.mjs',['old',runtime]),0);
try{
 stages.push({label:'old-original-static',exit:run('provas-originais.mjs',['static',runtime,'old-original-static'])});
 stages.push({label:'old-original-live',exit:run('executar.mjs',['run',runtime,'old-original-live','IndependentRR3LiveProbe'],{REVALIDATE_GREP:'Independent live reason'})});
 assert.ok(stages.every(s=>s.exit===1));
}finally{assert.equal(run('provas-originais.mjs',['restore',runtime]),0);}
stages.push({label:'restored-original-static',exit:run('provas-originais.mjs',['static',runtime,'restored-original-static'])});
stages.push({label:'restored-original-live',exit:run('executar.mjs',['run',runtime,'restored-original-live','IndependentRR3LiveProbe'],{REVALIDATE_GREP:'Independent live reason'})});
fs.writeFileSync(path.join(runtime,'counterproof-complete.json'),JSON.stringify({at:new Date(),stages,allRestored:true},null,2)+'\n',{flag:'wx'});assert.ok(stages.slice(2).every(s=>s.exit===0));
