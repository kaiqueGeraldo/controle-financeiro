const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=__dirname,root=process.cwd(),runtime=path.join(root,'.cf22r');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const before=JSON.parse(fs.readFileSync(path.join(dir,'preservation-initial.json')));
const changed=before.filter(e=>!fs.existsSync(e.path)||hash(fs.readFileSync(e.path))!==e.sha256);
assert.equal(changed.length,0,'Historical files changed');
cp.execFileSync('git',['diff','--exit-code','5e2fae5','--','controle-financeiro-backend','controle-financeiro-frontend']);
const normalized=p=>{const b=fs.readFileSync(p);return /\.(png|ico|jpg|jpeg|woff2?|ttf)$/.test(p)?b:Buffer.from(b.toString('utf8').replaceAll('\r\n','\n'));};
const sources=cp.execFileSync('git',['ls-files','controle-financeiro-backend/src/main','controle-financeiro-frontend/src'],{encoding:'utf8'}).trim().split('\n');
for(const p of sources)assert(normalized(p).equals(normalized(path.join(runtime,p))),p);
const test='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit';
const candidate=['HabitBrowserIntegrationTest.java','HabitIntegrityIntegrationTest.java','HabitSchemaInitializer.java','HabitFixtureIsolationIntegrationTest.java','browser.cjs','civil-date-clock.cjs','civil-date-clock.test.cjs'].map(name=>{
 const p=path.join(test,name),original=cp.execFileSync('git',['show','5e2fae5:'+p.replaceAll('\\','/')]);
 assert(normalized(p).equals(Buffer.from(original.toString().replaceAll('\r\n','\n'))));
 assert(normalized(p).equals(normalized(path.join(runtime,p))));
 assert(fs.readFileSync(path.join(runtime,p)).equals(original),'Runtime differs from candidate blob: '+name);
 return {name,sourceSHA256:hash(fs.readFileSync(p)),runtimeSHA256:hash(fs.readFileSync(path.join(runtime,p))),normalizedMatch:true};
});
const executions={};
for(const name of ['backend','mutation','browser']){
 const base=path.join(dir,name),meta=JSON.parse(fs.readFileSync(path.join(base,'execution.json')));
 const reports=fs.readdirSync(path.join(base,'surefire')).filter(p=>p.endsWith('.xml')).map(p=>{
  const xml=fs.readFileSync(path.join(base,'surefire',p),'utf8'),tag=xml.match(/<testsuite\s[^>]*>/)[0];
  const get=k=>tag.match(new RegExp(' '+k+'="([^"]+)"'))?.[1];
  return {name:get('name'),tests:+get('tests'),failures:+get('failures'),errors:+get('errors'),skipped:+get('skipped')};
 });
 executions[name]={exitCode:meta.exitCode,reports};
 assert.equal(meta.exitCode,name==='mutation'?1:0);
 assert.equal(reports.reduce((n,r)=>n+r.tests,0),name==='backend'?31:name==='mutation'?2:1);
 assert.equal(reports.reduce((n,r)=>n+r.failures,0),name==='mutation'?1:0);
 assert.equal(reports.reduce((n,r)=>n+r.errors+r.skipped,0),0);
}
const lifecycle=fs.readFileSync(path.join(dir,'backend/maven.log'),'utf8');
const schemas=[...lifecycle.matchAll(/REVIEW schema=(\w+) connectionSchema=(\w+)/g)].map(m=>{assert.equal(m[1],m[2]);return m[1];});
assert.equal(new Set(schemas).size,4);assert.equal((lifecycle.match(/REVIEW previous context\/pool\/scheduler closed/g)||[]).length,4);
const paints=JSON.parse(fs.readFileSync(path.join(dir,'browser/paint-clocks.json')));
assert.equal(paints.length,12);for(const p of paints){assert(p.native.every(Boolean));assert.equal(p.date,'2027-01-05T02:59:59.000Z');assert(p.animations.every(a=>a.currentTime===null||a.currentTime>=0));}
const journeys=JSON.parse(fs.readFileSync(path.join(dir,'browser/results.json')));assert.equal(journeys.length,4);
const oldLog=fs.readFileSync(path.join(dir,'clock-old.log'),'utf8'),newLog=fs.readFileSync(path.join(dir,'clock-candidate.log'),'utf8');
assert(oldLog.includes('Timers/performance/rAF must stay native'));assert(/pass 1/.test(newLog));
const summary={candidate:'5e2fae5355ad2c745b955b66d676b6c479edf8e1',preserved:before.length,mismatches:changed,readmeSHA256:hash(fs.readFileSync('README.md')),productSources:sources.length,candidateSources:candidate,executions,lifecycle:{schemas,closedContexts:4,closedPools:4,terminatedSchedulers:4},browser:{journeys:journeys.length,paintObservations:paints.length,maxDriftMs:Math.max(...paints.map(p=>Math.abs(p.performance-p.timeline))),negativeAnimations:0}};
fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
