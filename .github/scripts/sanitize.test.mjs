import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {sanitizeText,sanitizeJson} from './sanitize.mjs';
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
