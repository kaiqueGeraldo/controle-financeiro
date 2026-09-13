import { mkdir } from "node:fs/promises";
import path from "node:path";

import {
  expect,
  test,
  type APIResponse,
  type Page,
  type Route,
  type TestInfo,
} from "@playwright/test";

import { installControlledClock } from "./support/controlled-clock";
import { registerSyntheticUser, syntheticUser } from "./support/synthetic-auth";

const fixedNow =
  process.env.CF_TEST_FIXED_NOW ?? "2027-01-31T05:00:00.000Z";
const runNamespace = process.env.CF_E2E_NAMESPACE ?? "cf007-local";
const exportDirectory =
  process.env.CF_E2E_EXPORT_DIR ??
  path.resolve("tests", "artifacts", "cf007", runNamespace);

type SetupData = {
  account: { id: string; name: string };
  card: { id: string; name: string };
  category: { id: string; name: string };
  investment: { id: string; ticker: string };
};

function projectKey(testInfo: TestInfo): "sao-paulo" | "kiritimati" {
  return testInfo.project.name.includes("kiritimati")
    ? "kiritimati"
    : "sao-paulo";
}

function apiPath(response: { url(): string }): string {
  return new URL(response.url()).pathname;
}

async function expectSuccessfulJson<T>(
  response: APIResponse,
  operation: string,
): Promise<T> {
  expect(
    response.ok(),
    `${operation} falhou: HTTP ${response.status()} ${await response.text()}`,
  ).toBe(true);
  return (await response.json()) as T;
}

async function postJson<T>(
  page: Page,
  endpoint: string,
  data: unknown,
  operation: string,
): Promise<T> {
  return expectSuccessfulJson<T>(
    await page.request.post(`/api${endpoint}`, { data }),
    operation,
  );
}

async function registerThroughUi(
  page: Page,
  testInfo: TestInfo,
  tag: string,
): Promise<void> {
  const user = syntheticUser("A", tag);
  const registerResponse = page.waitForResponse(
    (response) =>
      apiPath(response) === "/api/auth/register" &&
      response.request().method() === "POST",
  );
  const loginResponse = page.waitForResponse(
    (response) =>
      apiPath(response) === "/api/auth/login" &&
      response.request().method() === "POST",
  );

  await registerSyntheticUser(page, user);

  expect((await registerResponse).status()).toBe(200);
  expect((await loginResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await testInfo.attach("synthetic-user.json", {
    body: Buffer.from(
      JSON.stringify(
        {
          email: user.email,
          namespace: tag,
          note: "credencial exclusivamente sintética; senha omitida da evidência",
        },
        null,
        2,
      ),
    ),
    contentType: "application/json",
  });
}

async function createSetupData(page: Page, tag: string): Promise<SetupData> {
  const accountName = `${tag}-conta`;
  const categoryName = `${tag}-categoria`;
  const cardName = `${tag}-cartao`;
  const ticker = (tag.includes("kiritimati") ? "CF7KIR" : "CF7SP").slice(
    0,
    10,
  );

  const account = await postJson<SetupData["account"]>(
    page,
    "/accounts",
    {
      name: accountName,
      type: "CHECKING",
      initialBalance: 1000,
      color: "#10b981",
    },
    "criação da conta sintética",
  );
  const category = await postJson<SetupData["category"]>(
    page,
    "/categories",
    {
      name: categoryName,
      icon: "Tag",
      color: "#f43f5e",
      type: "EXPENSE",
    },
    "criação da categoria sintética",
  );
  const card = await postJson<SetupData["card"]>(
    page,
    "/cards",
    {
      name: cardName,
      last4Digits: tag.includes("kiritimati") ? "7002" : "7001",
      limit: 1000,
      closingDay: 31,
      dueDay: 5,
      brand: "VISA",
      color: "#7c3aed",
    },
    "criação do cartão sintético",
  );
  const investment = await postJson<SetupData["investment"]>(
    page,
    "/investments",
    {
      ticker,
      name: `${tag}-ativo`,
      type: "OTHER",
    },
    "criação do ativo sintético",
  );

  return { account, card, category, investment };
}

async function verifyRejectedWriteKeepsInput(
  page: Page,
  setup: SetupData,
  tag: string,
): Promise<void> {
  await page.goto("/extrato");
  await expect(page.getByRole("heading", { name: "Extrato" })).toBeVisible();
  await page.getByRole("button", { name: "Lançar" }).click();

  const modal = page.getByRole("heading", { name: "Nova Transação" }).locator("..");
  await modal.getByPlaceholder("0,00").fill("10.00");
  await modal.getByPlaceholder("Ex: Mercado, Salário...").fill(`${tag}-rejeitada`);
  await modal.locator('input[type="date"]').fill("2027-01-30");
  await modal.locator('input[type="time"]').fill("23:30");
  await modal.locator("select").nth(0).selectOption(setup.category.id);
  await modal.locator("select").nth(1).selectOption(setup.account.id);

  let injected = false;
  const injectImpossibleDate = async (route: Route) => {
    if (!injected && route.request().method() === "POST") {
      injected = true;
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.continue({
        postData: JSON.stringify({ ...payload, date: "2027-02-29" }),
      });
      return;
    }
    await route.continue();
  };

  await page.route("**/api/transactions", injectImpossibleDate);
  const rejectedResponse = page.waitForResponse(
    (response) =>
      apiPath(response) === "/api/transactions" &&
      response.request().method() === "POST",
  );
  await modal.getByRole("button", { name: "Salvar Transação" }).click();
  expect((await rejectedResponse).status()).toBe(400);
  await page.unroute("**/api/transactions", injectImpossibleDate);

  expect(injected).toBe(true);
  await expect(
    page.getByText("Erro ao criar transação. Verifique se preencheu tudo."),
  ).toBeVisible();
  await expect(modal.locator('input[type="date"]')).toHaveValue("2027-01-30");
  await expect(page.getByText(`${tag}-rejeitada`, { exact: true })).toHaveCount(0);

  await page.reload();
}

async function createAndEditTransaction(
  page: Page,
  setup: SetupData,
  tag: string,
): Promise<void> {
  const description = `${tag}-transacao`;
  await expect(page.getByRole("heading", { name: "Extrato" })).toBeVisible();
  await page.getByRole("button", { name: "Lançar" }).click();

  const modal = page.getByRole("heading", { name: "Nova Transação" }).locator("..");
  await expect(modal.locator('input[type="date"]')).toHaveValue("2027-01-31");
  await modal.getByPlaceholder("0,00").fill("25.50");
  await modal.getByPlaceholder("Ex: Mercado, Salário...").fill(description);
  await modal.locator('input[type="date"]').fill("2027-01-30");
  await modal.locator('input[type="time"]').fill("23:30");
  await modal.locator("select").nth(0).selectOption(setup.category.id);
  await modal.locator("select").nth(1).selectOption(setup.account.id);

  const createdResponse = page.waitForResponse(
    (response) =>
      apiPath(response) === "/api/transactions" &&
      response.request().method() === "POST",
  );
  await modal.getByRole("button", { name: "Salvar Transação" }).click();
  const created = await createdResponse;
  expect(created.request().postDataJSON()).toMatchObject({
    date: "2027-01-30",
    time: "23:30",
  });
  expect(created.status()).toBe(200);
  expect(await created.json()).toMatchObject({
    date: "2027-01-30",
      createdAt: "2027-01-30T23:30:00",
      time: "23:30:00", timeOrigin: "USER_INPUT", recordedAt: "2027-01-31T05:00:00Z",
  });
  await expect(page.getByText(description, { exact: true })).toBeVisible();

  const januaryNavigation = page.getByText("janeiro de 2027", { exact: true }).locator("..");
  const decemberLoaded = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === "/api/transactions" &&
      url.searchParams.get("month") === "12" &&
      url.searchParams.get("year") === "2026" &&
      response.request().method() === "GET" &&
      response.ok()
    );
  });
  await januaryNavigation.getByRole("button").first().click();
  await decemberLoaded;
  await expect(page.getByText("dezembro de 2026", { exact: true })).toBeVisible();
  const decemberNavigation = page.getByText("dezembro de 2026", { exact: true }).locator("..");
  await decemberNavigation.getByRole("button").last().click();
  await expect(page.getByText("janeiro de 2027", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.getByText(description, { exact: true }).click();
  const details = page
    .getByText(description, { exact: true })
    .locator("xpath=ancestor::form");
  await expect(details.getByText("30/01/2027", { exact: true })).toBeVisible();
  await expect(details.getByText("23:30", { exact: true })).toBeVisible();

  await details.getByRole("button", { name: "Editar" }).click();
  const editingDetails = page.locator("form").filter({
    has: page.locator('input[type="date"]'),
  });
  await editingDetails.locator('input[type="date"]').fill("2027-01-29");
  await editingDetails.locator('input[type="time"]').fill("08:15");
  const updatedResponse = page.waitForResponse(
    (response) =>
      apiPath(response).startsWith("/api/transactions/") &&
      response.request().method() === "PUT",
  );
  await editingDetails.getByRole("button", { name: "Salvar" }).click();
  const updated = await updatedResponse;
  expect(updated.request().postDataJSON()).toMatchObject({
    date: "2027-01-29",
    time: "08:15",
  });
  expect(updated.status()).toBe(200);
  expect(await updated.json()).toMatchObject({
    date: "2027-01-29",
      createdAt: "2027-01-29T08:15:00",
      time: "08:15:00", timeOrigin: "USER_INPUT", recordedAt: "2027-01-31T05:00:00Z",
      legacyCreatedAtRaw: "2027-01-30T23:30:00",
  });

  await page.reload();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.getByText(description, { exact: true }).click();
  const reopenedDetails = page
    .getByText(description, { exact: true })
    .locator("xpath=ancestor::form");
  await expect(reopenedDetails.getByText("29/01/2027", { exact: true })).toBeVisible();
  await expect(reopenedDetails.getByText("08:15", { exact: true })).toBeVisible();

  await page.goto("/");
  const dashboardTransaction = page.getByText(description, { exact: true }).locator("..");
  await expect(dashboardTransaction.getByText("29/01/2027", { exact: true })).toBeVisible();
}

async function createCardPurchase(
  page: Page,
  setup: SetupData,
  tag: string,
): Promise<void> {
  const description = `${tag}-compra-cartao`;
  await page.goto("/cartoes");
  await expect(page.getByRole("heading", { name: "Carteira" })).toBeVisible();
  await page.getByRole("button", { name: "Lançar Compra" }).click();
  const modal = page
    .getByRole("heading", { name: "Nova Despesa no Crédito" })
    .locator("..");
  await expect(modal.locator('input[type="date"]')).toHaveValue("2027-01-31");
  await modal.getByPlaceholder("0,00").fill("40.00");
  await modal.getByPlaceholder("Ex: Uber, Amazon, Jantar...").fill(description);
  await modal.locator('input[type="date"]').fill("2027-01-30");
  await modal.locator('input[type="time"]').fill("23:30");
  await modal.locator("select").nth(0).selectOption(setup.card.id);
  await modal.locator("select").nth(1).selectOption(setup.category.id);

  const createdResponse = page.waitForResponse(
    (response) =>
      apiPath(response) === "/api/cards/transaction" &&
      response.request().method() === "POST",
  );
  await modal.getByRole("button", { name: "Confirmar Compra" }).click();
  const created = await createdResponse;
  expect(created.request().postDataJSON()).toMatchObject({
    date: "2027-01-30",
    time: "23:30",
  });
  expect(created.status()).toBe(200);

  await page.reload();
  await page.getByText(setup.card.name, { exact: true }).click();
  const februaryNavigation = page
    .getByText("fevereiro de 2027", { exact: true })
    .locator("xpath=../..");
  const januaryInvoiceLoaded = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === `/api/cards/${setup.card.id}/invoice` &&
      url.searchParams.get("month") === "1" &&
      url.searchParams.get("year") === "2027" &&
      response.request().method() === "GET" &&
      response.ok()
    );
  });
  await februaryNavigation.getByRole("button").first().click();
  await januaryInvoiceLoaded;
  await expect(page.getByText("janeiro de 2027", { exact: true })).toBeVisible();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await expect(page.getByText(/^30\/01\/2027/)).toBeVisible();

  const invoice = await expectSuccessfulJson<{
    transactions: Array<{ description: string; date: string }>;
  }>(
    await page.request.get(`/api/cards/${setup.card.id}/invoice?month=1&year=2027`),
    "releitura da fatura",
  );
  expect(invoice.transactions).toContainEqual(
    expect.objectContaining({
      description,
      date: "2027-01-30",
    }),
  );
}

async function createInvestmentOperation(
  page: Page,
  setup: SetupData,
  tag: string,
): Promise<void> {
  await page.goto("/investimentos");
  await expect(page.getByRole("heading", { name: "Investimentos" })).toBeVisible();
  await page.getByText(setup.investment.ticker, { exact: true }).click();
  await page.getByRole("button", { name: "Aportar" }).click();
  const modal = page
    .getByRole("heading", { name: `${setup.investment.ticker} - Operação` })
    .locator("..");
  await expect(modal.locator('input[type="date"]')).toHaveValue("2027-01-31");
  await modal.getByPlaceholder("0", { exact: true }).fill("2");
  await modal.getByPlaceholder("0,00").fill("50.00");
  await modal.locator('input[type="date"]').fill("2027-01-30");
  await modal.locator("select").selectOption(setup.account.id);

  const operationResponse = page.waitForResponse(
    (response) =>
      apiPath(response) === "/api/investments/operation" &&
      response.request().method() === "POST",
  );
  await modal.getByRole("button", { name: "Confirmar Operação" }).click();
  const operation = await operationResponse;
  expect(operation.request().postDataJSON()).toMatchObject({
    date: "2027-01-30",
    investmentId: setup.investment.id,
  });
  expect(operation.status()).toBe(200);

  await page.reload();
  await page.getByText(setup.investment.ticker, { exact: true }).click();
  await expect(page.getByText("Compra", { exact: true })).toBeVisible();
  await expect(page.getByText("30/01/2027", { exact: true })).toBeVisible();

  const history = await expectSuccessfulJson<Array<{ date: string; type: string }>>(
    await page.request.get(`/api/investments/${setup.investment.id}/history`),
    `releitura do histórico de ${tag}`,
  );
  expect(history).toContainEqual(
    expect.objectContaining({ date: "2027-01-30", type: "BUY", dateOrigin: "USER_INPUT", legacyDateRaw: "2027-01-30T00:00:00" }),
  );
}

async function createGoal(page: Page, tag: string): Promise<void> {
  const title = `${tag}-meta`;
  await page.goto("/metas");
  await expect(
    page.getByRole("heading", { name: "Metas & Objetivos" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nova Meta" }).click();
  const modal = page.getByRole("heading", { name: "Nova Meta" }).locator("..");
  await modal.getByPlaceholder("Ex: Reserva de Emergência").fill(title);
  await modal.getByPlaceholder("0,00").fill("250.00");
  await modal.locator('input[type="date"]').fill("2027-02-02");
  await modal.getByPlaceholder("Ex: Viagem").fill("Temporal");

  const createdResponse = page.waitForResponse(
    (response) =>
      apiPath(response) === "/api/goals" &&
      response.request().method() === "POST",
  );
  await modal.getByRole("button", { name: "Criar Meta" }).click();
  const created = await createdResponse;
  expect(created.request().postDataJSON()).toMatchObject({
    deadline: "2027-02-02",
  });
  expect(created.status()).toBe(200);
  expect(await created.json()).toMatchObject({ deadline: "2027-02-02" });

  await page.reload();
  const goalCard = page.getByText(title, { exact: true }).locator("xpath=../../..");
  await expect(goalCard.getByText("02/02/2027", { exact: true })).toBeVisible();

  const goals = await expectSuccessfulJson<Array<{ title: string; deadline: string }>>(
    await page.request.get("/api/goals"),
    "releitura das metas",
  );
  expect(goals).toContainEqual(
    expect.objectContaining({ title, deadline: "2027-02-02" }),
  );
}

async function createAndToggleHabit(page: Page, tag: string): Promise<void> {
  const name = `${tag}-habito`;
  await page.goto("/habitos");
  await expect(page.getByRole("heading", { name: "Hábitos" })).toBeVisible();
  await page.getByRole("button", { name: "Novo Hábito" }).click();
  const modal = page.getByRole("heading", { name: "Novo Hábito" }).locator("..");
  await modal.getByPlaceholder("Ex: Beber 3L de Água").fill(name);

  const createdResponse = page.waitForResponse(
    (response) =>
      apiPath(response) === "/api/habits" &&
      response.request().method() === "POST",
  );
  await modal.getByRole("button", { name: "Criar Hábito" }).click();
  expect((await createdResponse).status()).toBe(200);

  const habitCard = page.getByRole("button", {
    name: `Ver detalhes do hábito ${name}`,
  });
  const toggleResponse = page.waitForResponse(
    (response) =>
      apiPath(response).startsWith("/api/habits/") &&
      apiPath(response).endsWith("/toggle") &&
      response.request().method() === "POST",
  );
  await habitCard.getByRole("button", { name: "Marcar Feito" }).click();
  const toggled = await toggleResponse;
  expect(toggled.request().postDataJSON()).toEqual({ date: "2027-01-31" });
  expect(toggled.status()).toBe(200);

  await page.reload();
  await expect(
    page
      .getByRole("button", { name: `Ver detalhes do hábito ${name}` })
      .getByRole("button", { name: "Feito Hoje" }),
  ).toBeVisible();

  const habits = await expectSuccessfulJson<
    Array<{ name: string; logs: Array<{ date: string; status: string }> }>
  >(await page.request.get("/api/habits"), "releitura dos hábitos");
  expect(habits.find((habit) => habit.name === name)?.logs).toContainEqual(
    expect.objectContaining({
      date: "2027-01-31",
      status: "COMPLETED",
    }),
  );
}

async function exportThroughUi(
  page: Page,
  testInfo: TestInfo,
  key: string,
): Promise<void> {
  await page.goto("/configuracoes");
  await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByText("Exportar Dados", { exact: true }).click();
  const download = await downloadPromise;
  await mkdir(exportDirectory, { recursive: true });
  const outputPath = path.join(exportDirectory, `${key}.xlsx`);
  await download.saveAs(outputPath);
  expect(await download.failure()).toBeNull();
  await testInfo.attach("export-path.txt", {
    body: Buffer.from(outputPath),
    contentType: "text/plain",
  });
}

test("preserva datas civis no navegador, BFF, Spring e PostgreSQL", async ({
  page,
}, testInfo) => {
  const key = projectKey(testInfo);
  const timezoneId = key === "kiritimati" ? "Pacific/Kiritimati" : "America/Sao_Paulo";
  const tag = `${runNamespace}-${key}`;

  await installControlledClock(page, fixedNow);
  const runtime = await page.evaluate(() => ({
    instant: new Date().toISOString(),
    localDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }));
  expect(runtime).toEqual({
    instant: new Date(fixedNow).toISOString(),
    localDate: "2027-01-31",
    timezone: timezoneId,
  });

  await testInfo.attach("runtime.json", {
    body: Buffer.from(JSON.stringify({ ...runtime, tag }, null, 2)),
    contentType: "application/json",
  });

  await registerThroughUi(page, testInfo, tag);
  const setup = await createSetupData(page, tag);
  await verifyRejectedWriteKeepsInput(page, setup, tag);
  await createAndEditTransaction(page, setup, tag);
  await createCardPurchase(page, setup, tag);
  await createInvestmentOperation(page, setup, tag);
  await createGoal(page, tag);
  await createAndToggleHabit(page, tag);
  await exportThroughUi(page, testInfo, key);
});

test("P03: edita planejamento pela UI e relê pela API após reload", async ({ page }, testInfo) => {
  const tag = `${runNamespace}-${projectKey(testInfo)}-planning`;
  await installControlledClock(page, fixedNow);
  await registerThroughUi(page, testInfo, tag);
  const plan = await postJson<{ id: string }>(page, "/planning", {
    description: `${tag}-original`, amount: 25, dueDate: "2027-01-30", status: "SAVED",
  }, "criar planejamento sintético");
  await page.goto("/planejamento");
  await page.getByText(`${tag}-original`, { exact: true }).click();
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Descrição", { exact: true }).fill(`${tag}-editado`);
  await page.getByLabel("Valor previsto", { exact: true }).fill("35.50");
  await page.getByLabel("Vencimento", { exact: true }).fill("2027-01-29");
  const saved = page.waitForResponse((response) => apiPath(response) === `/api/planning/${plan.id}` && response.request().method() === "PUT");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(200);
  expect(response.request().postDataJSON()).toEqual({ description: `${tag}-editado`, amount: 35.5,
    dueDate: "2027-01-29", categoryId: null });
  expect(await response.json()).toMatchObject({ id: plan.id, dueDate: "2027-01-29", amount: 35.5, status: "SAVED" });
  await expect(page.getByRole("button", { name: "Editar", exact: true })).toBeVisible();
  await page.reload();
  await page.getByText(`${tag}-editado`, { exact: true }).click();
  await expect(page.getByText("29/01/2027", { exact: true }).last()).toBeVisible();
  const reloaded = await page.request.get("/api/planning?month=1&year=2027");
  expect(reloaded.status()).toBe(200);
  expect((await reloaded.json()).items).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: plan.id, description: `${tag}-editado`, dueDate: "2027-01-29", amount: 35.5, status: "SAVED" }),
  ]));
});
