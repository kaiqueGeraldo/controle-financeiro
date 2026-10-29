import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';

// Read-only audit of existing inputs. Writes only new receipts in this directory.
const out = 'tasks/evidencias/revisao-startup-HQL';
const previous = 'tasks/evidencias/investigacao-startup-HQL';
const base = 'c091abb8aa0473e7ad46690e21c8158a4dde234a';
const candidate = 'ed42309faeeb0eac6e03c14ddb2acfb94db8579f';
const producer = '24844b594e4ed8fe906e0fc6eaee32bdd58f31a0';
const readmeExpected = '6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca';
const read = file => fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const json = file => JSON.parse(read(file));
const hash = async file => {
  const digest = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) digest.update(chunk);
  return digest.digest('hex');
};
const git = (...args) => execFileSync('git', args, {encoding:'utf8', windowsHide:true}).trim();
const save = (name, value) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2)+'\n', {flag:'wx'});
const references = [
  `${previous}/preservacao-inicial.json`, `${previous}/preservacao-final.json`,
  `${previous}/runtime-files.json`, `${previous}/historico-verificado.json`,
  `${previous}/historico-complemento.json`, `${previous}/resultados.json`,
  `${previous}/inputs-diagnostico.json`, `${previous}/fontes-primarias.json`,
  'tasks/evidencias/preparacao-local-adocao/inputs.json',
  'tasks/evidencias/preparacao-local-adocao/package.json',
  'tasks/evidencias/preparacao-local-adocao/image.json',
  'tasks/evidencias/preparacao-local-adocao/packaged-resources.json',
  'tasks/evidencias/revalidacao-TCP-reuso-nativo/README.md',
  'tasks/evidencias/revalidacao-TCP-reuso-nativo/resultados.json',
  'tasks/evidencias/revalidacao-TCP-reuso-nativo/runtime-files.json',
  'tasks/evidencias/revalidacao-RVPLA-05-residual/README.md',
  'tasks/evidencias/revalidacao-RVPLA-04/README.md',
  'tasks/evidencias/revalidacao-RVPLA-03/README.md',
  'tasks/evidencias/revalidacao-preparacao-local-adocao/README.md',
];
function expectedInputs() {
  const old=json(`${previous}/preservacao-inicial.json`);
  const packaged=json('tasks/evidencias/preparacao-local-adocao/inputs.json');
  const files=new Map([...old.inputs,...old.historical].map(item=>[path.resolve(item.file),{file:item.file,sha256:item.sha256}]));
  for(const item of packaged.inputs)if(!files.has(path.resolve(item.file)))
    files.set(path.resolve(item.file),{file:item.file,sha256:item.sha256});
  return files;
}
const phase = process.argv[2];
assert.ok(['inicial', 'provas', 'final'].includes(phase));
fs.mkdirSync(out, {recursive:true});

if (phase === 'inicial') {
  assert.equal(git('branch','--show-current'), 'codex/diagnostico-startup-hql');
  assert.equal(git('rev-parse','HEAD'), candidate);
  git('merge-base','--is-ancestor', base, candidate);
  git('merge-base','--is-ancestor', producer, candidate);
  assert.equal(git('diff','--cached','--name-only'), '');
  const old = json(`${previous}/preservacao-inicial.json`);
  const files = new Map();
  for (const item of [...old.inputs, ...old.historical]) {
    assert.equal(await hash(item.file), item.sha256, item.file);
    files.set(path.resolve(item.file), {file:item.file, sha256:item.sha256});
  }
  // Snapshot only already-enumerated package inputs, no recursive history scan.
  const packaged = json('tasks/evidencias/preparacao-local-adocao/inputs.json');
  for (const item of packaged.inputs) {
    const absolute = path.resolve(item.file);
    if (!files.has(absolute)) files.set(absolute, {file:item.file, sha256:await hash(item.file)});
  }
  for (const file of references) files.set(path.resolve(file), {file, sha256:await hash(file)});
  assert.equal(await hash('README.md'), readmeExpected);
  const productDiff = git('diff','--name-only',producer,'--',
    'controle-financeiro-backend/src/main','controle-financeiro-backend/pom.xml','controle-financeiro-frontend');
  assert.equal(productDiff, '');
  const expected=expectedInputs();
  save('preservacao-inicial.json', {
    at:new Date().toISOString(), branch:git('branch','--show-current'), head:candidate, base, producer,
    ancestorVerified:true, readmeSha256:readmeExpected,
    workingTree:git('status','--short'), index:git('diff','--cached','--name-only'),
    candidateDiff:git('diff','--name-status',`${base}..${candidate}`),
    productDiffFromProducer:productDiff,
    protectedFileCount:files.size,
    directReferences:references.map(file=>files.get(path.resolve(file))),
    inputOverrides:[...files.values()].filter(item=>!references.includes(item.file)
      && item.sha256!==expected.get(path.resolve(item.file))?.sha256),
    referenceManifests:references,
    scope:'Existing explicit input lists and relevant manifest hashes; no recursive inventory/copy, no new runtime/startup/build.'
  });
  console.log(JSON.stringify({phase, protectedFiles:files.size, readmeSha256:readmeExpected}));
}

if (phase === 'provas') {
  const old = json(`${previous}/preservacao-final.json`);
  const runtime = json(`${previous}/runtime-files.json`);
  const lookup = new Map(runtime.files.map(x=>[x.file,x]));
  const checked = [];
  async function check(file, expected, category) {
    const actual = await hash(file); assert.equal(actual, expected, file);
    checked.push({file, sha256:actual, category});
  }
  for (const item of old.collection) {
    await check(item.source, item.originalSha256, 'original-capture');
    await check(path.join(previous,item.file), item.collectedSha256, 'collected-copy');
    const normalized = read(item.source)
      .replaceAll('synthetic-adoption-secret-at-least-32-chars','[synthetic-secret-redacted]')
      .replace(/\r\n/g,'\n').split('\n').map(l=>l.trimEnd()).join('\n');
    assert.equal(normalized, read(path.join(previous,item.file)), 'Declared transformation');
  }
  const history = json(`${previous}/historico-verificado.json`);
  const complement = json(`${previous}/historico-complemento.json`);
  for (const item of [...history.files,...complement.reports,complement.metadata])
    await check(item.file,item.sha256,'historical-occurrence');
  const diagnostic = json(`${previous}/inputs-diagnostico.json`);
  const testPath = 'checkout/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/';
  const adapter = path.join(runtime.root,testPath,'AdoptionRuntimeTest.java');
  await check(adapter,diagnostic.adapter.adapted,'diagnostic-adapter');
  await check('controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionRuntimeTest.java',
    diagnostic.adapter.original,'canonical-adapter');
  const canonical = read('controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionRuntimeTest.java');
  const adapted = read(adapter);
  assert.equal(canonical.slice(canonical.indexOf('        void awaitStatus(')),adapted.slice(adapted.indexOf('        void awaitStatus(')));
  for (const relative of [testPath+'StartupHqlProbeTest.java','agent/boot-agent.jar','agent/byte-buddy.jar',
    'agent/native-instrumented.jfr','agent/image-instrumented.jfr',
    'native-instrumented/jfr-selected.json','image-instrumented/jfr-selected.json']) {
    const entry = lookup.get(relative); assert.ok(entry, relative);
    await check(path.join(runtime.root,relative),entry.sha256,'selected-runtime-input');
  }
  assert.equal(read(path.join(runtime.root,testPath,'StartupHqlProbeTest.java')),read(`${previous}/StartupHqlProbeTest.java`));
  await check(diagnostic.agent.source,diagnostic.agent.sourceSha256,'agent-source');
  await check(json(`${previous}/fontes-primarias.json`).springDataSources,
    json(`${previous}/fontes-primarias.json`).sha256.toLowerCase(),'versioned-primary-source');

  const result = json(`${previous}/resultados.json`);
  const observations = [];
  for (const expected of result.records) {
    const folder = path.join(runtime.root,expected.name);
    const observed = json(path.join(folder,'observation.json'));
    const log = read(path.join(folder,'process.log'));
    for (const key of ['readinessMs','gateStartMs','gateElapsedMs','startReturnedMs','clientPid','port',
      'originalAwaitReturnedSuccess','within40SecondsFromGate','within40SecondsFromCreation',
      'liveness','functionalUnauthenticatedAccounts','cleanupConfirmed','aliveAfterCleanup'])
      assert.equal(expected[key],observed[key], `${expected.name}/${key}`);
    assert.equal(observed.originalAwaitReturnedSuccess,true);
    assert.equal(observed.within40SecondsFromCreation,true);
    assert.ok(observed.readinessMs < 40000);
    assert.equal(observed.cleanupConfirmed,true);
    assert.equal(observed.aliveAfterCleanup,false);
    assert.equal(Number(log.match(/with PID (\d+)/)[1]),expected.pid);
    assert.ok(log.includes('profile is active: "adoption"'));
    assert.ok(log.includes('Database version: 17.11'));
    assert.ok(!/APPLICATION FAILED TO START|\[Byte Buddy\] ERROR/.test(log));
    const timeOf = marker => {
      const line=log.split(/\r?\n/).find(l=>l.includes(marker)); assert.ok(line, marker);
      const stamp=line.match(/\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3}/)[0];
      return Date.parse(stamp.replace(' ','T')+(expected.name.startsWith('image')?'Z':'-03:00'))-Date.parse(observed.creationWallUtc);
    };
    assert.equal(timeOf('Initialized JPA EntityManagerFactory'),expected.milestones.jpaValidated);
    assert.equal(timeOf('Tomcat started on port'),expected.milestones.webStarted);
    const record={name:expected.name,clientPid:observed.clientPid,applicationPid:expected.pid,container:observed.container,
      port:observed.port,creationWallUtc:observed.creationWallUtc,readinessMs:observed.readinessMs,
      gateElapsedMs:observed.gateElapsedMs,jpaMs:expected.milestones.jpaValidated,
      strict40s:true,cleanupConfirmed:true,bodyCaptured:false};
    if (observed.instrumented) {
      // Independent span reconstruction; do not trust reported duration or method attribution.
      const stacks=new Map(),spans=[];
      for (const line of log.split(/\r?\n/)) {
        const at=line.indexOf('BOOT_QUERY_');if(at<0)continue;
        const fields=line.slice(at).split('|'),[kind,nano,origin,digest]=fields;
        const stack=stacks.get(origin)??[];stacks.set(origin,stack);
        if(kind==='BOOT_QUERY_BEGIN') stack.push({nano:BigInt(nano),digest});
        else {
          const start=stack.pop(); assert.ok(start);assert.equal(start.digest,digest);
          const elapsed=BigInt(nano)-start.nano;assert.ok(elapsed>=0n);assert.equal(elapsed,BigInt(fields[4]));
          assert.equal(fields[5].trim(),'OK');
          if(!stack.length)spans.push({origin,hash:digest,ms:Number(elapsed)/1e6});
        }
      }
      assert.ok([...stacks.values()].every(s=>!s.length));
      for (const [key,suffix] of [['hql','.forHql'],['hibernateValidation','.createQuery']]) {
        const selected=spans.filter(s=>s.origin.endsWith(suffix));
        const total=selected.reduce((n,s)=>n+s.ms,0),distinct=new Set(selected.map(s=>s.hash));
        assert.equal(selected.length,expected[key].calls);
        assert.equal(distinct.size,expected[key].distinctHashes);
        assert.ok(Math.abs(total-expected[key].totalMs)<0.000001);
        assert.deepEqual(selected.map(s=>s.hash),expected.queries.filter(s=>s.origin.endsWith(suffix)).map(s=>s.hash));
        record[key]={calls:selected.length,distinctHashes:distinct.size,totalMs:total,maxMs:Math.max(...selected.map(s=>s.ms))};
      }
      // Both current documents have a complete closing envelope; parser tests alone do not prove it.
      const selectedPath=path.join(folder,'jfr-selected.json');
      const fd=fs.openSync(selectedPath,'r'),tail=Buffer.alloc(128);
      const bytes=fs.statSync(selectedPath).size;fs.readSync(fd,tail,0,128,bytes-128);fs.closeSync(fd);
      assert.match(tail.toString(),/\]\s*\}\s*\}\s*$/);
      const summary=read(path.join(folder,'jfr-summary.txt'));
      assert.ok(summary.includes('jdk.ExecutionSample'));
      record.jfr={sha256:expected.jfr.sha256,bytes:expected.jfr.bytes,envelopeComplete:true};
    }
    observations.push(record);
  }
  const attrs = source => Object.fromEntries([...source.matchAll(/([\w.-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  const histories=[];
  for (const receipt of history.reports) {
    const xml=read(receipt.report),suite=attrs(xml.match(/<testsuite\b[^>]+>/)[0]);
    const cases=[...xml.matchAll(/<testcase\b[\s\S]*?<\/testcase>/g)].map(m=>({
      ...attrs(m[0].slice(0,m[0].indexOf('>')+1)),failed:/<(?:failure|error)\b/.test(m[0])
    }));
    assert.equal(cases.filter(c=>c.failed).length,receipt.failures.length);
    histories.push({run:receipt.run,mode:receipt.mode,report:receipt.report,
      tests:Number(suite.tests),failures:Number(suite.failures),errors:Number(suite.errors),skipped:Number(suite.skipped),
      failedCases:cases.filter(c=>c.failed).map(c=>c.name),passedCases:cases.filter(c=>!c.failed).map(c=>c.name)});
  }
  const tests=spawnSync(process.execPath,['--test',`${previous}/jfr-stream.test.mjs`],{encoding:'utf8',windowsHide:true});
  assert.equal(tests.status,0,tests.stdout+tests.stderr);
  fs.writeFileSync(path.join(out,'leitor-testes.log'),tests.stdout.replace(/\r\n/g,'\n'),{flag:'wx'});
  save('conferencia.json',{
    at:new Date().toISOString(),base,candidate,producer,checked,observations,histories,
    adapterGateDiscoveryCloseByteIdentical:true,readerExistingTests:{status:tests.status,passed:5},
    noStartupExecuted:true,noPackageBuilt:true,
    limitations:['Observation wrapper does not fail JUnit on original gate failure: raw flags checked individually.',
      'New probe captures readiness status but not body/headers; original releasedProcess asserts exact UP body.',
      'Agent has no thread identity; depth reconstruction is safe only for serial calls observed, not generic concurrent tracing.',
      'JFR/agent/sampler overhead is included; fixed order confounds cache warming with instrumentation.']
  });
  console.log(JSON.stringify({phase,checked:checked.length,observations,histories:histories.map(({passedCases,...r})=>r),readerTestsPassed:5}));
}

if (phase === 'final') {
  const initial=json(path.join(out,'preservacao-inicial.json'));
  const protectedFiles=expectedInputs();
  for(const item of [...initial.directReferences,...initial.inputOverrides])protectedFiles.set(path.resolve(item.file),item);
  assert.equal(protectedFiles.size,initial.protectedFileCount);
  for(const item of protectedFiles.values())assert.equal(await hash(item.file),item.sha256,item.file);
  assert.equal(await hash('README.md'),readmeExpected);
  const forbidden=git('diff','--name-only',candidate,'--','controle-financeiro-backend','controle-financeiro-frontend','.github');
  assert.equal(forbidden,'');
  assert.equal(git('diff','--name-only',candidate,'--',previous),'');
  const files=fs.readdirSync(out).filter(f=>fs.statSync(path.join(out,f)).isFile());
  const inventory=[];
  for(const file of files)inventory.push({file,sha256:await hash(path.join(out,file)),bytes:fs.statSync(path.join(out,file)).size});
  save('preservacao-final.json',{
    at:new Date().toISOString(),headBeforeFinalDocumentationCommit:git('rev-parse','HEAD'),branch:git('branch','--show-current'),
    readmeSha256:readmeExpected,protectedFilesChecked:protectedFiles.size,
    initialReceiptSha256:await hash(path.join(out,'preservacao-inicial.json')),
    canonicalProductHarnessDiff:forbidden,historicalEvidenceDiff:'',migrations:16,
    inventoryExcludingThisReceipt:inventory,workingTree:git('status','--short'),
    scope:'No external runtime or process created; no historical inventory expanded; image inspected read-only separately.'
  });
  console.log(JSON.stringify({phase,protectedFilesChecked:protectedFiles.size,readmeSha256:readmeExpected,files:inventory.length}));
}
