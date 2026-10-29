import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{execFileSync}from'node:child_process';
const phase=process.argv[2],out='tasks/evidencias/saneamento-RVPLA-03';if(!['inicial','final'].includes(phase))throw Error('Phase required');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const prior=JSON.parse(fs.readFileSync('tasks/evidencias/revalidacao-preparacao-local-adocao/preservacao-final.json'));
const allowed=new Set(['tasks/evidencias/preparacao-local-adocao/counterproofs.mjs','.github/scripts/owned-process.mjs','.github/scripts/owned-process.ps1']);
const hashes={};for(const [file,expected]of Object.entries(prior.hashes)){if(allowed.has(file.replaceAll('\\','/')))continue;if(sha(file)!==expected)throw Error('Historical artifact differs: '+file);hashes[file]=expected;}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of files('tasks/evidencias/revalidacao-preparacao-local-adocao'))hashes[file]=sha(file);
const readme=sha('README.md');if(readme!=='6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca')throw Error('README differs; no automatic restore');
if(phase==='final')for(const[file,expected]of Object.entries(JSON.parse(fs.readFileSync(out+'/preservacao-inicial.json')).hashes))if(sha(file)!==expected)throw Error('Protected artifact changed: '+file);
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();for(const c of ['9bed5e20f2cc46e4c7ae721ff2390054eb6db141','af73bbd8fc6821a1e084dd1bcfdd436212811d82','24844b5'])execFileSync('git',['merge-base','--is-ancestor',c,'HEAD']);
const record={phase,at:new Date().toISOString(),head:git(['rev-parse','HEAD']),branch:git(['branch','--show-current']),readmeSha256:readme,historicalFiles:29,migrations:16,
 jarSha256:sha('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar'),intendedEditableFiles:[...allowed],protectedFiles:Object.keys(hashes).length,hashes};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/preservacao-'+phase+'.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...record,hashes:undefined}));
