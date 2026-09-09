import { apiRequest } from "./api";
import {
  CreateGoalDTO,
  CreateGoalItemDTO,
  GoalDepositDTO,
  Goal,
  GoalHistory,
  GoalItem,
  PurchaseGoalItemDTO,
} from "@/types";

export const goalService = {
  getAll: async (signal?: AbortSignal) => {
    return apiRequest<Goal[]>("/goals", { method: "GET", signal });
  },

  create: async (data: CreateGoalDTO) => {
    return apiRequest<Goal>("/goals", {
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

  getHistory: async (id: string, signal?: AbortSignal) => {
    return apiRequest<GoalHistory[]>(`/goals/${id}/history`, {
      method: "GET",
      signal,
    });
  },

  update: async (
    id: string,
    data: { title?: string; targetValue?: number; deadline?: string },
  ) => {
    return apiRequest<Goal>(`/goals/${id}`, {
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
    return apiRequest<GoalItem>(`/goals/${goalId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  purchaseItem: async (itemId: string, data: PurchaseGoalItemDTO) => {
    return apiRequest<GoalItem>(`/goals/items/${itemId}/purchase`, {
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
