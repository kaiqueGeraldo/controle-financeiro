import type { CreateTransactionDTO, InvestmentOperationDTO } from "@/types";

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const uuid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const invalid = () => new Error("Resultado financeiro inválido; a operação continua pendente de confirmação.");
// FIN-06: 12 integer digits; inclusive maxima in the field's exact units.
const maxMoneyCents = BigInt("99999999999999");
const maxExecutionUnits = BigInt("99999999999999999999");

/** Exact decimal units from the legacy JSON number, including its exponent notation. */
function decimalUnits(value: number, scale: number): bigint | null {
  if (!Number.isFinite(value) || value < 0) return null;
  const [mantissa, exponent = "0"] = value.toString().split("e");
  const [whole, fraction = ""] = mantissa.split(".");
  const coefficient = BigInt(whole + fraction);
  const power = scale + Number(exponent) - fraction.length;
  if (power >= 0) return coefficient * BigInt(10) ** BigInt(power);
  const divisor = BigInt(10) ** BigInt(-power);
  return coefficient % divisor === BigInt(0) ? coefficient / divisor : null;
}

function boundedUnits(value: number, scale: 2 | 8): bigint | null {
  const units = decimalUnits(value, scale);
  return units !== null && units <= (scale === 2 ? maxMoneyCents : maxExecutionUnits) ? units : null;
}

const nullableMoney = (value: unknown) => value === null ||
  (finite(value) && boundedUnits(Math.abs(value), 2) !== null);

/** Authoritative decimal input: preserve its scale/digits rather than first coercing to Number. */
function amountCents(value: string): bigint | null {
  const match = /^(0|[1-9]\d{0,11})(?:\.(\d{1,2}))?$/.exec(value);
  if (!match || match[0] !== value) return null;
  return BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
}

/** FIN-06: exact execution product, rounded once to cents HALF_UP, before fees. */
function matchesExecutionGross(quantity: number, price: number, cents: bigint): boolean {
  const units = boundedUnits(quantity, 8);
  const unitPrice = boundedUnits(price, 8);
  if (units === null || unitPrice === null) return false;
  const centDivisor = BigInt("100000000000000"); // scale 16 product -> scale 2 money
  return (units * unitPrice + centDivisor / BigInt(2)) / centDivisor === cents;
}

/** Validate the immutable creation snapshot, never a projection of today's balance. */
export function validateTransactionResult(value: unknown, command: CreateTransactionDTO): void {
  if (!record(value) || !uuid(value.id) || value.type !== command.type || value.date !== command.date ||
      value.description !== command.description || value.accountId !== command.accountId ||
      !finite(value.amount) || value.amount <= 0 || value.amount !== Number(command.amount) ||
      value.isPaid !== command.isPaid || value.status !== (command.isPaid ? "SETTLED" : "PENDING") ||
      typeof value.isSystemManaged !== "boolean") throw invalid();
  if (command.type === "TRANSFER") {
    // This operationId identifies the ledger pair; it is NOT the transport intent key.
    if (!uuid(value.operationId) || value.origin !== "TRANSFER" || value.transferDirection !== "OUTBOUND" ||
        value.counterpartyAccountId !== command.destinationAccountId) throw invalid();
  } else if (value.origin !== "USER" || value.categoryId !== command.categoryId) throw invalid();
}

export function validateInvestmentResult(value: unknown, command: InvestmentOperationDTO): void {
  if (!record(value) || !uuid(value.id) || value.type !== command.type || value.date !== command.date ||
      value.dateOrigin !== "USER_INPUT" || !finite(value.quantity) || value.quantity <= 0 ||
      !finite(value.price) || value.price < 0 || !finite(value.totalValue) || value.totalValue <= 0 ||
      !finite(value.fees) || value.fees !== (command.fees ?? 0) ||
      !nullableMoney(value.costDelta) || !nullableMoney(value.realizedResult)) throw invalid();
  const grossCents = boundedUnits(value.totalValue, 2);
  const feeCents = boundedUnits(value.fees, 2);
  if (grossCents === null || feeCents === null || boundedUnits(value.quantity, 8) === null ||
      (command.type === "BUY" ? grossCents + feeCents > maxMoneyCents : feeCents > grossCents)) throw invalid();
  // NG-01: monetary redemption derives units/price; never rebuild its authoritative amount.
  if (command.amount !== undefined) {
    if (command.type !== "SELL" || grossCents !== amountCents(command.amount)) throw invalid();
  } else if (value.price === 0 || value.quantity !== command.quantity || value.price !== command.price ||
      !matchesExecutionGross(value.quantity, value.price, grossCents)) throw invalid();
}

export function validateCreationResponse(response: unknown, command: CreateTransactionDTO | InvestmentOperationDTO): void {
  if (!record(response)) throw invalid();
  validateCreationResult(response.data, command);
}

export function validateCreationResult(value: unknown, command: CreateTransactionDTO | InvestmentOperationDTO): void {
  if ("investmentId" in command) validateInvestmentResult(value, command);
  else validateTransactionResult(value, command);
}
