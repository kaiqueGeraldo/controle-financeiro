import { apiRequest } from "./api";

import type { MonthlyFlowResponse as MonthlyFlow, ChartPoint } from "@/types";

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
