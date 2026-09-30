// Gate histórico de bytes. Não impõe imutabilidade ao produto atual.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex').toUpperCase();
const snapshot=JSON.parse((await readFile(new URL('tasks/evidencias/CF-016/base-inicial.json',root),'utf8')).replace(/^\uFEFF/,''));
assert.equal(snapshot.base,'45e156c3189fd9893a88e6adcc0df3903983f4b9');
const allowedChanges=new Set(['tasks/03-integridade/CF-016-regras-financeiras.md',
  'docs/sdd/README.md','docs/sdd/arquitetura.md','docs/sdd/specs/003-criterios-oracles.md']);
let preserved=0;
const changed=[];
for(const item of snapshot.files){
  const hash=sha(await readFile(new URL(item.path,root)));
  if(hash===item.sha256)preserved++;
  else{
    assert.ok(allowedChanges.has(item.path),`arquivo preexistente alterado fora do escopo: ${item.path}`);
    changed.push(item.path);
  }
}
console.log(`Preservacao historica: ${preserved}/${snapshot.files.length} arquivos iniciais identicos; alteracoes autorizadas: ${changed.join(', ')}.`);
console.log(`README raiz SHA256: ${sha(await readFile(new URL('README.md',root)))}`);
