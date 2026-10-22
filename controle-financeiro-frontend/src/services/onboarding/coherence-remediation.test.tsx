import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { onboardingClient } from "./client";
import { createOnboardingFlow } from "./flow";
import { parseSession, parseSummary } from "./result";

const e01 = JSON.parse(readFileSync("../tasks/evidencias/CF-028/examples.json", "utf8"));
const bounds = JSON.parse(readFileSync("../tasks/evidencias/saneamento-CF-028-origem/snapshots.json", "utf8"));
const completed = () => ({ ...structuredClone(e01.saveResponse.data), status: "COMPLETED", version: "2", pendingIntent: null, completedReceipt: structuredClone(e01.completeResponse.data) });
beforeEach(() => vi.stubGlobal("crypto", webcrypto));

describe("RC031-01 exact consistency of the received snapshot", () => {
  it.each(["freeAccountCash", "unallocatedInvestments"])("rejects adulterated %s in GET after reload", async field => {
    const session = completed();
    session.completedReceipt.summary.metrics[field].value = "999999.00";
    session.completedReceipt.summary.metrics[field].knownSubtotal = "999999.00";
    await expect(parseSession(session)).rejects.toThrow("Resposta da entrevista inválida");
  });
  it("rejects a wrong partial free subtotal without promoting UNKNOWN to zero", () => {
    const fixture = bounds.cases.find((c: { name: string }) => c.name === "E19-R28-02-PARTIAL");
    const summary = structuredClone(fixture.prepareResponse.data.summary);
    expect(summary.metrics.freeAccountCash).toMatchObject({ state: "PARTIAL", value: null, knownSubtotal: "500.00" });
    summary.metrics.freeAccountCash.knownSubtotal = "501.00";
    expect(() => parseSummary(summary)).toThrow();
  });
  it.each(["KNOWN", "PARTIAL", "UNKNOWN"])("rejects incoherent free knowledge %s", state => {
    const summary = structuredClone(e01.completeResponse.data.summary);
    summary.metrics.freeAccountCash = state === "KNOWN"
      ? { state, value: "0.00", knownSubtotal: "0.00", outsideIndividualRange: false, missingPaths: [] }
      : { state, value: null, knownSubtotal: state === "PARTIAL" ? "950.00" : null, outsideIndividualRange: state === "PARTIAL" ? false : null, missingPaths: ["/made-up-gap"] };
    expect(() => parseSummary(summary)).toThrow();
  });
  it("refuses known free when the source value is unknown", () => {
    const summary = structuredClone(e01.completeResponse.data.summary);
    const source = summary.bySource.find((s: { ref: { kind: string } }) => s.ref.kind === "INVESTMENT");
    source.value = { state: "UNKNOWN" };
    expect(() => parseSummary(summary)).toThrow();
  });
  it("accepts all normative wide, negative, partial, unknown, zero and numeric-NA controls", () => {
    for (const fixture of bounds.cases) expect(parseSummary(fixture.prepareResponse.data.summary)).toBeTruthy();
    const result = parseSummary(e01.completeResponse.data.summary);
    expect(result.metrics.freeAccountCash.value).toBe("950.00");
    expect(result.metrics.unallocatedInvestments.value).toBe("301.00");
    expect(result.byGoal.find(g => g.type === "NUMERIC")?.covered.state).toBe("NOT_APPLICABLE");
  });
  it("rejects false completion in the real HTTP client/store, then reloads the valid historical receipt", async () => {
    const invalid = completed(); invalid.completedReceipt.summary.metrics.freeAccountCash.value = invalid.completedReceipt.summary.metrics.freeAccountCash.knownSubtotal = "999999.00";
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ data: invalid }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: completed() }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const flow = createOnboardingFlow({ ...onboardingClient, choices: async () => [] }, "owner-A");
    await flow.load(); expect(flow.snapshot().receipt).toBeNull(); expect(flow.snapshot().message).toContain("inválida");
    await flow.load(); expect(flow.snapshot().receipt?.operationId).toBe(e01.completeResponse.data.operationId);
    expect(flow.snapshot().receipt?.summary.metrics.freeAccountCash.value).toBe("950.00");
    expect(fetcher.mock.calls.map(c => c[1].method)).toEqual(["GET", "GET"]);
    flow.invalidate();
  });
});
