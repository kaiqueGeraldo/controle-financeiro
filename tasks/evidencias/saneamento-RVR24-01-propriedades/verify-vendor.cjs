const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const front = path.resolve(__dirname, '../../../controle-financeiro-frontend');
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const results = ['parse', 'revive'].map(name => {
  const original = fs.readFileSync(path.join(front, 'node_modules/lossless-json/lib/esm', name + '.js'), 'utf8');
  const actual = fs.readFileSync(path.join(front, 'src/services/vendor/lossless-json', name + '.js'), 'utf8');
  let expected = original
    .replace("from './numberParsers.js'", "from 'lossless-json'")
    .replace("from './LosslessNumber.js'", "from 'lossless-json'")
    .replace('object[key] = returnedValue;', 'Object.defineProperty(object, key, { value: returnedValue, enumerable: true, writable: true, configurable: true });')
    .replaceAll('object[key] = value;', 'Object.defineProperty(object, key, { value, enumerable: true, writable: true, configurable: true });')
    .replace(/\/\/# sourceMappingURL=.*(?:\r?\n)?$/, '');
  assert.equal(actual.trimEnd(), expected.trimEnd(), 'Only documented edits: ' + name);
  return { name, original: sha(original), patched: sha(actual), documentedEditsOnly: true };
});
fs.writeFileSync(path.join(__dirname, 'vendor-verification.json'), JSON.stringify(results, null, 2) + '\n');
console.log(results);
