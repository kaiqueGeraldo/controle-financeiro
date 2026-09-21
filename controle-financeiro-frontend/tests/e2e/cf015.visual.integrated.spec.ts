import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { registerSyntheticUser, syntheticUser } from "./support/synthetic-auth";

// Ambiente e banco vêm exclusivamente do orquestrador Java descartável.
// Nenhum sucesso HTTP financeiro é interceptado.
test("CF015: inspeção autenticada nas três larguras e nota após reload", async ({ page }, info) => {
  const tag = `${process.env.CF_E2E_NAMESPACE}-visual-${info.project.name.includes("kiritimati") ? "kir" : "sp"}`;
  // Controle temporal exato é exercitado em temporal.integrated.spec.ts.
  // Este roteiro visual usa relógio nativo para isolar animações do clock do harness.
  await registerSyntheticUser(page, syntheticUser("B", tag));
  const visualDate = await page.evaluate(() => {
    const now = new Date();
    return { year: now.getFullYear(), date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15` };
  });
  const post = async (endpoint: string, data: unknown) => {
    const response = await page.request.post(`/api${endpoint}`, { data });
    expect(response.ok(), `${endpoint}: ${response.status()} ${await response.text()}`).toBe(true);
    return response.status() === 204 || !(await response.text()) ? undefined : response.json();
  };
  await post("/accounts", { name: "Conta sintética com nome longo para revisão visual", type: "CHECKING", initialBalance: 123456789.12, color: "#10b981" });
  const visualCard = await post("/cards", { name: "Cartão sintético com nome longo", last4Digits: "4242", limit: 123456789.12, closingDay: 31, dueDay: 5, brand: "VISA", color: "#7c3aed" });
  const categories = await (await page.request.get("/api/categories?type=EXPENSE")).json();
  for (let i = 1; i <= 12; i++) {
    await post("/cards/transaction", { cardId: visualCard.id, categoryId: categories[0].id, description: `Compra ${i} com descrição longa para verificar acesso e rolagem`, amount: 1234.56, date: visualDate.date, time: null, totalInstallments: 1 });
  }
  await post("/planning", { description: "Planejamento sintético longo", amount: 25, dueDate: visualDate.date, status: "SAVED" });
  await post("/investments", { ticker: "CF015", name: "Ativo sintético", type: "OTHER" });
  const waitForData = async (route: string) => {
    if (route === "/planejamento") await expect(page.getByText("Planejamento sintético longo", { exact: true })).toBeVisible();
    if (route === "/contas") await expect(page.getByRole("button", { name: "Ver extrato da conta Conta sintética com nome longo para revisão visual", exact: true })).toBeVisible();
    if (route === "/cartoes") await expect(page.getByRole("button", { name: "Ver fatura de Cartão sintético com nome longo, final 4242", exact: true })).toBeVisible();
    if (route === "/") {
      const recent = page.getByRole("heading", { name: "Extrato Recente", exact: true }).locator("..");
      const amount = recent.getByText(/\+R\$\s*123\.456\.789,12/);
      await expect(amount).toBeVisible();
      const geometry = await amount.evaluate(element => ({ scroll: element.scrollWidth, client: element.clientWidth, right: element.getBoundingClientRect().right, containerRight: element.parentElement!.parentElement!.getBoundingClientRect().right }));
      expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
      expect(geometry.right).toBeLessThanOrEqual(geometry.containerRight + 1);
    }
  };
  const directory = path.resolve("../tasks/evidencias/saneamento-CF-015/visual", info.project.name);
  await mkdir(directory, { recursive: true });
  const observations = [];
  for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const [route, heading] of [["/", "Dashboard"], ["/contas", "Minhas Contas"], ["/extrato", "Extrato"],
      ["/cartoes", "Carteira"], ["/planejamento", "Planejamento"], ["/metas", "Metas & Objetivos"],
      ["/investimentos", "Investimentos"], ["/habitos", "Hábitos"], ["/resumo-anual", "Resumo Anual"], ["/configuracoes", "Ajustes"]]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await waitForData(route);
      await expect(page.locator(".animate-spin")).toHaveCount(0);
      if (route === "/resumo-anual") {
        await expect(page.locator("main main > div").first()).toHaveCSS("opacity", "1");
      }
      await page.screenshot({ path: path.join(directory, `${viewport.width}-${route.replaceAll("/", "") || "dashboard"}.png`), fullPage: true, animations: "disabled" });
      observations.push({ route, viewport, ...await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
        mainWidths: Array.from(document.querySelectorAll("main")).map(m => ({ scroll: m.scrollWidth, client: m.clientWidth })),
        unnamedButtons: Array.from(document.querySelectorAll("button")).filter(b => !b.textContent?.trim() && !b.getAttribute("aria-label") && !b.getAttribute("title")).length,
      })) });
      if (viewport.width === 360 && ["/", "/contas", "/resumo-anual"].includes(route)) {
        await page.locator("main").first().evaluate(element => { element.scrollTop = element.scrollHeight; });
        await page.screenshot({ path: path.join(directory, `360-${route.replaceAll("/", "") || "dashboard"}-bottom.png`), animations: "disabled" });
      }
    }
  }
  await writeFile(path.join(directory, "observations.json"), JSON.stringify(observations, null, 2));
  // Focus, scrolling and long invoice content at each required width.
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/cartoes");
    const opener = page.getByRole("button", { name: "Ver fatura de Cartão sintético com nome longo, final 4242" });
    await opener.click();
    const invoice = page.getByRole("dialog", { name: "Cartão sintético com nome longo •••• 4242", exact: true });
    const close = invoice.getByRole("button", { name: "Fechar detalhes da fatura" });
    await expect(close).toBeFocused();
    await expect(invoice.getByText("R$ 14.814,72", { exact: true })).toBeVisible();
    await page.screenshot({ path: path.join(directory, `${width}-invoice-long.png`), animations: "disabled" });
    await invoice.getByText("Compra 12 com descrição longa para verificar acesso e rolagem", { exact: true }).scrollIntoViewIfNeeded();
    const pay = invoice.getByRole("button", { name: /^(Pagar|Adiantar)/ });
    await pay.scrollIntoViewIfNeeded();
    await expect(pay).toBeVisible();
    await pay.click();
    const payment = page.getByRole("dialog", { name: "Pagar Fatura - Cartão sintético com nome longo", exact: true });
    await expect(payment.getByRole("button", { name: "Fechar modal" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(payment.getByRole("button", { name: "Confirmar Pagamento" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(payment.getByRole("button", { name: "Fechar modal" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(payment).toHaveCount(0);
    await expect(pay).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(invoice).toHaveCount(0);
    await expect(opener).toBeFocused();
  }
  await page.goto("/resumo-anual");
  await expect(page.getByRole("heading", { name: `Bloco de Notas ${visualDate.year}` })).toBeVisible();
  const notepad = page.getByRole("heading", { name: `Bloco de Notas ${visualDate.year}` }).locator("../..");
  await notepad.getByRole("button").click();
  await page.getByRole("textbox").fill("Nota CF015 persistida pela UI");
  const saved = page.waitForResponse(r => r.url().endsWith("/api/annual-summary/note") && r.request().method() === "POST");
  await notepad.getByRole("button").click();
  expect((await saved).ok()).toBe(true);
  await page.reload();
  await expect(page.getByText("Nota CF015 persistida pela UI", { exact: true })).toBeVisible();
  const response = await page.request.get(`/api/annual-summary?year=${visualDate.year}`);
  expect(response.status()).toBe(200);
  expect((await response.json()).note).toBe("Nota CF015 persistida pela UI");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/configuracoes");
  const theme = page.getByRole("switch", { name: "Tema Escuro" });
  await expect(theme).toHaveAttribute("aria-checked", "true");
  await theme.click();
  await expect(theme).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(theme).toHaveAttribute("aria-checked", "false");
  await page.screenshot({ path: path.join(directory, "360-settings-light.png"), fullPage: true });
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/contas", "/cartoes", "/extrato", "/planejamento"]) {
      await page.goto(route);
      await expect(page.locator(".animate-spin")).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await waitForData(route);
      await expect(page.locator(".animate-spin")).toHaveCount(0);
      const dimensions = await page.evaluate(() => Array.from(document.querySelectorAll("main")).map(m => ({ scroll: m.scrollWidth, client: m.clientWidth })));
      for (const size of dimensions) expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
      await page.screenshot({ path: path.join(directory, `${width}-${route.replaceAll("/", "") || "dashboard"}-light.png`), animations: "disabled" });
    }
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/extrato");
  await page.getByRole("button", { name: "Novo lançamento" }).click();
  const dialog = page.getByRole("dialog", { name: "Nova Transação", exact: true });
  await expect(dialog).toHaveCSS("opacity", "1");
  await expect(dialog.getByRole("button", { name: "Fechar modal" })).toBeFocused();
  await page.screenshot({ path: path.join(directory, "360-modal-light.png") });
  await page.setViewportSize({ width: 180, height: 400 });
  const save = dialog.getByRole("button", { name: "Salvar Transação" });
  await save.scrollIntoViewIfNeeded();
  const box = await save.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(400);
  // Supplemental narrow viewport only: this does not exercise native browser zoom.
  await page.screenshot({ path: path.join(directory, "180-modal-light-narrow-viewport.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("CF015-R12: ação de novo lançamento continua identificada em 360px", async ({ page }, info) => {
  const tag = `${process.env.CF_E2E_NAMESPACE}-name-${info.project.name.includes("kiritimati") ? "kir" : "sp"}`;
  await registerSyntheticUser(page, syntheticUser("B", tag));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/extrato");
  const action = page.getByRole("heading", { name: "Extrato", exact: true }).locator("../..").getByRole("button");
  await expect(action).toBeVisible();
  await expect(action).toHaveAccessibleName(/lançar|lançamento|transação/i);
});
