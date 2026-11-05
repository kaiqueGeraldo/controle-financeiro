import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const [mode,arg]=process.argv.slice(2),rt=path.resolve(arg),root=path.resolve(import.meta.dirname,'../../..'),subject=path.join(rt,'s'),front=path.join(subject,'f'),out=path.join(rt,mode);assert.match(path.basename(rt),/^revalidacao-rr3-01-v2-/);fs.mkdirSync(out);
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),records=[];
function run(name,args,cwd,expected=0,extra={}){
 const log=path.join(out,name+'.log'),fd=fs.openSync(log,'wx'),temp=path.join(out,name+'-temp');fs.mkdirSync(temp);const started=new Date(),r=spawnSync(process.execPath,args,{cwd,env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:'0',NEXT_TELEMETRY_DISABLED:'1',TEMP:temp,TMP:temp,...extra},windowsHide:true,stdio:['ignore',fd,fd],timeout:5*60*1000});fs.closeSync(fd);
 records.push({name,args,cwd,started,finished:new Date(),exit:r.status,expected,error:r.error?.message,logSha256:sha(log)});fs.writeFileSync(path.join(out,'executions.json'),JSON.stringify(records,null,2)+'\n');console.log(JSON.stringify(records.at(-1)));return r.status===expected;
}
let good=true;
if(mode==='originais'){
 const target=path.join(out,'s/f'),support=path.join(target,'tests/e2e/support');fs.mkdirSync(support,{recursive:true});fs.symlinkSync(path.join(front,'node_modules'),path.join(target,'node_modules'),'junction');for(const f of ['text-geometry.ts','text-paint.mjs','text-paint.d.mts'])fs.copyFileSync(path.join(front,'tests/e2e/support',f),path.join(support,f));
 const probes=[['geometry','tasks/evidencias/revalidacao-PR3-expanded-residual/geometry.mjs'],['presence','tasks/evidencias/revalidacao-RR3-01/independentes.mjs'],['value','tasks/evidencias/revalidacao-RR3-01/rodada-2026-11-02-02/atribuicao.mjs'],['complement','tasks/evidencias/revalidacao-RR3-01/complementos.mjs']];
 fs.writeFileSync(path.join(out,'probes.json'),JSON.stringify(probes.map(([name,file])=>({name,file,sha256:sha(path.join(root,file))})),null,2)+'\n',{flag:'wx'});
 for(const [name,file]of probes)good=run(name,[path.join(root,file),out],root)&&good;
}else if(mode==='controles'){
 good=run('42-controls',[path.join(front,'node_modules/@playwright/test/cli.js'),'test','--config','tests/e2e/playwright.text-geometry.config.ts','--reporter=line,json','--output='+path.join(out,'artifacts')],front,0,{PLAYWRIGHT_JSON_OUTPUT_FILE:path.join(out,'playwright.json')});
}else if(mode==='checks'){
 for(const [name,args,cwd]of [
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false','--project','tsconfig.json'],front],
 ['lint',['node_modules/eslint/bin/eslint.js','tests/e2e/support/text-geometry.ts','tests/e2e/support/text-paint.mjs','tests/e2e/support/text-paint.d.mts','tests/e2e/text-paint.observer.spec.ts','tests/e2e/playwright.text-geometry.config.ts','--max-warnings=0','--format=json','--output-file',path.join(out,'eslint.json')],front],
 ['ci',['--test','--test-reporter=tap','.github/scripts/ci.test.mjs','.github/scripts/required.test.mjs','.github/scripts/suites.test.mjs','.github/scripts/sanitize.test.mjs'],subject]
 ])good=run(name,args,cwd)&&good;
}else throw Error('unknown mode');assert.ok(good,'inspect recorded failures; expectations unchanged');
