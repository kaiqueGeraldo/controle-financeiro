import {readdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const [repo,runtime,output]=process.argv.slice(2);
if(!repo||!runtime||!output)throw new Error('Usage: verify-source.mjs repo runtime output.json');
async function files(root,relative=''){
 const entries=await readdir(path.join(root,relative),{withFileTypes:true});
 return (await Promise.all(entries.map(e=>e.isDirectory()?files(root,path.join(relative,e.name)):e.isFile()?[path.join(relative,e.name)]:[]))).flat();
}
const manifest=[];
for(const [source,destination] of [['controle-financeiro-backend/src/main','backend/src/main'],['controle-financeiro-frontend/src','frontend/src']]){
 for(const file of await files(path.join(repo,source))){
  const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
  const original=await hash(path.join(repo,source,file)),copy=await hash(path.join(runtime,destination,file));
  manifest.push({file:path.join(source,file),original,copy,equal:original===copy});
 }
}
const result={files:manifest.length,differences:manifest.filter(f=>!f.equal),manifest};
await writeFile(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({files:result.files,differences:result.differences.length}));
if(result.differences.length)process.exitCode=1;
