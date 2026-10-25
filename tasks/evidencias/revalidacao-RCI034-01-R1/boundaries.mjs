import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {sanitizeText,sanitizeJson} from '../../../.github/scripts/sanitize.mjs';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';
const root=path.resolve(process.argv[2]);assert(root.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(root));fs.mkdirSync(root);
const here=import.meta.dirname,result={runtime:root,node:process.version,cases:[]};
const save=()=>writeJson(path.join(here,'boundaries.json'),result);
const sentinel='R1RV_private_\\"quoted/end',word='R1RV_private_';
// Search raw bytes AND decoded representations; none is a permitted public value.
function leaks(s){return [word,...[JSON.stringify(word),[...word].map(c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')).join('')]].some(v=>s.includes(v))||s.includes('R1RV_OMIT');}
function listing(dir){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?listing(path.join(dir,e.name)): [{path:path.join(dir,e.name),bytes:fs.statSync(path.join(dir,e.name)).size,sha256:hash(fs.readFileSync(path.join(dir,e.name))),leak:leaks(fs.readFileSync(path.join(dir,e.name),'utf8'))}]);}
const run=args=>{const r=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,maxBuffer:1024*1024,timeout:30000});return {exit:r.status,signal:r.signal,error:r.error?.message,stdout:r.stdout,stderr:r.stderr};};
const durableSource=fs.readFileSync('tasks/evidencias/CF-034/collect.mjs','utf8');
const durable=durableSource.replaceAll(/(['"])\.\.\/\.\.\/\.\.\/(\.github\/scripts\/[^'"]+)\1/g,(_,q,f)=>q+pathToFileURL(path.resolve(f)).href+q);
const collector=path.join(root,'collect.mjs');fs.writeFileSync(collector,durable);
result.collector={originalSha256:hash(durableSource),relocatedSha256:hash(durable),changes:'two import URLs only; output directory relocated by import.meta.dirname'};
const body={password:sentinel,PaSsWd:word+'two',Authorization:'Bearer '+word+'opaque+/=',Cookie:'sid='+word+'cookie',diagnostic:'keep',count:7};
const cases=[];
const add=(name,text,{reject=false,file='lint.log',verify=null}={})=>cases.push({name,text,reject,file,verify});
for(const prefix of ['INFO ','[worker:19] ','2026-10-25\t'])add('prefix-'+cases.length,prefix+JSON.stringify({message:JSON.stringify(body),diagnostic:'keep'})+' END',{verify:s=>{assert(s.startsWith(prefix)&&s.endsWith(' END'));const o=JSON.parse(s.slice(prefix.length,-4));assert.equal(o.diagnostic,'keep');const inner=JSON.parse(o.message);assert.equal(inner.password,'[REDACTED]');assert.equal(inner.count,7);}});
add('escaped-key-unicode','prefix '+JSON.stringify(body).replace('password','pass\\u0077ord').replace(word,[...word].map(c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')).join(''))+' tail');
add('multiple-records',JSON.stringify({password:word+'a',note:'keep'})+' trailer\nINFO '+JSON.stringify({message:JSON.stringify(body)})+' tail');
add('headers-folded','Authorization: Bearer '+word+'opaque\r\nCookie: sid='+word+'a; second='+word+'b\r\n\t'+word+'fold\r\ndiagnostic=keep');
add('quotes-slashes',`password="${word}first\\\"tail"; secret='${word}second\\\'tail'\ndiagnostic=keep`);
for(const quote of ['"',"'"])for(const end of ['','\nkeep','\r\nkeep'])add('unclosed-'+cases.length,'Password = '+quote+'value '+word+'unclosed'+end,{reject:true});
add('bad-json','{"diagnostic":"keep","password":"'+word+'bad',{reject:true,file:'result.json'});
add('bad-literal','INFO {"message":"bad\\q'+word+'bad"}',{reject:true});
add('unframed-escaped',String.raw`INFO {\"password\":\"R1RV_private_unframed\"}`,{reject:true});
add('legitimate','INFO '+JSON.stringify({message:'password policy requires rotation',pathname:'C:\\sandbox\\a.txt',diagnostic:'keep',count:7})+' END',{verify:s=>assert.equal(s,'INFO '+JSON.stringify({message:'password policy requires rotation',pathname:'C:\\sandbox\\a.txt',diagnostic:'keep',count:7})+' END')});
add('legitimate-incomplete','parser expected " before end; diagnostic=keep',{verify:s=>assert.equal(s,'parser expected " before end; diagnostic=keep')});
for(const layers of [1,2,3]){let s=JSON.stringify(body);for(let i=0;i<layers;i++)s=JSON.stringify({message:s,diagnostic:'keep'});add('encoding-'+layers,'INFO '+s,{reject:layers>2});}
for(const depth of [64,65]){let s='"keep"';for(let i=0;i<depth;i++)s='{"x":'+s+'}';add('structure-'+depth,s,{file:'result.json',reject:depth>64});}
const N=16*1024*1024,suffix='\npassword='+word+'size\ndiagnostic=keep';
add('size-exact','x'.repeat(N-Buffer.byteLength(suffix))+suffix);
add('size-over','x'.repeat(N+1-Buffer.byteLength(suffix))+suffix,{reject:true});
const tail='\npassword='+word+'utf8\ndiagnostic=keep';
add('size-utf8-over','é'.repeat(Math.floor((N-Buffer.byteLength(tail))/2)+1)+tail,{reject:true});
// Under input bound but pretty-print output above bound must also be rejected.
add('size-output-over',JSON.stringify({message:'x'.repeat(N-24),n:1}),{file:'result.json',reject:true});
for(const c of cases){
 const item={name:c.name,inputBytes:Buffer.byteLength(c.text),rawSha256:hash(c.text),expectedReject:c.reject,file:c.file};result.cases.push(item);save();
 const start=performance.now();let output,error;
 try{output=(c.file.endsWith('.json')?sanitizeJson:sanitizeText)(c.text);}catch(e){error={name:e.name,message:e.message};}
 item.direct={elapsedMs:performance.now()-start,error,outputBytes:output===undefined?null:Buffer.byteLength(output),leak:output===undefined?false:leaks(output)};save();
 if(c.reject){assert(error,'must reject '+c.name);assert(!leaks(error.message));}
 else{assert(!error,JSON.stringify(error));assert(!item.direct.leak,c.name);assert(output.includes('keep'));c.verify?.(output);assert.equal((c.file.endsWith('.json')?sanitizeJson:sanitizeText)(output),output);item.idempotent=true;}
 const runtime=path.join(root,c.name);fs.mkdirSync(runtime);fs.writeFileSync(path.join(runtime,c.file),c.text);
 if(c.file!=='result.json')writeJson(path.join(runtime,'result.json'),{status:'failed',error:'Cookie: '+word+'error',diagnostic:'keep'});
 writeJson(path.join(runtime,'package-manifest.json'),{source:'synthetic-only',message:JSON.stringify({password:word+'manifest',diagnostic:'keep'})});
 for(const f of ['.env','auth-state.json','dump.sql','trace.zip'])fs.writeFileSync(path.join(runtime,f),'R1RV_OMIT');
 const pub=run(['.github/scripts/publish-evidence.mjs',runtime]),dur=run([collector,runtime,c.name]);
 item.commands={public:pub,durable:dur};item.public=listing(path.join(runtime,'public'));item.durable=listing(path.join(root,'runs',c.name));save();
 assert.equal(pub.exit,c.reject?1:0,c.name+': public '+pub.stderr);assert.equal(dur.exit,c.reject?1:0,c.name+': durable '+dur.stderr);
 assert(!leaks(pub.stdout+pub.stderr+dur.stdout+dur.stderr));assert.equal(hash(fs.readFileSync(path.join(runtime,c.file))),item.rawSha256);
 if(c.reject){assert(!fs.existsSync(path.join(runtime,'public')));assert(!fs.existsSync(path.join(root,'runs',c.name)));item.noFinalDestination=true;}
 else{
  assert(item.public.length&&item.durable.length);assert(item.public.every(f=>!f.leak)&&item.durable.every(f=>!f.leak));
  assert.equal(fs.readFileSync(path.join(runtime,'public',c.file),'utf8'),output);
  assert.equal(fs.readFileSync(path.join(root,'runs',c.name,c.file),'utf8'),output);
  // Attempt stale output reuse after changing only this synthetic input to bad data.
  fs.writeFileSync(path.join(runtime,c.file),'password="'+word+'stale');
  const pub2=run(['.github/scripts/publish-evidence.mjs',runtime]),dur2=run([collector,runtime,c.name]);
  assert.equal(pub2.exit,1);assert.equal(dur2.exit,1);assert.deepEqual(listing(path.join(runtime,'public')),item.public);assert.deepEqual(listing(path.join(root,'runs',c.name)),item.durable);
  fs.writeFileSync(path.join(runtime,c.file),c.text);assert.equal(hash(fs.readFileSync(path.join(runtime,c.file))),item.rawSha256);item.reuse={publicExit:1,durableExit:1,oldBytesPreserved:true,inputRestored:true};
 }
 item.contractSatisfied=true;save();
}
// Derived summaries, not just copied logs, cross the same boundary.
const summary=path.join(root,'summaries');fs.mkdirSync(summary);fs.mkdirSync(path.join(summary,'browser'));
writeJson(path.join(summary,'browser/playwright.json'),{stats:{expected:1},suites:[{specs:[{title:'INFO '+JSON.stringify({message:JSON.stringify(body)}),tests:[{projectName:'test',status:'expected',results:[{status:'passed',duration:1}]}]}]}]});
writeJson(path.join(summary,'browser/environment.json'),{database:'password='+word+'db',namespace:'keep'});
const summaryRun=run([collector,summary,'summaries']);assert.equal(summaryRun.exit,0);const summaries=listing(path.join(root,'runs/summaries'));assert(summaries.every(f=>!f.leak));result.summaries={command:summaryRun,files:summaries};save();
console.log('Independent format/boundary/collector contracts complete: '+cases.length+' cases plus derived summaries.');
