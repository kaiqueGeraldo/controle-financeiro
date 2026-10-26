import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {snapshot,hash,writeJson} from '../../../.github/scripts/source.mjs';
const root=path.resolve(process.argv[2]);assert(root.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true});
const here=import.meta.dirname,read=p=>JSON.parse(fs.readFileSync(p));
const run=args=>{const r=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,maxBuffer:10*1024*1024,env:{...process.env,npm_config_offline:'true',npm_config_cache:path.join(root,'npm-cache')}});return {exit:r.status,stdout:r.stdout,stderr:r.stderr};};
const result={at:new Date().toISOString(),root,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,steps:[]};
function record(name,data){result.steps.push({name,...data});writeJson(path.join(here,'proofs.json'),result);}
const originalFile='tasks/evidencias/revalidacao-CF-034-saneamento/sanitization.mjs',original=fs.readFileSync(originalFile,'utf8');
assert.equal(hash(original),read(path.join(here,'baseline-inputs.json')).originalProbe.sha256);
const prefix=original.slice(0,original.indexOf('// Real runner output'));
const scripts=path.join(root,'scripts');fs.cpSync('.github/scripts',scripts,{recursive:true});
function runCases(label,expected){
  const output=path.join(root,label),adapter=path.join(root,label+'.mjs');
  const text=prefix.replace("'../../../.github/scripts/source.mjs'",JSON.stringify(pathToFileURL(path.resolve('.github/scripts/source.mjs')).href)).replaceAll("'.github/scripts/publish-evidence.mjs'",JSON.stringify(path.join(scripts,'publish-evidence.mjs')))+`writeJson(path.join(root,'case-results.json'),results);`;
  fs.writeFileSync(adapter,text);const command=run([adapter,output]);assert.equal(command.exit,0,command.stderr);
  const cases=read(path.join(output,'case-results.json')),bad=cases.filter(c=>!c.contractSatisfied).map(c=>c.name);
  assert.deepEqual(bad,expected);
  // Same original first-loop inputs/conditions/assertions. Only imports, paths
  // and the destination for results are bound to this fresh execution.
  record(label,{command,originalProbeSha256:hash(original),originalLoopSha256:hash(prefix),adapterSha256:hash(text),cases});return {output,cases};
}
const after=runCases('original-cases-after',[]);

// Re-execute the original negative-secret assertion with ONLY its input path
// relocated. Original source remains untouched and every assertion byte matches.
const originalContract=path.resolve('../controle-financeiro-runtimes/CF-034/r101/probe/no-secret-contract.mjs');
const contractText=fs.readFileSync(originalContract,'utf8');
const oldInput=path.resolve('../controle-financeiro-runtimes/CF-034/r101/probe/runner-output/public/lint.log');
function contract(label,input){
  assert(contractText.includes(JSON.stringify(oldInput)));const text=contractText.replace(JSON.stringify(oldInput),JSON.stringify(input));
  assert.equal(text.slice(text.indexOf('assert(!')),contractText.slice(contractText.indexOf('assert(!')));
  const file=path.join(root,label+'-contract.mjs');fs.writeFileSync(file,text);const command=run([file]);return {command,originalSha256:hash(contractText),relocatedSha256:hash(text),assertionUnchanged:true};
}

// Real stdout -> private runner log -> both real collectors. Uses the exact
// original emitter/package inputs; no bank/browser or financial operation.
const oldFront=path.resolve('../controle-financeiro-runtimes/CF-034/r101/probe/fixture/controle-financeiro-frontend');
for(const mode of ['nested','quote']){
  const fixture=path.join(root,'runner-'+mode),front=path.join(fixture,'controle-financeiro-frontend');fs.mkdirSync(front,{recursive:true});
  for(const file of ['package.json','package-lock.json','emit.mjs'])fs.copyFileSync(path.join(oldFront,file),path.join(front,file));
  if(mode==='quote')fs.writeFileSync(path.join(front,'emit.mjs'),`process.stdout.write("password='prefix SENTINEL_UNCLOSED\\ndiagnostic=keep\\n");process.exitCode=23;`);
  snapshot(fixture,{commit:'synthetic-residual-output',originalTreeChanges:[]});const output=path.join(root,'output-'+mode);
  const gate=run([path.join(scripts,'ci.mjs'),'all',fixture,output]);assert.equal(gate.exit,1);assert(!/SENTINEL/.test(gate.stdout+gate.stderr));assert.equal(read(path.join(output,'result.json')).steps.at(-1).exit,23);assert(!read(path.join(output,'result.json')).steps.some(s=>['build','backend','e2e'].includes(s.name)));
  const raw=fs.readFileSync(path.join(output,'lint.log'));assert(raw.includes('SENTINEL'));const collected=run([path.join(scripts,'publish-evidence.mjs'),output]);assert.equal(collected.exit,mode==='nested'?0:1);
  const durable=path.join(root,'durable-'+mode);fs.mkdirSync(durable);const durableSource=fs.readFileSync('tasks/evidencias/CF-034/collect.mjs','utf8');
  const moved=durableSource.replaceAll(/(['"])\.\.\/\.\.\/\.\.\/(\.github\/scripts\/[^'"]+)\1/g,(_,q,f)=>q+pathToFileURL(path.join(scripts,path.basename(f))).href+q);const collector=path.join(durable,'collect.mjs');fs.writeFileSync(collector,moved);
  const durableRun=run([collector,output,'runner']);assert.equal(durableRun.exit,mode==='nested'?0:1);assert(!/SENTINEL/.test(collected.stdout+collected.stderr+durableRun.stdout+durableRun.stderr));
  const data={gate,collector:collected,durable:durableRun,rawSha256:hash(raw),brutePreserved:hash(fs.readFileSync(path.join(output,'lint.log')))===hash(raw),consoleProtected:true};assert(data.brutePreserved);
  if(mode==='nested'){
    assert.equal(hash(raw),read(path.join(here,'before.json')).runner.rawSha256);
    const pub=fs.readFileSync(path.join(output,'public/lint.log'),'utf8'),dur=fs.readFileSync(path.join(durable,'runs/runner/lint.log'),'utf8');assert(!/SENTINEL|eyJTEST/.test(pub+dur));assert(pub.includes('diagnostic=keep'));
    const proof=contract('original-after',path.join(output,'public/lint.log'));assert.equal(proof.command.exit,0);Object.assign(data,{sanitizedSha256:hash(pub),durableSha256:hash(dur),originalContract:proof,publicSet:fs.readdirSync(path.join(output,'public')),manifest:read(path.join(output,'public/collection.json'))});
  }else{assert(!fs.existsSync(path.join(output,'public')));assert(!fs.existsSync(path.join(durable,'runs/runner')));}
  record('real-'+mode+'-collection',data);
}

// Mutation replaces only the sanitizer with the pre-R1 implementation. The
// detector uses real collectors and independent assertions, no new export API.
const sanitizer=path.join(scripts,'sanitize.mjs'),fixed=fs.readFileSync(sanitizer),beforeHash=hash(fixed),previous=execFileSync('git',['show','418a648:.github/scripts/sanitize.mjs']);
try{
  fs.writeFileSync(sanitizer,previous);const mutant=runCases('mutant',['nested-message-in-log','unterminated-text-quote']);
  for(const name of ['nested-message-in-log','unterminated-text-quote']){const c=mutant.cases.find(c=>c.name===name);assert.equal(c.command.exit,0);assert.equal(c.residualSentinel,true);}
  const red=contract('mutant',path.join(mutant.output,'nested-message-in-log/public/backend.log'));assert.equal(red.command.exit,1);assert.match(red.command.stderr,/public log must not retain password/);record('mutation-contract',{...red,mutantSha256:hash(previous),fixedSha256:beforeHash});
}finally{fs.writeFileSync(sanitizer,fixed);assert.equal(hash(fs.readFileSync(sanitizer)),beforeHash);}
runCases('restored',[]);record('restoration',{before:beforeHash,after:hash(fs.readFileSync(sanitizer)),equal:true});

// Original ordinary failure/missing-report assertions, without cancellation tests.
const review=fs.readFileSync('tasks/evidencias/revisao-CF-034/review.mjs','utf8');
const loop=review.slice(review.indexOf(" for(const mode of ['child-failure','missing-report'])"),review.indexOf(" write(path.join(here,'probes.json')"));
const imports=`import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {snapshot} from ${JSON.stringify(pathToFileURL(path.resolve('.github/scripts/source.mjs')).href)};const runtime=${JSON.stringify(root)},repo=${JSON.stringify(process.cwd())},result={};const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\\n');const read=p=>JSON.parse(fs.readFileSync(p));const run=(args,cwd,env)=>{args[0]=${JSON.stringify(path.join(scripts,'ci.mjs'))};const r=spawnSync(process.execPath,args,{cwd,env,encoding:'utf8',windowsHide:true});return {exit:r.status,stdout:r.stdout,stderr:r.stderr};};`;
const regressions=path.join(root,'regressions.mjs');fs.writeFileSync(regressions,imports+loop+`write(${JSON.stringify(path.join(root,'regressions.json'))},result);`);const regressionRun=run([regressions]);assert.equal(regressionRun.exit,0,regressionRun.stderr);record('ordinary-regressions',{command:regressionRun,sourceSha256:hash(review),cases:read(path.join(root,'regressions.json'))});
const historical=path.resolve('../controle-financeiro-runtimes/CF-034/11/checkout'),source=read(path.join(historical,'.ci-source.json')),copy=path.join(root,'package-copy');
for(const f of source.files){const dest=path.join(copy,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(historical,f.path),dest);}
for(const name of ['source','frontend','backend','e2e'])fs.copyFileSync(path.join(historical,'.ci-'+name+'.json'),path.join(copy,'.ci-'+name+'.json'));
const jar=path.join(copy,'controle-financeiro-backend/target/api-0.0.1.jar');fs.mkdirSync(path.dirname(jar),{recursive:true});const bytes=fs.readFileSync(path.resolve('../controle-financeiro-runtimes/CF-034/11/evidence-01/api-0.0.1.jar')),changed=Buffer.from(bytes);changed[changed.length-1]^=1;fs.writeFileSync(jar,changed);
try{const output=path.join(root,'jar-tamper'),command=run([path.join(scripts,'ci.mjs'),'package',copy,output]);assert.equal(command.exit,1);const report=read(path.join(output,'result.json'));assert.match(report.error,/Package changed/);assert(!report.artifact);record('jar-tamper',{command,report,originalSha256:hash(bytes),mutantSha256:hash(changed),meaning:'copy of historical a5ad7a6 JAR, no new build'});}
finally{fs.writeFileSync(jar,bytes);assert.equal(hash(fs.readFileSync(jar)),hash(bytes));record('jar-restored',{sha256:hash(fs.readFileSync(jar))});}
console.log('Original residual contracts, both collectors, causal mutation/restoration and ordinary regressions completed.');
