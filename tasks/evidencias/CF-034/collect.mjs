import fs from 'node:fs';
import path from 'node:path';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';

// Durable, deliberately narrow collection. Raw process properties, HTTP bodies,
// browser state/traces, SQL/dumps and the executable JAR stay in the runtime.
const [runtimeArg,label]=process.argv.slice(2);
if(!runtimeArg||!label||!/^[a-z0-9-]+$/.test(label))throw new Error('runtime and safe label required');
const runtime=path.resolve(runtimeArg),destination=path.join(import.meta.dirname,'runs',label);
if(fs.existsSync(destination))throw new Error('Never replace a collected execution');
fs.mkdirSync(destination,{recursive:true});
const safe=text=>text.replaceAll(runtime,'${RUNTIME_ROOT}')
  .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED_JWT]')
  .replace(/Cf003-[AB]-Senha-2026/g,'[SYNTHETIC_PASSWORD]')
  .replace(/(password|secret|authorization|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi,'$1=[REDACTED]');
const files=[];
function copy(relative,local=relative){
  const input=path.join(runtime,relative);if(!fs.existsSync(input))return;
  const bytes=fs.readFileSync(input),output=path.join(destination,local);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,safe(bytes.toString('utf8')));
  files.push({runtimePath:relative,runtimeSha256:hash(bytes),collectedPath:local,collectedSha256:hash(fs.readFileSync(output))});
}
for(const name of ['result.json','backend-selection.json','package-manifest.json','counterproof.json','control.json',
  'lint.log','typecheck.log','unit.log','build.log','components.log'])copy(name);
for(const folder of ['surefire','e2e-surefire']){
  const directory=path.join(runtime,folder);if(!fs.existsSync(directory))continue;
  const suites=fs.readdirSync(directory).filter(p=>p.startsWith('TEST-')&&p.endsWith('.xml')).sort().map(file=>{
    const bytes=fs.readFileSync(path.join(directory,file)),text=bytes.toString('utf8');
    const opening=text.match(/<testsuite\b[^>]*>/)?.[0];if(!opening)throw new Error(`No suite ${file}`);
    const counts=Object.fromEntries(['tests','failures','errors','skipped'].map(key=>{
      const match=opening.match(new RegExp(`\\b${key}="(\\d+)"`));if(!match)throw new Error(`No ${key}`);return [key,Number(match[1])];
    }));
    const failures=[...text.matchAll(/<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g)]
      .filter(m=>/<(?:failure|error)\b/.test(m[2])).map(m=>m[1].match(/\bname="([^"]+)"/)?.[1]);
    return {file,sha256:hash(bytes),...counts,failedCases:failures};
  });
  writeJson(path.join(destination,folder+'-summary.json'),{suites,counts:suites.reduce((a,s)=>{
    for(const key of Object.keys(a))a[key]+=s[key];return a;
  },{tests:0,failures:0,errors:0,skipped:0})});
}
const components=path.join(runtime,'components.json');
if(fs.existsSync(components)){
  const v=JSON.parse(fs.readFileSync(components));
  writeJson(path.join(destination,'components-summary.json'),{rawSha256:hash(fs.readFileSync(components)),
    tests:v.numTotalTests,passed:v.numPassedTests,failed:v.numFailedTests,pending:v.numPendingTests,todo:v.numTodoTests,
    files:v.testResults.map(r=>({file:path.relative(path.dirname(path.dirname(runtime)),r.name).replaceAll('\\','/'),status:r.status,tests:r.assertionResults.length}))});
}
const browser=path.join(runtime,'browser/playwright.json');
if(fs.existsSync(browser)){
  const bytes=fs.readFileSync(browser),p=JSON.parse(bytes);const cases=[];
  function walk(suites){for(const s of suites??[]){for(const spec of s.specs??[])for(const t of spec.tests??[])cases.push({title:spec.title,project:t.projectName,status:t.status,runs:t.results.map(r=>({status:r.status,duration:r.duration}))});walk(s.suites);}}
  walk(p.suites);writeJson(path.join(destination,'browser-summary.json'),{rawSha256:hash(bytes),stats:p.stats,errors:p.errors?.length??0,cases});
  const observations=fs.readdirSync(path.dirname(browser)).filter(f=>f==='environment.json'||f==='terminal-sql.json'||f.endsWith('-sql.json')||f.endsWith('.analysis.json')).sort().map(file=>{
    const bytes=fs.readFileSync(path.join(path.dirname(browser),file));return {file,sha256:hash(bytes),bytes:bytes.length};
  });
  writeJson(path.join(destination,'browser-observations.json'),{policy:'raw synthetic SQL and workbook observations retained externally; identity inventory only',observations});
  const envFile=path.join(path.dirname(browser),'environment.json');
  if(fs.existsSync(envFile)){
    const env=JSON.parse(fs.readFileSync(envFile));
    const keys=['springPort','startupJvmZone','jvmZone','productInstant','namespace','database','migrations','ddl','externalDoubles','head'];
    writeJson(path.join(destination,'browser-environment.json'),Object.fromEntries(keys.map(key=>[key,env[key]])));
  }
}
if(fs.existsSync(path.join(runtime,'gate/result.json'))){copy('gate/result.json');for(const f of ['lint.log','unit.log'])copy('gate/'+f);}
writeJson(path.join(destination,'collection.json'),{label,runtime,at:new Date().toISOString(),policy:'explicit allowlist; raw diagnostics retained externally',files});
console.log(destination);
