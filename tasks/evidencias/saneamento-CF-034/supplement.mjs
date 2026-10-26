import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync,spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {snapshot,hash,writeJson} from '../../../.github/scripts/source.mjs';
import {spawnOwned,stopOwned} from '../../../.github/scripts/owned-process.mjs';
const root=path.resolve(process.argv[2]);assert(root.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true});
const run=args=>{const r=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,maxBuffer:10*1024*1024});return {exit:r.status,stdout:r.stdout,stderr:r.stderr};};
const read=p=>JSON.parse(fs.readFileSync(p)),result={at:new Date().toISOString(),root};
const front=path.join(root,'fixture/controle-financeiro-frontend');fs.mkdirSync(front,{recursive:true});
writeJson(path.join(front,'package.json'),{name:'console-proof',version:'1.0.0',scripts:{lint:'node sentinel.mjs'}});writeJson(path.join(front,'package-lock.json'),{name:'console-proof',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'console-proof',version:'1.0.0'}}});
fs.writeFileSync(path.join(front,'sentinel.mjs'),'process.stdout.write(\'{"pass\');setTimeout(()=>{process.stdout.write(\'word":"SENTINEL_JSON"}\\nAuthor\');setTimeout(()=>{process.stdout.write(\'ization: Bearer SENTINEL_BEARER\\nCookie: session=SENTINEL_COOKIE\\ndiagnostic=keep\\n\');process.exitCode=23;},20);},20);');
snapshot(path.dirname(front),{commit:'synthetic-output-chunks',originalTreeChanges:[]});
const out=path.join(root,'output');const gate=run(['.github/scripts/ci.mjs','all',path.dirname(front),out]);assert.equal(gate.exit,1);assert(!/SENTINEL/.test(gate.stdout+gate.stderr));assert.equal(read(path.join(out,'result.json')).steps.at(-1).exit,23);
const raw=fs.readFileSync(path.join(out,'lint.log'));assert(/SENTINEL_JSON/.test(raw));const c=run(['.github/scripts/publish-evidence.mjs',out]);assert.equal(c.exit,0);const safe=fs.readFileSync(path.join(out,'public/lint.log'));assert(!/SENTINEL/.test(safe));assert(safe.includes('diagnostic=keep'));assert.equal(hash(fs.readFileSync(path.join(out,'lint.log'))),hash(raw));result.chunkedOutput={gate,collector:c,rawSha256:hash(raw),sanitizedSha256:hash(safe),collection:read(path.join(out,'public/collection.json'))};
// Both durable success and failure exercise the real collector, relocated only
// to prevent generating new material in historical evidence directories.
const durable=path.join(root,'durable');fs.mkdirSync(durable);let text=fs.readFileSync('tasks/evidencias/CF-034/collect.mjs','utf8').replaceAll(/(['"])\.\.\/\.\.\/\.\.\/(\.github\/scripts\/[^'"]+)\1/g,(_,q,f)=>q+pathToFileURL(path.resolve(f)).href+q);const collector=path.join(durable,'collect.mjs');fs.writeFileSync(collector,text);
const d=run([collector,out,'safe']);assert.equal(d.exit,0,d.stderr);const durableLog=fs.readFileSync(path.join(durable,'runs/safe/lint.log'));assert(!/SENTINEL/.test(durableLog));assert(durableLog.includes('diagnostic=keep'));
const malformed=path.join(root,'malformed');fs.mkdirSync(malformed);fs.writeFileSync(path.join(malformed,'result.json'),'{"password":"SENTINEL_UNCLOSED');const rejected=run([collector,malformed,'unsafe']);assert.equal(rejected.exit,1);assert(!fs.existsSync(path.join(durable,'runs/unsafe')));assert(!/SENTINEL/.test(rejected.stdout+rejected.stderr));result.durable={accepted:d,rejected,rawSha256:hash(raw),sanitizedSha256:hash(durableLog)};
// Late cancellation after normal completion is a no-op. Observe the descendant
// by handle BEFORE releasing its parent, so cleanup is distinguished from expiry.
const marker=path.join(root,'grand.ready'),natural=path.join(root,'grand.natural');
const grand=path.join(root,'grand.mjs');fs.writeFileSync(grand,`import fs from 'node:fs';fs.writeFileSync(${JSON.stringify(marker)},String(process.pid));process.send('ready');setTimeout(()=>fs.writeFileSync(${JSON.stringify(natural)},'natural'),12000);`);
const release=path.join(root,'parent.release');
const parentCode=`import fs from 'node:fs';import {spawn} from 'node:child_process';const c=spawn(process.execPath,[${JSON.stringify(grand)}],{stdio:['ignore','inherit','inherit','ipc']});c.once('message',()=>{fs.watchFile(${JSON.stringify(release)},{interval:25},()=>{if(fs.existsSync(${JSON.stringify(release)}))process.exit(0);});});`;
const owned=spawnOwned(process.execPath,['--input-type=module','-e',parentCode],{cwd:root,env:process.env,windowsHide:true});let error='';owned.stderr.on('data',d=>error+=d);const exited=new Promise(resolve=>owned.once('close',code=>resolve(code)));
const deadline=Date.now()+5000;while(!fs.existsSync(marker)){assert(Date.now()<deadline,error);await new Promise(r=>setTimeout(r,25));}
// Open a Windows handle before cancelling, and retain it until signalled.
const ps=`$p=Get-Process -Id ${Number(fs.readFileSync(marker))};[void]$p.Handle;Set-Content -LiteralPath '${root.replaceAll("'","''")}\\handle.ready' -Value ready;$ok=$p.WaitForExit(5000);@{exited=$ok;code=if($ok){$p.ExitCode}else{259}}|ConvertTo-Json`;
const observer=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',ps],{windowsHide:true});let observed='';observer.stdout.on('data',d=>observed+=d);const observerExit=new Promise(resolve=>observer.once('close',resolve));while(!fs.existsSync(path.join(root,'handle.ready'))){assert(Date.now()<deadline);await new Promise(r=>setTimeout(r,25));}
fs.writeFileSync(release,'complete normally');assert.equal(await exited,0);stopOwned(owned);stopOwned(owned);assert.equal(await observerExit,0);assert.equal(JSON.parse(observed).exited,true);assert(!fs.existsSync(natural));result.parentAlreadyExited={supervisorExit:0,observed:JSON.parse(observed),naturalTimeout:false,lateRepeatedCancellation:'no-op after observed completion'};
const require=createRequire(import.meta.url),yaml=require(require.resolve('js-yaml',{paths:[path.resolve('../controle-financeiro-runtimes/CF-034/11/checkout/controle-financeiro-frontend')]}));const workflow=yaml.load(fs.readFileSync('.github/workflows/ci.yml','utf8'));
assert.deepEqual(workflow.permissions,{contents:'read'});assert.equal(workflow.jobs.expanded.needs,'required');for(const job of Object.values(workflow.jobs)){
  const collect=job.steps.find(s=>s.id==='collect');assert.equal(collect.if,'always()');for(const upload of job.steps.filter(s=>s.uses?.startsWith('actions/upload-artifact'))){if(upload.with.name.includes('diagnosis')){assert.match(upload.if,/steps.collect.outcome == 'success'/);assert.match(upload.with.path,/\/public\/$/);}else{assert.match(upload.with.path,/public\/package-manifest.json/);assert(!upload.if);}}
}
result.workflow={parser:'js-yaml',permissions:workflow.permissions,expandedNeeds:workflow.jobs.expanded.needs,uploadPaths: Object.values(workflow.jobs).flatMap(j=>j.steps.filter(s=>s.uses?.startsWith('actions/upload-artifact')).map(s=>({if:s.if,path:s.with.path}))),limit:'static only; Actions/Linux not executed'};
writeJson(path.join(import.meta.dirname,'supplement.json'),result);console.log('Chunked output, durable fail-closed collection, exited parent and upload policy verified.');
