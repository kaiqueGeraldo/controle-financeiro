import fs from 'node:fs';
import path from 'node:path';
import {writeJson} from './source.mjs';
// A request is tied to a fresh execution UUID, never a stale/reused process PID.
const out=path.resolve(process.argv[2]);
const control=JSON.parse(fs.readFileSync(path.join(out,'control.json')));
const resultFile=path.join(out,'result.json');
const result=fs.existsSync(resultFile)?JSON.parse(fs.readFileSync(resultFile)):undefined;
if(result?.runId===control.runId&&['passed','failed','cancelled'].includes(result.status))console.log('Execution already finished: '+result.status);
else{writeJson(path.join(out,'cancel.request.json'),{runId:control.runId});console.log('Cancellation requested for '+control.runId);}
