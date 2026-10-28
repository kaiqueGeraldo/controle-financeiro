import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawnSync, execFileSync} from 'node:child_process';

const [runtimeArg, name, major, selection = 'PortLifecycleProbeTest'] = process.argv.slice(2);
const runtime = path.resolve(runtimeArg);
assert.ok(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/tcp-nativo-')));
assert.match(name, /^[a-z0-9-]+$/);
assert.ok(['16', '17'].includes(major));
const back = path.join(runtime, 'checkout/controle-financeiro-backend');
const tests = path.join(back, 'src/test/java/com/controlefinanceiro/api/migration');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function copyChanged(source, destination) {
  if (!fs.existsSync(destination) || sha(source) !== sha(destination)) fs.copyFileSync(source, destination);
}
for (const file of ['PortLifecycleProbeTest.java']) {
  const source = path.resolve('tasks/evidencias/revalidacao-preparacao-local-adocao', file);
  copyChanged(source, path.join(tests, file));
  assert.equal(sha(source), sha(path.join(tests, file)));
}
const instrument = name.endsWith('-instrumentado-pg17');
if (instrument) {
  const original = fs.readFileSync(path.join(tests, 'PortLifecycleProbeTest.java'), 'utf8');
  let instrumented = original.replace('class PortLifecycleProbeTest {', 'class PortLifecycleProbeTest {\n static TcpNativeDiagnosticTest.Observer observer;\n static java.util.Map<String,Object> trace;\n static long closeBegin,closeEnd,bindBegin,bindEnd;')
    .replace('var hits=new AtomicInteger();var alien=', 'observer=new TcpNativeDiagnosticTest.Observer();trace=TcpNativeDiagnosticTest.event("original-window");\n  var hits=new AtomicInteger();var alien=')
    .replace('System.out.println("INDEPENDENT_BOUND_LISTENER port="+ownedPort+" pid="+owned.pid()+" container="+container);', 'System.out.println("INDEPENDENT_BOUND_LISTENER port="+ownedPort+" pid="+owned.pid()+" container="+container);\n    trace.put("pid",owned.pid());trace.put("birth",owned.info().startInstant().orElseThrow().toString());trace.put("port",ownedPort);trace.put("before",observer.snapshot(ownedPort));closeBegin=System.nanoTime();')
    .replace('assertThat(owned.isAlive()).isFalse();', 'closeEnd=System.nanoTime();\n   assertThat(owned.isAlive()).isFalse();')
    .replace('replacement.bind(new InetSocketAddress("127.0.0.1",ownedPort));', 'bindBegin=System.nanoTime();replacement.bind(new InetSocketAddress("127.0.0.1",ownedPort));bindEnd=System.nanoTime();')
    .replace('}finally{alien.stop(0);}', '}catch(Exception failure){trace.put("errorType",failure.getClass().getName());trace.put("error",failure.getMessage());throw failure;}finally{trace.put("closeBegin",closeBegin);trace.put("closeEnd",closeEnd);trace.put("bindBegin",bindBegin);trace.put("bindEnd",bindEnd);trace.put("after",observer.snapshot((int)trace.getOrDefault("port",0)));TcpNativeDiagnosticTest.save("original-window-pg17.json",trace);observer.close();alien.stop(0);}')
    // Instrument only the selected lifecycle method; occupied-port source/assertions remain intact.
    .split(' @Test void occupiedExplicitPortDoesNotAcceptUnrelatedReadiness()')[0]
    + original.substring(original.indexOf(' @Test void occupiedExplicitPortDoesNotAcceptUnrelatedReadiness()'));
  if (name.startsWith('corrigido-')) {
    instrumented = instrumented.replace('"original-window-pg17.json"', '"corrigido-window-pg17.json"')
      .replace('assertThat(replacement.getLocalPort()).isEqualTo(ownedPort);', 'assertThat(replacement.getLocalPort()).isEqualTo(ownedPort);var state=observer.snapshot(ownedPort);trace.put("replacement",state);TcpNativeDiagnosticTest.assertListener(state,ownedPort,ProcessHandle.current().pid());')
      .replace('try(var client=HttpClient.newBuilder()', 'try(var closedClient=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build()){try{closedClient.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+ownedPort+"/ops/health/readiness")).timeout(Duration.ofSeconds(1)).build(),HttpResponse.BodyHandlers.ofString());throw new AssertionError("Old port still answers HTTP");}catch(java.io.IOException refused){trace.put("oldPortHttp",refused.getClass().getName());}}\n   try(var client=HttpClient.newBuilder()');
  }
  assert.notEqual(instrumented, original);
  fs.writeFileSync(path.join(tests, 'PortLifecycleProbeTest.java'), instrumented);
}
for (const file of ['TcpNativeDiagnosticTest.java']) {
  const source = path.join(import.meta.dirname, file);
  if (fs.existsSync(source)) copyChanged(source, path.join(tests, file));
}
if (name.startsWith('corrigido-') || name.startsWith('controle-final-') || name.startsWith('contraprova-')) {
  for (const file of ['AdoptionRuntimeTest.java', 'AdoptionNativeSockets.java', 'AdoptionNativeSocketsTest.java']) {
    copyChanged(path.resolve('controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration', file), path.join(tests, file));
  }
}
const mutations = [];
function mutate(file, bytes) {
  const target = path.join(tests, file), before = fs.readFileSync(target);
  mutations.push({file, before, beforeSha256: sha(target), executedSha256: crypto.createHash('sha256').update(bytes).digest('hex')});
  fs.writeFileSync(target, bytes);
}
if (name === 'contraprova-bypass-pg17') {
  mutate('AdoptionRuntimeTest.java', execFileSync('git', ['show', '3b245d9d:controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionRuntimeTest.java']));
}
if (name === 'contraprova-inspecao-pg17') {
  const file = 'AdoptionNativeSockets.java';
  const source = fs.readFileSync(path.join(tests, file), 'utf8');
  const broken = source.replace('Get-NetTCPConnection -ErrorAction Stop', "& { throw 'Controlled TCP inspection failure' }");
  assert.notEqual(source, broken);
  mutate(file, broken);
}
const executedSources = {};
for (const file of ['AdoptionRuntimeTest.java', 'AdoptionNativeSockets.java', 'AdoptionNativeSocketsTest.java', 'PortLifecycleProbeTest.java', 'TcpNativeDiagnosticTest.java']) {
  const source = path.join(tests, file);
  if (fs.existsSync(source)) {
    const destination = path.join(runtime, name + '-sources', file);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.copyFileSync(source, destination);
    executedSources[file] = sha(source);
  }
}
const javaHome = path.resolve('controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
const jar = path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar');
assert.equal(sha(jar), 'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
const args = ['/d', '/c', 'mvnw.cmd', '--batch-mode', '-Duser.timezone=UTC', `-Dcf017.postgres.major=${major}`,
  `-Dtest=${selection}`, '-Dsurefire.rerunFailingTestsCount=0', `-Dcf034.reportsDirectory=${path.join(runtime, name + '-reports')}`,
  `-Dpreparation.jar=${jar}`, `-Dtcp.runtime=${runtime}`, `-Dtcp.observer=${path.join(import.meta.dirname, 'TcpObserver.ps1')}`, 'test'];
const fd = fs.openSync(path.join(runtime, name + '.log'), 'wx');
const started = new Date().toISOString();
const mono = performance.now();
let result;
try {
  result = spawnSync(process.env.ComSpec ?? 'cmd.exe', args, {cwd: back, stdio: ['ignore', fd, fd],
    env: {...process.env, JAVA_HOME: javaHome, PATH: `${javaHome}/bin;${process.env.PATH}`}});
} finally {
  fs.closeSync(fd);
  for (const mutation of mutations) {
    fs.copyFileSync(path.join(tests, mutation.file), path.join(runtime, name + '-' + mutation.file));
    fs.writeFileSync(path.join(tests, mutation.file), mutation.before);
    mutation.restoredSha256 = sha(path.join(tests, mutation.file));
    assert.equal(mutation.restoredSha256, mutation.beforeSha256);
  }
}
const receipt = {name, major, selection, started, ended: new Date().toISOString(), elapsedMs: performance.now() - mono,
  status: result.status, error: result.error?.message, args, javaHome, executedSources, mutations: mutations.map(({before, ...record}) => record), jarSha256: sha(jar), logSha256: sha(path.join(runtime, name + '.log'))};
fs.writeFileSync(path.join(runtime, name + '-receipt.json'), JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx'});
if (instrument) {
  const file = path.join(tests, 'PortLifecycleProbeTest.java');
  fs.copyFileSync(file, path.join(runtime, name + '-PortLifecycleProbeTest.java'));
  fs.copyFileSync(path.resolve('tasks/evidencias/revalidacao-preparacao-local-adocao/PortLifecycleProbeTest.java'), file);
}
console.log(JSON.stringify(receipt));
process.exitCode = result.status ?? 1;
