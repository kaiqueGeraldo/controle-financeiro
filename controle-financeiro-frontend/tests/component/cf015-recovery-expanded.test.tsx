import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { PayInvoiceModal } from "@/components/forms/payInvoiceModal";
import CardsScreen from "@/screens/private/cards/cardsScreen";
import { cardService, type CreditCard } from "@/services/cardService";
import { ApiError } from "@/services/api";
import { useAnnualSummary } from "@/hooks/useAnnualSummary";
import { annualSummaryService } from "@/services/annualSummaryService";
import { DashboardProvider, useDashboardContext } from "@/contexts/dashboardContext";
import { dashboardService } from "@/services/dashboardService";
import { EditProfileModal } from "@/components/forms/editProfileModal";

let user = { id: "recovery-A", nome: "Pessoa original", email: "a@example.invalid" };
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user, isLoading: false }) }));
vi.mock("@/contexts/userContext", () => ({ useUserContext: () => ({ user, isLoading: false }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ handleLogout: vi.fn() }) }));
vi.mock("@/hooks/useFinanceData", () => ({ useFinanceData: () => ({ accounts: [], categories: [], refresh: async () => undefined }) }));
vi.mock("@/contexts/modals/cardModalContext", () => ({ useCardModals: () => ({ openNewCard: vi.fn() }) }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/services/annualSummaryService", () => ({ annualSummaryService: { getSummary: vi.fn(), updateNote: vi.fn() } }));
vi.mock("@/services/transactionService", () => ({ transactionService: { getAll: vi.fn().mockResolvedValue({ data: { content: [] } }) } }));
vi.mock("@/services/dashboardService", () => ({ dashboardService: { getMonthlyFlow: vi.fn().mockResolvedValue({ data: { income: 0, expense: 0, balance: 0, percentage: 0 } }), getWealthChart: vi.fn() } }));

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const card: CreditCard = { id: "recovery-card", name: "Cartão sintético", last4Digits: "4242", limit: 1000, closingDay: 31, dueDay: 28, color: "#111", brand: "VISA", currentInvoiceValue: 100 };
const props = { isOpen: true, onClose: vi.fn(), onSuccess: vi.fn(), ownerId: "recovery-A", cardId: card.id, cardName: card.name, currentInvoiceValue: 100, month: 9, year: 2026,
  accounts: [{ id: "account", name: "Sintética", balance: 1000, type: "CHECKING" as const, color: "#111", isArchived: false }] };
const summary = (year: number, note = "original") => ({ year, note, balance: { totalIncome: 0, totalExpense: 0, annualBalance: 0 }, creditCard: { totalSpent: 0, subscriptionsTotal: 0, monthlyAverage: 0 }, investments: { totalValue: 0, items: [] }, comparison: { incomeGrowthPercentage: 0, expenseGrowthPercentage: 0, message: "" } });
beforeEach(() => { sessionStorage.clear(); user = { id: "recovery-A", nome: "Pessoa original", email: "a@example.invalid" }; props.onClose.mockReset(); props.onSuccess.mockReset(); });
afterEach(() => vi.useRealTimers());

test("R03: duplo envio faz um POST; falha de releitura recupera só com GETs", async () => {
  const payment = deferred<{ status: number; data: undefined }>();
  vi.spyOn(cardService, "payInvoice").mockReturnValue(payment.promise);
  props.onSuccess.mockRejectedValueOnce(new Error("read 503")).mockResolvedValue(undefined);
  render(<PayInvoiceModal {...props} />);
  const form = screen.getByRole("button", { name: "Confirmar Pagamento" }).closest("form")!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(cardService.payInvoice).toHaveBeenCalledTimes(1);
  await act(async () => payment.resolve({ status: 200, data: undefined }));
  expect(screen.getByRole("alert").textContent).toMatch(/Pagamento confirmado/);
  expect(props.onClose).not.toHaveBeenCalled();
  fireEvent.submit(form);
  fireEvent.click(screen.getByRole("button", { name: /Atualizar dados sem repetir/ }));
  await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
  expect(cardService.payInvoice).toHaveBeenCalledTimes(1);
  expect(props.onSuccess).toHaveBeenCalledTimes(2);
});

test("R03: resultado desconhecido continua protegido após remontagem e atualização", async () => {
  vi.spyOn(cardService, "payInvoice").mockRejectedValue(new ApiError("lost response", 504, { requiresReconciliation: true }));
  vi.spyOn(cardService, "paymentReceipt").mockRejectedValue(new ApiError("Receipt not found",404));
  props.onSuccess.mockResolvedValue(undefined);
  const view = render(<PayInvoiceModal {...props} />);
  fireEvent.submit(screen.getByRole("button", { name: "Confirmar Pagamento" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Não foi possível confirmar/));
  view.unmount();
  render(<PayInvoiceModal {...props} />);
  expect(screen.getByRole("button", { name: "Confirmar Pagamento" })).toHaveProperty("disabled", true);
  fireEvent.click(screen.getByRole("button", { name: /Atualizar dados sem repetir/ }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/ainda não localizado/));
  expect(cardService.paymentReceipt).toHaveBeenCalledTimes(1);
  expect(cardService.payInvoice).toHaveBeenCalledTimes(1);
  expect(props.onClose).not.toHaveBeenCalled();
});

test("R03: recusa HTTP permite corrigir a entrada sem confirmação falsa", async () => {
  vi.spyOn(cardService, "payInvoice").mockRejectedValue(new ApiError("Saldo insuficiente", 422));
  render(<PayInvoiceModal {...props} />);
  fireEvent.submit(screen.getByRole("button", { name: "Confirmar Pagamento" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Pagamento recusado"));
  expect(props.onSuccess).not.toHaveBeenCalled();
  expect(props.onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Confirmar Pagamento" })).toHaveProperty("disabled", false);
});

test("R05: tela e hook reais distinguem 503 inicial, retry e vazio confirmado", async () => {
  vi.spyOn(cardService, "getAll").mockRejectedValueOnce(new Error("503 cards")).mockResolvedValue({ status: 200, data: [] });
  render(<CardsScreen />);
  await screen.findByText("Não foi possível carregar os dados.");
  expect(screen.queryByText("Nenhum cartão cadastrado.")).toBeNull();
  expect(screen.queryByText("Limite Global")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Nenhum cartão cadastrado.");
});

test("R05: erro ao trocar mês não mostra fatura zerada; nova leitura recupera", async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
  vi.spyOn(cardService, "getAll").mockResolvedValue({ status: 200, data: [card] });
  vi.spyOn(cardService, "getInvoiceDetails").mockResolvedValueOnce({ status: 200, data: { id: "i", month: 9, year: 2026, totalAmount: 100, status: "OPEN", transactions: [] } })
    .mockRejectedValueOnce(new Error("503 invoice")).mockResolvedValue({ status: 200, data: { id: "ii", month: 10, year: 2026, totalAmount: 0, status: "OPEN", transactions: [] } });
  render(<CardsScreen />);
  await act(async () => Promise.resolve());
  fireEvent.click(screen.getByRole("button", { name: /Ver fatura/ }));
  await act(async () => vi.advanceTimersByTimeAsync(350));
  fireEvent.click(screen.getByRole("button", { name: "Próximo mês da fatura" }));
  await act(async () => vi.advanceTimersByTimeAsync(350));
  expect(screen.getByRole("button", { name: "Fatura indisponível" })).toHaveProperty("disabled", true);
  expect(screen.queryByRole("button", { name: "Fatura Zerada" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await act(async () => Promise.resolve());
  expect(screen.getByRole("button", { name: "Fatura Zerada" })).toBeDefined();
});

test("R01/R04: refetch conserva rascunho, falha não salva e sucesso sobrevive nova leitura", async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
  let persisted = "original";
  vi.mocked(annualSummaryService.getSummary).mockImplementation(async year => ({ status: 200, data: summary(year, persisted) }));
  vi.mocked(annualSummaryService.updateNote).mockRejectedValueOnce(new Error("503")).mockImplementation(async (_year, note) => { persisted = note; return { status: 204, data: undefined }; });
  const view = renderHook(() => useAnnualSummary());
  await act(async () => vi.advanceTimersByTimeAsync(350));
  act(() => view.result.current.setNoteContent("rascunho"));
  await act(async () => { await view.result.current.refresh(); await vi.advanceTimersByTimeAsync(350); });
  expect(view.result.current.noteContent).toBe("rascunho");
  await act(async () => expect(await view.result.current.saveNote()).toBe(false));
  expect(persisted).toBe("original");
  await act(async () => expect(await view.result.current.saveNote()).toBe(true));
  view.unmount();
  const reload = renderHook(() => useAnnualSummary());
  await act(async () => vi.advanceTimersByTimeAsync(350));
  expect(reload.result.current.noteContent).toBe("rascunho");
  act(() => reload.result.current.setYear(2025));
  expect(reload.result.current.noteContent).toBe("");
});

test("R01: erro antigo após A-B-A e resposta após troca de sessão são ignorados", async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
  const old = deferred<{ status: number; data: ReturnType<typeof summary> }>();
  vi.mocked(annualSummaryService.getSummary).mockImplementation(year => year === 2026 ? Promise.resolve({ status: 200, data: summary(year) }) : old.promise);
  const view = renderHook(() => useAnnualSummary());
  await act(async () => vi.advanceTimersByTimeAsync(350));
  act(() => view.result.current.setYear(2025));
  await act(async () => vi.advanceTimersByTimeAsync(350));
  act(() => view.result.current.setYear(2026));
  await act(async () => old.reject(new Error("obsolete")));
  expect(view.result.current.error).toBeNull();
  expect(view.result.current.summary?.year).toBe(2026);
  const delayed = deferred<{ status: number; data: ReturnType<typeof summary> }>();
  vi.mocked(annualSummaryService.getSummary).mockReturnValueOnce(delayed.promise);
  await act(async () => { await view.result.current.refresh(); await vi.advanceTimersByTimeAsync(350); });
  user = { ...user, id: "recovery-B" }; view.rerender();
  await act(async () => delayed.resolve({ status: 200, data: summary(2026, "PRIVATE A") }));
  expect(view.result.current.noteContent).not.toBe("PRIVATE A");
  view.unmount();
});

test("R02: erro abandonado não afeta cache e resultado tardio não atravessa sessão", async () => {
  const old = deferred<{ status: number; data: { label: string; valor: number }[] }>();
  vi.mocked(dashboardService.getWealthChart).mockImplementation(period => period === "6M" ? Promise.resolve({ status: 200, data: [{ label: "six", valor: 1300 }] }) : old.promise);
  const view = renderHook(() => useDashboardContext(), { wrapper: DashboardProvider });
  await act(async () => view.result.current.fetchChartData("6M"));
  let flight!: Promise<void>;
  act(() => { flight = view.result.current.fetchChartData("1Y"); });
  await act(async () => view.result.current.fetchChartData("6M"));
  await act(async () => { old.reject(new Error("obsolete")); await flight; });
  expect(view.result.current.chartError).toBeNull();
  expect(view.result.current.chartData[0].valor).toBe(1300);
  const later = deferred<{ status: number; data: { label: string; valor: number }[] }>();
  vi.mocked(dashboardService.getWealthChart).mockReturnValueOnce(later.promise);
  act(() => { flight = view.result.current.fetchChartData("1Y"); });
  user = { ...user, id: "recovery-B" }; view.rerender();
  await act(async () => { later.resolve({ status: 200, data: [{ label: "private", valor: 900 }] }); await flight; });
  expect(view.result.current.chartData).toEqual([]);
  view.unmount();
});

test("R07: troca de identidade e cancelar/reabrir inicializam o formulário correto", () => {
  const view = render(<EditProfileModal isOpen onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Rascunho A" } });
  user = { ...user, id: "recovery-B", nome: "Pessoa B" }; view.rerender(<EditProfileModal isOpen onClose={vi.fn()} />);
  expect(screen.getByLabelText("Nome")).toHaveProperty("value", "Pessoa B");
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Cancelado" } });
  view.rerender(<EditProfileModal isOpen={false} onClose={vi.fn()} />);
  view.rerender(<EditProfileModal isOpen onClose={vi.fn()} />);
  expect(screen.getByLabelText("Nome")).toHaveProperty("value", "Pessoa B");
});

test("R01/R04: confirmação antiga não fecha nem substitui nota de outra entidade", async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
  vi.mocked(annualSummaryService.getSummary).mockImplementation(async year => ({ status: 200, data: summary(year, `nota ${year}`) }));
  const saved = deferred<{ status: number; data: undefined }>();
  vi.mocked(annualSummaryService.updateNote).mockReturnValue(saved.promise);
  const view = renderHook(() => useAnnualSummary());
  await act(async () => vi.advanceTimersByTimeAsync(350));
  act(() => view.result.current.setNoteContent("edição 2026"));
  let saving!: Promise<boolean>;
  act(() => { saving = view.result.current.saveNote(); });
  act(() => view.result.current.setYear(2025));
  await act(async () => vi.advanceTimersByTimeAsync(350));
  await act(async () => { saved.resolve({ status: 204, data: undefined }); expect(await saving).toBe(false); });
  expect(view.result.current.noteContent).toBe("nota 2025");
  expect(view.result.current.isSavingNote).toBe(false);
  vi.mocked(annualSummaryService.getSummary).mockResolvedValueOnce({ status: 200, data: summary(2026, "edição 2026") });
  act(() => view.result.current.setYear(2026));
  await act(async () => vi.advanceTimersByTimeAsync(350));
  expect(view.result.current.noteContent).toBe("edição 2026");
});

test("R01/R02: desmontagem cancela as duas leituras e ignora entrega posterior", async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
  const annual = deferred<{ status: number; data: ReturnType<typeof summary> }>();
  const chart = deferred<{ status: number; data: { label: string; valor: number }[] }>();
  vi.mocked(annualSummaryService.getSummary).mockReturnValue(annual.promise);
  vi.mocked(dashboardService.getWealthChart).mockReturnValue(chart.promise);
  const a = renderHook(() => useAnnualSummary());
  const b = renderHook(() => useDashboardContext(), { wrapper: DashboardProvider });
  let flight!: Promise<void>;
  await act(async () => { await vi.advanceTimersByTimeAsync(350); flight = b.result.current.fetchChartData("6M"); });
  const annualSignal = vi.mocked(annualSummaryService.getSummary).mock.calls.at(-1)![1];
  const chartSignal = vi.mocked(dashboardService.getWealthChart).mock.calls.at(-1)![1];
  a.unmount(); b.unmount();
  expect(annualSignal?.aborted).toBe(true); expect(chartSignal?.aborted).toBe(true);
  await act(async () => { annual.resolve({ status: 200, data: summary(2026, "late") }); chart.reject(new Error("late")); await flight; });
});
