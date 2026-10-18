const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve('.cf22s/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit');
const java=path.join(dir,'HabitBrowserIntegrationTest.java');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync(path.join(__dirname,'browser-candidate-hashes.json'),JSON.stringify(['HabitBrowserIntegrationTest.java','browser.cjs','civil-date-clock.cjs'].map(name=>({name,sha256:hash(path.join(dir,name))})),null,2));
fs.copyFileSync(path.join(__dirname,'warm-browser.cjs'),path.join(dir,'warm-browser.cjs'));
const source=fs.readFileSync(java,'utf8');
if(!source.includes('habit/browser.cjs'))throw Error('Unexpected launcher');
fs.writeFileSync(java,source.replace('habit/browser.cjs','habit/warm-browser.cjs'));
