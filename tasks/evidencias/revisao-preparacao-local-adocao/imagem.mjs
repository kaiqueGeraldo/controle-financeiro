import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const run=path.resolve(process.argv[2]);
if(!run.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep))throw new Error('Runtime de revisão');
const id='sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1';
const docker=args=>execFileSync('docker',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const image=JSON.parse(docker(['image','inspect',id]))[0];
const actual=docker(['run','--rm','--network','none','--entrypoint','sha256sum',id,'/app/api.jar']).split(/\s+/)[0];
const {spawnSync}=await import('node:child_process');
const j=spawnSync('docker',['run','--rm','--network','none','--entrypoint','java',id,'-version'],{encoding:'utf8'});
if(j.status!==0)throw new Error('java version failed');
const result={at:new Date().toISOString(),imageId:image.Id,os:image.Os,architecture:image.Architecture,user:image.Config.User,
  producer:image.Config.Labels['org.opencontainers.image.revision'],jarLabel:image.Config.Labels['com.controlefinanceiro.jar.sha256'],
  observedJarSha256:actual,javaVersion:(j.stdout+j.stderr).trim(),published:false,network:'none; no application started'};
if(result.jarLabel!==actual||actual!=='b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b')throw new Error('Image/JAR mismatch');
fs.writeFileSync(path.join(run,'image-verification.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
