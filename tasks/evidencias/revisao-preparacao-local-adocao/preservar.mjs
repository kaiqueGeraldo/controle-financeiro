import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const phase = process.argv[2];
if (!['inicial', 'final'].includes(phase)) throw new Error('fase inicial|final');
const out = 'tasks/evidencias/revisao-preparacao-local-adocao';
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git = args => execFileSync('git', args, {encoding:'utf8'}).trim();
const old = JSON.parse(fs.readFileSync('tasks/evidencias/preparacao-local-adocao/preservation.json'));
const historical = old.runtimeFiles.map(x => ({file:x.file, expected:x.sha256,
  actual:sha(path.join(old.historicalRuntime,x.file))}));
const migrations = old.migrations.map(x => ({file:x.file, expected:x.sha256, actual:sha(x.file)}));
const p05 = path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p05');
const manifest = JSON.parse(fs.readFileSync(path.join(p05,'inputs.json')));
const receipt = JSON.parse(fs.readFileSync(path.join(p05,'package/stage.json')));
const producerBlobs=new Map(git(['ls-tree','-r','-z',manifest.commit,'--','.github','controle-financeiro-backend',
  'controle-financeiro-frontend','tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json'])
  .split('\0').filter(Boolean).map(line=>{const [meta,file]=line.split('\t');return [file,meta.split(' ')[2]];}));
const inputs = manifest.inputs.map(x => ({file:x.file, expected:x.sha256,
  current:sha(x.file), runtime:sha(path.join(p05,'checkout',x.file)),
  producerBlob:producerBlobs.get(x.file),
  manifestBlob:x.gitBlob}));
const sourceDigest=crypto.createHash('sha256').update(manifest.inputs.map(x=>x.file+'\0'+x.sha256+'\n').join('')).digest('hex');
const normalizedDiff=git(['diff','--name-only',manifest.commit,'--','.github','controle-financeiro-backend',
  'controle-financeiro-frontend','tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json']);
if(sourceDigest!==receipt.sourceDigest||sourceDigest!==manifest.sourceDigest||normalizedDiff)throw new Error('Digest/diff dos inputs divergiu');
const record = {at:new Date().toISOString(), phase,
  branch:git(['branch','--show-current']),head:git(['rev-parse','HEAD']),
  status:git(['status','--porcelain=v2']),staged:git(['diff','--cached','--name-status']),
  readme:{expected:old.readmeSha256,actual:sha('README.md')},
  historicalRuntime:old.historicalRuntime,historical,migrations,
  p05:{jar:sha(path.join(p05,'package/api.jar')),receipt,sourceDigest,normalizedDiff,manifestHash:sha(path.join(p05,'inputs.json')),
    manifestCopyHash:sha('tasks/evidencias/preparacao-local-adocao/inputs.json'),inputs},
  candidate:'6f70a877cd7c9c0024445026bec43931c8fbcba7',
  base:'46b85ee0428abb55c22d27d26284d054410ec128'};
for (const ref of [record.base,record.candidate,manifest.commit,'ec6d4e7'])
  execFileSync('git',['merge-base','--is-ancestor',ref,'HEAD']);
if (record.readme.expected!==record.readme.actual || historical.some(x=>x.expected!==x.actual)
    || migrations.some(x=>x.expected!==x.actual) || inputs.some(x=>x.expected!==x.current
      || x.expected!==x.runtime || x.producerBlob!==x.manifestBlob)
    || record.p05.jar!==receipt.sha256 || record.p05.manifestHash!==receipt.inputsManifestSha256)
  throw new Error('Preservação/proveniência divergiu; não restaurar automaticamente');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'preservacao-'+phase+'.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({phase,head:record.head,readme:record.readme.actual,
  historical:historical.length,migrations:migrations.length,inputs:inputs.length,jar:record.p05.jar,passed:true}));
