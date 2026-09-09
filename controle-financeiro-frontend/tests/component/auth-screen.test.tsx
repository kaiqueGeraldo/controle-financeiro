import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import AuthScreen from "@/screens/public/auth/authScreen";
import { login, register } from "@/services/authService";

const routerPush = vi.fn();
const seed = process.env.CF_TEST_SEED ?? "cf001-v1";
const timezone = process.env.CF_TEST_TIMEZONE ?? "America/Sao_Paulo";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  useSearchParams: () => new URLSearchParams("modo=cadastro"),
}));

vi.mock("@/actions/authActions", () => ({
  removeAuthCookie: vi.fn(),
  setAuthCookie: vi.fn(),
}));

vi.mock("@/contexts/modals/authModalContext", () => ({
  useAuthModals: () => ({ closeSessionExpired: vi.fn() }),
}));

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({
    clearUser: vi.fn(),
    refetchUser: vi.fn(),
  }),
}));

vi.mock("@/services/authService", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  redefinirSenha: vi.fn(),
  register: vi.fn(),
  solicitarToken: vi.fn(),
}));

describe(
  `AuthScreen [timezone=${timezone} viewport=jsdom seed=${seed}]`,
  () => {
    beforeEach(() => {
      routerPush.mockClear();
    });

    test("bloqueia cadastro vazio, identifica cada campo e não chama a API", async () => {
      const user = userEvent.setup();
      const { container } = render(<AuthScreen />);

      await screen.findByRole("heading", { name: "Crie sua conta" });
      fireEvent.submit(container.querySelector("form")!);

      await waitFor(() => {
        expect(screen.getByText("O nome é obrigatório.")).toBeDefined();
        expect(screen.getByText("O e-mail é obrigatório.")).toBeDefined();
        expect(screen.getByText("A senha é obrigatória.")).toBeDefined();
        expect(screen.getByText("Confirme a senha.")).toBeDefined();
      });

      expect(register).not.toHaveBeenCalled();
      expect(login).not.toHaveBeenCalled();
      expect(routerPush).not.toHaveBeenCalled();

      await user.type(
        screen.getByPlaceholderText("Seu nome"),
        "Pessoa Sintética",
      );
      expect(screen.queryByText("O nome é obrigatório.")).toBeNull();
    });
  },
);
