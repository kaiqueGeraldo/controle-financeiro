import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { onboardingClient } from "@/services/onboarding/client";
import { ApiError } from "@/services/api";
import type { Session } from "@/services/onboarding/model";
import { TransactionModalManager } from "@/components/modals/managers/transactionModalManager";
import { FinanceProvider, notifyOnboardingCompleted } from "@/contexts/financeContext";
import { TransactionModalProvider, useTransactionModals } from "@/contexts/modals/transactionModalContext";
import { ToastProvider } from "@/contexts/toastContext";
import { accountService } from "@/services/accountService";
import { categoryService } from "@/services/categoryService";
import OnboardingScreen from "./OnboardingScreen";
import { Amount } from "./Review";
import { ReservationEditor } from "./ReservationEditor";

const auth = vi.hoisted(() => ({ user: { id: "owner-A", privacyMode: false }, push: vi.fn() }));
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: auth.user, isLoading: false }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: auth.push }) }));
const e01 = JSON.parse(readFileSync("../tasks/evidencias/CF-028/examples.json", "utf8"));
const saved: Session = e01.saveResponse.data;
beforeEach(() => {
  auth.user = { id: "owner-A", privacyMode: false }; auth.push.mockReset(); vi.stubGlobal("crypto", webcrypto);
  vi.spyOn(onboardingClient, "get").mockResolvedValue({ ...structuredClone(saved), payload: { ...structuredClone(saved.payload!), currentStep: "CONTEXT" } });
  vi.spyOn(onboardingClient, "choices").mockResolvedValue([{ id: e01.existing.account.id, kind: "ACCOUNT", label: "Carteira existente" }, { id: e01.existing.category.id, kind: "CATEGORY", label: "Receita sintética", type: "INCOME" }]);
  vi.spyOn(onboardingClient, "save").mockImplementation(async (s, action, payload) => ({ ...s, payload: action === "DISCARD" ? null : payload, version: (BigInt(s.version) + BigInt(1)).toString(), status: action === "PAUSE" || action === "DISCARD" ? "SKIPPED" : "IN_PROGRESS", issues: [] }));
  vi.spyOn(onboardingClient, "prepare").mockImplementation(async c => ({ ...structuredClone(e01.prepareResponse.data), operationId: c.operationId }));
  vi.spyOn(onboardingClient, "complete").mockImplementation(async p => ({ ...structuredClone(e01.completeResponse.data), operationId: p.operationId }));
});
async function loaded() { render(<OnboardingScreen />); await screen.findByRole("heading", { name: "Etapa 1 de 8: Contexto" }); return userEvent.setup(); }
it("has accessible context fields and keyboard save/next preserves answers", async () => {
  const user = await loaded(); const name = screen.getByRole("textbox", { name: "Nome preferido (opcional)" }); await user.type(name, "Pessoa de teste");
  screen.getByRole("button", { name: "Salvar e continuar" }).focus(); await user.keyboard("{Enter}"); await screen.findByRole("heading", { name: "Etapa 2 de 8: Contas" });
  await user.click(screen.getByRole("button", { name: "1. Contexto" })); expect((screen.getByRole("textbox", { name: "Nome preferido (opcional)" }) as HTMLInputElement).value).toBe("Pessoa de teste");
  expect(onboardingClient.save).toHaveBeenCalledTimes(1); expect(vi.mocked(onboardingClient.save).mock.calls[0][2].currentStep).toBe("ACCOUNTS");
});
it("requires confirmation before removing a section and Escape returns focus", async () => {
  const user = await loaded(); await user.click(screen.getByRole("button", { name: "2. Contas" })); const answer = screen.getByRole("combobox", { name: "Resposta para contas" }); await user.selectOptions(answer, "NONE");
  const dialog = await screen.findByRole("dialog", { name: "Confirmar alteração" }); expect(screen.getAllByRole("combobox", { name: "Como incluir este registro" })).toHaveLength(3);
  await user.keyboard("{Escape}"); await waitFor(() => expect(dialog.isConnected).toBe(false)); expect(document.activeElement).toBe(answer); expect((answer as HTMLSelectElement).value).toBe("PROVIDED");
  await user.selectOptions(answer, "NONE"); await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Confirmar alteração" }));
  expect(screen.queryByRole("combobox", { name: "Como incluir este registro" })).toBeNull(); await user.click(screen.getByRole("button", { name: "6. Reservas" })); expect(screen.getAllByRole("combobox", { name: "Fonte da reserva" })).toHaveLength(3); expect(screen.getAllByRole("option", { name: /Vínculo pendente ou removido/ }).length).toBeGreaterThan(0);
});
it("keeps decimal strings exact through typing and save", async () => {
  const user = await loaded(); await user.click(screen.getByRole("button", { name: "2. Contas" })); const balances = screen.getAllByRole("textbox", { name: "Saldo na data-base" }); await user.clear(balances[1]); await user.type(balances[1], "999999999999,99"); await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
  expect(vi.mocked(onboardingClient.save).mock.calls[0][2].sections.accounts.items[1].balance).toEqual({ state: "KNOWN", value: "999999999999.99" });
});
it("does not post malformed decimals or replace them with zero", async () => {
  const user = await loaded(); await user.click(screen.getByRole("button", { name: "2. Contas" })); const balance = screen.getAllByRole("textbox", { name: "Saldo na data-base" })[1]; await user.clear(balance); await user.type(balance, "1,005"); await user.click(screen.getByRole("button", { name: "Salvar rascunho" })); await screen.findByText(/Nenhum valor foi arredondado/); expect(onboardingClient.save).not.toHaveBeenCalled(); expect((balance as HTMLInputElement).value).toBe("1,005"); expect(balance.getAttribute("aria-invalid")).toBe("true"); expect(balance.getAttribute("aria-describedby")).toContain("-error");
});
it("shows server field issue and moves focus to its correction", async () => {
  const user = await loaded(); vi.mocked(onboardingClient.save).mockRejectedValue(new ApiError("Revise", 400, { fields: { "/sections/accounts/items/1/balance/value": ["Corrija o saldo informado"] } })); await user.click(screen.getByRole("button", { name: "Salvar rascunho" })); await user.click(await screen.findByRole("button", { name: /Contas: Corrija o saldo informado/ }));
  await screen.findByRole("heading", { name: "Etapa 2 de 8: Contas" }); await waitFor(() => expect(document.activeElement).toBe(screen.getAllByRole("textbox", { name: "Saldo na data-base" })[1]));
});
it("compares conflict snapshots and does not silently choose the server", async () => {
  const user = await loaded(); await user.type(screen.getByRole("textbox", { name: "Nome preferido (opcional)" }), "Resposta local"); vi.mocked(onboardingClient.save).mockRejectedValue(new ApiError("409", 409, { code: "VERSION_CONFLICT", requiresReconciliation: true })); await user.click(screen.getByRole("button", { name: "Salvar rascunho" })); vi.mocked(onboardingClient.get).mockResolvedValue({ ...saved, version: "4", payload: { ...saved.payload!, context: { ...saved.payload!.context, preferredName: "Resposta remota" } } }); await user.click(screen.getByRole("button", { name: "Verificar salvamento" }));
  const compare = await screen.findByRole("region", { name: "Comparar rascunhos" }); expect(within(compare).getByText("Nome preferido: Resposta local")).toBeTruthy(); expect(within(compare).getByText("Nome preferido: Resposta remota")).toBeTruthy(); expect(onboardingClient.save).toHaveBeenCalledTimes(1);
});
it("keeps UNKNOWN separate from explicit known zero and monetary NA", async () => {
  const user = await loaded(); await user.click(screen.getByRole("button", { name: "4. Investimentos" })); expect(screen.getByText("Quantidade: não se aplica.", { exact: false })).toBeTruthy(); const costStates = screen.getAllByRole("combobox", { name: "Informação de custo de aquisição" }); expect((costStates[0] as HTMLSelectElement).value).toBe("UNKNOWN"); await user.selectOptions(costStates[0], "KNOWN"); const costs = screen.getAllByRole("textbox", { name: "Custo de aquisição" }); await user.type(costs[0], "0"); await user.click(screen.getByRole("button", { name: "Salvar rascunho" })); const p = vi.mocked(onboardingClient.save).mock.calls[0][2]; expect(p.sections.investments.items[0].cost).toEqual({ state: "KNOWN", value: "0.00" }); expect(p.sections.investments.items[0].quantity).toEqual({ state: "NOT_APPLICABLE" });
});
it("does not expose sensitive values while privacy changes", async () => {
  auth.user.privacyMode = true; const user = await loaded(); await user.click(screen.getByRole("button", { name: "2. Contas" })); const input = screen.getAllByLabelText("Saldo na data-base")[0] as HTMLInputElement; expect(input.type).toBe("password");
  render(<Amount value={{ state: "KNOWN", value: "-1999999999999.98", knownSubtotal: "-1999999999999.98", outsideIndividualRange: true, missingPaths: [] }} />);
  const value = screen.getByText("R$ -1.999.999.999.999,98", { exact: false }); expect(getComputedStyle(value.parentElement!).visibility).toBe("hidden"); expect(screen.getAllByText("Valor oculto").length).toBeGreaterThan(0);
});
it("does not show success after an invalid financial response and permits same retry", async () => {
  const user = await loaded(); await user.click(screen.getByRole("button", { name: "8. Revisão" })); await user.click(screen.getByRole("button", { name: "Preparar revisão financeira" })); const confirm = await screen.findByRole("button", { name: "Confirmar informações e registrar posições" }); vi.mocked(onboardingClient.complete).mockRejectedValueOnce(new Error("Recibo inválido")); await user.click(confirm); await screen.findByRole("heading", { name: "Confirmação pendente de verificação" }); expect(screen.queryByRole("heading", { name: "Entrevista concluída" })).toBeNull(); await user.click(screen.getByRole("button", { name: "Repetir a mesma confirmação" })); await screen.findByRole("heading", { name: "Entrevista concluída" }); expect(vi.mocked(onboardingClient.complete).mock.calls[0][0]).toEqual(vi.mocked(onboardingClient.complete).mock.calls[1][0]);
});
it("clears in-memory answers on session invalidation", async () => {
  await loaded(); act(() => window.dispatchEvent(new Event("sessionExpired"))); expect(screen.queryByRole("textbox", { name: "Nome preferido (opcional)" })).toBeNull(); expect(onboardingClient.save).not.toHaveBeenCalled();
});
it("reopens persisted reservation declarations without inventing a new revision", async () => {
  const draft = structuredClone(saved.payload!); const id = "20000000-0000-4000-8000-000000000011";
  draft.reservationConfirmations = [{ reservationId: id, expectedRevision: "7", action: "CLOSE", currentSituationConfirmed: true }];
  const change = vi.fn(); render(<ReservationEditor previous={null} draft={draft} issues={[]} choices={[]} onChange={change} confirm={(_message, action) => action()} />);
  await userEvent.setup().selectOptions(screen.getByRole("combobox", { name: "Situação atual da reserva 1" }), "ASSIGN");
  expect(change.mock.calls[0][0].reservationConfirmations).toEqual([{ reservationId: id, expectedRevision: "7", action: "ASSIGN", currentSituationConfirmed: false, parts: [] }]);
});


function LaunchTransaction() {
  const { openNewTransaction } = useTransactionModals();
  return <><button onClick={openNewTransaction}>Lançar no extrato</button><TransactionModalManager /></>;
}

it.each([false, true])("offers the new account without reload (refresh fails first: %s)", async (failsFirst) => {
  const wallet = { id: "wallet", name: "Carteira Física", balance: 0, type: "CASH" as const, color: "#000000", isArchived: false };
  const opened = { ...wallet, id: "new-checking", name: "Corrente sintética", balance: 1000, type: "CHECKING" as const };
  const updatedAccounts = { status: 200, data: [wallet, opened] };
  let finishRefresh!: () => void;
  const pendingRefresh = new Promise<typeof updatedAccounts>((resolve, reject) => {
    finishRefresh = () => failsFirst ? reject(new ApiError("Leitura indisponível", 503)) : resolve(updatedAccounts);
  });
  const accounts = vi.spyOn(accountService, "getAll")
    .mockResolvedValueOnce({ status: 200, data: [wallet] })
    .mockReturnValueOnce(pendingRefresh)
    .mockResolvedValue(updatedAccounts);
  vi.spyOn(accountService, "getPosition").mockResolvedValue({
    status: 200, data: { asOfDate: "2026-10-21", totalBalance: "0.00", checkingBalance: "0.00", archivedBalance: "0.00", outsideSupportedRange: false, accounts: [] },
  });
  vi.spyOn(categoryService, "getAll").mockResolvedValue({ status: 200, data: [] });
  render(<ToastProvider><FinanceProvider><TransactionModalProvider>
    <OnboardingScreen /><LaunchTransaction />
  </TransactionModalProvider></FinanceProvider></ToastProvider>);
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Etapa 1 de 8: Contexto" });
  await user.click(screen.getByRole("button", { name: "Lançar no extrato" }));
  expect(within(screen.getByLabelText("Conta do lançamento")).getByRole("option", { name: /Carteira Física/ })).toBeTruthy();
  expect(within(screen.getByLabelText("Conta do lançamento")).queryByRole("option", { name: /Corrente sintética/ })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Fechar modal" }));
  await user.click(screen.getByRole("button", { name: "8. Revisão" }));
  await user.click(screen.getByRole("button", { name: "Preparar revisão financeira" }));
  await user.click(await screen.findByRole("button", { name: "Confirmar informações e registrar posições" }));
  await screen.findByRole("heading", { name: "Entrevista concluída" });
  await user.click(screen.getByRole("button", { name: "Lançar no extrato" }));
  const selector = screen.getByLabelText<HTMLSelectElement>("Conta do lançamento");
  expect(selector.matches(":disabled")).toBe(true);
  const logError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  await act(async () => finishRefresh());
  if (failsFirst) {
    await screen.findByText("Não foi possível atualizar as contas e categorias.");
    expect(selector.matches(":disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: /^Tentar novamente$/ }));
  }
  await within(selector).findByRole("option", { name: /Corrente sintética/ });
  expect(accounts).toHaveBeenCalledTimes(failsFirst ? 3 : 2);
  expect(onboardingClient.complete).toHaveBeenCalledTimes(1);
  const [{ operationId }] = vi.mocked(onboardingClient.complete).mock.calls[0];
  await act(async () => {
    notifyOnboardingCompleted(auth.user.id, operationId);
    notifyOnboardingCompleted("previous-owner", "previous-operation");
  });
  expect(accounts).toHaveBeenCalledTimes(failsFirst ? 3 : 2);
  await user.selectOptions(selector, "new-checking");
  await act(async () => window.dispatchEvent(new Event("refreshFinance")));
  expect(selector.value).toBe("new-checking");
  accounts.mockResolvedValueOnce({ status: 200, data: [wallet] });
  await act(async () => window.dispatchEvent(new Event("refreshFinance")));
  expect(selector.value).toBe("");
  logError.mockRestore();
});
