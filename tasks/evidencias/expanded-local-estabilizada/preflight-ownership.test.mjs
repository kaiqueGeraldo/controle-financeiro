import {test} from 'node:test';import assert from 'node:assert/strict';
import {ryukFromLog,ownsPreflightContainer} from './preflight-ownership.mjs';
const id='a'.repeat(64),other='b'.repeat(64),image='testcontainers/ryuk:0.13.0';
const context={run:'own-run',session:'own-session',baseline:[],ryuk:ryukFromLog('Container '+image+' is starting: '+id)};
test('correlates a current-JVM Ryuk ID with its exact image and Testcontainers label',()=>{
 assert.equal(ownsPreflightContainer({Id:id,Config:{Image:image,Labels:{'org.testcontainers':'true'}}},context),true);
});
test('rejects unrelated Ryuk IDs, wrong images and missing labels',()=>{
 for(const inspected of [{Id:other,Config:{Image:image,Labels:{'org.testcontainers':'true'}}},{Id:id,Config:{Image:'unrelated',Labels:{'org.testcontainers':'true'}}},{Id:id,Config:{Image:image,Labels:{}}}])assert.equal(ownsPreflightContainer(inspected,context),false);
});
test('never treats a baseline resource as owned even if its labels match',()=>{
 assert.equal(ownsPreflightContainer({Id:id,Config:{Image:image,Labels:{'cf.review':'own-run'}}},{...context,baseline:[id.slice(0,12)]}),false);
});
test('retains exact session and own-resource label contracts',()=>{
 assert.equal(ownsPreflightContainer({Id:other,Config:{Image:'postgres:16-alpine',Labels:{'org.testcontainers.sessionId':'own-session'}}},context),true);
 assert.equal(ownsPreflightContainer({Id:other,Config:{Image:'postgres:16-alpine',Labels:{'org.testcontainers.sessionId':'different'}}},context),false);
});
