import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const execution=path.resolve(process.argv[2]??'');
if(!execution.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep))throw new Error('Disposable execution required');
const directory=path.join(execution,'package-counterproof');fs.mkdirSync(directory);
const source=path.join(execution,'package/api.jar'), copy=path.join(directory,'api.jar');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const script=fileURLToPath(new URL('./package.mjs',import.meta.url));
function verify(name,file) {
  const result=spawnSync(process.execPath,[script,'verify',execution,file],{encoding:'utf8'});
  fs.writeFileSync(path.join(directory,name+'.log'),result.stdout+result.stderr);
  return result.status;
}
fs.copyFileSync(source,copy,fs.constants.COPYFILE_EXCL);
const before=hash(copy);
if(verify('before',copy)!==0)throw new Error('Baseline failed');
const fd=fs.openSync(copy,'r+'), byte=Buffer.alloc(1), position=fs.statSync(copy).size-1;
fs.readSync(fd,byte,0,1,position);byte[0]^=1;fs.writeSync(fd,byte,0,1,position);fs.closeSync(fd);
const altered=hash(copy);
if(verify('altered',copy)===0)throw new Error('Tampered artifact accepted');
fs.copyFileSync(source,copy);
const restored=hash(copy);
if(before!==restored || before===altered || verify('restored',copy)!==0)throw new Error('Restoration failed');
const receipt={before,altered,restored,rejected:true,originalPackageUnchanged:hash(source)===before};
fs.writeFileSync(path.join(directory,'result.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
