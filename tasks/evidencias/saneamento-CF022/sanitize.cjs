const fs=require('node:fs'),path=require('node:path');
const dir=__dirname;
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>{const f=path.join(p,e.name);return e.name==='raw'||e.name==='runtime'?[]:e.isDirectory()?walk(f):[f];});}
let count=0;
for(const file of walk(path.join(dir,'corrected-browser'))){
  if(!/\.(log|txt|xml)$/.test(file))continue;
  const original=fs.readFileSync(file,'utf8');
  if(!original.includes('Synthetic-Cf022-2026'))continue;
  const raw=path.join(dir,'raw',path.relative(dir,file));
  if(fs.existsSync(raw))throw Error('Preserve existing raw: '+raw);
  fs.mkdirSync(path.dirname(raw),{recursive:true});fs.copyFileSync(file,raw);
  fs.writeFileSync(file,original.replaceAll('Synthetic-Cf022-2026','[synthetic-password-redacted]'));count++;
}
console.log(`Sanitized ${count} public failure files; originals retained in ignored raw/; trace stays private`);
