import { apiRequest } from "../api";
import { ownRecord } from "../ownRecord";
import { uuid } from "./input";
import { canonicalString, envelope, parseOperation, parsePrepared, parseReceipt, parseSession } from "./result";
import type { Choice, Interview, Prepared, Session } from "./model";

export type DraftAction = "SAVE" | "PAUSE" | "RESUME" | "DISCARD";
export type PrepareCommand = { contractVersion: 1; sessionId: string; expectedVersion: string; operationId: string };
const request = async (path: string, method: string, body?: unknown, signal?: AbortSignal) => {
  const response = await apiRequest<unknown>(`/onboarding${path}`, { method, signal, onboardingJson: true, ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  return envelope(response.data);
};
export const onboardingClient = {
  get: async (signal?: AbortSignal) => parseSession(await request("", "GET", undefined, signal)),
  save: async (session: Session, action: DraftAction, payload: Interview, signal?: AbortSignal) => {
    const result = await parseSession(await request("/draft", "PUT", { contractVersion: 1, expectedVersion: session.version, action, ...(action === "DISCARD" ? {} : { payload }) }, signal));
    const expectedStatus = action === "PAUSE" || action === "DISCARD" || action === "SAVE" && session.status === "SKIPPED" && session.payload !== null ? "SKIPPED" : "IN_PROGRESS";
    if (session.sessionId !== null && result.sessionId !== session.sessionId || BigInt(result.version) !== BigInt(session.version) + BigInt(1) || result.status !== expectedStatus || canonicalString(result.payload) !== canonicalString(action === "DISCARD" ? null : payload)) throw new Error("O salvamento não pôde ser confirmado. Consulte o rascunho no servidor.");
    return result;
  },
  prepare: async (command: PrepareCommand, session: Session, signal?: AbortSignal) => parsePrepared(await request("/prepare", "POST", command, signal), session, command.operationId),
  complete: async (prepared: Prepared, signal?: AbortSignal) => parseReceipt(await request("/complete", "POST", { contractVersion: 1, sessionId: prepared.sessionId, expectedVersion: prepared.draftVersion, operationId: prepared.operationId, contentHash: prepared.contentHash, reviewHash: prepared.reviewHash, confirm: true }, signal), prepared),
  recover: async (prepared: Prepared, signal?: AbortSignal) => parseOperation(await request(`/operations/${prepared.operationId}`, "GET", undefined, signal), prepared),
  cancel: async (prepared: Prepared, signal?: AbortSignal) => parseOperation(await request(`/intents/${prepared.operationId}/cancel`, "POST", { sessionId: prepared.sessionId, expectedVersion: prepared.draftVersion }, signal), prepared),
  choices: async (signal?: AbortSignal): Promise<Choice[]> => {
    const resources = [["accounts", "ACCOUNT"], ["cards", "CARD"], ["investments", "INVESTMENT"], ["goals", "GOAL"], ["categories", "CATEGORY"]] as const;
    const results = await Promise.all(resources.map(async ([path, kind]) => {
      const r = await apiRequest<unknown>(`/${path}`, { method: "GET", signal });
      if (!Array.isArray(r.data)) throw new Error("Não foi possível ler os cadastros existentes.");
      return r.data.map((v): Choice => {
        if (!ownRecord(v, ["id"]) || !uuid(v.id)) throw new Error("Cadastro recebido inválido.");
        const label = typeof v.name === "string" ? v.name : typeof v.title === "string" ? v.title : "Registro existente";
        return { id: v.id, kind, label, ...(typeof v.type === "string" ? { type: v.type } : {}) };
      });
    }));
    return results.flat();
  },
};
export type OnboardingClient = typeof onboardingClient;
