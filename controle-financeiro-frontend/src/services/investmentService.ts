import { apiRequest } from "./api";
import {
  CreateInvestmentDTO,
  InvestmentOperationDTO,
  UpdateBalanceDTO,
  Investment,
  InvestTransaction,
} from "@/types";

export const investmentService = {
  getAll: async (signal?: AbortSignal) => {
    return apiRequest<Investment[]>("/investments", { method: "GET", signal });
  },

  create: async (data: CreateInvestmentDTO) => {
    return apiRequest<Investment>("/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  operation: async (data: InvestmentOperationDTO) => {
    return apiRequest("/investments/operation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  updateBalance: async (data: UpdateBalanceDTO) => {
    return apiRequest("/investments/update-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  getHistory: async (id: string, signal?: AbortSignal) => {
    return apiRequest<InvestTransaction[]>(`/investments/${id}/history`, {
      method: "GET",
      signal,
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/investments/${id}`, { method: "DELETE" });
  },
  
  deleteHistory: async (transactionId: string) => {
    return apiRequest(`/investments/operation/${transactionId}`, {
      method: "DELETE",
    });
  },
};
