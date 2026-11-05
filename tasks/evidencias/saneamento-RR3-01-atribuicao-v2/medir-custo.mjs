import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const rt=path.resolve(process.argv[2]),front=path.join(rt,'s/f'),require=createRequire(import.meta.url);process.env.PLAYWRIGHT_BROWSERS_PATH='0';
const {chromium}=require(path.join(front,'node_modules/@playwright/test')),{textGeometry}=await import(pathToFileURL(path.join(front,'tests/e2e/support/text-geometry.ts'))),browser=await chromium.launch(),page=await browser.newPage({viewport:{width:360,height:900}}),cdp=await page.context().newCDPSession(page),records=[];
try{
 await page.setContent('<style>body{margin:20px;background:#09090b;font:600 14px Arial;color:#ff2756}.badge{display:flex;width:max-content;padding:6px 8px;border:1px solid #582032;border-radius:6px;background:linear-gradient(90deg,#2d1520,#211217)}#text{display:contents}</style><div class="badge"><span id="text">Custo ou avaliação indisponível</span></div>');
 const target=page.locator('#text'),native=page.screenshot.bind(page);
 for(let n=0;n<5;n++){
  const capture=[],samples=[{node:process.memoryUsage(),renderer:await cdp.send('Runtime.getHeapUsage')}];
  page.screenshot=async options=>{const start=performance.now(),image=await native(options);capture.push({ms:performance.now()-start,bytes:image.length,clip:options.clip});samples.push({node:process.memoryUsage(),renderer:await cdp.send('Runtime.getHeapUsage')});return image;};
  const start=performance.now(),observed=await textGeometry(target,'Custo ou avaliação indisponível'),ms=performance.now()-start;page.screenshot=native;
  samples.push({node:process.memoryUsage(),renderer:await cdp.send('Runtime.getHeapUsage')});
  assert.equal(observed.ok,true);assert.equal(capture.length,3);
  const captureMs=capture.reduce((s,c)=>s+c.ms,0);records.push({index:n,totalMs:ms,captureMs,outsideCaptureMs:ms-captureMs,capture,samples,paint:observed.paint,reference:observed.reference});
 }
 await page.setContent('<style>body{margin:20px;background:white;color:black}.badge{display:flex;width:max-content;filter:opacity(0)}#text{display:contents}.decoy{position:absolute;left:20px;top:20px;pointer-events:none}</style><div class="badge"><span id="text">Custo ou avaliação indisponível</span></div><span class="decoy">Custo ou avaliação indisponível</span>');
 const neighborImages=[];page.screenshot=async options=>{const image=await native(options);fs.writeFileSync(path.join(rt,'neighbor-'+(neighborImages.length+1)+'.png'),image,{flag:'wx'});neighborImages.push(image);return image;};
 const neighbor=await textGeometry(page.locator('#text'),'Custo ou avaliação indisponível');page.screenshot=native;
 assert.equal(neighbor.ok,false);assert.ok(neighbor.failures.includes('no-glyph-paint'));assert.equal(neighborImages.length,3);assert.ok(neighborImages[0].equals(neighborImages[1])&&neighborImages[0].equals(neighborImages[2]));
 fs.writeFileSync(path.join(rt,'neighbor-visible.json'),JSON.stringify({at:new Date(),targetFilter:await page.locator('.badge').evaluate(el=>getComputedStyle(el).filter),decoyVisible:await page.locator('.decoy').isVisible(),targetStyle:await page.locator('#text').getAttribute('style'),identicalImages:true,observed:neighbor},null,2)+'\n',{flag:'wx'});
 const times=records.map(r=>r.totalMs).sort((a,b)=>a-b),summary={at:new Date(),fixture:'controlled badge styles/geometry; Arial14, not a production browser benchmark',observations:5,captures:15,minMs:times[0],medianMs:times[2],maxMs:times[4],maxObservedNodeRss:Math.max(...records.flatMap(r=>r.samples.map(s=>s.node.rss))),maxObservedNodeHeap:Math.max(...records.flatMap(r=>r.samples.map(s=>s.node.heapUsed))),maxObservedRendererJsHeap:Math.max(...records.flatMap(r=>r.samples.map(s=>s.renderer.usedSize))),scope:'samples around captures, not allocation peak; CDP is read-only on owned headless page; renderer heap excludes total browser/GPU/JVM RSS; outsideCapture includes instrumentation and IPC, not pure CPU',records};
 fs.writeFileSync(path.join(rt,'cost.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...summary,records:undefined}));
}finally{await cdp.detach();await browser.close();}
