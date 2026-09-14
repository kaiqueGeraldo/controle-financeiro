import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DashboardProvider, useDashboardContext } from "@/contexts/dashboardContext";
import { dashboardService } from "@/services/dashboardService";

vi.mock("@/contexts/userContext", () => ({ useUserContext: () => ({ user: { id: "cf015-synthetic" }, isLoading: false }) }));
vi.mock("@/services/transactionService", () => ({ transactionService: { getAll: vi.fn().mockResolvedValue({ data: { content: [] } }) } }));
vi.mock("@/services/dashboardService", () => ({ dashboardService: {
  getMonthlyFlow: vi.fn().mockResolvedValue({ data: { income: 0, expense: 0, balance: 0, percentage: 0 } }),
  getWealthChart: vi.fn(),
} }));

test("CF015-R02: 6M em cache permanece selecionado após resposta tardia de 1Y", async () => {
  let resolve!: (value: { status: number; data: { label: string; valor: number }[] }) => void;
  const delayed = new Promise<{ status: number; data: { label: string; valor: number }[] }>(r => { resolve = r; });
  vi.mocked(dashboardService.getWealthChart).mockImplementation(period => period === "6M"
    ? Promise.resolve({ status: 200, data: [{ label: "seis meses", valor: 1300 }] }) : delayed);
  const { result } = renderHook(() => useDashboardContext(), { wrapper: DashboardProvider });
  await act(async () => { await result.current.fetchChartData("6M"); });
  let inFlight!: Promise<void>;
  act(() => { inFlight = result.current.fetchChartData("1Y"); });
  await act(async () => { await result.current.fetchChartData("6M"); });
  expect(result.current.chartData).toEqual([{ label: "seis meses", valor: 1300 }]);
  await act(async () => { resolve({ status: 200, data: [{ label: "ano inteiro", valor: 900 }] }); await inFlight; });
  expect(result.current.chartData).toEqual([{ label: "seis meses", valor: 1300 }]);
});
