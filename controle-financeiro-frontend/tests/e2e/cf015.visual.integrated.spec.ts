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
    return response.json();
  };
  await post("/accounts", { name: "Conta sintética com nome longo para revisão visual", type: "CHECKING", initialBalance: 1000, color: "#10b981" });
  await post("/cards", { name: "Cartão sintético com nome longo", last4Digits: "4242", limit: 1000, closingDay: 31, dueDay: 5, brand: "VISA", color: "#7c3aed" });
  await post("/planning", { description: "Planejamento sintético longo", amount: 25, dueDate: visualDate.date, status: "SAVED" });
  await post("/investments", { ticker: "CF015", name: "Ativo sintético", type: "OTHER" });
  const directory = path.resolve("../tasks/evidencias/revisao-CF-015/visual-conferencia", info.project.name);
  await mkdir(directory, { recursive: true });
  const observations = [];
  for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const [route, heading] of [["/", "Dashboard"], ["/contas", "Minhas Contas"], ["/extrato", "Extrato"],
      ["/cartoes", "Carteira"], ["/planejamento", "Planejamento"], ["/metas", "Metas & Objetivos"],
      ["/investimentos", "Investimentos"], ["/habitos", "Hábitos"], ["/resumo-anual", "Resumo Anual"], ["/configuracoes", "Ajustes"]]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
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
  await page.goto("/extrato");
  // R12 abaixo preserva a exigência de nome acessível. Este seletor estrutural
  // serve apenas para continuar a inspeção visual do modal apesar desse defeito.
  await page.getByRole("heading", { name: "Extrato", exact: true }).locator("../..").getByRole("button").click();
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
  await page.screenshot({ path: path.join(directory, "180-modal-light-zoom-equivalent.png") });
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
