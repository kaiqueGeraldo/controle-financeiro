import { isLosslessNumber, parse } from "lossless-json";

const snapshotDecimals = new Set([
  "quantity", "price", "totalValue", "fees", "costDelta", "realizedResult",
]);

/** Opt-in for execution snapshots only. Preserve the HTTP token before Number parsing. */
export function parseInvestmentResultJson(body: string): unknown {
  return parse(body, (key, value: unknown) => {
    if (!isLosslessNumber(value)) return value;
    return snapshotDecimals.has(key) ? value : Number(value.value);
  });
}
