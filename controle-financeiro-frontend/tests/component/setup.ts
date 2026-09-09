import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

const fixedNow =
  process.env.CF_TEST_FIXED_NOW ?? "2026-09-08T02:59:59.000Z";
const seed = process.env.CF_TEST_SEED ?? "cf001-v1";
const timezone = process.env.CF_TEST_TIMEZONE ?? "America/Sao_Paulo";

Object.defineProperty(window, "scrollTo", {
  configurable: true,
  value: vi.fn(),
  writable: true,
});

beforeAll(() => {
  console.info(
    `[harness] layer=component timezone=${timezone} viewport=jsdom ` +
      `seed=${seed} fixedNow=${fixedNow}`,
  );
});

afterEach(() => {
  cleanup();
});
