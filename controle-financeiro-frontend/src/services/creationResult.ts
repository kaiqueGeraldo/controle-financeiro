import type { CreateTransactionDTO, InvestmentOperationDTO } from "@/types";
import { LosslessNumber } from "lossless-json";
import { ownRecord } from "./ownRecord";

const uuid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const invalid = () => new Error("Resultado financeiro inválido; a operação continua pendente de confirmação.");
// FIN-06: 12 integer digits; inclusive maxima in the field's exact units.
const maxMoneyCents = BigInt("99999999999999");
const maxExecutionUnits = BigInt("99999999999999999999");

/** HTTP decimal lexeme, or the exact serialized value of an existing numeric command. */
function decimalUnits(value: unknown, scale: number, absolute = false): bigint | null {
  if (!(value instanceof LosslessNumber) && !finite(value)) return null;
  const raw = value instanceof LosslessNumber ? value.value : value.toString();
  const text = absolute ? raw.replace(/^-/, "") : raw;
  const match = /^(0|[1-9]\d*)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(text);
  if (!match || match[0] !== text) return null;
  const fraction = match[2] ?? "";
  const exponent = Number(match[3] ?? "0");
  // Bound work on untrusted tokens; valid FIN-06/NG-01 values are far below this.
  if (text.length > 1024 || !Number.isSafeInteger(exponent) || Math.abs(exponent) > 1024) return null;
  const coefficient = BigInt(match[1] + fraction);
  const power = scale + exponent - fraction.length;
  if (power >= 0) return coefficient * BigInt(10) ** BigInt(power);
  const divisor = BigInt(10) ** BigInt(-power);
  return coefficient % divisor === BigInt(0) ? coefficient / divisor : null;
}

function boundedUnits(value: unknown, scale: 2 | 8, absolute = false): bigint | null {
  const units = decimalUnits(value, scale, absolute);
  return units !== null && units <= (scale === 2 ? maxMoneyCents : maxExecutionUnits) ? units : null;
}

const nullableMoney = (value: unknown) => value === null || boundedUnits(value, 2, true) !== null;

/** Authoritative decimal input: preserve its scale/digits rather than first coercing to Number. */
function amountCents(value: string): bigint | null {
  const match = /^(0|[1-9]\d{0,11})(?:\.(\d{1,2}))?$/.exec(value);
  if (!match || match[0] !== value) return null;
  return BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
}

/** FIN-06: exact execution product, rounded once to cents HALF_UP, before fees. */
function matchesExecutionGross(quantity: unknown, price: unknown, cents: bigint): boolean {
  const units = boundedUnits(quantity, 8);
  const unitPrice = boundedUnits(price, 8);
  if (units === null || unitPrice === null) return false;
  const centDivisor = BigInt("100000000000000"); // scale 16 product -> scale 2 money
  return (units * unitPrice + centDivisor / BigInt(2)) / centDivisor === cents;
}

/** Validate the immutable creation snapshot, never a projection of today's balance. */
export function validateTransactionResult(value: unknown, command: CreateTransactionDTO): void {
  if (!ownRecord(value, ["id", "type", "date", "description", "accountId", "amount", "isPaid", "status", "isSystemManaged", "origin"]) ||
      !uuid(value.id) || value.type !== command.type || value.date !== command.date ||
      value.description !== command.description || value.accountId !== command.accountId ||
      !finite(value.amount) || value.amount <= 0 || value.amount !== Number(command.amount) ||
      value.isPaid !== command.isPaid || value.status !== (command.isPaid ? "SETTLED" : "PENDING") ||
      typeof value.isSystemManaged !== "boolean") throw invalid();
  if (command.type === "TRANSFER") {
    // This operationId identifies the ledger pair; it is NOT the transport intent key.
    if (!ownRecord(value, ["operationId", "transferDirection", "counterpartyAccountId"]) ||
        !uuid(value.operationId) || value.origin !== "TRANSFER" || value.transferDirection !== "OUTBOUND" ||
        value.counterpartyAccountId !== command.destinationAccountId) throw invalid();
  } else if (!Object.hasOwn(value, "categoryId") || value.origin !== "USER" || value.categoryId !== command.categoryId) throw invalid();
}

export function validateInvestmentResult(value: unknown, command: InvestmentOperationDTO): void {
  if (!ownRecord(value, ["id", "type", "date", "dateOrigin", "quantity", "price", "totalValue", "fees", "costDelta", "realizedResult"]) ||
      !uuid(value.id) || value.type !== command.type || value.date !== command.date ||
      value.dateOrigin !== "USER_INPUT" ||
      !nullableMoney(value.costDelta) || !nullableMoney(value.realizedResult)) throw invalid();
  const grossCents = boundedUnits(value.totalValue, 2);
  const feeCents = boundedUnits(value.fees, 2);
  const quantity = boundedUnits(value.quantity, 8);
  const price = decimalUnits(value.price, 8);
  if (grossCents === null || grossCents <= BigInt(0) || feeCents === null ||
      feeCents !== boundedUnits(command.fees ?? 0, 2) || quantity === null || quantity <= BigInt(0) || price === null ||
      (command.type === "BUY" ? grossCents + feeCents > maxMoneyCents : feeCents > grossCents)) throw invalid();
  // NG-01: monetary redemption derives units/price; never rebuild its authoritative amount.
  if (command.amount !== undefined) {
    if (command.type !== "SELL" || grossCents !== amountCents(command.amount)) throw invalid();
  } else if (price === BigInt(0) || quantity !== boundedUnits(command.quantity, 8) || price !== boundedUnits(command.price, 8) ||
      !matchesExecutionGross(value.quantity, value.price, grossCents)) throw invalid();
}

export function validateCreationResponse(response: unknown, command: CreateTransactionDTO | InvestmentOperationDTO): void {
  if (!ownRecord(response, ["data"])) throw invalid();
  validateCreationResult(response.data, command);
}

export function validateCreationResult(value: unknown, command: CreateTransactionDTO | InvestmentOperationDTO): void {
  if ("investmentId" in command) {
    if (!Object.hasOwn(command, "investmentId")) throw invalid();
    validateInvestmentResult(value, command);
  } else validateTransactionResult(value, command);
}
