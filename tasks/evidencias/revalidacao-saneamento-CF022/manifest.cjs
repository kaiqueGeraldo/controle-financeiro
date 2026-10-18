const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=__dirname;
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>{const f=path.join(p,e.name);return e.isSymbolicLink()||e.name==='raw'?[]:e.isDirectory()?walk(f):[f];});}
const entries=walk(dir).filter(p=>!p.endsWith('.zip')&&!p.endsWith('EVIDENCE-SHA256.json')).map(p=>({path:path.relative(dir,p).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}));
fs.writeFileSync(path.join(dir,'EVIDENCE-SHA256.json'),JSON.stringify(entries,null,2));
console.log('Manifest entries: '+entries.length);
