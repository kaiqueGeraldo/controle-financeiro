import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseInvestmentResultJson } from "../../../controle-financeiro-frontend/src/services/investmentResultJson.ts";
import { validateCreationResult } from "../../../controle-financeiro-frontend/src/services/creationResult.ts";

// Re-read captured HTTP bytes with the actual productive parser and validator.
// This is complementary consumer evidence, not a reconstructed historical HTTP capture.
const base = new URL("./", import.meta.url);
const state = JSON.parse(readFileSync(new URL("after-recovery/browser/precision-state.json", base), "utf8"));
const rows = [];
for (const name of ["operation-raw.json", "replay-raw.json", "receipt-raw.json"]) {
  const body = readFileSync(new URL(`after-recovery/browser/${name}`, base), "utf8");
  const parsed = parseInvestmentResultJson(body);
  const result = name === "receipt-raw.json" ? parsed.result : parsed;
  assert.equal(result.quantity.value, "999999999999.99999999");
  assert.equal(result.totalValue.value, "1.00");
  validateCreationResult(result, state.command);
  rows.push({ file: name, sha256: createHash("sha256").update(body).digest("hex"),
    quantity: result.quantity.value, representation: result.quantity.constructor.name,
    gross: result.totalValue.value, validated: true });
}
const malformed = parseInvestmentResultJson(readFileSync(new URL("after-recovery/browser/receipt-adulterated.json", base), "utf8"));
assert.throws(() => validateCreationResult(malformed.result, state.command));
assert.equal(state.uiPosts + state.explicitReplayPosts, 2);
assert.equal(state.recovered.accounts[0].balance, 1001);
assert.equal(state.recovered.operations.length, 1);
assert.equal(state.recovered.receipts.length, 1);
assert.equal(state.pendingAfterRecovery.length, 0);
const output = { captureRun: "after-recovery", operationId: state.command.operationId, rows, adulteratedRejected: true };
writeFileSync(new URL("consumer-projection.json", base), JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify(output, null, 2));
