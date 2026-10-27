import fs from 'node:fs';
import path from 'node:path';

/** A failing JVM is insufficient. Require exactly the selected failing assertion,
 * no errors/skips, and the case-specific observable causal effect. */
export function validateObservation(result,experiment) {
  if(result.status!==1)throw Error('Mutation survived or observer/tool failed');
  const reports=fs.readdirSync(result.reports).filter(f=>f.endsWith('.xml'));
  if(reports.length!==1)throw Error('Expected one fresh JUnit report');
  const report=path.join(result.reports,reports[0]),xml=fs.readFileSync(report,'utf8');
  if(!/<\/testsuite>\s*$/.test(xml)||[...xml.matchAll(/<testcase\b/g)].length!==1
    ||[...xml.matchAll(/<failure\b/g)].length!==1)throw Error('Incomplete or inconsistent JUnit report');
  const header=xml.match(/<testsuite\b([^>]*)>/)?.[1]??'';
  const attrs=Object.fromEntries([...header.matchAll(/([\w.-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  if(attrs.tests!=='1'||attrs.failures!=='1'||attrs.errors!=='0'||attrs.skipped!=='0'
    ||!xml.includes('name="'+experiment.method+'"')||!/<failure\b/.test(xml)||/<(?:error|skipped)\b/.test(xml))throw Error('Failure is not the selected assertion');
  if(experiment.test&&!attrs.name?.endsWith('.'+experiment.test.split('#')[0]))throw Error('Wrong JUnit class');
  const failure=xml.match(/<failure\b[\s\S]*?<\/failure>/)?.[0]??'';
  if(!experiment.failure.every(marker=>failure.includes(marker)))throw Error('Assertion failed before causal effect');
  const log=fs.readFileSync(result.log,'utf8');
  if(experiment.diagnostic&&!log.includes(experiment.diagnostic))throw Error('Missing causal effect');
  const files=[result.log,report];
  if(experiment.childDiagnostic) {
    const matching=(result.children??[]).filter(file=>fs.readFileSync(file,'utf8').includes(experiment.childDiagnostic));
    if(!matching.length)throw Error('Missing bootstrap migration proof');
    files.push(...matching);
  }
  return {causal:true,assertionDetected:true,files,method:experiment.method};
}
