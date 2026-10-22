import { ownRecord } from "../ownRecord";
import { type Interview, type Issue, type Obj, type Json, ownReferenceIdentity, sections, steps } from "./model";

export const uuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(v);
export const revision = (v: unknown): v is string => typeof v === "string" && /^(0|[1-9]\d{0,18})$/.test(v) && BigInt(v) <= BigInt("9223372036854775807");
export function civilDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}
export function decimal(v: unknown, scale: 2 | 8, signed = false): v is string {
  if (typeof v !== "string" || v.length > 23 || !new RegExp(`^${signed ? "-?" : ""}(0|[1-9]\\d{0,11})(\\.\\d{1,${scale}})?$`).test(v)) return false;
  return !v.startsWith("-") || /[1-9]/.test(v);
}
export function units(v: string, scale = 2): bigint {
  const negative = v.startsWith("-"); const [whole, fraction = ""] = v.replace(/^-/, "").split(".");
  const n = BigInt(whole + fraction.padEnd(scale, "0")); return negative ? -n : n;
}
export function formatExact(v: string, money = true): string {
  const [whole, fraction = ""] = v.split(".");
  return `${money ? "R$ " : ""}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${fraction}`;
}
export type Rule = { kind: "object"; fields: Record<string, Rule>; required?: string[] } | { kind: "array"; item: Rule; max: number } |
  { kind: "variant"; key: string; cases: Record<string, Rule> } | { kind: "leaf"; test: (v: unknown) => boolean; hint: string; normalize?: (v: Json) => Json };
const leaf = (test: (v: unknown) => boolean, hint = "Revise o formato informado.", normalize?: (v: Json) => Json): Rule => ({ kind: "leaf", test, hint, normalize });
export const obj = (fields: Record<string, Rule>, required: string[] = []): Rule => ({ kind: "object", fields, required });
const one = (s: string) => leaf(v => typeof v === "string" && s.split(" ").includes(v));
const text = (n: number) => leaf(v => typeof v === "string" && v.trim().length > 0 && [...v.trim()].length <= n && !/[\u0000-\u001f\u007f]/.test(v), undefined, v => typeof v === "string" ? v.trim() : v);
const scaled = (scale: number) => (v: Json): Json => { if (typeof v !== "string") return v; const [whole, fraction = ""] = v.split("."); return whole + "." + fraction.padEnd(scale, "0"); };
export const money = leaf(v => decimal(v, 2), "Informe até 12 dígitos inteiros e duas casas, sem arredondar.", scaled(2));
const signedMoney = leaf(v => decimal(v, 2, true), "Informe um valor exato com até duas casas decimais.", scaled(2));
const quantity = leaf(v => decimal(v, 8), "Informe até 12 dígitos inteiros e oito casas decimais.", scaled(8));
const date = leaf(civilDate, "Informe uma data válida, sem horário.");
const bool = leaf(v => typeof v === "boolean");
const id = leaf(uuid);
const rev = leaf(revision);
const array = (item: Rule, max: number): Rule => ({ kind: "array", item, max });
const variant = (key: string, cases: Record<string, Rule>): Rule => ({ kind: "variant", key, cases });
const fact = (value: Rule, na = false): Rule => variant("state", { KNOWN: obj({ state: one("KNOWN"), value }, ["state"]), UNKNOWN: obj({ state: one("UNKNOWN") }, ["state"]), ...(na ? { NOT_APPLICABLE: obj({ state: one("NOT_APPLICABLE") }, ["state"]) } : {}) });
export function refRule(kinds: string, persistent = false): Rule {
  const base = obj({ kind: one(kinds), id, ...(!persistent ? { tempId: id } : {}) }, ["kind"]);
  return leaf(v => ownRecord(v, ["kind"]) && typeof v.kind === "string" && kinds.split(" ").includes(v.kind) &&
    (!persistent || Object.hasOwn(v, "id")) && uuid(ownReferenceIdentity(v)) &&
    Object.keys(v).every(k => base.kind === "object" && k in base.fields));
}
const competence = obj({ year: leaf(v => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 9999), month: leaf(v => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 12) }, ["year", "month"]);
export const installmentRule = obj({ tempId: id, competence, amount: money, principal: fact(money), charges: fact(money), description: text(200), dueDateOverride: date }, ["tempId"]);
export const openingRule = obj({ currentCompetence: competence, currentOutstanding: money, currentPrincipal: fact(money), currentCharges: fact(money), dueDateOverride: date, credit: money, creditNotNettedAcknowledged: bool, futureInstallments: array(installmentRule, 120) }, ["futureInstallments"]);
const valuation = variant("state", { UNKNOWN: obj({ state: one("UNKNOWN") }, ["state"]), KNOWN: variant("basis", {
  TOTAL: obj({ state: one("KNOWN"), basis: one("TOTAL"), amount: money, date, source: one("USER_DECLARED"), note: text(200) }, ["state", "basis"]),
  PRICE: obj({ state: one("KNOWN"), basis: one("PRICE"), price: quantity, date, source: one("USER_DECLARED"), note: text(200) }, ["state", "basis"]),
}) });
const link = (kind: string) => obj({ tempId: id, action: one("LINK"), ref: refRule(kind, true) }, ["tempId", "action"]);
export const itemRules: Record<typeof sections[number], Rule> = {
  accounts: variant("action", {
    CREATE: obj({ tempId: id, action: one("CREATE"), name: text(100), type: one("CHECKING INVESTMENT CASH SAVINGS"), balance: fact(signedMoney), color: leaf(v => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)), deficitAcknowledged: bool, distinctCashConfirmed: bool }, ["tempId", "action"]),
    LINK: link("ACCOUNT"), INITIALIZE_DEFAULT: obj({ tempId: id, action: one("INITIALIZE_DEFAULT"), ref: refRule("ACCOUNT", true), balance: fact(signedMoney), deficitAcknowledged: bool }, ["tempId", "action"]),
  }),
  cards: variant("action", { CREATE: obj({ tempId: id, action: one("CREATE"), name: text(100), last4Digits: leaf(v => typeof v === "string" && /^\d{4}$/.test(v)), brand: text(40), limit: fact(money), closingDay: leaf(v => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 31), dueDay: leaf(v => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 31), opening: openingRule }, ["tempId", "action"]), LINK: link("CARD"), INITIALIZE_EMPTY: obj({ tempId: id, action: one("INITIALIZE_EMPTY"), ref: refRule("CARD", true), opening: openingRule }, ["tempId", "action"]) }),
  investments: variant("action", { CREATE: obj({ tempId: id, action: one("CREATE"), name: text(100), type: one("STOCK FII FIXED_INCOME CRYPTO TREASURY OTHER"), identifier: text(40), institution: text(100), positionMode: one("UNIT MONETARY"), quantity: fact(quantity, true), cost: fact(money), valuation, acquisitionDate: fact(date), historicalSource: fact(text(200)) }, ["tempId", "action", "positionMode"]), LINK: link("INVESTMENT") }),
  goals: variant("action", { LINK: link("GOAL"), CREATE: variant("type", {
    MONETARY: obj({ tempId: id, action: one("CREATE"), title: text(100), type: one("MONETARY"), target: money, deadline: date }, ["tempId", "action", "type"]),
    NUMERIC: obj({ tempId: id, action: one("CREATE"), title: text(100), type: one("NUMERIC"), target: quantity, deadline: date, unit: text(30), initialProgress: quantity }, ["tempId", "action", "type"]),
  }) }),
  allocations: obj({ tempId: id, goal: refRule("GOAL"), source: refRule("ACCOUNT INVESTMENT"), amount: money }, ["tempId"]),
  forecasts: obj({ tempId: id, description: text(200), direction: one("INCOME EXPENSE"), amount: money, dueDate: date, account: refRule("ACCOUNT"), category: obj({ id }, ["id"]), recurrenceLabel: text(100) }, ["tempId"]),
};
const confirmation = variant("action", {
  CLOSE: obj({ reservationId: id, expectedRevision: rev, action: one("CLOSE"), currentSituationConfirmed: bool }, ["reservationId", "expectedRevision", "action"]),
  ASSIGN: obj({ reservationId: id, expectedRevision: rev, action: one("ASSIGN"), currentSituationConfirmed: bool, goal: refRule("GOAL"), parts: array(obj({ source: refRule("ACCOUNT INVESTMENT"), amount: money }), 200) }, ["reservationId", "expectedRevision", "action", "parts"]),
});
export const interviewRule = obj({ context: obj({ currency: one("BRL"), baseDate: date, preferredName: text(80), objective: text(200), browserZone: text(80), boundaryAcknowledged: bool, cashOnlyAcknowledged: bool }, ["currency"]), currentStep: one(steps.join(" ")), sections: obj(Object.fromEntries(sections.map((s) => [s, obj({ answer: one("UNANSWERED NONE PROVIDED DEFERRED"), items: array(itemRules[s], { accounts: 50, cards: 20, investments: 50, goals: 100, allocations: 200, forecasts: 120 }[s]) }, ["answer", "items"])])), [...sections]), reservationConfirmations: array(confirmation, 200) }, ["context", "currentStep", "sections"]);
export function check(rule: Rule, value: unknown, path = ""): Issue[] {
  const issue = (message: string): Issue[] => [{ path, code: "INPUT_FORMAT", message }];
  if (rule.kind === "leaf") return rule.test(value) ? [] : issue(rule.hint);
  if (rule.kind === "variant") {
    if (!ownRecord(value, [rule.key])) return issue("Escolha uma opção para continuar.");
    const key = value[rule.key]; if (typeof key !== "string") return issue("Escolha uma opção para continuar.");
    const selected = Object.hasOwn(rule.cases, key) ? rule.cases[key] : undefined; return selected ? check(selected, value, path) : issue("Escolha uma opção válida.");
  }
  if (rule.kind === "array") return Array.isArray(value) && value.length <= rule.max ? value.flatMap((v, i) => check(rule.item, v, `${path}/${i}`)) : issue("A lista excede o limite permitido ou é inválida.");
  if (!ownRecord(value, rule.required ?? [])) return issue("Preencha a estrutura necessária.");
  return Object.entries(value).flatMap(([k, v]) => Object.hasOwn(rule.fields, k) ? check(rule.fields[k], v, `${path}/${k}`) : [{ path: `${path}/${k}`, code: "FIELD_NOT_ALLOWED", message: "Campo não permitido nesta opção." }]);
}
export function parseInterview(value: unknown): Interview {
  if (check(interviewRule, value).length) throw new Error("Rascunho recebido inválido. Recarregue para consultar o servidor.");
  // Every object, discriminator, list and supplied leaf has been checked above.
  return value as Interview;
}
function normalize(rule: Rule, value: Json): Json {
  if (rule.kind === "leaf") return rule.normalize ? rule.normalize(value) : value;
  if (rule.kind === "array" && Array.isArray(value)) return value.map(v => normalize(rule.item, v));
  if (rule.kind === "variant" && ownRecord(value, [rule.key])) { const key = value[rule.key]; if (typeof key === "string" && Object.hasOwn(rule.cases, key)) return normalize(rule.cases[key], value); }
  if (rule.kind === "object" && ownRecord(value, [])) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(rule.fields[k], v)]));
  return value;
}
export function normalizeInterview(value: Interview): Interview {
  parseInterview(value); return parseInterview(normalize(interviewRule, value));
}
export function setPath(root: Obj, path: string[], value: Json | undefined): Obj {
  const [key, ...rest] = path; const copy = { ...root };
  if (!rest.length) { if (value === undefined) delete copy[key]; else copy[key] = value; }
  else copy[key] = setPath(ownRecord(root[key], []) ? root[key] as Obj : {}, rest, value);
  return copy;
}
