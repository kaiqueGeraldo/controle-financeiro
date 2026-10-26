import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const runtime=path.resolve(process.argv[2]??'');
const allowed=path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep;
if(!runtime.startsWith(allowed))throw new Error('Expected preparation runtime');
const destination=path.resolve('tasks/evidencias/preparacao-local-adocao');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function junit(folder) {
  const directory=path.join(runtime,folder);
  const files=fs.readdirSync(directory).filter(f=>f.endsWith('.xml'));
  if(!files.length)throw new Error('Missing JUnit reports: '+folder);
  const classes=files.sort().map(file=>{
    const text=fs.readFileSync(path.join(directory,file),'utf8');
    const header=text.match(/<testsuite\b([^>]*)>/)?.[1];
    if(!header)throw new Error('Invalid JUnit '+file);
    const attrs=Object.fromEntries([...header.matchAll(/([\w.-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
    return {file,name:attrs.name,tests:Number(attrs.tests),failures:Number(attrs.failures),errors:Number(attrs.errors),
      skipped:Number(attrs.skipped),seconds:Number(attrs.time),sha256:sha(path.join(directory,file)),
      cases:[...text.matchAll(/<testcase\b([^>]*)>/g)].map(m=>m[1].match(/\bname="([^"]*)"/)?.[1])};
  });
  const totals=classes.reduce((sum,c)=>{for(const key of ['tests','failures','errors','skipped'])sum[key]+=c[key];return sum;},
    {tests:0,failures:0,errors:0,skipped:0});
  return {directory,classes:classes.length,totals,passed:totals.tests>0&&totals.failures===0&&totals.errors===0&&totals.skipped===0,reports:classes};
}
const reports={pg17Classes:junit('../p03/pg17-reports'),pg16Required:junit('../p03/pg16-reports'),
  habitRevalidation:junit('habit-reports'),packagedJar:junit('jar-reports'),localImage:junit('image-reports'),browserWrapper:junit('e2e-reports')};
const prior=path.join(runtime,'../p03');
const originalInputs=JSON.parse(fs.readFileSync(path.join(prior,'inputs.json')));
const finalInputs=JSON.parse(fs.readFileSync(path.join(runtime,'inputs.json')));
const differences=finalInputs.inputs.filter(x=>originalInputs.inputs.find(y=>y.file===x.file)?.sha256!==x.sha256).map(x=>x.file);
if(differences.length!==1 || !differences[0].endsWith('/domain/habit/HabitIntegrityIntegrationTest.java'))throw new Error('Unexpected cross-revision difference');
const initiallyFailed=reports.pg16Required.reports.filter(x=>x.errors||x.failures||x.skipped);
if(initiallyFailed.length!==2 || reports.pg16Required.totals.errors!==58)throw new Error('Unexplained broad regression failure');
for(const failed of initiallyFailed) {
  const revalidated=reports.habitRevalidation.reports.find(x=>x.name===failed.name);
  if(!revalidated || revalidated.tests!==failed.tests || JSON.stringify([...revalidated.cases].sort())!==JSON.stringify([...failed.cases].sort()))throw new Error('Changed scheduler cases were not fully revalidated');
}
const components=JSON.parse(fs.readFileSync(path.join(prior,'components.json')));
const browser=JSON.parse(fs.readFileSync(path.join(runtime,'browser/playwright.json')));
const summary={inputCommit:JSON.parse(fs.readFileSync(path.join(runtime,'inputs.json'))).commit,
  reports,sourceEquivalence:{originalCommit:originalInputs.commit,finalCommit:finalInputs.commit,changedInputs:differences,
    allProductionInputsIdentical:true,unchangedClassesPassed:reports.pg16Required.classes-initiallyFailed.length,
    unchangedExecutionsPassed:reports.pg16Required.totals.tests-reports.pg16Required.totals.errors,
    changedFixtureExecutionsRevalidated:reports.habitRevalidation.totals.tests},
  components:{tests:components.numTotalTests,passed:components.numPassedTests,failed:components.numFailedTests,pending:components.numPendingTests},
  browser:{...browser.stats,errors:browser.errors?.length??0},
  counting:'Independent invocations with overlapping cases. Do not sum class runs, packaged runs, image runs, counterproofs and browser journeys into a unique test total.',
  startupLimit:'Classes retained one 40-second startup failure; native JAR had three sequential startup failures; the later restored Linux witness had two startup failures. Cause inconclusive, not isolated to Windows. Complete Linux matrix passed earlier; no retry/timeout increase or claim of stable startup.',
  restoredWitness:JSON.parse(fs.readFileSync(path.join(runtime,'../p04/counterproofs/witness.json')))};
for(const name of ['habitRevalidation','localImage','browserWrapper'])if(!reports[name].passed)throw new Error('Required final invocation failed: '+name);
if(reports.packagedJar.totals.tests!==17 || reports.packagedJar.totals.failures!==3 || reports.packagedJar.totals.errors || reports.packagedJar.totals.skipped)throw new Error('Unexpected native Windows outcome; investigate');
if(reports.localImage.totals.tests!==17 || JSON.stringify([...reports.localImage.reports[0].cases].sort())!==JSON.stringify([...reports.packagedJar.reports[0].cases].sort()))throw new Error('Linux did not exercise the complete packaged case matrix');
if(summary.components.failed||summary.components.pending||summary.browser.unexpected||summary.browser.skipped||summary.browser.flaky||summary.browser.errors)throw new Error('Frontend/browser failures remain');
fs.writeFileSync(path.join(destination,'results.json'),JSON.stringify(summary,null,2)+'\n');
const logFolder=path.join(destination,'logs');fs.mkdirSync(logFolder,{recursive:true});
const logs=['habit-regression.log','jar.log','image.log','e2e.log','image-build.log','maven-version.log','packaged-cli.log'];
for(const file of logs)fs.copyFileSync(path.join(runtime,file),path.join(logFolder,file));
for(const file of ['pg17-final.log','pg16-regression.log','frontend-unit.log','frontend-components.log','frontend-build.log','frontend-build-final.log'])fs.copyFileSync(path.join(prior,file),path.join(logFolder,file));
for(const [file,name] of [['../p01/before-pg17.log','before-pg17.log'],['../p02/pg17-first.log','pg17-fixtures-first.log'],
  ['../p02/frontend-lint.log','frontend-lint.log'],['../p02/frontend-types.log','frontend-types.log'],['../p02/frontend-bff.log','frontend-bff.log']]) {
  fs.copyFileSync(path.join(runtime,file),path.join(logFolder,name));
}
for(const file of ['inputs.json','toolchain.json','image.json'])fs.copyFileSync(path.join(runtime,file),path.join(destination,file));
fs.copyFileSync(path.join(runtime,'packaged-resources-final.json'),path.join(destination,'packaged-resources.json'));
for(const file of ['backend-selection.json','pg16-command.json'])fs.copyFileSync(path.join(prior,file),path.join(destination,file));
fs.copyFileSync(path.join(runtime,'package/stage.json'),path.join(destination,'package.json'));
const counter=path.join(runtime,'../p04/counterproofs');
fs.cpSync(counter,path.join(destination,'counterproofs'),{recursive:true,filter:file=>fs.statSync(file).isDirectory()
  ? !/(-reports|-image)$/.test(path.basename(file)) : /\.(json|log)$/.test(file)});
fs.cpSync(path.join(runtime,'package-counterproof'),path.join(destination,'package-counterproof'),{recursive:true,
  filter:file=>fs.statSync(file).isDirectory()||/\.(json|log)$/.test(file)});
for(const [source,name] of [['cf017-restore-proof-before','before'],['cf017-restore-proof-final','final']]) {
  fs.cpSync(path.join(prior,'pg17-artifacts',source),path.join(destination,'snapshots/pg17',name),{recursive:true});
}
fs.copyFileSync(path.join(runtime,'browser/playwright.json'),path.join(destination,'browser.json'));
fs.copyFileSync(path.join(runtime,'browser/playwright.log'),path.join(logFolder,'playwright.log'));
const browserFolder=path.join(destination,'browser');fs.mkdirSync(browserFolder,{recursive:true});
const browserEvidence=fs.readdirSync(path.join(runtime,'browser')).filter(file=>
  /(-sql|-result|-protocol|-api-versus-ui|\.xlsx\.analysis)\.json$/.test(file)
  || ['environment.json','terminal-sql.json'].includes(file));
for(const file of browserEvidence)fs.copyFileSync(path.join(runtime,'browser',file),path.join(browserFolder,file));
for(const file of ['counterproof-run.log','counterproof-run-02.log'])fs.copyFileSync(path.join(runtime,'../p04',file),path.join(logFolder,file));
function artifacts(folder,relative='') {
  return fs.readdirSync(path.join(folder,relative),{withFileTypes:true}).flatMap(entry=>{
    const name=path.join(relative,entry.name);
    return entry.isDirectory()?artifacts(folder,name):[name];
  });
}
const durableArtifacts=artifacts(destination).filter(file=>
  !['collection.json','preservation.json'].includes(file) && !/\.(md|mjs|ps1)$/.test(file) && file!=='.gitattributes');
fs.writeFileSync(path.join(destination,'collection.json'),JSON.stringify({runtime,inputManifestSha256:sha(path.join(runtime,'inputs.json')),
  logs:Object.fromEntries(fs.readdirSync(logFolder).map(file=>[file,sha(path.join(logFolder,file))])),
  artifacts:Object.fromEntries(durableArtifacts.map(file=>[file.replaceAll('\\','/'),sha(path.join(destination,file))]))},null,2)+'\n');
console.log(JSON.stringify({reports:Object.fromEntries(Object.entries(reports).map(([k,v])=>[k,{...v.totals,classes:v.classes}])),components:summary.components,browser:summary.browser}));
