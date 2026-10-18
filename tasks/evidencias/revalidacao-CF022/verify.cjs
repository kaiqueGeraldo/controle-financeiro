const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process');
const dir=__dirname,src=path.resolve(dir,'../investigacao-CF022');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const before=JSON.parse(fs.readFileSync(path.join(dir,'preservation-initial.json')));
const preservation=before.map(e=>({path:e.path,ok:hash(fs.readFileSync(e.path))===e.sha256}));
const browser=[];
for(const mode of ['original','date-only']){
 const base=path.join(src,'browser-api-'+mode),results=JSON.parse(fs.readFileSync(path.join(base,'results.json')));
 assert.equal(results.length,4);
 for(const zone of ['sp','kir']){
  const network=fs.readFileSync(path.join(base,zone+'-network.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
  const toggles=network.filter(x=>x.event==='request'&&x.path.endsWith('/toggle'));
  assert.equal(toggles.length,4);for(const t of toggles)assert.deepEqual(t.body,{date:'2027-01-04'});
  assert.equal(network.filter(x=>x.event==='response'&&x.path.endsWith('/toggle')&&x.status===200).length,4);
  for(const frequency of ['DAILY','WEEKLY_GOAL']){
   const snap=JSON.parse(fs.readFileSync(path.join(base,`${zone}-${frequency}-before.json`)));
   browser.push({mode,zone,frequency,driftMs:snap.performance-snap.timeline,negativeAnimations:snap.animations.filter(a=>a.current<0).length});
  }
 }
 assert.equal((fs.readFileSync(path.join(base,'terminal-sql.txt'),'utf8').match(/status=PENDING/g)||[]).length,4);
}
const clocks=JSON.parse(fs.readFileSync(path.join(dir,'clock-result.json'))).filter(r=>r.navigation===3).map(r=>({mode:r.mode,zone:r.timezoneId,driftMs:r.performance-r.timeline,animationCurrent:r.animationCurrent,native:r.native}));
const scheduler={};for(const name of ['fresh','residual501','isolated']){
 const content=fs.readFileSync(path.join(dir,'scheduler',name+'-observations.txt'),'utf8');
 scheduler[name]={result:fs.readFileSync(path.join(dir,'scheduler',name+'-result.txt'),'utf8'),samples:(content.match(/sample=/g)||[]).length,blockers:/blockers=\{\d/.test(content),ungranted:/granted=false/.test(content),poolWaiters:/waiting=[1-9]/.test(content)};
}
const changed=cp.execFileSync('git',['diff','--name-only','e1c6312','0bab205'],{encoding:'utf8'}).trim().split('\n');
assert(changed.every(p=>p.startsWith('tasks/')));assert(preservation.every(p=>p.ok));
const result={candidate:'0bab2050fcb8edbd879f75bb1e9f154ef0deabd8',readmeSHA256:hash(fs.readFileSync('README.md')),preservedFiles:preservation.length,preservationMismatches:preservation.filter(p=>!p.ok),candidatePaths:changed.length,browserReused:browser,clockIndependent:clocks,schedulerIndependent:scheduler};
fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
