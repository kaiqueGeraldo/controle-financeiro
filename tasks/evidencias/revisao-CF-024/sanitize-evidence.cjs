const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const records = [];
function visit(dir) {
  for (const name of fs.readdirSync(dir).sort()) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) { visit(file); continue; }
    if (!/\.(log|xml|txt|diff)$/.test(name)) continue;
    const original = fs.readFileSync(file);
    const text = original.toString('utf8');
    const published = Buffer.from(text.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[JWT-redacted]')
      .replace(/("(?:password|senha|novaSenha|recoveryToken|recovery_token|token)"\s*:\s*")[^"\n]*(")/g, '$1[credential-redacted]$2'));
    fs.writeFileSync(file, published);
    records.push({file:path.relative(__dirname,file).replaceAll('\\','/'), originalSha256:sha(original), publishedSha256:sha(published), changed:!original.equals(published)});
  }
}
visit(__dirname);
fs.writeFileSync(path.join(__dirname,'evidence-sha256.json'), JSON.stringify(records,null,2)+'\n');
console.log(`Sanitizados ${records.length} artefatos; valores financeiros, status e assertions preservados.`);
