import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {sanitizeText,sanitizeJson,sanitizationLimits} from './sanitize.mjs';
import {collectPublic,publicFiles} from './publish-evidence.mjs';
const cases=[
  'diagnostic=keep\npassword=SENTINEL_PLAIN\n{"password":"SENTINEL_JSON"}\nAuthorization: Bearer SENTINEL_BEARER\nCookie: session=SENTINEL_COOKIE\ntoken=eyJTEST.header.signature\n',
  'prefix {"headers": {"aUtHoRiZaTiOn" : "Bearer SENTINEL_NESTED", "Cookie":"sid=SENTINEL_OBJECT"},"password":"SENTINEL_ESCAPED\\\"x"} suffix',
  '{\n "pAssword" : "SENTINEL_MULTILINE",\n "diagnostic": "keep", "nested":[{"pass\\u0077ord":"SENTINEL_UNICODE"}]\n}',
  'AUTHORIZATION = bEaReR SENTINEL_OPAQUE+/=\nProxy-Authorization: Basic SENTINEL_PROXY\nSet-Cookie: id=SENTINEL_SET; HttpOnly\nCookie: a=SENTINEL_A; b=SENTINEL_B\n\tSENTINEL_FOLDED\ndiagnostic=keep\n',
  'password = "SENTINEL_SPACE value"; password=second_SENTINEL; API_KEY=SENTINEL_KEY\ndiagnostic=keep\n',
];
test('confirmed sentinels and related JSON/header syntax are redacted, diagnostic and idempotence preserved',()=>{
  for(const input of cases){const output=sanitizeText(input);assert(!/SENTINEL|eyJTEST/.test(output),output);assert(output.includes('keep')||input.startsWith('prefix'));assert.equal(sanitizeText(output),output);}
  const object=JSON.parse(sanitizeJson(JSON.stringify({status:'failed',password:{nested:'SENTINEL'},headers:{Cookie:'SENTINEL'},diagnostic:'keep',count:3})));
  assert.deepEqual(object,{status:'failed',password:'[REDACTED]',headers:{Cookie:'[REDACTED]'},diagnostic:'keep',count:3});
});
test('malformed structured evidence fails closed; harmless malformed text stays useful',()=>{
  assert.throws(()=>sanitizeJson('{"password":"SENTINEL"'),SyntaxError);
  assert.throws(()=>sanitizeText('prefix {"password":"SENTINEL\ncontinuation'),/Unsafe/);
  assert.equal(sanitizeText('unclosed { diagnostic=keep'),'unclosed { diagnostic=keep');
});
test('actual public collector handles success/failure, preserves raw hash and excludes forbidden files',()=>{
  for(const status of ['passed','failed']){
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'sanitize-'));
    fs.mkdirSync(path.join(root,'browser'));fs.writeFileSync(path.join(root,'backend.log'),cases.join('\n'));
    fs.writeFileSync(path.join(root,'result.json'),JSON.stringify({status,error:'Authorization: Bearer SENTINEL_ERROR'}));
    for(const name of ['.env','TEST-properties.xml','auth-state.json','dump.sql'])fs.writeFileSync(path.join(root,name),'SENTINEL_FORBIDDEN');
    fs.writeFileSync(path.join(root,'browser/playwright.log'),'Cookie: sid=SENTINEL_BROWSER\ndiagnostic=keep');
    const raw=fs.readFileSync(path.join(root,'backend.log'));const files=collectPublic(root);
    assert.deepEqual(fs.readFileSync(path.join(root,'backend.log')),raw);
    assert(files.some(f=>f.rawLocalSha256!==f.sanitizedSha256));
    for(const name of fs.readdirSync(path.join(root,'public'))){assert(publicFiles.some(f=>path.basename(f)===name)||name==='collection.json');assert(!/SENTINEL|eyJTEST/.test(fs.readFileSync(path.join(root,'public',name),'utf8')));}
    assert.equal(JSON.parse(fs.readFileSync(path.join(root,'public/result.json'))).status,status);
    assert.throws(()=>collectPublic(root),/Never reuse/);
  }
  const incomplete=fs.mkdtempSync(path.join(os.tmpdir(),'sanitize-incomplete-'));collectPublic(incomplete);
  assert.match(JSON.parse(fs.readFileSync(path.join(incomplete,'public/collection.json'))).gateResult,/missing; incomplete; no approval/);
});
test('sanitizer exception blocks CLI publication without raw fallback or console disclosure',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sanitize-reject-'));
  fs.writeFileSync(path.join(root,'result.json'),'{"password":"SENTINEL_BROKEN');
  fs.writeFileSync(path.join(root,'backend.log'),'diagnostic=keep');
  const result=spawnSync(process.execPath,[path.join(import.meta.dirname,'publish-evidence.mjs'),root],{encoding:'utf8',windowsHide:true});
  assert.equal(result.status,1);assert(!fs.existsSync(path.join(root,'public')));assert(!result.stderr.includes('SENTINEL'));
  assert(fs.readFileSync(path.join(root,'result.json'),'utf8').includes('SENTINEL_BROKEN'));
});
test('prefixed JSON visits encoded messages with bounded layers and preserves other values',()=>{
  for(const prefix of ['INFO ','[worker:7] error: ','2026-10-25T00:00:00Z\t']){
    const message=JSON.stringify({password:'SENTINEL_NESTED_MESSAGE',note:'keep'});
    for(const inner of [message,JSON.stringify({details:message})]){
      const input=prefix+JSON.stringify({status:'failed',count:3,diagnostic:'keep',message:inner})+' trailer';
      const output=sanitizeText(input);assert(!output.includes('SENTINEL'));assert(output.startsWith(prefix));assert(output.endsWith(' trailer'));
      const object=JSON.parse(output.slice(prefix.length,-8));assert.equal(object.count,3);assert.equal(object.status,'failed');assert.equal(object.diagnostic,'keep');assert.equal(sanitizeText(output),output);
    }
  }
  const literal='debug '+JSON.stringify(JSON.stringify({password:'SENTINEL_LITERAL',diagnostic:'keep'}));
  assert(!sanitizeText(literal).includes('SENTINEL'));
  const embedded='prefix {"headers":{"cookie":"SENTINEL_COOKIE"},"details":[{"PASSWORD":"SENTINEL_DEEP"}],"note":"keep"}';
  assert(!sanitizeText(embedded).includes('SENTINEL'));assert(sanitizeText(embedded).includes('keep'));
  assert.throws(()=>sanitizeText('WARN '+JSON.stringify({message:'{"password":"SENTINEL_UNFINISHED'})),/Unsafe/);
  assert.throws(()=>sanitizeText(String.raw`INFO {\"password\":\"SENTINEL_UNFRAMED\"}`),/Unsafe escaped quote/);
});
test('unterminated recognized assignments reject instead of redacting only the first word',()=>{
  for(const name of ['password','PASSWORD','api_key','secret'])for(const quote of ['"',"'"])for(const tail of ['','\ndiagnostic=keep']){
    const input=`prefix ${name} \t= ${quote}prefix SENTINEL_UNCLOSED${tail}`;
    assert.throws(()=>sanitizeText(input),error=>/Unsafe unterminated/.test(error.message)&&!error.message.includes('SENTINEL'));
  }
  const input='password="first SENTINEL_ONE"; Password=\'second SENTINEL_TWO\'\ndiagnostic=keep';
  const output=sanitizeText(input);assert(!output.includes('SENTINEL'));assert(output.includes('diagnostic=keep'));assert.equal(sanitizeText(output),output);
  assert.equal(sanitizeText('parse error: expected " before bracket; diagnostic=keep'),'parse error: expected " before bracket; diagnostic=keep');
  assert(!sanitizeText('password\u00a0=\u00a0"SENTINEL_SPACES"\ndiagnostic=keep').includes('SENTINEL'));
  assert.throws(()=>sanitizeText('password=\nSENTINEL_NEXT_RECORD'),/Unsafe incomplete/);
});
test('residual classes cross actual collection, with raw retention, no stale success or diagnostic leak',()=>{
  for(const input of ['INFO '+JSON.stringify({message:JSON.stringify({password:'SENTINEL_PREFIX'}),diagnostic:'keep'}),"password='prefix SENTINEL_UNCLOSED\ndiagnostic=keep"]){
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'residual-'));fs.writeFileSync(path.join(root,'backend.log'),input);
    const command=spawnSync(process.execPath,[path.join(import.meta.dirname,'publish-evidence.mjs'),root],{encoding:'utf8',windowsHide:true});
    assert(!command.stdout.includes('SENTINEL'));assert(!command.stderr.includes('SENTINEL'));assert.equal(fs.readFileSync(path.join(root,'backend.log'),'utf8'),input);
    if(input.startsWith('INFO')){
      assert.equal(command.status,0);const output=fs.readFileSync(path.join(root,'public/backend.log'),'utf8');assert(!output.includes('SENTINEL'));assert(output.includes('keep'));
      fs.writeFileSync(path.join(root,'backend.log'),"password='SENTINEL_CHANGED");assert.throws(()=>collectPublic(root),/Never reuse/);assert.equal(fs.readFileSync(path.join(root,'public/backend.log'),'utf8'),output);
    }else{assert.equal(command.status,1);assert(!fs.existsSync(path.join(root,'public')));}
  }
});
test('size, structure and encoding limits reject safely; representative long records remain predictable',()=>{
  assert.deepEqual(sanitizationLimits,{bytes:16777216,stringLayers:2,structureDepth:64});
  let encoded=JSON.stringify({password:'SENTINEL_TOO_DEEP'});for(let i=0;i<3;i++)encoded=JSON.stringify({message:encoded});
  assert.throws(()=>sanitizeText('INFO '+encoded),/Unsafe JSON string encoding depth/);
  assert.throws(()=>sanitizeText('x'.repeat(sanitizationLimits.bytes+1)),/Unsafe evidence size/);
  assert.throws(()=>sanitizeJson('['.repeat(66)+'0'+']'.repeat(66)),/Unsafe JSON structure depth/);
  const long='x'.repeat(1024*1024)+' INFO '+JSON.stringify({diagnostic:'keep',message:JSON.stringify({password:'SENTINEL_LONG'})});
  const start=performance.now(),output=sanitizeText(long),elapsed=performance.now()-start;
  assert(!output.includes('SENTINEL'));assert(output.startsWith('x'.repeat(1024*1024)));assert.equal(sanitizeText(output),output);assert(elapsed<5000,`representative 1 MiB processing exceeded 5s: ${elapsed}`);
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'long-evidence-'));fs.writeFileSync(path.join(root,'backend.log'),long);
  const collectionStart=performance.now();collectPublic(root);assert(performance.now()-collectionStart<5000);
  assert.equal(fs.readFileSync(path.join(root,'backend.log'),'utf8'),long);
  const collected=fs.readFileSync(path.join(root,'public/backend.log'),'utf8');assert(!collected.includes('SENTINEL'));assert(collected.includes('keep'));
});
