import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';
const root=process.cwd(),out=import.meta.dirname;
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file));
const validation=read(path.join(out,'validacao.json')),initial=read(path.join(out,'preservacao-inicial.json'));
for(const item of initial.files)assert.equal(hash(item.file),item.sha256,item.file);
for(const step of validation.steps){assert.equal(hash(step.log),step.sha256);assert.equal(hash(path.join(out,path.basename(step.log))),step.sha256);}
const manifest=read(validation.inputs.file);assert.equal(hash(validation.inputs.file),validation.inputs.sha256);
for(const item of manifest.files){assert.equal(hash(item.file),item.sha256);assert.equal(hash(path.join(validation.runtime,'source',item.file)),item.sha256);}
const cube=read(path.join(out,'matriz-resultados.json'));assert.equal(cube.rows.length,500);assert.equal(cube.rows.filter(row=>row.expected).length,4);
for(const row of cube.rows)assert.equal(row.expected,row.observed.approved);
const previous=read('tasks/evidencias/saneamento-CPA-01-R1/validacao.json');
const oldLogs=[];for(const step of previous.steps){const raw=fs.readFileSync(step.log,'utf8');assert.equal(hash(step.log),step.sha256);const tests=Number(raw.match(/# tests (\d+)/)?.[1]),pass=Number(raw.match(/# pass (\d+)/)?.[1]),fail=Number(raw.match(/# fail (\d+)/)?.[1]);
 if(step.label==='contratos-ci'||step.label==='contratos-finais'){assert.equal(tests,32);assert.equal(pass,32);assert.equal(fail,0);}
 if(step.label==='probes-independentes'){assert.equal(tests,7);assert.equal(pass,7);}
 if(step.exit===1){assert.match(raw,/ERR_ASSERTION|AssertionError/);assert.doesNotMatch(raw,/SyntaxError|ERR_MODULE_NOT_FOUND/);assert.ok(fail>0);}
 oldLogs.push({label:step.label,tests,pass,fail,exit:step.exit,sha256:step.sha256});
}
// Supplemental CLI checks of the expanded dependency, preserving the original six tests.
const expandedCli=[];
for(const status of ['success','failure','cancelled','skipped']){
 const raw=JSON.stringify({'windows-native':{result:'success'},linux:{result:'success'},expanded:{result:status}});
 const result=spawnSync(process.execPath,['.github/scripts/required.mjs'],{encoding:'utf8',shell:false,windowsHide:true,env:{...process.env,NEEDS_JSON:raw,GITHUB_EVENT_NAME:'workflow_dispatch',CF_REQUIRED_SUITE:'expanded'}});
 assert.equal(result.status,status==='success'?0:1);expandedCli.push({expanded:status,exit:result.status,stdout:result.stdout.trim(),stderr:result.stderr.trim()});
}
const require=createRequire(path.join(root,'controle-financeiro-frontend/package.json')),yaml=require('js-yaml');
const workflow=yaml.load(fs.readFileSync('.github/workflows/ci.yml','utf8'));
const report={at:new Date().toISOString(),candidate:validation.candidate,protectedPaths:initial.files.length,newInputFiles:manifest.files.length,newLogsRehashed:validation.steps.length,previousLogsAudited:oldLogs,expandedCli,workflow:{yamlSha256:hash('.github/workflows/ci.yml'),parserVersion:require('js-yaml/package.json').version,events:workflow.on,aggregate:workflow.jobs.required,needs:Object.fromEntries(Object.entries(workflow.jobs).map(([id,job])=>[id,job.needs??[]])),workerComparison:'Independent test compares full parsed worker objects against e837 after only declared changes',scheduling:'Static contract + official semantics; no Actions scheduler executed'},implementationDiffFromCandidate:execFileSync('git',['diff','--name-only',validation.candidate,'--','.github','controle-financeiro-backend','controle-financeiro-frontend'],{encoding:'utf8'}).trim(),rootReadmeSha256:hash('README.md'),jarSha256:hash('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar')};
assert.equal(report.implementationDiffFromCandidate,'');
fs.writeFileSync(path.join(out,'conferencia-final.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({protected:report.protectedPaths,previousLogs:oldLogs.length,currentLogs:report.newLogsRehashed,expandedCli:expandedCli.map(r=>r.exit),implementationUnchanged:true}));
