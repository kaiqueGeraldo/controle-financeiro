import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash,sourceFor,writeJson} from '../../../.github/scripts/source.mjs';

const [executionArg]=process.argv.slice(2);
if(!executionArg)throw new Error('execution directory required');
const execution=path.resolve(executionArg),root=path.join(execution,'checkout'),out=path.join(execution,'evidence-01');
const source=sourceFor(root),result=JSON.parse(fs.readFileSync(path.join(out,'result.json')));
const manifest=JSON.parse(fs.readFileSync(path.join(out,'package-manifest.json')));
const actual=hash(fs.readFileSync(path.join(out,manifest.file)));
if(result.status!=='passed'||result.stage!=='all'||manifest.commit!==source.commit||result.source.commit!==source.commit||
    manifest.sourceDigest!==source.digest||result.source.digest!==source.digest||actual!==manifest.sha256||actual!==result.artifact.sha256)
  throw new Error('Package/source/execution mismatch');
const changed=source.files.filter(f=>!fs.existsSync(f.path)||hash(fs.readFileSync(f.path))!==f.sha256);
if(changed.length)throw new Error('Runtime source differs from current reviewed checkout: '+changed.map(f=>f.path).join(','));
const scopes=['.github','controle-financeiro-backend','controle-financeiro-frontend',
  'tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json'];
const diff=execFileSync('git',['diff','--name-only',source.commit,'--',...scopes],{encoding:'utf8'}).trim();
if(diff)throw new Error('Relevant tracked source differs from origin commit: '+diff);
const frontend=path.join(root,'controle-financeiro-frontend');
const declared=JSON.parse(fs.readFileSync(path.join(frontend,'package.json')));
const resolvedFrontend=Object.fromEntries(Object.keys({...declared.dependencies,...declared.devDependencies}).sort().map(name=>{
  const actual=JSON.parse(fs.readFileSync(path.join(frontend,'node_modules',name,'package.json')));return [name,actual.version];
}));
const jarTool=process.env.JAVA_HOME?path.join(process.env.JAVA_HOME,'bin',process.platform==='win32'?'jar.exe':'jar'):'jar';
const embeddedLibraries=execFileSync(jarTool,['tf',path.join(out,manifest.file)],{encoding:'utf8'}).split(/\r?\n/).filter(p=>/^BOOT-INF\/lib\/[^/]+\.jar$/.test(p));
if(!embeddedLibraries.length)throw new Error('Executable package has no dependency inventory');
writeJson('tasks/evidencias/CF-034/package-trace.json',{at:new Date().toISOString(),execution,
  sourceCommit:source.commit,sourceDigest:source.digest,sourceFilesChecked:source.files.length,
  runtimeToCurrentRawSha256Differences:changed.length,gitDiffOfRelevantTrackedInputs:diff,
  originalTreeChanges:source.originalTreeChanges,excludedReadme:true,
  artifact:{file:manifest.file,sha256:actual,bytes:manifest.bytes},
  resultSha256:hash(fs.readFileSync(path.join(out,'result.json'))),
  manifestSha256:hash(fs.readFileSync(path.join(out,'package-manifest.json'))),
  backend:result.backend,browser:result.browser,unit:result.unit,components:result.components,
  resolvedFrontend,embeddedLibraries,
  remoteCI:'not executed for this implementation',binaryReproducibility:'not claimed'});
console.log(JSON.stringify({commit:source.commit,inputs:source.files.length,artifact:actual}));
