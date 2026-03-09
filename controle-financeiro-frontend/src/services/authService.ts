import { apiRequest } from "./api";

export async function getUserFromToken() {
  return apiRequest("/auth/user", { method: "GET" });
}

export async function login(email: string, senha: string) {
  return apiRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
}

export async function register(nome: string, email: string, senha: string) {
  return apiRequest("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });
}

export async function logout() {
  return apiRequest("/auth/logout", { method: "POST" });
}

export async function solicitarToken(email: string) {
  return apiRequest("/auth/recover-password", { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function redefinirSenha(email: string, token: string, novaSenha: string) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, novaSenha }),
  });
}