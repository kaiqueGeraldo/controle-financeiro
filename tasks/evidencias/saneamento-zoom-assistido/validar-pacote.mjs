import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';

const runtime=path.resolve(process.argv[2]??'');
assert.match(path.basename(runtime),/^zoom-assistido-pacote-sintetico-[a-z0-9-]+$/);
assert.ok(!fs.existsSync(runtime),'New synthetic structure only');
const root=path.resolve(import.meta.dirname,'../../..');
assert.equal(path.dirname(runtime),path.resolve(root,'../../controle-financeiro-runtimes/preparacao-adocao'));
fs.mkdirSync(runtime);
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files=[];
for(const name of ['cf015.native-zoom.integrated.spec.ts','rf15-native-chrome.integrated.spec.ts','playwright.rf15.config.ts']) {
  const file='controle-financeiro-frontend/tests/e2e/'+name,copy='f/tests/e2e/'+name;
  const target=path.join(runtime,'s',copy);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);
  files.push({tree:'s',file,copy,source:hash(target),actual:hash(target)});
}
fs.writeFileSync(path.join(runtime,'prepared.json'),JSON.stringify({root,candidate:'SYNTHETIC-STRUCTURE-ONLY',files}));
const child=spawnSync(process.execPath,[path.join(import.meta.dirname,'aplicar.mjs'),runtime],{encoding:'utf8',windowsHide:true});
fs.writeFileSync(path.join(runtime,'apply.log'),child.stdout+child.stderr,{flag:'wx'});assert.equal(child.status,0,child.stderr);
const ts=createRequire(path.join(root,'controle-financeiro-frontend/package.json'))('typescript');
for(const name of ['cf015.native-zoom.integrated.spec.ts','rf15-native-chrome.integrated.spec.ts','playwright.rf15.config.ts']) {
  const source=fs.readFileSync(path.join(runtime,'s/f/tests/e2e',name),'utf8');
  const result=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  assert.equal(result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,name);
}
const receipt={at:new Date(),structuralValidation:'passed',specs:2,config:1,
  functionalSuffix:'byte-identical; checked by aplicar.mjs',
  nativeZoomExecuted:false,productScenariosExecuted:false,syntheticPackage:true,
  manifestSha256:hash(path.join(runtime,'assisted-package.json'))};
fs.writeFileSync(path.join(runtime,'package-validation.json'),JSON.stringify(receipt,null,2),{flag:'wx'});
console.log(JSON.stringify(receipt));
