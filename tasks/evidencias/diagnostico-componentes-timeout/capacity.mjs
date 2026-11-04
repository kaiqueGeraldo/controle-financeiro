import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const file='/work/diag/experiments.mjs',before=fs.readFileSync(file,'utf8');
let text=before.replace("const mode=process.argv[2]??'initial';","const capacityGroup=[...group,'tests/component/temporal-forms.test.tsx','src/services/onboarding/identity-remediation.test.tsx'];\nconst mode=process.argv[2]??'initial';");
text=text.replace("]:mode==='D'?[{id:'D-group-workers2',files:group,workers:2}]:[];","]:mode==='D'?[{id:'D-group-workers2',files:group,workers:2}]:mode==='capacity'?[{id:'C8-observed-capacity',files:capacityGroup}]:[];");
assert.notEqual(before,text);
try{fs.writeFileSync(file,text);const result=spawnSync(process.execPath,[file,'capacity'],{stdio:'inherit'});assert.equal(result.status,0);}
finally{fs.writeFileSync(file,before);}
const root='/work/s/controle-financeiro-frontend';
const packages=['vitest','@vitest/runner','react','react-dom','jsdom','@testing-library/react','@testing-library/dom','@testing-library/user-event'];
fs.writeFileSync('/evidence/toolchain.json',JSON.stringify({node:process.version,packages:packages.map(name=>({name,version:JSON.parse(fs.readFileSync(root+'/node_modules/'+name+'/package.json')).version})),platform:process.platform,arch:process.arch},null,2)+'\n',{flag:'wx'});
