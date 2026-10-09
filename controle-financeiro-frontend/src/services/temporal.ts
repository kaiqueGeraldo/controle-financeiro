import type { GoalHistory, InvestTransaction, Transaction } from "@/types";
import { formatCalendarDate, PRODUCT_TIME_ZONE } from "@/utils/date";

/** Explicit provenance is required even if the compatibility alias contains an offset. */
export function goalHistoryTimeLabel(value: GoalHistory): string {
  const instant = value.dateOrigin === "SERVER_CLOCK" ? knownInstant(value.recordedAt) : null;
  if (instant) {
    return `${new Intl.DateTimeFormat("pt-BR", {
      timeZone: PRODUCT_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(new Date(instant))} (${PRODUCT_TIME_ZONE})`;
  }
  const raw = value.legacyDateRaw ?? value.date;
  if (!raw) return "Data indisponível — Fuso desconhecido";
  const local = /^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d):([0-5]\d)(\.\d{1,6})?$/.exec(raw);
  if (local && formatCalendarDate(local[1]) !== "—") {
    const seconds = local[3] !== "00" || local[4] ? `:${local[3]}${local[4] ?? ""}` : "";
    return `${formatCalendarDate(local[1])} ${local[2]}${seconds} — Fuso desconhecido`;
  }
  return `${raw} — Fuso desconhecido`;
}

/** Wall time is literal; createdAt is never evidence of an informed time. */
export function informedTime(value: Pick<Transaction, "time" | "timeOrigin">): string | null {
  return value.timeOrigin === "USER_INPUT" && typeof value.time === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value.time) ? value.time : null;
}

export function compactWallTime(value: string): string {
  return value.length === 8 && value.endsWith(":00") ? value.slice(0, 5) : value;
}

export function normalizeTransaction(value: Transaction): Transaction {
  return { ...value, ...normalizeOperationTemporal(value) };
}

export function normalizeOperationTemporal(value: Partial<Pick<Transaction, "time" | "timeOrigin" | "recordedAt" | "legacyCreatedAtRaw" | "createdAt">>) {
  return { time: informedTime(value),
    timeOrigin: informedTime(value) ? "USER_INPUT" : value.timeOrigin === "NOT_PROVIDED" ? "NOT_PROVIDED" : "UNKNOWN",
    recordedAt: knownInstant(value.recordedAt),
    legacyCreatedAtRaw: value.legacyCreatedAtRaw ?? value.createdAt ?? null } as const;
}

function knownInstant(value: string | null | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)) return null;
  if (formatCalendarDate(value.slice(0, 10)) === "—" || !Number.isFinite(Date.parse(value))) return null;
  return value;
}

export function normalizeInvestmentHistory(value: InvestTransaction): InvestTransaction {
  const known = (value.dateOrigin === "USER_INPUT" || value.dateOrigin === "PRODUCT_CALENDAR") &&
    typeof value.date === "string" && formatCalendarDate(value.date) !== "—";
  return { ...value, date: known ? value.date : null, dateOrigin: known ? value.dateOrigin : "UNKNOWN",
    legacyDateRaw: value.legacyDateRaw ?? value.date ?? null };
}

/** Same order as the API: civil date, known wall time, then stable identity. */
export function compareOperationTime(a: Transaction, b: Transaction): number {
  const aTime = informedTime(a)?.padEnd(8, ":00") ?? "";
  const bTime = informedTime(b)?.padEnd(8, ":00") ?? "";
  return bTime.localeCompare(aTime) || b.id.localeCompare(a.id);
}
