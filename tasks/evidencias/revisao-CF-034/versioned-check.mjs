import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash=b=>createHash('sha256').update(b).digest('hex');
const index=JSON.parse(fs.readFileSync('tasks/evidencias/CF-034/versioned-evidence.json'));
const entries=index.entries.map(e=>{
 const blob=execFileSync('git',['show',`64603a3:${e.file}`],{maxBuffer:20*1024*1024});
 const object=execFileSync('git',['rev-parse',`64603a3:${e.file}`],{encoding:'utf8'}).trim();
 const raw=fs.readFileSync(e.file);
 assert.equal(object,e.object);assert.equal(hash(blob),e.blobSha256);assert.equal(hash(raw),e.rawSha256);
 const relation=hash(raw)===hash(blob)?'exact':hash(raw.toString().replaceAll('\r\n','\n'))===hash(blob)?'CRLF-to-LF':'unexplained';assert.notEqual(relation,'unexplained');
 return {file:e.file,blob:object,relation};
});
fs.writeFileSync('tasks/evidencias/revisao-CF-034/versioned-check.json',JSON.stringify({candidate:'64603a3',checked:entries.length,exact:entries.filter(e=>e.relation==='exact').length,reconstructed:entries.filter(e=>e.relation==='CRLF-to-LF').length,entries},null,2)+'\n');
console.log('Delivery index verified against candidate blobs and current raw bytes.');
