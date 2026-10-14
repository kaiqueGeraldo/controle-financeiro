import {test,expect,type Page} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {setCivilDateOnly} from './support/civil-date-clock';
const dir=process.env.CF_REVIEW_EVIDENCE!;
const asset='cf014000-0000-4000-8000-000000000010';
const heading=(page:Page)=>page.getByText('Histórico de Movimentações',{exact:true});
const region=(page:Page)=>heading(page).locator('../..');

async function login(page:Page,fixed:boolean){
  if(fixed)await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
  await page.goto('/auth');
  await page.locator('input[name="email"]').fill('cf014-diagnostic@example.invalid');
  await page.locator('input[name="senha"]').fill('Cf014-Synthetic-2026');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page).toHaveURL(/\/$/);
  await page.setViewportSize({width:360,height:800});
}

async function observation(page:Page){
  return region(page).evaluate(el=>{
    const ancestors=[];
    for(let p:Element|null=el;p;p=p.parentElement){const s=getComputedStyle(p),r=p.getBoundingClientRect();ancestors.push({tag:p.tagName,class:p.className,opacity:s.opacity,display:s.display,visibility:s.visibility,overflow:s.overflow,transform:s.transform,zIndex:s.zIndex,rect:{x:r.x,y:r.y,width:r.width,height:r.height},scrollTop:p.scrollTop,scrollHeight:p.scrollHeight});}
    // React development Fiber is observed only; hooks/props are never mutated.
    const key=Object.keys(el).find(k=>k.startsWith('__reactFiber$'));
    type Fiber={type?:{name?:string};memoizedProps:{history:{id:string}[];isHistoryLoading:boolean;asset:{id:string}};return:Fiber|null;child:Fiber|null;sibling:Fiber|null;stateNode:{current:Fiber}};
    let fiber=key?(el as unknown as Record<string,Fiber>)[key]:null;
    let consumer=null;
    // DOM's Fiber pointer can belong to the previous alternate. Read the committed root.
    while(fiber?.return)fiber=fiber.return;
    const stack:Fiber[]=fiber?.stateNode.current?[fiber.stateNode.current]:[];
    while(stack.length){const current=stack.pop()!;if(current.type?.name==='InvestmentDetails'){consumer={historyIds:current.memoizedProps.history.map(r=>r.id),isHistoryLoading:current.memoizedProps.isHistoryLoading,assetId:current.memoizedProps.asset.id};break;}if(current.sibling)stack.push(current.sibling);if(current.child)stack.push(current.child);}
    const b=el.querySelector('button'),r=b?.getBoundingClientRect();
    const hit=r?document.elementFromPoint(r.x+r.width/2,r.y+r.height/2):null;
    return {time:performance.now(),timeline:document.timeline.currentTime,timeOrigin:performance.timeOrigin,dateNow:Date.now(),visibility:document.visibilityState,focus:document.hasFocus(),rows:el.querySelectorAll('[title="Compensar operação"]').length,consumer,ancestors,animations:el.getAnimations({subtree:true}).map(a=>({playState:a.playState,currentTime:a.currentTime,startTime:a.startTime,playbackRate:a.playbackRate,timing:a.effect?.getComputedTiming(),keyframes:a.effect instanceof KeyframeEffect?a.effect.getKeyframes():null})),hit:hit?.outerHTML.slice(0,250)};
  });
}

test('CF014 diagnóstico delimitado: SQL → HTTP → estado → DOM → pintura',async({browser})=>{
  const report:unknown[]=[];
  for(const fixed of [true,false]){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:3107',locale:'pt-BR',timezoneId:'America/Sao_Paulo',reducedMotion:'no-preference'});
    const page=await context.newPage();
    await login(page,fixed);
    // Tracing starts after authentication: no credentials or auth response bodies.
    await context.tracing.start({screenshots:true,snapshots:true,sources:false});
    let financialWrites=0;
    page.on('request',r=>{if(r.method()!=='GET'&&/\/api\/(investments|transactions|cards|goals)/.test(r.url()))financialWrites++;});
    const responses:{url:string;status:number;body:{id:string}[]}[]=[];
    page.on('response',async r=>{if(/\/investments\/[^/]+\/history$/.test(r.url()))responses.push({url:new URL(r.url()).pathname,status:r.status(),body:await r.json()});});
    await page.goto('/investimentos');
    const cases=[{name:'first',ticker:'RF15',count:8},{name:'reopen',ticker:'RF15',count:8},{name:'reload',ticker:'RF15',count:8},{name:'short-selection',ticker:'CURTO',count:1},{name:'empty-selection',ticker:'VAZIO',count:0}];
    for(const scenario of cases){
      if(scenario.name==='reload')await page.reload();
      await page.getByRole('button',{name:`Ver detalhes do investimento ${scenario.ticker}`,exact:true}).click();
      await expect(heading(page)).toBeVisible();
      await expect(page.getByTitle('Compensar operação')).toHaveCount(scenario.count);
      const prefix=`${fixed?'fixed':'native'}-${scenario.name}`;
      const initial=await observation(page);
      await page.screenshot({path:path.join(dir,prefix+'-initial.png')});
      const samples:Awaited<ReturnType<typeof observation>>[]=[];
      let painted=true;
      try{await expect.poll(async()=>{const sample=await observation(page);samples.push(sample);return sample.ancestors.every(a=>Number(a.opacity)===1);}).toBe(true);}catch{painted=false;}
      const final=await observation(page);
      await page.screenshot({path:path.join(dir,prefix+'-final.png')});
      let interaction=null;
      if(painted&&scenario.count){
        const last=page.getByTitle('Compensar operação').last();
        await last.scrollIntoViewIfNeeded();await last.focus();
        await expect(last).toBeFocused();await expect(last).toBeInViewport();
        interaction=await observation(page);
        await page.screenshot({path:path.join(dir,prefix+'-scroll.png')});
      }
      report.push({fixed,...scenario,initial,samples,final,painted,interaction,responses:[...responses],financialWrites});
      await writeFile(path.join(dir,'observations.json'),JSON.stringify(report,null,2));
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    expect(financialWrites).toBe(0);
    expect(responses.find(r=>r.url.endsWith(asset+'/history'))?.body).toHaveLength(8);
    await context.tracing.stop({path:path.join(dir,fixed?'fixed-trace.zip':'native-trace.zip')});
    await context.close();
  }
});

// One controlled variable: elapsed time in the previous document (25s) before navigation.
// This dwell reproduces historical setup latency; it is never used to make a screenshot pass.
for(const mode of ['playwright-clock','native','civil-date-only'] as const){
  test(`CF014 contraprova causal: ${mode}, documento anterior 25s`,async({browser})=>{
    const context=await browser.newContext({baseURL:'http://127.0.0.1:3107',locale:'pt-BR',timezoneId:'America/Sao_Paulo',reducedMotion:'no-preference'});
    const page=await context.newPage();
    if(mode==='civil-date-only')await setCivilDateOnly(page,new Date('2027-01-15T12:00:00Z'));
    await login(page,mode==='playwright-clock');
    await page.waitForFunction(()=>performance.now()>=25000);
    await context.tracing.start({screenshots:true,snapshots:true,sources:false});
    try {
    const response=page.waitForResponse(r=>r.url().endsWith(asset+'/history'));
    await page.goto('/investimentos');
    await page.getByRole('button',{name:'Ver detalhes do investimento RF15',exact:true}).click();
    const http=await response;
    expect(http.status()).toBe(200);
    expect(await http.json()).toHaveLength(8);
    await expect(page.getByTitle('Compensar operação')).toHaveCount(8);
    const initial=await observation(page);
    await page.screenshot({path:path.join(dir,mode+'-causal-initial.png')});
    let assertionPassed=true;
    try{await expect(region(page)).toHaveCSS('opacity','1');}catch{assertionPassed=false;}
    const final=await observation(page);
    await page.screenshot({path:path.join(dir,mode+'-causal-final.png')});
    await writeFile(path.join(dir,mode+'-causal.json'),JSON.stringify({mode,variable:'previous-document elapsed >= 25000ms',initial,final,assertionPassed},null,2));
    expect(initial.consumer?.historyIds).toHaveLength(8);
    expect(assertionPassed).toBe(mode!=='playwright-clock');
    if(mode==='playwright-clock'){
      expect(initial.time-Number(initial.timeline)).toBeGreaterThan(20000);
      expect(Number(initial.animations[0].currentTime)).toBeLessThan(-20000);
      expect(final.ancestors[0].opacity).toBe('0');
    }else{
      expect(final.ancestors.every(a=>a.opacity==='1'&&a.visibility==='visible'&&a.display!=='none')).toBe(true);
      await page.getByText('Compra',{exact:true}).first().click();
      const last=page.getByTitle('Compensar operação').last();
      await last.scrollIntoViewIfNeeded();await last.focus();
      await expect(last).toBeFocused();await expect(last).toBeInViewport();
      await page.screenshot({path:path.join(dir,mode+'-causal-interaction.png')});
      await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    if(mode==='civil-date-only')expect(initial.dateNow).toBe(1800014400000);
    } finally {
      await context.tracing.stop({path:path.join(dir,mode+'-causal-trace.zip')});
      await context.close();
    }
  });
}

test('CF014 harness civil: resposta real retida, reabertura, reload e interação',async({page})=>{
  await setCivilDateOnly(page,new Date('2027-01-15T12:00:00Z'));
  await login(page,false);
  const clocks=await page.evaluate(()=>({
    now:Date.now(),noArgs:new Date().toISOString(),explicit:new Date('2026-01-02T00:00:00Z').toISOString(),
    utc:Date.UTC(2026,0,2),parsed:Date.parse('2026-01-02T00:00:00Z'),
    isDate:new Date() instanceof Date,performanceSource:performance.now.toString(),
    rafSource:requestAnimationFrame.toString(),timerSource:setTimeout.toString(),
  }));
  expect(clocks.now).toBe(1800014400000);
  expect(clocks.noArgs).toBe('2027-01-15T12:00:00.000Z');
  expect(clocks.explicit).toBe('2026-01-02T00:00:00.000Z');
  expect(clocks.utc).toBe(1767312000000);expect(clocks.parsed).toBe(1767312000000);expect(clocks.isDate).toBe(true);
  expect(clocks.performanceSource).toContain('[native code]');expect(clocks.rafSource).toContain('[native code]');expect(clocks.timerSource).toContain('[native code]');
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  let received=false;
  let body:{id:string}[]=[];
  let financialWrites=0;
  page.on('request',r=>{if(r.method()!=='GET'&&/\/api\/(investments|transactions|cards|goals)/.test(r.url()))financialWrites++;});
  const pattern=`**/api/investments/${asset}/history`;
  await page.route(pattern,async route=>{
    const response=await route.fetch();expect(response.status()).toBe(200);body=await response.json();
    received=true;await gate;await route.fulfill({response});
  });
  await page.context().tracing.start({screenshots:true,snapshots:true,sources:false});
  const observations:unknown[]=[];
  try {
    await page.goto('/investimentos');
    const opener=page.getByRole('button',{name:'Ver detalhes do investimento RF15',exact:true});
    await opener.click();await expect.poll(()=>received).toBe(true);
    await expect(region(page)).toHaveCSS('opacity','1');
    const loading=await observation(page);
    expect(loading.consumer?.isHistoryLoading).toBe(true);expect(loading.rows).toBe(0);
    await expect(region(page).locator('svg.animate-spin')).toHaveCount(1);
    await page.screenshot({path:path.join(dir,'civil-delayed-loading.png')});
    observations.push({phase:'loading',observation:loading});release();
    await expect(page.getByTitle('Compensar operação')).toHaveCount(8);
    await page.unroute(pattern);
    for(const phase of ['released','reopen','reload']){
      if(phase!=='released'){
        await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
        if(phase==='reload')await page.reload();
        await opener.click();await expect(page.getByTitle('Compensar operação')).toHaveCount(8);
      }
      await expect(region(page)).toHaveCSS('opacity','1');
      const state=await observation(page);
      expect(state.consumer?.historyIds).toEqual(body.map(row=>row.id));
      expect(state.consumer?.isHistoryLoading).toBe(false);
      await page.getByText('Compra',{exact:true}).first().click();
      const last=page.getByTitle('Compensar operação').last();await last.scrollIntoViewIfNeeded();await last.focus();
      await expect(last).toBeFocused();await expect(last).toBeInViewport();
      const interaction=await last.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {focused:document.activeElement===el,receivesPointer:!!hit&&el.contains(hit),rect:{x:r.x,y:r.y,width:r.width,height:r.height}};});
      expect(interaction.receivesPointer).toBe(true);
      await page.screenshot({path:path.join(dir,`civil-${phase}-interaction.png`)});
      observations.push({phase,state,interaction});
    }
    expect(financialWrites).toBe(0);
    await writeFile(path.join(dir,'civil-harness.json'),JSON.stringify({clocks,body,observations,financialWrites},null,2));
  }finally{
    release();await page.context().tracing.stop({path:path.join(dir,'civil-harness-trace.zip')});
  }
});
