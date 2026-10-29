import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const run=path.resolve(process.argv[2]??'');
if(!run.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep))throw new Error('Preparation execution required');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function command(file,args,cwd=process.cwd()) {
  const result=spawnSync(file,args,{cwd,env:process.env,encoding:'utf8'});
  if(result.error||result.status!==0)throw new Error('Toolchain command failed: '+file);
  return (result.stdout+result.stderr).trim();
}
const java=command(path.join(process.env.JAVA_HOME,'bin/java.exe'),['-version']);
const maven=command(process.env.ComSpec??'cmd.exe',['/d','/c','mvnw.cmd','--version'],path.join(run,'checkout/controle-financeiro-backend'));
fs.writeFileSync(path.join(run,'maven-version.log'),maven+'\n');
const prior=path.join(run,'../p03');
const fresh=path.join(prior,'installed-playwright-core');
const reused=path.resolve('controle-financeiro-frontend/node_modules/playwright-core');
function files(root,relative='') {
  return fs.readdirSync(path.join(root,relative),{withFileTypes:true}).flatMap(entry=>{
    if(entry.name==='.local-browsers')return [];
    const name=path.join(relative,entry.name);
    return entry.isDirectory()?files(root,name):[name];
  });
}
const freshFiles=files(fresh).sort(), reusedFiles=files(reused).sort();
if(JSON.stringify(freshFiles)!==JSON.stringify(reusedFiles))throw new Error('Reused browser library file set differs');
const code=freshFiles.map(file=>{
  const expected=sha(path.join(fresh,file)),actual=sha(path.join(reused,file));
  if(expected!==actual)throw new Error('Browser library differs from fresh locked installation: '+file);
  return {file,sha256:actual};
});
const binaries=['chromium-1243/chrome-win64/chrome.exe','chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe']
  .map(file=>({file:path.join(reused,'.local-browsers',file),sha256:sha(path.join(reused,'.local-browsers',file))}));
const pg=folder=>{
  const text=fs.readFileSync(path.join(prior,folder),'utf8');
  return {server:text.match(/CF017_SERVER ([^\r\n]+)/)?.[1],clients:[...text.matchAll(/CF017_CLIENT ([^\r\n]+)/g)].map(x=>x[1])};
};
const inputs=JSON.parse(fs.readFileSync(path.join(run,'inputs.json')));
const toolchain={native:{platform:process.platform,architecture:process.arch,java,node:process.version,
  npm:command(process.env.ComSpec??'cmd.exe',['/d','/c','npm.cmd','--version']),maven},
  imageJava:fs.readFileSync(path.join(run,'image-java.log'),'utf8').trim(),
  runtimeLaunch:{nativeAppJvmArgs:['-Xmx384m'],imageAppJvmArgs:[],imageHeap:'JVM container defaults',
    startupWaitSeconds:40,probeHttpTimeoutSeconds:8,jdbcConnectTimeoutSeconds:2,jdbcSocketTimeoutSeconds:2,
    note:'OS, Java patch and heap ergonomics differ; native Windows and the later restored Linux witness exceeded startup budget. Cause remains inconclusive.'},
  pg16:pg('pg16-regression.log'),pg17:pg('pg17-final.log'),
  locks:inputs.inputs.filter(x=>x.file.endsWith('/pom.xml')||x.file.endsWith('/package-lock.json')),
  libraries:fs.readFileSync(path.join(run,'jar-inspection/entries.txt'),'utf8').split(/\r?\n/).filter(x=>/^BOOT-INF\/lib\/[^/]+\.jar$/.test(x)),
  browser:{version:JSON.parse(fs.readFileSync(path.join(reused,'package.json'))).version,reusedReadOnly:reused,
    freshLockedInstallation:fresh,matchingCodeFiles:code.length,code,binaries}};
fs.writeFileSync(path.join(run,'toolchain.json'),JSON.stringify(toolchain,null,2)+'\n');
console.log(JSON.stringify({node:toolchain.native.node,pg16:toolchain.pg16,pg17:toolchain.pg17,matchingBrowserCodeFiles:code.length}));
