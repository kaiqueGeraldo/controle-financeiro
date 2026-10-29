import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const repo = process.cwd();
const destination = path.resolve(process.argv[2] ?? '');
const allowed = path.resolve(repo, '../controle-financeiro-runtimes/preparacao-adocao') + path.sep;
if (!destination.startsWith(allowed) || fs.existsSync(destination)) throw new Error('Requires a NEW execution under preparacao-adocao');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git = args => execFileSync('git', args, {encoding:'utf8'}).trim();
const historical = JSON.parse(fs.readFileSync('tasks/evidencias/revisao-prontidao-CF034-CF017/preservacao-inicial.json'));
const preservation = {readmeSha256:hash('README.md'), runtime:historical.runtime, files:{}};
if (preservation.readmeSha256 !== historical.readmeSha256) throw new Error('README changed; investigate without restoring');
for (const [file, expected] of Object.entries(historical.runtimeFiles)) {
  const actual = hash(path.join(historical.runtime,file));
  preservation.files[file] = actual;
  if (actual !== expected.sha256) throw new Error(`Historical runtime changed: ${file}`);
}
const paths = ['.github','controle-financeiro-backend','controle-financeiro-frontend',
  'tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json'];
const list = execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z','--',...paths],{encoding:'utf8'}).split('\0').filter(Boolean);
const selected = list.filter(p => /^(controle-financeiro-backend|controle-financeiro-frontend|\.github)\//.test(p)
  || ['tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json'].includes(p));
selected.sort();
const blobs = new Map(execFileSync('git',['ls-files','--stage','-z','--',...paths],{encoding:'utf8'}).split('\0').filter(Boolean)
  .map(line => { const [meta,file] = line.split('\t'); return [file, meta.split(' ')[1]]; }));
const normalized = execFileSync('git',['hash-object','--stdin-paths'],{encoding:'utf8',input:selected.join('\n')+'\n'})
  .trim().split('\n');
fs.mkdirSync(destination,{recursive:true});
const inputs = [];
for (const [index,file] of selected.entries()) {
  if (/(^|\/)(target|node_modules|\.next|\.git)(\/|$)|(^|\/)\.env(?:\.|$)/.test(file)) throw new Error(`Forbidden input ${file}`);
  const target = path.join(destination,'checkout',file);
  fs.mkdirSync(path.dirname(target),{recursive:true}); fs.copyFileSync(file,target);
  inputs.push({file,bytes:fs.statSync(file).size,sha256:hash(file),gitBlob:blobs.get(file) ?? null,
    normalizedBlob:normalized[index],matchesIndex:blobs.get(file) === normalized[index]});
}
const receipt = {commit:git(['rev-parse','HEAD']),branch:git(['branch','--show-current']),
  changes:git(['status','--porcelain=v1']).split('\n'),node:process.version,
  excludedPreexistingReadme:true,inputs,preservation,
  sourceDigest:crypto.createHash('sha256').update(inputs.map(x=>x.file+'\0'+x.sha256+'\n').join('')).digest('hex')};
fs.writeFileSync(path.join(destination,'inputs.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({destination,commit:receipt.commit,inputs:inputs.length,preservedHistoricalFiles:Object.keys(preservation.files).length,readmeSha256:preservation.readmeSha256}));
