import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";import {sourceFor,hash} from "../../../.github/scripts/source.mjs";import {reuseCurrentComponents} from "./reuso-componentes-windows.mjs";
export function reuseCompletedFrontend(oldRuntime,runtime,root,source) {
 const read=f=>JSON.parse(fs.readFileSync(f)),out=path.join(runtime,"o"),prior=read(path.join(out,"result.json")),marker=read(path.join(root,".ci-frontend.json"));
 assert.equal(sourceFor(root).digest,source.digest);assert.equal(marker.status,"passed");assert.equal(marker.source,source.digest);
 assert.equal(prior.status,"failed");assert.equal(prior.error,"backend failed (1); see backend.log");assert.equal(prior.steps.filter(s=>s.exit!==0).length,1);assert.equal(prior.steps.at(-1).name,"backend");
 assert.equal(fs.readFileSync(path.join(out,"backend.log"),"utf8").trim(),"Linha de comando muito longa.");
 assert.equal(fs.existsSync(path.join(out,"surefire")),false);
 for(const name of ["install","lint","typecheck","unit","build","browser-install","maven-version"])assert.equal(prior.steps.find(s=>s.name===name)?.exit,0,name);
 assert.equal(prior.source.digest,source.digest);assert.equal(prior.node,process.version);assert.equal(prior.platform,process.platform);
 const components=reuseCurrentComponents(oldRuntime,root,source),buildId=fs.readFileSync(path.join(root,"controle-financeiro-frontend/.next/BUILD_ID"),"utf8").trim();assert.ok(buildId);
 const unit=fs.readFileSync(path.join(out,"unit.log"),"utf8");assert.equal([...unit.matchAll(/# tests (\d+)/g)].reduce((a,m)=>a+Number(m[1]),0),18);assert.equal([...unit.matchAll(/# tests (\d+)/g)].length,3);assert.ok(![...unit.matchAll(/# (?:skipped|todo|cancelled|fail) (\d+)/g)].some(m=>Number(m[1])));
 const proof={status:"reused complete current frontend after backend invocation preparation failed before tests",originalControllerRunId:prior.runId,sourceDigest:source.digest,buildId,components:components.proof,files:["result.json","build.log","browser-install.log","unit.log","lint.log","typecheck.log","backend.log"].map(f=>({path:path.join(out,f),sha256:hash(fs.readFileSync(path.join(out,f)))}))};
 return {unit:prior.unit,components:components.counts,componentCoverage:components.coverage,proof};
}
