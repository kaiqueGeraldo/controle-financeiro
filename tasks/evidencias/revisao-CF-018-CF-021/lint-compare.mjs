import {ESLint} from '../../../controle-financeiro-frontend/node_modules/eslint/lib/api.js';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), front=path.join(root,'controle-financeiro-frontend');
const files=execFileSync('git',['diff','--name-only','0cc24b7','46d9fad','--','controle-financeiro-frontend/src'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(p=>/\.tsx?$/.test(p));
const eslint=new ESLint({cwd:front});
const report={candidate:'46d9fad',base:'0cc24b7',files:files.length,results:[]};
for(const file of files){
  for(const ref of ['0cc24b7','46d9fad']){
    const source=execFileSync('git',['show',`${ref}:${file}`],{encoding:'utf8'});
    const [r]=await eslint.lintText(source,{filePath:path.join(root,file)});
    report.results.push({file,ref,errors:r.errorCount,warnings:r.warningCount,messages:r.messages});
  }
}
for(const file of ['milestone-review.integrated.spec.ts','milestone-recovery.integrated.spec.ts','playwright.milestone-review.config.ts']){
  const full=path.join(front,'tests/e2e',file);
  const [r]=await eslint.lintText(await readFile(full,'utf8'),{filePath:full});
  report.results.push({file,ref:'review',errors:r.errorCount,warnings:r.warningCount,messages:r.messages});
}
await writeFile('tasks/evidencias/revisao-CF-018-CF-021/lint-comparable.json',JSON.stringify(report,null,2));
for(const ref of ['0cc24b7','46d9fad','review']){
  const entries=report.results.filter(r=>r.ref===ref);
  console.log(ref,JSON.stringify({files:entries.length,errors:entries.reduce((s,r)=>s+r.errors,0),warnings:entries.reduce((s,r)=>s+r.warnings,0)}));
}
