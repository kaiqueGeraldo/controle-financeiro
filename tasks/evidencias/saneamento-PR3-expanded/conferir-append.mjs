import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=path.join(path.resolve(process.argv[2]),'directed-affected');
const record=JSON.parse(fs.readFileSync(path.join(out,'execution.json'))),bytes=fs.readFileSync(path.join(out,'maven.log'));
const expected=record.logSha256;let found=-1,start=0;const incremental=createHash('sha256');
for(let i=0;i<bytes.length;i++)if(bytes[i]===10){incremental.update(bytes.subarray(start,i+1));start=i+1;if(incremental.copy().digest('hex')===expected){found=i+1;break;}}
// A controller may return between two writes, in the middle of a line.
if(found<0){const offset=Math.max(0,bytes.length-1024*1024),state=createHash('sha256').update(bytes.subarray(0,offset));for(let i=offset;i<bytes.length;i++){state.update(bytes.subarray(i,i+1));if(state.copy().digest('hex')===expected){found=i+1;break;}}}
assert.ok(found>=0,'Do not claim append-only preservation without recovering the original digest');
const prefix=bytes.subarray(0,found);fs.writeFileSync(path.join(out,'maven-at-controller-timeout.log'),prefix,{flag:'wx'});
const result={controllerExit:record.exit,controllerFinished:record.finished,originalSha256:expected,originalBytes:found,finalSha256:createHash('sha256').update(bytes).digest('hex'),finalBytes:bytes.length,appendBytes:bytes.length-found,originalPrefixVerified:true,gateApproved:false};
fs.writeFileSync(path.join(out,'append-proof.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
