const URL_BASE = "/api";

type ApiRequestOptions = RequestInit & { isBlob?: boolean };

export class ApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

export async function apiRequest(endpoint: string, options: ApiRequestOptions) {
  const { isBlob, ...fetchOptions } = options;

  const finalOptions: RequestInit = {
    ...fetchOptions,
    cache: "no-store",
  };

  try {
    const response = await fetch(`${URL_BASE}${endpoint}`, finalOptions);

    let data;

    if (isBlob) {
      data = await response.blob();
    } else {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        const isAuthRoute =
          endpoint.includes("/auth/login") ||
          endpoint.includes("/auth/register") ||
          endpoint.includes("/auth/user") ||
          endpoint.includes("/auth/logout");
        if (!isAuthRoute) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("sessionExpired"));
          }
          throw new ApiError(
            "Sessão expirada. Faça login novamente.",
            response.status,
          );
        } else {
          const errorMessage =
            data?.message || data?.error || "Credenciais inválidas.";
          throw new ApiError(errorMessage, response.status);
        }
      }

      const errorMessage =
        data?.message ||
        data?.error ||
        `Erro ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status);
    }

    return { status: response.status, data };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("Erro ao conectar à API. Verifique sua conexão.", 500);
  }
}
