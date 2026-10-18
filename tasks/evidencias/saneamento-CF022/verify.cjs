const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=process.cwd(),dir=__dirname;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const preserved=JSON.parse(fs.readFileSync(path.join(dir,'preservation-initial.json'))).map(e=>({...e,unchanged:fs.existsSync(e.path)&&hash(e.path)===e.sha256}));
fs.writeFileSync(path.join(dir,'preservation-final.json'),JSON.stringify(preserved,null,2));
if(preserved.some(e=>!e.unchanged))throw Error('Preexisting artifact changed');
cp.execFileSync('git',['diff','--exit-code','eb41301','--','controle-financeiro-backend/src/main','controle-financeiro-frontend/src']);
const sourcePaths=cp.execFileSync('git',['ls-files','controle-financeiro-backend/src/main','controle-financeiro-frontend/src'],{encoding:'utf8'}).trim().split('\n');
function content(p){const b=fs.readFileSync(p);return /\.(png|ico|jpg|jpeg|woff2?|ttf)$/.test(p)?b:Buffer.from(b.toString('utf8').replaceAll('\r\n','\n'));}
const sources=sourcePaths.map(p=>({path:p,copyMatches:content(p).equals(content(path.join('.cf22s',p)))}));
fs.writeFileSync(path.join(dir,'source-preservation.json'),JSON.stringify(sources,null,2));
if(sources.some(e=>!e.copyMatches))throw Error('Product copy differs');
const relative='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit';
const names=['HabitBrowserIntegrationTest.java','HabitIntegrityIntegrationTest.java','HabitSchemaInitializer.java','HabitFixtureIsolationIntegrationTest.java','browser.cjs','civil-date-clock.cjs','civil-date-clock.test.cjs'];
const candidate=names.map(name=>({path:path.join(relative,name),sha256:hash(path.join(relative,name)),runtimeSha256:hash(path.join('.cf22s',relative,name))}));
fs.writeFileSync(path.join(dir,'candidate-final.json'),JSON.stringify(candidate,null,2));
if(candidate.some(e=>e.sha256!==e.runtimeSha256))throw Error('Candidate/runtime mismatch or un-restored launcher');
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>{const f=path.join(p,e.name);return e.isSymbolicLink()||['runtime','raw'].includes(e.name)?[]:e.isDirectory()?walk(f):[f];});}
const manifest=walk(dir).filter(p=>!p.endsWith('EVIDENCE-SHA256.json')&&!p.endsWith('-trace.zip')).map(p=>({path:path.relative(dir,p).replaceAll('\\','/'),sha256:hash(p)}));
fs.writeFileSync(path.join(dir,'EVIDENCE-SHA256.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({preserved:preserved.length,productFiles:sources.length,candidateFiles:candidate.length,evidenceFiles:manifest.length,readme:hash('README.md')}));
