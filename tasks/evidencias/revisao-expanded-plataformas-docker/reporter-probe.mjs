import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {requireComponentCoverage} from '/source/components.mjs';
const out='/evidence',summary=[];
for(const mode of ['pass','unhandled']) {
 const dir='/fixture-'+mode;fs.mkdirSync(dir);fs.symlinkSync('/work/s/controle-financeiro-frontend/node_modules',dir+'/node_modules','dir');
 fs.writeFileSync(dir+'/vitest.config.mjs',"export default {test:{include:['*.test.mjs'],environment:'node',maxWorkers:1,fileParallelism:false}};");
 fs.copyFileSync('/source/audit-reporter.mjs',dir+'/audit-reporter.mjs');
 fs.writeFileSync(dir+'/probe.test.mjs',"import {test,expect} from 'vitest';test('synthetic collector contract',async()=>{expect(1+1).toBe(2);"+(mode==='unhandled'?"Promise.reject(new Error('REVIEW_SYNTHETIC_UNHANDLED'));await new Promise(r=>setTimeout(r,10));":"")+"});");
 const context={candidate:'synthetic-no-product',digest:'synthetic-dependencies-only',runId:'review-reporter-'+mode};
 const args=['/work/s/controle-financeiro-frontend/node_modules/vitest/vitest.mjs','run','--root',dir,'--config',dir+'/vitest.config.mjs','--reporter=json','--reporter='+dir+'/audit-reporter.mjs','--outputFile='+out+'/'+mode+'.json'];
 const r=spawnSync('node',args,{cwd:dir,encoding:'utf8',env:{...process.env,CF_COMPONENT_AUDIT:out+'/'+mode+'-audit.json',CF_COMPONENT_CONTEXT:JSON.stringify(context)}});
 fs.writeFileSync(out+'/'+mode+'.log',(r.stdout??'')+(r.stderr??''));const report=JSON.parse(fs.readFileSync(out+'/'+mode+'.json')),audit=JSON.parse(fs.readFileSync(out+'/'+mode+'-audit.json'));
 let rejected=false;try{requireComponentCoverage(report,audit,context,dir);}catch{rejected=true;}
 if(mode==='pass'){assert.equal(r.status,0);assert.equal(rejected,false);}else{assert.equal(r.status,1);assert.ok(audit.errors.some(x=>x.message.includes('REVIEW_SYNTHETIC_UNHANDLED')));assert.ok(rejected);}
 summary.push({mode,args,exit:r.status,jsonSuccess:report.success,passed:report.numPassedTests,auditErrors:audit.errors.length,auditReason:audit.reason,rejected});
}
fs.writeFileSync(out+'/summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
