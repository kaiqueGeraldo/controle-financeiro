import {spawn} from 'node:child_process';
import path from 'node:path';
export function spawnOwned(executable,args,options){
  const {ownership,...nativeOptions}=options;
  if(process.platform==='win32'){
    const configuration=Buffer.from(JSON.stringify({executable,args,cwd:options.cwd,ownership})).toString('base64');
    const windows=process.env.SystemRoot??'C:\\Windows';
    return spawn(path.join(windows,'System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(import.meta.dirname,'owned-process.ps1'),'-Configuration',configuration],{...nativeOptions,windowsHide:true,stdio:['pipe','pipe','pipe']});
  }
  if(ownership)throw new Error('Durable owned-job recovery requires Windows; no unverified fallback');
  return spawn(executable,args,{...nativeOptions,detached:true,stdio:['ignore','pipe','pipe']});
}
export function stopOwned(child){
  if(process.platform==='win32'){if(!child.stdin.destroyed&&!child.stdin.writableEnded)child.stdin.end();}
  else if(child.exitCode===null&&child.signalCode===null)process.kill(-child.pid,'SIGTERM');
}
