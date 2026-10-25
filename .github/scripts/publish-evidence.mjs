import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {sanitizeFile} from './sanitize.mjs';
import {hash,writeJson} from './source.mjs';

// No XML properties, HTTP state, traces, profiles, .env, SQL or raw fallback.
export const publicFiles=['result.json','package-manifest.json','lint.log','typecheck.log','unit.log','components.log','build.log','backend.log','e2e.log','browser/playwright.log'];
export function collectPublic(rootArg){
  const root=path.resolve(rootArg),output=path.join(root,'public');
  if(fs.existsSync(output))throw new Error('Never reuse a publication directory');
  fs.mkdirSync(root,{recursive:true});
  const pending=path.join(root,'.public-pending-'+randomUUID());fs.mkdirSync(pending);
  const files=[];
  for(const file of publicFiles){
    const input=path.join(root,file);if(!fs.existsSync(input))continue;
    if(!fs.lstatSync(input).isFile()||!fs.realpathSync(input).startsWith(fs.realpathSync(root)+path.sep))throw new Error('Unsafe evidence path');
    const bytes=fs.readFileSync(input),representation=sanitizeFile(bytes.toString('utf8'),file),name=path.basename(file);
    fs.writeFileSync(path.join(pending,name),representation);
    files.push({input:file,rawLocalSha256:hash(bytes),publicFile:name,sanitizedSha256:hash(Buffer.from(representation))});
  }
  writeJson(path.join(pending,'collection.json'),{status:'sanitized',gateResult:files.some(f=>f.input==='result.json')?'present; inspect gate status':'missing; incomplete; no approval inferred',policy:'allowlist; originals retained locally; no arbitrary-secret guarantee',files});
  // Failed transformation leaves only a private pending directory, never public/.
  fs.renameSync(pending,output);return files;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{if(!process.argv[2])throw new Error('Evidence root required');collectPublic(process.argv[2]);}
  catch{console.error('Evidence sanitization/collection failed; publication blocked. Raw originals retained locally.');process.exitCode=1;}
}
