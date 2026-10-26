import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const runtime=path.resolve(process.argv[2]??'');
if(!runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep))throw new Error('Preparation execution required');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const historical=JSON.parse(fs.readFileSync('tasks/evidencias/revisao-prontidao-CF034-CF017/preservacao-inicial.json'));
const initial=JSON.parse(fs.readFileSync(path.join(runtime,'../p01/inputs.json')));
const readme=sha('README.md');
if(readme!==historical.readmeSha256||readme!==initial.preservation.readmeSha256)throw new Error('README diverged; no automatic restore');
const runtimeFiles=Object.entries(historical.runtimeFiles).map(([file,expected])=>{
  const actual=sha(path.join(historical.runtime,file));
  if(actual!==expected.sha256)throw new Error('Historical file changed: '+file);
  return {file,sha256:actual,unchanged:true};
});
const migrations=initial.inputs.filter(x=>x.file.includes('/src/main/resources/db/migration/')).map(input=>{
  const actual=sha(input.file);
  if(actual!==input.sha256)throw new Error('Versioned migration changed: '+input.file);
  return {file:input.file,sha256:actual,unchanged:true};
});
if(migrations.length!==16)throw new Error('Unexpected protected chain');
for(const commit of ['ec6d4e7','46b85ee0428abb55c22d27d26284d054410ec128'])execFileSync('git',['merge-base','--is-ancestor',commit,'HEAD']);
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
const receipt={checkedAt:new Date().toISOString(),branch:git(['branch','--show-current']),headBeforeEvidenceCommit:git(['rev-parse','HEAD']),
  readmeSha256:readme,readmeInitialSha256:initial.preservation.readmeSha256,readmeUnchanged:true,
  reviewCommitsPreserved:true,historicalRuntime:historical.runtime,runtimeFiles,migrations,
  staged:git(['diff','--cached','--name-only']),statusAtCheck:git(['status','--short']).split('\n'),
  scope:'Exact bytes of README, 29 inventoried historical files and 16 migrations. Other historical runtimes were not enumerated or cleaned.'};
fs.writeFileSync('tasks/evidencias/preparacao-local-adocao/preservation.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({readmeSha256:readme,historicalFiles:runtimeFiles.length,migrations:migrations.length,reviewCommitsPreserved:true}));
