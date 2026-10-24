import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]);
const output=path.join(root,'public');fs.mkdirSync(output,{recursive:true});
const sanitize=text=>text.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED_JWT]').replace(/Cf003-[AB]-Senha-2026/g,'[SYNTHETIC_PASSWORD]').replace(/(password|secret|authorization|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi,'$1=[REDACTED]');
// Explicit allowlist: never publish raw Surefire properties, HTTP state, traces,
// browser profiles, .env files, dependency caches, SQL dumps or authentication data.
for(const file of ['result.json','lint.log','typecheck.log','unit.log','components.log','build.log','backend.log','e2e.log']){
  const input=path.join(root,file);if(fs.existsSync(input))fs.writeFileSync(path.join(output,file),sanitize(fs.readFileSync(input,'utf8')));
}
const browser=path.join(root,'browser/playwright.log');if(fs.existsSync(browser))fs.writeFileSync(path.join(output,'playwright.log'),sanitize(fs.readFileSync(browser,'utf8')));
if(!fs.existsSync(path.join(output,'result.json')))fs.writeFileSync(path.join(output,'collection.json'),JSON.stringify({status:'gate did not produce a result; no approval inferred'})+'\n');
