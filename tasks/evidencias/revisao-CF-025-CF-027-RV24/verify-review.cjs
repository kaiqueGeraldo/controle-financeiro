const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const git = (...args) => execFileSync('git', args, {cwd:root, encoding:'utf8', maxBuffer:20*1024*1024});
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const normalized = value => value.replace(/\r\n/g,'\n');
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname,'baseline.json'),'utf8').replace(/^\uFEFF/,''));
const tracked = git('ls-files','controle-financeiro-backend/src','controle-financeiro-backend/pom.xml','controle-financeiro-frontend/src','controle-financeiro-frontend/tests','controle-financeiro-frontend/package.json','controle-financeiro-frontend/package-lock.json','controle-financeiro-frontend/eslint.config.mjs','controle-financeiro-frontend/tsconfig.json').trim().split('\n');
const sources = tracked.map(file => {
 const actual = normalized(fs.readFileSync(path.join(root,file),'utf8'));
 const expected = normalized(git('show',`${baseline.head}:${file}`));
 if(actual !== expected) throw Error(`Candidate changed: ${file}`);
 return {file,sha256_lf:sha(actual)};
});
const readme = sha(fs.readFileSync(path.join(root,'README.md')));
if(readme.toLowerCase() !== baseline.readme_sha256.toLowerCase()) throw Error('README changed');
const copy = fs.readFileSync(path.join(__dirname,'validation-authorized/copy-path.txt'),'utf8').trim();
const deltas = [];
for(const source of sources.filter(s=>s.file.startsWith('controle-financeiro-backend/'))){
 const relative=source.file.replace('controle-financeiro-backend/','');
 const copied=path.join(copy,relative);
 if(!fs.existsSync(copied) || sha(normalized(fs.readFileSync(copied,'utf8'))) !== source.sha256_lf) deltas.push(relative);
}
const allowed=['src/test/java/com/controlefinanceiro/api/Rv24CreationBrowserIntegrationTest.java','src/test/java/com/controlefinanceiro/api/service/Rv24DeletionIntegrationTest.java'];
if(deltas.some(file=>!allowed.includes(file))) throw Error(`Unexpected validation copy delta: ${deltas}`);
const lint=JSON.parse(fs.readFileSync(path.join(__dirname,'lint.json'),'utf8'));
const lintTotals=lint.reduce((a,r)=>({files:a.files+1,errors:a.errors+r.errorCount,warnings:a.warnings+r.warningCount}),{files:0,errors:0,warnings:0});
const suites=JSON.parse(fs.readFileSync(path.join(__dirname,'validation-authorized/result.json'),'utf8').replace(/^\uFEFF/,''));
const sum=suites.suites.reduce((a,r)=>({tests:a.tests+r.tests,failures:a.failures+r.failures,errors:a.errors+r.errors,skipped:a.skipped+r.skipped}),{tests:0,failures:0,errors:0,skipped:0});
const states=[];
for(const file of git('ls-files','tasks').trim().split('\n').filter(f=>/^tasks\/[^/]+\/CF-\d{3}-/.test(f) && !f.includes('CF-017-P01'))){
 const id=Number(path.basename(file).slice(3,6));
 if(id<=27){const state=fs.readFileSync(path.join(root,file),'utf8').match(/^- Estado: (\S+)/m)?.[1]; states.push({file,state});}
}
const captures=['validation-authorized','invalid-responses'].flatMap(run=>fs.readdirSync(path.join(__dirname,run,'browser')).filter(file=>file.endsWith('.png')).map(file=>({file:`${run}/browser/${file}`,sha256:sha(fs.readFileSync(path.join(__dirname,run,'browser',file)))})));
const result={candidate:baseline.head,head_at_verification:git('rev-parse','HEAD').trim(),readme_sha256:readme,source_count:sources.length,sources,validation_copy:copy,expected_test_path_adaptations:deltas,lint:lintTotals,backend:sum,states,captures};
fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({candidate:result.candidate,source_count:sources.length,readme_preserved:true,lint:lintTotals,backend:sum,states:states.reduce((a,s)=>(a[s.state]=(a[s.state]||0)+1,a),{})},null,2));
