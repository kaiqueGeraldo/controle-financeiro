import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { HabitsProvider, useHabitsContext } from "@/contexts/habitsContext";
import { habitService } from "@/services/habitService";
import type { Habit } from "@/types";

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: { id: "synthetic-user" }, isLoading: false }),
}));
vi.mock("@/contexts/toastContext", () => ({
  useToast: () => ({ error: vi.fn(), info: vi.fn(), success: vi.fn() }),
}));
vi.mock("@/services/habitService", () => ({
  habitService: { getAll: vi.fn(), toggle: vi.fn() },
}));

function deferred() {
  let resolve!: (value: { status: number; data: unknown }) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<{ status: number; data: unknown }>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

test.each([false, true])("R14: rollback de uma data preserva outra confirmação do mesmo hábito (log prévio=%s)", async (existingLog) => {
  const habit: Habit = {
    id: "habit-a", name: "Hábito sintético", icon: "Book", color: "#000000",
    frequency: "DAILY", currentStreak: 0, highestStreak: 0, orderIndex: 0,
    createdAt: "2026-09-01T12:00:00", logs: existingLog
      ? [{ id: "log-a", date: "2026-09-07", status: "PENDING" }] : [],
  };
  vi.mocked(habitService.getAll).mockResolvedValueOnce({ status: 200, data: [habit] })
    .mockRejectedValue(new Error("reconciliação indisponível"));
  const first = deferred();
  const second = deferred();
  vi.mocked(habitService.toggle).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const { result } = renderHook(() => useHabitsContext(), { wrapper: HabitsProvider });
  await act(async () => Promise.resolve());
  let firstCall!: Promise<void>;
  let secondCall!: Promise<void>;
  act(() => { firstCall = result.current.toggleHabitOptimistic("habit-a", "2026-09-07"); });
  const rejected = firstCall.catch(() => undefined);
  act(() => { secondCall = result.current.toggleHabitOptimistic("habit-a", "2026-09-08"); });
  expect(habitService.toggle).toHaveBeenCalledTimes(2);
  await act(async () => { second.resolve({ status: 204, data: null }); await secondCall; });
  await act(async () => { first.reject(new Error("M1 recusada")); await rejected; });
  const logs = result.current.habits[0].logs;
  expect(logs.find((log) => log.date === "2026-09-08")?.status).toBe("COMPLETED");
  expect(logs.find((log) => log.date === "2026-09-07")?.status).toBe(existingLog ? "PENDING" : undefined);
  expect(habitService.getAll).toHaveBeenCalledTimes(3);
});
