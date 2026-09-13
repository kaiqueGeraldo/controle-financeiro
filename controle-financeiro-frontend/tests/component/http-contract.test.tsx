import { beforeEach, describe, expect, test, vi } from "vitest";

import { ApiError, apiRequest } from "@/services/api";
import { transactionService } from "@/services/transactionService";

const problem = (status: number, message: string, fields = {}) =>
  new Response(
    JSON.stringify({
      timestamp: "2026-09-08T12:00:00Z",
      status,
      error: "Erro de contrato",
      message,
      path: "/transactions",
      fields,
    }),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );

describe("contrato HTTP do cliente [AC-UI-004/005/006/007]", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("R04: 401 tardio de leitura cancelada não expira a sessão atual", async () => {
    const client = new AbortController();
    const expired = vi.fn();
    window.addEventListener("sessionExpired", expired);
    let respond!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { respond = resolve; })));
    try {
      const pending = apiRequest("/accounts", { method: "GET", signal: client.signal });
      const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
      client.abort(new DOMException("logout anterior", "AbortError"));
      respond(problem(401, "Token anterior expirou"));
      await rejected;
      expect(expired).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("sessionExpired", expired);
    }
  });

  test("401 privado solicita autenticação; 403 preserva a sessão e informa proibição", async () => {
    const expired = vi.fn();
    window.addEventListener("sessionExpired", expired);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(problem(401, "Autenticação necessária.")));
    await expect(apiRequest("/accounts", { method: "GET" })).rejects.toMatchObject({
      status: 401,
      kind: "authentication",
    });
    expect(expired).toHaveBeenCalledTimes(1);

    vi.mocked(fetch)
      .mockResolvedValueOnce(problem(403, "Operação não permitida."))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: "conta-autorizada" }]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    await expect(apiRequest("/accounts/other-user", { method: "GET" })).rejects.toMatchObject({
      status: 403,
      kind: "authorization",
      message: "Operação não permitida.",
    });
    expect(expired).toHaveBeenCalledTimes(1);

    await expect(apiRequest("/accounts", { method: "GET" })).resolves.toMatchObject({
      status: 200,
      data: [{ id: "conta-autorizada" }],
    });
    expect(expired).toHaveBeenCalledTimes(1);

    window.removeEventListener("sessionExpired", expired);
  });

  test("400 conserva erros por campo e 409 sinaliza reconciliação", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          problem(400, "A requisição possui campos inválidos.", {
            date: ["Data civil inválida. Use YYYY-MM-DD."],
          }),
        )
        .mockResolvedValueOnce(problem(409, "Atualize os dados e tente novamente.")),
    );

    await expect(apiRequest("/transactions", { method: "POST" })).rejects.toMatchObject({
      status: 400,
      kind: "validation",
      fields: { date: ["Data civil inválida. Use YYYY-MM-DD."] },
    });
    await expect(apiRequest("/transactions/id", { method: "PUT" })).rejects.toMatchObject({
      status: 409,
      kind: "conflict",
      retryable: true,
      requiresReconciliation: true,
    });
  });

  test("204 não tenta desserializar corpo ausente", async () => {
    const response = new Response(null, { status: 204 });
    const json = vi.spyOn(response, "json");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(apiRequest("/goals/id", { method: "DELETE" })).resolves.toEqual({
      status: 204,
      data: null,
    });
    expect(json).not.toHaveBeenCalled();
  });

  test("download com erro JSON não entrega blob e sucesso preserva bytes e tipo", async () => {
    const errorResponse = problem(500, "Falha ao exportar.");
    const errorBlob = vi.spyOn(errorResponse, "blob");
    const bytes = Uint8Array.from([0x50, 0x4b, 0x03, 0x04]);
    const successResponse = new Response(bytes, {
      status: 200,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(errorResponse).mockResolvedValueOnce(successResponse),
    );

    await expect(transactionService.exportExcel()).rejects.toMatchObject({
      status: 500,
      message: "Falha ao exportar.",
    });
    expect(errorBlob).not.toHaveBeenCalled();

    const result = await transactionService.exportExcel();
    expect(result.data).toBeInstanceOf(Blob);
    expect(result.data.type).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    const downloaded = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(result.data);
    });
    expect(Array.from(new Uint8Array(downloaded))).toEqual(Array.from(bytes));
  });

  test("AbortError permanece cancelamento e indisponibilidade não vira falso 500", async () => {
    const abort = new DOMException("seleção alterada", "AbortError");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(abort).mockRejectedValueOnce(new TypeError("fetch failed")),
    );

    await expect(apiRequest("/annual-summary?year=2025", { method: "GET" })).rejects.toBe(
      abort,
    );
    await expect(apiRequest("/planning", { method: "POST" })).rejects.toMatchObject({
      status: 0,
      kind: "network",
      retryable: true,
      requiresReconciliation: true,
    });
  });

  test("503 preserva falha recuperável e paginação usa nomes do contrato", async () => {
    const page = {
      content: [{ id: "tx-1", date: "2026-09-07", time: null, timeOrigin: "UNKNOWN", recordedAt: null, legacyCreatedAtRaw: null }],
      page: { size: 30, number: 0, totalElements: 1, totalPages: 1 },
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(problem(503, "Serviço temporariamente indisponível."))
        .mockResolvedValueOnce(
          new Response(JSON.stringify(page), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ),
    );

    await expect(apiRequest("/planning", { method: "GET" })).rejects.toMatchObject({
      status: 503,
      kind: "unavailable",
      retryable: true,
      requiresReconciliation: false,
    });

    const result = await transactionService.getAll({ page: 0, size: 30, month: 9, year: 2026 });
    expect(result.data).toEqual(page);
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/transactions?page=0&size=30&month=9&year=2026",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  test("payload JSON inesperado em download é rejeitado mesmo com HTTP 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "não é planilha" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(transactionService.exportExcel()).rejects.toMatchObject({
      name: ApiError.name,
      status: 502,
      kind: "invalid_response",
    });
  });

  test("JSON malformado em sucesso é falha de contrato, não dado vazio", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response('{"content":', {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(transactionService.getAll()).rejects.toMatchObject({
      status: 502,
      kind: "invalid_response",
    });
  });

  test.each([500, 501, 502, 503, 504])("R05: escrita com HTTP %s exige reconciliação", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(problem(status, "Falha sintética")));
    await expect(apiRequest("/transactions", { method: "POST" })).rejects.toMatchObject({
      status, requiresReconciliation: true,
    });
  });

  test("R05: JSON inválido após escrita não prova que a operação foi desfeita", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"id":', { status: 200 })));
    await expect(apiRequest("/transactions", { method: "POST" })).rejects.toMatchObject({
      kind: "invalid_response", requiresReconciliation: true,
    });
  });

  test("R05: HTML com HTTP 200 não pode ser salvo como XLSX", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Falha</html>", {
      status: 200, headers: { "content-type": "text/html" },
    })));
    await expect(transactionService.exportExcel()).rejects.toMatchObject({
      kind: "invalid_response", status: 502,
    });
  });
});
