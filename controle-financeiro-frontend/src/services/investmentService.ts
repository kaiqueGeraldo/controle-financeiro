import { apiRequest } from "./api";
import {
  CreateInvestmentDTO,
  InvestmentOperationDTO,
  UpdateBalanceDTO,
} from "@/types";

export const investmentService = {
  getAll: async () => {
    return apiRequest("/investments", { method: "GET" });
  },

  create: async (data: CreateInvestmentDTO) => {
    return apiRequest("/investments", {
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

  getHistory: async (id: string) => {
    return apiRequest(`/investments/${id}/history`, { method: "GET" });
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
