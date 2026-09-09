// Audits specification artifacts only; never imports application code or calls an API.
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../../../../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const dir = "controle-financeiro-frontend/src/types/temporal-contract/";
const raw = await read(dir + "examples.json");
const fixture = JSON.parse(raw); // Fresh in-memory copy for every process, including adversarial runs.
const inventory = await read(dir + "inventory.md");
const spec = await read("docs/sdd/specs/002-datas.md");
const mutation = process.argv.find((arg) => arg.startsWith("--mutation="))?.slice(11);
if (mutation) {
  const mutations = {
    "civil-shift": () => { fixture.writes[0].response.date = "2026-09-08"; },
    "assume-utc": () => { fixture.legacy[0].expectedUtc = "2026-09-07T23:30:00.000Z"; },
    "month-overflow": () => { fixture.months[2].expected = "2026-03-01"; },
    "rewrite-default": () => { fixture.midnight[0].afterFields.date = "2026-09-08"; },
    "rewrite-audit": () => { fixture.edits[0].after.recordedAt = "2026-09-06T23:30:00Z"; },
  };
  assert.ok(Object.hasOwn(mutations, mutation), "Mutação desconhecida");
  console.log("Mutação documental em memória:", mutation);
  mutations[mutation]();
}
assert.equal(fixture.seed, "cf004-v1");
assert.equal(fixture.productZone, "America/Sao_Paulo");
assert.deepEqual(fixture.timezones, ["America/Sao_Paulo", "UTC", "Pacific/Kiritimati"]);

// Platform primitives cross-check literal examples; these are not product validators.
const civilValid = (value) => {
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const partsAt = (instant, zone) => Object.fromEntries(
  new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(instant)).map((part) => [part.type, part.value]),
);
const dateAt = (instant, zone) => {
  const p = partsAt(instant, zone);
  return `${p.year}-${p.month}-${p.day}`;
};
const canonicalTime = (value) => {
  if (value === null) return null;
  assert.match(value, /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Horário de parede válido");
  return value.length === 5 ? value + ":00" : value;
};

for (const row of fixture.civil) {
  assert.ok(civilValid(row.value), row.value);
  const [y, m, d] = row.value.split("-");
  assert.equal(row.label, `${d}/${m}/${y}`, "Rótulo civil literal");
  assert.equal(JSON.parse(JSON.stringify({ date: row.value })).date, row.value);
}
for (const value of fixture.invalidCivil) assert.equal(civilValid(value), false, value);
for (const row of fixture.clock) {
  fixture.timezones.forEach((zone, i) => assert.equal(dateAt(row.instant, zone), row.browser[i], row.instant + "/" + zone));
  assert.equal(dateAt(row.instant, fixture.productZone), row.product, "Hoje de produto");
}
for (const value of fixture.instant.equivalent) {
  assert.match(value, /(?:Z|[+-]\d{2}:\d{2})$/);
  assert.equal(new Date(value).toISOString(), fixture.instant.expectedUtc, "Instantes equivalentes");
  const p = partsAt(value, fixture.productZone);
  assert.equal(`${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`, fixture.instant.productLabel);
}
for (const row of fixture.legacy) {
  if (row.provenance === "unknown") {
    assert.equal(row.expectedUtc, null, "Origem desconhecida não recebe UTC");
    assert.equal(row.expectedCivil, null, "Origem desconhecida não vira civil por prefixo");
  } else if (row.provenance === "civil-atStartOfDay-proven") {
    assert.equal(row.expectedUtc, null, "Civil não vira instante");
    assert.equal(row.expectedCivil, "2026-09-07");
  } else if (row.provenance === "audit-offset-proven") {
    assert.equal(new Date(row.value + row.knownOffset).toISOString(), row.expectedUtc);
    assert.equal(row.expectedCivil, null);
  } else assert.fail("Origem não classificada");
}
for (const row of fixture.months) {
  assert.ok(civilValid(row.input) && civilValid(row.expected));
  assert.equal(row.expected.slice(-2), "01");
  const [iy, im] = row.input.split("-").map(Number);
  const [ey, em] = row.expected.split("-").map(Number);
  assert.equal(ey * 12 + em - (iy * 12 + im), row.delta, "Competência muda exatamente um mês");
}
for (const row of fixture.time) assert.equal(canonicalTime(row.input), row.canonical);
for (const value of fixture.invalidTime) assert.throws(() => canonicalTime(value));
for (const row of fixture.requiredCivilWrites) {
  assert.equal(civilValid(row.request.date), false);
  assert.equal(row.status, 400);
  assert.equal(row.field, "date");
}
for (const row of fixture.writes) {
  assert.ok(civilValid(row.request.date), row.id);
  assert.equal(row.response.date, row.request.date, "Data explícita deve sobreviver ao round trip: " + row.id);
  if (Object.hasOwn(row.request, "time")) assert.equal(row.response.time, canonicalTime(row.request.time));
  if (row.recordingInstant) assert.equal(row.response.recordedAt, row.recordingInstant, "Auditoria da gravação");
  if (row.bankResponse) assert.equal(row.bankResponse.date, row.request.date, "Efeito bancário conserva dia operacional");
}
for (const row of fixture.edits) {
  assert.equal(row.after.recordedAt, row.before.recordedAt, "Edição não reescreve auditoria");
  assert.equal(row.after.date, row.request.date ?? row.before.date);
  assert.equal(row.after.time, Object.hasOwn(row.request, "time") ? canonicalTime(row.request.time) : row.before.time);
}
for (const row of fixture.midnight) {
  assert.deepEqual(row.afterFields, row.beforeFields, "Meia-noite não reescreve formulário " + row.state);
  assert.equal(dateAt(row.after, row.browserZone), row.reopenedDate);
  assert.notEqual(dateAt(row.opened, row.browserZone), row.reopenedDate);
}
for (const row of fixture.deadlines) {
  const expectedFromRule = row.complete ? "complete" : !civilValid(row.deadline) ? "unavailable" :
    row.deadline < row.today ? "overdue" : "on-time";
  assert.equal(row.status, expectedFromRule, "Prazo: " + row.deadline + "/" + row.today);
}
assert.equal((Date.parse(fixture.expiry.expiresAt) - Date.parse(fixture.expiry.issuedAt)) / 1000, fixture.expiry.durationSeconds);
for (const row of fixture.expiry.checks) assert.equal(row.expired, Date.parse(row.now) >= Date.parse(fixture.expiry.expiresAt));
assert.deepEqual(fixture.unresolved, { cardClosingDate: null, weeklyWindow: null, legacyOrigin: null });

// Coverage audit reads declarations only. Observed code determines what must be inventoried,
// never the behavioral expected above. This scanner is bounded to this repository's records/interfaces.
const domain = "controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/";
const javaFiles = (await readdir(new URL(domain, root), { recursive: true }))
  .filter((path) => /[/\\]dto[/\\].+DTO\.java$/.test("/" + path));
let javaFields = 0;
for (const path of javaFiles) {
  const name = path.split(/[/\\]/).at(-1).replace(".java", "");
  const content = await read(domain + path.replaceAll("\\", "/"));
  for (const match of content.matchAll(/\b(?:LocalDateTime|LocalDate|Instant|String|Integer)\s+(date|time|deadline|dueDate|createdAt|updatedAt|month|year|closingDay|dueDay|label)\b/g)) {
    assert.ok(inventory.includes(name + "." + match[1]), "Campo DTO sem inventário: " + name + "." + match[1]);
    javaFields++;
  }
}
const types = await read("controle-financeiro-frontend/src/types/index.ts");
let tsFields = 0;
for (const match of types.matchAll(/export interface (\w+)[^{]*\{([\s\S]*?)^\}/gm)) {
  for (const field of match[2].matchAll(/^  (date|time|deadline|dueDate|createdAt|updatedAt|year|month)\??:/gm)) {
    assert.ok(inventory.includes(match[1] + "." + field[1]), "Campo TS sem inventário: " + match[1] + "." + field[1]);
    tsFields++;
  }
}
assert.equal((inventory.match(/^\| CT-\d{2} /gm) ?? []).length, 22);
assert.equal((inventory.match(/^\| E\d{2} /gm) ?? []).length, 21);
for (const decision of ["DEC-01", "DEC-02", "DEC-05"]) assert.ok(spec.includes("## " + decision));
for (const field of ["User.recoveryTokenExpiry", "StandardError.timestamp", "YearlyNote.updatedAt", "GoalHistory.date", "InvestTransaction.date"]) {
  assert.ok(inventory.includes(field), "Fronteira indireta ausente: " + field);
}
let links = 0;
for (const path of ["docs/sdd/specs/002-datas.md", dir + "inventory.md"]) {
  for (const [, target] of (await read(path)).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|#)/.test(target)) continue;
    const resolved = new URL(target.split("#")[0], new URL(path, root));
    assert.ok(fileURLToPath(resolved).startsWith(fileURLToPath(root)), "Link fora do repositório");
    await access(resolved);
    links++;
  }
}
assert.equal(await read(dir + "examples.json"), raw, "Fixture em disco permanece intacta");
console.log(`OK TZ=${process.env.TZ ?? "(não definido)"} seed=${fixture.seed}: 22 grupos; 21 exemplos; ${javaFields} campos DTO Java e ${tsFields} campos TS inventariados; ${links} links locais.`);
console.log("OK: civis válidos/inválidos, 12 combinações browser + 4 produto, offsets/proveniência, competências, hora ausente, escrita/edição/auditoria, meia-noite, prazo e expiração.");
console.log("Limite: auditoria de artefatos. Não executa aplicação, serializador HTTP, PostgreSQL, componente, navegador ou E2E.");
