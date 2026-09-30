import {test, type Page} from "@playwright/test";
import {writeFile} from "node:fs/promises";
import path from "node:path";

// Metadata-only review instrumentation. No intercept, retry, sleep or changed deadline.
const runs = new WeakMap<Page, {events: unknown[]; payments: {card:string;operation:string}[]}>();
test.beforeEach(async ({page}, info) => {
  if(process.env.CF_RVA03_REVIEW!=="1" || !info.title.includes("pagamento 120"))return;
  const run={events:[] as unknown[],payments:[] as {card:string;operation:string}[]};runs.set(page,run);
  const record=(event:string,fields:Record<string,unknown>)=>run.events.push({event,time:Date.now(),...fields});
  page.on("console",msg=>{if(msg.text().includes("RVA03"))record("phase",{text:msg.text()});});
  page.on("pageerror",error=>record("pageerror",{message:error.message}));
  page.on("request",request=>{
    const url=new URL(request.url());if(!url.pathname.startsWith("/api/"))return;
    record("request",{method:request.method(),url:url.pathname+url.search});
    const match=url.pathname.match(/^\/api\/cards\/([^/]+)\/pay$/);
    if(match && request.method()==="POST") {
      const command=request.postDataJSON();
      run.payments.push({card:match[1],operation:command.operationId});
      record("payment-dispatched",{card:match[1],operation:command.operationId,amount:command.amount});
    }
  });
  page.on("response",response=>{const url=new URL(response.url());if(url.pathname.startsWith("/api/"))record("response",{url:url.pathname+url.search,status:response.status()});});
  page.on("requestfinished",request=>{const url=new URL(request.url());if(url.pathname.startsWith("/api/"))record("finished",{url:url.pathname+url.search});});
  page.on("requestfailed",request=>record("failed",{url:new URL(request.url()).pathname,error:request.failure()?.errorText}));
  await page.addInitScript(()=>{
    const state={rafCount:0,lastRaf:0,mutations:[] as unknown[]};
    (window as unknown as {rva03Presence:typeof state}).rva03Presence=state;
    let prior="";let active=false;
    const timestamp=()=>performance.timeOrigin+performance.now();
    const tick=()=>{state.rafCount++;state.lastRaf=timestamp();if(active)requestAnimationFrame(tick);};
    const observer=new MutationObserver(()=>{
      const dialog=[...document.querySelectorAll('[role="dialog"]')].find(e=>e.textContent?.includes("Pagar Fatura - SAN cartão 120"));
      if(dialog&&!active){active=true;requestAnimationFrame(tick);}
      if(!dialog)active=false;
      const text=dialog?.textContent??"";
      const next=JSON.stringify({present:!!dialog,opacity:dialog?getComputedStyle(dialog).opacity:null,
        display:dialog?getComputedStyle(dialog).display:null,recovery:text.includes("Atualizar dados sem repetir pagamento"),
        loading:!!dialog?.querySelector("svg.animate-spin"),disabled:dialog?.querySelector("fieldset")?.disabled??null});
      if(next!==prior){state.mutations.push({time:timestamp(),...JSON.parse(next)});prior=next;}
    });
    observer.observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:["style","disabled"]});
  });
});
test.afterEach(async ({page},info)=>{
  const run=runs.get(page);if(!run)return;
  // Capture UI before diagnostic read-only calls, particularly on the first timeout.
  try {run.events.push({event:"terminal-ui",time:Date.now(),status:info.status,
    state:await page.evaluate(()=>({presence:(window as unknown as {rva03Presence:unknown}).rva03Presence,
      dialogs:[...document.querySelectorAll('[role="dialog"]')].map(e=>({text:e.textContent,opacity:getComputedStyle(e).opacity})),
      intents:Object.keys(sessionStorage).filter(key=>key.startsWith("invoice-payment:")).map(key=>({key,value:sessionStorage.getItem(key)}))}))});}
  catch(error){run.events.push({event:"terminal-ui-unavailable",message:String(error)});}
  for(const payment of run.payments){
    try {
      const receipt=await page.request.get(`/api/cards/${payment.card}/payments/${payment.operation}`);
      const invoice=await page.request.get(`/api/cards/${payment.card}/invoice?month=1&year=2027`);
      const accounts=await page.request.get("/api/accounts");
      run.events.push({event:"terminal-financial",posts:run.payments.length,receiptStatus:receipt.status(),
        receipt:receipt.ok()?await receipt.json():null,invoice:invoice.ok()?await invoice.json():null,
        accounts:accounts.ok()?await accounts.json():null});
    }catch(error){run.events.push({event:"terminal-financial-unavailable",message:String(error)});}
  }
  await writeFile(path.join(process.env.CF_REVIEW_EVIDENCE!,"rva03-review-events.json"),JSON.stringify(run.events,null,2));
});
