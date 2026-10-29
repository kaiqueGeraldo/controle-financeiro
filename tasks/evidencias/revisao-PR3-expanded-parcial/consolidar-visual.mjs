import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const runtime=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..');
const read=f=>JSON.parse(fs.readFileSync(f)),sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const dir=label=>path.join(runtime,label,'browsers/ReviewerVisualBrowserProbe');
const geometry=[];
for(const clock of ['playwright','civil'])for(const initial of [360,1440]){
 const name=`geometry-${clock}-${initial}`,file=path.join(dir('visual-complement'),name+'.json'),o=read(file),after=read(path.join(dir('visual-complement'),name+'-after-capture.json'));
 const measured=o.atMeasure.ancestors[0],badge=o.atMeasure.ancestors[1];
 assert.equal(measured.display,'contents');assert.deepEqual(o.box,null);assert.equal(measured.rect.width,0);assert.equal(badge.display,'flex');
 assert.ok(badge.rect.x>=0&&badge.rect.x+badge.rect.width<=360);assert.equal(o.investmentId,o.actual.id);assert.equal(o.actual.ticker,'SANVIS');assert.equal(o.actual.quantity,10);assert.equal(o.actual.totalCost,200);assert.equal(o.actual.valuationAmount,null);
 const live=path.join(dir('visual-complement'),name+'-live.png'),disabled=path.join(dir('visual-complement'),name+'.png');
 geometry.push({clock,initial,final:360,inputSha256:sha(file),identity:{investmentId:o.investmentId,actualId:o.actual.id,ticker:o.actual.ticker},api:{quantity:o.actual.quantity,totalCost:o.actual.totalCost,valuationAmount:o.actual.valuationAmount},measuredNode:measured,badge,afterCaptureRect:after.rect,liveScreenshotSha256:sha(live),disabledScreenshotSha256:sha(disabled),screenshotsIdentical:sha(live)===sha(disabled),claim:'Specific bounding-box observer inadequate; no product layout failure inferred'});
}
const presence=[];
const presenceDir=dir('presence-complement');
if(fs.existsSync(presenceDir))for(const name of fs.readdirSync(presenceDir).filter(n=>n.startsWith('observer-REVIEW-presence-')&&n.endsWith('.json'))){
 const file=path.join(presenceDir,name),d=read(file);presence.push({file:name,sha256:sha(file),...d});
}
const blank=path.join(runtime,'worktree-original/browsers/IntegratedMilestoneBrowserReviewTest/visual-360-investments.png');
const clone=path.join(runtime,'independent-controls/browsers/ReviewerOpeningBrowserProbe/visual-360-investments.png');
const decoding=read(path.join(runtime,'pixel-decoding.json'));
assert.equal(sha(blank),sha(clone));assert.equal(sha(blank),decoding.sourceSha256);assert.equal(decoding.decodedPixelsSha256,decoding.previewPixelsSha256);
const receiptFile=path.join(presenceDir,'san-d1-receipt.json'),receipt=read(receiptFile);
assert.equal(receipt.bodies.length,2);assert.notEqual(receipt.bodies[0].operationId,receipt.bodies[1].operationId);assert.equal(receipt.replay.operationId,receipt.bodies[0].operationId);assert.equal(receipt.invoice.totalAmount,300);assert.equal(receipt.invoice.payableAmount,100);
const result={at:new Date(),runtime,geometry,firstComplement:{execution:read(path.join(runtime,'visual-complement/execution.json')).exit,geometricAssertions:4,geometricFailures:4,presencePreparationErrors:2,scope:'Presence stopped at review adapter JSON parsing, before payment; not product failures'},presence,paymentControl:{receiptSha256:sha(receiptFile),distinctOperations:2,amounts:receipt.bodies.map(b=>b.amount),replaySameOperation:true,invoiceTotal:receipt.invoice.totalAmount,payable:receipt.invoice.payableAmount,accountBalance:800,conflictStatus:409,scope:'Balance and conflict are original assertions in the passed civil scenario; no summation across owners'},ui04:{originalScreenshotSha256:sha(blank),cloneScreenshotSha256:sha(clone),identicalFiles:true,inspectionCorrection:'Initial empty-frame suspicion withdrawn after identical hashes and lossless RGBA decoding; normalized preview contains RVVIS and expected unknown states',decoding,originalCapturePreserved:true},limits:{noProductOrOriginalHarnessChanges:true,noRetriesOrTimeoutIncreases:true,geometryNotNativeZoom:true,focusReturnNotCertified:true}};
fs.writeFileSync(path.join(root,'tasks/evidencias/revisao-PR3-expanded-parcial/VISUAL.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({geometry:geometry.length,displayContents:geometry.every(g=>g.measuredNode.display==='contents'),screenshotsIdentical:geometry.every(g=>g.screenshotsIdentical),presence:presence.map(p=>({title:p.title,status:p.status,dialogs:p.metadata.dialogs?.length})),originalCapturePreserved:true,emptyFrameSuspicionWithdrawn:true}));
