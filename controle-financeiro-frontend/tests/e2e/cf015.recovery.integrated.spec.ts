import { expect, test, type Page } from "@playwright/test";
import { registerSyntheticUser, syntheticUser } from "./support/synthetic-auth";

async function post(page: Page, endpoint: string, data: unknown) {
  const response = await page.request.post(`/api${endpoint}`, { data });
  expect(response.ok(), `${endpoint}: ${response.status()} ${await response.text()}`).toBe(true);
  return response.status() === 204 || !(await response.text()) ? undefined : response.json();
}

for (const mode of ["ok", "read", "lost", "overlap"] as const) {
  test(`R03: pagamento real ${mode}, conta/dívida/planejamento e reload`, async ({ page }, info) => {
    const key = info.project.name.includes("kiritimati") ? "kir" : "sp";
    const tag = `${process.env.CF_E2E_NAMESPACE}-pay-${mode}-${key}`;
    await page.clock.setFixedTime(new Date("2027-01-15T12:00:00Z"));
    await registerSyntheticUser(page, syntheticUser("B", tag));
    const account = await post(page, "/accounts", { name: tag, type: "CHECKING", initialBalance: 1000, color: "#10b981" });
    const card = await post(page, "/cards", { name: tag, last4Digits: "4242", limit: 1000, closingDay: 20, dueDay: 28, brand: "VISA", color: "#7c3aed" });
    const categories = await (await page.request.get("/api/categories?type=EXPENSE")).json();
    await post(page, "/cards/transaction", { cardId: card.id, categoryId: categories[0].id, description: `${tag}-purchase`, amount: 100, date: "2027-01-10", time: null, totalInstallments: 1 });
    await page.goto("/cartoes");
    await page.getByRole("button", { name: `Ver fatura de ${tag}, final 4242` }).click();
    const detail = page.getByRole("dialog", { name: `${tag} •••• 4242` });
    await expect(detail.getByText(`${tag}-purchase`, { exact: true })).toBeVisible();
    await detail.getByRole("button", { name: /^(Pagar|Adiantar)/ }).click();
    const payment = page.getByRole("dialog", { name: `Pagar Fatura - ${tag}`, exact: true });
    await expect(payment.getByRole("button", { name: "Fechar modal" })).toBeFocused();
    await payment.getByLabel("Pagar com").selectOption(account.id);
    await payment.getByLabel("Data do Pagamento").fill("2027-01-15");
    let posts = 0, failRead = false;
    let invoiceReads = 0;
    const firstRead = Promise.withResolvers<void>();
    const releaseFirst = Promise.withResolvers<void>();
    await page.route(`**/api/cards/${card.id}/invoice?*`, async route => {
      if (mode === "overlap" && failRead && ++invoiceReads === 1) {
        firstRead.resolve();
        await releaseFirst.promise;
      }
      if (failRead) await route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"synthetic read outage"}' });
      else await route.continue();
    });
    await page.route(`**/api/cards/${card.id}/pay`, async route => {
      posts++;
      if (mode === "read" || mode === "overlap") failRead = true;
      if (mode === "lost") {
        const response = await route.fetch(); // Real BFF → Spring → PG commit, then lose only the response.
        expect(response.ok(), await response.text()).toBe(true);
        await route.abort("connectionclosed");
      } else await route.continue();
    });
    await payment.getByRole("button", { name: "Confirmar Pagamento" }).click();
    if (mode === "overlap") {
      await firstRead.promise;
      await page.evaluate(() => window.dispatchEvent(new Event("refreshCards")));
      await expect.poll(() => invoiceReads).toBe(2);
      // The second read is configured to fail while the first route is held.
      // The browser may abort the first transport; neither cancellation nor 503 is success.
      releaseFirst.resolve();
    }
    if (mode === "ok") await expect(payment).toHaveCount(0);
    else {
      await expect(payment.getByRole("alert")).toContainText(mode === "lost" ? "Não foi possível confirmar" : "Pagamento confirmado");
      if (mode === "overlap") await expect(payment.getByRole("alert")).toContainText("cancelada ou substituída");
      await expect(payment.getByRole("button", { name: "Confirmar Pagamento" })).toBeDisabled();
      if (mode === "read" || mode === "overlap") {
        await expect(detail.getByRole("button", { name: "Fatura indisponível" })).toBeDisabled();
        failRead = false;
      }
      const receipt = mode === "lost" ? page.waitForResponse(r=>r.url().includes(`/cards/${card.id}/payments/`)&&r.request().method()==="GET") : null;
      await payment.getByRole("button", { name: "Atualizar dados sem repetir pagamento" }).click();
      if(receipt){const response=await receipt;expect(response.ok()).toBe(true);expect((await response.json()).amount).toBe(100);}
      await expect(payment).toHaveCount(0);
    }
    expect(posts).toBe(1);
    await expect(detail.getByRole("button", { name: "Fatura Paga" })).toBeDisabled();
    // The opener is disabled after payment; focus must return to an operable control.
    await expect(detail.getByRole("button", { name: "Fechar detalhes da fatura" })).toBeFocused();
    const accounts = await (await page.request.get("/api/accounts")).json();
    expect(accounts.find((a: { id: string }) => a.id === account.id).balance).toBe(900);
    const cards = await (await page.request.get("/api/cards")).json();
    expect(cards.find((c: { id: string }) => c.id === card.id).currentInvoiceValue).toBe(0);
    const planning = await (await page.request.get("/api/planning?month=1&year=2027")).json();
    expect(planning.items.find((i: { cardId: string }) => i.cardId === card.id).status).toBe("PAID");
    expect(planning.items.find((i: { cardId: string }) => i.cardId === card.id).amount).toBe(0);
    await page.reload();
    await page.getByRole("button", { name: `Ver fatura de ${tag}, final 4242` }).click();
    await expect(page.getByRole("button", { name: "Fatura Paga" })).toBeDisabled();
    const invoice = await (await page.request.get(`/api/cards/${card.id}/invoice?month=1&year=2027`)).json();
    expect(invoice.status).toBe("PAID");
    expect(invoice.totalAmount).toBe(100); // paid status clears debt, original purchases remain auditable.
    expect(posts).toBe(1);
    await page.goto("/");
    await expect(page.getByText("Subtotal de ativos conhecidos", { exact: true })).toBeVisible();
    await expect(page.getByText("Subtotal de ativos conhecidos", { exact: true }).locator("..")).toContainText("900,00");
    await page.goto("/contas");
    await expect(page.getByRole("heading", { name: "Minhas Contas" })).toBeVisible();
    await expect(page.getByRole("button", { name: `Ver extrato da conta ${tag}`, exact: true })).toContainText("900,00");
  });
}

test("R04: nota enviada, edição posterior, falha e confirmação persistida após reload", async ({ page }, info) => {
  const tag = `${process.env.CF_E2E_NAMESPACE}-note-${info.project.name.includes("kiritimati") ? "kir" : "sp"}`;
  await registerSyntheticUser(page, syntheticUser("B", tag));
  await page.goto("/resumo-anual");
  await page.getByRole("button", { name: "Editar nota" }).click();
  await page.getByRole("textbox").fill("enviado");
  let release!: () => void, committed!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  const written = new Promise<void>(resolve => { committed = resolve; });
  await page.route("**/api/annual-summary/note", async route => {
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    committed(); await hold;
    await route.fulfill({ response });
  }, { times: 1 });
  await page.getByRole("button", { name: "Salvar nota" }).click();
  await written;
  await page.getByRole("textbox").fill("rascunho posterior");
  release();
  await expect(page.getByRole("button", { name: "Salvar nota" })).toBeEnabled();
  await expect(page.getByRole("textbox")).toHaveValue("rascunho posterior");
  const year = await page.evaluate(() => new Date().getFullYear());
  expect((await (await page.request.get(`/api/annual-summary?year=${year}`)).json()).note).toBe("enviado");
  await page.route("**/api/annual-summary/note", route => route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"synthetic failure"}' }), { times: 1 });
  await page.getByRole("button", { name: "Salvar nota" }).click();
  await expect(page.getByText("Erro ao salvar nota.", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveValue("rascunho posterior");
  expect((await (await page.request.get(`/api/annual-summary?year=${year}`)).json()).note).toBe("enviado");
  await page.getByRole("button", { name: "Salvar nota" }).click();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("rascunho posterior", { exact: true })).toBeVisible();
  expect((await (await page.request.get(`/api/annual-summary?year=${year}`)).json()).note).toBe("rascunho posterior");
});
