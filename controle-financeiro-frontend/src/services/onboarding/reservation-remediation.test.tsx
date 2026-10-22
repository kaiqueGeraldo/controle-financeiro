import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parse as parseJson } from "../vendor/lossless-json/parse";
import { onboardingClient } from "./client";
import { createOnboardingFlow } from "./flow";
import { parseReceipt, parseSummary } from "./result";

const e01 = JSON.parse(readFileSync("../tasks/evidencias/CF-028/examples.json", "utf8"));
const id = "20000000-0000-4000-8000-000000000011";
const evidenceId = "20000000-0000-4000-8000-000000000511";
// Same numeric policy as the production HTTP reader: counters are numbers;
// financial decimals remain JSON strings. Default lossless counters are not v1.
const wire = (body: string) => parseJson(body, undefined, { parseNumber: raw => Number(raw) });
const amount = (value: string) => ({ state: "KNOWN", value, knownSubtotal: value, outsideIndividualRange: false, missingPaths: [] });
const missing = { state: "UNKNOWN", value: null, knownSubtotal: null, outsideIndividualRange: null, missingPaths: ["/existing/reservations/amount"] };
function legacy() {
  return { reservationId: id, revision: "1", goal: { state: "KNOWN", value: structuredClone(e01.completeResponse.data.summary.byGoal[0].ref) }, nominal: amount("12.00"), attribution: { state: "CONFIRMED", parts: [{ source: structuredClone(e01.completeResponse.data.summary.bySource[0].ref), amount: amount("12.00") }], evidenceRefs: [evidenceId] } };
}
function withChange() {
  const summary = structuredClone(e01.completeResponse.data.summary);
  summary.reservationChanges = [{ reservationId: id, action: "CLOSE", previous: legacy(), proposed: { ...legacy(), revision: "2", nominal: amount("0.00"), attribution: { state: "CLOSED", evidenceRefs: [evidenceId] } } }];
  return summary;
}
function parentOf(root: object, path: string) {
  const keys = path.split("."); const key = keys.pop()!;
  const parent = keys.reduce((node, part) => node[part] as Record<string, unknown>, root as Record<string, unknown>);
  return { parent, key };
}
beforeEach(() => vi.stubGlobal("crypto", webcrypto));

describe("RC031-02 complete LegacyReservation boundary", () => {
  it.each(["previous", "proposed"])("rejects null goal and attribution in %s", side => {
    const summary = withChange(); summary.reservationChanges[0][side].goal = null; summary.reservationChanges[0][side].attribution = null;
    expect(() => parseSummary(summary)).toThrow();
  });
  it.each([null, [], 3, { toString: () => "GOAL" }])("rejects non-string reference discriminator %j", kind => {
    const summary = withChange(); summary.reservationChanges[0].previous.goal.value.kind = kind;
    expect(() => parseSummary(summary)).toThrow();
  });
  it.each(["goal.value", "attribution.parts", "attribution.evidenceRefs"])("rejects absent required member %s", path => {
    const summary = withChange(); const { parent, key } = parentOf(summary.reservationChanges[0].previous, path); delete parent[key];
    expect(() => parseSummary(summary)).toThrow();
  });
  const required = ["reservationId", "revision", "goal", "goal.state", "goal.value", "goal.value.kind", "goal.value.tempId", "nominal", "nominal.state", "nominal.value", "attribution", "attribution.state", "attribution.parts", "attribution.evidenceRefs", "attribution.parts.0.source", "attribution.parts.0.source.kind", "attribution.parts.0.source.tempId", "attribution.parts.0.amount"];
  it.each(required)("requires own member %s, not a prototype fallback", path => {
    const summary = withChange(); const r = summary.reservationChanges[0].previous;
    const { parent, key } = parentOf(r, path); const value = parent[key]; delete parent[key]; Object.setPrototypeOf(parent, { [key]: value });
    expect(Object.hasOwn(parent, key)).toBe(false);
    expect(() => parseSummary(summary)).toThrow();
  });
  it.each(["goal", "goal.value", "nominal", "attribution", "attribution.parts", "attribution.evidenceRefs", "attribution.parts.0.source", "attribution.parts.0.amount"])("rejects required null member %s", path => {
    const summary = withChange(); const { parent, key } = parentOf(summary.reservationChanges[0].previous, path); parent[key] = null;
    expect(() => parseSummary(summary)).toThrow();
  });
  it.each(["zero", "over-individual-limit", "wrong-nominal", "unknown-nominal-with-known-parts"])("rejects invalid confirmed allocation %s", variant => {
    const summary = withChange(); const r = summary.reservationChanges[0].previous;
    if (variant === "zero") r.attribution.parts[0].amount = amount("0.00");
    if (variant === "over-individual-limit") r.attribution.parts[0].amount = { ...amount("1000000000000.00"), outsideIndividualRange: true };
    if (variant === "wrong-nominal") r.nominal = amount("13.00");
    if (variant === "unknown-nominal-with-known-parts") r.nominal = structuredClone(missing);
    expect(() => parseSummary(summary)).toThrow();
  });
  it.each(["CONFIRMED", "PARTIAL", "UNKNOWN", "CANDIDATES", "UNBOUNDED", "CLOSED"])("accepts valid variant %s and allowed extra response metadata", variant => {
    const summary = withChange(); const r = summary.reservationChanges[0].previous;
    r.extension = { note: "allowed read metadata" };
    r.goal.value.extension = "allowed reference metadata";
    if (variant === "PARTIAL") { r.nominal = { ...amount("0.00"), state: "PARTIAL", value: null, missingPaths: ["/existing/reservations/amount"] }; r.attribution.parts[0].amount = structuredClone(r.nominal); }
    if (variant === "UNKNOWN") { r.nominal = structuredClone(missing); r.attribution.parts[0].amount = structuredClone(missing); }
    if (variant === "CANDIDATES") r.attribution = { state: variant, sources: [r.attribution.parts[0].source], evidenceRefs: [evidenceId] };
    if (variant === "UNBOUNDED") { r.goal = { state: "UNKNOWN" }; r.attribution = { state: variant, excluded: [{ source: r.attribution.parts[0].source, evidenceRefs: [evidenceId] }] }; }
    if (variant === "CLOSED") { r.nominal = amount("0.00"); r.attribution = { state: variant, evidenceRefs: [evidenceId] }; }
    expect(parseSummary(summary)).toBeTruthy();
  });
  it("validates the same structure in reservationReview, including inherited variant members", () => {
    const summary = withChange(); const r = legacy();
    summary.reservationReview = { reservations: [r], evidence: [], confirmations: [], decisions: summary.bySource.map((s: { ref: unknown }) => ({ source: s.ref, state: "ALLOWED", reason: null, blockingReservationIds: [] })) };
    expect(parseSummary(summary)).toBeTruthy();
    const refs = r.attribution.evidenceRefs; delete (r.attribution as Partial<typeof r.attribution>).evidenceRefs; Object.setPrototypeOf(r.attribution, { evidenceRefs: refs });
    expect(() => parseSummary(summary)).toThrow();
  });
  it.each(["CANDIDATES", "UNBOUNDED", "CLOSED"])("requires own variant members in %s too", variant => {
    const summary = withChange(); const r = summary.reservationChanges[0].previous;
    r.attribution = variant === "CANDIDATES" ? { state: variant, sources: [r.attribution.parts[0].source], evidenceRefs: [evidenceId] }
      : variant === "UNBOUNDED" ? { state: variant, excluded: [] } : { state: variant, evidenceRefs: [evidenceId] };
    if (variant === "CLOSED") r.nominal = amount("0.00");
    expect(parseSummary(summary)).toBeTruthy();
    const key = variant === "UNBOUNDED" ? "excluded" : "evidenceRefs";
    const value = r.attribution[key]; delete r.attribution[key]; Object.setPrototypeOf(r.attribution, { [key]: value });
    expect(() => parseSummary(summary)).toThrow();
  });
  it("validates nested exclusion evidence and does not reinterpret sources as an unbounded set", () => {
    const summary = withChange(); const r = summary.reservationChanges[0].previous;
    r.attribution = { state: "UNBOUNDED", excluded: [{ source: r.attribution.parts[0].source, evidenceRefs: [evidenceId] }] };
    expect(parseSummary(summary)).toBeTruthy();
    r.attribution.excluded[0].evidenceRefs = null; expect(() => parseSummary(summary)).toThrow();
    r.attribution.excluded = []; r.attribution.sources = []; expect(() => parseSummary(summary)).toThrow();
  });
  it("treats __proto__ as own JSON data without prototype mutation, and rejects missing goal.value", async () => {
    const receipt = structuredClone(e01.completeResponse.data); receipt.summary = withChange();
    const validGoal = receipt.summary.reservationChanges[0].previous.goal;
    receipt.summary.reservationChanges[0].previous.goal = Object.fromEntries([["state", "KNOWN"], ["__proto__", { value: validGoal.value }]]);
    const raw = JSON.stringify(receipt); const parsed = wire(raw) as typeof receipt;
    const goal = parsed.summary.reservationChanges[0].previous.goal;
    expect(Object.hasOwn(goal, "__proto__")).toBe(true); expect(Object.getPrototypeOf(goal)).toBe(Object.prototype); expect(Object.hasOwn(goal, "value")).toBe(false);
    expect(Object.getPrototypeOf({})).toBe(Object.prototype);
    await expect(parseReceipt(parsed)).rejects.toThrow();
  });
  it("accepts own fields on null-prototype objects and extra __proto__ JSON data", async () => {
    const receipt = structuredClone(e01.completeResponse.data); receipt.summary = withChange();
    const r = receipt.summary.reservationChanges[0].previous; r.goal = Object.assign(Object.create(null), r.goal);
    Object.defineProperty(r.goal, "__proto__", { value: { arbitrary: true }, enumerable: true });
    await expect(parseReceipt(receipt)).resolves.toBeTruthy();
    await expect(parseReceipt(wire(JSON.stringify(receipt)))).resolves.toBeTruthy();
  });
  it("rejects malformed network receipt in the client/store and recovers the valid original without another command", async () => {
    const valid = { ...structuredClone(e01.saveResponse.data), status: "COMPLETED", version: "2", pendingIntent: null, completedReceipt: structuredClone(e01.completeResponse.data) };
    const invalid = structuredClone(valid); invalid.completedReceipt.summary = withChange(); invalid.completedReceipt.summary.reservationChanges[0].previous.goal = null;
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ data: invalid }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: valid }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const flow = createOnboardingFlow({ ...onboardingClient, choices: async () => [] }, "owner-A");
    await flow.load(); expect(flow.snapshot().receipt).toBeNull(); expect(flow.snapshot().message).toContain("inválida");
    await flow.load(); expect(flow.snapshot().receipt?.operationId).toBe(valid.completedReceipt.operationId);
    expect(fetcher.mock.calls.map(c => c[1].method)).toEqual(["GET", "GET"]); flow.invalidate();
  });
});
