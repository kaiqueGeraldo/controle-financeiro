import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),prefix='tasks/evidencias/saneamento-PR3-expanded/';
const base='1c4173f2e9a8bd459a9f2ecd4acf2d803245be88';
const code=execFileSync('git',['diff','--name-only',base,'HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n');
const documents=fs.readdirSync(import.meta.dirname).filter(n=>n!=='inventario.json').map(n=>prefix+n);
const files=[...new Set([...code,'.gitignore',...documents])].sort().map(file=>{
 assert.ok(!/\.(log|zip|jar|png|webm|xlsx)$/i.test(file),'Raw artifacts must remain private');
 const bytes=fs.readFileSync(path.join(root,file));return {file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
});
fs.writeFileSync(path.join(import.meta.dirname,'inventario.json'),JSON.stringify({base,scope:'Only new/changed files in this remediation; historical manifests referenced separately; this manifest excludes itself',files},null,2)+'\n');
console.log(JSON.stringify({files:files.length,rawArtifactsIncluded:false}));
