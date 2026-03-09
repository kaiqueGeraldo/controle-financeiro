export function validarEmail(email: string) {
  if (!email) return "O e-mail é obrigatório.";
  if (!email.includes("@") || email.length < 5)
    return "Digite um e-mail válido.";
  return "";
}

export function validarSenha(
  senha: string,
  confirmarSenha: string,
  prefixo: "senha" | "novaSenha" = "senha"
) {
  const errors: { [key: string]: string } = {};

  const senhaLabel = prefixo;
  const confirmarLabel =
    prefixo === "senha" ? "confirmarSenha" : "confirmarNovaSenha";

  if (!senha) {
    errors[senhaLabel] = "A senha é obrigatória.";
  } else {
    if (senha.length < 8) {
      errors[senhaLabel] = "A senha deve ter no mínimo 8 caracteres.";
    }
    if (!/[A-Z]/.test(senha)) {
      errors[senhaLabel] =
        "A senha deve conter pelo menos uma letra maiúscula.";
    }
    if (!/[a-z]/.test(senha)) {
      errors[senhaLabel] =
        "A senha deve conter pelo menos uma letra minúscula.";
    }
    if (!/[0-9]/.test(senha)) {
      errors[senhaLabel] = "A senha deve conter pelo menos um número.";
    }
  }

  if (!confirmarSenha) {
    errors[confirmarLabel] = "Confirme a senha.";
  }

  if (senha && confirmarSenha && senha !== confirmarSenha) {
    errors[senhaLabel] = "As senhas não coincidem.";
    errors[confirmarLabel] = "As senhas não coincidem.";
  }

  return errors;
}

export function validarNome(nome: string) {
  if (!nome || nome.trim() === "") return "O nome é obrigatório.";
  if (nome.trim().length < 2) return "O nome deve ter pelo menos 2 caracteres.";
  return "";
}

export function validarToken(token: string) {
  if (!token) return "O token é obrigatório.";
  return "";
}
