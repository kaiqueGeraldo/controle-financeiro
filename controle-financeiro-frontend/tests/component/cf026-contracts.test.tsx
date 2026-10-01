import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ConfigDashboardModal } from "@/components/forms/configDashboardModal";
import { ChangePasswordModal } from "@/components/forms/changePasswordModal";
import { DepositGoalModal } from "@/components/forms/depositGoalModal";
import { ReorderModal } from "@/components/forms/reorderModal";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { userService } from "@/services/userService";
import type { Goal } from "@/types";

const fixture = vi.hoisted(() => ({
  user: { id: "cf026-user", nome: "Pessoa Sintética", email: "pessoa@example.invalid",
    privacyMode: false, darkMode: false, notifContas: false, notifSemanal: false,
    dashboardConfig: undefined as string | undefined },
  refresh: vi.fn().mockResolvedValue(undefined),
  deposit: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
}));
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({
  user: fixture.user, refetchUser: fixture.refresh,
}) }));
vi.mock("@/services/userService", () => ({ userService: {
  updatePreferences: vi.fn().mockResolvedValue(undefined), changePassword: vi.fn(),
} }));
vi.mock("@/contexts/goalsContext", () => ({ useGoalsContext: () => ({ depositOptimistic: fixture.deposit }) }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: fixture.toast }) }));

// Oracle literal: IDs conhecidos, visible booleano e larguras permitidas.
// Não importa DEFAULT_CONFIG nem o parser para calcular o resultado esperado.
const defaults = [
  { id: "BALANCE", visible: true, span: 1 },
  { id: "FLOW", visible: true, span: 1 },
  { id: "INVOICES", visible: true, span: 1 },
  { id: "CHART", visible: true, span: 2 },
  { id: "GOALS", visible: true, span: 1 },
  { id: "RECENT_TX", visible: true, span: 1 },
  { id: "ACCOUNTS", visible: true, span: 1 },
];
const goal: Goal = {
  id: "cf026-goal", title: "Reserva sintética", type: "MONETARY", targetValue: 100,
  currentValue: 0, deadline: "2026-09-30",
};

beforeEach(() => {
  vi.clearAllMocks();
  fixture.user = { ...fixture.user, dashboardConfig: undefined };
  fixture.refresh.mockResolvedValue(undefined);
  fixture.deposit.mockResolvedValue(undefined);
  vi.mocked(userService.updatePreferences).mockResolvedValue({ status: 200, data: fixture.user });
});

describe("CF-026: preferências desconhecidas respeitam o contrato de apresentação", () => {
  test.each(["null", "{}", "42", '"texto"', "[null,42,\"BALANCE\"]", "{json inválido"])(
    "configuração %s usa defaults sem quebrar abertura ou salvamento", async (raw) => {
      fixture.user.dashboardConfig = raw;
      render(<ConfigDashboardModal isOpen onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Salvar Configuração" }));
      await waitFor(() => expect(userService.updatePreferences).toHaveBeenCalledWith({ dashboardConfig: JSON.stringify(defaults) }));
      expect(fixture.refresh).toHaveBeenCalledTimes(1);
    },
  );

  test.each([false, true])("preserva ordem, visibilidade e span válidos, inclusive JSON duplamente codificado=%s", async (doubleEncoded) => {
    const preferences = [{ id: "CHART", visible: false, span: 3 }, { id: "BALANCE", visible: true, span: 2 }];
    const raw = JSON.stringify(preferences);
    fixture.user.dashboardConfig = doubleEncoded ? JSON.stringify(raw) : raw;
    render(<ConfigDashboardModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Salvar Configuração" }));
    await waitFor(() => expect(userService.updatePreferences).toHaveBeenCalledWith({
      dashboardConfig: JSON.stringify([...preferences, defaults[1], defaults[2], defaults[4], defaults[5], defaults[6]]),
    }));
  });

  test("campos malformados e IDs desconhecidos não escapam para o payload", async () => {
    fixture.user.dashboardConfig = '[{"id":"BALANCE","visible":"false","span":99,"extra":"injetado"},{"id":"FORA","visible":true,"span":1}]';
    render(<ConfigDashboardModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Salvar Configuração" }));
    await waitFor(() => expect(userService.updatePreferences).toHaveBeenCalledWith({ dashboardConfig: JSON.stringify(defaults) }));
  });

  test("rejeição de salvar não fecha modal nem refaz leitura como sucesso", async () => {
    const close = vi.fn();
    vi.mocked(userService.updatePreferences).mockRejectedValue(null);
    render(<ConfigDashboardModal isOpen onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Salvar Configuração" }));
    await waitFor(() => expect(fixture.toast).toHaveBeenCalledWith("Erro ao salvar preferências."));
    expect(close).not.toHaveBeenCalled();
    expect(fixture.refresh).not.toHaveBeenCalled();
  });

  test("atualização de preferências recebida substitui a configuração e IDs duplicados não criam cartões extras", async () => {
    const view = render(<ConfigDashboardModal isOpen onClose={vi.fn()} />);
    fixture.user = { ...fixture.user, dashboardConfig: '[{"id":"BALANCE","visible":false,"span":2},{"id":"BALANCE","visible":true,"span":1}]' };
    view.rerender(<ConfigDashboardModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Salvar Configuração" }));
    await waitFor(() => expect(userService.updatePreferences).toHaveBeenCalledWith({
      dashboardConfig: JSON.stringify([{ id: "BALANCE", visible: false, span: 2 }, ...defaults.slice(1)]),
    }));
  });
});

describe("CF-026: erro desconhecido não quebra o tratamento de falhas", () => {
  test.each([null, { message: 42 }, new Error("Senha atual inválida")])("troca de senha com rejeição %j", async (failure) => {
    const close = vi.fn();
    vi.mocked(userService.changePassword).mockRejectedValue(failure);
    render(<ChangePasswordModal isOpen onClose={close} />);
    fireEvent.change(screen.getByLabelText("Senha Atual"), { target: { value: "Atual123!" } });
    fireEvent.change(screen.getByLabelText("Nova Senha"), { target: { value: "Nova123!" } });
    fireEvent.change(screen.getByLabelText("Confirmar Nova Senha"), { target: { value: "Nova123!" } });
    fireEvent.submit(screen.getByRole("button", { name: "Atualizar Senha" }).closest("form")!);
    const expected = failure instanceof Error ? "Senha atual inválida" : "Erro ao alterar senha. Verifique sua senha atual.";
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain(expected));
    expect(close).not.toHaveBeenCalled();
    expect(screen.queryByText("Senha alterada com sucesso!")).toBeNull();
  });

  test.each([
    { failure: null, message: "Erro ao realizar operação.", refresh: 0 },
    { failure: { status: 409, message: "Reserva indisponível" }, message: "Reserva indisponível", refresh: 1 },
    { failure: { response: { data: { message: "Erro legado" } }, message: "Outro" }, message: "Erro legado", refresh: 0 },
  ])("aporte preserva mensagem e reconferência de conflito: $message", async ({ failure, message, refresh }) => {
    fixture.deposit.mockRejectedValue(failure);
    const close = vi.fn(); const success = vi.fn();
    render(<DepositGoalModal isOpen onClose={close} onSuccess={success} goal={goal} accounts={[]} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "10" } });
    fireEvent.submit(screen.getByRole("button", { name: "Confirmar Aporte" }).closest("form")!);
    await screen.findByText(message);
    expect(close).not.toHaveBeenCalled();
    expect(success).toHaveBeenCalledTimes(refresh);
    expect(fixture.deposit).toHaveBeenCalledWith("cf026-goal", { amount: 10, note: "Aporte Manual", accountId: "" });
  });
});

test("CF-026: progresso numérico mantém protocolo no DTO, texto JSX e callbacks de sucesso", async () => {
  const close = vi.fn(); const success = vi.fn();
  render(<DepositGoalModal isOpen onClose={close} onSuccess={success} goal={{ ...goal, type: "NUMERIC" }} accounts={[]} />);
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: /Protocolo de Evolução/ }));
  expect(screen.getByText('1. A Essência (O "Download")')).toBeDefined();
  fireEvent.change(screen.getByPlaceholderText("A grande ideia e os top aprendizados..."), { target: { value: "Aprendizado sintético" } });
  fireEvent.submit(screen.getByRole("button", { name: "Registrar" }).closest("form")!);
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  expect(success).toHaveBeenCalledTimes(1);
  expect(fixture.deposit).toHaveBeenCalledWith("cf026-goal", {
    amount: 3, note: "Registro de Progresso",
    protocol: { essence: "Aprendizado sintético", personalConnection: "", systemEngineering: "" },
  });
});

test("CF-026: reorder genérico preserva IDs e o efeito de falha/retry", async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error("503 sintético")).mockResolvedValue(undefined);
  const close = vi.fn();
  render(<ReorderModal isOpen title="Ordem sintética" onClose={close} items={[
    { id: "b", name: "Conta B" }, { id: "a", name: "Conta A" },
  ]} renderItem={(item) => item.name} onSave={save} />);
  fireEvent.click(screen.getByRole("button", { name: "Salvar Nova Ordem" }));
  await waitFor(() => expect(fixture.toast).toHaveBeenCalledWith("Erro ao reordenar itens."));
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Salvar Nova Ordem" }));
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  expect(save.mock.calls).toEqual([[['b', 'a']], [['b', 'a']]]);
});

test.each(["success", "failure"])("CF-026: cleanup impede %s antigo de liberar lock da mesma chave na nova geração", async (outcome) => {
  let resolveOld!: (value: string) => void; let rejectOld!: (error: Error) => void;
  let resolveNew!: (value: string) => void;
  const old = new Promise<string>((resolve, reject) => { resolveOld = resolve; rejectOld = reject; });
  const current = new Promise<string>((resolve) => { resolveNew = resolve; });
  const mutationFn = vi.fn<(id: string) => Promise<string>>().mockReturnValueOnce(old).mockReturnValueOnce(current);
  const success = vi.fn(); const failure = vi.fn();
  const { result, rerender } = renderHook(({ scope }) => useOptimisticMutation({
    mutationFn, scopeKey: scope, onMutate: () => ({}), onSuccess: success, onError: failure,
  }), { initialProps: { scope: "A" } });
  let first!: Promise<string>; let second!: Promise<string>;
  act(() => { first = result.current.mutate("same-key"); });
  const settled = first.catch(() => undefined);
  rerender({ scope: "B" }); rerender({ scope: "A" });
  act(() => { second = result.current.mutate("same-key"); });
  await act(async () => {
    if (outcome === "success") resolveOld("antigo"); else rejectOld(new Error("falha antiga"));
    await settled;
  });
  expect(success).not.toHaveBeenCalled(); expect(failure).not.toHaveBeenCalled();
  expect(fixture.toast).not.toHaveBeenCalled(); expect(result.current.isPending).toBe(true);
  let duplicate!: Promise<string>;
  act(() => { duplicate = result.current.mutate("same-key"); });
  expect(duplicate).toBe(second); expect(mutationFn).toHaveBeenCalledTimes(2);
  await act(async () => { resolveNew("atual"); await second; });
  expect(success).toHaveBeenCalledTimes(1); expect(success).toHaveBeenCalledWith("atual", "same-key", {});
  expect(result.current.isPending).toBe(false);
});

test.each(["success", "failure"])("CF-026: cleanup no unmount descarta %s tardio e toast", async (outcome) => {
  let resolve!: (value: string) => void; let reject!: (error: Error) => void;
  const pending = new Promise<string>((ok, fail) => { resolve = ok; reject = fail; });
  const success = vi.fn(); const failure = vi.fn();
  const mutationFn = vi.fn<(id: string) => Promise<string>>().mockReturnValue(pending);
  const { result, unmount } = renderHook(() => useOptimisticMutation({
    mutationFn, scopeKey: "A", onMutate: () => ({}), onSuccess: success, onError: failure,
  }));
  let attempt!: Promise<string>;
  act(() => { attempt = result.current.mutate("item"); });
  const settled = attempt.catch(() => undefined);
  unmount();
  await act(async () => {
    if (outcome === "success") resolve("tardio"); else reject(new Error("falha tardia"));
    await settled;
  });
  expect(success).not.toHaveBeenCalled(); expect(failure).not.toHaveBeenCalled();
  expect(fixture.toast).not.toHaveBeenCalled();
});
