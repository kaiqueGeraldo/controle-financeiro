const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve('tasks/evidencias/CF-023');
const records = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.log')) {
      const original = fs.readFileSync(file);
      const content = original.toString('utf8');
      const sanitized = content
        .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<JWT-redacted>')
        .replace(/("(?:password|senha|novaSenha|recoveryToken|recovery_token|token)"\s*:\s*")[^"\n]*(")/g, '$1<credential-redacted>$2')
        .replace(/synthetic-hash/g, '<synthetic-hash-redacted>');
      fs.writeFileSync(file, sanitized);
      records.push({ file: path.relative(root, file).replaceAll('\\', '/'),
        originalSha256: crypto.createHash('sha256').update(original).digest('hex'),
        publishedSha256: crypto.createHash('sha256').update(sanitized).digest('hex'),
        changed: sanitized !== content });
    }
  }
}
walk(root);
fs.writeFileSync(path.join(root, 'evidence-sha256.json'), JSON.stringify(records, null, 2));
console.log(`Sanitized ${records.length} logs; JWT/password/recovery values removed from published evidence.`);
