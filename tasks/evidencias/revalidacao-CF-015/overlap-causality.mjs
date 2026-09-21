import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(), evidence=path.join(root,'tasks/evidencias/revalidacao-CF-015');
const {copy}=JSON.parse(fs.readFileSync(path.join(evidence,'regression-probe.json'),'utf8'));
const relative='src/hooks/useCards.ts', file=path.join(copy,relative), original=fs.readFileSync(file,'utf8');
const fragment='if (reconciliation.isCurrent()) throw error;';
if(original.split(fragment).length!==2)throw new Error('Expected unique causal fragment');
const test='tests/component/cf015-revalidation-overlap.test.tsx';
fs.copyFileSync(path.join(root,'controle-financeiro-frontend',test),path.join(copy,test));
let result;
try {
  fs.writeFileSync(file,original.replace(fragment,'throw error;'));
  result=spawnSync(process.execPath,[path.join(copy,'node_modules/vitest/vitest.mjs'),'run','--root',copy,'--config',path.join(copy,'tests/component/vitest.config.mts'),test],{cwd:copy,encoding:'utf8',windowsHide:true});
  fs.writeFileSync(path.join(evidence,'sobreposicao-causal-isolada.log'),result.stdout+result.stderr);
} finally {fs.writeFileSync(file,original);}
const hash=x=>createHash('sha256').update(x).digest('hex');
fs.writeFileSync(path.join(evidence,'sobreposicao-causal-isolada.json'),JSON.stringify({copy,mutation:'Only isolated copy: propagate rejection regardless of reconciliation generation',exit:result.status,restored:fs.readFileSync(file,'utf8')===original,productUnchanged:hash(fs.readFileSync(path.join(root,'controle-financeiro-frontend',relative)))===hash(original)},null,2));
if(result.status!==0)process.exitCode=1;
