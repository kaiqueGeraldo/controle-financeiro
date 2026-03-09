import { apiRequest } from "./api";
import {
  CreateGoalDTO,
  CreateGoalItemDTO,
  GoalDepositDTO,
  PurchaseGoalItemDTO,
} from "@/types";

export const goalService = {
  getAll: async () => {
    return apiRequest("/goals", { method: "GET" });
  },

  create: async (data: CreateGoalDTO) => {
    return apiRequest("/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  deposit: async (id: string, data: GoalDepositDTO) => {
    return apiRequest(`/goals/${id}/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  getHistory: async (id: string) => {
    return apiRequest(`/goals/${id}/history`, { method: "GET" });
  },

  update: async (
    id: string,
    data: { title?: string; targetValue?: number; deadline?: string },
  ) => {
    return apiRequest(`/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string, targetAccountId?: string): Promise<void> => {
    const url = targetAccountId
      ? `/goals/${id}?targetAccountId=${targetAccountId}`
      : `/goals/${id}`;
    await apiRequest(url, { method: "DELETE" });
  },

  deleteHistory: async (
    historyId: string,
    targetAccountId?: string,
  ): Promise<void> => {
    const url = targetAccountId
      ? `/goals/history/${historyId}?targetAccountId=${targetAccountId}`
      : `/goals/history/${historyId}`;
    await apiRequest(url, { method: "DELETE" });
  },

  addItem: async (goalId: string, data: CreateGoalItemDTO) => {
    return apiRequest(`/goals/${goalId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  purchaseItem: async (itemId: string, data: PurchaseGoalItemDTO) => {
    return apiRequest(`/goals/items/${itemId}/purchase`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  deleteItem: async (itemId: string, targetAccountId?: string) => {
    const query = targetAccountId ? `?targetAccountId=${targetAccountId}` : "";
    return apiRequest(`/goals/items/${itemId}${query}`, { method: "DELETE" });
  },

  reorderItems: async (goalId: string, orderedIds: string[]) => {
    return apiRequest(`/goals/${goalId}/items/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderedIds),
    });
  },
};
