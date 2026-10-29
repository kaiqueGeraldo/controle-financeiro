import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
test('a descendant operating after restoration cannot certify quiescence and complete',()=>{
 const root=path.resolve(process.env.RVPLA03_REVIEW_RUNTIME),receipt=JSON.parse(fs.readFileSync(path.join(root,'handoff/result.json')));
 const timing=fs.readFileSync(path.join(root,'handoff/query-captured'),'utf8');assert.match(timing,/Parent PID was in QueryIds snapshot/);
 assert.equal(receipt.inputAfter,'original');assert.match(receipt.lateEffect,/child=\d+ input=original/);
 assert.equal(receipt.state==='complete'&&receipt.environmentVerified===true,false,'OWNED_DESCENDANT_EFFECT_AFTER_COMPLETE');
});
