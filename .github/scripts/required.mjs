import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Single policy for the aggregate. Workflow needs must match these keys; the
// structural contract detects drift. No job may vanish because its result is absent.
export const jobRequirements=Object.freeze({'windows-native':'always',linux:'always',expanded:'expanded'});
function expectedResults(eventName,suite){
  if(!['push','pull_request','workflow_dispatch'].includes(eventName))throw new Error('unsupported event');
  if(eventName==='workflow_dispatch'?!['smoke','expanded'].includes(suite):!['','smoke'].includes(suite))throw new Error('unsupported suite');
  const expanded=eventName==='workflow_dispatch'&&suite==='expanded';
  return Object.fromEntries(Object.entries(jobRequirements).map(([job,when])=>[job,when==='always'||expanded?'success':'skipped']));
}
export function evaluateRequired(needsJson,eventName,suite=''){
  let expected,needs;
  try{expected=expectedResults(eventName,suite);}catch{return {approved:false,problems:['invalid execution mode']};}
  try{needs=JSON.parse(needsJson);}catch{return {approved:false,problems:['invalid needs JSON']};}
  if(!needs||typeof needs!=='object'||Array.isArray(needs))return {approved:false,problems:['needs must be a job-result object']};
  const problems=[];
  if(Object.keys(needs).some(job=>!Object.hasOwn(expected,job)))problems.push('unexpected job entries');
  for(const [job,wanted] of Object.entries(expected)){
    if(!Object.hasOwn(needs,job)){problems.push(`${job}: missing job`);continue;}
    const entry=needs[job];
    if(!entry||typeof entry!=='object'||Array.isArray(entry)||!Object.hasOwn(entry,'result')){problems.push(`${job}: missing result`);continue;}
    const result=entry.result;
    if(result!==wanted){
      // Never print payloads, outputs or unknown result values: only trusted IDs
      // and known status tokens enter the diagnosis.
      const status=['success','failure','cancelled','skipped'].includes(result)?result:'unknown result';
      problems.push(`${job}: ${status}; expected ${wanted}`);
    }
  }
  return {approved:problems.length===0,required:Object.keys(expected).filter(job=>expected[job]==='success'),notApplicable:Object.keys(expected).filter(job=>expected[job]==='skipped'),problems};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=evaluateRequired(process.env.NEEDS_JSON,process.env.GITHUB_EVENT_NAME,process.env.CF_REQUIRED_SUITE??'');
  if(!result.approved){console.error(`Required rejected: ${result.problems.join('; ')}`);process.exitCode=1;}
  else console.log(`Required passed: ${result.required.join(', ')}; not applicable: ${result.notApplicable.join(', ')||'none'}`);
}
