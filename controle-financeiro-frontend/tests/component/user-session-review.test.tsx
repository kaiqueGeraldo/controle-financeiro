import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { UserProvider, useUserContext } from "@/contexts/userContext";

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => toast }));

const user = { id: "review-user-a", nome: "Pessoa sintética", email: "review@example.invalid" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" },
});

beforeEach(() => vi.clearAllMocks());

test.each([403, 500, 503])("R02: HTTP %s ao reler perfil preserva sessão e permite recuperação", async (status) => {
  const expired = vi.fn();
  window.addEventListener("sessionExpired", expired);
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(json(user))
    .mockResolvedValueOnce(json({ message: "Falha sintética recuperável" }, status))
    .mockResolvedValueOnce(json({ ...user, nome: "Perfil atualizado" })));
  try {
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });
    await waitFor(() => expect(result.current.user?.id).toBe(user.id));
    await act(() => result.current.refetchUser());
    expect(expired).not.toHaveBeenCalled();
    expect(result.current.user?.id).toBe(user.id);
    expect(result.current.isLoading).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Falha sintética recuperável");
    await act(() => result.current.refetchUser());
    expect(result.current.user?.nome).toBe("Perfil atualizado");
  } finally {
    window.removeEventListener("sessionExpired", expired);
  }
});

test("R02: somente 401 limpa o perfil e emite uma expiração", async () => {
  const expired = vi.fn();
  window.addEventListener("sessionExpired", expired);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json(user))
    .mockResolvedValueOnce(json({ message: "Autenticação necessária" }, 401)));
  try {
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });
    await waitFor(() => expect(result.current.user?.id).toBe(user.id));
    await act(() => result.current.refetchUser());
    expect(result.current.user).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
  } finally {
    window.removeEventListener("sessionExpired", expired);
  }
});
