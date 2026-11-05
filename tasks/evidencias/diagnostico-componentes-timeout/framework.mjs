import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const root='/work/s/controle-financeiro-frontend/node_modules',output='/evidence/framework';fs.mkdirSync(output);
const files=[];
for(const directory of ['@vitest/runner/dist','vitest/dist/chunks']){
 for(const name of fs.readdirSync(path.join(root,directory)).filter(f=>f.endsWith('.js'))){
  const absolute=path.join(root,directory,name),text=fs.readFileSync(absolute,'utf8');
  const lines=text.split('\n'),matches=[];
  for(let i=0;i<lines.length;i++)if(/testTimeout.*5000|hookTimeout.*10000|function withTimeout|function runTest|await fn\(|callSuiteHook.*beforeEach|callSuiteHook.*afterEach|resolveMaxWorkers|availableParallelism/.test(lines[i]))matches.push({line:i+1,context:lines.slice(Math.max(0,i-3),Math.min(lines.length,i+11)).join('\n')});
  if(!matches.length)continue;
  const sha256=createHash('sha256').update(text).digest('hex');const saved=directory.replaceAll('/','-')+'-'+name;fs.writeFileSync(path.join(output,saved),text,{flag:'wx'});
  files.push({path:directory+'/'+name,sha256,saved,matches});
 }
}
fs.writeFileSync(path.join(output,'contract.json'),JSON.stringify({vitest:JSON.parse(fs.readFileSync(path.join(root,'vitest/package.json'))).version,runner:JSON.parse(fs.readFileSync(path.join(root,'@vitest/runner/package.json'))).version,files},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(files.map(f=>({file:f.path,matches:f.matches.map(m=>({line:m.line,first:m.context.split('\n').find(s=>/testTimeout.*5000|hookTimeout.*10000|function withTimeout|function runTest|await fn\(|callSuiteHook.*beforeEach|callSuiteHook.*afterEach|availableParallelism/.test(s))}))}))));
