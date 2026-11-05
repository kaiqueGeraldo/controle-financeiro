import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
const [front,out,oldExecutable]=process.argv.slice(2),require=createRequire(path.join(front,"package.json"));
const {chromium}=require("playwright");
const cache=path.join(front,"node_modules/playwright-core/.local-browsers");
const shell=fs.readdirSync(cache).find(n=>n.startsWith("chromium_headless_shell-"));
const executable=path.join(cache,shell,"chrome-headless-shell-win64/chrome-headless-shell.exe");
assert.ok(executable.length<240);
const hash=file=>createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const old=spawnSync(oldExecutable,["--version"],{windowsHide:true,encoding:"utf8",timeout:10000});
assert.equal(old.error?.code,"ENOENT");assert.equal(hash(executable),hash(oldExecutable));
let browser;
try{
 browser=await chromium.launch();
 const page=await browser.newPage({acceptDownloads:true});
 await page.goto("about:blank");
 await page.setContent("<title>Operational control</title><p>owned runtime</p>");
 assert.equal(await page.title(),"Operational control");
 await page.screenshot({path:path.join(out,"blank-control.png")});
 fs.writeFileSync(path.join(out,"browser.json"),JSON.stringify({version:browser.version(),cache,executable,length:executable.length,sha256:hash(executable),oldExecutable,oldLength:oldExecutable.length,oldFailure:old.error.code,temp:process.env.TEMP,assertions:"real launch/page/content/screenshot; no product journey",closedInFinally:true},null,2)+"\n",{flag:"wx"});
}finally{await browser?.close();}
