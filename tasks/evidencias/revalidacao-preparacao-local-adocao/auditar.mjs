import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{spawnSync,execFileSync}from'node:child_process';
import{hash}from'../preparacao-local-adocao/counterproof-checkpoint.mjs';
const root=path.resolve('tasks/evidencias/revalidacao-preparacao-local-adocao');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{assert.equal(e.isSymbolicLink(),false);return e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)];});}
const all=files(root);for(const f of all){assert.equal(/\.(exe|jar|jfr|class|zip)$|(?:^|[\\/])\.env(?:\.|$)/.test(f),false,f);if(f.endsWith('.json'))JSON.parse(fs.readFileSync(f));if(f.endsWith('.mjs'))assert.equal(spawnSync(process.execPath,['--check',f]).status,0,f);}
const result=JSON.parse(fs.readFileSync(path.join(root,'resultados.json')));
for(const a of result.artifacts){const file=path.join(root,a.target);assert.equal(hash(fs.readFileSync(a.source)),a.originalSha256,a.source);assert.equal(hash(fs.readFileSync(file)),a.collectedSha256,file);if(process.argv.includes('--staged')){const p=path.relative(process.cwd(),file).replaceAll('\\','/');assert.equal(hash(execFileSync('git',['show',':'+p],{maxBuffer:8*1024*1024})),a.collectedSha256,p);}}
assert.equal(hash(fs.readFileSync('README.md')),'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
console.log(JSON.stringify({files:all.length,artifacts:result.artifacts.length,stagedVerified:process.argv.includes('--staged'),applicationTestsRun:0}));
