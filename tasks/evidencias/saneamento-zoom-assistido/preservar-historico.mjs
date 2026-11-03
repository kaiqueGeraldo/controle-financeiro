import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const [mode,runtimeArg]=process.argv.slice(2);
assert.ok(['initial','final'].includes(mode));
const runtime=path.resolve(runtimeArg??'');
assert.match(path.basename(runtime),/^zoom-assistido-[a-z0-9-]+$/);
const parent=path.dirname(runtime),root=path.resolve(import.meta.dirname,'../../..');
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report=JSON.parse(fs.readFileSync(path.join(root,'tasks/evidencias/validacao-zoom-nativo/RESULTADOS.json')));
const captures=report.invocations.flatMap(run=>run.humanCaptures);
for(const item of captures)assert.equal(hash(item.path),item.sha256,item.path);
const destination=path.join(runtime,'historical-runtime-files.json');
if(mode==='initial') {
  const files=[];
  function visit(dir) {
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      if(['s','p','temp','node_modules','.next','target'].includes(entry.name))continue;
      const file=path.join(dir,entry.name);
      assert.ok(!entry.isSymbolicLink(),'Never follow historical links');
      if(entry.isDirectory())visit(file);
      else files.push({file,sha256:hash(file)});
    }
  }
  for(const name of ['zoom-nativo-20261103-01','zoom-nativo-20261103-02'])visit(path.join(parent,name));
  fs.writeFileSync(destination,JSON.stringify({at:new Date(),files,capturesVerified:captures.length},null,2),{flag:'wx'});
  console.log(JSON.stringify({historicalArtifacts:files.length,capturesVerified:captures.length}));
} else {
  const before=JSON.parse(fs.readFileSync(destination));
  for(const item of before.files)assert.equal(hash(item.file),item.sha256,item.file);
  const receipt={at:new Date(),historicalArtifactsUnchanged:before.files.length,capturesVerified:captures.length,manifestSha256:hash(destination)};
  fs.writeFileSync(path.join(runtime,'historical-runtime-final.json'),JSON.stringify(receipt,null,2),{flag:'wx'});
  console.log(JSON.stringify(receipt));
}
