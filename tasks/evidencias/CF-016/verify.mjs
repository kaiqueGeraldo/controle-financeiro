// Verifica somente artefatos de especificacao. Nao importa nem executa produto.
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../../../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex').toUpperCase();
const cents = (value) => {
  assert.match(value, /^-?(?:0|[1-9]\d*)\.\d{2}$/, `decimal nao canonico: ${value}`);
  return BigInt(value.replace('.', ''));
};
const lines = (await read('tasks/evidencias/CF-016/eventos.csv')).trim().split(/\r?\n/);
const columns = lines.shift().split(',');
assert.equal(columns.length, 21);
const rows = lines.map((line) => {
  const cells = line.split(',');
  assert.equal(cells.length, columns.length, `colunas ${cells[0]}`);
  return Object.fromEntries(columns.map((key, i) => [key, cells[i]]));
});
const precision = JSON.parse(await read('tasks/evidencias/CF-016/precisao.json'));

function verifyRows(table) {
  assert.equal(table.length, 49);
  const seen = new Map();
  for (const [i, row] of table.entries()) {
    assert.equal(row.id, `E${String(i + 1).padStart(2, '0')}`, 'IDs estaveis e unicos');
    const m = Object.fromEntries(columns.slice(3).map((key) => [key, cents(row[key])]));
    assert.equal(m.wealth, m.accountA + m.accountB + m.investmentValue + m.cardCredit - m.debt,
      `${row.id}: identidade patrimonial sem somar reserva/custo`);
    assert.equal(m.freeA, m.accountA - m.reserveA, `${row.id}: saldo livre`);
    for (const key of ['investmentValue', 'investmentCost', 'debt', 'cardCredit',
      'reserveA', 'reserveInvestment', 'cashIn', 'cashOut', 'pendingIncome', 'pendingExpense']) {
      assert.ok(m[key] >= 0n, `${row.id}: ${key} negativo`);
    }
    if (row.parent === 'OPEN') {
      for (const key of columns.slice(13)) {
        assert.equal(m[key], 0n, `${row.id}: abertura nao e fluxo/resultado/previsao`);
      }
    } else {
      assert.ok(seen.has(row.parent), `${row.id}: predecessor inexistente/ciclico`);
      const p = seen.get(row.parent);
      assert.equal(m.accountA + m.accountB - p.accountA - p.accountB, m.cashIn - m.cashOut,
        `${row.id}: ponte de caixa`);
      const unrealizedDelta = (m.investmentValue - m.investmentCost) - (p.investmentValue - p.investmentCost);
      assert.equal(m.wealth - p.wealth, m.income - m.expense + m.realizedGain + unrealizedDelta,
        `${row.id}: resultado e avaliacao reconciliam patrimonio`);
    }
    seen.set(row.id, m);
  }
  for (const id of ['E02', 'E03', 'E06', 'E07', 'E08', 'E10', 'E11', 'E12',
    'E15', 'E24', 'E31', 'E32', 'E37', 'E38', 'E39', 'E40', 'E42', 'E44', 'E47', 'E49']) {
    for (const key of ['income', 'expense', 'realizedGain', 'cardPurchases']) {
      assert.equal(seen.get(id)[key], 0n, `${id}: evento nao cria resultado`);
    }
  }
  for (const key of columns.slice(3, 13)) {
    assert.equal(seen.get('E32')[key], seen.get('E06')[key], 'replay preserva posicao');
  }
  assert.equal(seen.get('E04').pendingIncome + seen.get('E04').income, 25000n);
  assert.equal(seen.get('E04').income + seen.get('E05').income, 25000n);
  assert.equal(seen.get('E26').realizedGain + seen.get('E29').realizedGain, 4700n);
  assert.equal(seen.get('E34').expense + seen.get('E35').expense, -10000n);
  assert.equal(seen.get('E13').reserveInvestment - seen.get('E13').investmentValue, 5000n);
  return seen;
}

// Aritmetica racional de documentacao; numerador ja expresso em centavos.
function roundedFraction(n, d) {
  assert.ok(n >= 0n && d > 0n);
  return n / d + ((n % d) * 2n >= d ? 1n : 0n);
}
function verifyPrecision(data) {
  assert.equal(data.seed, 'cf016-v1');
  assert.equal(data.rounding.length, 3);
  for (const row of data.rounding) {
    assert.equal(cents(row.expected), roundedFraction(BigInt(row.numerator), BigInt(row.denominator)),
      `${row.id}: HALF_UP independente`);
  }
  for (const row of data.installments) {
    const total = cents(row.total);
    const parts = row.expected.map(cents);
    assert.equal(parts.reduce((a, b) => a + b, 0n), total, `${row.id}: soma parcelas`);
    const base = total / BigInt(parts.length);
    parts.slice(0, -1).forEach((part) => assert.equal(part, base, `${row.id}: resto so na ultima parcela`));
    assert.ok(parts.every((part) => part > 0n));
  }
  let remaining = cents(data.costReleases.total);
  let units = BigInt(data.costReleases.initialUnits);
  for (const value of data.costReleases.expected) {
    const released = cents(value);
    assert.equal(released, roundedFraction(remaining, units), 'custo proporcional remanescente');
    remaining -= released;
    units -= 1n;
  }
  assert.equal(remaining, 0n);
  assert.equal(units, 0n);
}

const states = verifyRows(rows);
verifyPrecision(precision);
const cf001 = JSON.parse(await read('controle-financeiro-frontend/tests/oracles/cf001.json'));
const inherited = new Map(cf001.cases.map((item) => [item.id, item]));
for (const [id, originalId, fieldMap] of [
  ['E02', 'F-OPEN', { wealth: 'netWorth', freeA: 'freeAccount', income: 'openingIncome' }],
  ['E03', 'F-PENDING', { accountA: 'account', investmentValue: 'investment', debt: 'debt', wealth: 'netWorth', income: 'realizedIncome', pendingIncome: 'pendingIncome' }],
  ['E06', 'F-PAY', { accountA: 'account', debt: 'debt', wealth: 'netWorth', freeA: 'freeAccount', cashOut: 'cashOutflow' }],
  ['E20', 'F-NEGATIVE', { wealth: 'netWorth', freeA: 'freeAccount', income: 'openingIncome' }],
  ['E21', 'F-ZERO', { wealth: 'netWorth', freeA: 'freeAccount', income: 'openingIncome' }],
  ['E43', 'F-INSTALLMENTS', { debt: 'totalOutstanding' }],
]) {
  for (const [field, oldField] of Object.entries(fieldMap)) {
    assert.equal(states.get(id)[field], cents(inherited.get(originalId).expected[oldField]),
      `${id} preserva ${originalId}.${oldField}`);
  }
}
assert.equal(states.get('E22').accountA, cents(inherited.get('F-CENTS').expectedTotal));

const documents = [
  'docs/sdd/specs/004-regras-financeiras.md',
  'tasks/03-integridade/CF-016-regras-financeiras.md',
  'tasks/evidencias/CF-016/ORACLES.md',
  'tasks/evidencias/CF-016/DIVERGENCIAS.md',
  'tasks/evidencias/CF-016/README.md',
  'tasks/evidencias/CF-016/EXECUCOES.md',
];
let linkCount = 0;
for (const path of documents) {
  const content = await read(path);
  for (const [, target] of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|#)/.test(target)) continue;
    const [local, fragment] = target.split('#');
    const url = new URL(local, new URL(path, root));
    assert.ok(url.href.startsWith(root.href), `link externo ao repositorio ${target}`);
    await access(url);
    if (/^L\d+$/.test(fragment ?? '')) {
      assert.ok(Number(fragment.slice(1)) <= (await readFile(url, 'utf8')).split(/\r?\n/).length,
        `linha inexistente ${target}`);
    }
    linkCount++;
  }
}
const guide = await read('tasks/evidencias/CF-016/ORACLES.md');
assert.equal((guide.match(/^\| B\d{2} \|/gm) ?? []).length, 18);
const findings = (await read('tasks/evidencias/CF-016/DIVERGENCIAS.md')).split(/\r?\n/)
  .filter((line) => /^\| D16-\d{2} P[12]/.test(line));
assert.equal(findings.length, 15);
findings.forEach((line) => assert.match(line.split('|').at(-2), /CF-\d{3}/, 'divergencia sem dona'));

const snapshot = JSON.parse((await read('tasks/evidencias/CF-016/base-inicial.json')).replace(/^\uFEFF/, ''));
assert.equal(snapshot.base, '45e156c3189fd9893a88e6adcc0df3903983f4b9');
const allowedChanges = new Set(['tasks/03-integridade/CF-016-regras-financeiras.md',
  'docs/sdd/README.md', 'docs/sdd/arquitetura.md', 'docs/sdd/specs/003-criterios-oracles.md']);
let preserved = 0;
const changed = [];
for (const item of snapshot.files) {
  const hash = sha(await readFile(new URL(item.path, root)));
  if (hash === item.sha256) preserved++;
  else {
    assert.ok(allowedChanges.has(item.path), `arquivo preexistente alterado fora do escopo: ${item.path}`);
    changed.push(item.path);
  }
}

console.log(`CF-016: ${rows.length} estados reconciliados; 18 bordas documentadas; 15 divergencias com donas; ${linkCount} links validos.`);
console.log('Precisao racional/parcelas/custo aprovados; 7 casos CF-001 compativeis. Camada: documental, sem runtime de produto.');
console.log(`Preservacao: ${preserved}/${snapshot.files.length} arquivos iniciais identicos; alteracoes autorizadas: ${changed.join(', ')}.`);
console.log(`README raiz SHA256: ${sha(await readFile(new URL('README.md', root)))}`);

if (process.argv.includes('--adversarial')) {
  const mutations = [
    ['abertura-como-renda', 'abertura nao e fluxo', (table) => { table[0].income = '1000.00'; }],
    ['pendente-como-realizado', 'resultado e avaliacao', (table) => { table[2].income = '250.00'; }],
    ['meta-como-ativo', 'identidade patrimonial', (table) => { table[1].wealth = '1600.00'; }],
    ['pagamento-como-consumo', 'resultado e avaliacao', (table) => { table[5].expense = '200.00'; }],
    ['resgate-como-ganho', 'resultado e avaliacao', (table) => { table[25].realizedGain = '99.00'; }],
    ['centavo-na-primeira', 'resto so na ultima', (_table, data) => {
      data.installments[0].expected = ['33.34', '33.33', '33.33'];
    }],
  ];
  for (const [name, expectedMessage, mutate] of mutations) {
    const copy = structuredClone(rows);
    const precisionCopy = structuredClone(precision);
    mutate(copy, precisionCopy);
    let rejection;
    try { verifyRows(copy); verifyPrecision(precisionCopy); } catch (error) { rejection = error; }
    assert.ok(rejection instanceof assert.AssertionError, `${name}: mutacao nao detectada por assertion`);
    assert.ok(rejection.message.includes(expectedMessage), `${name}: causa inesperada ${rejection.message}`);
    console.log(`REJEITADA ${name}: ${rejection.message.split('\n')[0]}`);
  }
  verifyRows(rows);
  verifyPrecision(precision);
  console.log('6/6 mutacoes documentais rejeitadas em memoria; dados canonicos intactos. Nao prova regressao de produto.');
}
