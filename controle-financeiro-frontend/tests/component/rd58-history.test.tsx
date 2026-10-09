import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { GoalDetails } from "@/components/screens/goals/goalDetails";
import { BrowserTodayProvider } from "@/contexts/browserTodayContext";
import { goalHistoryTimeLabel } from "@/services/temporal";
import type { GoalHistory } from "@/types";
import { goalService } from "@/services/goalService";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: null, isLoading: false }) }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/contexts/goalsContext", () => ({ useGoalsContext: () => ({ refreshGoals: vi.fn() }) }));
vi.mock("@/contexts/habitsContext", () => ({ useHabitsContext: () => ({ habits: [] }) }));
vi.mock("@/contexts/investmentsContext", () => ({ useInvestmentsContext: () => ({ investments: [] }) }));
vi.mock("@/contexts/modals/goalModalContext", () => ({ useGoalModals: () => ({ openDeleteHistory: vi.fn() }) }));

const known: GoalHistory = { id: "known", amount: 1, note: "Novo", date: "2026-09-08T03:10:00Z",
  recordedAt: "2026-09-08T03:10:00Z", dateOrigin: "SERVER_CLOCK", legacyDateRaw: "2026-09-08T00:10:00" };
const legacy: GoalHistory = { id: "legacy", amount: 1, note: "Antigo", date: "2026-09-07T23:30:00",
  recordedAt: null, dateOrigin: "UNKNOWN", legacyDateRaw: "2026-09-07T23:30:00" };
function details(history: GoalHistory[]) {
  return <BrowserTodayProvider><GoalDetails isOpen goal={{ id: "goal", title: "Meta", type: "NUMERIC",
    targetValue: 10, currentValue: 2, deadline: "2027-12-31" }} accounts={[]} cards={[]}
    history={history} isHistoryLoading={false} onClose={vi.fn()} onDelete={vi.fn()} onDeposit={vi.fn()} /></BrowserTodayProvider>;
}

test.each(["UTC", "Pacific/Kiritimati"])("RD58 independent HTTP client parsing and reload in %s", async zone => {
  vi.stubEnv("TZ", zone);
  // Literal HTTP contract, independent of the productive formatter/parser.
  const body = '[{"id":"new","amount":1,"note":"Novo","date":"2026-09-08T03:10:00.123456Z","recordedAt":"2026-09-08T03:10:00.123456Z","dateOrigin":"SERVER_CLOCK","legacyDateRaw":"2026-09-08T00:10:00.123456"},{"id":"old","amount":1,"date":"2026-09-07T23:30:01.123456","recordedAt":null,"dateOrigin":"UNKNOWN","legacyDateRaw":"2026-09-07T23:30:01.123456"},{"id":"absent","amount":1,"date":null,"recordedAt":null,"dateOrigin":"UNKNOWN","legacyDateRaw":null}]';
  const fetchMock = vi.fn(async (url: string) => {
    expect(["/api/goals/goal/history", "/api/goals/goal/allocations"]).toContain(url);
    return new Response(url.endsWith("/history") ? body : "[]", { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  for (let load = 0; load < 2; load++) {
    const response = await goalService.getHistory("goal");
    expect(response.data[0].recordedAt).toBe("2026-09-08T03:10:00.123456Z");
    expect(response.data[1].legacyDateRaw).toBe("2026-09-07T23:30:01.123456");
    const view = render(details(response.data));
    expect(screen.getByText("08/09/2026, 00:10 (America/Sao_Paulo)")).toBeDefined();
    expect(screen.getByText("07/09/2026 23:30:01.123456 — Fuso desconhecido")).toBeDefined();
    expect(screen.getByText("Data indisponível — Fuso desconhecido")).toBeDefined();
    view.unmount();
  }
  expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/history"))).toHaveLength(2);
  expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/allocations"))).toHaveLength(2);
  expect(fetchMock).toHaveBeenCalledWith("/api/goals/goal/history", expect.objectContaining({ method: "GET", cache: "no-store" }));
});
test.each(["UTC", "America/Sao_Paulo", "Pacific/Kiritimati"])("RD58-02 presentation and reopen in %s", zone => {
  vi.stubEnv("TZ", zone);
  const first = render(details([known, legacy]));
  expect(screen.getByText("08/09/2026, 00:10 (America/Sao_Paulo)")).toBeDefined();
  expect(screen.getByText("07/09/2026 23:30 — Fuso desconhecido")).toBeDefined();
  first.unmount();
  render(details(JSON.parse(JSON.stringify([known, legacy]))));
  expect(screen.getByText("08/09/2026, 00:10 (America/Sao_Paulo)")).toBeDefined();
  expect(screen.getByText("07/09/2026 23:30 — Fuso desconhecido")).toBeDefined();
});
test("offset alone does not prove provenance; raw/null and precision are preserved", () => {
  expect(goalHistoryTimeLabel({ ...legacy, date: "2026-09-08T03:10:00Z", legacyDateRaw: null })).toBe("2026-09-08T03:10:00Z — Fuso desconhecido");
  expect(goalHistoryTimeLabel({ ...legacy, date: null, legacyDateRaw: null })).toBe("Data indisponível — Fuso desconhecido");
  expect(goalHistoryTimeLabel({ ...legacy, legacyDateRaw: "2026-09-07T23:30:01.123456" })).toBe("07/09/2026 23:30:01.123456 — Fuso desconhecido");
  expect(goalHistoryTimeLabel({ ...known, recordedAt: "2026-09-08T17:10:00+14:00" })).toBe("08/09/2026, 00:10 (America/Sao_Paulo)");
  expect(goalHistoryTimeLabel({ ...known, recordedAt: "2026-09-08T03:10:00" })).toContain("Fuso desconhecido");
});
