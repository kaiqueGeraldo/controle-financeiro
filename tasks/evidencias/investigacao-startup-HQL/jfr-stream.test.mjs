import test from 'node:test';
import assert from 'node:assert/strict';
import {eventsFromChunks} from './jfr-stream.mjs';

const events=[{type:'jdk.ExecutionSample',values:{text:'quote " slash \\ braces } {',array:[{x:1}]}},{type:'jdk.CPULoad',values:{jvmUser:0.5}}];
const document=JSON.stringify({recording:{events}});
for(const size of [1,7,65536])test('Preserves events across '+size+' character chunks',async()=>{
 const chunks=[];for(let i=0;i<document.length;i+=size)chunks.push(document.slice(i,i+size));
 const actual=[];for await(const event of eventsFromChunks(chunks))actual.push(event);
 assert.deepEqual(actual,events);
});
test('Rejects an incomplete event',async()=>{
 await assert.rejects(async()=>{for await(const ignored of eventsFromChunks([document.slice(0,-8)]))void ignored;},/Truncated/);
});
test('Rejects missing separators',async()=>{
 await assert.rejects(async()=>{for await(const ignored of eventsFromChunks(['{"events":[{}{}]}']))void ignored;},/separator/);
});
