# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf15-accessibility.integrated.spec.ts >> RF15-01: criação mobile por nome e teclado
- Location: tests\e2e\rf15-accessibility.integrated.spec.ts:4:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/$/
Received string:  "http://127.0.0.1:3107/auth?modo=cadastro"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    30 × locator resolved to <html lang="pt-br" class="dark">…</html>
       - unexpected value "http://127.0.0.1:3107/auth?modo=cadastro"

```

```yaml
- text: K
- heading "Crie sua conta" [level=1]
- paragraph: Comece a controlar suas finanças hoje
- text: Nome Completo
- textbox "Nome Completo":
  - /placeholder: Seu nome
  - text: Pessoa Sintética A
- text: E-mail
- textbox "E-mail":
  - /placeholder: seu@email.com
  - text: cf003-a-closure-73a86e13-mobile@example.invalid
- text: Senha
- textbox "Senha":
  - /placeholder: ••••••••
  - text: Cf003-A-Senha-2026
- button "Mostrar senha"
- text: Confirmar Senha
- textbox "Confirmar Senha":
  - /placeholder: ••••••••
  - text: Cf003-A-Senha-2026
- button "Mostrar confirmação de senha"
- button "Criar Conta"
- paragraph:
  - text: Já possui cadastro?
  - button "Faça Login"
- alert
```

# Test source

```ts
  1  | import { expect, type Page } from "@playwright/test";
  2  | 
  3  | export type SyntheticUser = {
  4  |   alias: "A" | "B";
  5  |   email: string;
  6  |   name: string;
  7  |   password: string;
  8  | };
  9  | 
  10 | export function syntheticUser(
  11 |   alias: SyntheticUser["alias"],
  12 |   namespace: string,
  13 | ): SyntheticUser {
  14 |   const normalizedNamespace = namespace
  15 |     .toLowerCase()
  16 |     .replace(/[^a-z0-9-]/g, "-");
  17 | 
  18 |   return {
  19 |     alias,
  20 |     email: `cf003-${alias.toLowerCase()}-${normalizedNamespace}@example.invalid`,
  21 |     name: `Pessoa Sintética ${alias}`,
  22 |     password: `Cf003-${alias}-Senha-2026`,
  23 |   };
  24 | }
  25 | 
  26 | export async function registerSyntheticUser(
  27 |   page: Page,
  28 |   user: SyntheticUser,
  29 | ): Promise<void> {
  30 |   await page.goto("/auth?modo=cadastro");
  31 |   await page.locator('input[name="nome"]').fill(user.name);
  32 |   await page.locator('input[name="email"]').fill(user.email);
  33 |   await page.locator('input[name="senha"]').fill(user.password);
  34 |   await page.locator('input[name="confirmarSenha"]').fill(user.password);
  35 |   await page.getByRole("button", { name: "Criar Conta" }).click();
> 36 |   await expect(page).toHaveURL(/\/$/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  37 | }
  38 | 
```