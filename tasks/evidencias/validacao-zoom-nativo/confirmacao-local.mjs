import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createInterface} from 'node:readline/promises';

// Run by the human operator in a local terminal. No browser control or capture.
// Captures must be reviewed separately; this only supplies the existing signal promptly.
const [mode,runtimeArg,label,scenario]=process.argv.slice(2);
assert.ok(['check','confirm'].includes(mode));
assert.ok(runtimeArg);
assert.match(label??'',/^[a-z0-9-]+$/);
assert.ok(['cf015','rf15'].includes(scenario));
const runtime=path.resolve(runtimeArg);
assert.match(path.basename(runtime),/^zoom-nativo-[a-z0-9-]+$/);
assert.equal(path.basename(path.dirname(runtime)),'preparacao-adocao');
assert.ok(fs.existsSync(path.join(runtime,'prepared.json')));
const invocation=path.join(runtime,label);
const suffix=scenario==='cf015'?'native-zoom-cf015':'native-zoom-rf15-chrome';
const spec=scenario==='cf015'?'cf015.native-zoom.integrated.spec.ts':'rf15-native-chrome.integrated.spec.ts';
const directory=path.join(invocation,'browsers/Rf15RemediationBrowserTest/visual',suffix);
if(mode==='check') {
  console.log(JSON.stringify({validArguments:true,markerWritten:false,browserControlled:false,expectedReady:path.join(directory,'ready.json')}));
  process.exit(0);
}
assert.ok(process.stdin.isTTY,'Human-operated terminal required; piped confirmation is refused');
assert.ok(!fs.existsSync(path.join(invocation,'execution.json')),'Invocation already ended');
const ready=JSON.parse(fs.readFileSync(path.join(directory,'ready.json')));
const candidate=JSON.parse(fs.readFileSync(path.join(invocation,'candidate.json')));
const terminal=createInterface({input:process.stdin,output:process.stdout});
let answer;
try {
  console.log('URL: http://127.0.0.1:3107/cartoes; cenario '+scenario+'; navegador '+ready.browser);
  console.log('Mantenha a janela original. Capture o menu100%, ajuste200%, capture o indicador200% e feche o menu.');
  answer=await terminal.question('SOMENTE depois de observar e capturar200% nessa janela, digite 200% e Enter aqui: ');
} finally {terminal.close();}
assert.equal(answer,'200%','No human confirmation issued');
assert.ok(!fs.existsSync(path.join(invocation,'execution.json')),'Invocation already ended');
const log=fs.readFileSync(path.join(invocation,'browsers/Rf15RemediationBrowserTest/playwright.log'),'utf8');
const failureLines=log.split('\n').filter(line=>/^\s+\d+\) \[review-sao-paulo\]/.test(line));
assert.ok(!failureLines.some(line=>line.includes(spec)),'Scenario already ended; no late signal');
assert.ok(!fs.existsSync(path.join(directory,'native-confirmed.txt')),'Never replace confirmation');
const receipt={at:new Date(),source:'human-local-terminal',operator:'usuario deste chat; digitacao explicita200% em terminal local',scenario,candidate:candidate.candidate,browserVersion:ready.browser,url:'http://127.0.0.1:3107/cartoes',nativeIndicatorObservedByHuman:true,pageZoom:200,capturesDeclaredByHuman:true,capturesReviewedByAgent:false,ready,limit:'Not automated native observation or acceptance. Captures and environment must be associated and reviewed separately.'};
fs.writeFileSync(path.join(directory,'human-local-confirmation.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(path.join(directory,'native-confirmed.txt'),'200%',{flag:'wx'});
console.log('Sinal humano emitido. O teste original segue. Envie as capturas para revisao.');
