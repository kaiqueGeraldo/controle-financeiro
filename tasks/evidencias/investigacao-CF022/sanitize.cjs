// Preserve raw bytes locally; publish metadata and sanitized diagnostic text only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=__dirname,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const records=[];
for(const item of fs.readdirSync(dir,{recursive:true,withFileTypes:true})){
 if(!item.isFile())continue;
 const p=path.join(item.parentPath,item.name),rel=path.relative(dir,p);
 if(rel.startsWith('raw'+path.sep)||!(/\.log$/.test(rel)||/failure\.txt$/.test(rel)))continue;
 const old=fs.readFileSync(p),text=old.toString('utf8').replaceAll('Synthetic-Cf022-2026','[SYNTHETIC-PASSWORD-REDACTED]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[JWT-REDACTED]');
 if(text!==old.toString('utf8')){
  const raw=path.join(dir,'raw',rel);if(fs.existsSync(raw))throw Error('Do not overwrite raw evidence');
  fs.mkdirSync(path.dirname(raw),{recursive:true});fs.writeFileSync(raw,old);fs.writeFileSync(p,text);
 }
 records.push({path:rel,original:hash(old),published:hash(fs.readFileSync(p))});
}
for(const item of fs.readdirSync(dir,{recursive:true,withFileTypes:true})){
 if(item.isFile()&&item.name.endsWith('-trace.zip')){const p=path.join(item.parentPath,item.name);records.push({path:path.relative(dir,p),privateTrace:true,sha256:hash(fs.readFileSync(p))});}
}
fs.writeFileSync(path.join(dir,'sanitization.json'),JSON.stringify(records,null,2));
console.log(JSON.stringify({artifacts:records.length,changed:records.filter(x=>x.original&&x.original!==x.published).length}));
