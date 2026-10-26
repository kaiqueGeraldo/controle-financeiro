import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {snapshot,hash,writeJson} from '../../../.github/scripts/source.mjs';
const root=path.resolve(process.argv[2]);assert(root.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(root));fs.mkdirSync(root);
const read=p=>JSON.parse(fs.readFileSync(p));
const run=args=>{const r=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,maxBuffer:5*1024*1024,env:{...process.env,npm_config_offline:'true',npm_config_cache:path.join(root,'npm-cache')}});return {exit:r.status,stdout:r.stdout,stderr:r.stderr};};
const original=fs.readFileSync('../controle-financeiro-runtimes/CF-034/rv01/sanitization/backend.log','utf8');
const cases=[
 {name:'original',text:original},
 {name:'case-escapes-multiple',text:'prefix {"Pass\\u0077ord" : "SENTINEL_ESCAPE\\\" extra", "password":"SENTINEL_SECOND"}\nAUTHORIZATION = bEaReR SENTINEL_AUTH\nCookie: sid=SENTINEL_ONE; other=SENTINEL_TWO\n  SENTINEL_FOLDED\ndiagnostic=keep\n'},
 {name:'nested-structured',file:'result.json',text:JSON.stringify({status:'failed',count:3,diagnostic:'keep',details:[{password:{deep:'SENTINEL_OBJECT'}}],message:JSON.stringify({password:'SENTINEL_MESSAGE'})})},
 {name:'nested-message-in-log',text:'INFO '+JSON.stringify({status:'failed',count:3,diagnostic:'keep',message:JSON.stringify({password:'SENTINEL_NESTED_MESSAGE'})})+'\n'},
 {name:'unterminated-text-quote',text:"password='prefix SENTINEL_UNCLOSED\ndiagnostic=keep\n",mustReject:true},
 {name:'unterminated-json-log',text:'prefix {"password":"SENTINEL_BROKEN\ncontinuation',mustReject:true},
 {name:'invalid-json-file',file:'result.json',text:'{"password":"SENTINEL_BROKEN',mustReject:true},
 {name:'harmless-malformed',text:'unclosed { diagnostic=keep\nstatus=failed\ncount=3\n'},
];
const results=[];
for(const c of cases){
 const out=path.join(root,c.name);fs.mkdirSync(out);const file=c.file??'backend.log';fs.writeFileSync(path.join(out,file),c.text);if(file!=='result.json')writeJson(path.join(out,'result.json'),{status:'failed',diagnostic:'keep',count:3});
 for(const f of ['.env','auth-state.json','TEST-properties.xml','dump.sql'])fs.writeFileSync(path.join(out,f),'SENTINEL_FORBIDDEN');
 const command=run(['.github/scripts/publish-evidence.mjs',out]),publicPath=path.join(out,'public',file),exists=fs.existsSync(publicPath),text=exists?fs.readFileSync(publicPath,'utf8'):null;
 const r={name:c.name,command,rawSha256:hash(c.text),publicExists:fs.existsSync(path.join(out,'public')),output:text,residualSentinel:text?/SENTINEL|eyJTEST/.test(text):false,expectedReject:!!c.mustReject};
 assert.equal(hash(fs.readFileSync(path.join(out,file))),r.rawSha256);assert(!/SENTINEL/.test(command.stdout+command.stderr));
 if(exists){
  const manifest=read(path.join(out,'public/collection.json')),entry=manifest.files.find(f=>f.input===file);assert.equal(entry.rawLocalSha256,r.rawSha256);assert.equal(entry.sanitizedSha256,hash(text));
  assert(!fs.existsSync(path.join(out,'public/.env')));const second=path.join(root,c.name+'-second');fs.mkdirSync(second);fs.writeFileSync(path.join(second,file),text);const repeated=run(['.github/scripts/publish-evidence.mjs',second]);assert.equal(repeated.exit,0);r.idempotent=fs.readFileSync(path.join(second,'public',file),'utf8')===text;
  const before=hash(fs.readFileSync(publicPath));fs.writeFileSync(path.join(out,file),'{"password":"SENTINEL_REUSE_BROKEN');const reuse=run(['.github/scripts/publish-evidence.mjs',out]);assert.equal(reuse.exit,1);assert.equal(hash(fs.readFileSync(publicPath)),before);r.reuse={exit:reuse.exit,oldPublicUnchanged:true,notEligibleForWorkflowUpload:true};
 }
 r.contractSatisfied=c.mustReject?command.exit!==0&&!r.publicExists:command.exit===0&&!r.residualSentinel&&text.includes('keep');results.push(r);
}
// Real runner output, including fragmented stdout: original sentinels + encoded message.
const fixture=path.join(root,'fixture'),front=path.join(fixture,'controle-financeiro-frontend');fs.mkdirSync(front,{recursive:true});
writeJson(path.join(front,'package.json'),{name:'review-output',version:'1.0.0',scripts:{lint:'node emit.mjs'}});writeJson(path.join(front,'package-lock.json'),{name:'review-output',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'review-output',version:'1.0.0'}}});
const payload=original+cases.find(c=>c.name==='nested-message-in-log').text;
fs.writeFileSync(path.join(front,'emit.mjs'),`const s=${JSON.stringify(payload)};process.stdout.write(s.slice(0,17));setImmediate(()=>{process.stdout.write(s.slice(17));process.exitCode=23;});`);
snapshot(fixture,{commit:'independent-synthetic-output',originalTreeChanges:[]});const output=path.join(root,'runner-output');const gate=run(['.github/scripts/ci.mjs','all',fixture,output]);assert.equal(gate.exit,1);assert(!/SENTINEL/.test(gate.stdout+gate.stderr));assert.equal(read(path.join(output,'result.json')).steps.at(-1).exit,23);
const raw=fs.readFileSync(path.join(output,'lint.log'));const collect=run(['.github/scripts/publish-evidence.mjs',output]);assert.equal(collect.exit,0);const published=fs.readFileSync(path.join(output,'public/lint.log'),'utf8');assert(published.includes('SENTINEL_NESTED_MESSAGE'));assert(!/SENTINEL_JSON|SENTINEL_BEARER|SENTINEL_COOKIE/.test(published));assert.equal(hash(fs.readFileSync(path.join(output,'lint.log'))),hash(raw));
const contract=path.join(root,'no-secret-contract.mjs');fs.writeFileSync(contract,`import fs from 'node:fs';import assert from 'node:assert/strict';const text=fs.readFileSync(${JSON.stringify(path.join(output,'public/lint.log'))},'utf8');assert(!text.includes('SENTINEL_NESTED_MESSAGE'),'public log must not retain password in a nested JSON message');`);const red=run([contract]);assert.equal(red.exit,1);assert.match(red.stderr,/public log must not retain password/);
// Same input through the durable path, relocated only to protect historical outputs.
const durable=path.join(root,'durable');fs.mkdirSync(durable);const source=fs.readFileSync('tasks/evidencias/CF-034/collect.mjs','utf8');const moved=source.replaceAll(/(['"])\.\.\/\.\.\/\.\.\/(\.github\/scripts\/[^'"]+)\1/g,(_,q,f)=>q+pathToFileURL(path.resolve(f)).href+q);const collector=path.join(durable,'collect.mjs');fs.writeFileSync(collector,moved);
const durableRun=run([collector,output,'runner']);assert.equal(durableRun.exit,0);const durableText=fs.readFileSync(path.join(durable,'runs/runner/lint.log'),'utf8');assert(durableText.includes('SENTINEL_NESTED_MESSAGE'));
const result={at:new Date().toISOString(),runtime:root,cases:results,runner:{gate,collector:collect,rawSha256:hash(raw),sanitizedSha256:hash(published),consoleProtected:true,originalThreeFormatsRemoved:true,nestedMessageResidual:true,redContract:red},durable:{command:durableRun,residual:true,originalScriptSha256:hash(source),relocatedScriptSha256:hash(moved)},limit:'synthetic secrets only; no remote upload or general secret scan'};
writeJson(path.join(import.meta.dirname,'sanitization.json'),result);console.log('Real runner/public/durable paths examined; nested JSON message residual and malformed-quote residual preserved.');
