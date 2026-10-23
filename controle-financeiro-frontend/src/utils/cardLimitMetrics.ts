import type { CreditCard } from "@/services/cardService";
import { monetaryAggregate } from "./monetaryAggregate";

function knownMoney(value: unknown): number | null {
  return typeof value === "number" ? monetaryAggregate([value]) : null;
}

/** FIN-03 metrics include future principal, payments and refunds.
 * Missing/invalid metrics stay unavailable; current invoice is not a fallback. */
export function cardLimitMetrics(card: CreditCard) {
  const limit = knownMoney(card.limit);
  const rawCommitted = knownMoney(card.committedLimit);
  const committed = rawCommitted !== null && rawCommitted >= 0 ? rawCommitted : null;
  const available = knownMoney(card.availableLimit);
  const percentage = limit === null || limit < 0 || committed === null ? null
    : limit === 0 ? (committed === 0 ? 0 : 100)
    : Math.min(100, Math.max(0, committed / limit * 100));
  return { limit, committed, available, percentage };
}
