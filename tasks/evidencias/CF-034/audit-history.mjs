import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root = process.cwd();
const sha = b => createHash('sha256').update(b).digest('hex').toUpperCase();
const git = (...args) => execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const old = JSON.parse(fs.readFileSync('tasks/evidencias/CF015-zoom-gate-CF034/historico-eol.json'));
const entries = old.entries.map(entry => {
  const relative = path.relative(root,entry.path).split(path.sep).join('/');
  const bytes = fs.readFileSync(entry.path);
  const text = bytes.toString('utf8');
  const lf = text.replace(/\r\n/g,'\n');
  const candidates = {raw:bytes,lf:Buffer.from(lf),crlf:Buffer.from(lf.replace(/\n/g,'\r\n'))};
  const transformations = Object.entries(candidates).map(([name,b])=>({name,sha256:sha(b),matchesOriginal:sha(b)===entry.historical}));
  const bases = ['d059bc9','e1a01b6','79ce089'].map(base=> {
    const blob = git('rev-parse',`${base}:${relative}`);
    const content = execFileSync('git',['cat-file','blob',blob],{cwd:root,maxBuffer:20*1024*1024});
    return {base,blob,sha256:sha(content),lfMatchesObserved:sha(content)===sha(candidates.lf)};
  });
  const canonical = git('hash-object',`--path=${relative}`,'--',entry.path);
  return {path:relative,originalSha256:entry.historical,previousObservedSha256:entry.currentRaw,observedSha256:sha(bytes),stableSincePrevious:sha(bytes)===entry.currentRaw,canonical,canonicalMatchesBases:bases.every(b=>b.blob===canonical),transformations,bases,
    classification:transformations.some(t=>t.matchesOriginal)?'original bytes reconstructed by recorded transformation':'original byte representation unresolved; approved versioned content independently verified'};
});
const result = {date:'2026-10-24',head:git('rev-parse','HEAD'),sourceManifest:'tasks/evidencias/CF015-zoom-gate-CF034/historico-eol.json',originalPreservationManifest:'tasks/evidencias/revalidacao-CF033-01/preservation-final.json',coreAutocrlf:git('config','--get','core.autocrlf'),entries,
  summary:{files:entries.length,canonicalMatches:entries.filter(e=>e.canonicalMatchesBases).length,stableObserved:entries.filter(e=>e.stableSincePrevious).length,reconstructed:entries.filter(e=>e.transformations.some(t=>t.matchesOriginal)).length,unresolvedOriginalBytes:entries.filter(e=>!e.transformations.some(t=>t.matchesOriginal)).length},
  limit:'A canonical Git match proves approved versioned content, not the original unversioned bytes or the time/cause of their transformation. No historical file or manifest is rewritten. New packages must use fresh source and test manifests.'};
fs.writeFileSync('tasks/evidencias/CF-034/historical-hashes.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.summary));
if(!entries.every(e=>e.canonicalMatchesBases))process.exitCode=1;
