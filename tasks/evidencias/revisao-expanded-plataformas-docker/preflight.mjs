import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..'),runtime=path.resolve(process.argv[2]);
const run='cf-review-20261103-01',prefix=run;
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const old=path.resolve(runtime,'../saneamento-expanded-plataformas-01');
const jdk=path.resolve(root,'../../controle-financeiro/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
const docker=(args)=>execFileSync('docker',['--context','desktop-linux',...args],{encoding:'utf8',windowsHide:true}).trim();
const base=path.join(runtime,'preflight');fs.mkdirSync(base);
const write=(f,x)=>fs.writeFileSync(path.join(base,f),JSON.stringify(x,null,2)+'\n',{flag:'wx'});
write('baseline-resources.json',{containers:docker(['ps','-aq']).split('\n').filter(Boolean),networks:docker(['network','ls','-q']).split('\n').filter(Boolean),volumes:docker(['volume','ls','-q']).split('\n').filter(Boolean),daemonId:docker(['info','--format','{{.ID}}']),context:JSON.parse(docker(['context','inspect','desktop-linux','--format','{{json .Endpoints.docker}}'])),version:JSON.parse(docker(['version','--format','{{json .}}']))});
const report=path.join(old,'expanded-01/expanded/surefire/TEST-com.controlefinanceiro.api.support.DisposablePostgresGuardTest.xml');
const xml=fs.readFileSync(report,'utf8');
const raw=xml.match(/<property name="java.class.path" value="([^"]+)"/)[1].replaceAll('&amp;','&');
const libs=raw.split(':').filter(p=>p.endsWith('.jar')&&p.startsWith('/m2/repository/'));
assert.ok(libs.length>50);const m2=path.join(process.env.USERPROFILE,'.m2');
for(const f of libs)assert.ok(fs.existsSync(path.join(m2,f.slice('/m2/'.length))),f);
const classes=path.join(base,'classes');fs.mkdirSync(classes);
const guard='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/support/DisposablePostgresGuard.java';
const guardCopy=path.join(base,'DisposablePostgresGuard.java');fs.copyFileSync(path.join(root,guard),guardCopy);
// javac receives only the review probe and an unchanged copy of the guard. No application output is used.
const windowsCp=libs.map(f=>path.join(m2,f.slice('/m2/'.length))).join(';');
const javacArgs=path.join(base,'javac.args');fs.writeFileSync(javacArgs,['-encoding UTF-8','-cp '+JSON.stringify(windowsCp.replaceAll('\\','/')),'-d '+JSON.stringify(classes.replaceAll('\\','/')),JSON.stringify(guardCopy.replaceAll('\\','/')),JSON.stringify(path.join(import.meta.dirname,'InfraProbe.java').replaceAll('\\','/'))].join('\n'));
const compilation=spawnSync(path.join(jdk,'bin/javac.exe'),['@'+javacArgs],{encoding:'utf8',windowsHide:true});fs.writeFileSync(path.join(base,'compile.log'),(compilation.stdout??'')+(compilation.stderr??''));assert.equal(compilation.status,0,compilation.stderr);
write('inputs.json',{probeSha256:hash(path.join(import.meta.dirname,'InfraProbe.java')),guardSha256:hash(guardCopy),guardEqualsCandidate:hash(guardCopy)===hash(path.join(root,guard)),jdk,dependencyJars:libs.map(p=>({path:p,sha256:hash(path.join(m2,p.slice('/m2/'.length)))}))});
const serverName=prefix+'-tcp';let serverId;const results=[];
try {
  serverId=docker(['run','-d','--name',serverName,'--label','cf.review='+run,'-p','18765','--entrypoint','node','cf-excecao-zoom:20261103-01','-e',`require('net').createServer(s=>s.end('${run}')).listen(18765,'0.0.0.0')`]);
  const inspect=JSON.parse(docker(['inspect',serverId]))[0];const port=inspect.NetworkSettings.Ports['18765/tcp'][0].HostPort;
  write('tcp-container.json',{id:serverId,name:serverName,labels:inspect.Config.Labels,ports:inspect.NetworkSettings.Ports,privileged:inspect.HostConfig.Privileged});
  for(const topology of ['linux-sibling','windows-native']) {
    const name=prefix+'-'+topology;
    const env={...process.env};for(const k of Object.keys(env))if(/^(SPRING_|JWT_|RESEND_|BRAPI_|DATABASE_URL|DOCKER_|TESTCONTAINERS_)/.test(k))delete env[k];
    env.TESTCONTAINERS_HOST_OVERRIDE=topology==='linux-sibling'?'host.docker.internal':'127.0.0.1';
    env.DOCKER_HOST='npipe:////./pipe/dockerDesktopLinuxEngine';
    const argsFile=path.join(base,topology+'.args');
    const cp=topology==='windows-native'?classes+';'+windowsCp:'/probe/classes:'+libs.join(':');
    fs.writeFileSync(argsFile,['-cp '+JSON.stringify(cp.replaceAll('\\','/')),'InfraProbe',env.TESTCONTAINERS_HOST_OVERRIDE,port,run].join('\n'));
    const executable=topology==='windows-native'?path.join(jdk,'bin/java.exe'):'docker';
    const args=topology==='windows-native'?['@'+argsFile]:['--context','desktop-linux','run','--name',name,'--label','cf.review='+run,'--mount','type=bind,source='+base+',target=/probe,readonly','--mount','type=bind,source='+m2+',target=/m2,readonly','--mount','type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock','--env','DOCKER_HOST=unix:///var/run/docker.sock','--env','TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal','--entrypoint','java','cf-excecao-zoom:20261103-01','@/probe/linux-sibling.args'];
    const r=spawnSync(executable,args,{env,windowsHide:true,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
    const text=(r.stdout??'')+(r.stderr??'');fs.writeFileSync(path.join(base,topology+'.log'),text,{flag:'wx'});
    const session=text.match(/^SESSION (.+)$/m)?.[1]?.trim();
    const stages=[...text.matchAll(/^STEP ([C-G]) (PASS|FAIL) (.*)$/gm)].map(m=>({stage:m[1],status:m[2],detail:m[3]}));
    const daemon=text.match(/^DAEMON (.+)$/m)?.[1]?.trim();if(daemon)assert.equal(daemon,docker(['info','--format','{{.ID}}']));
    // A bounded grace period allows the resource reaper to finish; no test is repeated.
    await new Promise(resolve=>setTimeout(resolve,1500));
    const ownTc=session?JSON.parse(docker(['ps','-a','--filter','label=org.testcontainers.sessionId='+session,'--format','{{json .}}']).split('\n').filter(Boolean).map(x=>JSON.parse(x)).length?'[]':'[]'):[];
    const remaining=session?docker(['ps','-aq','--filter','label=org.testcontainers.sessionId='+session]).split('\n').filter(Boolean):[];
    const cleaned=[];
    for(const id of remaining){const i=JSON.parse(docker(['inspect',id]))[0];assert.equal(i.Config.Labels['org.testcontainers.sessionId'],session);docker(['rm','-f','-v',id]);cleaned.push({id,kind:'owned Testcontainers session only'});}
    const after=session?docker(['ps','-aq','--filter','label=org.testcontainers.sessionId='+session]):'';
    results.push({topology,executable,args,exit:r.status,error:r.error?.message,stages,session,daemon,remainingBeforeExplicitCleanup:remaining,explicitCleanup:cleaned,remainingAfter:after,logSha256:hash(path.join(base,topology+'.log'))});
    if(topology==='linux-sibling') {assert.equal(r.status,1);assert.equal(stages.at(-1)?.stage,'F');assert.equal(stages.at(-1)?.status,'FAIL');}
    else {assert.equal(r.status,0,text);assert.equal(stages.at(-1)?.stage,'G');}
  }
} finally {
  for(const id of docker(['ps','-aq','--filter','label=cf.review='+run]).split('\n').filter(Boolean)) {
    const i=JSON.parse(docker(['inspect',id]))[0];assert.equal(i.Config.Labels['cf.review'],run);docker(['rm','-f','-v',id]);
  }
  write('results.json',results);
  write('cleanup.json',{containers:docker(['ps','-aq','--filter','label=cf.review='+run]),networks:docker(['network','ls','--filter','label=cf.review='+run,'-q']),volumes:docker(['volume','ls','--filter','label=cf.review='+run,'-q']),allContainerIds:docker(['ps','-aq']).split('\n').filter(Boolean),networksAll:docker(['network','ls','-q']).split('\n').filter(Boolean),volumesAll:docker(['volume','ls','-q']).split('\n').filter(Boolean)});
}
console.log(JSON.stringify(results.map(({topology,exit,stages,remainingBeforeExplicitCleanup,remainingAfter})=>({topology,exit,stages,remainingBeforeExplicitCleanup,remainingAfter}))));
