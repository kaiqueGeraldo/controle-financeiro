import {playwrightPhase} from './wrapper-browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {hash,writeJson} from './source.mjs';
import {decision,browserCases,plan,testList,verifyDirectory} from './zoom-coverage.mjs';

assert.equal(process.env.CF034_SUITE,'expanded','Exception only applies to expanded');
assert.equal(process.env.CF_ZOOM_EXCEPTION,decision,'Missing authorized decision');
const args=process.argv.slice(2);
assert.deepEqual(args.slice(0,3),['test','--config','tests/e2e/playwright.rf15.config.ts']);
assert.ok(!args.some(a=>/^--(?:grep|project|shard|test-list|only-changed|last-failed|pass-with-no-tests|repeat-each|retries)/.test(a)),'Unexpected selection override');
const context={candidate:process.env.CF_ZOOM_CANDIDATE,digest:process.env.CF_ZOOM_DIGEST,runId:process.env.CF_ZOOM_RUN,decisionSha:process.env.CF_ZOOM_DECISION_SHA};
const directory=path.join(process.env.CF_REVIEW_EVIDENCE,'zoom-selection');fs.mkdirSync(directory);
const env={...process.env,PLAYWRIGHT_JSON_OUTPUT_FILE:path.join(directory,'universe.json')};
const cli=path.resolve('node_modules/@playwright/test/cli.js');
const listing=spawnSync(process.execPath,[cli,'test','--config',args[2],'--list','--reporter=json'],{env,encoding:'utf8',windowsHide:true,timeout:120000});
fs.writeFileSync(path.join(directory,'listing.log'),(listing.stdout??'')+(listing.stderr??''),{flag:'wx'});
assert.equal(listing.status,0,'Original browser listing failed');
const universe=JSON.parse(fs.readFileSync(env.PLAYWRIGHT_JSON_OUTPUT_FILE,'utf8'));
assert.equal(universe.errors?.length??0,0);
const manifest=plan(browserCases(universe),context);
writeJson(path.join(directory,'manifest.json'),manifest);
fs.writeFileSync(path.join(directory,'selection.txt'),testList(manifest.C),{flag:'wx'});
const started=new Date().toISOString();
writeJson(path.join(directory,'invocation.json'),{context,started,universeSha:hash(fs.readFileSync(env.PLAYWRIGHT_JSON_OUTPUT_FILE)),selectionSha:hash(fs.readFileSync(path.join(directory,'selection.txt')))});
env.PLAYWRIGHT_JSON_OUTPUT_FILE=path.join(directory,'results.json');
let result;
if(process.env.CF_WRAPPER_DIAGNOSTICS){
 const selected=[...args,'--test-list',path.join(directory,'selection.txt')];
 const discovered=playwrightPhase('list',[...selected,'--list'],path.join(process.env.CF_WRAPPER_DIAGNOSTICS,'listing.json'));
 writeJson(path.join(process.env.CF_WRAPPER_DIAGNOSTICS,'listing-process.json'),discovered);
 const executed=playwrightPhase('run',selected,env.PLAYWRIGHT_JSON_OUTPUT_FILE);
 result={status:executed.exit,error:executed.error};
}else result=spawnSync(process.execPath,[cli,...args,'--test-list',path.join(directory,'selection.txt'),'--reporter=line,json'],{env,stdio:'inherit',windowsHide:true});
let verified;try{verified=verifyDirectory(directory,context);}finally{writeJson(path.join(directory,'process.json'),{started,finished:new Date().toISOString(),exit:result.status,error:result.error?.message});}
assert.equal(result.status,0,'Browser process failed');
writeJson(path.join(directory,'verified.json'),verified);
console.log(verified.label+'; executed='+verified.tests+'; deferred='+verified.deferred.length);

