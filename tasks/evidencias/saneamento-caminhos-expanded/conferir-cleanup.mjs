import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";import {execFileSync} from "node:child_process";import {sourceFor} from "../../../.github/scripts/source.mjs";
const [perm,root,phase]=process.argv.slice(2),initial=JSON.parse(fs.readFileSync(perm+"/initial.json")),gateStatus=JSON.parse(fs.readFileSync(root+"/"+phase+".json")).status;assert.ok(["passed","failed"].includes(gateStatus));
await new Promise(resolve=>setTimeout(resolve,1800));
const docker=(...a)=>execFileSync("docker",["--context","desktop-linux",...a],{encoding:"utf8",windowsHide:true}).trim(),list=(...a)=>docker(...a).split("\n").filter(Boolean).sort(),observations=[];let resources;const deadline=Date.now()+30000;
while(true){resources={containers:list("ps","-aq"),networks:list("network","ls","-q"),volumes:list("volume","ls","-q")};observations.push({at:new Date().toISOString(),...resources});if(JSON.stringify(resources)===JSON.stringify(initial.resources)||Date.now()>=deadline)break;await new Promise(r=>setTimeout(r,1500));}assert.deepEqual(resources,initial.resources);
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const script=[
 "$r="+quote(root)+";",
 "$parent=Get-CimInstance Win32_Process -Filter "+quote("ProcessId="+process.ppid)+";",
 "$excluded=@("+process.pid+","+process.ppid+",$parent.ParentProcessId);",
 "$workers=@(Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -notin $excluded -and @('node.exe','java.exe','chrome.exe','chrome-headless-shell.exe') -contains $_.Name -and $_.CommandLine -and $_.CommandLine.Contains($r) } | Select-Object ProcessId,Name);",
 "[PSCustomObject]@{coordinators=$excluded;remaining=$workers}|ConvertTo-Json -Compress",
].join("\n");
const processes=JSON.parse(execFileSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",script],{encoding:"utf8",windowsHide:true}).trim());assert.equal(processes.remaining.length,0,"Own worker remains: "+JSON.stringify(processes.remaining));
const source=sourceFor(root+"/s"),report={at:new Date().toISOString(),phase,gateStatus,source:{files:source.files.length,digest:source.digest,guardPassed:true},resources,settleObservations:observations,baselineEqual:true,ownProcessesRemaining:0,excludedCurrentCoordinatorPids:processes.coordinators,policy:"Only checker/calling coordinators excluded; no worker exclusion; no broad deletion; runtimes retained privately"};
fs.writeFileSync(root+"/cleanup-"+phase+".json",JSON.stringify(report,null,2)+"\n",{flag:"wx"});fs.copyFileSync(root+"/cleanup-"+phase+".json",perm+"/"+path.basename(root)+"-cleanup-"+phase+".json");console.log(JSON.stringify(report));
