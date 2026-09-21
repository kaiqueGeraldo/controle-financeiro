import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// O harness histórico escreve capturas no parecer. Arquivar a nova reprodução
// e restaurar somente esses artefatos rastreados, intactos no início da execução.
const paths = execFileSync('git', ['diff', '--name-only', '--', 'tasks/evidencias/revisao-CF-015/visual-conferencia'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
for (const file of paths) {
  const destination = file.replace('revisao-CF-015/visual-conferencia', 'saneamento-CF-015/visual-inicial');
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(file, destination);
  writeFileSync(file, execFileSync('git', ['show', `eb40303:${file}`], { maxBuffer: 20 * 1024 * 1024 }));
}
console.log(`${paths.length} capturas da reprodução arquivadas; parecer original restaurado byte a byte.`);
