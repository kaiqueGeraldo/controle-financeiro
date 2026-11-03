import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const [runtimeArg]=process.argv.slice(2);
const runtime=path.resolve(runtimeArg??'');
assert.match(path.basename(runtime),/^zoom-assistido-[a-z0-9-]+$/);
const prepared=JSON.parse(fs.readFileSync(path.join(runtime,'prepared.json')));
assert.equal(path.dirname(runtime),path.resolve(prepared.root,'../../controle-financeiro-runtimes/preparacao-adocao'));
assert.ok(!fs.existsSync(path.join(runtime,'s/f/.next')),'A fresh original copy is required');
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const file of prepared.files)assert.equal(hash(path.join(runtime,'s',file.copy)),file.actual);
const archive=path.join(runtime,'assisted-originals');fs.mkdirSync(archive);
const changes=[];
function edit(relative,transform) {
  const file=path.join(runtime,'s',relative),before=fs.readFileSync(file,'utf8'),after=transform(before);
  assert.notEqual(after,before);
  const archived=path.join(archive,path.basename(file));
  fs.copyFileSync(file,archived);fs.writeFileSync(file,after);
  changes.push({relative,original:hash(archived),actual:hash(file),archived});
}
edit('f/tests/e2e/playwright.rf15.config.ts',text=>{
  assert.ok(text.includes('export default defineConfig({ ...base,'));
  return text.replace('export default defineConfig({ ...base,',"export default defineConfig({ ...base, globalSetup: './support/zoom-readiness.mjs',");
});
for(const scenario of ['cf015','rf15']) {
  const spec=scenario==='cf015'?'cf015.native-zoom.integrated.spec.ts':'rf15-native-chrome.integrated.spec.ts';
  const owner=scenario==='cf015'?'cf015-native-zoom':'rf15-native-chrome';
  edit('f/tests/e2e/'+spec,text=>{
    const original=text;
    text='import {pauseForNativeZoom,finishAssisted} from "./support/assisted-adapter.mjs";\n'+text;
    text=text.replace('  try {','  let assisted; let completed = false; let context;\n  try {');
    text=text.replace('    const context =','    context =');
    const metricPoll='    await expect.poll(async () => (await metrics()).dpr / before.dpr, { timeout: 180_000 }).toBe(2);';
    assert.ok(text.includes(metricPoll));
    const pause='    assisted = await pauseForNativeZoom({page,context,browser,info,directory,cardId:card.id,expectedEmail:fixtureUser("B",process.env.CF_E2E_NAMESPACE!,"'+owner+'","zoom").email,scenario:"'+scenario+'",execution:process.env.ZOOM_ASSISTED_EXECUTION,candidate:process.env.ZOOM_ASSISTED_CANDIDATE,packageSha256:process.env.ZOOM_ASSISTED_PACKAGE});\n';
    text=text.replace(metricPoll,pause+metricPoll);
    const scalar='    await expect.poll(async () => readFile(path.join(directory, "native-confirmed.txt"), "utf8").catch(() => "pending"), { timeout: 60_000 }).toBe("200%");';
    assert.ok(text.includes(scalar));
    text=text.replace(scalar,'    // Structured, one-use human confirmation was consumed by the explicit pause above.');
    const end='    await writeFile(path.join(directory, "observations.json"), JSON.stringify(observations, null, 2));';
    assert.ok(text.includes(end));
    text=text.replace(end,end+'\n    completed = true;');
    text=text.replace('  } finally { await browser.close(); }','  } finally { finishAssisted(assisted,completed); try { await context?.close(); } finally { await browser.close(); } }');
    // All actual zoom geometry, routes, interactions, entity, scrolling and focus assertions are byte-identical.
    const start='    const after = await metrics();';
    const suffix=t=>t.slice(t.indexOf(start),t.indexOf(end)+end.length);
    assert.equal(suffix(text),suffix(original),'Functional suffix must remain unchanged');
    return text;
  });
}
const extras=[];
for(const [source,name] of [['protocolo.mjs','protocolo.mjs'],['adaptador.mjs','assisted-adapter.mjs'],['preparacao.mjs','zoom-readiness.mjs']]) {
  const file=path.join(runtime,'s/f/tests/e2e/support',name);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.copyFileSync(path.join(import.meta.dirname,source),file);
  extras.push({relative:'f/tests/e2e/support/'+name,sha256:hash(file)});
}
fs.writeFileSync(path.join(runtime,'assisted-package.json'),JSON.stringify({candidate:prepared.candidate,
  preparedSha256:hash(path.join(runtime,'prepared.json')),changes,extras,
  contract:'Runtime-only compilation readiness and structured human pause. Functional suffix byte-identical. No native zoom is applied by code.'
},null,2),{flag:'wx'});
console.log(JSON.stringify({adapted:true,changes:changes.length,extras:extras.length,fullScenariosExecuted:false}));
