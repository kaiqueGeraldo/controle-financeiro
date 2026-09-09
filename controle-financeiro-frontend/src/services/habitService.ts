import { apiRequest } from "./api";
import { CreateHabitDTO, Habit } from "@/types";

export const habitService = {
  getAll: async (signal?: AbortSignal) => {
    return apiRequest<Habit[]>("/habits", { method: "GET", signal });
  },
  
  create: async (data: CreateHabitDTO) => {
    return apiRequest<Habit>("/habits", {
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
    return apiRequest<Habit>(`/habits/${id}`, {
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
