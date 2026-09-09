import type { Page } from "@playwright/test";

export const defaultFixedNow =
  process.env.CF_TEST_FIXED_NOW ?? "2026-09-08T02:59:59.000Z";

export async function installControlledClock(
  page: Page,
  instant = defaultFixedNow,
): Promise<void> {
  await page.clock.setFixedTime(new Date(instant));
}
