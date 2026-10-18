const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),{Linter}=require(path.join(root,'controle-financeiro-frontend/node_modules/eslint'));
const base=path.join(root,'.cf22r/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit');
const files=['browser.cjs','civil-date-clock.cjs','civil-date-clock.test.cjs'];
const results=files.map(file=>{
 cp.execFileSync(process.execPath,['--check',path.join(base,file)]);
 const messages=new Linter().verify(fs.readFileSync(path.join(base,file),'utf8'),[{files:['**/*.cjs'],languageOptions:{ecmaVersion:'latest',sourceType:'commonjs'},rules:{'no-unused-vars':['error',{args:'none',caughtErrors:'none'}],'no-unreachable':'error','no-constant-condition':'error'}}],{filename:file});
 return {file,syntax:true,messages};
});
fs.writeFileSync(path.join(__dirname,'cjs-validation.json'),JSON.stringify(results,null,2));
if(results.some(r=>r.messages.length))process.exitCode=1;
console.log(JSON.stringify(results));
