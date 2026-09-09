import { expect, test } from "@playwright/test";

import {
  defaultFixedNow,
  installControlledClock,
} from "./support/controlled-clock";

const timezone = process.env.CF_TEST_TIMEZONE ?? "America/Sao_Paulo";

test("fixa o relógio e o fuso do navegador", async ({ page }) => {
  await installControlledClock(page);
  await page.setContent("<main>Harness temporal</main>");

  const browserRuntime = await page.evaluate(() => ({
    instant: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }));

  expect(browserRuntime).toEqual({
    instant: defaultFixedNow,
    timezone,
  });
});
