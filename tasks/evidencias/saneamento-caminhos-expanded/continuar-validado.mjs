import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";import {spawnSync} from "node:child_process";import {hash,sourceFor} from "../../../.github/scripts/source.mjs";
const [permanent,short]=process.argv.slice(2),base=import.meta.dirname,deadline=Date.now()+10*60*1000;
let report;while(Date.now()<deadline){try{report=JSON.parse(fs.readFileSync(short+"/rf15-02.json"));}catch{}if(report)break;await new Promise(r=>setTimeout(r,2000));}
assert.equal(report?.status,"passed","Corrected RF15 control failed; broad suite stays blocked");
const approval=JSON.parse(fs.readFileSync(short+"/minimum-approved.json"));assert.equal(approval.status,"passed");assert.equal(sourceFor(short+"/s").digest,approval.source.digest);for(const p of approval.proofs)assert.equal(hash(fs.readFileSync(p.file)),p.sha256);
function run(script,args){const r=spawnSync(process.execPath,[path.join(base,script),...args],{stdio:"inherit",windowsHide:true});assert.equal(r.status,0,script+" failed; dependent phases stopped");}
run("conferir-cleanup.mjs",[permanent,short,"rf15-02"]);run("executar.mjs",[permanent,short,"focused"]);run("conferir-cleanup.mjs",[permanent,short,"focused"]);run("executar.mjs",[permanent,short,"remaining"]);run("conferir-cleanup.mjs",[permanent,short,"remaining"]);
