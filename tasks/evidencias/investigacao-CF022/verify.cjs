const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=process.cwd(),dir=__dirname;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const old=JSON.parse(fs.readFileSync(path.join(dir,'preservation-initial.json'),'utf8'));
const preserved=old.map(x=>({...x,final:hash(fs.readFileSync(path.join(root,x.path)))}));
if(preserved.some(x=>x.sha256!==x.final))throw Error('Historical preservation mismatch');
fs.writeFileSync(path.join(dir,'preservation-final.json'),JSON.stringify(preserved,null,2));
const files=cp.execFileSync('git',['ls-tree','-r','--name-only','e1c6312','controle-financeiro-backend/src/main','controle-financeiro-frontend/src'],{encoding:'utf8'}).trim().split('\n');
const normalize=(b,file)=>/\.(png|jpg|jpeg|ico|woff2?|pdf)$/i.test(file)?b:b.toString('utf8').replaceAll('\r\n','\n');
const checks=files.map(file=>{const source=cp.execFileSync('git',['show','e1c6312:'+file],{maxBuffer:64*1024*1024});return {file,checkout:hash(normalize(fs.readFileSync(path.join(root,file)),file))===hash(normalize(source,file)),copy:hash(normalize(fs.readFileSync(path.join(root,'.cf22',file)),file))===hash(normalize(source,file))};});
fs.writeFileSync(path.join(dir,'source-preservation.json'),JSON.stringify(checks,null,2));
if(checks.some(x=>!x.checkout||!x.copy))throw Error('Product source differs');
for(const file of ['controle-financeiro-frontend/next.config.ts','controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/HabitBrowserIntegrationTest.java','controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/browser.cjs']){
 const result=cp.spawnSync('git',['diff','--no-index','--',path.join(root,file),path.join(root,'.cf22',file)],{encoding:'utf8'});
 if(result.status>1)throw Error(result.stderr);
 fs.writeFileSync(path.join(dir,path.basename(file)+'.patch'),result.stdout);
}
console.log(JSON.stringify({historicalFiles:preserved.length,productFiles:checks.length,readme:preserved[0].final,allPreserved:true}));
