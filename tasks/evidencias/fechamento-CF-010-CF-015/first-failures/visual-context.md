# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cf015.visual.integrated.spec.ts >> CF015: inspeção autenticada nas três larguras e nota após reload
- Location: tests\e2e\cf015.visual.integrated.spec.ts:8:5

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Planejamento sintético longo', { exact: true })
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Planejamento sintético longo', { exact: true }) with timeout 15000ms
  - waiting for getByText('Planejamento sintético longo', { exact: true })
  - Protocol error (Runtime.callFunctionOn): Internal server error, session closed.

```

```yaml
- button "Abrir menu de navegação"
- text: Controle Financeiro
- main:
  - heading "Planejamento" [level=1]
  - button
  - button
  - button
  - text: outubro de 2026
  - button
  - main
  - text: Receitas R$ 0,00 Despesas R$ 0,00 Sobra R$ 0,00
- alert
```

# Test source

```ts
  1   | import { mkdir, writeFile } from "node:fs/promises";
  2   | import path from "node:path";
  3   | import { expect, test } from "@playwright/test";
  4   | import { registerSyntheticUser, syntheticUser } from "./support/synthetic-auth";
  5   | 
  6   | // Ambiente e banco vêm exclusivamente do orquestrador Java descartável.
  7   | // Nenhum sucesso HTTP financeiro é interceptado.
  8   | test("CF015: inspeção autenticada nas três larguras e nota após reload", async ({ page }, info) => {
  9   |   const tag = `${process.env.CF_E2E_NAMESPACE}-visual-${info.project.name.includes("kiritimati") ? "kir" : "sp"}`;
  10  |   // Controle temporal exato é exercitado em temporal.integrated.spec.ts.
  11  |   // Este roteiro visual usa relógio nativo para isolar animações do clock do harness.
  12  |   await registerSyntheticUser(page, syntheticUser("B", tag));
  13  |   const visualDate = await page.evaluate(() => {
  14  |     const now = new Date();
  15  |     return { year: now.getFullYear(), date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15` };
  16  |   });
  17  |   const post = async (endpoint: string, data: unknown) => {
  18  |     const response = await page.request.post(`/api${endpoint}`, { data });
  19  |     expect(response.ok(), `${endpoint}: ${response.status()} ${await response.text()}`).toBe(true);
  20  |     return response.status() === 204 || !(await response.text()) ? undefined : response.json();
  21  |   };
  22  |   await post("/accounts", { name: "Conta sintética com nome longo para revisão visual", type: "CHECKING", initialBalance: 123456789.12, color: "#10b981" });
  23  |   // FIN-01: abertura é posição, não receita. Exercitar a mesma magnitude no
  24  |   // extrato com um fato explícito, mantendo a abertura original da fixture.
  25  |   const ledgerAccount = await post("/accounts", { name: "Receita sintética para geometria", type: "CHECKING", initialBalance: 0, color: "#10b981" });
  26  |   const incomeCategories = await (await page.request.get("/api/categories?type=INCOME")).json();
  27  |   // Recent transactions without a period use the backend's controlled month.
  28  |   const ledgerDate = process.env.CF_TEST_FIXED_NOW!.slice(0,10);
  29  |   await post("/transactions", { description: "Receita sintética para geometria", type: "INCOME", amount: 123456789.12, date: ledgerDate, accountId: ledgerAccount.id, categoryId: incomeCategories[0].id, isPaid: true });
  30  |   const visualCard = await post("/cards", { name: "Cartão sintético com nome longo", last4Digits: "4242", limit: 123456789.12, closingDay: 31, dueDay: 5, brand: "VISA", color: "#7c3aed" });
  31  |   const categories = await (await page.request.get("/api/categories?type=EXPENSE")).json();
  32  |   for (let i = 1; i <= 12; i++) {
  33  |     await post("/cards/transaction", { cardId: visualCard.id, categoryId: categories[0].id, description: `Compra ${i} com descrição longa para verificar acesso e rolagem`, amount: 1234.56, date: visualDate.date, time: null, totalInstallments: 1 });
  34  |   }
  35  |   await post("/planning", { description: "Planejamento sintético longo", amount: 25, dueDate: visualDate.date, status: "SAVED" });
  36  |   await post("/investments", { ticker: "CF015", name: "Ativo sintético", type: "OTHER" });
  37  |   const waitForData = async (route: string) => {
> 38  |     if (route === "/planejamento") await expect(page.getByText("Planejamento sintético longo", { exact: true })).toBeVisible();
      |                                                                                                                  ^ Error: expect(locator).toBeVisible() failed
  39  |     if (route === "/contas") await expect(page.getByRole("button", { name: "Ver extrato da conta Conta sintética com nome longo para revisão visual", exact: true })).toBeVisible();
  40  |     if (route === "/cartoes") await expect(page.getByRole("button", { name: "Ver fatura de Cartão sintético com nome longo, final 4242", exact: true })).toBeVisible();
  41  |     if (route === "/") {
  42  |       const recent = page.getByRole("heading", { name: "Extrato Recente", exact: true }).locator("..");
  43  |       const amount = recent.getByText(/\+\s*R\$\s*123\.456\.789,12/);
  44  |       await expect(amount).toBeVisible();
  45  |       const geometry = await amount.evaluate(element => ({ scroll: element.scrollWidth, client: element.clientWidth, right: element.getBoundingClientRect().right, containerRight: element.parentElement!.parentElement!.getBoundingClientRect().right }));
  46  |       expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
  47  |       expect(geometry.right).toBeLessThanOrEqual(geometry.containerRight + 1);
  48  |     }
  49  |   };
  50  |   const directory = path.resolve(process.env.CF015_VISUAL_DIR ?? "../tasks/evidencias/saneamento-CF-015/visual", info.project.name);
  51  |   await mkdir(directory, { recursive: true });
  52  |   const observations = [];
  53  |   for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  54  |     await page.setViewportSize(viewport);
  55  |     for (const [route, heading] of [["/", "Dashboard"], ["/contas", "Minhas Contas"], ["/extrato", "Extrato"],
  56  |       ["/cartoes", "Carteira"], ["/planejamento", "Planejamento"], ["/metas", "Metas & Objetivos"],
  57  |       ["/investimentos", "Investimentos"], ["/habitos", "Hábitos"], ["/resumo-anual", "Resumo Anual"], ["/configuracoes", "Ajustes"]]) {
  58  |       await page.goto(route);
  59  |       await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  60  |       await waitForData(route);
  61  |       await expect(page.locator(".animate-spin")).toHaveCount(0);
  62  |       if (route === "/resumo-anual") {
  63  |         await expect(page.locator("main main > div").first()).toHaveCSS("opacity", "1");
  64  |       }
  65  |       await page.screenshot({ path: path.join(directory, `${viewport.width}-${route.replaceAll("/", "") || "dashboard"}.png`), fullPage: true, animations: "disabled" });
  66  |       observations.push({ route, viewport, ...await page.evaluate(() => ({
  67  |         scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
  68  |         mainWidths: Array.from(document.querySelectorAll("main")).map(m => ({ scroll: m.scrollWidth, client: m.clientWidth })),
  69  |         unnamedButtons: Array.from(document.querySelectorAll("button")).filter(b => !b.textContent?.trim() && !b.getAttribute("aria-label") && !b.getAttribute("title")).length,
  70  |       })) });
  71  |       if (viewport.width === 360 && ["/", "/contas", "/resumo-anual"].includes(route)) {
  72  |         await page.locator("main").first().evaluate(element => { element.scrollTop = element.scrollHeight; });
  73  |         await page.screenshot({ path: path.join(directory, `360-${route.replaceAll("/", "") || "dashboard"}-bottom.png`), animations: "disabled" });
  74  |       }
  75  |     }
  76  |   }
  77  |   await writeFile(path.join(directory, "observations.json"), JSON.stringify(observations, null, 2));
  78  |   // Focus, scrolling and long invoice content at each required width.
  79  |   for (const width of [360, 768, 1440]) {
  80  |     await page.setViewportSize({ width, height: 800 });
  81  |     await page.goto("/cartoes");
  82  |     const opener = page.getByRole("button", { name: "Ver fatura de Cartão sintético com nome longo, final 4242" });
  83  |     await opener.click();
  84  |     const invoice = page.getByRole("dialog", { name: "Cartão sintético com nome longo •••• 4242", exact: true });
  85  |     const close = invoice.getByRole("button", { name: "Fechar detalhes da fatura" });
  86  |     await expect(close).toBeFocused();
  87  |     await expect(invoice.getByText("R$ 14.814,72", { exact: true })).toBeVisible();
  88  |     await page.screenshot({ path: path.join(directory, `${width}-invoice-long.png`), animations: "disabled" });
  89  |     await invoice.getByText("Compra 12 com descrição longa para verificar acesso e rolagem", { exact: true }).scrollIntoViewIfNeeded();
  90  |     const pay = invoice.getByRole("button", { name: /^(Pagar|Adiantar)/ });
  91  |     await pay.scrollIntoViewIfNeeded();
  92  |     await expect(pay).toBeVisible();
  93  |     await pay.click();
  94  |     const payment = page.getByRole("dialog", { name: "Pagar Fatura - Cartão sintético com nome longo", exact: true });
  95  |     await expect(payment.getByRole("button", { name: "Fechar modal" })).toBeFocused();
  96  |     await page.keyboard.press("Shift+Tab");
  97  |     await expect(payment.getByRole("button", { name: "Confirmar Pagamento" })).toBeFocused();
  98  |     await page.keyboard.press("Tab");
  99  |     await expect(payment.getByRole("button", { name: "Fechar modal" })).toBeFocused();
  100 |     await page.keyboard.press("Escape");
  101 |     await expect(payment).toHaveCount(0);
  102 |     await expect(pay).toBeFocused();
  103 |     await page.keyboard.press("Escape");
  104 |     await expect(invoice).toHaveCount(0);
  105 |     await expect(opener).toBeFocused();
  106 |   }
  107 |   await page.goto("/resumo-anual");
  108 |   await expect(page.getByRole("heading", { name: `Bloco de Notas ${visualDate.year}` })).toBeVisible();
  109 |   const notepad = page.getByRole("heading", { name: `Bloco de Notas ${visualDate.year}` }).locator("../..");
  110 |   await notepad.getByRole("button").click();
  111 |   await page.getByRole("textbox").fill("Nota CF015 persistida pela UI");
  112 |   const saved = page.waitForResponse(r => r.url().endsWith("/api/annual-summary/note") && r.request().method() === "POST");
  113 |   await notepad.getByRole("button").click();
  114 |   expect((await saved).ok()).toBe(true);
  115 |   await page.reload();
  116 |   await expect(page.getByText("Nota CF015 persistida pela UI", { exact: true })).toBeVisible();
  117 |   const response = await page.request.get(`/api/annual-summary?year=${visualDate.year}`);
  118 |   expect(response.status()).toBe(200);
  119 |   expect((await response.json()).note).toBe("Nota CF015 persistida pela UI");
  120 |   await page.setViewportSize({ width: 360, height: 800 });
  121 |   await page.goto("/configuracoes");
  122 |   const theme = page.getByRole("switch", { name: "Tema Escuro" });
  123 |   await expect(theme).toHaveAttribute("aria-checked", "true");
  124 |   await theme.click();
  125 |   await expect(theme).toHaveAttribute("aria-checked", "false");
  126 |   await page.reload();
  127 |   await expect(theme).toHaveAttribute("aria-checked", "false");
  128 |   await page.screenshot({ path: path.join(directory, "360-settings-light.png"), fullPage: true });
  129 |   for (const width of [360, 768, 1440]) {
  130 |     await page.setViewportSize({ width, height: 900 });
  131 |     for (const route of ["/", "/contas", "/cartoes", "/extrato", "/planejamento"]) {
  132 |       await page.goto(route);
  133 |       await expect(page.locator(".animate-spin")).toHaveCount(0);
  134 |       await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  135 |       await waitForData(route);
  136 |       await expect(page.locator(".animate-spin")).toHaveCount(0);
  137 |       const dimensions = await page.evaluate(() => Array.from(document.querySelectorAll("main")).map(m => ({ scroll: m.scrollWidth, client: m.clientWidth })));
  138 |       for (const size of dimensions) expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
```