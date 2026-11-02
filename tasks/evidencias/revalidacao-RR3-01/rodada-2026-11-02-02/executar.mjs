import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const [mode,arg]=process.argv.slice(2),runtime=path.resolve(arg),dir=import.meta.dirname,root=path.resolve(dir,'../../../..'),prior=path.dirname(dir),out=path.join(runtime,'round-executions');fs.mkdirSync(out,{recursive:true});
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function run(label,script,args,expected,extra={}){
 const file=path.join(out,label+'.log'),fd=fs.openSync(file,'wx'),started=new Date();
 const env={...process.env,...extra};if(!('REVALIDATE_GREP'in extra))delete env.REVALIDATE_GREP;
 const result=spawnSync(process.execPath,[script,...args],{cwd:root,env,stdio:['ignore',fd,fd],windowsHide:true,timeout:20*60*1000});fs.closeSync(fd);
 const receipt={label,script,scriptSha256:sha(script),args,started,ended:new Date(),exit:result.status,expected,error:result.error?.message,logSha256:sha(file)};
 fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
 assert.equal(result.status,expected,label+' unexpected exit; inspect '+file);
}
if(mode==='original'){
 run('prepare-live',path.join(prior,'provas-originais.mjs'),['prepare-live',runtime],0);
 run('candidate-original-static',path.join(prior,'provas-originais.mjs'),['static',runtime,'candidate-original-static'],0);
 run('candidate-live',path.join(prior,'executar.mjs'),['run',runtime,'candidate-live','IndependentRR3LiveProbe','MilestoneRemediationBrowserTest'],0,{REVALIDATE_GREP:'SAN-E2-visual|Independent live reason'});
}else if(mode==='independent'){
 run('independent-static',path.join(prior,'independentes.mjs'),[runtime],1);
 run('independent-complement',path.join(prior,'complementos.mjs'),[runtime],0);
 run('attribution-value',path.join(dir,'atribuicao.mjs'),[runtime],1);
 run('audit-pixels-and-history',path.join(prior,'auditar-evidencias.mjs'),[runtime],0);
 run('checks',path.join(prior,'verificacoes.mjs'),[runtime],0);
}else if(mode==='counter'){
 run('counterproof',path.join(prior,'contraprovar.mjs'),[runtime],0);
}else throw Error('unknown group');
