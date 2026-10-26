import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const execution=path.resolve(process.argv[2]??'');
const allowed=path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep;
if(!execution.startsWith(allowed))throw new Error('Disposable preparation execution required');
const root=path.join(execution,'checkout');
const {backendSelection}=await import(pathToFileURL(path.join(root,'.github/scripts/suites.mjs')));
const selection=backendSelection(root,'required');
selection.separatelyVerified=selection.selected.filter(x=>x.endsWith('.AdoptionRuntimeTest'));
selection.selected=selection.selected.filter(x=>!selection.separatelyVerified.includes(x));
selection.rationale='Shared startup/filter/scheduling changes justify required backend regression on PG16; real-process adoption matrix already runs separately on PG17. Historical browser matrix remains deferred.';
fs.writeFileSync(path.join(execution,'backend-selection.json'),JSON.stringify(selection,null,2)+'\n',{flag:'wx'});
const args=['--batch-mode','-Duser.timezone=UTC','-Dcf017.postgres.major=16','-Dspring.test.context.cache.maxSize=4',
  '-Dtest='+selection.selected.join(','),'-Dcf034.reportsDirectory='+path.join(execution,'pg16-reports'),'verify'];
fs.writeFileSync(path.join(execution,'pg16-command.json'),JSON.stringify(['mvnw.cmd',...args],null,2)+'\n',{flag:'wx'});
const fd=fs.openSync(path.join(execution,'pg16-regression.log'),'wx');
const result=spawnSync(process.env.ComSpec??'cmd.exe',['/d','/c','mvnw.cmd',...args],{
  cwd:path.join(root,'controle-financeiro-backend'),env:process.env,stdio:['ignore',fd,fd]});
fs.closeSync(fd);
if(result.error)throw result.error;
console.log(JSON.stringify({exitCode:result.status,selectedClasses:selection.selected.length,existingDeferred:selection.deferred.length}));
process.exitCode=result.status??1;
