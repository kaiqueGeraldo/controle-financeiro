import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";import {spawnSync} from "node:child_process";
const [permanent,root]=process.argv.slice(2),deadline=Date.now()+90*60*1000;let sync;
while(Date.now()<deadline){try{sync=JSON.parse(fs.readFileSync(root+"/sync-01/flow.json"));}catch{}if(sync?.status&&sync.status!=="running")break;await new Promise(r=>setTimeout(r,3000));}
assert.equal(sync?.status,"passed","Affected synchronization controls failed/incomplete; no integral suite");
const r=spawnSync(process.execPath,[path.join(import.meta.dirname,"executar-integral.mjs"),permanent,root],{stdio:"inherit",windowsHide:true});assert.equal(r.status,0,"Integral gate failed; no blind retry");
