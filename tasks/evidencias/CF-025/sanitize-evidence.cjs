const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const records = [];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const name of fs.readdirSync(path.join(__dirname, 'logs')).sort()) {
  if (!name.endsWith('.log')) continue;
  const file = path.join(__dirname, 'logs', name);
  const original = fs.readFileSync(file);
  const text = original.toString('utf8');
  const sanitized = text.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<JWT-redacted>')
    .replace(/("(?:password|senha|novaSenha|recoveryToken|recovery_token|token)"\s*:\s*")[^"\n]*(")/g, '$1<credential-redacted>$2')
    .replace(/synthetic-hash/g, '<synthetic-hash-redacted>');
  const published = Buffer.from(sanitized);
  fs.writeFileSync(file, published);
  records.push({ file: `logs/${name}`, originalSha256: sha(original), publishedSha256: sha(published), changed: text !== sanitized });
}
fs.writeFileSync(path.join(__dirname, 'evidence-sha256.json'), JSON.stringify(records, null, 2) + '\n');
console.log(`Sanitized ${records.length} logs; financial values/assertions preserved.`);
