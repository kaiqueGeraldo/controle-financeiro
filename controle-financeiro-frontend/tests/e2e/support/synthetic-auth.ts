import { expect, type Page } from "@playwright/test";

export type SyntheticUser = {
  alias: "A" | "B";
  email: string;
  name: string;
  password: string;
};

export function syntheticUser(
  alias: SyntheticUser["alias"],
  namespace: string,
): SyntheticUser {
  const normalizedNamespace = namespace
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");

  return {
    alias,
    email: `cf003-${alias.toLowerCase()}-${normalizedNamespace}@example.invalid`,
    name: `Pessoa Sintética ${alias}`,
    password: `Cf003-${alias}-Senha-2026`,
  };
}

export async function registerSyntheticUser(
  page: Page,
  user: SyntheticUser,
): Promise<void> {
  await page.goto("/auth?modo=cadastro");
  await page.locator('input[name="nome"]').fill(user.name);
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="senha"]').fill(user.password);
  await page.locator('input[name="confirmarSenha"]').fill(user.password);
  await page.getByRole("button", { name: "Criar Conta" }).click();
  await expect(page).toHaveURL(/\/$/);
}
