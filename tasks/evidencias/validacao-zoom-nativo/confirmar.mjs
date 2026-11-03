import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// Human-provided evidence only. This does not inspect the native UI or approve a criterion.
const [runtimeArg,label,scenario,baselineArg,zoomArg,metadataArg,confirmation]=process.argv.slice(2);
assert.equal(confirmation,'--indicador-nativo-observado-200');
assert.ok(runtimeArg && baselineArg && zoomArg && metadataArg);
assert.match(label??'',/^[a-z0-9-]+$/);
assert.ok(['cf015','rf15'].includes(scenario));
const runtime=path.resolve(runtimeArg);
assert.match(path.basename(runtime),/^zoom-nativo-[a-z0-9-]+$/);
assert.equal(path.basename(path.dirname(runtime)),'preparacao-adocao');
const invocation=path.join(runtime,label);
assert.ok(!fs.existsSync(path.join(invocation,'execution.json')),'Invocation already ended; no late signal');
const candidate=JSON.parse(fs.readFileSync(path.join(invocation,'candidate.json')));
assert.ok(candidate.scenario==='both'||candidate.scenario===scenario);
const spec=scenario==='cf015'?'cf015.native-zoom.integrated.spec.ts':'rf15-native-chrome.integrated.spec.ts';
const log=fs.readFileSync(path.join(invocation,'browsers/Rf15RemediationBrowserTest/playwright.log'),'utf8');
assert.ok(!log.split('\n').some(line=>/^\s+\d+\) \[review-sao-paulo\]/.test(line)&&line.includes(spec)),'Scenario already ended; no late signal');
const directory=path.join(invocation,'browsers/Rf15RemediationBrowserTest/visual',scenario==='cf015'?'native-zoom-cf015':'native-zoom-rf15-chrome');
const ready=JSON.parse(fs.readFileSync(path.join(directory,'ready.json')));
const metadata=JSON.parse(fs.readFileSync(path.resolve(metadataArg),'utf8'));
assert.equal(metadata.source,'human');
assert.equal(metadata.nativeIndicatorObserved,true);
assert.equal(metadata.initialZoom,100);
assert.equal(metadata.pageZoom,200);
assert.equal(metadata.url,'http://127.0.0.1:3107/cartoes');
assert.equal(metadata.windowTitle,scenario==='cf015'?'CF015 ZOOM NATIVO - ajustar 200%':'RF15 ZOOM NATIVO CHROME - ajustar 200%');
assert.equal(metadata.browserVersion,ready.browser);
assert.equal(metadata.candidate,candidate.candidate);
for(const key of ['operator','operatingSystem','displayResolution','systemScale']) assert.ok(typeof metadata[key]==='string'&&metadata[key].trim(),key+' required');
assert.ok(!fs.existsSync(path.join(directory,'native-confirmed.txt')));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const captures=[];
for(const [file,name] of [[baselineArg,'browser-native-100.png'],[zoomArg,'browser-native-200.png']]) {
  const bytes=fs.readFileSync(path.resolve(file));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG screenshot required');
  fs.writeFileSync(path.join(directory,name),bytes,{flag:'wx'});
  captures.push({file:name,sha256:hash(bytes)});
}
fs.writeFileSync(path.join(directory,'human-observation.json'),JSON.stringify({at:new Date(),...metadata,scenario,ready,captures,limit:'Human declaration and supplied captures; content and native percentage still require evidence review. Not automated UI observation.'},null,2)+'\n',{flag:'wx'});
// Continuation signal required by the unchanged original spec; not an acceptance artifact.
fs.writeFileSync(path.join(directory,'native-confirmed.txt'),'200%',{flag:'wx'});
console.log('Registro humano recebido. O spec original prossegue; o resultado e as imagens ainda exigem avaliação.');
