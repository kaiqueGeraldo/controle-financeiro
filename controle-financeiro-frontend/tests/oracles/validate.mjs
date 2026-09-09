// Checks specification artifacts only. Does not load or exercise application code.
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../../../", import.meta.url);
const read = async (path) => readFile(new URL(path, root), "utf8");
const fixture = JSON.parse(await read("controle-financeiro-frontend/tests/oracles/cf001.json"));
const spec = await read("docs/sdd/specs/003-criterios-oracles.md");
const criterionRows = spec.split(/\r?\n/).filter((line) => /^\| AC-(TIME|UI|FIN)-\d{3} \|/.test(line));
const criteria = criterionRows.map((line) => line.split("|")[1].trim());
assert.equal(new Set(criteria).size, criteria.length, "IDs de critério duplicados");
assert.equal(criteria.length, 39, "Revisar inventário se o escopo dos critérios mudar");

const findings = spec.split(/\r?\n/).filter((line) => /^\| F-\d{3} \|/.test(line));
assert.deepEqual(findings.map((line) => line.split("|")[1].trim()),
  Array.from({ length: 17 }, (_, i) => `F-${String(i + 1).padStart(3, "0")}`),
  "Cada achado F-001 a F-017 precisa de uma linha própria");
for (const row of findings) {
  assert.match(row, /AC-(TIME|UI|FIN)-\d{3}/, "Achado sem critério");
  assert.match(row, /CF-\d{3}/, "Achado sem tarefa");
}
for (const id of spec.match(/AC-(?:TIME|UI|FIN)-\d{3}/g) ?? []) {
  assert.ok(criteria.includes(id), `Critério não definido: ${id}`);
}

const taskFiles = await readdir(new URL("tasks/", root), { recursive: true });
const taskIds = new Set(taskFiles.map((path) => path.match(/(?:^|[/\\])(CF-\d{3})-/)?.[1]).filter(Boolean));
for (const group of spec.match(/CF-\d{3}(?:\/\d{3})*/g) ?? []) {
  for (const suffix of group.slice(3).split("/")) {
    assert.ok(taskIds.has(`CF-${suffix}`), `Tarefa inexistente: CF-${suffix}`);
  }
}
for (const row of criterionRows) assert.match(row.split("|").at(-2), /CF-\d{3}/, "Critério sem dona");

const documents = [
  "docs/sdd/specs/003-criterios-oracles.md",
  "docs/sdd/specs/003-roteiro-exploratorio.md",
  "controle-financeiro-frontend/tests/oracles/README.md",
  "tasks/evidencias/CF-001/revisao-testes.md",
  "tasks/evidencias/CF-001/README.md",
  "tasks/00-fundacao/CF-001-criterios-e-oracles.md",
];
let links = 0;
for (const path of documents) {
  for (const [, target] of (await read(path)).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|#)/.test(target)) continue;
    const resolved = new URL(target.split("#")[0], new URL(path, root));
    assert.ok(fileURLToPath(resolved).startsWith(fileURLToPath(root)), `Link fora do repositório: ${target}`);
    await access(resolved);
    links++;
  }
}

assert.equal(fixture.seed, "cf001-v1");
assert.equal(fixture.currency, "BRL");
assert.equal(fixture.moneyScale, 2);
assert.deepEqual(fixture.users.map((u) => u.alias), ["A", "B"]);
const identities = [...fixture.users, ...fixture.entities];
assert.equal(new Set(identities.map((entry) => entry.id)).size, identities.length, "IDs repetidos");
assert.equal(new Set(identities.map((entry) => entry.alias)).size, identities.length, "Aliases repetidos");
for (const entry of identities) assert.match(entry.id, /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/);
for (const user of fixture.users) assert.match(user.email, /@example\.invalid$/);
for (const entity of fixture.entities) {
  assert.ok(fixture.users.some((user) => user.alias === entity.owner), "Owner desconhecido");
  if (entity.source) {
    const source = fixture.entities.find((entry) => entry.alias === entity.source);
    assert.equal(source?.owner, entity.owner, "Fixture válida referencia fonte de outro usuário");
  }
}
const cases = new Map(fixture.cases.map((entry) => [entry.id, entry]));
assert.equal(cases.size, fixture.cases.length, "IDs de cenário duplicados");
for (const entry of fixture.cases) {
  assert.ok(entry.source && entry.criteria.length, `Sem fonte/critério: ${entry.id}`);
  for (const id of entry.criteria) assert.ok(criteria.includes(id), `Critério inválido em ${entry.id}: ${id}`);
  if (entry.actor) assert.ok(fixture.users.some((user) => user.alias === entry.actor));
  for (const decision of JSON.stringify(entry).match(/DEC-\d{2}/g) ?? []) {
    assert.ok(spec.includes(`| ${decision} |`), `Decisão indefinida: ${decision}`);
  }
}

// Independent arithmetic audit of literal examples, never an expected generator.
const cents = (value) => {
  assert.match(value, /^-?(?:0|[1-9]\d*)\.\d{2}$/, `Dinheiro não canônico: ${value}`);
  return BigInt(value.replace(".", ""));
};
for (const id of ["F-OPEN", "F-USER-B", "F-ZERO", "F-NEGATIVE"]) {
  const { input: i, expected: e } = cases.get(id);
  assert.equal(cents(i.account) + cents(i.investment), cents(e.assets), `${id}: ativos`);
  assert.equal(cents(e.assets) - cents(i.debt), cents(e.netWorth), `${id}: patrimônio`);
  assert.equal(cents(i.account) - cents(i.allocated), cents(e.freeAccount), `${id}: livre`);
  assert.equal(e.openingIncome, "0.00", `${id}: abertura não é receita`);
}
const opening = cases.get("F-OPEN");
assert.equal(fixture.entities.find((e) => e.alias === "accountA").openingBalance, opening.input.account);
assert.equal(fixture.entities.find((e) => e.alias === "accountB").openingBalance, cases.get("F-USER-B").input.account);
assert.equal(fixture.entities.find((e) => e.alias === "investmentA").currentValue, opening.input.investment);
assert.equal(fixture.entities.find((e) => e.alias === "debtA").outstanding, opening.input.debt);
assert.equal(fixture.entities.find((e) => e.alias === "goalA").allocated, opening.input.allocated);
const { input: pay, expected: paid } = cases.get("F-PAY");
assert.equal(cents(pay.openingAccount) - cents(pay.payment), cents(paid.account));
assert.equal(cents(pay.openingDebt) - cents(pay.payment), cents(paid.debt));
assert.equal(cents(paid.account) + cents(pay.investment) - cents(paid.debt), cents(paid.netWorth));
assert.equal(cents(paid.account) - cents(pay.allocated), cents(paid.freeAccount));
const centCase = cases.get("F-CENTS");
assert.equal(centCase.inputs.reduce((sum, value) => sum + cents(value), 0n), cents(centCase.expectedTotal));
for (const row of cases.get("F-ALLOC").rows) {
  assert.equal(row.allocations.reduce((sum, value) => sum + cents(value), 0n) <= cents(row.sourceBalance), row.expectedValid);
}
const installments = cases.get("F-INSTALLMENTS");
assert.equal(cents(installments.input.currentInvoice) + installments.input.future.reduce((sum, item) => sum + cents(item.value), 0n), cents(installments.expected.totalOutstanding));
assert.notEqual(fixture.entities.find((e) => e.alias === cases.get("F-USER-B").forbiddenReference).owner, "B");

// Platform calendar verifies the hand-written clock table; no application helper.
for (const row of cases.get("D-CLOCK").rows) {
  for (const zone of fixture.timezones) {
    const parts = new Intl.DateTimeFormat("en", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(row.instant));
    const part = (type) => parts.find((entry) => entry.type === type).value;
    assert.equal(`${part("year")}-${part("month")}-${part("day")}`, row.expectedLocalDates[zone], `${row.instant} / ${zone}`);
  }
}
for (const instant of cases.get("D-INSTANT").equivalent) {
  assert.equal(Date.parse(instant), Date.parse(cases.get("D-INSTANT").expectedUtcInstant));
}

console.log(`OK: ${criteria.length} critérios; ${findings.length} achados; ${cases.size} cenários; 2 usuários; ${links} links locais.`);
console.log("OK: identidades/fontes, reconciliação em centavos, 18 combinações instante/fuso e offsets equivalentes.");
console.log("Limite: validação de artefatos de especificação. Não executa regra da aplicação, UI, API, banco ou E2E.");
