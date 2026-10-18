const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=process.cwd(),{chromium}=require(path.join(root,'controle-financeiro-frontend/node_modules/@playwright/test'));
const time=Date.parse('2027-01-05T02:59:59Z'),out=path.join(__dirname,'clock-result.json');
if(fs.existsSync(out))throw Error('Preserve prior result');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><button id="target">Synthetic target</button>');});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch();const rows=[];
 try {
  for(const timezoneId of ['America/Sao_Paulo','Pacific/Kiritimati'])for(const mode of ['original','date-only']){
   const context=await browser.newContext({timezoneId,reducedMotion:'no-preference'});
   try {
    const page=await context.newPage();
    if(mode==='original')await page.clock.setFixedTime(new Date(time));
    else await page.addInitScript(time=>{const NativeDate=Date;window.Date=new Proxy(NativeDate,{apply(){return new NativeDate(time).toString();},construct(target,args,newTarget){return Reflect.construct(target,args.length?args:[time],newTarget);},get(target,key,receiver){return key==='now'?()=>time:Reflect.get(target,key,receiver);}});},time);
    for(let navigation=0;navigation<4;navigation++){
     await page.goto(`http://127.0.0.1:${server.address().port}/?n=${navigation}`);
     const sample=await page.evaluate(async()=>{
      // Frame events, not sleep; identical observation budget in both modes.
      for(let frame=0;frame<8;frame++)await new Promise(requestAnimationFrame);
      const a=document.querySelector('button').animate([{opacity:0},{opacity:1}],{duration:200,fill:'both'});
      a.startTime=performance.now();
      await new Promise(requestAnimationFrame);
      const result={date:Date.now(),iso:new Date().toISOString(),explicit:new Date('2000-01-01T00:00:00Z').toISOString(),productDay:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()),performance:performance.now(),timeline:document.timeline.currentTime,animationCurrent:a.currentTime,native:{performance:performance.now.toString().includes('[native code]'),timer:setTimeout.toString().includes('[native code]'),raf:requestAnimationFrame.toString().includes('[native code]')}};
      a.cancel();return result;
     });
     rows.push({timezoneId,mode,navigation,...sample});
    }
   }finally{await context.close();}
  }
  fs.writeFileSync(out,JSON.stringify(rows,null,2));
  for(const r of rows){assert.equal(r.date,time);assert.equal(r.productDay,'2027-01-04');assert.equal(r.explicit,'2000-01-01T00:00:00.000Z');}
  for(const zone of ['America/Sao_Paulo','Pacific/Kiritimati']){
   const old=rows.find(r=>r.timezoneId===zone&&r.mode==='original'&&r.navigation===3);
   const fixed=rows.find(r=>r.timezoneId===zone&&r.mode==='date-only'&&r.navigation===3);
   assert(old.performance-old.timeline>200);assert(old.animationCurrent<0);
   assert(Math.abs(fixed.performance-fixed.timeline)<50);assert(fixed.animationCurrent>=0);
   assert(Object.values(fixed.native).every(Boolean));assert(Object.values(old.native).every(v=>!v));
  }
  console.log('PASS 16 observations; native clocks preserved by Date-only; dates invariant in both zones');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
