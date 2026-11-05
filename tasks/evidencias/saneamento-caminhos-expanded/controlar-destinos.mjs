import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";import {spawnSync} from "node:child_process";import {hash} from "../../../.github/scripts/source.mjs";import {browserCases,identity} from "../../../.github/scripts/zoom-coverage.mjs";
const [short,prior]=process.argv.slice(2),front=short+"/s/controle-financeiro-frontend",out=short+"/output-controls";fs.mkdirSync(out);
const configs=["playwright.frontend-closure.config.ts","playwright.rf15-independent.config.ts","playwright.rv24.config.ts","playwright.milestone-review.config.ts","playwright.milestone-remediation.config.ts","playwright.rf15.config.ts"];
const receipts=[];
for(const config of configs){
 const file=path.join(out,config+".json"),env={...process.env,CF_SOURCE_ROOT:short+"/s",CF_REVIEW_EVIDENCE:path.join(out,config),PLAYWRIGHT_BROWSERS_PATH:"0"};
 delete env.PLAYWRIGHT_JSON_OUTPUT_FILE;const r=spawnSync(process.execPath,["node_modules/@playwright/test/cli.js","test","--config","tests/e2e/"+config,"--list","--reporter=json"],{cwd:front,env,encoding:"utf8",windowsHide:true});fs.writeFileSync(file,r.stdout??"");fs.writeFileSync(file+".stderr",r.stderr??"");assert.equal(r.status,0,config);const report=JSON.parse(r.stdout);assert.equal(report.errors?.length??0,0);
 for(const project of report.config.projects){assert.ok(path.resolve(project.outputDir).startsWith(path.resolve(out)+path.sep),config);assert.ok(!path.resolve(project.outputDir).startsWith(path.resolve(short+"/s")+path.sep));}
 if(config==="playwright.rf15.config.ts"){const old=JSON.parse(fs.readFileSync(prior+"/v/browsers/Rf15RemediationBrowserTest/zoom-selection/universe.json"));assert.deepEqual(browserCases(report).map(identity).sort(),browserCases(old).map(identity).sort());assert.equal(browserCases(report).length,25);}
 receipts.push({config,cases:browserCases(report).length,outputs:report.config.projects.map(p=>p.outputDir),raw:{file,sha256:hash(fs.readFileSync(file))},scope:"list only; no product/browser approval or execution skip count"});
}
fs.writeFileSync(path.join(import.meta.dirname,"DESTINOS.json"),JSON.stringify({at:new Date().toISOString(),receipts,oldGeneratedFilesPreserved:24,sourceGuardNotChanged:true},null,2)+"\n");console.log(JSON.stringify(receipts.map(r=>({config:r.config,cases:r.cases,outputs:r.outputs}))));
