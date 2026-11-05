import fs from "node:fs";import path from "node:path";import http from "node:http";import assert from "node:assert/strict";import {createRequire} from "node:module";
const [root]=process.argv.slice(2),out=root+"/navigation-control";assert.ok(!fs.existsSync(out));fs.mkdirSync(out);
const require=createRequire(root+"/s/controle-financeiro-frontend/package.json"),{chromium}=require("playwright");
const events=[];let pending,arrived,mode="hold",browser;
const server=http.createServer((req,res)=>{
 if(req.url==="/mutation"){events.push({event:"server-post",mode});if(mode==="hold"){pending=res;res.once("close",()=>events.push({event:"held-response-closed",finished:res.writableFinished}));arrived?.();}else{res.writeHead(200,{"Content-Type":"application/json"});res.end('{"confirmed":true}');}return;}
 events.push({event:"document-get",mode});res.writeHead(200,{"Content-Type":"text/html"});res.end('<button onclick="fetch(\'/mutation\',{method:\'POST\'})">mutate</button>');
});
try{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const url="http://127.0.0.1:"+server.address().port;
 browser=await chromium.launch();const page=await browser.newPage();await page.goto(url);
 let failure;const aborted=new Promise(resolve=>page.on("requestfailed",r=>{if(r.url().endsWith("/mutation")){failure=r.failure()?.errorText;events.push({event:"request-failed",failure});resolve();}}));
 const requestArrived=new Promise(resolve=>{arrived=resolve;});
 await page.getByRole("button",{name:"mutate"}).click();await requestArrived;
 await page.reload();await Promise.race([aborted,new Promise((_,reject)=>setTimeout(()=>reject(Error("No navigation abort observed")),10000))]);
 assert.match(failure,/ABORTED|abort/i);assert.equal(pending.writableFinished,false);pending.destroy();
 mode="confirm";const response=page.waitForResponse(r=>r.url().endsWith("/mutation")&&r.request().method()==="POST");
 const [,ack]=await Promise.all([page.getByRole("button",{name:"mutate"}).click(),response]);assert.equal(ack.status(),200);events.push({event:"await-confirmed-response"});await page.reload();
 fs.writeFileSync(out+"/result.json",JSON.stringify({at:new Date().toISOString(),negative:"Navigation while response pending aborted document fetch",positive:"Await real response before reload; same browser/server; no mocked financial API",events,productApproval:false},null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({negativeAbort:failure,positive:ack.status(),productApproval:false}));
}finally{pending?.destroy();await browser?.close();await new Promise(resolve=>server.close(resolve));}
