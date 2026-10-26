import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [mode, directory, alternative] = process.argv.slice(2);
const execution = path.resolve(directory ?? '');
const allowed = path.resolve('../controle-financeiro-runtimes/preparacao-adocao') + path.sep;
if (!execution.startsWith(allowed)) throw new Error('Expected a preparation execution');
const root = path.join(execution,'checkout');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inputsFile = path.join(execution,'inputs.json');
const inputs = JSON.parse(fs.readFileSync(inputsFile));
if (inputs.inputs.some(x=>!x.matchesIndex)) throw new Error('Implementation inputs were not committed');
for (const input of inputs.inputs) {
  if (hash(path.join(root,input.file)) !== input.sha256) throw new Error('Input changed: '+input.file);
}
const folder = path.join(execution,'package');
const jar = path.join(folder,'api.jar');
const receiptFile = path.join(folder,'stage.json');
if (mode === 'stage') {
  fs.mkdirSync(folder);
  const built=path.join(root,'controle-financeiro-backend/target/api-0.0.1.jar');
  fs.copyFileSync(built,jar,fs.constants.COPYFILE_EXCL);
  const receipt={inputsCommit:inputs.commit,sourceDigest:inputs.sourceDigest,inputsManifestSha256:hash(inputsFile),
    sha256:hash(jar),bytes:fs.statSync(jar).size,sourceInputs:inputs.inputs.length,
    provenance:'New local build; not the historical main JAR and not a binary reproducibility claim'};
  if(receipt.sha256!==hash(built))throw new Error('Copy differs');
  fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(receipt));
} else if (mode === 'verify') {
  const receipt=JSON.parse(fs.readFileSync(receiptFile));
  const target=alternative?path.resolve(alternative):jar;
  if(!target.startsWith(execution+path.sep))throw new Error('Artifact outside this execution');
  if(receipt.inputsCommit!==inputs.commit || receipt.inputsManifestSha256!==hash(inputsFile)
      || receipt.sourceDigest!==inputs.sourceDigest)throw new Error('Provenance mismatch');
  if(hash(target)!==receipt.sha256 || fs.statSync(target).size!==receipt.bytes)throw new Error('Package SHA256 mismatch');
  console.log('PACKAGE=VERIFIED sha256='+receipt.sha256);
} else {
  throw new Error('Usage: package.mjs stage|verify execution [artifact-under-execution]');
}
