import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";
import {hash,sourceFor} from "../../../.github/scripts/source.mjs";
import {requireComponentCoverage} from "../../../.github/scripts/components.mjs";
import {componentSummary,requireCounts} from "../../../.github/scripts/ci.mjs";
export function reuseCurrentComponents(oldRuntime,currentRoot,source) {
 const oldRoot=path.join(oldRuntime,"expanded-local-s/candidate"),out=path.join(oldRuntime,"windows-expanded");
 const read=f=>JSON.parse(fs.readFileSync(f)),prior=read(path.join(out,"result.json")),oldSource=sourceFor(oldRoot);
 assert.equal(prior.status,"failed");assert.equal(prior.error,"build failed (1); see build.log");
 assert.equal(prior.steps.filter(s=>s.exit!==0).length,1);assert.equal(prior.steps.at(-1).name,"build");
 for(const name of ["install","lint","typecheck","unit","components"])assert.equal(prior.steps.find(s=>s.name===name)?.exit,0,name);
 assert.equal(sourceFor(currentRoot).digest,oldSource.digest);assert.equal(source.digest,oldSource.digest);assert.equal(source.commit,oldSource.commit);assert.equal(prior.source.digest,source.digest);
 assert.equal(prior.platform,process.platform);assert.equal(prior.node,process.version);
 const json=read(path.join(out,"components.json")),audit=read(path.join(out,"component-audit.json"));
 const context={candidate:source.commit,digest:source.digest,runId:prior.runId};
 const coverage=requireComponentCoverage(json,audit,context,path.join(oldRoot,"controle-financeiro-frontend"));
 const summary=componentSummary(json,oldRoot);requireCounts(summary.counts,"current Windows component reuse");assert.equal(summary.counts.tests,626);assert.equal(coverage.files,71);
 const actual=json.testResults.flatMap(f=>f.assertionResults.map(t=>JSON.stringify([path.relative(path.join(oldRoot,"controle-financeiro-frontend"),f.name).split(path.sep).join("/"),t.fullName]))).sort();
 assert.deepEqual(actual,read(path.join(oldRuntime,"expected-selection.json")).identities);
 return {counts:summary.counts,coverage,proof:{status:"reused current same-platform component gate; not reexecuted",reason:"Only physical path shortened after build preparation exceeded filesystem path limit",originalRunId:prior.runId,context,originalRoot:oldRoot,currentRoot,sourceDigest:source.digest,sourceFilesEqual:860,selectionSha:hash(JSON.stringify(actual)),reports:["result.json","components.json","component-audit.json","components.log","build.log"].map(f=>({path:path.join(out,f),sha256:hash(fs.readFileSync(path.join(out,f)))}))}};
}
