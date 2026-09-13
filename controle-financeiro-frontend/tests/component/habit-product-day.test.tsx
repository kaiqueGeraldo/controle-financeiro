import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { HabitItem } from "@/components/screens/habits/habitItem";
import { HabitDetails } from "@/components/screens/habits/habitDetails";
import { BrowserTodayProvider, useBrowserToday } from "@/contexts/browserTodayContext";
import { delayUntilNextProductDay } from "@/utils/date";
import type { Habit } from "@/types";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { privacyMode: false } }) }));
afterEach(() => vi.useRealTimers());

const habit: Habit = {
  id: "synthetic-habit", name: "Hábito sintético", icon: "Book", color: "#000000",
  frequency: "DAILY", currentStreak: 3, highestStreak: 5, orderIndex: 0,
  createdAt: "2026-09-01T12:00:00", logs: [],
};
function BrowserDate() { return <output aria-label="Hoje navegador">{useBrowserToday()}</output>; }
function setup(logs: Habit["logs"] = []) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-08T02:59:59Z"));
  const onToggle = vi.fn();
  const value = { ...habit, logs };
  const result = render(<BrowserTodayProvider>
    <BrowserDate />
    <HabitItem habit={value} onToggle={onToggle} onClick={vi.fn()} />
    <HabitDetails isOpen habit={value} onClose={vi.fn()} onDelete={vi.fn()} onUpdate={vi.fn()} />
  </BrowserTodayProvider>);
  return { ...result, onToggle };
}

test("P05: lista, detalhe e payload usam dia 07 antes da meia-noite de Brasília", () => {
  const { container, onToggle } = setup();
  fireEvent.click(screen.getByRole("button", { name: "Marcar Feito" }));
  expect(onToggle).toHaveBeenCalledWith("synthetic-habit", "2026-09-07");
  expect(container.querySelector('[aria-current="date"]')?.getAttribute("title")).toBe("07/09/2026");
  expect(screen.getByTitle("11/08/2026")).toBeDefined();
  expect(screen.queryByTitle("08/09/2026")).toBeNull();
  if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Pacific/Kiritimati") {
    expect(screen.getByLabelText("Hoje navegador").textContent).toBe("2026-09-08");
  }
});

test("página aberta muda destaque, janela e payload juntos sem remapear logs", () => {
  const { container, onToggle } = setup([{ id: "log-07", date: "2026-09-07", status: "COMPLETED" }]);
  expect(screen.getByRole("button", { name: "Feito Hoje" })).toBeDefined();
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.click(screen.getByRole("button", { name: "Marcar Feito" }));
  expect(onToggle).toHaveBeenCalledWith("synthetic-habit", "2026-09-08");
  expect(container.querySelector('[aria-current="date"]')?.getAttribute("title")).toBe("08/09/2026");
  expect(screen.queryByTitle("11/08/2026")).toBeNull();
  expect(screen.getByTitle("12/08/2026")).toBeDefined();
  expect(screen.getByTitle("07/09/2026").querySelector("svg")).not.toBeNull();
});

test.each(["focus", "visibilitychange"])("revalida após suspensão em %s e limpa o timer", (event) => {
  const { container, unmount, onToggle } = setup();
  act(() => {
    vi.setSystemTime(new Date("2026-09-09T03:05:00Z"));
    (event === "focus" ? window : document).dispatchEvent(new Event(event));
  });
  expect(container.querySelector('[aria-current="date"]')?.getAttribute("title")).toBe("09/09/2026");
  fireEvent.click(screen.getByRole("button", { name: "Marcar Feito" }));
  expect(onToggle).toHaveBeenCalledWith("synthetic-habit", "2026-09-09");
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test("limite IANA respeita o dia de 23 horas de São Paulo em 2018", () => {
  expect(delayUntilNextProductDay(new Date("2018-11-04T03:00:00Z"))).toBe(23 * 60 * 60 * 1000);
});
