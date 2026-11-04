import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";import {hash,sourceFor} from "../../../.github/scripts/source.mjs";import {junitCounts} from "../../../.github/scripts/ci.mjs";import {browserCases,identity} from "../../../.github/scripts/zoom-coverage.mjs";
const [permanent,root]=process.argv.slice(2),base=import.meta.dirname,read=f=>JSON.parse(fs.readFileSync(f,"utf8").replace(/^\uFEFF/,"")),matrix=read(base+"/MATRIZ-15.json"),phase=read(root+"/focused.json");
assert.ok(["passed","failed"].includes(phase.status),"Focused execution still active");
const expected=read(permanent+"/focused-selection.json"),reports=fs.existsSync(root+"/focused/surefire")?fs.readdirSync(root+"/focused/surefire").filter(f=>f.startsWith("TEST-")&&f.endsWith(".xml")):[],newRows=[],ui=[];
for(const original of matrix.rows){
 const name=original.class.split(".").at(-1),xmlFile=root+"/focused/surefire/TEST-"+original.class+".xml";let outcome={status:"missing report"};
 if(fs.existsSync(xmlFile)){
  const xml=fs.readFileSync(xmlFile,"utf8"),suite=xml.match(/<testsuite\b[^>]+>/)[0],get=k=>Number(suite.match(new RegExp('\\b'+k+'="([^"]+)"'))[1]),counts=Object.fromEntries(["tests","failures","errors","skipped"].map(k=>[k,get(k)]));
  assert.ok(xml.includes('name="'+original.test+'"'),"Wrong method "+original.class);
  const firstError=xml.match(/<(?:failure|error) message="([^"]*)"/)?.[1]?.split("&#10;")[0].slice(0,300)??null;
  outcome={status:counts.failures||counts.errors||counts.skipped?"failed":"passed",counts,firstError,report:{file:xmlFile,sha256:hash(fs.readFileSync(xmlFile))}};
 }
 const directory=root+"/focused/browsers/"+name;
 for(const file of ["playwright-private.json","playwright.json","results.json","zoom-selection/results.json"]){
  const full=path.join(directory,file);if(!fs.existsSync(full))continue;let json;try{json=read(full);}catch{continue;}if(!json.stats||!Array.isArray(json.suites))continue;
  const cases=browserCases(json);ui.push({owner:original.class,file:full,sha256:hash(fs.readFileSync(full)),stats:json.stats,globalErrors:json.errors?.length??0,cases:cases.map(c=>({identity:identity(c),status:c.test.status,results:c.test.results?.map(r=>({status:r.status,retry:r.retry,error:(r.errors?.[0]?.message??r.error?.message??"").split("\n")[0].slice(0,200)}))}))});
 }
 newRows.push({...original,resolution:outcome.status==="passed"?"Original wrapper/method passed after operational corrections":outcome.status==="failed"?"New failure after successful preparation: inspect original assertion; not automatically path-related":"Not certified",current:outcome});
}
let integrity;try{const s=sourceFor(root+"/s");integrity={passed:true,files:s.files.length,digest:s.digest};}catch(e){integrity={passed:false,error:e.message};}
const actual=reports.map(f=>f.slice(5,-4)).sort(),missing=expected.filter(c=>!actual.includes(c)),extra=actual.filter(c=>!expected.includes(c)),counts=reports.length?junitCounts(root+"/focused/surefire"):null;
const result={at:new Date().toISOString(),label:"Expanded local do recorte autorizado pela DEC-ZOOM-05",phaseStatus:phase.status,source:phase.source,expectedClasses:15,reportClasses:actual.length,missing,extra,counts,rows:newRows,uiReports:ui,uniqueReportedUiIdentities:new Set(ui.flatMap(r=>r.cases.map(c=>c.identity))).size,integrity,overlap:"15 Java wrapper cases, containing Playwright journeys; RF15C23 belongs to one wrapper. Underlying suites overlap: no additive coverage claim.",broadStatus:fs.existsSync(root+"/all/result.json")?read(root+"/all/result.json").status:"not completed or not reached"};
fs.writeFileSync(base+"/VALIDACAO-15.json",JSON.stringify(result,null,2)+"\n");
const lines=["# Matriz das 15 falhas — antes e depois","","Cada linha conserva a classe e o método originais. Os detalhes e hashes estão em VALIDACAO-15.json.","","| Classe | Método | Erro primário anterior | Resultado atual |","|---|---|---|---|",...newRows.map(r=>"|"+r.class.split(".").at(-1)+"|"+r.test+"|"+(r.primaryKind.startsWith("Next")?"Next preparado/path limit → readiness":"Chromium ENOENT → exit assertion")+"|"+r.current.status+"|"),"","RF15C23 está dentro de Rf15RemediationBrowserTest. Não somar15+23 como casos independentes.","","Integridade de fontes após focused: "+JSON.stringify(integrity),""];fs.writeFileSync(base+"/MATRIZ-15.md",lines.join("\n"));
console.log(JSON.stringify({phase:phase.status,classes:actual.length,counts,missing,extra,integrity,rows:newRows.map(r=>({class:r.class,status:r.current.status,error:r.current.firstError}))}));
