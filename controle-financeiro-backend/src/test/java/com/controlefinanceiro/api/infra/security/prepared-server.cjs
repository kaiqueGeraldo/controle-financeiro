// CF023 runs the ownership journey against a compiled application.
// Startup/build belongs to the existing shared 120s readiness budget in browser.cjs.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {spawn,spawnSync}=require('node:child_process');
const https=require('node:https');
const [sourceArg,runtimeArg]=process.argv.slice(2);
const source=path.resolve(sourceArg),runtime=path.resolve(runtimeArg);
assert.ok(sourceArg&&runtimeArg&&source!==runtime);
const backend=new URL(process.env.BACKEND_API_URL);
assert.equal(backend.protocol,'http:');assert.equal(backend.hostname,'127.0.0.1');
// A new execution owns this directory. Never reuse/delete a prior cache.
assert.ok(!fs.existsSync(runtime),'never reuse an existing frontend runtime');
fs.mkdirSync(runtime,{recursive:true});
const inputs=[];
function copy(from,to,relative){
 const stat=fs.lstatSync(from);assert.ok(!stat.isSymbolicLink(),'unexpected source link: '+relative);
 if(stat.isDirectory()){fs.mkdirSync(to);for(const name of fs.readdirSync(from))copy(path.join(from,name),path.join(to,name),path.join(relative,name));}
 else{assert.ok(stat.isFile());fs.copyFileSync(from,to);inputs.push({file:relative,sha256:createHash('sha256').update(fs.readFileSync(to)).digest('hex')});}
}
for(const name of ['src','public','package.json','package-lock.json','next.config.ts','tsconfig.json','postcss.config.mjs']){
 const from=path.join(source,name);if(fs.existsSync(from))copy(from,path.join(runtime,name),name);
}
const dependencies=path.join(source,'node_modules'),installed=path.join(runtime,'node_modules');
function link(from,to){
 const stat=fs.lstatSync(from);
 if(stat.isSymbolicLink()){
  const resolved=fs.realpathSync(from);
  assert.ok(resolved.startsWith(dependencies+path.sep),'dependency link leaves installed tree');
  const destination=path.join(installed,path.relative(dependencies,resolved));
  fs.symlinkSync(path.relative(path.dirname(to),destination),to,fs.statSync(resolved).isDirectory()?'junction':'file');
 }else if(stat.isDirectory()){fs.mkdirSync(to);for(const name of fs.readdirSync(from))link(path.join(from,name),path.join(to,name));}
 else{assert.ok(stat.isFile());fs.linkSync(from,to);}
}
link(dependencies,installed);
fs.writeFileSync(path.join(runtime,'frontend-inputs.json'),JSON.stringify({source,runtime,policy:'physical product sources; immutable dependencies hardlinked; no env files or previous cache copied',inputs},null,2)+'\n',{flag:'wx'});
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};
// Financial time remains fixed in the JVM and browser; Node/Edge credentials use real time.
for(const key of ['NODE_OPTIONS','CF_E2E_SERVER_CLOCK','CF_E2E_AUTH_NOW'])delete env[key];
const next=path.join(runtime,'node_modules/next/dist/bin/next');
let child,server;
function run(args,done){
 console.log(JSON.stringify({phase:args[0],at:new Date().toISOString()}));
 child=spawn(process.execPath,[next,...args],{cwd:runtime,env,stdio:'inherit',windowsHide:true});
 child.once('error',error=>{console.error(error);process.exitCode=1;});
 child.once('exit',(code,signal)=>{if(code===0&&!signal)done();else process.exitCode=code||1;});
}
async function serve(){
 const passphrase='Synthetic-Cf023-Loopback-Only';
 const keytool=path.join(process.env.JAVA_HOME,'bin',process.platform==='win32'?'keytool.exe':'keytool');
 const store=path.join(runtime,'loopback.p12'),certificate=path.join(runtime,'loopback.crt');
 const common=['-keystore',store,'-storetype','PKCS12','-storepass',passphrase];
 for(const args of [['-genkeypair','-alias','cf023','-keyalg','RSA','-keysize','2048','-keypass',passphrase,'-dname','CN=127.0.0.1','-ext','SAN=ip:127.0.0.1','-validity','2','-noprompt',...common],['-exportcert','-rfc','-alias','cf023','-file',certificate,...common]]){
  const result=spawnSync(keytool,args,{env,stdio:'inherit',windowsHide:true});assert.equal(result.status,0,'local TLS fixture generation');
 }
 process.env.NODE_ENV='production';
 const app=require(path.join(runtime,'node_modules/next'))({dev:false,dir:runtime,hostname:'127.0.0.1',port:3113});
 await app.prepare();
 server=https.createServer({pfx:fs.readFileSync(store),passphrase},app.getRequestHandler());
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(3113,'127.0.0.1',resolve);});
 console.log(JSON.stringify({phase:'https-ready',at:new Date().toISOString(),address:'https://127.0.0.1:3113',certificateFingerprint:new (require('node:crypto').X509Certificate)(fs.readFileSync(certificate)).fingerprint256}));
}
process.once('SIGTERM',()=>{child?.kill('SIGTERM');server?.close();});
run(['build'],()=>serve().catch(error=>{console.error(error);process.exitCode=1;}));
