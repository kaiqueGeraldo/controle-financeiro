import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {preparePause,waitForConfirmation,finishScenario,readPause,cancelPause} from './protocolo.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
export async function pauseForNativeZoom({page,context,browser,info,directory,cardId,expectedEmail,
  scenario,execution,candidate,packageSha256,synthetic=false,onPrepared,leaseMs=300_000}) {
  assert.ok(leaseMs<=300_000,'Each attended invocation has a five-minute resource lease');
  const pageId=randomUUID(),documentId=randomUUID();
  const originalTitle=await page.title(), title=originalTitle+' | Z-'+pageId.slice(0,8);
  await page.evaluate(({title,documentId})=>{
    document.title=title;
    Object.defineProperty(window,'__assistedZoomDocument',{value:documentId,configurable:false});
  },{title,documentId});
  const controller=new AbortController();
  const changed=()=>controller.abort(new Error('Page/context changed during pause'));
  const navigated=frame=>{if(frame===page.mainFrame())changed();};
  page.on('framenavigated',navigated);page.on('close',changed);context.on('close',changed);
  const dir=path.join(directory,'assisted');
  async function snapshot() {
    assert.ok(!page.isClosed(),'Page closed');
    const currentDocument=await page.evaluate('window.__assistedZoomDocument');
    const response=await page.request.get('/api/auth/user',{timeout:15_000});
    const sessionStatus=response.status();
    if(sessionStatus!==200)return {sessionStatus};
    const user=await response.json();
    assert.equal(user.email,expectedEmail,'Wrong authenticated identity');
    const cardsResponse=await page.request.get('/api/cards',{timeout:15_000});
    assert.equal(cardsResponse.status(),200);
    const cards=await cardsResponse.json();
    assert.ok(Array.isArray(cards)&&cards.some(card=>card.id===cardId),'Prepared card no longer present');
    const token=(await context.cookies()).find(cookie=>cookie.name==='token');
    assert.ok(token,'Session cookie missing');
    return {execution,scenario,candidate,packageSha256,pageId,documentId:currentDocument,url:page.url(),
      title:await page.title(),browser:browser.version(),userSha256:digest(user.email),
      sessionSha256:digest(token.value),cardId,sessionStatus};
  }
  let state,started;
  try {
    const target=await snapshot();
    assert.equal(target.sessionStatus,200,'Preparation session invalid');
    state=preparePause(dir,target,{synthetic,leaseMs});
    started=Date.now();
    // Only human coordination is excluded from the original total test budget.
    // All application assertions and the 15s request/expect contracts remain unchanged.
    info.setTimeout(300_000+leaseMs);
    await onPrepared?.(state,dir);
    const result=await waitForConfirmation(dir,snapshot,{signal:controller.signal});
    info.setTimeout(300_000+result.pausedMs);
    fs.writeFileSync(path.join(dir,'resume.json'),JSON.stringify({
      execution,scenario,candidate,pausedMs:result.pausedMs,
      applicationTimeoutChanged:false,nativeZoomTechnicallyCertified:false,
      confirmationOrigin:result.signal.source,capturesReviewed:false
    },null,2),{flag:'wx'});
    return {dir,pausedMs:result.pausedMs};
  } catch(error) {
    if(state && readPause(dir).status==='waiting')cancelPause(dir,'Adapter ended before resume: '+error.message);
    if(started)info.setTimeout(300_000+Math.min(Date.now()-started,leaseMs));
    throw error;
  } finally {
    page.off('framenavigated',navigated);page.off('close',changed);context.off('close',changed);
  }
}
export function finishAssisted(assisted,passed) {
  if(assisted && readPause(assisted.dir).status==='resumed')
    finishScenario(assisted.dir,passed?'passed':'failed');
}
