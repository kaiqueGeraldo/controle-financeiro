import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
const [permanent,short]=process.argv.slice(2),base=import.meta.dirname;
const deadline=Date.now()+20*60*1000;
let preparation;
while(Date.now()<deadline){
 try{preparation=JSON.parse(fs.readFileSync(path.join(short,"prepare.json")));}catch{}
 if(preparation?.status!=="running"&&preparation?.status)break;
 await new Promise(resolve=>setTimeout(resolve,3000));
}
assert.equal(preparation?.status,"passed","Minimum controls failed/incomplete: do not start broad suite");
function run(script,args){const result=spawnSync(process.execPath,[path.join(base,script),...args],{stdio:"inherit",windowsHide:true});assert.equal(result.status,0,script+" failed; dependent phases stopped");}
run("conferir-cleanup.mjs",[permanent,short,"prepare"]);
run("executar.mjs",[permanent,short,"focused"]);
run("conferir-cleanup.mjs",[permanent,short,"focused"]);
run("executar.mjs",[permanent,short,"remaining"]);
run("conferir-cleanup.mjs",[permanent,short,"remaining"]);
console.log("All authorized dependent gates completed; no remote publication.");
