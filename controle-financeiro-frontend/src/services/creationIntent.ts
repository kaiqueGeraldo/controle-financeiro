import { apiRequest } from "./api";
import type { CreateTransactionDTO, InvestmentOperationDTO } from "@/types";
import { validateCreationResult } from "./creationResult";

export type CreationKind = "TRANSACTION_CREATE" | "INVESTMENT_OPERATION";
export type CreationCommand = CreateTransactionDTO | InvestmentOperationDTO;
export type SavedCreation = { version: 1; ownerId: string; kind: CreationKind; label?: string; command: CreationCommand & { operationId: string } };
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
const string = (value: unknown) => typeof value === "string";
const money = (value: unknown) => string(value) || (typeof value === "number" && Number.isFinite(value));

/** Versioned local envelope only. The server's existing receipt/fingerprint is authoritative. */
export function parseSavedCreation(raw: string, ownerId: string, kind: CreationKind): SavedCreation {
  const value: unknown = JSON.parse(raw);
  if (!record(value) || value.version !== 1 || value.ownerId !== ownerId || value.kind !== kind || (value.label !== undefined && !string(value.label)) || !record(value.command)) throw new Error("Intenção salva inválida. Confira o histórico antes de uma nova operação.");
  const c = value.command;
  const common = uuid(c.operationId) && string(c.date) && string(c.accountId);
  const valid = kind === "TRANSACTION_CREATE"
    ? common && string(c.description) && money(c.amount) && typeof c.type === "string" && ["INCOME", "EXPENSE", "TRANSFER"].includes(c.type) && string(c.categoryId) && typeof c.isPaid === "boolean" && (c.time == null || string(c.time)) && (c.destinationAccountId === undefined || string(c.destinationAccountId)) && (c.fee === undefined || string(c.fee))
    : common && string(c.investmentId) && typeof c.type === "string" && ["BUY", "SELL", "DIVIDEND", "INTEREST"].includes(c.type) && typeof c.quantity === "number" && Number.isFinite(c.quantity) && typeof c.price === "number" && Number.isFinite(c.price) && (c.fees === undefined || (typeof c.fees === "number" && Number.isFinite(c.fees))) && (c.amount === undefined || string(c.amount));
  if (!valid) throw new Error("Conteúdo da intenção salva inválido. Confira o histórico antes de uma nova operação.");
  // Every persisted field used by either command is checked above; unknown fields are retained verbatim for retry.
  return value as SavedCreation;
}

export async function recoverCreation(saved: SavedCreation) {
  const response = await apiRequest<unknown>(`/financial-intents/${saved.command.operationId}`, {
    method: "GET", investmentSnapshot: saved.kind === "INVESTMENT_OPERATION",
  });
  const receipt = response.data;
  if (!record(receipt) || receipt.operationId !== saved.command.operationId || receipt.kind !== saved.kind || !record(receipt.result)) throw new Error("Recibo inválido; a operação continua pendente.");
  validateCreationResult(receipt.result, saved.command);
}
