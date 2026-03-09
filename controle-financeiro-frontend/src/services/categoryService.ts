import { apiRequest } from "./api";
import { Category, CreateCategoryDTO, TransactionType } from "@/types";

export const categoryService = {
  getAll: async (type?: TransactionType, signal?: AbortSignal) => {
    const query = type ? `?type=${type}` : "";
    return apiRequest(`/categories${query}`, {
      method: "GET",
      signal,
    });
  },
  create: async (data: CreateCategoryDTO) => {
    return apiRequest("/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: Partial<CreateCategoryDTO>) => {
    return apiRequest(`/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string) => {
    return apiRequest(`/categories/${id}`, { method: "DELETE" });
  },
};
