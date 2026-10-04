const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..');
const candidate='e069e33d45c25eb9c3edd6d46fa9645e9dc45381';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hash=f=>sha(fs.readFileSync(f));
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8').replace(/^\uFEFF/,'');
const json=f=>JSON.parse(read(f));
const assert=(ok,why)=>{if(!ok)throw Error(why);};
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
for(const ref of ['c45bfb6','a93c52f',candidate])git('merge-base','--is-ancestor',ref,'HEAD');
git('merge-base','--is-ancestor','c45bfb6','a93c52f');git('merge-base','--is-ancestor','a93c52f',candidate);
assert(git('diff','--name-only',candidate,'--','controle-financeiro-frontend','controle-financeiro-backend')==='','Produto/testes/config alterados.');
for(const dir of ['saneamento-RVR24-01-bruto','revisao-CF-025-CF-027-RV24','revalidacao-RV24-01-RV24-02'])assert(!git('diff',candidate,'--',`tasks/evidencias/${dir}`),'Histórico modificado.');
const readme=hash(path.join(root,'README.md'));
assert(readme==='6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca','README alheio mudou.');
const original='tasks/evidencias/revisao-CF-025-CF-027-RV24/financial-result-review.test.tsx';
const expected='0174865c3f241459bb2dfae5eb9540b2a95c47c92be72f5b427a59dcb5a69143';
assert(hash(path.join(root,original))===expected,'Original diverge.');
assert(sha(cp.execFileSync('git',['show',`c45bfb6:${original}`],{cwd:root}))===expected,'Blob original diverge.');
const frontProbe='controle-financeiro-frontend/tests/component/financial-result-review.test.tsx';
assert(hash(path.join(root,frontProbe))===expected,'Probe integrado difere.');
const copies=[{base:'controle-financeiro-frontend',copy:read('frontend-copy.txt').trim(),source:'src'}, {base:'controle-financeiro-backend',copy:json('integration/result.json').copy,source:'src/main'}];
const sourceChecks=copies.map(c=>{
 const files=walk(path.join(root,c.base,c.source)).sort();
 const entries=files.map(f=>({file:path.relative(path.join(root,c.base),f).replaceAll('\\','/'),sha256:hash(f)}));
 if(fs.existsSync(c.copy))for(const e of entries)assert(hash(path.join(c.copy,e.file))===e.sha256,`Fonte da cópia diverge: ${e.file}`);
 return {base:c.base,files:entries.length,manifest_sha256:sha(JSON.stringify(entries))};
});
const proof=json('components-result.json');
assert(proof.red_exit===1&&proof.restored_exit===0&&proof.candidate_before===proof.candidate_restored,'Contraprova/restauração inválida.');
const clean=s=>s.replace(/\x1b\[[0-9;]*m/g,'');
for(const [f,re] of [['original-red.log',/3 failed \| 1 passed \(4\)/],['original-restored.log',/4 passed \(4\)/],['components.log',/121 passed \(121\)/],['components-final.log',/4 failed \| 121 passed \(125\)/],['decimal-limits.log',/4 failed \| 21 passed \(25\)/],['integration/browser/playwright.log',/1 passed/]])assert(re.test(clean(read(f))),`Contagem diverge: ${f}`);
assert(json('components-final-result.json').exit===1&&json('decimal-limits-result.json').exit===1,'Vermelhos finais não preservados.');
const lint=json('lint.json');assert(lint.length===249&&lint.every(f=>f.errorCount===0&&f.warningCount===0),'Lint diverge.');
assert(Object.values(json('static-results.json')).every(v=>v===0),'Gate estático falhou.');
const integration=json('integration/result.json');assert(integration.maven_exit===0&&integration.suites.length===1&&integration.suites[0].tests===1&&['failures','errors','skipped'].every(k=>integration.suites[0][k]===0),'Integração falhou.');
const sql=json('integration/browser/sql-checkpoints.json');const identity=sql[0].state.receipts[0].id;
assert(sql.length===3&&sql.every(c=>c.posts===1&&c.state.accounts.length===1&&c.state.accounts[0].balance===800&&c.state.operations.length===1&&c.state.operations[0].total_value===200&&c.state.operations[0].quantity===2&&c.state.receipts.length===1&&c.state.receipts[0].id===identity&&c.state.receipts[0].gross===200&&c.state.bank.length===1&&c.state.bank[0].amount===200),'SQL checkpoints divergentes.');
for(const entry of json('sanitization.json'))assert(hash(path.join(__dirname,entry.file))===entry.published_sha256,`Proveniência divergente: ${entry.file}`);
const evidence=walk(__dirname).filter(f=>path.basename(f)!=='checkpoint.json').sort().map(f=>{
 if(/\.(log|xml|txt|json|md)$/.test(f))assert(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(fs.readFileSync(f,'utf8')),'JWT em evidência.');
 return {file:path.relative(__dirname,f).replaceAll('\\','/'),sha256:hash(f)};
});
const tasks=['tasks/01-datas-integracao/RV24-01-criacao-resultado-desconhecido.md','tasks/01-datas-integracao/CF-009-estado-assincrono.md'];
for(const file of tasks)assert(fs.readFileSync(path.join(root,file),'utf8').includes('- Estado: em_revisao'),'Estado indevido.');
for(const f of [...walk(__dirname).filter(f=>f.endsWith('.md')),...tasks.map(f=>path.join(root,f))])for(const m of fs.readFileSync(f,'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
 const target=m[1].split('#')[0];if(target&&!/^(https?:|mailto:)/.test(target))assert(fs.existsSync(path.resolve(path.dirname(f),target)),`Link inválido: ${target}`);
}
const checkpoint={candidate,date:'2026-10-04',readme_sha256:readme,original_probe_sha256:expected,sourceChecks,evidence,gates:{original_red:3,original_positive:1,restored:4,final:{passed:121,failed:4,total:125},lint:249,typecheck:0,build:0,java:1,chromium:1,sql_checkpoints:3},decisions:{RVR24_01:'não aprovado integralmente: teto monetário',RV24_01:'em_revisao: critério4',CF009:'em_revisao: critério2'},limitations:['Gate final vermelho, não confundir121 verdes com aprovação','H-RV24-01/RVA-03/RJ-022-01/H24-01 preservados','CF025–027/RVR24-02/RV24-02 aceitos; CF028 somente especificação','Cópias locais conferidas enquanto disponíveis; evidências duráveis versionadas']};
const output=path.join(__dirname,'checkpoint.json');
if(process.argv.includes('--check'))assert(JSON.stringify(json('checkpoint.json'))===JSON.stringify(checkpoint),'Checkpoint mudou; preservar e investigar.');
else {assert(!fs.existsSync(output),'Use --check, não sobrescrever.');fs.writeFileSync(output,JSON.stringify(checkpoint,null,2)+'\n');}
console.log(JSON.stringify({candidate,evidence:evidence.length,sourceChecks,original_probe:expected,final:checkpoint.gates.final,readme_preserved:true,checkpoint_matches:true}));
