import { apiRequest } from "./api";
import { CreatePlanItemDTO, PlanItem, PlanStatus } from "@/types";

export const planningService = {
  getByMonth: async (month: number, year: number, signal?: AbortSignal) => {
    return apiRequest(`/planning?month=${month}&year=${year}`, {
      method: "GET",
      signal,
    });
  },

  create: async (data: CreatePlanItemDTO) => {
    return apiRequest("/planning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  copyFromPrevious: async (month: number, year: number) => {
    return apiRequest("/planning/copy-previous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });
  },

  update: async (id: string, data: Partial<CreatePlanItemDTO>) => {
    return apiRequest(`/planning/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: string, status: PlanStatus) => {
    return apiRequest(`/planning/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  },

  updateIncome: async (month: number, year: number, income: number) => {
    return apiRequest("/planning/income", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year, income }),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/planning/${id}`, { method: "DELETE" });
  },

  reorder: async (orderedIds: string[]) => {
    return apiRequest("/planning/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderedIds),
    });
  },
};
