import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { check, civilDate, decimal, formatExact, normalizeInterview, parseInterview, refRule } from "./input";
import { canonicalString, envelope, parseOperation, parsePrepared, parseReceipt, parseSession, parseSummary, summaryAmount } from "./result";
import { onboardingClient } from "./client";
import { ApiError } from "../api";

// Approved SPEC examples are independent of the client implementation.
const e01 = JSON.parse(readFileSync("../tasks/evidencias/CF-028/examples.json", "utf8"));
const bounds = JSON.parse(readFileSync("../tasks/evidencias/saneamento-CF-028-origem/snapshots.json", "utf8"));
const boundaryNames: string[] = bounds.cases.map((c: { name: string }) => c.name);
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
describe("SPEC-001 entry boundary", () => {
  it.each(["1.005", "1000000000000.00", "01.00", "-0.00", "1e2", "1,00", " 1.00", 1])("rejects malformed money %s without rounding", value => expect(decimal(value, 2, true)).toBe(false));
  it("preserves maximum, NG-01 quantity, negative account and explicit zero", () => {
    expect(decimal("999999999999.99", 2)).toBe(true); expect(decimal("0.00000001", 8)).toBe(true); expect(decimal("-0.01", 2, true)).toBe(true); expect(decimal("0", 2)).toBe(true);
    expect(formatExact("1999999999999.98")).toBe("R$ 1.999.999.999.999,98");
  });
  it.each([["2028-02-29", true], ["2027-02-29", false], ["0001-01-01", true], ["9999-12-31", true], ["0000-01-01", false], ["2026-02-30", false], ["2026-10-09T00:00:00Z", false]])("validates civil calendar %s", (input, expected) => expect(civilDate(input)).toBe(expected));
  it("normalizes only declared decimals and preserves UNKNOWN, NA and missing leaves", () => {
    const p = parseInterview(structuredClone(e01.draft.payload)); p.sections.accounts.items[1].balance = { state: "KNOWN", value: "1.2" }; delete p.context.baseDate;
    const normalized = normalizeInterview(p); expect(normalized.sections.accounts.items[1].balance).toEqual({ state: "KNOWN", value: "1.20" }); expect(normalized.context).not.toHaveProperty("baseDate"); expect(normalized.sections.investments.items[0].cost).toEqual({ state: "UNKNOWN" }); expect(normalized.sections.investments.items[0].quantity).toEqual({ state: "NOT_APPLICABLE" });
  });
  it("requires exactly one own reference identity", () => {
    const id = e01.existing.account.id; const rule = refRule("ACCOUNT");
    expect(check(rule, { kind: "ACCOUNT", id, tempId: "invalid" }).length).toBeGreaterThan(0);
    expect(check(rule, Object.assign(Object.create({ id }), { kind: "ACCOUNT" })).length).toBeGreaterThan(0);
    expect(check(rule, { kind: "ACCOUNT", id })).toEqual([]);
  });
});
describe("authoritative reading, no false completion", () => {
  it("validates E01 hashes, identity, summary, receipt and operation", async () => {
    const session = await parseSession(e01.saveResponse.data); const p = await parsePrepared(e01.prepareResponse.data, session, e01.prepareRequest.operationId);
    expect(p.summary.metrics.netWorth.value).toBe("1451.00"); expect(p.summary.byCard[0].availableLimit.value).toBe("656.00");
    const receipt = await parseReceipt(e01.completeResponse.data, p, session.payload); expect(receipt.mapping).toHaveLength(16);
    expect((await parseOperation(e01.recoveryResponse.data, p)).state).toBe("COMPLETED");
  });
  it.each(boundaryNames)("accepts independent %s aggregates/uncertainty", async name => {
    const fixture = bounds.cases.find((c: { name: string }) => c.name === name);
    const summary = parseSummary(fixture.prepareResponse.data.summary);
    if (name === "E16-R28-01A") { expect(summary.metrics.netWorth.value).toBe("1999999999999.98"); expect(summary.metrics.netWorth.outsideIndividualRange).toBe(true); }
    if (name === "E19-R28-02-PARTIAL") { expect(summary.metrics.reservedAccounts.state).toBe("PARTIAL"); expect(summary.metrics.freeAccountCash.knownSubtotal).toBe("500.00"); }
    if (name === "E18-R28-02") { expect(summary.metrics.reservedAccounts.state).toBe("UNKNOWN"); expect(summary.metrics.netWorth.value).toBe("1000.00"); }
  });
  it.each([null, {}, [], { data: null }, Object.create({ data: e01.saveResponse.data })])("rejects invalid envelope/session %j", async value => {
    await expect(async () => parseSession(envelope(value))).rejects.toThrow();
  });
  it.each(["wrong total", "number", "missing own", "unknown zero", "partial no paths", "wrong range"])('rejects %s in summary', kind => {
    const s = structuredClone(e01.prepareResponse.data.summary);
    if (kind === "wrong total") s.metrics.netWorth.value = s.metrics.netWorth.knownSubtotal = "1452.00";
    if (kind === "number") s.metrics.netWorth.value = s.metrics.netWorth.knownSubtotal = 1451;
    if (kind === "missing own") s.metrics.netWorth = Object.create(s.metrics.netWorth);
    if (kind === "unknown zero") s.metrics.netWorth = { state: "UNKNOWN", value: "0.00", knownSubtotal: null, outsideIndividualRange: null, missingPaths: ["/existing"] };
    if (kind === "partial no paths") s.metrics.netWorth = { ...s.metrics.netWorth, state: "PARTIAL", value: null };
    if (kind === "wrong range") s.metrics.netWorth.outsideIndividualRange = true;
    expect(() => parseSummary(s)).toThrow();
  });
  it("rejects subtotal as full free value and invalid permission", () => {
    const fixture = bounds.cases.find((c: { name: string }) => c.name === "E19-R28-02-PARTIAL"); const s = structuredClone(fixture.prepareResponse.data.summary);
    s.bySource[0].free = { state: "KNOWN", value: "700.00", knownSubtotal: "700.00", outsideIndividualRange: false, missingPaths: [] };
    expect(() => parseSummary(s)).toThrow();
  });
  it("detects unchanged hash over adulterated prepare and missing mapping", async () => {
    const p = structuredClone(e01.prepareResponse.data); p.summary.existingAsOf = "2026-10-09T15:01:00Z";
    await expect(parsePrepared(p)).resolves.toBeTruthy(); // capture time alone is excluded by contract
    p.summary.baseDate = "2026-10-08"; await expect(parsePrepared(p)).rejects.toThrow();
    const missing = structuredClone(e01.prepareResponse.data); missing.mappingPreview.pop();
    await expect(parsePrepared(missing, e01.saveResponse.data)).rejects.toThrow();
  });
  it.each(["operation", "summary", "mapping", "id", "inherited status"])('rejects incompatible receipt %s', async kind => {
    const p = await parsePrepared(e01.prepareResponse.data); const r = structuredClone(e01.completeResponse.data);
    if (kind === "operation") r.operationId = crypto.randomUUID();
    if (kind === "summary") r.summary.existingAsOf = "2026-10-09T15:01:00Z";
    if (kind === "mapping") r.mapping.pop();
    if (kind === "id") r.mapping[0].id = "bad";
    if (kind === "inherited status") { delete r.status; Object.setPrototypeOf(r, { status: "COMPLETED" }); }
    await expect(parseReceipt(r, p)).rejects.toThrow();
  });
  it("renders different semantic states, including NA only where allowed", () => {
    expect(summaryAmount({ state: "UNKNOWN", value: null, knownSubtotal: null, outsideIndividualRange: null, missingPaths: ["/existing"] }).state).toBe("UNKNOWN");
    expect(() => summaryAmount({ state: "NOT_APPLICABLE", value: null, knownSubtotal: null, outsideIndividualRange: null, missingPaths: [] })).toThrow();
  });
  it("transports strings exactly through shared BFF client and rejects duplicate keys", async () => {
    const session = await parseSession(e01.saveResponse.data); const p = structuredClone(session.payload!); p.sections.accounts.items[1].balance = { state: "KNOWN", value: "999999999999.99" };
    const result = { ...session, version: "2", payload: p };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: result }), { status: 200 })); vi.stubGlobal("fetch", fetcher);
    await onboardingClient.save(session, "SAVE", p); const call = fetcher.mock.calls[0]; expect(call[0]).toBe("/api/onboarding/draft"); expect(String(call[1].body)).toContain('"999999999999.99"');
    fetcher.mockResolvedValue(new Response('{"data":{},"data":null}', { status: 200 })); await expect(onboardingClient.get()).rejects.toThrow();
  });
  it("preserves server JSON Pointer issues through shared error handling", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "INVALID_FIELD", message: "Revise os campos.", fieldErrors: [{ path: "/context/baseDate", code: "AFTER_TODAY", message: "Escolha uma data até hoje em São Paulo." }] } }), { status: 400 })));
    try { await onboardingClient.get(); throw new Error("missing rejection"); } catch (e) { expect(e).toBeInstanceOf(ApiError); expect((e as ApiError).fields["/context/baseDate"]).toEqual(["Escolha uma data até hoje em São Paulo."]); }
  });
  it("canonicalizes array/object order without monetary Number", () => expect(canonicalString({ b: [{ tempId: "b", amount: "999999999999.99" }, { tempId: "a", amount: "0.01" }], a: true })).toBe('{"a":true,"b":[{"amount":"0.01","tempId":"a"},{"amount":"999999999999.99","tempId":"b"}]}'));
});
