import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const evidence = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(evidence, '../../..');
const frontend = path.join(root, 'controle-financeiro-frontend');
const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'cf015-mutation-'));
for (const folder of ['src', 'tests/component']) fs.cpSync(path.join(frontend, folder), path.join(copy, folder), { recursive: true });
for (const file of ['package.json', 'tsconfig.json']) fs.copyFileSync(path.join(frontend, file), path.join(copy, file));
fs.symlinkSync(path.join(frontend, 'node_modules'), path.join(copy, 'node_modules'), 'junction');
const hash = text => createHash('sha256').update(text).digest('hex');
const cases = [
  { id: 'M01-utc-default', file: 'src/utils/date.ts', tz: 'America/Sao_Paulo', test: 'temporal-forms.test.tsx',
    change: text => text.replace(/export function localDateString\(date: Date = new Date\(\)\): string \{[\s\S]*?\n\}/,
      'export function localDateString(date: Date = new Date()): string { return date.toISOString().slice(0, 10); }') },
  { id: 'M02-stale-product-day', file: 'src/contexts/browserTodayContext.tsx', tz: 'Pacific/Kiritimati', test: 'habit-product-day.test.tsx',
    change: text => text.replace('Math.min(delayUntilNextLocalDay(now), delayUntilNextProductDay(now))', '2147483647') },
];
const results = [];
for (const mutation of cases) {
  const target = path.join(copy, mutation.file);
  const before = fs.readFileSync(target, 'utf8');
  const changed = mutation.change(before);
  if (changed === before) throw new Error(`Mutation did not match: ${mutation.id}`);
  try {
    fs.writeFileSync(target, changed);
    const result = spawnSync(process.execPath, [path.join(frontend, 'node_modules/vitest/vitest.mjs'), 'run', '--root', copy,
      '--config', path.join(copy, 'tests/component/vitest.config.mts'), `tests/component/${mutation.test}`],
      { cwd: copy, encoding: 'utf8', windowsHide: true, env: { ...process.env, TZ: mutation.tz } });
    fs.writeFileSync(path.join(evidence, `${mutation.id}.log`), result.stdout + result.stderr);
    results.push({ id: mutation.id, exit: result.status, file: mutation.file, test: mutation.test, timezone: mutation.tz,
      originalSHA256: hash(before), mutatedSHA256: hash(changed) });
  } finally { fs.writeFileSync(target, before); }
  results.at(-1).restored = fs.readFileSync(target, 'utf8') === before;
  results.at(-1).workingTreeUnchanged = fs.readFileSync(path.join(frontend, mutation.file), 'utf8') === before;
}
fs.writeFileSync(path.join(evidence, 'mutations.json'), JSON.stringify({ copy, results }, null, 2));
console.log(JSON.stringify(results, null, 2));
