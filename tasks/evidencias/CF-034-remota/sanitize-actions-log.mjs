import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {sanitizeText} from '../../../.github/scripts/sanitize.mjs';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';
const [rawArg,publicArg]=process.argv.slice(2),raw=path.resolve(rawArg),output=path.resolve(publicArg);
assert(raw.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));
assert(output.startsWith(import.meta.dirname+path.sep));assert(!fs.existsSync(output));
const bytes=fs.readFileSync(raw);let sanitized;
try{sanitized=sanitizeText(bytes.toString('utf8'));}catch(error){
  const reason=/^Unsafe[\w\s;-]+$/.test(error.message)?error.message:'Shared sanitization rejected the input';
  writeJson(output+'.withheld.json',{status:'withheld; not published',rawLocalSha256:hash(bytes),reason,source:'GitHub job log downloaded via connector; distinct from collector artifacts',rawFallback:false,original:'preserved in external CF-034 runtime and on the platform'});
  console.error('Actions log withheld: shared sanitization rejected the input; original retained externally.');process.exit(1);
}
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,sanitized);
writeJson(output+'.receipt.json',{rawLocalSha256:hash(bytes),sanitizedSha256:hash(Buffer.from(sanitized)),source:'GitHub job log downloaded via connector; distinct from uploaded artifacts',policy:'shared bounded sanitizer; no raw fallback'});
console.log(JSON.stringify({file:path.basename(output),bytes:Buffer.byteLength(sanitized),sha256:hash(Buffer.from(sanitized))}));
