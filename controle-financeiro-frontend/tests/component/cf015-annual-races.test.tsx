import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useAnnualSummary } from "@/hooks/useAnnualSummary";
import { AnnualNotepad } from "@/components/screens/annual-summary/annualNotepad";
import { annualSummaryService } from "@/services/annualSummaryService";
import type { AnnualSummaryResponse } from "@/types";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "cf015-synthetic" }, isLoading: false }) }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/services/annualSummaryService", () => ({ annualSummaryService: { getSummary: vi.fn(), updateNote: vi.fn() } }));

function response(year: number, note: string): AnnualSummaryResponse {
  return { year, note, balance: { totalIncome: 0, totalExpense: 0, annualBalance: 0 },
    creditCard: { totalSpent: 0, subscriptionsTotal: 0, monthlyAverage: 0 },
    investments: { totalValue: 0, items: [] },
    comparison: { incomeGrowthPercentage: 0, expenseGrowthPercentage: 0, message: "" } };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-08T12:00:00Z")); });
afterEach(() => vi.useRealTimers());

test("CF015-R01: voltar ao ano em cache invalida a resposta do ano abandonado", async () => {
  const old = deferred<{ status: number; data: AnnualSummaryResponse }>();
  vi.mocked(annualSummaryService.getSummary).mockImplementation(year => year === 2026
    ? Promise.resolve({ status: 200, data: response(2026, "nota 2026") }) : old.promise);
  const { result } = renderHook(() => useAnnualSummary());
  await act(async () => { await vi.advanceTimersByTimeAsync(350); });
  expect(result.current.summary?.year).toBe(2026);
  act(() => result.current.setYear(2025));
  await act(async () => { await vi.advanceTimersByTimeAsync(350); });
  act(() => result.current.setYear(2026));
  expect(result.current.summary?.year).toBe(2026);
  await act(async () => { old.resolve({ status: 200, data: response(2025, "nota 2025") }); });
  expect(result.current.year).toBe(2026);
  expect(result.current.summary?.year).toBe(2026);
  expect(result.current.noteContent).toBe("nota 2026");
});

test("CF015-R04: texto digitado durante gravação não aparece confirmado sem persistir", async () => {
  const saved = deferred<{ status: number; data: undefined }>();
  let persisted = "original";
  vi.mocked(annualSummaryService.getSummary).mockResolvedValue({ status: 200, data: response(2026, persisted) });
  vi.mocked(annualSummaryService.updateNote).mockImplementation(async (_year, note) => {
    await saved.promise; persisted = note; return { status: 204, data: undefined };
  });
  function Harness() {
    const state = useAnnualSummary();
    return <AnnualNotepad year={state.year} content={state.noteContent} isSaving={state.isSavingNote}
      onContentChange={state.setNoteContent} onSave={state.saveNote} />;
  }
  render(<Harness />);
  await act(async () => { await vi.advanceTimersByTimeAsync(350); });
  fireEvent.click(screen.getByRole("button"));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "enviado" } });
  fireEvent.click(screen.getByRole("button"));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "rascunho posterior" } });
  await act(async () => { saved.resolve({ status: 204, data: undefined }); });
  expect(persisted).toBe("enviado");
  // SPEC AC-UI-009: preservar edição posterior e indicar que ainda requer salvar.
  expect(screen.queryByRole("textbox")).not.toBeNull();
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("rascunho posterior");
});
