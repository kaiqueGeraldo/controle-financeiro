import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { UserProvider, useUserContext } from "@/contexts/userContext";

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => toast }));
const a = { id: "owner-a", nome: "A", email: "a@example.invalid" };
const json = (value: unknown) => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });

test("CF023: expiração limpa perfil e invalida resposta pendente sem ressuscitar A", async () => {
  let finish!: (value: Response) => void;
  const pending = new Promise<Response>((resolve) => { finish = resolve; });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json(a)).mockReturnValueOnce(pending));
  const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });
  await waitFor(() => expect(result.current.user?.id).toBe("owner-a"));
  let reading!: Promise<void>;
  act(() => { reading = result.current.refetchUser(); });
  act(() => { window.dispatchEvent(new Event("sessionExpired")); });
  expect(result.current.user).toBeNull();
  await act(async () => { finish(json(a)); await reading; });
  expect(result.current.user).toBeNull();
  expect(result.current.isLoading).toBe(false);
});

test("CF023: outra aba invalida A, depois relê B com a credencial atual", async () => {
  const b = { id: "owner-b", nome: "B", email: "b@example.invalid" };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json(a)).mockResolvedValueOnce(json(b)));
  const remote = new BroadcastChannel("cf-auth-session");
  try {
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });
    await waitFor(() => expect(result.current.user?.id).toBe("owner-a"));
    remote.postMessage("logout");
    await waitFor(() => expect(result.current.user).toBeNull());
    remote.postMessage("login");
    await waitFor(() => expect(result.current.user?.id).toBe("owner-b"));
    expect(toast.error).not.toHaveBeenCalled();
  } finally { remote.close(); }
});
