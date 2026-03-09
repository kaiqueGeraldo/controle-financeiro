import { apiRequest } from "./api";

export const dashboardService = {
  getMonthlyFlow: async (month: number, year: number, signal?: AbortSignal) => {
    return apiRequest(`/dashboard/flow?month=${month}&year=${year}`, {
      method: "GET",
      signal,
    });
  },
  
  getWealthChart: async (period: "30D" | "6M" | "1Y", signal?: AbortSignal) => {
    return apiRequest(`/dashboard/chart?period=${period}`, {
      method: "GET",
      signal,
    });
  }
};