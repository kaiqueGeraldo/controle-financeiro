import { parseInvestmentResultJson } from "./investmentResultJson";
import { parse as parseStrictJson } from "./vendor/lossless-json/parse";

const URL_BASE = "/api";

export type ApiErrorKind =
  | "authentication"
  | "authorization"
  | "validation"
  | "conflict"
  | "unavailable"
  | "network"
  | "invalid_response"
  | "http";

export type ApiProblem = {
  code?: string;
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fields?: Record<string, string[]>;
};

type ApiRequestOptions = RequestInit & { isBlob?: boolean; expectedContentType?: string; investmentSnapshot?: boolean; onboardingJson?: boolean };

export type ApiResponse<T> = {
  status: number;
  data: T;
};

type ApiErrorOptions = {
  code?: string;
  kind?: ApiErrorKind;
  fields?: Record<string, string[]>;
  retryable?: boolean;
  requiresReconciliation?: boolean;
};

export class ApiError extends Error {
  public readonly code?: string;
  public readonly status: number;
  public readonly kind: ApiErrorKind;
  public readonly fields: Record<string, string[]>;
  public readonly retryable: boolean;
  public readonly requiresReconciliation: boolean;

  constructor(message: string, status: number, options: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = status;
    this.kind = options.kind ?? "http";
    this.fields = options.fields ?? {};
    this.retryable = options.retryable ?? false;
    this.requiresReconciliation = options.requiresReconciliation ?? false;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asProblem(value: unknown): ApiProblem {
  if (!isRecord(value)) return {};

  // Onboarding v1 has an isolated error envelope; preserve JSON Pointer fields.
  if (Object.hasOwn(value, "error") && isRecord(value.error) && !Array.isArray(value.error) &&
      Object.hasOwn(value.error, "code") && typeof value.error.code === "string" &&
      Object.hasOwn(value.error, "fieldErrors") && Array.isArray(value.error.fieldErrors)) {
    const fields: Record<string, string[]> = {};
    for (const issue of value.error.fieldErrors) {
      if (isRecord(issue) && Object.hasOwn(issue, "path") && typeof issue.path === "string" &&
          Object.hasOwn(issue, "message") && typeof issue.message === "string") {
        fields[issue.path] = [...(fields[issue.path] ?? []), issue.message];
      }
    }
    return { code: value.error.code, message: typeof value.error.message === "string" ? value.error.message : undefined, fields };
  }

  const fields = isRecord(value.fields)
    ? Object.fromEntries(
        Object.entries(value.fields).flatMap(([field, messages]) => {
          if (!Array.isArray(messages)) return [];
          return [
            [
              field,
              messages.filter(
                (message): message is string => typeof message === "string",
              ),
            ],
          ];
        }),
      )
    : undefined;

  return {
    timestamp: typeof value.timestamp === "string" ? value.timestamp : undefined,
    status: typeof value.status === "number" ? value.status : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
    message: typeof value.message === "string" ? value.message : undefined,
    path: typeof value.path === "string" ? value.path : undefined,
    fields,
  };
}

async function readJsonLikeBody(
  response: Response,
  strictJson = false,
  unsafeRequest = false,
  investmentSnapshot = false,
  onboardingJson = false,
): Promise<unknown> {
  const body = await response.text();
  if (!body) return null;

  try {
    return onboardingJson ? parseStrictJson(body, undefined, { parseNumber: raw => Number(raw) })
      : investmentSnapshot ? parseInvestmentResultJson(body) : JSON.parse(body) as unknown;
  } catch {
    if (strictJson) {
      throw new ApiError("A API retornou JSON inválido.", 502, {
        kind: "invalid_response",
        retryable: true,
        requiresReconciliation: unsafeRequest,
      });
    }
    return { message: body };
  }
}

function errorKind(status: number): ApiErrorKind {
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 400 || status === 422) return "validation";
  if (status === 409) return "conflict";
  if (status === 502 || status === 503 || status === 504) return "unavailable";
  return "http";
}

function isUnsafeMethod(method?: string): boolean {
  const normalized = (method ?? "GET").toUpperCase();
  return normalized !== "GET" && normalized !== "HEAD" && normalized !== "OPTIONS";
}

function isPublicAuthenticationRequest(endpoint: string): boolean {
  const path = endpoint.split("?", 1)[0];
  return [
    "/auth/login",
    "/auth/register",
    "/auth/recover-password",
    "/auth/reset-password",
  ].includes(path);
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === "AbortError";
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions,
): Promise<ApiResponse<T>> {
  const { isBlob, expectedContentType, investmentSnapshot, onboardingJson, ...fetchOptions } = options;
  const unsafeRequest = isUnsafeMethod(fetchOptions.method);

  try {
    const response = await fetch(`${URL_BASE}${endpoint}`, {
      ...fetchOptions,
      cache: "no-store",
    });
    fetchOptions.signal?.throwIfAborted();

    if (response.status === 204) {
      return { status: 204, data: null as T };
    }

    if (!response.ok) {
      const problem = asProblem(await readJsonLikeBody(response, false, unsafeRequest, false, onboardingJson));
      fetchOptions.signal?.throwIfAborted();
      const kind = errorKind(response.status);

      if (
        response.status === 401 &&
        !isPublicAuthenticationRequest(endpoint) &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(new Event("sessionExpired"));
      }

      const defaultMessage =
        response.status === 401
          ? isPublicAuthenticationRequest(endpoint)
            ? "Credenciais inválidas."
            : "Sessão expirada. Faça login novamente."
          : response.status === 403
            ? "Você não tem permissão para realizar esta operação."
            : `Erro ${response.status}: ${response.statusText}`;

      throw new ApiError(problem.message ?? problem.error ?? defaultMessage, response.status, {
        code: problem.code,
        kind,
        fields: problem.fields,
        retryable: kind === "conflict" || kind === "unavailable",
        requiresReconciliation:
          kind === "conflict" || (response.status >= 500 && unsafeRequest),
      });
    }

    if (isBlob) {
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (contentType.includes("json")) {
        const problem = asProblem(await readJsonLikeBody(response));
        throw new ApiError(
          problem.message ?? "A API retornou JSON onde um arquivo binário era esperado.",
          502,
          { kind: "invalid_response", retryable: true },
        );
      }

      if (expectedContentType && contentType.split(";", 1)[0].trim() !== expectedContentType) {
        throw new ApiError("A API retornou um tipo de arquivo inesperado.", 502, {
          kind: "invalid_response", retryable: true, requiresReconciliation: unsafeRequest,
        });
      }

      return { status: response.status, data: (await response.blob()) as T };
    }

    return {
      status: response.status,
      data: (await readJsonLikeBody(response, true, unsafeRequest, investmentSnapshot, onboardingJson)) as T,
    };
  } catch (error: unknown) {
    if (isAbortError(error)) throw error;
    if (error instanceof ApiError) throw error;

    throw new ApiError("Não foi possível conectar à API. Tente novamente.", 0, {
      kind: "network",
      retryable: true,
      requiresReconciliation: unsafeRequest,
    });
  }
}
