import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const rt=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..'),stage=path.join(rt,'counterproof'),front=path.join(stage,'s/f'),sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
fs.mkdirSync(path.join(front,'tests/e2e/support'),{recursive:true});fs.symlinkSync(path.join(rt,'s/f/node_modules'),path.join(front,'node_modules'),'junction');
for(const rel of ['support/text-geometry.ts','support/text-paint.mjs','support/text-paint.d.mts','text-paint.observer.spec.ts','text-geometry.observer.spec.ts','playwright.text-geometry.config.ts'])fs.copyFileSync(path.join(root,'controle-financeiro-frontend/tests/e2e',rel),path.join(front,'tests/e2e',rel));
const observer=path.join(front,'tests/e2e/support/text-geometry.ts'),raster=path.join(front,'tests/e2e/support/text-paint.mjs'),candidate=fs.readFileSync(observer),correctRaster=fs.readFileSync(raster),old=fs.readFileSync(path.join(rt,'before/s/f/tests/e2e/support/text-geometry.ts')),runs=[];
fs.writeFileSync(path.join(stage,'previous-observer.ts'),old,{flag:'wx'});
function execute(label,args,cwd,expected,env={}){
 const log=path.join(stage,label+'.log'),fd=fs.openSync(log,'wx'),start=new Date(),temp=path.join(stage,label+'-temp');fs.mkdirSync(temp);
 const r=spawnSync(process.execPath,args,{cwd,env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:'0',TEMP:temp,TMP:temp,...env},stdio:['ignore',fd,fd],windowsHide:true,timeout:180000});fs.closeSync(fd);const record={label,args,cwd,start,end:new Date(),exit:r.status,expected,error:r.error?.message,logSha256:sha(log)};runs.push(record);fs.writeFileSync(path.join(stage,'executions.json'),JSON.stringify(runs,null,2)+'\n');console.log(JSON.stringify(record));assert.equal(r.status,expected,label);
}
function controls(label,grep,expected){
 execute(label,[path.join(front,'node_modules/@playwright/test/cli.js'),'test','--config','tests/e2e/playwright.text-geometry.config.ts','--grep',grep,'--reporter=line,json','--output='+path.join(stage,label+'-artifacts')],front,expected,{PLAYWRIGHT_JSON_OUTPUT_FILE:path.join(stage,label+'.json')});
}
try{
 fs.writeFileSync(observer,old);assert.equal(sha(observer),sha(path.join(rt,'before/s/f/tests/e2e/support/text-geometry.ts')));
 execute('previous-presence',[path.join(root,'tasks/evidencias/revalidacao-RR3-01/independentes.mjs'),stage],root,1);
 execute('previous-value',[path.join(root,'tasks/evidencias/revalidacao-RR3-01/rodada-2026-11-02-02/atribuicao.mjs'),stage],root,1);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(stage,'independent-static.json'))).unexpected.map(c=>c.name),['mask-side-effect-background','mask-side-effect-other-text']);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(stage,'attribution-value.json'))).cases.filter(c=>!c.correct).map(c=>c.kind),['invisible-style-value-reaction']);
}finally{fs.writeFileSync(observer,candidate);assert.equal(sha(observer),sha(path.join(root,'controle-financeiro-frontend/tests/e2e/support/text-geometry.ts')));}
controls('restored-residuals','v2 rejects|v2 visible text',0);
const needle='if (!near(x, y, n => reference.alpha[n] > 0))';
assert.ok(correctRaster.toString().includes(needle));
try{
 fs.writeFileSync(raster,correctRaster.toString().replace(needle,'if (false)'));
 controls('mutant-without-independent-silhouette','independent raster contract rectangle',1);
 const failure=JSON.parse(fs.readFileSync(path.join(stage,'mutant-without-independent-silhouette.json')));assert.equal(failure.stats.unexpected,1);
 assert.match(fs.readFileSync(path.join(stage,'mutant-without-independent-silhouette.log'),'utf8'),/Expected:.*55/);
}finally{fs.writeFileSync(raster,correctRaster);assert.equal(sha(raster),sha(path.join(root,'controle-financeiro-frontend/tests/e2e/support/text-paint.mjs')));}
controls('restored-independent-raster','independent raster contract',0);
fs.writeFileSync(path.join(stage,'complete.json'),JSON.stringify({at:new Date(),previousSha256:sha(path.join(stage,'previous-observer.ts')),observerRestoredSha256:sha(observer),rasterRestoredSha256:sha(raster),runs},null,2)+'\n',{flag:'wx'});
