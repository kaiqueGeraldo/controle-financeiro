const fs=require('node:fs'),path=require('node:path');
const dir=__dirname,summary={scheduler:{},browser:{}};
for(const mode of ['lazy','eager']){
 summary.scheduler[mode]={};
 for(const fixture of ['fresh','residual501']){
  const base=path.join(dir,'scheduler-'+mode,fixture),obs=fs.readFileSync(base+'-observations.txt','utf8');
  summary.scheduler[mode][fixture]={result:fs.readFileSync(base+'-result.txt','utf8'),samples:(obs.match(/^sample=/gm)||[]).length,
   hasBlockingPid:/blockers=\{\d/.test(obs),hasUngrantedLock:/locks=\[\{/.test(obs),poolWaiter:/waiting=[1-9]/.test(obs),
   maxPoolActive:Math.max(...[...obs.matchAll(/pool=(\d+)/g)].map(m=>+m[1])),habitDaysQuery:obs.includes('habit_days')};
 }
}
for(const mode of ['original','original-02','original-03','date-only','api-original','api-date-only']){
 const base=path.join(dir,'browser-'+mode);if(!fs.existsSync(base))continue;
 const observations=[];
 for(const file of fs.readdirSync(base).filter(x=>x.endsWith('.json')&&x!=='results.json')){
  const j=JSON.parse(fs.readFileSync(path.join(base,file),'utf8'));
  observations.push({file,clockDelta:j.performance-j.timeline,dialogs:j.dialogs?.map(x=>({label:x.label,opacity:x.opacity,pointerEvents:x.pointerEvents})),buttons:j.buttons,animations:j.animations?.filter(x=>typeof x.current==='number'&&x.current<0)});
 }
 summary.browser[mode]={observations,results:fs.existsSync(path.join(base,'results.json'))?JSON.parse(fs.readFileSync(path.join(base,'results.json'),'utf8')):null};
}
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary.scheduler,null,2));
