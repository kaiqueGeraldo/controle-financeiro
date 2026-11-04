import fs from "node:fs";import http from "node:http";import assert from "node:assert/strict";import {createRequire} from "node:module";
const [root]=process.argv.slice(2),out=root+"/navigation-control-02";assert.ok(!fs.existsSync(out));fs.mkdirSync(out);
const {chromium}=createRequire(root+"/s/controle-financeiro-frontend/package.json")("playwright");
const events=[];let pending,arrived,mode="hold",browser,confirmed=0;
const server=http.createServer((req,res)=>{if(req.url==="/mutation"){events.push({event:"server-post",mode});if(mode==="hold"){pending=res;arrived?.();}else{confirmed++;res.writeHead(200,{"Content-Type":"application/json"});res.end('{"confirmed":true}');}return;}events.push({event:"document-get",mode,confirmed});res.writeHead(200,{"Content-Type":"text/html"});res.end('<button onclick="fetch(\'/mutation\',{method:\'POST\'}).catch(()=>{})">mutate</button>');});
try{
 await new Promise(r=>server.listen(0,"127.0.0.1",r));const url="http://127.0.0.1:"+server.address().port;browser=await chromium.launch();let page=await browser.newPage();await page.goto(url);
 const received=new Promise(r=>{arrived=r;});await page.getByRole("button",{name:"mutate"}).click();await received;await page.reload();
 assert.equal(pending.writableFinished,false);assert.equal(confirmed,0);events.push({event:"reload-finished-without-ack"});pending.destroy();await page.close();
 mode="confirm";page=await browser.newPage();await page.goto(url);const response=page.waitForResponse(r=>r.url().endsWith("/mutation")&&r.request().method()==="POST");const [,ack]=await Promise.all([page.getByRole("button",{name:"mutate"}).click(),response]);assert.equal(ack.status(),200);assert.equal(confirmed,1);events.push({event:"ack-observed-before-reload"});await page.reload();assert.equal(confirmed,1);
 fs.writeFileSync(out+"/result.json",JSON.stringify({at:new Date().toISOString(),negative:"Reload finished with POST response deliberately withheld, no confirmation",positive:"Wait for real HTTP200 before reload",cancellation:"Not established; probe01 did not observe requested abort event",productApproval:false,events},null,2)+"\n",{flag:"wx"});console.log(JSON.stringify({negativeNoAck:true,positiveAck:200,cancellationClaim:false}));
}finally{pending?.destroy();await browser?.close();await new Promise(r=>server.close(r));}
