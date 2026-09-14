import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ConfiguracoesScreen from "@/screens/private/configuracoes/configuracoesScreen";
import AuthScreen from "@/screens/public/auth/authScreen";
import { useAuth } from "@/hooks/useAuth";
import { login, logout, redefinirSenha, solicitarToken } from "@/services/authService";
import { transactionService } from "@/services/transactionService";
import { userService } from "@/services/userService";

const routerPush = vi.fn();
const clearUser = vi.fn();
const refetchUser = vi.fn().mockResolvedValue(undefined);
const initialUserFixture = {
  id: "cf011-user",
  nome: "Pessoa Sintética",
  email: "pessoa@example.invalid",
  privacyMode: false,
  darkMode: false,
  notifContas: true,
  notifSemanal: true,
};
let currentUser = initialUserFixture;

let mode = "login";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  useSearchParams: () => new URLSearchParams(`modo=${mode}`),
}));

vi.mock("@/actions/authActions", () => ({
  removeAuthCookie: vi.fn(),
  setAuthCookie: vi.fn(),
}));

vi.mock("@/contexts/modals/authModalContext", () => ({
  useAuthModals: () => ({ closeSessionExpired: vi.fn(), openLogout: vi.fn() }),
}));

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: currentUser, clearUser, refetchUser }),
}));

vi.mock("@/hooks/useSidebar", () => ({ useSidebar: () => ({ scrolled: false }) }));

vi.mock("@/services/authService", () => ({
  login: vi.fn(), logout: vi.fn(), register: vi.fn(), redefinirSenha: vi.fn(), solicitarToken: vi.fn(),
}));

vi.mock("@/services/userService", () => ({
  userService: { updatePreferences: vi.fn(), deleteAccount: vi.fn() },
}));

vi.mock("@/services/transactionService", () => ({
  transactionService: { exportExcel: vi.fn() },
}));

vi.mock("@/components/forms/changePasswordModal", () => ({ ChangePasswordModal: () => null }));
vi.mock("@/components/forms/configDashboardModal", () => ({ ConfigDashboardModal: () => null }));
vi.mock("@/components/forms/editProfileModal", () => ({ EditProfileModal: () => null }));
vi.mock("@/components/forms/manageCategoriesModal", () => ({ ManageCategoriesModal: () => null }));
vi.mock("@/components/modals/confirmModal", () => ({ ConfirmationModal: () => null }));

describe("CF-011: autenticação e configurações acessíveis", () => {
  beforeEach(() => {
    mode = "login";
    currentUser = initialUserFixture;
    vi.clearAllMocks();
    refetchUser.mockResolvedValue(undefined);
    vi.mocked(userService.updatePreferences).mockImplementation(async (preferences) => {
      currentUser = { ...currentUser, ...preferences };
      return { status: 200, data: currentUser };
    });
  });

  test("login vazio identifica a senha e não envia credenciais incompletas", async () => {
    const user = userEvent.setup();
    const { container } = render(<AuthScreen />);

    await user.type(screen.getByLabelText("E-mail"), "pessoa@example.invalid");
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(screen.getByText("A senha é obrigatória.")).toBeDefined());
    expect(login).not.toHaveBeenCalled();
  });

  test("recuperação usa provedor falso e mantém erro remoto distinguível da entrada inválida", async () => {
    const user = userEvent.setup();
    vi.mocked(solicitarToken).mockResolvedValueOnce({ status: 204, data: undefined });
    vi.mocked(redefinirSenha).mockRejectedValueOnce(new Error("Código sintético expirado"));
    render(<AuthScreen />);

    await user.click(screen.getByRole("button", { name: "Esqueceu a senha?" }));
    await user.type(await screen.findByLabelText("E-mail Cadastrado"), "pessoa@example.invalid");
    await user.click(screen.getByRole("button", { name: "Receber Código" }));

    expect(solicitarToken).toHaveBeenCalledWith("pessoa@example.invalid");
    await user.type(await screen.findByLabelText("Código de 6 dígitos"), "ABC123");
    await user.type(screen.getByLabelText("Criar Nova Senha"), "Senha123");
    await user.click(screen.getByRole("button", { name: "Redefinir Senha" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Código sintético expirado"));
  });

  test("logout limpa a sessão local mesmo quando o provedor remoto falha", async () => {
    const onClose = vi.fn();
    vi.mocked(logout).mockRejectedValueOnce(new Error("Provedor sintético indisponível"));
    const { result } = renderHook(() => useAuth());

    await act(async () => result.current.handleLogout(onClose));

    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith("/auth");
  });

  test("switches têm nome acessível, funcionam por teclado e falha não inventa preferência salva", async () => {
    const user = userEvent.setup();
    vi.mocked(userService.updatePreferences).mockRejectedValueOnce(new Error("Falha sintética de gravação"));
    render(<ConfiguracoesScreen />);

    const privacySwitch = screen.getByRole("switch", { name: "Modo Privacidade" });
    expect(privacySwitch.getAttribute("aria-checked")).toBe("false");
    privacySwitch.focus();
    await user.keyboard(" ");

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Erro ao alterar preferência"));
    expect(privacySwitch.getAttribute("aria-checked")).toBe("false");
    expect(userService.updatePreferences).toHaveBeenCalledWith({ privacyMode: true });
  });

  test("preferência confirmada reaparece depois de recarregar os dados do usuário", async () => {
    const user = userEvent.setup();
    const rendered = render(<ConfiguracoesScreen />);

    await user.click(screen.getByRole("switch", { name: "Modo Privacidade" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Preferência atualizada"));
    expect(refetchUser).toHaveBeenCalledTimes(1);

    rendered.rerender(<ConfiguracoesScreen />);
    expect(screen.getByRole("switch", { name: "Modo Privacidade" }).getAttribute("aria-checked")).toBe("true");
  });

  test("ações de configuração podem ser acionadas por teclado e exportação falha sem criar download", async () => {
    const user = userEvent.setup();
    const createObjectUrl = vi.fn();
    vi.stubGlobal("URL", { ...window.URL, createObjectURL: createObjectUrl, revokeObjectURL: vi.fn() });
    vi.mocked(transactionService.exportExcel).mockRejectedValueOnce(new Error("Download indisponível"));
    render(<ConfiguracoesScreen />);

    const dashboard = screen.getByRole("button", { name: /Configurar Dashboard/i });
    dashboard.focus();
    await user.keyboard("Enter");
    await user.click(screen.getByRole("button", { name: /Exportar Dados/i }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Erro ao exportar a planilha"));
    expect(createObjectUrl).not.toHaveBeenCalled();
  });
});
