import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { EditProfileModal } from "@/components/forms/editProfileModal";
let user = { id: "cf015-A", nome: "Pessoa original", email: "cf015@example.invalid" };
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user, refetchUser: vi.fn() }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ handleLogout: vi.fn() }) }));

test("CF015-R07: releitura do mesmo usuário preserva nome que está sendo editado", () => {
  const { rerender } = render(<EditProfileModal isOpen onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Meu rascunho" } });
  expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Meu rascunho");
  user = { ...user };
  rerender(<EditProfileModal isOpen onClose={vi.fn()} />);
  expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Meu rascunho");
});
