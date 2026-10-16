// Metadata only: no auth, headers or arbitrary response bodies.
async function settle(promises){
 const settled=await Promise.allSettled(promises);
 const failures=settled.filter(x=>x.status==='rejected');
 if(failures.length)throw new AggregateError(failures.map(x=>x.reason),failures.map(x=>String(x.reason)).join('\n'));
 return settled.map(x=>x.value);
}
async function installObservation(page,dir,key){
 const fs=require('node:fs'),path=require('node:path');
 page.on('request',r=>{if(/\/api\/habits/.test(r.url()))fs.appendFileSync(path.join(dir,key+'-network.jsonl'),JSON.stringify({event:'request',at:Date.now(),method:r.method(),path:new URL(r.url()).pathname,body:r.url().endsWith('/toggle')?r.postDataJSON():undefined})+'\n');});
 page.on('response',r=>{if(/\/api\/habits/.test(r.url()))fs.appendFileSync(path.join(dir,key+'-network.jsonl'),JSON.stringify({event:'response',at:Date.now(),status:r.status(),path:new URL(r.url()).pathname})+'\n');});
 await page.addInitScript(()=>{
  window.__cf22events=[];
  for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>window.__cf22events.push({type,target:e.target?.closest('button')?.textContent?.trim(),performance:performance.now(),timeline:document.timeline.currentTime}),true);
 });
}
async function observe(page,dir,name){
 const fs=require('node:fs/promises'),path=require('node:path');
 const observation=await page.evaluate(()=>({date:new Date().toISOString(),performance:performance.now(),timeline:document.timeline.currentTime,events:window.__cf22events,
  dialogs:[...document.querySelectorAll('[role=dialog]')].map(e=>({label:e.getAttribute('aria-label'),text:e.textContent,opacity:getComputedStyle(e).opacity,pointerEvents:getComputedStyle(e).pointerEvents,rect:e.getBoundingClientRect().toJSON()})),
  buttons:[...document.querySelectorAll('button')].filter(e=>/Avançar Progresso|Marcar Feito|Feito Hoje/.test(e.textContent)).map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {text:e.textContent,disabled:e.disabled,rect:r.toJSON(),hit:hit?.tagName,hitText:hit?.textContent?.slice(0,250),receives:e.contains(hit),opacity:getComputedStyle(e).opacity};}),
  animations:document.getAnimations().map(a=>({state:a.playState,start:a.startTime,current:a.currentTime,timing:a.effect?.getComputedTiming(),target:a.effect?.target?.tagName,text:a.effect?.target?.textContent?.slice(0,120)})),
  css:{sheets:document.styleSheets.length,grid:[...document.querySelectorAll('.grid')].map(e=>getComputedStyle(e).display)}
 }));
 await fs.writeFile(path.join(dir,name+'.json'),JSON.stringify(observation,null,2));
 await page.screenshot({path:path.join(dir,name+'.png')});
}
