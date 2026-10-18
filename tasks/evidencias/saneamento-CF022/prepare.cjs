const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
const root = process.cwd(), dir = __dirname, runtime = path.join(dir, 'runtime');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function walk(p) { return fs.readdirSync(p, {withFileTypes:true}).flatMap(e => { const f=path.join(p,e.name); return e.isSymbolicLink()?[]:e.isDirectory()?walk(f):[f]; }); }
if (fs.existsSync(runtime)) throw Error('Preserve existing runtime');
const files = ['README.md', ...walk('.cf22'), ...walk('tasks/evidencias/investigacao-CF022'), ...walk('tasks/evidencias/revalidacao-CF022')];
fs.writeFileSync(path.join(dir,'preservation-initial.json'), JSON.stringify(files.map(p=>({path:p,sha256:hash(p)})),null,2));
fs.mkdirSync(runtime);
cp.execFileSync('git',['archive','eb41301','--format=zip','--output='+path.join(runtime,'base.zip'),'controle-financeiro-backend','controle-financeiro-frontend']);
cp.execFileSync('tar',['-xf',path.join(runtime,'base.zip'),'-C',runtime]);
const before=path.join(dir,'before'); fs.mkdirSync(before);
for(const name of ['clock-probe.cjs','IndependentFixtureProbeTest.java'])fs.copyFileSync(path.join(root,'tasks/evidencias/revalidacao-CF022',name),path.join(before,name));
fs.copyFileSync(path.join(before,'IndependentFixtureProbeTest.java'),path.join(runtime,'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/IndependentFixtureProbeTest.java'));
console.log(JSON.stringify({preserved:files.length,base:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtime}));
