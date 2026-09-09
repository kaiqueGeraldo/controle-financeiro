import { expect, test } from "@playwright/test";

const fixedNow =
  process.env.CF_TEST_FIXED_NOW ?? "2026-09-08T02:59:59.000Z";
const seed = process.env.CF_TEST_SEED ?? "cf001-v1";
const timezone = process.env.CF_TEST_TIMEZONE ?? "America/Sao_Paulo";

test("abre a autenticação pública sem depender do backend", async ({ page }, testInfo) => {
  const viewport = page.viewportSize();
  const harness = {
    fixedNow,
    project: testInfo.project.name,
    seed,
    timezone,
    viewport,
  };

  console.info(`[harness] ${JSON.stringify(harness)}`);
  await testInfo.attach("harness-runtime.json", {
    body: Buffer.from(JSON.stringify(harness, null, 2)),
    contentType: "application/json",
  });
  const response = await page.goto("/auth");

  expect(response?.ok()).toBe(true);
  console.info("[harness] /auth respondeu com sucesso");
  await expect(
    page.getByRole("heading", { name: "Bem-vindo de volta" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("seu@email.com")).toBeVisible();
  await expect(page.getByPlaceholder("••••••••")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  console.info("[harness] conteúdo essencial da autenticação está visível");
});
