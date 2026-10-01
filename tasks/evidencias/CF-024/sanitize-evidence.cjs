const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const records = [];
const root = __dirname;
for (const name of fs.readdirSync(path.join(root, 'logs')).sort()) {
  if (!name.endsWith('.log')) continue;
  const file = path.join(root, 'logs', name);
  const original = fs.readFileSync(file);
  const text = original.toString('utf8');
  const sanitized = text.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<JWT-redacted>')
    .replace(/("(?:password|senha|novaSenha|recoveryToken|recovery_token|token)"\s*:\s*")[^"\n]*(")/g, '$1<credential-redacted>$2')
    .replace(/synthetic-hash/g, '<synthetic-hash-redacted>');
  const published = Buffer.from(sanitized);
  fs.writeFileSync(file, published);
  records.push({ file: `logs/${name}`, originalSha256: crypto.createHash('sha256').update(original).digest('hex'),
    publishedSha256: crypto.createHash('sha256').update(published).digest('hex'), changed: text !== sanitized });
}
fs.writeFileSync(path.join(root, 'evidence-sha256.json'), JSON.stringify(records, null, 2) + '\n');
console.log(`Sanitizados ${records.length} logs; campos financeiros e assertions preservados.`);
