import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const run=path.resolve(process.argv[2]);
if(!run.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep))throw new Error('Runtime de revisão');
const source=path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar');
const folder=path.join(run,'package-tamper');fs.mkdirSync(folder);
const copy=path.join(folder,'api-copy.jar');fs.copyFileSync(source,copy,fs.constants.COPYFILE_EXCL);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const expected=JSON.parse(fs.readFileSync(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p05/package/stage.json'))).sha256;
const before=sha(copy),fd=fs.openSync(copy,'r+'),original=Buffer.alloc(1);fs.readSync(fd,original,0,1,1024);
let changed;
try{fs.writeSync(fd,Buffer.from([original[0]^1]),0,1,1024);changed=sha(copy);}
finally{fs.writeSync(fd,original,0,1,1024);fs.closeSync(fd);}
const after=sha(copy),sourceAfter=sha(source);
const result={at:new Date().toISOString(),expected,before,changed,rejected:changed!==expected,after,sourceAfter,
  restored:after===expected&&sourceAfter===expected,scope:'One byte changed only in independent copy. Original p05 manifest and package remain untouched. No rebuild or binary reproducibility claim.'};
fs.writeFileSync(path.join(run,'package-counterproof-independent.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
if(before!==expected||!result.rejected||!result.restored)throw new Error('Contraprova divergente');console.log(JSON.stringify(result));
