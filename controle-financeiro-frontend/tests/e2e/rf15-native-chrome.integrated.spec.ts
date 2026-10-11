import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, expect, test } from "@playwright/test";
import { registerSyntheticUser, syntheticUser } from "./support/synthetic-auth";

// Opt-in, attended test: the operator sets 200% using the browser's native UI.
// No CSS zoom, device scale, CDP page scale, or reduced viewport substitutes it.
test("RF15: zoom nativo Chrome 200% com ações, rolagem e foco", async ({}, info) => {
  test.setTimeout(300_000);
  const directory = path.resolve(process.env.CF015_VISUAL_DIR!, "native-zoom");
  await mkdir(directory, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-size=1440,1000"] });
  try {
    const context = await browser.newContext({ baseURL: process.env.CF_TEST_BASE_URL, viewport: null, deviceScaleFactor: undefined, locale: "pt-BR", timezoneId: "America/Sao_Paulo", reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));
    await registerSyntheticUser(page, syntheticUser("B", `${process.env.CF_E2E_NAMESPACE}-zoom`));
    const post = async (endpoint: string, data: unknown) => {
      const response = await page.request.post(`/api${endpoint}`, { data });
      expect(response.ok(), await response.text()).toBe(true);
      return response.status() === 204 || !(await response.text()) ? undefined : response.json();
    };
    await post("/accounts", { name: "Conta sintética longa para zoom", type: "CHECKING", initialBalance: 123456789.12, color: "#10b981" });
    const card = await post("/cards", { name: "Cartão sintético para zoom", last4Digits: "4242", limit: 123456789.12, closingDay: 31, dueDay: 5, brand: "VISA", color: "#7c3aed" });
    const categories = await (await page.request.get("/api/categories?type=EXPENSE")).json();
    const date = await page.evaluate(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`; });
    for (let i = 1; i <= 12; i++) await post("/cards/transaction", { cardId: card.id, categoryId: categories[0].id, description: `Compra ${i} com descrição longa para zoom`, amount: 1234.56, date, time: null, totalInstallments: 1 });
    await page.goto("/cartoes");
    await expect(page.getByRole("heading", { name: "Carteira", exact: true })).toBeVisible();
    const metrics = () => page.evaluate(() => ({ width: innerWidth, height: innerHeight, outerWidth, outerHeight, dpr: devicePixelRatio, scale: visualViewport?.scale }));
    const before = await metrics();
    await page.evaluate(() => { document.title = "RF15 ZOOM NATIVO CHROME - ajustar 200%"; });
    await writeFile(path.join(directory, "ready.json"), JSON.stringify({ browser: browser.version(), before, project: info.project.name }, null, 2));
    // This assertion observes actual zoom; it does not implement zoom.
    await expect.poll(async () => (await metrics()).dpr / before.dpr, { timeout: 180_000 }).toBe(2);
    // Allow the operator to capture the native 200% indicator before navigation.
    await expect.poll(async () => readFile(path.join(directory, "native-confirmed.txt"), "utf8").catch(() => "pending"), { timeout: 60_000 }).toBe("200%");
    const after = await metrics();
    expect(after.outerWidth).toBe(before.outerWidth);
    expect(after.width).toBe(Math.round(before.width / 2));
    expect(after.scale).toBe(1);
    await writeFile(path.join(directory, "zoom.json"), JSON.stringify({ browser: browser.version(), before, after, method: "Native browser keyboard/menu via sky; UI capture recorded separately" }, null, 2));
    const observations = [];
    for (const route of ["/", "/contas", "/cartoes", "/planejamento", "/extrato"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".animate-spin")).toHaveCount(0);
      expect((await metrics()).dpr / before.dpr).toBe(2);
      await page.screenshot({ path: path.join(directory, `${route.replaceAll("/", "") || "dashboard"}-200.png`) });
      observations.push({ route, ...await metrics() });
    }
    await page.getByRole("button", { name: "Novo lançamento" }).click();
    const transaction = page.getByRole("dialog", { name: "Nova Transação", exact: true });
    await expect(transaction.getByRole("button", { name: "Fechar modal" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(transaction.getByRole("button", { name: "Salvar Transação" })).toBeFocused();
    await page.screenshot({ path: path.join(directory, "transaction-bottom-200.png") });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Novo lançamento" })).toBeFocused();
    await page.goto("/cartoes");
    const opener = page.getByRole("button", { name: "Ver fatura de Cartão sintético para zoom, final 4242" });
    await opener.click();
    const invoice = page.getByRole("dialog", { name: "Cartão sintético para zoom •••• 4242", exact: true });
    await expect(invoice.getByRole("button", { name: "Fechar detalhes da fatura" })).toBeFocused();
    await page.screenshot({ path: path.join(directory, "invoice-top-200.png") });
    await invoice.getByText("Compra 12 com descrição longa para zoom", { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(directory, "invoice-bottom-200.png") });
    const pay = invoice.getByRole("button", { name: /^(Pagar|Adiantar)/ });
    await pay.click();
    const payment = page.getByRole("dialog", { name: "Pagar Fatura - Cartão sintético para zoom", exact: true });
    await expect(payment.getByRole("button", { name: "Fechar modal" })).toBeFocused();
    await page.screenshot({ path: path.join(directory, "payment-top-200.png") });
    await page.keyboard.press("Shift+Tab");
    await expect(payment.getByRole("button", { name: "Confirmar Pagamento" })).toBeFocused();
    const box = await payment.getByRole("button", { name: "Confirmar Pagamento" }).boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual((await metrics()).height);
    await page.screenshot({ path: path.join(directory, "payment-bottom-200.png") });
    await page.keyboard.press("Tab");
    await expect(payment.getByRole("button", { name: "Fechar modal" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(payment).toHaveCount(0);
    await expect(pay).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    await writeFile(path.join(directory, "observations.json"), JSON.stringify(observations, null, 2));
  } finally { await browser.close(); }
});
