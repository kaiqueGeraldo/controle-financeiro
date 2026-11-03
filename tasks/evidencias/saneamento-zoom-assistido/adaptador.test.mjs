import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {pauseForNativeZoom,finishAssisted} from './adaptador.mjs';
import {confirmationFor,submitConfirmation,readPause} from './protocolo.mjs';

assert.ok(process.env.ZOOM_PROTOCOL_FRONTEND,'Explicit installed frontend required');
const {chromium}=createRequire(path.join(process.env.ZOOM_PROTOCOL_FRONTEND,'package.json'))('@playwright/test');
const root=process.env.ZOOM_PROTOCOL_TEST_ROOT;
assert.ok(root);fs.mkdirSync(root,{recursive:true});
async function fixture(exercise) {
  const browser=await chromium.launch({headless:true});
  let sessionValid=true,cardsValid=true;
  const server=http.createServer((req,res)=>{
    res.setHeader('content-type','application/json');
    if(req.url==='/api/auth/user') {
      res.statusCode=sessionValid?200:401;res.end(JSON.stringify(sessionValid?{email:'protocol@example.invalid'}:{error:'expired'}));
    } else if(req.url==='/api/cards') res.end(JSON.stringify(cardsValid?[{id:'card-synthetic'}]:[]));
    else {res.setHeader('content-type','text/html');res.end('<!doctype html><title>Synthetic coordination target</title><p>Protocol integration only; no product or native zoom proof.</p>');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const baseURL='http://127.0.0.1:'+server.address().port;
  const context=await browser.newContext({baseURL});
  await context.addCookies([{name:'token',value:'synthetic-session-only',url:baseURL}]);
  const page=await context.newPage();await page.goto('/cartoes');
  const directory=fs.mkdtempSync(path.join(root,'browser-case-'));
  const timeouts=[];
  const options={page,context,browser,directory,cardId:'card-synthetic',expectedEmail:'protocol@example.invalid',
    scenario:'cf015',execution:'synthetic-integration',candidate:'synthetic-candidate',packageSha256:'synthetic-package',
    synthetic:true,leaseMs:10_000,info:{setTimeout:value=>timeouts.push(value)}};
  try {await exercise({options,timeouts,expire:()=>{sessionValid=false;},removeCard:()=>{cardsValid=false;}});}
  finally {await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
}
test('real disposable browser: synthetic declaration, live session/card revalidation, and a later failure',async()=>{
  await fixture(async({options,timeouts})=>{
    const result=await pauseForNativeZoom({...options,onPrepared:(state,dir)=>submitConfirmation(dir,confirmationFor(state,{operator:'Synthetic integration',source:'synthetic-test'}))});
    assert.equal(readPause(result.dir).status,'resumed');
    assert.equal(readPause(result.dir).synthetic,true);
    assert.ok(timeouts[0]===310_000&&timeouts[1]>=300_000&&timeouts[1]<310_000);
    const receipt=JSON.parse(fs.readFileSync(path.join(result.dir,'resume.json')));
    assert.equal(receipt.nativeZoomTechnicallyCertified,false);
    finishAssisted(result,false);
    assert.equal(readPause(result.dir).functionalResult,'failed');
  });
});
test('real browser: session expiring during pause blocks continuation',async()=>{
  await fixture(async({options,expire})=>{
    await assert.rejects(pauseForNativeZoom({...options,onPrepared:(state,dir)=>{
      expire();submitConfirmation(dir,confirmationFor(state,{operator:'Synthetic integration',source:'synthetic-test'}));
    }}),/Session expired/);
    assert.equal(readPause(path.join(options.directory,'assisted')).functionalResult,'incomplete');
  });
});
test('real browser: entity disappearing during pause blocks continuation',async()=>{
  await fixture(async({options,removeCard})=>{
    await assert.rejects(pauseForNativeZoom({...options,onPrepared:(state,dir)=>{
      removeCard();submitConfirmation(dir,confirmationFor(state,{operator:'Synthetic integration',source:'synthetic-test'}));
    }}),/card no longer present/);
    assert.equal(readPause(path.join(options.directory,'assisted')).functionalResult,'incomplete');
  });
});
test('real browser: reload invalidates document and any prior declaration',async()=>{
  await fixture(async({options})=>{
    await assert.rejects(pauseForNativeZoom({...options,onPrepared:async(state,dir)=>{
      await options.page.reload();
      submitConfirmation(dir,confirmationFor(state,{operator:'Synthetic integration',source:'synthetic-test'}));
    }}),/Page\/context changed/);
    assert.equal(readPause(path.join(options.directory,'assisted')).functionalResult,'incomplete');
  });
});

test('pre-resume adapter failure ends the pause as incomplete',async()=>{
  await fixture(async({options})=>{
    await assert.rejects(pauseForNativeZoom({...options,onPrepared:()=>{throw new Error('Synthetic setup interruption');}}),/Synthetic setup interruption/);
    assert.equal(readPause(path.join(options.directory,'assisted')).functionalResult,'incomplete');
  });
});
