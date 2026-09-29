// Reconstruct only bytes known by the original snapshot in the archived CF-016 copy.
// Does not edit the verifier, snapshot, contract, or shared checkout.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve('controle-financeiro-backend/target/review-cf016');
const sha=b=>createHash('sha256').update(b).digest('hex').toUpperCase();
const snapshot=JSON.parse((await readFile(path.join(root,'tasks/evidencias/CF-016/base-inicial.json'),'utf8')).replace(/^\uFEFF/,''));
let restored=0;
for(const entry of snapshot.files){
  const name=path.join(root,entry.path), original=await readFile(name);
  if(sha(original)===entry.sha256)continue;
  const current=await readFile(entry.path);
  if(sha(current)===entry.sha256){await writeFile(name,current);restored++;continue;}
  const lf=original.toString('utf8').replace(/\r\n/g,'\n');
  const plain=lf.replace(/^\uFEFF/,'');
  for(const text of [plain,plain.replace(/\n/g,'\r\n'),'\uFEFF'+plain,'\uFEFF'+plain.replace(/\n/g,'\r\n')]){
    if(sha(text)===entry.sha256){await writeFile(name,text);restored++;break;}
  }
}
console.log(`Files reconstructed exclusively by matching snapshot SHA256: ${restored}`);
