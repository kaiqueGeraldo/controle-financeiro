import { expect, test } from "@playwright/test";

function syntheticToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1_000) + 3_600 }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}

test("CF-010: formulário compartilhado mantém a confirmação alcançável em 360px e zoom 200%", async ({
  page,
}, testInfo) => {
  await page.context().addCookies([
    {
      name: "token",
      value: syntheticToken(),
      domain: "127.0.0.1",
      path: "/",
    },
  ]);

  await page.goto("/");
  const createTransaction = page.locator("button.fixed.bottom-8.right-8");
  await expect(createTransaction).toBeVisible();
  await createTransaction.click();

  const dialog = page.getByRole("dialog", { name: "Nova Transação" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("opacity", "1");
  await expect(dialog.getByRole("button", { name: "Fechar modal" })).toBeFocused();
  const saveButton = dialog.getByRole("button", { name: /Salvar Transação/i });
  await expect(saveButton).toBeVisible();
  await page.locator("html").evaluate((element) => element.classList.remove("dark"));
  await page.screenshot({ path: testInfo.outputPath("modal-light-360.png") });

  await page.locator("html").evaluate((element) => element.classList.add("dark"));
  await expect(saveButton).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("modal-dark-360.png") });

  await page.setViewportSize({ width: 180, height: 400 });
  await saveButton.scrollIntoViewIfNeeded();
  const saveButtonBox = await saveButton.boundingBox();
  expect(saveButtonBox).not.toBeNull();
  expect(saveButtonBox!.y).toBeGreaterThanOrEqual(0);
  expect(saveButtonBox!.y + saveButtonBox!.height).toBeLessThanOrEqual(400);
  await page.screenshot({
    path: testInfo.outputPath("modal-dark-360-zoom-200.png"),
  });
});
