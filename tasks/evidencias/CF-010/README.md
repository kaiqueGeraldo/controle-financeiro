# Evidência CF-010

- Estado real e data: concluída em 13/09/2026.
- Modelo/esforço usados: Codex (GPT-5), execução de implementação.
- Commit/base e identificação do diff local testado: `1ced2f027fa46ab265b211829375581880cbb07b` em `main`, com o patch local preexistente em `README.md` preservado e sem alteração por esta tarefa.
- Runtime, sistema, navegador, viewport, timezone e seed: Node 24.18.0, Windows, Chromium Playwright, 360×800 e viewport CSS efetivo 180×400 para simular zoom 200%, `America/Sao_Paulo`, seed `cf001-v1`.
- Dependências integradas: CF-003 concluída na base testada.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| Semântica, foco e fechamento do modal | Um diálogo nomeado precisa declarar `role=dialog`/`aria-modal`, receber foco, prender Tab, fechar com Escape e devolver foco ao gatilho. | `vitest ... common-components.test.tsx` | Aprovado: 2 cenários. |
| Formulário longo em tela estreita | O painel não pode exceder a viewport; o conteúdo é a área rolável e a confirmação deve poder ser trazida à tela. | Playwright `common-components.visual.spec.ts`, dashboard com token sintético e modal real. | Aprovado em 360×800 e 180×400 CSS; botão Salvar ficou dentro da viewport depois da rolagem do diálogo. |
| Tema claro/escuro e contraste | Superfícies e texto devem usar tokens de tema; erro deve manter associação semântica e contraste. | Capturas Chromium e cenário `InputField` com erro. | Aprovado; o input comum não usa mais fundo escuro fixo e o erro é anunciado. |
| Sidebar móvel por teclado | Abrir e fechar precisam ter controles nomeados; navegar por um link fecha a gaveta. | `sidebar-accessibility.test.tsx` e inspeção de implementação. | Aprovado. |

## Falha anterior

Antes da correção, o comando abaixo retornou código 1 com duas falhas causais: não havia elemento com papel `dialog` e o botão de fechar não tinha nome acessível. O DOM comprovou que o modal era somente duas `div`s, sem foco inicial, Escape ou retorno de foco.

```powershell
.\node_modules\.bin\vitest.cmd run --config tests/component/vitest.config.mts tests/component/common-components.test.tsx
```

O cenário de sidebar também falhava antes da mudança, pois o overlay era uma `div` clicável sem controle de teclado/nome acessível. O teste de erro exige `aria-invalid`, `aria-describedby` e `role=alert`; nenhum resultado esperado foi derivado dos componentes corrigidos.

## Correção e validação

- `Modal` recebeu papel e nome acessível, foco inicial no fechamento, retorno ao gatilho, Escape, trap de Tab e conteúdo interno rolável com altura limitada a `100dvh`.
- `InputField` passou a vincular erro ao campo e a usar tokens claro/escuro para superfície, borda e foco.
- Gatilho/overlay da sidebar têm nomes acessíveis; o menu declara seu destino e seus links fecham a gaveta ao navegar.
- Capturas inspecionadas no artefato local (não versionado): `controle-financeiro-frontend/tests/artifacts/playwright/common-components/.../modal-light-360.png`, `modal-dark-360.png` e `modal-dark-360-zoom-200.png`.

Comandos finais aprovados (todos código 0):

```powershell
.\node_modules\.bin\vitest.cmd run --config tests/component/vitest.config.mts
.\node_modules\.bin\tsc.cmd --noEmit
node scripts/test.mjs
node scripts/playwright.mjs test
$env:PLAYWRIGHT_BROWSERS_PATH='0'; $env:CF_TEST_TIMEZONE='America/Sao_Paulo'; node node_modules/@playwright/test/cli.js test --config=tests/e2e/playwright.common-components.config.ts
git diff --check
```

Resultados: 84 testes de componente, 18 testes unitários de calendário em três fusos, 6 smoke E2E em 360×800/768×1024/1440×900 e 1 E2E visual específico aprovados. Typecheck e `git diff --check` aprovaram.

## Verificação adversarial

- O teste que exige `role=dialog` e botão nomeado falhou antes da implementação e passou depois; ele também percorre `Shift+Tab` para detectar escape de foco.
- No E2E, o formulário é aberto pelo dashboard real, não por um mock do modal. A confirmação é rolada para a viewport CSS equivalente ao zoom 200% e sua caixa é verificada dentro dos 400px de altura.
- Não há consumidor de `SideModal` (`rg` local sem uso); portanto não houve modal aninhado real para reproduzir. O comportamento de um segundo modal simultâneo permanece uma limitação a cobrir quando houver consumidor.

## Revisão e pendências

- O backend sentinela indisponível produz o toast “Servidor em manutenção...” durante a captura; ele foi mantido na inspeção e não impede a ação de salvar de ser rolada para a viewport. Não foi usado banco, credencial ou API real.
- A simulação de zoom usa a viewport CSS efetiva (180×400), equivalente geométrico de 200% sobre 360×800; zoom nativo do navegador não foi automatizado separadamente.
- O acesso visual usou cookie JWT sintético com expiração futura apenas para atravessar o middleware local. O middleware atual valida formato/expiração, não assinatura; a investigação de segurança/autenticação não pertence a CF-010 e deve ser considerada por CF-011 após CF-008.
- A revisão independente prevista para o marco continua responsabilidade de CF-015. Esta conclusão é limitada aos componentes compartilhados alterados.
