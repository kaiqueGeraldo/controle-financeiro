import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const run=path.resolve(process.argv[2]);
const source='tasks/evidencias/preparacao-local-adocao/counterproofs.mjs';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const results=JSON.parse(fs.readFileSync(path.join(run,'counterproofs/results.json')));
const writer=results.find(x=>x.name==='writer-passes-maintenance');
const log=fs.readFileSync(writer.log,'utf8');
const row={at:new Date().toISOString(),source,sourceSha256:sha(source),name:writer.name,status:writer.status,
  originalResumeWouldSkip:results.some(x=>x.name===writer.name&&x.status===1),
  causalDiagnosticPresent:log.includes('ADOPTION_BLOCKED_WRITE http=200 persistedAccounts=1'),
  failedBeforeWrite:log.includes('Expected HTTP 200 at /ops/health/liveness'),
  logSha256:sha(writer.log),mode:'read-only evaluation of the resume predicate; actual resume not executed'};
if(!row.originalResumeWouldSkip||row.causalDiagnosticPresent||!row.failedBeforeWrite)throw new Error('Reprodução não corresponde');
fs.writeFileSync('tasks/evidencias/revisao-preparacao-local-adocao/observador-resume.json',JSON.stringify(row,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(row));
