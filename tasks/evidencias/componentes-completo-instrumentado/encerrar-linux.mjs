import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";import {execFileSync} from "node:child_process";import {hash} from "../../../.github/scripts/source.mjs";
const runtime=fs.realpathSync.native(process.argv[2]),c=JSON.parse(fs.readFileSync(path.join(runtime,"container.json")));
const docker=(...args)=>execFileSync("docker",["--context","desktop-linux",...args],{encoding:"utf8",windowsHide:true}).trim();
const inspected=JSON.parse(docker("inspect",c.id))[0];assert.equal(inspected.Config.Labels["cf.component.full"],path.basename(runtime));assert.equal(inspected.Name,"/"+c.name);
const nativeCode='import fs from "node:fs";import {hash,sourceFor} from "/work/s/.github/scripts/source.mjs";const source=sourceFor("/work/s");const scripts=fs.readdirSync("/work/obs").filter(f=>/\\.(mjs|mts)$/.test(f)).map(file=>({file,sha256:hash(fs.readFileSync("/work/obs/"+file))}));console.log(JSON.stringify({source,files:source.files.length,scripts}));';
const native=JSON.parse(docker("exec",c.id,"node","--input-type=module","-e",nativeCode));
assert.equal(native.source.digest,"d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660");assert.equal(native.files,860);
const archive=path.join(runtime,"executed-observers-allowlist");fs.mkdirSync(archive);for(const s of native.scripts)docker("cp",c.id+":/work/obs/"+s.file,path.join(archive,s.file));
for(const s of native.scripts){assert.equal(hash(fs.readFileSync(path.join(archive,s.file))),s.sha256);assert.equal(hash(fs.readFileSync(path.join(import.meta.dirname,s.file))),s.sha256);}
fs.writeFileSync(path.join(runtime,"native-final.json"),JSON.stringify({at:new Date().toISOString(),...native,allExecutedObserverBytesMatch:true,archive},null,2)+"\n",{flag:"wx"});
const top=docker("top",c.id,"-eo","pid,ppid,comm");assert.ok(!top.includes("vitest"),"Active test worker remains");
docker("rm","-f","-v",c.id);
const list=(...args)=>docker(...args).split("\n").filter(Boolean).sort(),initial=JSON.parse(fs.readFileSync(path.join(runtime,"initial.json")));
const after={containers:list("ps","-aq"),networks:list("network","ls","-q"),volumes:list("volume","ls","-q")};
assert.deepEqual(after,initial.resources);
fs.writeFileSync(path.join(runtime,"cleanup-linux.json"),JSON.stringify({at:new Date().toISOString(),id:c.id,name:c.name,labels:inspected.Config.Labels,image:inspected.Image,limits:{nanoCpus:inspected.HostConfig.NanoCpus,memory:inspected.HostConfig.Memory,shmSize:inspected.HostConfig.ShmSize},top,removed:true,after,baselineEqual:true,nativeManifestSha:hash(fs.readFileSync(path.join(runtime,"native-final.json")))},null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({linuxCleanup:"baseline equal",sourceRestored:true,observerScripts:native.scripts.length}));
