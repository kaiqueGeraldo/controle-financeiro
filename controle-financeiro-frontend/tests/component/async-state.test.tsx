import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { FinanceProvider, useFinanceContext } from "@/contexts/financeContext";
import { useCards } from "@/hooks/useCards";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { useExtract } from "@/hooks/useExtract";
import { accountService } from "@/services/accountService";
import {
  cardService,
  type CardInvoiceDetails,
  type CreditCard,
} from "@/services/cardService";
import { categoryService } from "@/services/categoryService";
import { transactionService } from "@/services/transactionService";
import type { Account, AccountPosition, Category } from "@/types";

const toastError = vi.fn();
const refreshFinance = vi.fn().mockResolvedValue(undefined);

let authenticatedUser: {
  user: { id: string } | null;
  isLoading: boolean;
} = {
  user: { id: "user-a" },
  isLoading: false,
};

vi.mock("@/contexts/toastContext", () => ({
  useToast: () => ({ error: toastError, info: vi.fn(), success: vi.fn() }),
}));

vi.mock("@/hooks/useUser", () => ({
  useUser: () => authenticatedUser,
}));

vi.mock("@/hooks/useFinanceData", () => ({
  useFinanceData: () => ({
    accounts: [],
    categories: [],
    refresh: refreshFinance,
    isLoading: false,
  }),
}));

vi.mock("@/services/accountService", () => ({
  accountService: { getAll: vi.fn(),getPosition:vi.fn() },
}));

vi.mock("@/services/cardService", () => ({
  cardService: {
    delete: vi.fn(),
    getAll: vi.fn(),
    getInvoiceDetails: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/services/categoryService", () => ({
  categoryService: {
    create: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/services/transactionService", () => ({
  transactionService: {
    getAll: vi.fn(),
    getSummary: vi.fn().mockResolvedValue({ status: 200, data: { entries: 0, exits: 0, balance: 0 } }),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("AC-UI-008: resposta mais recente e isolamento por usuário", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 8, 12));
    authenticatedUser = { user: { id: "user-a" }, isLoading: false };
    vi.mocked(accountService.getPosition).mockResolvedValue({status:200,data:{asOfDate:"2026-09-08",totalBalance:"0.00",checkingBalance:"0.00",archivedBalance:"0.00",outsideSupportedRange:false,accounts:[]}});
    vi.mocked(cardService.getAll).mockResolvedValue({ status: 200, data: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("refresh antigo de A/setembro não substitui B/outubro mesmo se o cliente ignorar abort", async () => {
    const requests: Array<{
      cardId: string;
      month: number;
      signal?: AbortSignal;
      response: Deferred<{ status: number; data: CardInvoiceDetails }>;
    }> = [];
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.mocked(cardService.getInvoiceDetails).mockImplementation(
      (cardId, month, _year, signal) => {
        const response = deferred<{ status: number; data: CardInvoiceDetails }>();
        requests.push({ cardId, month, signal, response });
        return response.promise;
      },
    );

    const cardA: CreditCard = {
      id: "card-a",
      name: "Cartão A",
      last4Digits: "0001",
      limit: 1000,
      closingDay: 30,
      dueDay: 10,
      color: "#000000",
      brand: "VISA",
      currentInvoiceValue: 10,
    };
    const cardB: CreditCard = {
      ...cardA,
      id: "card-b",
      name: "Cartão B",
      last4Digits: "0002",
      closingDay: 5,
    };

    const { result } = renderHook(() => useCards());
    await act(async () => Promise.resolve());

    act(() => result.current.selectCard(cardA));
    await act(async () => {
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    let refreshPromise!: Promise<void>;
    act(() => {
      refreshPromise = result.current.refreshAll();
    });

    act(() => result.current.selectCard(cardB));
    await act(async () => {
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    const requestB = requests.find(
      (request) => request.cardId === "card-b" && request.month === 10,
    );
    const refreshA = requests.filter(
      (request) => request.cardId === "card-a" && request.month === 9,
    )[1];
    const selectionA = requests.filter(
      (request) => request.cardId === "card-a" && request.month === 9,
    )[0];

    expect(requestB).toBeDefined();
    expect(refreshA).toBeDefined();
    expect(selectionA.signal?.aborted).toBe(true);

    await act(async () => {
      selectionA.response.reject(new DOMException("cancelada", "AbortError"));
      await Promise.resolve();
    });
    expect(consoleError).not.toHaveBeenCalled();

    await act(async () => {
      requestB!.response.resolve({
        status: 200,
        data: invoice("invoice-b", 10),
      });
      await requestB!.response.promise;
    });

    await act(async () => {
      refreshA.response.resolve({
        status: 200,
        data: invoice("invoice-a", 9),
      });
      // Abandoning A protects B's state AND reports cancellation to A's caller.
      await expect(refreshPromise).rejects.toMatchObject({ name: "ReconciliationCancelledError" });
    });

    expect(result.current.selectedCardId).toBe("card-b");
    expect(result.current.viewDate.getMonth()).toBe(9);
    expect(result.current.invoiceDetails?.id).toBe("invoice-b");

    for (const request of requests) {
      if (request === selectionA) continue;
      request.response.resolve({
        status: 200,
        data: invoice("invoice-discarded", request.month),
      });
    }
    await act(async () => Promise.resolve());
    consoleError.mockRestore();
  });

  test("refresh de fatura pode ser repetido depois de erro real", async () => {
    const requests: Deferred<{
      status: number;
      data: CardInvoiceDetails;
    }>[] = [];
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.mocked(cardService.getInvoiceDetails).mockImplementation(() => {
      const response = deferred<{
        status: number;
        data: CardInvoiceDetails;
      }>();
      requests.push(response);
      return response.promise;
    });

    const card: CreditCard = {
      id: "card-a",
      name: "Cartão A",
      last4Digits: "0001",
      limit: 1000,
      closingDay: 30,
      dueDay: 10,
      color: "#000000",
      brand: "VISA",
      currentInvoiceValue: 10,
    };
    const { result } = renderHook(() => useCards());
    await act(async () => Promise.resolve());

    act(() => result.current.selectCard(card));
    await act(async () => {
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    await act(async () => {
      requests[0].reject(new Error("falha de leitura sintética"));
      await requests[0].promise.catch(() => undefined);
    });
    expect(result.current.isInvoiceLoading).toBe(false);
    expect(consoleError).toHaveBeenCalledTimes(1);

    let retry!: Promise<void>;
    act(() => {
      retry = result.current.refreshAll();
    });
    await act(async () => {
      requests[1].resolve({
        status: 200,
        data: invoice("invoice-after-retry", 9),
      });
      await retry;
    });

    expect(result.current.invoiceDetails?.id).toBe("invoice-after-retry");
    expect(result.current.isInvoiceLoading).toBe(false);
    consoleError.mockRestore();
  });

  test("resposta tardia do usuário A não aparece depois do login do usuário B", async () => {
    const accountRequests: Deferred<{ status: number; data: Account[] }>[] = [];
    const categoryRequests: Deferred<{ status: number; data: Category[] }>[] = [];
    const positionRequests: Deferred<{status:number;data:AccountPosition}>[]=[];
    vi.mocked(accountService.getPosition).mockImplementation(()=>{const response=deferred<{status:number;data:AccountPosition}>();positionRequests.push(response);return response.promise;});

    vi.mocked(accountService.getAll).mockImplementation(() => {
      const response = deferred<{ status: number; data: Account[] }>();
      accountRequests.push(response);
      return response.promise;
    });
    vi.mocked(categoryService.getAll).mockImplementation(() => {
      const response = deferred<{ status: number; data: Category[] }>();
      categoryRequests.push(response);
      return response.promise;
    });

    function Probe() {
      const { accounts, categories, accountPosition } = useFinanceContext();
      return (
        <div data-testid="finance-owner">
          {accounts[0]?.name ?? "sem-conta"}|{categories[0]?.name ?? "sem-categoria"}|{accountPosition?.totalBalance??"sem-posicao"}
        </div>
      );
    }

    const rendered = render(
      <FinanceProvider>
        <Probe />
      </FinanceProvider>,
    );
    expect(accountRequests).toHaveLength(1);

    authenticatedUser = { user: null, isLoading: false };
    rendered.rerender(
      <FinanceProvider>
        <Probe />
      </FinanceProvider>,
    );
    expect(screen.getByTestId("finance-owner").textContent).toBe(
      "sem-conta|sem-categoria|sem-posicao",
    );

    authenticatedUser = { user: { id: "user-b" }, isLoading: false };
    rendered.rerender(
      <FinanceProvider>
        <Probe />
      </FinanceProvider>,
    );
    expect(accountRequests).toHaveLength(2);

    await act(async () => {
      accountRequests[1].resolve({
        status: 200,
        data: [account("account-b", "Conta B", 42.17)],
      });
      categoryRequests[1].resolve({
        status: 200,
        data: [category("category-b", "Categoria B")],
      });
      positionRequests[1].resolve({status:200,data:{asOfDate:"2026-09-08",totalBalance:"42.17",checkingBalance:"42.17",archivedBalance:"0.00",outsideSupportedRange:false,accounts:[]}});
      await Promise.all([accountRequests[1].promise, categoryRequests[1].promise]);
    });
    expect(screen.getByTestId("finance-owner").textContent).toBe(
      "Conta B|Categoria B|42.17",
    );

    await act(async () => {
      accountRequests[0].resolve({
        status: 200,
        data: [account("account-a", "Conta A", 999)],
      });
      categoryRequests[0].resolve({
        status: 200,
        data: [category("category-a", "Categoria A")],
      });
      positionRequests[0].resolve({status:200,data:{asOfDate:"2026-09-08",totalBalance:"999.00",checkingBalance:"999.00",archivedBalance:"0.00",outsideSupportedRange:false,accounts:[]}});
      await Promise.all([accountRequests[0].promise, categoryRequests[0].promise]);
    });
    expect(screen.getByTestId("finance-owner").textContent).toBe(
      "Conta B|Categoria B|42.17",
    );
  });

  test("R09: evento de alteração financeira invalida o saldo das contas", async () => {
    vi.mocked(accountService.getPosition).mockResolvedValueOnce({status:200,data:{asOfDate:"2026-09-08",totalBalance:"100.00",checkingBalance:"100.00",archivedBalance:"0.00",outsideSupportedRange:false,accounts:[]}}).mockResolvedValueOnce({status:200,data:{asOfDate:"2026-09-08",totalBalance:"90.00",checkingBalance:"90.00",archivedBalance:"0.00",outsideSupportedRange:false,accounts:[]}});
    vi.mocked(accountService.getAll).mockResolvedValueOnce({ status: 200, data: [account("a", "Conta sintética", 100)] })
      .mockResolvedValueOnce({ status: 200, data: [account("a", "Conta sintética", 90)] });
    vi.mocked(categoryService.getAll).mockResolvedValue({ status: 200, data: [] });
    const { result } = renderHook(() => useFinanceContext(), { wrapper: FinanceProvider });
    await act(async () => Promise.resolve());
    expect(result.current.saldoTotal).toBe(100);
    await act(async () => { window.dispatchEvent(new Event("refreshFinance")); });
    expect(result.current.saldoTotal).toBe(90);
    expect(accountService.getAll).toHaveBeenCalledTimes(2);
  });

  test("CF-012: falha de leitura não zera saldo silenciosamente e a recarga limpa o erro", async () => {
    vi.mocked(accountService.getPosition).mockResolvedValue({status:200,data:{asOfDate:"2026-09-08",totalBalance:"42.00",checkingBalance:"42.00",archivedBalance:"0.00",outsideSupportedRange:false,accounts:[]}});
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(accountService.getAll)
      .mockRejectedValueOnce(new Error("503 sintético"))
      .mockResolvedValueOnce({ status: 200, data: [account("a", "Conta recuperada", 42)] });
    vi.mocked(categoryService.getAll)
      .mockRejectedValueOnce(new Error("503 sintético"))
      .mockResolvedValueOnce({ status: 200, data: [] });

    const { result } = renderHook(() => useFinanceContext(), { wrapper: FinanceProvider });
    await act(async () => Promise.resolve());

    expect(result.current.error?.message).toBe("503 sintético");
    expect(result.current.accounts).toEqual([]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.saldoTotal).toBe(42);
    consoleError.mockRestore();
  });

  test("CF-012: extrato com erro não vira página vazia e retry requisita a primeira página", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(transactionService.getAll)
      .mockRejectedValueOnce(new Error("503 sintético"))
      .mockResolvedValueOnce({
        status: 200,
        data: { content: [], page: { number: 0, size: 30, totalElements: 0, totalPages: 0 } },
    });

    const { result } = renderHook(() => useExtract());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.error?.message).toBe("503 sintético");
    expect(result.current.groupedTransactions).toEqual([]);

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.error).toBeNull();
    expect(transactionService.getAll).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 0, size: 30 }),
    );
    consoleError.mockRestore();
  });
});

describe("AC-UI-009: mutações otimistas concorrentes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticatedUser = { user: { id: "user-a" }, isLoading: false };
  });

  test.each(["success", "failure"])("R03: resultado %s de sessão anterior A não atua após A/logout/A", async (outcome) => {
    const attempt = deferred<string>();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result, rerender } = renderHook(({ scope }) => useOptimisticMutation({
      mutationFn: (_id: string) => attempt.promise,
      onMutate: () => ({}), onSuccess, onError, scopeKey: scope,
    }), { initialProps: { scope: "user-a" as string | null } });
    let pending!: Promise<string>;
    act(() => { pending = result.current.mutate("item-a"); });
    const settled = pending.catch(() => undefined);
    rerender({ scope: null });
    rerender({ scope: "user-a" });
    await act(async () => {
      if (outcome === "success") attempt.resolve("ok");
      else attempt.reject(new Error("falha de sessão anterior"));
      await settled;
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
  });

  test("R03: desmontagem invalida callbacks da mutação pendente", async () => {
    const attempt = deferred<string>();
    const onSuccess = vi.fn();
    const { result, unmount } = renderHook(() => useOptimisticMutation({
      mutationFn: (_id: string) => attempt.promise,
      onMutate: () => ({}), onSuccess, onError: vi.fn(), scopeKey: "user-a",
    }));
    let pending!: Promise<string>;
    act(() => { pending = result.current.mutate("item-a"); });
    unmount();
    await act(async () => { attempt.resolve("ok"); await pending; });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test("duas chamadas da mesma chave no mesmo tick compartilham uma requisição e a falha propaga", async () => {
    const firstAttempt = deferred<string>();
    const mutationFn = vi.fn().mockReturnValueOnce(firstAttempt.promise);
    const onMutate = vi.fn(() => ({ previous: 0 }));
    const onError = vi.fn();
    const onSuccess = vi.fn();
    const calls: Promise<string>[] = [];

    function MutationButton() {
      const mutation = useOptimisticMutation({
        mutationFn,
        onMutate,
        onError,
        onSuccess,
        getMutationKey: (id: string) => id,
        scopeKey: "user-a",
      });
      return (
        <button
          onClick={() => {
            const call = mutation.mutate("operation-1");
            calls.push(call);
            void call.catch(() => undefined);
          }}
        >
          Executar mutação
        </button>
      );
    }

    render(<MutationButton />);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Executar mutação" }));
      fireEvent.click(screen.getByRole("button", { name: "Executar mutação" }));
    });

    const [first, duplicate] = calls;
    expect(first).toBe(duplicate);
    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(onMutate).toHaveBeenCalledTimes(1);

    const expectedFailure = new Error("falha sintética");
    const firstRejected = expect(first).rejects.toBe(expectedFailure);
    const duplicateRejected = expect(duplicate).rejects.toBe(expectedFailure);
    await act(async () => {
      firstAttempt.reject(expectedFailure);
      await Promise.all([firstRejected, duplicateRejected]);
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledTimes(1);

    mutationFn.mockResolvedValueOnce("retry-ok");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Executar mutação" }));
      await expect(calls[2]).resolves.toBe("retry-ok");
    });
    expect(mutationFn).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test("rollback tardio de M1 restaura só seu item e preserva M2 válida", async () => {
    const attempts = new Map([
      ["a", deferred<string>()],
      ["b", deferred<string>()],
    ]);
    const onSuccess = vi.fn();

    function useFixture() {
      const [values, setValues] = useState({ a: 0, b: 0 });
      const mutation = useOptimisticMutation({
        mutationFn: ({ id }: { id: "a" | "b" }) => attempts.get(id)!.promise,
        onMutate: ({ id }: { id: "a" | "b" }) => {
          const previous = values[id];
          setValues((current) => ({ ...current, [id]: current[id] + 1 }));
          return { previous };
        },
        onError: (_error, { id }, context) => {
          setValues((current) => ({ ...current, [id]: context.previous }));
        },
        onSuccess,
        getMutationKey: ({ id }) => id,
      });
      return { values, mutation };
    }

    const { result } = renderHook(() => useFixture());
    let mutationA!: Promise<string>;
    let mutationB!: Promise<string>;
    act(() => {
      mutationA = result.current.mutation.mutate({ id: "a" });
      mutationB = result.current.mutation.mutate({ id: "b" });
    });
    const rejectedA = expect(mutationA).rejects.toThrow("M1 falhou");

    await act(async () => {
      attempts.get("b")!.resolve("M2 válida");
      await mutationB;
    });
    await act(async () => {
      attempts.get("a")!.reject(new Error("M1 falhou"));
      await rejectedA;
    });

    expect(result.current.values).toEqual({ a: 0, b: 1 });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(
      "M2 válida",
      { id: "b" },
      { previous: 0 },
    );
  });
});

function account(id: string, name: string, balance: number): Account {
  return {
    id,
    name,
    balance,
    type: "CHECKING",
    color: "#000000",
    isArchived: false,
  };
}

function category(id: string, name: string): Category {
  return { id, name, type: "EXPENSE", icon: "Tag", color: "#000000" };
}

function invoice(id: string, month: number): CardInvoiceDetails {
  return {
    id,
    month,
    year: 2026,
    status: "OPEN",
    totalAmount: 10,
    transactions: [],
  };
}
