import { apiRequest } from "./api";

type MonthlyFlow = {
  income: number;
  expense: number;
  balance: number;
  percentage: number;
};

type ChartPoint = { label: string; valor: number };

export const dashboardService = {
  getMonthlyFlow: async (month: number, year: number, signal?: AbortSignal) => {
    return apiRequest<MonthlyFlow>(`/dashboard/flow?month=${month}&year=${year}`, {
      method: "GET",
      signal,
    });
  },
  
  getWealthChart: async (period: "30D" | "6M" | "1Y", signal?: AbortSignal) => {
    return apiRequest<ChartPoint[]>(`/dashboard/chart?period=${period}`, {
      method: "GET",
      signal,
    });
  }
};
