import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {ryukFromLog,ownsPreflightContainer} from './preflight-ownership.mjs';
const [runtimeArg,jdkArg,attempt='01']=process.argv.slice(2);assert.ok(runtimeArg&&jdkArg);
const root=path.resolve(import.meta.dirname,'../../..'),runtime=fs.realpathSync.native(runtimeArg),jdk=fs.realpathSync.native(jdkArg);
const out=path.join(runtime,'preflight-'+attempt);fs.mkdirSync(out);
const run='cf-expanded-'+path.basename(runtime).replace(/[^a-zA-Z0-9-]/g,'')+'-'+attempt;
const prior=path.resolve(root,'../../controle-financeiro-runtimes/preparacao-adocao/saneamento-expanded-plataformas-01');
const original=path.join(root,'tasks/evidencias/revisao-expanded-plataformas-docker');
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const docker=(...args)=>execFileSync('docker',['--context','desktop-linux',...args],{encoding:'utf8',windowsHide:true}).trim();
const resources=()=>({containers:docker('ps','-aq').split('\n').filter(Boolean).sort(),networks:docker('network','ls','-q').split('\n').filter(Boolean).sort(),volumes:docker('volume','ls','-q').split('\n').filter(Boolean).sort()});
const baseline=resources(),daemon=docker('info','--format','{{.ID}}');
assert.equal(daemon,'2455a676-938f-48d8-a0ef-67c98474314d');
write('baseline.json',{at:new Date().toISOString(),resources:baseline,daemon,context:JSON.parse(docker('context','inspect','desktop-linux','--format','{{json .Endpoints.docker}}')),versions:JSON.parse(docker('version','--format','{{json .}}'))});
const xml=fs.readFileSync(path.join(prior,'expanded-01/expanded/surefire/TEST-com.controlefinanceiro.api.support.DisposablePostgresGuardTest.xml'),'utf8');
const jars=xml.match(/<property name="java.class.path" value="([^"]+)"/)[1].replaceAll('&amp;','&').split(':').filter(f=>f.endsWith('.jar')&&f.startsWith('/m2/repository/')).map(f=>path.join(process.env.USERPROFILE,'.m2',f.slice('/m2/'.length)));
assert.ok(jars.length>50);for(const f of jars)assert.ok(fs.existsSync(f),f);
const classes=path.join(out,'classes');fs.mkdirSync(classes);
const guard=path.join(root,'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/support/DisposablePostgresGuard.java'),guardCopy=path.join(out,'DisposablePostgresGuard.java');
fs.copyFileSync(guard,guardCopy);assert.equal(hash(guard),hash(guardCopy));
const probe=path.join(original,'InfraProbe.java'),quote=p=>JSON.stringify(p.replaceAll('\\','/'));
const javacArgs=path.join(out,'javac.args');fs.writeFileSync(javacArgs,['-encoding UTF-8','-cp '+quote(jars.join(';')),'-d '+quote(classes),quote(guardCopy),quote(probe)].join('\n'));
const compilation=spawnSync(path.join(jdk,'bin/javac.exe'),['@'+javacArgs],{encoding:'utf8',windowsHide:true});
fs.writeFileSync(path.join(out,'compile.log'),(compilation.stdout??'')+(compilation.stderr??''),{flag:'wx'});assert.equal(compilation.status,0);
write('inputs.json',{probe:{path:probe,sha256:hash(probe)},guard:{path:guard,sha256:hash(guard),copySha256:hash(guardCopy)},jdk,dependencies:jars.map(file=>({file,sha256:hash(file)})),policy:'Original approved InfraProbe and original guard, Windows only; historical XML supplies dependency paths, never test results'});
const env={...process.env};for(const key of Object.keys(env))if(/^(SPRING_|JWT_|RESEND_|BRAPI_|DATABASE_URL|DOCKER_|TESTCONTAINERS_)/.test(key))delete env[key];
Object.assign(env,{DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONTEXT:'desktop-linux',TESTCONTAINERS_HOST_OVERRIDE:'127.0.0.1',TESTCONTAINERS_REUSE_ENABLE:'false'});
let tcp,session,log='',result;const ownedIds=new Set(),removed=[];
const started=new Date().toISOString();
try{
 tcp=docker('run','-d','--name',run+'-tcp','--label','cf.expanded.run='+run,'-p','127.0.0.1::18765','--entrypoint','node','cf-excecao-zoom:20261103-01','-e',"require('net').createServer(s=>s.end('"+run+"')).listen(18765,'0.0.0.0')");
 const tcpInspect=JSON.parse(docker('inspect',tcp))[0];
 write('tcp.json',{id:tcpInspect.Id,labels:tcpInspect.Config.Labels,ports:tcpInspect.NetworkSettings.Ports,image:tcpInspect.Image});
 const port=tcpInspect.NetworkSettings.Ports['18765/tcp'][0].HostPort;
 const argsFile=path.join(out,'windows.args');fs.writeFileSync(argsFile,['-cp '+quote(classes+';'+jars.join(';')),'InfraProbe','127.0.0.1',port,run].join('\n'));
 result=spawnSync(path.join(jdk,'bin/java.exe'),['@'+argsFile],{env,windowsHide:true,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
 log=(result.stdout??'')+(result.stderr??'');fs.writeFileSync(path.join(out,'windows.log'),log,{flag:'wx'});
 session=log.match(/^SESSION (.+)$/m)?.[1]?.trim();
 for(const match of log.matchAll(/^(?:TC_RESOURCE|PG) id=([a-f0-9]+)/gm))ownedIds.add(match[1]);
 const stages=[...log.matchAll(/^STEP ([C-G]) (PASS|FAIL) (.*)$/gm)].map(m=>({stage:m[1],status:m[2],detail:m[3]}));
 write('execution.json',{started,finished:new Date().toISOString(),exit:result.status,error:result.error?.message,run,session,daemon,platform:'win32 JVM -> Docker Desktop/Linux -> 127.0.0.1',environment:{DOCKER_HOST:env.DOCKER_HOST,TESTCONTAINERS_HOST_OVERRIDE:env.TESTCONTAINERS_HOST_OVERRIDE,ryukDisabled:false,reuse:false},stages,logSha256:hash(path.join(out,'windows.log'))});
 assert.equal(result.status,0,'Windows preflight failed; inspect private windows.log');
 assert.deepEqual(stages.map(s=>[s.stage,s.status]),['C','D','E','F','G'].map(s=>[s,'PASS']));
 assert.equal(log.match(/^DAEMON (.+)$/m)?.[1]?.trim(),daemon);
}finally{
 // This grace period is resource-reaper cleanup, not a repeat of the probe.
 await new Promise(resolve=>setTimeout(resolve,1500));
 if(session)for(const id of docker('ps','-aq','--filter','label=org.testcontainers.sessionId='+session).split('\n').filter(Boolean))ownedIds.add(id);
 if(tcp)ownedIds.add(tcp);
 const ryuk=ryukFromLog(log);for(const id of ryuk.keys())ownedIds.add(id);
 const current=docker('ps','-aq','--no-trunc').split('\n').filter(Boolean);
 for(const own of ownedIds){
  const id=current.find(id=>id===own||id.startsWith(own));if(!id)continue;
  const inspection=spawnSync('docker',['--context','desktop-linux','inspect',id],{encoding:'utf8',windowsHide:true});
  if(inspection.status!==0){assert.match(inspection.stderr,/no such (object|container)/i);continue;}
  const inspected=JSON.parse(inspection.stdout)[0],labels=inspected.Config.Labels??{};
  assert.ok(ownsPreflightContainer(inspected,{run,session,baseline:baseline.containers,ryuk}),'Unproven resource ownership');
  const removal=spawnSync('docker',['--context','desktop-linux','rm','-f','-v',id],{encoding:'utf8',windowsHide:true});
  if(removal.status!==0)assert.match(removal.stderr,/no such (object|container)/i);
  removed.push({id,image:inspected.Config.Image,labels,ownership:ryuk.has(id)?'exact current-JVM Ryuk log ID + image + Testcontainers label':'exact own run/session label'});
 }
 const after=resources();write('cleanup.json',{at:new Date().toISOString(),run,session,removed,before:baseline,after,baselineEqual:JSON.stringify(baseline)===JSON.stringify(after)});
 assert.deepEqual(after,baseline,'Preflight cleanup differs from baseline; do not start suite');
}
console.log(JSON.stringify({preflight:'passed',attempt,stages:5,ryuk:true,guard:true,jdbc:true,cleanup:'baseline equal',out}));
