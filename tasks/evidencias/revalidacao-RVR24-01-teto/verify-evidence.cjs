const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),candidate='01d44d8fb306740d301ad19c02d6697d161f0b44';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f));
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8').replace(/^\uFEFF/,''),json=f=>JSON.parse(read(f));
const assert=(ok,why)=>{if(!ok)throw Error(why);};
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
for(const ref of ['1e9e932','c702739',candidate])git('merge-base','--is-ancestor',ref,'HEAD');
git('merge-base','--is-ancestor','1e9e932','c702739');git('merge-base','--is-ancestor','c702739',candidate);
assert(!git('diff',candidate,'--','controle-financeiro-backend','controle-financeiro-frontend'),'Produto compartilhado mudou.');
for(const p of ['revalidacao-RVR24-01-bruto','saneamento-RVR24-01-teto','revisao-CF-025-CF-027-RV24'])assert(!git('diff',candidate,'--',`tasks/evidencias/${p}`),'Histórico mudou.');
const readme=hash(path.join(root,'README.md'));assert(readme==='6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca','README alheio diverge.');
const original='tasks/evidencias/revalidacao-RVR24-01-bruto/decimal-independent.test.tsx';
const probeHash='7b293c5a328231d950b456e95a847273e66439b22588f55026f8d1d5608bd255';
assert(hash(path.join(root,original))===probeHash,'Original mudou.');
assert(sha(cp.execFileSync('git',['show',`1e9e932:${original}`],{cwd:root}))===probeHash,'Blob histórico diverge.');
assert(hash(path.join(root,'controle-financeiro-frontend/tests/component/decimal-independent.test.tsx'))===probeHash,'Cópia integrada diverge.');
const proof=json('components-result.json');assert(proof.hashes.every(h=>h.toLowerCase()===probeHash)&&proof.candidate_before===proof.candidate_after&&proof.red_exit===1&&proof.restored_exit===0&&proof.gate_exit===0,'Contraprova/restauração diverge.');
const jsonBefore=json('json-before-result.json');assert(jsonBefore.exit===1&&jsonBefore.before===jsonBefore.restored,'Restauração de precisão falhou.');
const copies=[{base:'controle-financeiro-frontend',copy:read('frontend-copy.txt').trim(),source:'src'},...['integration','precision-integration','precision-observations'].map(run=>({base:'controle-financeiro-backend',copy:json(`${run}/result.json`).copy,source:'src/main'}))];
const sourceChecks=copies.map(c=>{
 const files=walk(path.join(root,c.base,c.source)).concat(path.join(root,c.base,c.base.endsWith('backend')?'pom.xml':'package.json')).sort();
 const entries=files.map(f=>({file:path.relative(path.join(root,c.base),f).replaceAll('\\','/'),sha256:hash(f)}));
 if(fs.existsSync(c.copy))for(const e of entries)assert(hash(path.join(c.copy,e.file))===e.sha256,`Cópia diverge: ${e.file}`);
 return {base:c.base,files:entries.length,manifest_sha256:sha(JSON.stringify(entries))};
});
const clean=s=>s.replace(/\x1b\[[0-9;]*m/g,'');
for(const [f,p] of [['original-red.log',/4 failed \| 21 passed \(25\)/],['original-restored.log',/25 passed \(25\)/],['components.log',/151 passed \(151\)/],['json-precision.log',/6 failed \| 1 passed \(7\)/],['json-before.log',/3 failed \| 4 passed \(7\)/],['integration/browser/playwright.log',/1 passed/],['precision-integration/browser/playwright.log',/1 failed/],['precision-observations/browser/playwright.log',/1 failed/]])assert(p.test(clean(read(f))),`Contagem divergente: ${f}`);
const lint=json('lint.json');assert(lint.length===251&&lint.every(f=>!f.errorCount&&!f.warningCount),'Lint diverge.');
assert(Object.values(json('static-results.json')).every(v=>v===0),'Gate estático falhou.');
for(const run of ['integration','precision-integration','precision-observations']){const r=json(`${run}/result.json`);const failed=run==='integration'?0:1;assert(r.maven_exit===failed&&r.suites.length===1&&r.suites[0].tests===1&&r.suites[0].failures===failed&&r.suites[0].errors===0&&r.suites[0].skipped===0,`Runner ${run} diverge.`);}
const sql=json('integration/browser/sql-checkpoints.json'),id=sql[0].state.receipts[0].id;
assert(sql.length===3&&sql.every(c=>c.posts===1&&c.state.accounts[0].balance===800&&c.state.operations.length===1&&c.state.operations[0].total_value===200&&c.state.receipts.length===1&&c.state.receipts[0].id===id&&c.state.receipts[0].gross===200),'SQL800 diverge.');
const precision=json('precision-observations/browser/precision-state.json');
assert(precision.posts===1&&precision.state.accounts[0].balance===1001&&precision.state.operations.length===1&&precision.state.operations[0].total_value===1&&precision.state.receipts.length===1&&precision.state.receipts[0].id===precision.original.operationId&&precision.saved.length===1,'SQL/pendência NG01 diverge.');
assert(precision.state.raw_operations[0].quantity==='999999999999.99999999'&&precision.state.raw_receipts[0].quantity==='999999999999.99999999','Persistência exata diverge.');
assert(read('precision-observations/browser/operation-raw.json').includes('"quantity":999999999999.99999999'),'POST exato ausente.');
assert(read('precision-observations/browser/receipt-raw.json').includes('"quantity":1.0E12'),'GET aproximado ausente.');
const money=json('json-roundtrip.json');assert(money.valid_money_samples===10069&&money.failures.length===0,'Amostragem monetária diverge.');
for(const e of json('sanitization.json'))assert(hash(path.join(__dirname,e.file))===e.published_sha256,`Proveniência diverge: ${e.file}`);
const evidence=walk(__dirname).filter(f=>path.basename(f)!=='checkpoint.json').sort().map(f=>{if(/\.(log|xml|txt|json|md)$/.test(f))assert(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(fs.readFileSync(f,'utf8')),'JWT em evidência.');return {file:path.relative(__dirname,f).replaceAll('\\','/'),sha256:hash(f)};});
const tasks=['tasks/01-datas-integracao/RV24-01-criacao-resultado-desconhecido.md','tasks/01-datas-integracao/CF-009-estado-assincrono.md'];
for(const f of tasks)assert(fs.readFileSync(path.join(root,f),'utf8').includes('- Estado: em_revisao'),'Estado indevido.');
for(const f of [...fs.readdirSync(__dirname).filter(f=>f.endsWith('.md')).map(f=>path.join(__dirname,f)),...tasks.map(f=>path.join(root,f))])for(const m of fs.readFileSync(f,'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){const t=m[1].split('#')[0];if(t&&!/^(https?:|mailto:)/.test(t))assert(fs.existsSync(path.resolve(path.dirname(f),t)),`Link inválido: ${t}`);}
const checkpoint={candidate,date:'2026-10-04',readme_sha256:readme,original_probe_sha256:probeHash,sourceChecks,evidence,gates:{original_red:4,original_positive:21,restored:25,components:151,json_candidate:{failed:6,passed:1},json_base:{failed:3,passed:4},lint:251,typecheck:0,build:0,browser:{ceiling_passed:1,precision_failed_runs:2}},decisions:{monetary_ceiling:'correção restrita comprovada',RVR24_01:'saneamento não aprovado integralmente: precisão dentro do domínio',RV24_01:'em_revisao: critério4',CF009:'em_revisao: critério2'},limits:['Contagens sobrepostas','CF025–027/RVR24-02/RV24-02 preservados; CF028 não executada','H-RV24-01/RVA-03/RJ-022-01/H24-01 não encerrados','Cópias locais verificadas enquanto disponíveis; outputs duráveis aqui']};
const out=path.join(__dirname,'checkpoint.json');if(process.argv.includes('--check'))assert(JSON.stringify(json('checkpoint.json'))===JSON.stringify(checkpoint),'Checkpoint diverge; não sobrescrever.');else{assert(!fs.existsSync(out),'Use --check.');fs.writeFileSync(out,JSON.stringify(checkpoint,null,2)+'\n');}
console.log(JSON.stringify({candidate,evidence:evidence.length,sourceChecks,gates:checkpoint.gates,readme_preserved:true,checkpoint_matches:true}));
