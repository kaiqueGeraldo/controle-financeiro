import { apiRequest } from "./api";
import { CreateHabitDTO } from "@/types";

export const habitService = {
  getAll: async () => {
    return apiRequest("/habits", { method: "GET" });
  },
  
  create: async (data: CreateHabitDTO) => {
    return apiRequest("/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  toggle: async (id: string, date: string) => {
    return apiRequest(`/habits/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
  },

  update: async (id: string, data: Partial<CreateHabitDTO>) => {
    return apiRequest(`/habits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/habits/${id}`, { method: "DELETE" });
  },

  reorder: async (orderedIds: string[]) => {
    return apiRequest("/habits/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderedIds),
    });
  },
};