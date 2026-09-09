import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatCalendarDate, localDateString, isCalendarDatePast, shiftMonth,
} from "../src/utils/date.ts";

test("datas civis preservam o calendário, inclusive ano bissexto", () => {
  assert.equal(formatCalendarDate("2026-09-07"), "07/09/2026");
  assert.equal(formatCalendarDate("2024-02-29"), "29/02/2024");
  assert.equal(formatCalendarDate("2026-01-01"), "01/01/2026");
  assert.equal(formatCalendarDate("2026-09-07", { day: "2-digit", month: "2-digit" }), "07/09");
});

test("datas inválidas e instantes não são normalizados como datas civis", () => {
  for (const input of ["", "0000-01-01", "2026-02-29", "2026-04-31", "2026-00-01", "2026-13-01", "2026-09-00", "07/09/2026", "2026-09-07T00:00:00Z"]) {
    assert.equal(formatCalendarDate(input), "—", input);
    assert.equal(isCalendarDatePast(input, "2026-09-07"), false, input);
  }
});

test("R08: competência de ano menor que 100 não ganha 1900 anos", () => {
  const original = new Date(2026, 0, 31);
  original.setFullYear(99);
  assert.equal(localDateString(shiftMonth(original, 1)), "0099-02-01");
  assert.equal(localDateString(original), "0099-01-31");
});

test("hoje corresponde ao dia local nos dois extremos do dia", () => {
  for (const hour of [0, 23]) {
    assert.equal(localDateString(new Date(2026, 8, 7, hour, 30)), "2026-09-07");
  }
});

test("prazo de hoje só se torna atrasado no dia seguinte", () => {
  const today = new Date(2026, 8, 7, 23, 59, 59);
  assert.equal(isCalendarDatePast("2026-09-07", today), false);
  assert.equal(isCalendarDatePast("2026-09-06", today), true);
  assert.equal(isCalendarDatePast("2026-09-08", today), false);
  assert.equal(isCalendarDatePast("2026-09-07", new Date(2026, 8, 8)), true);
});

test("navegação mensal não pula fevereiro nem altera a data original", () => {
  for (const day of [29, 30, 31]) {
    const january = new Date(2026, 0, day, 23, 30);
    const original = january.getTime();
    assert.equal(localDateString(shiftMonth(january, 1)), "2026-02-01");
    assert.equal(january.getTime(), original);
    assert.equal(localDateString(shiftMonth(new Date(2026, 2, day), -1)), "2026-02-01");
  }
  assert.equal(localDateString(shiftMonth(new Date(2026, 11, 31), 1)), "2027-01-01");
  assert.equal(localDateString(shiftMonth(new Date(2026, 0, 31), -1)), "2025-12-01");
});
