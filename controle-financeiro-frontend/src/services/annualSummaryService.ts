import { apiRequest } from "./api";
import { AnnualSummaryResponse } from "@/types";

export const annualSummaryService = {
  getSummary: async (year: number, signal?: AbortSignal) => {
    return apiRequest<AnnualSummaryResponse>(`/annual-summary?year=${year}`, {
      method: "GET",
      signal,
    });
  },

  updateNote: async (year: number, content: string) => {
    return apiRequest("/annual-summary/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, content }),
    });
  },
};
