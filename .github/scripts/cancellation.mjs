import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {stopOwned} from './owned-process.mjs';
import {writeJson} from './source.mjs';
export class Cancelled extends Error {constructor(){super('Execution cancelled; subsequent gates blocked');}}
export function cancellation(out){
  const runId=randomUUID(),request=path.join(out,'cancel.request.json');
  let cancelled=false,active;
  const cancel=()=>{if(cancelled)return;cancelled=true;if(active)stopOwned(active);};
  const check=()=>{
    if(fs.existsSync(request)){
      try{if(JSON.parse(fs.readFileSync(request)).runId===runId)cancel();}catch{cancel();}
    }
    if(cancelled)throw new Cancelled();
  };
  writeJson(path.join(out,'control.json'),{runId,pid:process.pid,platform:process.platform,started:new Date().toISOString(),request:'cancel.request.json'});
  const timer=setInterval(()=>{try{check();}catch{}},25);timer.unref();
  process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
  return {runId,check,get cancelled(){return cancelled;},attach(child){active=child;if(cancelled)stopOwned(child);},detach(child){if(active===child)active=undefined;},close(){clearInterval(timer);process.off('SIGINT',cancel);process.off('SIGTERM',cancel);}};
}
