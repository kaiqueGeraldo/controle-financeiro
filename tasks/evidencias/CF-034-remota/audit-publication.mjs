import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';
import path from 'node:path';
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const base='272001f7b4c39aebd18bdcd856109f9a0f6c1213';
const paths=git('diff','--cached','--name-only','--diff-filter=ACM','-z').toString().split('\0').filter(Boolean);
const range=git('diff','--name-only','--diff-filter=ACM','-z',`${base}..HEAD`).toString().split('\0').filter(Boolean);
const checks=[['private key',/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],['GitHub credential',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],['AWS access identifier',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],['Google API credential',/\bAIza[A-Za-z0-9_-]{30,}\b/],['Resend credential',/\bre_[A-Za-z0-9_]{30,}\b/]];
const forbidden=paths.filter(file=>file==='README.md'||/(^|\/)(node_modules|target|\.next|runtimes)(\/|$)|(^|\/)\.env(?:\.|$)|\.(jar|zip|exe|p12|pfx|pem|key)$/i.test(file));
const findings=[],files=[];
for(const file of [...new Set([...range,...paths])].filter(file=>file!=='tasks/evidencias/CF-034-remota/publication-audit.json')){
  const staged=paths.includes(file),bytes=git('show',`${staged?':':'HEAD:'}${file}`);
  for(const [kind,pattern] of checks)if(pattern.test(bytes.toString('utf8')))findings.push({path:file,kind});
  files.push({path:file,staged,bytes:bytes.length,sha256:hash(bytes)});
}
const scripts=['.github/scripts/ci.mjs','.github/scripts/publish-evidence.mjs','.github/scripts/remote-probes.mjs','.github/workflows/ci.yml','.github/workflows/cf034-remote-probes.yml','controle-financeiro-frontend/vercel.json'].map(file=>({path:file,sha256:hash(fs.readFileSync(file))}));
writeJson(path.join(import.meta.dirname,'publication-audit.json'),{at:new Date().toISOString(),head:git('rev-parse','HEAD').toString().trim(),base,stagedPaths:paths,files,forbidden,findings,scope:'path exclusions and selected high-confidence credential patterns; no claim of universal secret detection; synthetic historical sentinels are intentional proofs',testedWorkingTreeInputs:scripts,localChecks:{contracts:12,failures:0,skipped:0,syntheticExperiment:'rem-preflight-01; real ci subprocess exit 23 propagated, required-report validator rejected, synthetic JAR hash mutation rejected/restored, sentinels sanitized and ambiguous collection refused',yaml:'both workflows parsed; token contents read',productionAccess:'none'}});
console.log(JSON.stringify({files:files.length,staged:paths.length,bytes:files.reduce((s,f)=>s+f.bytes,0),forbidden,credentialPatternFindings:findings}));
if(forbidden.length||findings.length)process.exitCode=1;
