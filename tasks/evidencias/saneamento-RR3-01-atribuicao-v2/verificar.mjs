import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const rt=path.resolve(process.argv[2]),label=process.argv[3]??'checks',root=path.resolve(import.meta.dirname,'../../..'),front=path.join(root,'controle-financeiro-frontend'),out=path.join(rt,label);fs.mkdirSync(out);
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),records=[];
for(const [name,args,cwd] of [
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false','--project','tsconfig.json'],front],
 ['lint',['node_modules/eslint/bin/eslint.js','tests/e2e/support/text-geometry.ts','tests/e2e/support/text-paint.mjs','tests/e2e/support/text-paint.d.mts','tests/e2e/text-paint.observer.spec.ts','tests/e2e/playwright.text-geometry.config.ts','--max-warnings=0','--format=json','--output-file',path.join(out,'eslint.json')],front],
 ['ci',['--test','--test-reporter=tap','.github/scripts/ci.test.mjs','.github/scripts/required.test.mjs','.github/scripts/suites.test.mjs','.github/scripts/sanitize.test.mjs'],root]
]){
 const file=path.join(out,name+'.log'),fd=fs.openSync(file,'wx'),start=new Date(),r=spawnSync(process.execPath,args,{cwd,env:process.env,windowsHide:true,stdio:['ignore',fd,fd],timeout:180000});fs.closeSync(fd);
 records.push({name,args,cwd,start,finished:new Date(),exit:r.status,logSha256:sha(file),error:r.error?.message});fs.writeFileSync(path.join(out,'executions.json'),JSON.stringify(records,null,2)+'\n');console.log(JSON.stringify(records.at(-1)));
}
assert.ok(records.every(r=>r.exit===0),'inspect directed checks');
