import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
const before = JSON.parse(fs.readFileSync(path.join(directory, '../saneamento-P01-P05-2026-09-09/lint-final.json'), 'utf8'));
const current = JSON.parse(fs.readFileSync(path.join(directory, 'lint-atual.json'), 'utf8'));
const normalize = name => name.replaceAll('\\', '/').split('controle-financeiro-frontend/').at(-1);
const files = current.filter(file => file.messages.length).map(file => ({
  file: normalize(file.filePath), errors: file.errorCount, warnings: file.warningCount,
  messages: file.messages.map(m => ({ line: m.line, rule: m.ruleId, severity: m.severity, message: m.message })),
}));
const changes = [];
const oldFiles = new Map(before.files.map(f => [normalize(f.file), f]));
for (const file of files) {
  const old = oldFiles.get(file.file);
  if (!old || old.errors !== file.errors || old.warnings !== file.warnings) changes.push({file: file.file,
    before: { errors: old?.errors ?? 0, warnings: old?.warnings ?? 0 }, after: { errors: file.errors, warnings: file.warnings }, messages: file.messages });
  oldFiles.delete(file.file);
}
for (const [file, old] of oldFiles) changes.push({ file, before: { errors: old.errors, warnings: old.warnings }, after: { errors: 0, warnings: 0 } });
const report = { command: before.command.replace(/--output-file .*/, '--output-file <log>'),
  before: { errors: before.errors, warnings: before.warnings },
  after: { errors: current.reduce((sum, f) => sum + f.errorCount, 0), warnings: current.reduce((sum, f) => sum + f.warningCount, 0) }, changes };
fs.writeFileSync(path.join(directory, 'lint-comparacao.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
