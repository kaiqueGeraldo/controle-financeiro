# Evidência CF-011

- Estado real e data: concluída em 13/09/2026; revisão independente ainda é responsabilidade da CF-015.
- Modelo/esforço usados: GPT-5 / high.
- Commit/base e identificação do diff local testado: `main`, HEAD `1ced2f027fa46ab265b211829375581880cbb07b`, com o patch preexistente da CF-010 preservado e alterações locais desta tarefa não commitadas.
- Runtime, sistema, navegador, viewport, timezone e seed: Node 24.18.0, Windows, Chromium/Playwright; 360×800, 768×1024 e 1440×900; `America/Sao_Paulo`; seed `cf011-v1`; relógio `2026-09-13T15:00:00.000Z` para E2E.
- Dependências integradas: CF-008 e CF-010, conforme estado confirmado pelo solicitante e base local.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| Campos públicos impedem entrada incompleta e expõem erro corrigível | Login sem senha não deve chamar a API; rótulo, erro e campo devem estar associados | `vitest ... auth-settings-accessibility.test.tsx` | Aprovado; senha vazia mostra erro e não chama `login`. |
| Recuperação não envia e-mail real e mantém erro remoto distinguível | Provedor falso recebe o e-mail sintético; token inválido continua sendo feedback de API | mesmo teste | Aprovado; solicitação sintética e erro `Código sintético expirado`. |
| Preferência só aparece salva depois da confirmação e reaparece em reload | Sem atualização otimista; uma nova leitura de usuário define o switch | mesmo teste | Aprovado para sucesso e falha; falha preserva `aria-checked=false`. |
| Download inválido não parece um XLSX válido | Rejeição ou blob ausente/vazio não cria URL/download e produz alerta | mesmo teste e contrato HTTP CF-008 | Aprovado. |
| Formulários públicos permanecem utilizáveis no mobile | Conteúdo essencial é visível em 360×800, 768×1024 e 1440×900 | Playwright `auth.smoke.spec.ts` | 3/3 aprovados. |

## Falha anterior

O login validava somente e-mail: senha vazia seguia para a chamada remota. Os itens de configuração eram `div`s clicáveis e os switches não tinham nome acessível, portanto não eram controles de teclado identificáveis. A exportação não evitava solicitações concorrentes, aceitava ausência de blob sem feedback final e não revogava a URL temporária.

Não foi possível executar a nova regressão antes da correção com `npm`: o wrapper global aponta para um `npm-cli.js` ausente. A execução local posterior confirmou a regressão por mutação controlada: retirar a validação de senha fez o teste `login vazio identifica a senha` falhar por não encontrar a mensagem esperada. O código foi restaurado antes das validações finais.

## Correção e validação

- `node node_modules/typescript/bin/tsc --noEmit`: aprovado (0).
- `node_modules/.bin/vitest.cmd run --config tests/component/vitest.config.mts`: aprovado, 17 arquivos e 90 testes.
- Playwright direto sobre servidor local: `auth.smoke.spec.ts`, aprovado 3/3 nos três viewports.
- `git diff --check`: aprovado.
- `next build`: bloqueado fora do escopo por rede: `next/font` não conseguiu baixar Geist/Geist Mono de `fonts.googleapis.com`; não houve erro TypeScript ou de rota desta tarefa.

## Verificação adversarial

- Mutação temporária: remover a atribuição de `A senha é obrigatória.` em `useAuth`.
- Resultado: 1/3 testes da suíte CF-011 então existente falhou pela ausência exata da mensagem de senha; os demais passaram.
- Restauração: a condição foi restaurada e a suíte CF-011 final passou 6/6; a suíte completa final passou 90/90.

## Revisão e pendências

- Risco residual: não houve E2E autenticado contra backend/PostgreSQL descartável para perfil, logout e persistência real, pois o backend configurado para o harness é sentinela indisponível. Os contratos de 401/403, expiração e binário são cobertos pela CF-008 e testes de sessão existentes, mas CF-015 deve revisar o percurso integrado.
- Limitação de inspeção: `agent-browser` não está instalado no PATH; o Playwright local foi usado como fallback. As verificações visuais públicas não incluem zoom nativo de 200% nem tela privada autenticada.
- A execução efêmera de `pnpm` tentou reinstalar pacotes por rede; os diretórios locais deslocados foram restaurados, e `.pnpm-store`/`node_modules/.ignored` criados por ela foram removidos. Não houve alteração em dependências versionadas.
