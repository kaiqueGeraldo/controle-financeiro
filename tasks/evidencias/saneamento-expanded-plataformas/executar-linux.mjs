import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {sourceFor} from '../../../.github/scripts/source.mjs';
import {freshOutput} from '../../../.github/scripts/ci.mjs';

const [sourceArg,outArg,image]=process.argv.slice(2);
assert.ok(sourceArg&&outArg&&image,'source-export new-output image required');
const source=fs.realpathSync.native(sourceArg),out=freshOutput(source,outArg),input=sourceFor(source);
assert.ok(!fs.existsSync(path.join(source,'controle-financeiro-frontend/node_modules')),'Export sources only; install into the fresh native Linux filesystem');
const m2=fs.realpathSync.native(process.env.MAVEN_USER_HOME??path.join(os.homedir(),'.m2'));
const name='saneamento-expanded-'+randomUUID();
const script='set -eu\nmkdir -p /work/s\ncp -a /inputs/. /work/s/\ncd /work/s\nnode --version\njava -version\nuname -a\nnode --test .github/scripts/ci.test.mjs .github/scripts/suites.test.mjs .github/scripts/sanitize.test.mjs .github/scripts/required.test.mjs .github/scripts/zoom-coverage.test.mjs .github/scripts/paths.test.mjs .github/scripts/components.test.mjs\nnode .github/scripts/ci.mjs all /work/s /evidence/expanded\n';
fs.writeFileSync(path.join(out,'run.sh'),script,{flag:'wx'});
const args=['run','--name',name,'--shm-size=1g','--mount','type=bind,source='+source+',target=/inputs,readonly','--mount','type=bind,source='+out+',target=/evidence','--mount','type=bind,source='+m2+',target=/m2,readonly','--mount','type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock','--env','CF034_SUITE=expanded','--env','MAVEN_USER_HOME=/m2','--env','MAVEN_ARGS=--offline -Dmaven.repo.local=/m2/repository','--env','DOCKER_HOST=unix:///var/run/docker.sock','--env','TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal','--env','PLAYWRIGHT_BROWSERS_PATH=0','--entrypoint','sh',image,'/evidence/run.sh'];
const imageId=execFileSync('docker',['image','inspect',image,'--format','{{.Id}}'],{encoding:'utf8',windowsHide:true}).trim();
fs.writeFileSync(path.join(out,'invocation.json'),JSON.stringify({started:new Date(),source:input,imageId,executorSha256:createHash('sha256').update(fs.readFileSync(new URL(import.meta.url))).digest('hex'),args,container:name,policy:'Fresh source-only copy on native Linux filesystem; only evidence uses host bind mount; local Docker, not Actions'},null,2)+'\n',{flag:'wx'});
const stdout=fs.openSync(path.join(out,'stdout.log'),'wx'),stderr=fs.openSync(path.join(out,'stderr.log'),'wx');
const result=spawnSync('docker',args,{windowsHide:true,stdio:['ignore',stdout,stderr]});fs.closeSync(stdout);fs.closeSync(stderr);
// Keep the stopped container: first occurrence, npm diagnostics and native outputs remain inspectable.
fs.writeFileSync(path.join(out,'execution.json'),JSON.stringify({finished:new Date(),exit:result.status,error:result.error?.message,container:name,stdoutSha256:createHash('sha256').update(fs.readFileSync(path.join(out,'stdout.log'))).digest('hex'),stderrSha256:createHash('sha256').update(fs.readFileSync(path.join(out,'stderr.log'))).digest('hex')},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exit:result.status,container:name,out}));process.exitCode=result.status??1;
