import fs from 'node:fs';
import assert from 'node:assert/strict';
import {eventsFromChunks} from '../investigacao-startup-HQL/jfr-stream.mjs';

const out='tasks/evidencias/revisao-startup-HQL';
const previous='tasks/evidencias/investigacao-startup-HQL';
const results=JSON.parse(fs.readFileSync(previous+'/resultados.json','utf8'));
const inventory=JSON.parse(fs.readFileSync(previous+'/runtime-files.json','utf8'));
const collect=async chunks=>{const values=[];for await(const value of eventsFromChunks(chunks))values.push(value);return values;};
const envelopeChecks=[];
for(const document of ['{"recording":{"events":[{}]}', '{"events":[{},]}']) {
  let strictRejects=false;try{JSON.parse(document);}catch{strictRejects=true;}
  const accepted=await collect([document]);
  assert.equal(strictRejects,true);assert.deepEqual(accepted,[{}]);
  envelopeChecks.push({document,strictJsonRejects:true,existingReaderAccepts:true,impact:'Permissive envelope; not present in the checked current files.'});
}
const checks=[];
for(const record of results.records.filter(r=>r.jfr)) {
  const file=inventory.root+'/'+record.name+'/jfr-selected.json';
  const counts={},startupCounts={},durations={};
  const cutoff=Date.parse(record.jfr.startupCutoffUtc);
  let crossCutoffEvents=0;
  for await(const event of eventsFromChunks(fs.createReadStream(file,{encoding:'utf8',highWaterMark:65536}))) {
    counts[event.type]=(counts[event.type]??0)+1;
    if(!record.jfr.eventTypes.split(',').includes(event.type))continue;
    const start=Date.parse(event.values.startTime);
    if(start>cutoff)continue;
    startupCounts[event.type]=(startupCounts[event.type]??0)+1;
    const duration=Number(/^PT([\d.]+)S$/.exec(String(event.values.duration))?.[1]??0)*1000;
    if(start+duration>cutoff)crossCutoffEvents++;
    durations[event.type]=(durations[event.type]??0)+duration;
  }
  assert.deepEqual(startupCounts,record.jfr.counts);
  for(const [key,type] of [['gc','jdk.GarbageCollection'],['gcPause','jdk.GCPhasePause']])
    assert.ok(Math.abs((durations[type]??0)-record.jfr[key].totalMs)<0.000001);
  const summary=fs.readFileSync(inventory.root+'/'+record.name+'/jfr-summary.txt','utf8');
  const summaryCounts=Object.fromEntries([...summary.matchAll(/^\s+(jdk\.\S+)\s+(\d+)\s+\d+\s*$/gm)].map(m=>[m[1],Number(m[2])]));
  for(const type of record.jfr.eventTypes.split(','))assert.equal(counts[type]??0,summaryCounts[type]??0,type);
  let strictJsonEventCount=null;
  // The 100 MB image extraction fits the normal JSON parser. Do not load the 1.21 GB native file as a string.
  if(record.name.startsWith('image')) {
    const strict=JSON.parse(fs.readFileSync(file,'utf8'));
    strictJsonEventCount=strict.recording.events.length;
    assert.equal(strictJsonEventCount,Object.values(counts).reduce((n,c)=>n+c,0));
  }
  checks.push({scenario:record.name,counts,startupCounts,crossCutoffEvents,strictJsonEventCount,
    allSelectedTypeCountsMatchJfrSummary:true,startupCountsAndGcDurationsMatch:true});
}
fs.writeFileSync(out+'/leitor-conferencia.json',JSON.stringify({at:new Date().toISOString(),envelopeChecks,checks,
  limitation:'Reader validates event objects/separators but not a strict complete JSON envelope. Current image is strict JSON; both current files have a checked complete suffix and counts matching JFR summary. No startup or source modification.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(checks.map(c=>({scenario:c.scenario,events:Object.values(c.counts).reduce((n,x)=>n+x,0),crossCutoffEvents:c.crossCutoffEvents,summaryMatches:true,strictJsonEventCount:c.strictJsonEventCount}))));
