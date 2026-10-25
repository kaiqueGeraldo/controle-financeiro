import fs from 'node:fs';
import path from 'node:path';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';

const repo=process.cwd();
const historical=JSON.parse(fs.readFileSync('tasks/evidencias/revalidacao-CF033-01/preservation-final.json'));
const inputs=historical.files.filter(f=>!path.resolve(f.path).startsWith(repo+path.sep));
const files=inputs.map(f=>{
  const actual=fs.existsSync(f.path)?hash(fs.readFileSync(f.path)).toUpperCase():null;
  return {path:f.path,expected:f.after,observed:actual,matches:actual===f.after};
});
const readme=hash(fs.readFileSync('README.md')).toUpperCase();
const originalAudit=JSON.parse(fs.readFileSync('tasks/evidencias/CF-034/historical-hashes.json'));
const historicalFiles=originalAudit.entries.map(f=>{
  const observed=hash(fs.readFileSync(f.path)).toUpperCase();
  return {path:f.path,initialObserved:f.observedSha256,observed,matches:observed===f.observedSha256};
});
writeJson('tasks/evidencias/CF-034/preservation.json',{at:new Date().toISOString(),
  source:'revalidacao-CF033-01/preservation-final.json, only external historical runtime paths',
  readme:{expected:'6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA',observed:readme},
  checked:files.length,mismatches:files.filter(f=>!f.matches).length,files,
  historicalAudit:{checked:historicalFiles.length,mismatches:historicalFiles.filter(f=>!f.matches).length,files:historicalFiles}});
console.log(JSON.stringify({runtimes:files.length,mismatches:files.filter(f=>!f.matches).length,readme}));
