import { expect, test } from "@playwright/test";
import { registerSyntheticUser, syntheticUser } from "./support/synthetic-auth";
import { join } from "node:path";

for (const kind of ["transaction", "investment"] as const) for (const mode of ["lost", "before", "unavailable"] as const) {
  test(`RV24 ${kind} ${mode}: browser BFF PostgreSQL reload exact replay and isolation`, async ({ page, browser }) => {
    const tag = `${process.env.CF_E2E_NAMESPACE}-${kind}-${mode}`;
    await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));
    await registerSyntheticUser(page, syntheticUser("A", tag));
    const created = await page.request.post("/api/accounts", { data: { name: tag, type: "CHECKING", initialBalance: 1000, color: "BLUE" } });
    expect(created.ok()).toBe(true); const account = await created.json();
    const categories = await (await page.request.get("/api/categories?type=EXPENSE")).json();
    let assetId: string;
    if (kind === "investment") {
      const asset = await page.request.post("/api/investments", { data: { name: tag, ticker: "RV24", type: "STOCK", openingQuantity: "10", openingCost: "1000", openingValue: "1000", valuationDate: "2027-01-15", valuationSource: "SYNTHETIC" } });
      expect(asset.ok(), await asset.text()).toBe(true); assetId = (await asset.json()).id;
    }
    const open = async () => {
      if (kind === "transaction") { await page.goto("/extrato"); await page.getByRole("button", { name: "Lançar", exact: true }).click(); }
      else { await page.goto("/investimentos"); await page.getByText("RV24", { exact: true }).click(); await page.getByRole("button", { name: "Aportar", exact: true }).click(); }
      return page.getByRole("dialog", { name: kind === "transaction" ? "Nova Transação" : "RV24 - Operação", exact: true });
    };
    let modal = await open();
    if (kind === "transaction") {
      await modal.getByLabel("Valor do lançamento").fill("25.00"); await modal.getByLabel("Descrição do lançamento").fill(tag);
      await modal.getByLabel("Categoria do lançamento").selectOption(categories[0].id); await modal.getByLabel("Conta do lançamento").selectOption(account.id);
      await modal.getByLabel("Data do lançamento").fill("2027-01-15");
    } else { await modal.getByPlaceholder("0", { exact: true }).fill("2"); await modal.getByPlaceholder("0,00", { exact: true }).fill("100"); await modal.getByLabel("Conta", { exact: true }).selectOption(account.id); }
    const endpoint = kind === "transaction" ? "/transactions" : "/investments/operation";
    if (mode === "before") expect((await page.request.post("/api/rv24-probe/fault", { data: { enabled: true } })).status()).toBe(204);
    let posts = 0; let original: Record<string, unknown>;
    await page.route(`**/api${endpoint}`, async route => {
      if (route.request().method() !== "POST") { await route.continue(); return; }
      posts++; const command = route.request().postDataJSON();
      if (posts === 1) {
        original = command;
        expect(typeof command.operationId).toBe("string");
        const response = await route.fetch();
        if (mode === "before") { expect(response.status()).toBe(500); await route.fulfill({ response }); }
        else { expect(response.ok(), await response.text()).toBe(true); await route.abort("connectionclosed"); }
      } else { expect(command).toEqual(original!); await route.continue(); }
    });
    await modal.getByRole("button", { name: kind === "transaction" ? "Salvar Transação" : "Confirmar Operação", exact: true }).click();
    await expect(modal.getByRole("alert")).toContainText("Não foi possível confirmar");
    await expect(modal.getByRole("button", { name: kind === "transaction" ? "Salvar Transação" : "Confirmar Operação", exact: true })).toBeDisabled();
    expect(posts).toBe(1);
    const identity = String(original!.operationId);
    const receipt = await page.request.get(`/api/financial-intents/${identity}`);
    expect(receipt.status()).toBe(mode === "before" ? 404 : 200);
    if (mode === "before") {
      const unchanged = await (await page.request.get("/api/accounts")).json();
      expect(unchanged.find((a: { id: string }) => a.id === account.id).balance).toBe(1000);
      if (kind === "investment") {
        expect((await (await page.request.get(`/api/investments/${assetId!}/history`)).json())).toHaveLength(0);
        const positions = await (await page.request.get("/api/investments")).json(); expect(positions.find((a: { id: string }) => a.id === assetId).quantity).toBe(10);
      }
      expect((await page.request.post("/api/rv24-probe/fault", { data: { enabled: false } })).status()).toBe(204);
    }
    await modal.getByRole("button", { name: "Fechar modal" }).click();
    modal = await open(); await expect(modal.getByRole("button", { name: "Repetir a mesma intenção" })).toBeEnabled();
    await page.reload(); modal = await open();
    if (mode === "unavailable") await page.route(`**/api/financial-intents/${identity}`, route => route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"synthetic recovery outage"}' }));
    await modal.getByRole("button", { name: "Consultar recibo" }).click();
    if (mode === "lost") await expect(modal).toHaveCount(0);
    else {
      await expect(modal.getByRole("alert")).toContainText(mode === "before" ? "pode estar em andamento" : "synthetic recovery outage");
      expect(posts).toBe(1);
      await modal.getByRole("button", { name: "Repetir a mesma intenção" }).click(); await expect(modal).toHaveCount(0);
    }
    const replay = await page.request.post(`/api${endpoint}`, { data: original! }); expect(replay.ok(), await replay.text()).toBe(true);
    const balance = async () => (await (await page.request.get("/api/accounts")).json()).find((a: { id: string }) => a.id === account.id).balance;
    expect(await balance()).toBe(kind === "transaction" ? 975 : 800);
    const different = { ...original!, [kind === "transaction" ? "amount" : "quantity"]: kind === "transaction" ? "30" : 3 };
    const conflict = await page.request.post(`/api${endpoint}`, { data: different }); expect(conflict.status()).toBe(409);
    expect(await balance()).toBe(kind === "transaction" ? 975 : 800);
    const other = await browser.newContext({ baseURL: process.env.CF_TEST_BASE_URL ?? "http://127.0.0.1:3107" });
    try {
      const otherPage = await other.newPage(); await registerSyntheticUser(otherPage, syntheticUser("B", tag));
      expect((await otherPage.request.get(`/api/financial-intents/${identity}`)).status()).toBe(404);
      expect((await otherPage.request.post(`/api${endpoint}`, { data: original! })).status()).toBe(409);
    } finally { await other.close(); }
    // A second identical legitimate intent, created through the same real form, has its own ID.
    await page.unroute(`**/api${endpoint}`); modal = await open();
    if (kind === "transaction") {
      await modal.getByLabel("Valor do lançamento").fill("25.00"); await modal.getByLabel("Descrição do lançamento").fill(tag);
      await modal.getByLabel("Categoria do lançamento").selectOption(categories[0].id); await modal.getByLabel("Conta do lançamento").selectOption(account.id);
      await modal.getByLabel("Data do lançamento").fill("2027-01-15"); await modal.getByLabel("Horário informado (opcional)").fill(String(original!.time));
    } else { await modal.getByPlaceholder("0", { exact: true }).fill("2"); await modal.getByPlaceholder("0,00", { exact: true }).fill("100"); await modal.getByLabel("Conta", { exact: true }).selectOption(account.id); }
    const next = page.waitForRequest(r => r.url().endsWith(`/api${endpoint}`) && r.method() === "POST");
    await modal.getByRole("button", { name: kind === "transaction" ? "Salvar Transação" : "Confirmar Operação", exact: true }).click();
    const second = (await next).postDataJSON(); expect(second.operationId).not.toBe(identity); expect(second).toEqual({ ...original!, operationId: second.operationId });
    await expect(modal).toHaveCount(0); await page.reload();
    expect(await balance()).toBe(kind === "transaction" ? 950 : 600);
    if (kind === "investment") {
      const assets = await (await page.request.get("/api/investments")).json(); expect(assets.find((a: { id: string }) => a.id === assetId).quantity).toBe(14);
      const history = await (await page.request.get(`/api/investments/${assetId!}/history`)).json(); expect(history).toHaveLength(2);
    } else {
      const facts = await (await page.request.get("/api/transactions?month=1&year=2027&size=100")).json(); expect(facts.content.filter((t: { description: string }) => t.description === tag)).toHaveLength(2);
    }
    await page.screenshot({ path: join(process.env.CF_REVIEW_EVIDENCE!, `${kind}-${mode}.png`), fullPage: true });
  });
}
