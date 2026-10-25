import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';
const root=path.resolve(process.argv[2]);assert(root.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true});
const inventory=JSON.parse(fs.readFileSync('tasks/evidencias/revalidacao-CF-034-saneamento/preservation-before.json'));
const changed=inventory.filter(f=>!fs.existsSync(f.path)||hash(fs.readFileSync(f.path))!==f.sha256);assert.equal(inventory.length,4323);assert.deepEqual(changed,[]);
const original='tasks/evidencias/revalidacao-CF-034-saneamento/sanitization.mjs',source=fs.readFileSync(original,'utf8');
// Only import binding changes. Assertions, payloads and expected results remain intact.
const relocated=source.replace("'../../../.github/scripts/source.mjs'",JSON.stringify(pathToFileURL(path.resolve('.github/scripts/source.mjs')).href));
const copy=path.join(root,'sanitization.mjs');fs.writeFileSync(copy,relocated);const temp=path.join(root,'temp');fs.mkdirSync(temp);
writeJson(path.join(import.meta.dirname,'baseline-inputs.json'),{at:new Date().toISOString(),root,base:'418a648ba06786f2d0d78a0ed03baf4df0dd1d6d',checked:inventory.length,changed,readmeSha256:hash(fs.readFileSync('README.md')),originalProbe:{path:original,sha256:hash(source)},relocatedProbeSha256:hash(relocated),sanitizerSha256:hash(fs.readFileSync('.github/scripts/sanitize.mjs'))});
const run=spawnSync(process.execPath,[copy,path.join(root,'probe')],{encoding:'utf8',windowsHide:true,maxBuffer:10*1024*1024,env:{...process.env,TEMP:temp,TMP:temp}});
writeJson(path.join(import.meta.dirname,'before-command.json'),{exit:run.status,stdout:run.stdout,stderr:run.stderr});assert.equal(run.status,0,run.stderr);
const result=JSON.parse(fs.readFileSync(path.join(root,'sanitization.json')));assert.equal(result.cases.filter(c=>!c.contractSatisfied).length,2);
fs.copyFileSync(path.join(root,'sanitization.json'),path.join(import.meta.dirname,'before.json'));
console.log('4323 inputs preserved; both residuals reproduced through original probe.');
