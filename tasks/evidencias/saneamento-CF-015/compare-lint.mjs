import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
const read = file => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8').replace(/^\uFEFF/, ''));
const before = read('../revisao-CF-015/lint-final.json');
const after = read('lint-final.json');
const normalize = file => file.replaceAll('\\', '/').split('controle-financeiro-frontend/').at(-1);
const diagnostics = files => files.flatMap(file => file.messages.map(m => ({ file: normalize(file.filePath), rule: m.ruleId, severity: m.severity, message: m.message })));
const difference = (a, b) => {
  const remaining = [...b];
  return a.filter(item => {
    const index = remaining.findIndex(other => JSON.stringify(other) === JSON.stringify(item));
    if (index < 0) return true;
    remaining.splice(index, 1); return false;
  });
};
const counts = files => ({ errors: files.reduce((n, f) => n + f.errorCount, 0), warnings: files.reduce((n, f) => n + f.warningCount, 0) });
const result = { command: 'node node_modules/eslint/bin/eslint.js . --format json --output-file <log>', before: counts(before), after: counts(after), introduced: difference(diagnostics(after), diagnostics(before)), removed: difference(diagnostics(before), diagnostics(after)), note: 'Mesmos arquivos/escopo; deslocamento de linha não constitui diagnóstico novo. O texto da regra inclui snippets, que precisam de inspeção quando mudam.' };
fs.writeFileSync(path.join(directory, 'lint-comparacao.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
