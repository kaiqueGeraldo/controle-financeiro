import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api";
import { createOnboardingFlow } from "./flow";
import { parseInterview } from "./input";
import type { OnboardingClient } from "./client";
import type { Prepared, Receipt, Session } from "./model";

const fixture = JSON.parse(readFileSync("../tasks/evidencias/CF-028/examples.json", "utf8"));
const saved: Session = fixture.saveResponse.data;
const prepared: Prepared = fixture.prepareResponse.data;
const receipt: Receipt = fixture.completeResponse.data;
const initial: Session = { contractVersion: 1, sessionId: null, version: "0", status: "NOT_STARTED", mode: "NEW", payload: null, issues: [], updatedAt: null, pendingIntent: null, completedReceipt: null };
function deferred<T>() { let resolve!: (v: T) => void; let reject!: (e: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function client(): OnboardingClient {
  return {
    get: vi.fn(async () => structuredClone(initial)), choices: vi.fn(async () => []),
    save: vi.fn(async (_s, _a, payload) => ({ ...structuredClone(saved), payload })),
    prepare: vi.fn(async c => ({ ...structuredClone(prepared), operationId: c.operationId })),
    complete: vi.fn(async p => ({ ...structuredClone(receipt), operationId: p.operationId })),
    recover: vi.fn<OnboardingClient["recover"]>(async p => ({ contractVersion: 1, operationId: p.operationId, sessionId: p.sessionId, kind: "ONBOARDING_COMPLETE", state: "PREPARED", prepared: p, receipt: null })),
    cancel: vi.fn<OnboardingClient["cancel"]>(async p => ({ contractVersion: 1, operationId: p.operationId, sessionId: p.sessionId, kind: "ONBOARDING_COMPLETE", state: "CANCELLED", prepared: p, receipt: null })),
  };
}
async function editable(c = client()) { const f = createOnboardingFlow(c, "owner-A"); await f.load(); f.edit(parseInterview(structuredClone(saved.payload))); return { c, f }; }
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
describe("onboarding lifecycle", () => {
  it("keeps responses and temporary references while navigating", async () => {
    const { f } = await editable(); f.go("ACCOUNTS"); f.go("ALLOCATIONS"); expect(f.snapshot().draft?.sections.accounts.items[1].balance).toEqual({ state: "KNOWN", value: "1000.00" }); expect(f.snapshot().draft?.sections.allocations.items[0].source).toEqual({ kind: "ACCOUNT", tempId: "00000000-0000-4000-8000-000000000002" });
  });
  it("saves and reloads only confirmed server responses", async () => {
    const { f, c } = await editable(); await f.save(); expect(f.snapshot().dirty).toBe(false); vi.mocked(c.get).mockResolvedValue(structuredClone(saved)); const reopened = createOnboardingFlow(c); await reopened.load(); expect(reopened.snapshot().draft).toEqual(saved.payload);
  });
  it("reconciles a lost save without another PUT", async () => {
    const { f, c } = await editable(); vi.mocked(c.save).mockRejectedValue(new ApiError("503", 503, { requiresReconciliation: true }));
    await f.save(); expect(f.snapshot().saveUnknown).toBe(true); expect(f.snapshot().draft).toEqual(saved.payload); vi.mocked(c.get).mockResolvedValue(structuredClone(saved)); await f.recover(); expect(f.snapshot().saveUnknown).toBe(false); expect(f.snapshot().dirty).toBe(false); expect(c.save).toHaveBeenCalledTimes(1);
  });
  it("preserves local edits on 409 and presents remote for explicit comparison", async () => {
    const { f, c } = await editable(); vi.mocked(c.save).mockRejectedValue(new ApiError("conflict", 409, { code: "VERSION_CONFLICT", requiresReconciliation: true })); await f.save();
    const remote = { ...structuredClone(saved), version: "2", payload: { ...structuredClone(saved.payload!), context: { ...saved.payload!.context, preferredName: "Outra aba" } } }; vi.mocked(c.get).mockResolvedValue(remote); await f.recover();
    expect(f.snapshot().draft?.context.preferredName).toBeUndefined(); expect(f.snapshot().remote).toEqual(remote); expect(c.save).toHaveBeenCalledTimes(1);
    f.useRemote(); expect(f.snapshot().draft?.context.preferredName).toBe("Outra aba");
  });
  it("same payload at the old version does not prove a lost save or pause committed", async () => {
    const c = client(); vi.mocked(c.get).mockResolvedValue(structuredClone(saved)); const f = createOnboardingFlow(c); await f.load();
    vi.mocked(c.save).mockRejectedValue(new ApiError("503", 503, { requiresReconciliation: true })); await f.save("PAUSE"); await f.recover();
    expect(f.snapshot().remote?.status).toBe("IN_PROGRESS"); expect(f.snapshot().message).toContain("Compare"); expect(c.save).toHaveBeenCalledTimes(1);
  });
  it("allows local overwrite only after comparison and uses the compared version", async () => {
    const { f, c } = await editable(); vi.mocked(c.get).mockResolvedValue({ ...structuredClone(saved), version: "7" }); await f.recover(); expect(f.snapshot().remote?.version).toBe("7"); await f.saveLocalOverCompared(); expect(vi.mocked(c.save).mock.calls[0][0].version).toBe("7");
  });
  it("associates server issues to fields without replacing draft", async () => {
    const { f, c } = await editable(); vi.mocked(c.save).mockRejectedValue(new ApiError("invalid", 400, { fields: { "/sections/accounts/items/1/balance/value": ["Valor inválido"] } })); await f.save(); expect(f.snapshot().issues).toEqual([{ path: "/sections/accounts/items/1/balance/value", code: "SERVER", message: "Valor inválido" }]); expect(f.snapshot().draft).toEqual(saved.payload); expect(f.snapshot().saveUnknown).toBe(false);
  });
  it("ignores a late owner-A load after unmount while owner-B is loading", async () => {
    const a = client(), b = client(); const delayA = deferred<Session>(), delayB = deferred<Session>(); vi.mocked(a.get).mockReturnValue(delayA.promise); vi.mocked(b.get).mockReturnValue(delayB.promise);
    const flowA = createOnboardingFlow(a, "A"), flowB = createOnboardingFlow(b, "B"); const old = flowA.load(); flowA.invalidate(); const next = flowB.load(); delayA.resolve(structuredClone(saved)); await old;
    expect(flowA.snapshot().draft).toBeNull(); expect(flowB.snapshot().busy).toBe(true); expect(flowB.snapshot().draft).toBeNull(); delayB.resolve(structuredClone(initial)); await next; expect(flowB.snapshot().session?.status).toBe("NOT_STARTED");
  });
  it("late save cannot alter reactivated form-B busy state or content", async () => {
    const { f, c } = await editable(); const oldSave = deferred<Session>(); vi.mocked(c.save).mockReturnValue(oldSave.promise); const old = f.save(); f.invalidate(); f.activate();
    const newLoad = deferred<Session>(); vi.mocked(c.get).mockReturnValue(newLoad.promise); const next = f.load(); oldSave.resolve(structuredClone(saved)); await old; expect(f.snapshot().busy).toBe(true); expect(f.snapshot().draft).toBeNull(); newLoad.resolve(initial); await next; expect(f.snapshot().session?.version).toBe("0");
  });
  it("guards double activation and retries the same frozen confirmation", async () => {
    const { f, c } = await editable(); await f.prepare(); const p = f.snapshot().prepared!; const pending = deferred<Receipt>(); vi.mocked(c.complete).mockReturnValue(pending.promise); const first = f.confirm(); await f.confirm(); expect(c.complete).toHaveBeenCalledTimes(1); pending.reject(new Error("invalid receipt")); await first;
    expect(f.snapshot().unknown).toBe(true); expect(f.snapshot().prepared).toEqual(p); vi.mocked(c.complete).mockResolvedValue({ ...receipt, operationId: p.operationId }); await f.confirm(); expect(c.complete).toHaveBeenCalledTimes(2); expect(vi.mocked(c.complete).mock.calls[0][0]).toEqual(vi.mocked(c.complete).mock.calls[1][0]); expect(f.snapshot().receipt?.operationId).toBe(p.operationId);
  });
  it("recovers COMPLETED without posting another financial operation", async () => {
    const { f, c } = await editable(); await f.prepare(); const p = f.snapshot().prepared!; vi.mocked(c.recover).mockResolvedValue({ contractVersion: 1, operationId: p.operationId, sessionId: p.sessionId, kind: "ONBOARDING_COMPLETE", state: "COMPLETED", prepared: p, receipt: { ...receipt, operationId: p.operationId } }); await f.recover(); expect(f.snapshot().receipt).not.toBeNull(); expect(c.complete).not.toHaveBeenCalled(); expect(c.prepare).toHaveBeenCalledTimes(1);
  });
  it("404 recovery consults session and does not invent a new operation", async () => {
    const { f, c } = await editable(); await f.prepare(); const p = f.snapshot().prepared!; vi.mocked(c.recover).mockRejectedValue(new ApiError("not found", 404)); vi.mocked(c.get).mockResolvedValue({ ...saved, pendingIntent: p }); await f.recover(); expect(f.snapshot().prepared?.operationId).toBe(p.operationId); expect(f.snapshot().unknown).toBe(true); expect(c.prepare).toHaveBeenCalledTimes(1); expect(c.complete).not.toHaveBeenCalled();
  });
  it("retries uncertain preparation with exactly the first identity and content", async () => {
    const { f, c } = await editable(); vi.mocked(c.prepare).mockRejectedValueOnce(new Error("invalid response")); await f.prepare(); const command = f.snapshot().prepareAttempt; expect(command).not.toBeNull(); await f.retryPrepare(); expect(vi.mocked(c.prepare).mock.calls[0][0]).toEqual(vi.mocked(c.prepare).mock.calls[1][0]); expect(f.snapshot().prepared?.operationId).toBe(command?.operationId);
  });
  it("requires cancellation before editing prepared snapshot", async () => {
    const { f, c } = await editable(); await f.prepare(); const original = structuredClone(f.snapshot().draft); f.go("CONTEXT"); expect(f.snapshot().draft).toEqual(original); vi.mocked(c.get).mockResolvedValue({ ...saved, version: "2" }); await f.cancel(); expect(f.snapshot().prepared).toBeNull(); expect(f.snapshot().reviewForEditing).toEqual(prepared.summary); f.go("CONTEXT"); expect(f.snapshot().draft?.currentStep).toBe("CONTEXT");
  });
  it("does not infer rollback when cancellation loses the race", async () => {
    const { f, c } = await editable(); await f.prepare(); vi.mocked(c.cancel).mockRejectedValue(new ApiError("done", 409, { code: "ALREADY_COMPLETED", requiresReconciliation: true })); await f.cancel(); expect(f.snapshot().prepared).not.toBeNull(); expect(f.snapshot().receipt).toBeNull(); expect(f.snapshot().message).toContain("Consulte");
  });
  it("does not prepare paused sessions and resumes explicitly", async () => {
    const c = client(); vi.mocked(c.get).mockResolvedValue({ ...saved, status: "SKIPPED" }); const f = createOnboardingFlow(c); await f.load(); await f.prepare(); expect(c.prepare).not.toHaveBeenCalled(); await f.save("RESUME"); expect(vi.mocked(c.save).mock.calls[0][1]).toBe("RESUME");
  });
  it("never stores sensitive payload in local or tab storage", async () => {
    const local = vi.spyOn(Storage.prototype, "setItem"); const { f } = await editable(); await f.prepare(); await f.confirm(); expect(local).not.toHaveBeenCalled(); f.invalidate(); expect(f.snapshot().draft).toBeNull(); expect(f.snapshot().prepared).toBeNull();
  });
});
