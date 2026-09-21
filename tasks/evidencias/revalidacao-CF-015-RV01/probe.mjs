import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const evidence=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(evidence,'../../..');
const frontend=path.join(root,'controle-financeiro-frontend');
const copy=fs.mkdtempSync(path.join(os.tmpdir(),'cf015-rv01-review-'));
for(const dir of ['src','tests/component']) fs.cpSync(path.join(frontend,dir),path.join(copy,dir),{recursive:true});
for(const file of ['package.json','tsconfig.json']) fs.copyFileSync(path.join(frontend,file),path.join(copy,file));
fs.symlinkSync(path.join(frontend,'node_modules'),path.join(copy,'node_modules'),'junction');
const hash=b=>createHash('sha256').update(b).digest('hex');
const rel='src/hooks/useCards.ts', target=path.join(copy,rel), original=fs.readFileSync(target);
const test='controle-financeiro-frontend/tests/component/cf015-revalidation-overlap.test.tsx';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const results=[];
const scenarios=[
 {name:'original-hook',content:execFileSync('git',['show',`f550b9e:controle-financeiro-frontend/${rel}`],{cwd:root}),filter:'cf015-revalidation-overlap'},
 {name:'missing-success-guard',content:original.toString().replace('if (!reconciliation.isCurrent()) throw new ReconciliationCancelledError();',''),filter:'cf015-reconciliation-lifecycle',title:'cancels even a batch'},
];
for(const scenario of scenarios){
 try{
  fs.writeFileSync(target,scenario.content);
  const args=[path.join(frontend,'node_modules/vitest/vitest.mjs'),'run','--root',copy,'--config',path.join(copy,'tests/component/vitest.config.mts'),scenario.filter];
  if(scenario.title)args.push('-t',scenario.title);
  const r=spawnSync(process.execPath,args,{cwd:copy,encoding:'utf8',windowsHide:true});
  fs.writeFileSync(path.join(evidence,`${scenario.name}.log`),r.stdout+r.stderr);
  results.push({name:scenario.name,exit:r.status});
 }finally{fs.writeFileSync(target,original);}
}
const result={copy,head:git('rev-parse','HEAD'),testBlobs:{base:git('rev-parse',`f550b9e:${test}`),candidate:git('rev-parse',`e4079a9:${test}`),workingTree:git('hash-object',test)},results,restored:hash(fs.readFileSync(target))===hash(original),productUnchanged:hash(fs.readFileSync(path.join(frontend,rel)))===hash(original),readmeSha256:hash(fs.readFileSync(path.join(root,'README.md')))};
const candidate=JSON.parse(fs.readFileSync(path.join(root,'tasks/evidencias/saneamento-CF-015-RV01/candidato.json'),'utf8'));
result.candidateHashes=candidate.files.map(f=>({path:f.path,matches:hash(fs.readFileSync(path.join(root,f.path))).toUpperCase()===f.sha256}));
fs.writeFileSync(path.join(evidence,'probe.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(results.some(r=>r.exit!==1)||!result.restored||!result.productUnchanged||result.candidateHashes.some(f=>!f.matches))process.exitCode=1;
