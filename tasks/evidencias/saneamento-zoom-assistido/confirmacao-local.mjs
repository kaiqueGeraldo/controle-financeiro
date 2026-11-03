import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createInterface} from 'node:readline/promises';
import {readPause,confirmationFor,submitConfirmation,cancelPause} from './protocolo.mjs';

const [mode,directoryArg]=process.argv.slice(2);
assert.ok(['confirm','cancel','check'].includes(mode));
assert.ok(directoryArg);
const dir=path.resolve(directoryArg);
assert.match(dir.replaceAll('\\','/'),/\/controle-financeiro-runtimes\/preparacao-adocao\/zoom-assistido-[a-z0-9-]+\//);
const state=readPause(dir);
if(mode==='check') {
  console.log(JSON.stringify({status:state.status,execution:state.execution,scenario:state.scenario,
    title:state.title,url:state.url,candidate:state.candidate,synthetic:state.synthetic,signalWritten:false}));
  process.exit(0);
}
assert.ok(process.stdin.isTTY,'Human terminal required; piped declarations refused');
assert.equal(state.synthetic,false,'Synthetic pauses cannot collect real declarations');
function assertOwnerActive() {
  assert.ok(Number.isInteger(state.ownerPid)&&state.ownerPid>0);
  process.kill(state.ownerPid,0); // Liveness check only; no signal is sent.
  assert.ok(!fs.existsSync(path.resolve(dir,'../../../../../execution.json')),'Invocation already ended');
}
assertOwnerActive();
assert.equal(state.status,'waiting');
assert.ok(Date.now()<state.expiresAt,'Preparation lease expired; no late confirmation');
const terminal=createInterface({input:process.stdin,output:process.stdout});
const controller=new AbortController();
const watcher=fs.watch(dir,()=>{
  if(readPause(dir).status!=='waiting')controller.abort(new Error('Pause ended; terminal confirmation cancelled'));
});
const timer=setTimeout(()=>controller.abort(new Error('Resource lease expired; no late declaration')),Math.max(1,state.expiresAt-Date.now()));
try {
  console.log('Execução: '+state.execution+'; cenário: '+state.scenario+'; candidato: '+state.candidate);
  console.log('Janela: '+state.title+'\nURL: '+state.url+'\nCartão sintético para zoom, final 4242.');
  if(mode==='cancel') {
    const answer=await terminal.question('Digite CANCELAR para encerrar incompleto: ',{signal:controller.signal});
    assert.equal(answer,'CANCELAR');cancelPause(dir,'Explicit human cancellation');
  } else {
    console.log('Mantenha a janela original. Observe/capture 100% no menu, ajuste 200%, capture o indicador com URL/título e feche o menu.');
    console.log('As imagens podem ser enviadas depois. O sinal é declaração humana; não aprova o teste.');
    const phrase='200% '+state.scenario+' '+state.challenge.slice(0,8);
    const answer=await terminal.question('Somente após observar o indicador nesta janela, digite '+phrase+' e Enter: ',{signal:controller.signal});
    assert.equal(answer,phrase,'No explicit declaration issued');
    assert.equal(readPause(dir).challenge,state.challenge);
    assertOwnerActive();
    submitConfirmation(dir,confirmationFor(state,{operator:'Usuário deste chat; declaração explícita em terminal local'}));
    console.log('Declaração recebida uma vez. Revalidação da sessão e ações originais seguem. Envie as capturas para revisão depois.');
  }
} finally {watcher.close();clearTimeout(timer);terminal.close();}
