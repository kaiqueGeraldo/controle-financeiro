import { ownRecord } from "../ownRecord";
import { civilDate, decimal, parseInterview, revision, units, uuid } from "./input";
import { metricLabels, refKey, sections, type Interview, type Obj, type Operation, type Prepared, type Receipt, type Ref, type Session, type Summary, type SummaryAmount } from "./model";

const invalid = () => new Error("Resposta da entrevista inválida. O resultado permanece pendente; consulte o servidor.");
function expect(test: unknown): asserts test { if (!test) throw invalid(); }
function record(v: unknown, keys: string[]): Record<string, unknown> { expect(ownRecord(v, keys)); return v; }
function list(v: unknown): unknown[] { expect(Array.isArray(v)); return v; }
const string = (v: unknown): v is string => typeof v === "string";
const hash = (v: unknown): v is string => string(v) && /^[0-9a-f]{64}$/.test(v);
const token = (v: unknown): v is string => string(v) && v.length > 0;
const instant = (v: unknown): v is string => string(v) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(v) && Number.isFinite(Date.parse(v));
function strings(v: unknown, ids = false): string[] { const values = list(v); expect(values.every(ids ? uuid : string)); expect(new Set(values).size === values.length); return values as string[]; }
function reference(v: unknown, kinds = "ACCOUNT INVESTMENT CARD GOAL"): Ref {
  const o = record(v, ["kind"]);
  expect(typeof o.kind === "string" && kinds.split(" ").includes(o.kind));
  const hasId = Object.hasOwn(o, "id"), hasTempId = Object.hasOwn(o, "tempId");
  expect(hasId !== hasTempId && uuid(o[hasId ? "id" : "tempId"]));
  return o as Ref;
}
function individual(v: unknown, signed = false, scale: 2 | 8 = 2): string { expect(decimal(v, scale, signed)); expect(v.split(".")[1]?.length === scale); return v; }
function aggregate(v: unknown, scale: 2 | 8, signed: boolean): string {
  expect(string(v) && new RegExp(`^${signed ? "-?" : ""}(0|[1-9]\\d*)\\.\\d{${scale}}$`).test(v) && !(v.startsWith("-") && !/[1-9]/.test(v)));
  return v;
}
export function summaryAmount(v: unknown, signed = false, scale: 2 | 8 = 2, na = false): SummaryAmount {
  const o = record(v, ["state", "value", "knownSubtotal", "outsideIndividualRange", "missingPaths"]);
  const missing = strings(o.missingPaths); expect(missing.every(p => p.startsWith("/")));
  if (o.state === "KNOWN" || o.state === "PARTIAL") {
    const subtotal = aggregate(o.knownSubtotal, scale, signed);
    const limit = scale === 2 ? BigInt("99999999999999") : BigInt("99999999999999999999");
    const n = units(subtotal, scale); expect(o.outsideIndividualRange === (n > limit || n < -limit));
    expect(o.state === "KNOWN" ? o.value === subtotal && !missing.length : o.value === null && missing.length > 0);
  } else {
    expect(o.state === "UNKNOWN" || na && o.state === "NOT_APPLICABLE");
    expect(o.value === null && o.knownSubtotal === null && o.outsideIndividualRange === null);
    expect(o.state === "UNKNOWN" ? missing.length > 0 : !missing.length);
  }
  return o as SummaryAmount;
}
function fact(v: unknown, signed = false) {
  const o = record(v, ["state"]); expect(o.state === "KNOWN" || o.state === "UNKNOWN");
  if (o.state === "KNOWN") { expect(Object.hasOwn(o, "value")); individual(o.value, signed); }
  else expect(!Object.hasOwn(o, "value"));
  return o;
}
function known(v: SummaryAmount): bigint | null { return v.state === "KNOWN" && v.value !== null ? units(v.value) : null; }
function equalAmount(v: SummaryAmount, expected: bigint | null) { if (expected !== null) expect(known(v) === expected); }
function identityUnique(values: string[]) { expect(new Set(values).size === values.length); }

/** Verify only components of this received snapshot, never today's balances.
 * A partial component contributes its known subtotal, not an invented total. */
function reconcileSum(total: SummaryAmount, components: SummaryAmount[]) {
  let subtotal = BigInt(0), hasKnown = false, hasMissing = false;
  for (const component of components) {
    expect(component.state !== "NOT_APPLICABLE");
    if (component.knownSubtotal !== null) {
      subtotal += units(component.knownSubtotal);
      hasKnown = true;
    }
    if (component.state !== "KNOWN") hasMissing = true;
  }
  const state = !hasMissing ? "KNOWN" : hasKnown ? "PARTIAL" : "UNKNOWN";
  expect(total.state === state);
  if (state !== "UNKNOWN") expect(total.knownSubtotal !== null && units(total.knownSubtotal) === subtotal);
}

function evidenceRefs(value: unknown) { expect(strings(value, true).length > 0); }

/** One read contract for both the inventory and the before/after snapshots. */
function legacyReservation(value: unknown) {
  const r = record(value, ["reservationId", "revision", "goal", "nominal", "attribution"]);
  expect(uuid(r.reservationId) && revision(r.revision));
  const goal = record(r.goal, ["state"]);
  expect(goal.state === "KNOWN" || goal.state === "UNKNOWN");
  if (goal.state === "KNOWN") reference(record(goal, ["value"]).value, "GOAL");
  else expect(!Object.hasOwn(goal, "value"));

  const nominal = summaryAmount(r.nominal), a = record(r.attribution, ["state"]);
  if (a.state === "CONFIRMED") {
    record(a, ["parts", "evidenceRefs"]); evidenceRefs(a.evidenceRefs);
    const parts = list(a.parts); expect(parts.length > 0);
    const sources: string[] = [], amounts: SummaryAmount[] = [];
    for (const part of parts) {
      const p = record(part, ["source", "amount"]);
      sources.push(refKey(reference(p.source, "ACCOUNT INVESTMENT")));
      const amount = summaryAmount(p.amount);
      if (amount.knownSubtotal !== null) individual(amount.knownSubtotal);
      if (amount.state === "KNOWN") expect(units(amount.value!) > BigInt(0));
      amounts.push(amount);
    }
    identityUnique(sources); reconcileSum(nominal, amounts);
  } else if (a.state === "CANDIDATES") {
    record(a, ["sources", "evidenceRefs"]); evidenceRefs(a.evidenceRefs);
    const refs = list(a.sources).map(x => refKey(reference(x, "ACCOUNT INVESTMENT")));
    expect(refs.length > 0); identityUnique(refs);
  } else if (a.state === "UNBOUNDED") {
    record(a, ["excluded"]); expect(!Object.hasOwn(a, "sources"));
    const refs = list(a.excluded).map(x => {
      const e = record(x, ["source", "evidenceRefs"]); evidenceRefs(e.evidenceRefs);
      return refKey(reference(e.source, "ACCOUNT INVESTMENT"));
    });
    identityUnique(refs);
  } else {
    expect(a.state === "CLOSED"); record(a, ["evidenceRefs"]); evidenceRefs(a.evidenceRefs);
    expect(!Object.hasOwn(a, "parts") && nominal.state === "KNOWN" && nominal.value === "0.00");
  }
  return r;
}

function reservationReview(v: unknown) {
  const o = record(v, ["reservations", "evidence", "decisions", "confirmations"]);
  const reservationIds = list(o.reservations).map(value => String(legacyReservation(value).reservationId));
  identityUnique(reservationIds);
  const reservationSet = new Set(reservationIds);
  const evidenceIds: string[] = [];
  for (const value of list(o.evidence)) {
    const e = record(value, ["id", "revision", "basis", "reservationId", "claim", "sources", "inventoryToken", "validatedAt"]);
    expect(uuid(e.id) && revision(e.revision) && uuid(e.reservationId) && reservationSet.has(e.reservationId)); evidenceIds.push(e.id);
    expect(["DOMAIN_RECORD", "CURRENT_DECLARATION"].includes(String(e.basis)) && ["ASSIGNMENT", "EXHAUSTIVE_CANDIDATES", "EXCLUSION", "CLOSURE"].includes(String(e.claim)));
    list(e.sources).forEach(x => reference(x, "ACCOUNT INVESTMENT")); expect(token(e.inventoryToken) && instant(e.validatedAt));
  }
  identityUnique(evidenceIds);
  const decisionRefs: string[] = [];
  for (const value of list(o.decisions)) {
    const d = record(value, ["source", "blockingReservationIds", "state", "reason"]); decisionRefs.push(refKey(reference(d.source, "ACCOUNT INVESTMENT")));
    const blocked = strings(d.blockingReservationIds, true); expect(blocked.every(id => reservationSet.has(id)));
    expect(d.state === "ALLOWED" ? !blocked.length && d.reason === null : d.state === "BLOCKED" && ["RESERVATION_UNCERTAIN", "SOURCE_INELIGIBLE", "CAPACITY_UNAVAILABLE", "NO_CAPACITY"].includes(String(d.reason)));
    if (blocked.length) expect(d.state === "BLOCKED" && d.reason === "RESERVATION_UNCERTAIN");
  }
  identityUnique(decisionRefs);
  for (const value of list(o.confirmations)) {
    const c = record(value, ["reservationId", "action", "previousRevision", "resultingRevision"]);
    expect(uuid(c.reservationId) && ["ASSIGN", "CLOSE"].includes(String(c.action)) && revision(c.previousRevision) && revision(c.resultingRevision));
  }
}

export function parseSummary(value: unknown): Summary {
  const o = record(value, ["baseDate", "existingAsOf", "scope", "coverage", "metrics", "bySource", "byCard", "byGoal", "deferredSections"]);
  expect(civilDate(o.baseDate) && instant(o.existingAsOf) && o.scope === "SELECTED_AND_EXISTING");
  const coverage = list(o.coverage).map(v => { const c = record(v, ["dimension", "complete", "missingPaths"]); expect(["accounts", "investments", "cards", "allocations"].includes(String(c.dimension)) && typeof c.complete === "boolean"); const paths = strings(c.missingPaths); expect(c.complete === (paths.length === 0)); return c.dimension; });
  identityUnique(coverage.map(String)); expect(coverage.length === 4);
  const metrics = record(o.metrics, Object.keys(metricLabels));
  for (const key of Object.keys(metricLabels)) summaryAmount(metrics[key], ["accountsSigned", "netWorth", "freeAccountCash", "unallocatedInvestments"].includes(key));
  const sources = list(o.bySource).map(v => {
    const s = record(v, ["ref", "value", "reserved", "free", "newAllocationCapacity"]); reference(s.ref, "ACCOUNT INVESTMENT");
    const val = fact(s.value, reference(s.ref).kind === "ACCOUNT"); const reserved = summaryAmount(s.reserved); const free = summaryAmount(s.free, true); const capacity = summaryAmount(s.newAllocationCapacity);
    if (val.state === "KNOWN" && reserved.state === "KNOWN") equalAmount(free, units(String(val.value)) - units(reserved.value!));
    if (val.state !== "KNOWN" || reserved.state !== "KNOWN") expect(free.state === "UNKNOWN");
    expect(capacity.outsideIndividualRange !== true);
    return s;
  });
  identityUnique(sources.map(s => refKey(reference(s.ref))));
  const cards = list(o.byCard).map(v => {
    const c = record(v, ["ref", "debt", "credit", "committed", "availableLimit"]); reference(c.ref, "CARD"); fact(c.debt); fact(c.credit); summaryAmount(c.committed); summaryAmount(c.availableLimit, true); return c;
  }); identityUnique(cards.map(c => refKey(reference(c.ref))));
  const goals = list(o.byGoal).map(v => { const g = record(v, ["ref", "type", "progress", "covered"]); reference(g.ref, "GOAL"); expect(g.type === "MONETARY" || g.type === "NUMERIC"); summaryAmount(g.progress, false, g.type === "NUMERIC" ? 8 : 2); const c = summaryAmount(g.covered, false, 2, g.type === "NUMERIC"); if (g.type === "NUMERIC") expect(c.state === "NOT_APPLICABLE"); return g; }); identityUnique(goals.map(g => refKey(reference(g.ref))));
  expect(strings(o.deferredSections).every(s => sections.includes(s as typeof sections[number])));
  if (Object.hasOwn(o, "reservationReview")) {
    reservationReview(o.reservationReview);
    const review = record(o.reservationReview, ["decisions"]);
    const refs = new Set(list(review.decisions).map(v => refKey(reference(record(v, ["source"]).source))));
    expect(refs.size === sources.length && sources.every(s => refs.has(refKey(reference(s.ref)))));
  }
  if (Object.hasOwn(o, "allocationChanges")) for (const value of list(o.allocationChanges)) {
    const c = record(value, ["tempId", "goal", "source", "previousAmount", "amount", "delta"]); expect(uuid(c.tempId)); reference(c.goal, "GOAL"); reference(c.source, "ACCOUNT INVESTMENT");
    expect(units(individual(c.amount)) - units(individual(c.previousAmount)) === units(individual(c.delta, true)));
  }
  if (Object.hasOwn(o, "reservationChanges")) for (const value of list(o.reservationChanges)) {
    const c = record(value, ["reservationId", "action", "previous", "proposed"]); expect(uuid(c.reservationId) && ["ASSIGN", "CLOSE"].includes(String(c.action)));
    for (const v of [c.previous, c.proposed]) expect(legacyReservation(v).reservationId === c.reservationId);
  }
  // Structural checks above guard this boundary; equations reject coherent-looking corrupt totals.
  const result = o as Summary;
  const m = result.metrics; const account = known(m.accountsSigned), investment = known(m.investmentsValue), credit = known(m.cardCredit), debt = known(m.cardDebt);
  if (account !== null && investment !== null && credit !== null && debt !== null) equalAmount(m.netWorth, account + investment + credit - debt);
  for (const [kind, metric] of [["ACCOUNT", "accountsSigned"], ["INVESTMENT", "investmentsValue"]] as const) {
    const rows = result.bySource.filter(s => s.ref.kind === kind);
    if (m[metric].state === "KNOWN") { expect(rows.every(s => s.value.state === "KNOWN")); equalAmount(m[metric], rows.reduce((n, s) => n + (s.value.state === "KNOWN" ? units(s.value.value) : BigInt(0)), BigInt(0))); }
    // Uncertain attribution can make nominal reserved totals differ from a sum
    // of reserved rows (§5.1). Free totals, however, always sum source frees.
    reconcileSum(m[kind === "ACCOUNT" ? "freeAccountCash" : "unallocatedInvestments"], rows.map(s => s.free));
  }
  for (const [field, metric] of [["debt", "cardDebt"], ["credit", "cardCredit"]] as const) if (m[metric].state === "KNOWN") {
    expect(result.byCard.every(c => c[field].state === "KNOWN")); equalAmount(m[metric], result.byCard.reduce((n, c) => n + (c[field].state === "KNOWN" ? units(c[field].value) : BigInt(0)), BigInt(0)));
  }
  return result;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    const rows = value.map(canonical); const identity = (v: unknown): string => {
      if (!ownRecord(v, [])) return String(v);
      for (const k of ["tempId", "reservationId", "dimension"]) if (Object.hasOwn(v, k)) return String(v[k]);
      if (Object.hasOwn(v, "kind") && Object.hasOwn(v, "id")) return `${v.kind}:${v.id}`;
      if (Object.hasOwn(v, "id")) return String(v.id);
      for (const k of ["source", "ref"]) if (ownRecord(v[k], ["kind"])) return `${v[k].kind}:${v[k].id ?? v[k].tempId}`;
      return JSON.stringify(v);
    };
    return rows.sort((a, b) => identity(a) < identity(b) ? -1 : identity(a) > identity(b) ? 1 : 0);
  }
  if (ownRecord(value, [])) return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
export const canonicalString = (v: unknown) => JSON.stringify(canonical(v));
async function digest(v: unknown) { const bytes = new TextEncoder().encode(canonicalString(v)); const hash = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join(""); }
function header(v: unknown): Record<string, unknown> {
  const o = record(v, ["contractVersion", "operationId", "kind", "sessionId", "draftVersion", "contentHash", "reviewHash", "summary"]);
  expect(o.contractVersion === 1 && o.kind === "ONBOARDING_COMPLETE" && uuid(o.operationId) && uuid(o.sessionId) && revision(o.draftVersion) && hash(o.contentHash) && hash(o.reviewHash)); parseSummary(o.summary); return o;
}
function mappings(v: unknown, payload: Interview | null, receipt = false) {
  const rows = list(v); const ids: string[] = [];
  for (const value of rows) {
    const m = record(value, ["tempId", "kind", "action", receipt ? "id" : "existingId"]);
    expect(uuid(m.tempId) && ["ACCOUNT", "INVESTMENT", "CARD", "GOAL", "ALLOCATION", "FORECAST", "INSTALLMENT"].includes(String(m.kind)) && ["CREATE", "LINK", "INITIALIZE_DEFAULT", "INITIALIZE_EMPTY", "UPDATE", "RELEASE"].includes(String(m.action)));
    const actions: Record<string, string[]> = { ACCOUNT: ["CREATE", "LINK", "INITIALIZE_DEFAULT"], CARD: ["CREATE", "LINK", "INITIALIZE_EMPTY"], INVESTMENT: ["CREATE", "LINK"], GOAL: ["CREATE", "LINK"], ALLOCATION: ["CREATE", "UPDATE", "RELEASE"], FORECAST: ["CREATE"], INSTALLMENT: ["CREATE"] };
    expect(actions[String(m.kind)].includes(String(m.action)));
    expect(receipt ? uuid(m.id) : m.existingId === null || uuid(m.existingId)); ids.push(m.tempId);
    if (!receipt) expect(m.action === "CREATE" ? m.existingId === null : uuid(m.existingId));
  }
  identityUnique(ids);
  if (receipt) identityUnique(rows.map(v => { const row = record(v, ["kind", "id"]); return `${row.kind}:${row.id}`; }));
  if (payload) {
    const expected = new Map<string, { kind: string; action?: string; existingId?: string }>();
    for (const s of sections) if (payload.sections[s].answer === "PROVIDED") for (const item of payload.sections[s].items) {
      expected.set(item.tempId, { kind: { accounts: "ACCOUNT", cards: "CARD", investments: "INVESTMENT", goals: "GOAL", allocations: "ALLOCATION", forecasts: "FORECAST" }[s], action: typeof item.action === "string" ? item.action : undefined, existingId: ownRecord(item.ref, ["id"]) && typeof item.ref.id === "string" ? item.ref.id : undefined });
      if (s === "cards" && ownRecord(item.opening, ["futureInstallments"])) for (const f of list(item.opening.futureInstallments)) { const row = record(f, ["tempId"]); expect(uuid(row.tempId)); expected.set(row.tempId, { kind: "INSTALLMENT", action: "CREATE" }); }
    }
    expect(expected.size === rows.length);
    for (const v of rows) { const m = record(v, ["tempId", "kind", "action"]); const e = expected.get(String(m.tempId)); expect(e && e.kind === m.kind && (e.action === undefined || e.action === m.action) && (e.existingId === undefined || e.existingId === m[receipt ? "id" : "existingId"])); }
  }
}
export async function parsePrepared(value: unknown, session?: Pick<Session, "sessionId" | "version" | "payload">, operationId?: string): Promise<Prepared> {
  const o = header(value); record(value, ["preparedAt", "sourceSnapshot", "mappingPreview"]); expect(instant(o.preparedAt)); const snapshot = record(o.sourceSnapshot, ["inventoryToken", "sources"]); expect(token(snapshot.inventoryToken));
  const refs = list(snapshot.sources).map(v => { const s = record(v, ["kind", "id", "revision", "token"]); expect(["ACCOUNT", "INVESTMENT", "CARD", "GOAL"].includes(String(s.kind)) && uuid(s.id) && revision(s.revision) && token(s.token)); return `${s.kind}:${s.id}`; }); identityUnique(refs);
  mappings(o.mappingPreview, session?.payload ?? null);
  if (session) {
    expect(o.sessionId === session.sessionId && o.draftVersion === session.version && session.payload);
    expect(o.contentHash === await digest({ contractVersion: 1, sessionId: session.sessionId, draftVersion: session.version, payload: session.payload }));
  }
  if (operationId) expect(o.operationId === operationId);
  const summary = record(o.summary, ["existingAsOf"]); const forHash = { ...summary }; delete forHash.existingAsOf;
  expect(o.reviewHash === await digest({ contentHash: o.contentHash, sourceSnapshot: o.sourceSnapshot, mappingPreview: o.mappingPreview, summary: forHash }));
  return o as Prepared;
}
export async function parseReceipt(value: unknown, prepared?: Prepared, payload?: Interview | null): Promise<Receipt> {
  const o = header(value); record(value, ["status", "completedAt", "mapping"]); expect(o.status === "COMPLETED" && instant(o.completedAt)); mappings(o.mapping, payload ?? null, true);
  if (prepared) {
    for (const k of ["sessionId", "operationId", "draftVersion", "contentHash", "reviewHash"] as const) expect(o[k] === prepared[k]);
    expect(canonicalString(o.summary) === canonicalString(prepared.summary));
    const rows = list(o.mapping).map(v => record(v, ["tempId", "kind", "action", "id"]));
    const byId = new Map(rows.map(r => [r.tempId, r]));
    expect(rows.length === prepared.mappingPreview.length);
    for (const m of prepared.mappingPreview) { const r = byId.get(m.tempId); expect(r && r.kind === m.kind && r.action === m.action && (m.existingId === null || r.id === m.existingId)); }
  }
  return o as Receipt;
}
export async function parseSession(value: unknown): Promise<Session> {
  const o = record(value, ["contractVersion", "sessionId", "version", "status", "mode", "payload", "issues", "updatedAt", "pendingIntent", "completedReceipt"]);
  expect(o.contractVersion === 1 && revision(o.version) && ["NOT_STARTED", "IN_PROGRESS", "SKIPPED", "COMPLETED"].includes(String(o.status)) && ["NEW", "COMPLEMENT"].includes(String(o.mode)));
  expect(o.updatedAt === null || instant(o.updatedAt));
  if (o.payload !== null) parseInterview(o.payload);
  for (const v of list(o.issues)) { const i = record(v, ["path", "code", "message"]); expect(string(i.path) && string(i.code) && string(i.message)); }
  if (o.status === "NOT_STARTED") expect(o.sessionId === null && o.version === "0" && o.payload === null && o.pendingIntent === null && o.completedReceipt === null && o.updatedAt === null && list(o.issues).length === 0);
  else { expect(uuid(o.sessionId) && o.version !== "0" && instant(o.updatedAt)); if (o.status === "IN_PROGRESS" || o.status === "COMPLETED") expect(o.payload !== null); }
  const session = o as Session;
  if (o.pendingIntent !== null) { expect(o.status === "IN_PROGRESS"); await parsePrepared(o.pendingIntent, session); }
  if (o.completedReceipt !== null) {
    expect(o.status === "COMPLETED" && session.payload); const receipt = await parseReceipt(o.completedReceipt, undefined, session.payload);
    expect(receipt.sessionId === o.sessionId && BigInt(session.version) === BigInt(receipt.draftVersion) + BigInt(1));
    expect(receipt.contentHash === await digest({ contractVersion: 1, sessionId: o.sessionId, draftVersion: receipt.draftVersion, payload: session.payload }));
  } else expect(o.status !== "COMPLETED");
  return session;
}
export async function parseOperation(value: unknown, expected: Prepared): Promise<Operation> {
  const o = record(value, ["contractVersion", "operationId", "kind", "sessionId", "state", "prepared", "receipt"]);
  expect(o.contractVersion === 1 && o.kind === "ONBOARDING_COMPLETE" && o.operationId === expected.operationId && o.sessionId === expected.sessionId && ["PREPARED", "CANCELLED", "COMPLETED"].includes(String(o.state)));
  const p = await parsePrepared(o.prepared); expect(canonicalString(p) === canonicalString(expected));
  if (o.state === "COMPLETED") await parseReceipt(o.receipt, expected); else expect(o.receipt === null);
  return o as Operation;
}
export function envelope(value: unknown): unknown { return record(value, ["data"]).data; }
export type CheckedJson = Obj;
