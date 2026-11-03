import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'../../..'),runtime=path.resolve(process.argv[2]);
assert.ok(path.basename(runtime).startsWith('revisao-plataformas-docker-'));
assert.ok(!fs.existsSync(runtime),'Runtime must be new');
const manifestFile=path.resolve(root,'../../controle-financeiro-runtimes/preparacao-adocao/saneamento-expanded-plataformas-01/inputs/.ci-source.json');
const manifest=JSON.parse(fs.readFileSync(manifestFile));
const {hash,snapshot,sourceFor}=await import(pathToFileURL(path.join(root,'.github/scripts/source.mjs')));
assert.equal(manifest.commit,'0aac7ccd25934ec022939464486da9fb28610279');
assert.equal(manifest.digest,'d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660');assert.equal(manifest.files.length,860);
for(const f of manifest.files)assert.equal(hash(fs.readFileSync(path.join(root,f.path))),f.sha256,f.path);
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
assert.equal(git('diff',manifest.commit,'HEAD','--','.github','controle-financeiro-backend','controle-financeiro-frontend','docs/sdd/decisoes/005-excecao-temporaria-zoom-expanded.md','tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json'),'');
assert.equal(git('status','--porcelain','--','.github','controle-financeiro-backend','controle-financeiro-frontend','docs/sdd/decisoes/005-excecao-temporaria-zoom-expanded.md','tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json'),'');
const candidate=path.join(runtime,'candidate');fs.mkdirSync(candidate,{recursive:true});
for(const f of manifest.files){const dst=path.join(candidate,f.path);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(path.join(root,f.path),dst);}
const result=snapshot(candidate,{commit:git('rev-parse','HEAD'),branch:git('branch','--show-current'),originalTreeChanges:[],export:'new source-only candidate; all 860 input bytes equal reviewed 0aac7ccd; current commit adds review documents only',reviewedInputCommit:manifest.commit});
assert.equal(result.digest,manifest.digest);assert.equal(sourceFor(candidate).digest,manifest.digest);
console.log(candidate);
