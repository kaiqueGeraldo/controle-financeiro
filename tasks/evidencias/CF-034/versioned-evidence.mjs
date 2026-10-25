import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';
const output='tasks/evidencias/CF-034/versioned-evidence.json';
const paths=execFileSync('git',['diff','--cached','--name-only','-z'],{encoding:'utf8'}).split('\0').filter(p=>p&&p!==output);
const entries=paths.map(file=>{
  const raw=fs.readFileSync(file),object=execFileSync('git',['rev-parse',':'+file],{encoding:'utf8'}).trim();
  const blob=execFileSync('git',['cat-file','blob',object]);
  const rawSha256=hash(raw),blobSha256=hash(blob),lfSha256=hash(raw.toString('utf8').replace(/\r\n/g,'\n'));
  const relation=rawSha256===blobSha256?'exact raw bytes':lfSha256===blobSha256?'CRLF-to-LF reconstructs the staged blob exactly':'unexplained';
  return {file,object,rawSha256,blobSha256,relation};
});
const unexplained=entries.filter(e=>e.relation==='unexplained');
writeJson(output,{at:new Date().toISOString(),scope:'local delivery staging, excluding this self-referential index',
  meaning:'collection.json preserves hashes of copied workspace bytes; this supplementary index also identifies the actual staged Git blobs. No historical manifest rewritten.',
  checked:entries.length,exact:entries.filter(e=>e.relation==='exact raw bytes').length,
  reconstructed:entries.filter(e=>e.relation==='CRLF-to-LF reconstructs the staged blob exactly').length,
  unexplained:unexplained.length,entries});
if(unexplained.length)throw new Error('Unexplained staged evidence byte difference');
console.log(JSON.stringify({checked:entries.length,unexplained:unexplained.length}));
