import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useAnnualSummary } from "@/hooks/useAnnualSummary";
import { annualSummaryService } from "@/services/annualSummaryService";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "owner" }, isLoading: false }) }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/services/annualSummaryService", () => ({ annualSummaryService: {
  getSummary: vi.fn(async () => ({ data: null })), updateNote: vi.fn(),
} }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

test.each([
  ["UTC", "2027-01-01T01:00:00Z", 2027],
  ["Pacific/Kiritimati", "2026-12-31T12:00:00Z", 2027],
  ["America/Los_Angeles", "2027-01-01T04:00:00Z", 2026],
  ["America/Sao_Paulo", "2027-01-01T04:00:00Z", 2027],
  ["UTC", "2026-06-15T12:00:00Z", 2026],
])("RD58-01 %s %s: initial query, manual selection, refresh and reopening", async (zone, instant, expected) => {
  vi.stubEnv("TZ", zone);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(instant));
  expect(new Date().getFullYear()).toBe(expected);
  const hook = renderHook(() => useAnnualSummary());
  expect(hook.result.current.year).toBe(expected);
  await act(() => vi.advanceTimersByTimeAsync(350));
  expect(annualSummaryService.getSummary).toHaveBeenLastCalledWith(expected, expect.any(AbortSignal));
  act(() => hook.result.current.setYear(2024));
  await act(() => vi.advanceTimersByTimeAsync(350));
  expect(annualSummaryService.getSummary).toHaveBeenLastCalledWith(2024, expect.any(AbortSignal));
  act(() => hook.result.current.setNoteContent("rascunho preservado"));
  act(() => vi.setSystemTime(new Date("2028-07-01T12:00:00Z")));
  hook.rerender();
  act(() => { void hook.result.current.refresh(); });
  await act(() => vi.advanceTimersByTimeAsync(350));
  expect(hook.result.current.year).toBe(2024);
  expect(hook.result.current.noteContent).toBe("rascunho preservado");
  expect(annualSummaryService.getSummary).toHaveBeenLastCalledWith(2024, expect.any(AbortSignal));
  hook.unmount();
  const reopened = renderHook(() => useAnnualSummary());
  expect(reopened.result.current.year).toBe(2028);
  await act(() => vi.advanceTimersByTimeAsync(350));
  expect(annualSummaryService.getSummary).toHaveBeenLastCalledWith(2028, expect.any(AbortSignal));
});
