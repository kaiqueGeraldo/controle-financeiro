const fs=require('node:fs'),path=require('node:path');
const root=process.cwd(),source=path.resolve(__dirname,'runtime'),candidate=path.resolve(root,'.cf22s');
// Only the runtime created by prepare.cjs in this task can be moved; no prior artifacts.
if(!source.startsWith(root+path.sep)||!candidate.startsWith(root+path.sep)||fs.existsSync(candidate))throw Error('Unsafe/existing destination');
fs.cpSync(path.join(source,'controle-financeiro-backend/target/surefire-reports'),path.join(__dirname,'before-isolation-regression/surefire'),{recursive:true});
fs.renameSync(source,candidate);
// Tailwind scans this unignored export. Ignoring the whole runtime would suppress source discovery.
fs.writeFileSync(path.join(candidate,'.gitignore'),'base.zip\n');
const relative='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit';
for(const name of ['browser.cjs','civil-date-clock.cjs','civil-date-clock.test.cjs','HabitSchemaInitializer.java','HabitIntegrityIntegrationTest.java','HabitBrowserIntegrationTest.java','HabitFixtureIsolationIntegrationTest.java'])fs.copyFileSync(path.join(root,relative,name),path.join(candidate,relative,name));
const frontend='controle-financeiro-frontend';
fs.symlinkSync(path.join(root,frontend,'node_modules'),path.join(candidate,frontend,'node_modules'),'junction');
const config=path.join(candidate,frontend,'next.config.ts');
fs.writeFileSync(config,fs.readFileSync(config,'utf8').replace('const nextConfig: NextConfig = {',`const nextConfig: NextConfig = {\n  turbopack: {root: ${JSON.stringify(root.replaceAll('\\','/'))}},`));
console.log(candidate);
