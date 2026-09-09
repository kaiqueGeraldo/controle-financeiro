// Open finding P05. Run through pending-probes.mjs in an isolated copy.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { HabitItem } from "@/components/screens/habits/habitItem";
import type { Habit } from "@/types";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { privacyMode: false } }) }));

test("P05: marcar hoje em UTC+14 envia o dia do produto, ainda 07 em Brasília", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-08T02:59:59Z"));
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("Pacific/Kiritimati");
  const onToggle = vi.fn();
  const habit: Habit = {
    id: "synthetic-habit", name: "Hábito sintético", icon: "Book", color: "#000000",
    frequency: "DAILY", currentStreak: 0, highestStreak: 0, orderIndex: 0,
    createdAt: "2026-09-01T12:00:00", logs: [],
  };
  try {
    render(<HabitItem habit={habit} onToggle={onToggle} onClick={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Marcar Feito" }));
    expect(onToggle).toHaveBeenCalledWith("synthetic-habit", "2026-09-07");
  } finally { vi.useRealTimers(); }
});
