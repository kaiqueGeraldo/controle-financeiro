import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';

const root = path.resolve(process.argv[2]);
const prefix = path.resolve('../controle-financeiro-runtimes/preparacao-adocao') + path.sep;
assert.ok(root.startsWith(prefix) && path.basename(root).startsWith('startup-hql-'));
const out = 'tasks/evidencias/investigacao-startup-HQL';
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const git = args => execFileSync('git', args, {encoding:'utf8'}).trim();
assert.equal(git(['rev-parse','HEAD']), 'c091abb8aa0473e7ad46690e21c8158a4dde234a');
assert.equal(git(['branch','--show-current']), 'codex/diagnostico-startup-hql');
assert.equal(sha('README.md'), '6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
assert.ok(!fs.existsSync(path.join(root,'checkout')), 'Do not reuse an execution');
const files = git(['ls-files','--','controle-financeiro-backend']).split('\n').filter(Boolean);
const inputs = [];
for (const file of files) {
  assert.ok(!/(^|\/)(target|\.env|\.git)(\/|$)/.test(file));
  const dest = path.join(root,'checkout',file);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(file,dest);
  inputs.push({file,sha256:sha(file),bytes:fs.statSync(file).size});
}
const historical = [
 'tasks/evidencias/preparacao-local-adocao/inputs.json',
 'tasks/evidencias/preparacao-local-adocao/image.json',
 'tasks/evidencias/revisao-preparacao-local-adocao/startups-originais.json',
 'tasks/evidencias/revisao-preparacao-local-adocao/startups-linux-originais.json',
 'tasks/evidencias/revisao-preparacao-local-adocao/preservacao-final.json',
 'tasks/evidencias/saneamento-preparacao-local-adocao/resultados.json',
 'tasks/evidencias/saneamento-preparacao-local-adocao/execucao/saneamento-startup-01/startup-analysis-final.json',
 'tasks/evidencias/revalidacao-TCP-reuso-nativo/runtime-files.json',
 'tasks/evidencias/revalidacao-TCP-reuso-nativo/resultados.json',
 'tasks/evidencias/revalidacao-TCP-reuso-nativo/ENCAMINHAMENTO.md',
 '../controle-financeiro-runtimes/preparacao-adocao/p05/inputs.json',
 '../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar',
 '../controle-financeiro-runtimes/preparacao-adocao/saneamento-startup-01/agent/image.jfr',
 '../controle-financeiro-runtimes/preparacao-adocao/saneamento-startup-01/native.jfr'
].map(file=>({file,sha256:sha(file),bytes:fs.statSync(file).size}));
const save = (name,value) => fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
save('preservacao-inicial.json',{at:new Date().toISOString(),base:git(['rev-parse','HEAD']),readmeSha256:sha('README.md'),historical,inputs});
const tests = path.join(root,'checkout/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration');
const app = path.join(tests,'AdoptionRuntimeTest.java');
const original = fs.readFileSync(app,'utf8');
let adapted = original.replace('final Process process;', 'final Process process;\n        final long creationNanos; final java.time.Instant creationWall;');
adapted = adapted.replace('config.putAll(envOverrides);', `config.putAll(envOverrides);
            String diagnosticOptions = System.getProperty("hql.jvm.options");
            if (diagnosticOptions != null) config.put("JAVA_TOOL_OPTIONS", diagnosticOptions);`);
adapted = adapted.replace('command.add(image);', `if (diagnosticOptions != null) command.addAll(List.of("--volume", System.getProperty("hql.agent.mount") + ":/diagnostic"));
                command.add(image);`);
adapted = adapted.replace('process = builder.start();', 'creationNanos = System.nanoTime(); creationWall = java.time.Instant.now();\n            process = builder.start();');
assert.notEqual(adapted, original);
// Original gate/port discovery/close are untouched, including the accepted TCP path.
assert.equal(adapted.slice(adapted.indexOf('        void awaitStatus(')),original.slice(original.indexOf('        void awaitStatus(')));
fs.writeFileSync(app,adapted);
fs.copyFileSync(path.join(out,'StartupHqlProbeTest.java'),path.join(tests,'StartupHqlProbeTest.java'));
const agent = path.join(root,'agent');
fs.mkdirSync(path.join(agent,'classes'),{recursive:true});
const buddy = path.resolve('C:/Users/Aluga.com/.m2/repository/net/bytebuddy/byte-buddy/1.17.8/byte-buddy-1.17.8.jar');
fs.copyFileSync(buddy,path.join(agent,'byte-buddy.jar'));
const javaHome = path.resolve('controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
const invoke = (binary,args) => { const r=spawnSync(path.join(javaHome,'bin',binary),args,{encoding:'utf8',windowsHide:true}); assert.equal(r.status,0,r.stdout+r.stderr); };
invoke('javac.exe',['-cp',buddy,'-d',path.join(agent,'classes'),'tasks/evidencias/saneamento-preparacao-local-adocao/BootAgent.java']);
fs.writeFileSync(path.join(agent,'manifest.mf'),'Premain-Class: diagnostic.BootAgent\nClass-Path: byte-buddy.jar\n\n');
invoke('jar.exe',['--create','--file',path.join(agent,'boot-agent.jar'),'--manifest',path.join(agent,'manifest.mf'),'-C',path.join(agent,'classes'),'.']);
save('inputs-diagnostico.json',{root,javaHome,backendInputs:inputs.length,adapter:{original:crypto.createHash('sha256').update(original).digest('hex'),adapted:sha(app),scope:'creation timestamp and opt-in external agent/JFR; awaitStatus/discoverBoundPort/close byte-identical'},agent:{source:'tasks/evidencias/saneamento-preparacao-local-adocao/BootAgent.java',sourceSha256:sha('tasks/evidencias/saneamento-preparacao-local-adocao/BootAgent.java'),jarSha256:sha(path.join(agent,'boot-agent.jar')),buddySha256:sha(buddy)}});
console.log(JSON.stringify({root,backendInputs:inputs.length,prepared:true}));
