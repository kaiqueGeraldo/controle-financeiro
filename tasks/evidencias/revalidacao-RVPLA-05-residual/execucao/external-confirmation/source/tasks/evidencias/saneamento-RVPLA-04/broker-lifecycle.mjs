import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{spawn,spawnSync,execFileSync}from'node:child_process';import{createInterface}from'node:readline';
import{superviseCounterproof,verifyOwnedBoundary,runOwnedCommand}from'../preparacao-local-adocao/counterproof-supervision.mjs';import{ProofStore,hash}from'../preparacao-local-adocao/counterproof-checkpoint.mjs';
const root=path.resolve(process.argv[2]),mode=process.argv[3];assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-rvpla05-residual-')));
const ps=path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe');
async function barrier(f){const end=Date.now()+20000;while(!fs.existsSync(f)){if(Date.now()>end)throw Error('Missing barrier '+f);await new Promise(r=>setTimeout(r,25));}return fs.readFileSync(f,'utf8');}
function syncWait(f){const end=Date.now()+20000;while(!fs.existsSync(f)){if(Date.now()>end)throw Error('Missing worker barrier '+f);Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}}
if(mode==='worker'){
 const resume=process.argv[4]==='resume';await superviseCounterproof(root);const source=path.join(root,'source');if(!fs.existsSync(source)){fs.mkdirSync(source);fs.writeFileSync(source+'/input','original');}
 const store=new ProofStore({directory:root+'/proofs',sourceRoot:source,evidenceRoot:root,identity:{candidate:'3a6e95be68678e394cd718d9d688fab1fdc428ce',observer:'rvpla04-broker-lifecycle-v1'},inputs:[{file:'input',sha256:hash('original')}],verifyEnvironment:()=>verifyOwnedBoundary(root)});
 let error;try{store.run({name:'command',edits:[['input',()=> 'mutant']]},folder=>{const log=folder+'/effect.log';const c=resume?runOwnedCommand(root,process.execPath,['--version']):runOwnedCommand(root,root+'/Tree.exe',[root,'parent']);if(c.status!==0)throw Error('Command returned '+c.status);fs.writeFileSync(log,'CAUSAL_SYNTHETIC_EFFECT');return {status:1,log};},r=>({causal:true,assertionDetected:true,files:[r.log]}));}catch(e){error={message:e.message,kind:e.kind};}
 const dirs=fs.readdirSync(root+'/proofs/command').sort(),checkpoint=JSON.parse(fs.readFileSync(root+'/proofs/command/'+dirs.at(-1)+'/checkpoint.json'));fs.writeFileSync(root+(resume?'/resume-decision.json':'/decision.json'),JSON.stringify({error,state:checkpoint.state,input:fs.readFileSync(source+'/input','utf8'),attempts:dirs.length,at:checkpoint.at},null,2));if(!resume)syncWait(root+'/finish-worker');
}else{
 fs.mkdirSync(root);const compile=spawnSync(ps,['-NoProfile','-NonInteractive','-Command',`Add-Type -Path '${path.join(import.meta.dirname,'Tree.cs')}' -OutputAssembly '${root}/Tree.exe' -OutputType WindowsApplication`],{encoding:'utf8',windowsHide:true});fs.writeFileSync(root+'/compile.log',compile.stdout+compile.stderr);assert.equal(compile.status,0);
 const results=[];
 function setup(name){const d=path.join(root,name);fs.mkdirSync(d);fs.copyFileSync(root+'/Tree.exe',d+'/Tree.exe');return d;}
 function start(d,phase='first'){const fd=fs.openSync(d+'/'+phase+'.log','wx'),c=spawn(process.execPath,[import.meta.filename,d,'worker',...(phase.startsWith('resume')?['resume']:[])],{env:process.env,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);c.done=new Promise((r,j)=>{c.once('error',j);c.once('close',r);});return c;}
 function query(c){return JSON.parse(execFileSync(ps,['-NoProfile','-NonInteractive','-File',path.resolve('.github/scripts/owned-job-probe.ps1'),'-Configuration',Buffer.from(JSON.stringify(c)).toString('base64')],{windowsHide:true,encoding:'utf8'}));}
 function stop(i){execFileSync(ps,['-NoProfile','-NonInteractive','-File',path.resolve('tasks/evidencias/saneamento-RVPLA-03/stop-own.ps1'),'-OwnedPid',String(i.pid),'-ExpectedTicks',i.ticks],{windowsHide:true});}
 const identity=pid=>query({mode:'identity',pid});
 const readIdentity=async(d,role)=>{const a=(await barrier(d+'/'+role+'.identity')).split('|');return {pid:Number(a[0]),ticks:a[1],label:role,member:true};};
 function receipts(d,prefix){return fs.readdirSync(d+'/.owned-runs').filter(n=>n.startsWith(prefix)).map(n=>JSON.parse(Buffer.from(JSON.parse(fs.readFileSync(d+'/.owned-runs/'+n)).payload,'base64')));}
 async function watch(d,ids,jobName,hold){const file=d+'/watch.json';fs.writeFileSync(file,JSON.stringify({processes:ids,jobName,holdJob:hold}));const p=spawn(ps,['-NoProfile','-NonInteractive','-File',path.resolve('tasks/evidencias/revalidacao-RVPLA-03/observar-handles.ps1'),'-Configuration',file],{windowsHide:true,stdio:['pipe','pipe','inherit']});const done=new Promise(r=>p.once('close',r)),it=createInterface({input:p.stdout})[Symbol.asyncIterator]();async function reply(){const r=await it.next();assert.equal(r.done,false);return JSON.parse(r.value);}const ready=await reply();return{ready,async command(c){p.stdin.write(c+'\n');return reply();},async close(){p.stdin.end();assert.equal(await done,0);}};}
 for(const scenario of mode==='before-child'?['owner-before-child']:['retained-command-job']){
  const d=setup(scenario);let a,b,w,foreign,other;let outsider,otherIdentity;
  try{
   a=start(d);const parent=await readIdentity(d,'parent'),tree=[parent];
   if(scenario!=='owner-before-child'){fs.writeFileSync(d+'/release-parent','allow handoff');tree.push(await readIdentity(d,'child'),await readIdentity(d,'grandchild'));}
   if(scenario==='normal'){
    const alien=setup('unrelated-same-name');foreign=spawn(alien+'/Tree.exe',[alien,'foreign'],{windowsHide:true,stdio:'ignore'});foreign.done=new Promise(r=>foreign.once('close',r));outsider=await readIdentity(alien,'foreign');outsider.member=false;outsider.label='same-name-outsider';
    const legit=setup('other-legitimate');other=start(legit);otherIdentity=await readIdentity(legit,'parent');otherIdentity.member=false;otherIdentity.label='other-legitimate';
   }
   const command=receipts(d,'command-')[0],run=receipts(d,'run-')[0],guardian=JSON.parse(fs.readFileSync(d+'/.owned-runs/guardian-'+run.runId+'.json'));
   w=await watch(d,[...tree,...(outsider?[outsider,otherIdentity]:[])],command.jobName,scenario==='retained-command-job');
   if(scenario==='owner-interruption'||scenario==='owner-before-child'||scenario==='guardian-interruption'){
    stop(identity(scenario==='owner-interruption'?a.pid:guardian.pid));assert.notEqual(await a.done,0);a=null;
    const ended=await w.command('wait');assert.ok(ended.states.every(s=>s.signaled));assert.equal(query({mode:'closed',jobName:command.jobName}).absent,true);assert.equal(fs.readFileSync(d+'/source/input','utf8'),'mutant');
   }else{
    if(scenario==='retained-command-job')fs.writeFileSync(d+'/finish-tree','end known children while retaining job object');
    fs.writeFileSync(d+'/release-parent-exit','wrapper may exit now');const decision=JSON.parse(await barrier(d+'/decision.json'));
    if(scenario==='normal'){
     assert.equal(decision.state,'complete');assert.equal(decision.input,'original');const closed=JSON.parse(fs.readFileSync(d+'/.owned-runs/closed-'+command.runId+'.json'));assert.ok(closed.at<=decision.at);
     const state=await w.command('wait');for(const label of ['parent','child','grandchild'])assert.equal(state.states.find(s=>s.label===label).signaled,true);for(const label of ['same-name-outsider','other-legitimate'])assert.equal(state.states.find(s=>s.label===label).signaled,false);
     fs.writeFileSync(path.join(root,'unrelated-same-name/finish-tree'),'finish own foreign fixture');await foreign.done;foreign=null;
     fs.writeFileSync(path.join(root,'other-legitimate/release-parent'),'handoff');await barrier(path.join(root,'other-legitimate/grandchild.identity'));fs.writeFileSync(path.join(root,'other-legitimate/release-parent-exit'),'finish');await barrier(path.join(root,'other-legitimate/decision.json'));fs.writeFileSync(path.join(root,'other-legitimate/finish-worker'),'finish');assert.equal(await other.done,0);other=null;
    }else{assert.equal(decision.state,'restoration-pending');assert.equal(decision.input,'mutant');assert.equal((await w.command('job')).retained,true);}
    fs.writeFileSync(d+'/finish-worker','decision externally observed');const code=await a.done;a=null;
    if(scenario==='normal')assert.equal(code,0);else{
     assert.notEqual(code,0);b=start(d,'resume-blocked');assert.notEqual(await b.done,0);b=null;assert.equal(fs.readFileSync(d+'/source/input','utf8'),'mutant');assert.equal(fs.readdirSync(d+'/proofs/command').length,1);assert.match(fs.readFileSync(d+'/resume-blocked.log','utf8').replace(/\s+/g,' '),/Previous owned job not closed/);await w.command('release');
    }
   }
   if(scenario!=='normal'){fs.copyFileSync(d+'/proofs/command/0001/checkpoint.json',d+'/checkpoint-before-resume.json');b=start(d,'resume');assert.equal(await b.done,0);b=null;const r=JSON.parse(await barrier(d+'/resume-decision.json'));assert.equal(r.state,'complete');assert.equal(r.input,'original');assert.equal(r.attempts,2);}
   if(scenario==='owner-before-child'){fs.writeFileSync(d+'/release-parent','release old wrapper after resume');assert.equal(fs.existsSync(d+'/child.identity'),false);}
   results.push({scenario,passed:true,commandJob:command.jobName,rootJob:run.jobName,identities:w.ready,foreignAndOtherPreserved:scenario==='normal',oldWrapperCannotCreateAfterResume:scenario==='owner-before-child'});
  }finally{if(w)await w.close();for(const c of[a,b,other])if(c&&c.exitCode===null&&c.signalCode===null){stop(identity(c.pid));await c.done;}if(foreign){fs.writeFileSync(path.join(root,'unrelated-same-name/finish-tree'),'finish own fixture');await foreign.done;}}
  fs.writeFileSync(root+'/results.json',JSON.stringify(results,null,2)+'\n');
 }
 console.log(JSON.stringify({cases:results.length,passed:true}));
}
