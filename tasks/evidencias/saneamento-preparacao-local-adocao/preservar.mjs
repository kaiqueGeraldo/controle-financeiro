import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const phase=process.argv[2];
if(!['inicial','final'].includes(phase))throw Error('Phase required');
const out='tasks/evidencias/saneamento-preparacao-local-adocao';
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const previous=JSON.parse(fs.readFileSync('tasks/evidencias/preparacao-local-adocao/preservation.json'));
const baseline=phase==='final'?JSON.parse(fs.readFileSync(out+'/preservacao-inicial.json')):null;
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const protectedFiles=[...previous.runtimeFiles.map(x=>path.join(previous.historicalRuntime,x.file)),
  ...previous.migrations.map(x=>x.file),
  ...files('tasks/evidencias/revisao-preparacao-local-adocao'),
  ...files('tasks/evidencias/preparacao-local-adocao').filter(f=>!/counterproofs(?:-checkpoint)?\.(?:mjs|test\.mjs)$/.test(f)),
  '../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar',
  '../controle-financeiro-runtimes/preparacao-adocao/p05/inputs.json'];
const hashes=Object.fromEntries(protectedFiles.map(f=>[f,sha(f)]));
if(sha('README.md')!==previous.readmeSha256)throw Error('README changed; do not restore');
if(baseline)for(const [f,expected]of Object.entries(baseline.hashes))if(sha(f)!==expected)throw Error('Protected file changed: '+f);
for(const x of previous.runtimeFiles)if(sha(path.join(previous.historicalRuntime,x.file))!==x.sha256)throw Error('Historical file changed');
for(const x of previous.migrations)if(sha(x.file)!==x.sha256)throw Error('Migration changed');
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
for(const c of ['161cd88','07c396371029d9942b8667e5c638c04a9e6aeb4b','24844b5'])execFileSync('git',['merge-base','--is-ancestor',c,'HEAD']);
const record={phase,at:new Date().toISOString(),branch:git(['branch','--show-current']),head:git(['rev-parse','HEAD']),
  readmeSha256:sha('README.md'),status:git(['status','--short']),hashes,protectedFiles:protectedFiles.length,
  historicalFiles:29,migrations:16,jarSha256:sha('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar')};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/preservacao-'+phase+'.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({phase,protectedFiles:protectedFiles.length,head:record.head,readmeSha256:record.readmeSha256,jar:record.jarSha256}));
