# Execuções e falhas preservadas — CF-031

21/10/2026. Executor: Codex desta conversa. Metadados de modelo da tarefa não
reconfiguram automaticamente a execução. Base publicada/integrada `6d819aa`.
Node24.18.0, Next16.1.6, React19.2.3, Vitest4.1.11, Playwright1.63.0,
Java21 e PostgreSQL16-alpine descartável. Navegador/viewport/fuso efetivos da
rodada final constam em `e2e-final/*-environment.json`.

## Resultados por camada

- Entrada/parsing/estado/interação: **75/75**, `components-delivery.log`.
  São47 casos de contrato,17 de estado e11 de tela. Expected de E01/E16–20/E35
  vem dos exemplos SPEC-001 aprovados, sem importar cálculo de produto como oracle.
- Contraprovas: **5/5 detectadas por AssertionError**; controle antes/restaurado
  **64/64**. Ver `counterproof-results.json`, logs/diffs por mutação. A cópia206
  arquivos voltou aos mesmos hashes. Nenhum fonte de produto compartilhado mutado.
  Depois dessa prova, somente apresentação/índices e harness E2E receberam delta;
  `flow.ts` e `result.ts` usados pelas mutações permaneceram idênticos.
- Unitários legados: **6/6**, `unit-regressions.log`.
- Suíte ampla de componentes: **438/441**, `component-regressions.log`.
  As três falhas também ocorrem na base publicada: `baseline-regressions.log/json`.
  Base arquivada em diretório temporário, sem fontes CF031: dois testes de hábitos
  esperam zero timers após unmount e observam1; um teste temporal de detalhe não
  fornece UserProvider ao PrivacyBlur. Nenhuma assertion, caso ou produto alterado
  para esconder essas falhas. A suíte ampla **não está integralmente verde**.
- Lint completo: `lint-delivery.log`; typecheck: `typecheck-final.log`, ambos exit0.
- Build final: `build-delivery.log`, exit0, incluindo rota `/onboarding`.
  `build-final.log` conserva a aprovação anterior ao índice de nomes.

## Integração real e SQL

Runner Java `OnboardingFrontendPostgresE2E`: Spring HTTP em porta aleatória,
OnboardingSchemaInitializer, FlywayV1–V16 e Hibernate validate em schema novo
no PostgreSQL Testcontainers. Email/cotações externos substituídos; nenhum serviço
financeiro, BFF, endpoint ou banco simulado com sucesso pré-programado.
Next3111/Chromium usam backend loopback obrigatório, fixture por usuário/projeto,
relógio **Date-only** no browser e relógios de credencial/produto separados.

Primeira rodada completa corrigida: `e2e-observers-fixed`, **9/9** jornadas e
SQL aprovado. Perfis vazio/completo/rascunho nas larguras360/768/1440 e fusos
SP/UTC/Kiritimati. Perda de resposta encaminha primeiro o POST real até commit;
somente o retorno é perdido. Recuperação não envia outra operação financeira.

Rodada final acrescenta 503 após PUT realmente persistido,401 real por remoção
do cookie/reautenticação pelo diálogo existente e apresentação de valor extenso,
negativo, desconhecido e parcial. O total dessa rodada é12 casos, sem somar9
anteriores como casos novos. **12/12 aprovados**; runner Java1/1 aprovado,
sem falhas/erros/skips. Resultados e12 checkpoints SQL em `e2e-final/`;
relatórios Java copiados para `e2e-final-reports/` antes de outros testes.

E01 é carregado no rascunho por PUT real com a fixture aprovada; todas as etapas
são reabertas no browser e a confirmação é feita por teclado. Isso **não prova
digitação ponta a ponta de todos os campos**. Componentes exercitam digitação,
validação, navegação, mudança de respostas, foco, conflito e privacidade. O perfil
vazio percorre as oito etapas por teclado e saves reais. Nenhuma limitação dessa
partição é apresentada como cobertura integral CF-032.

Prova SQL por owner: vazio=uma carteira0/um recibo/nenhum movimento; E01=três
contas1300,16 itens resolvidos,um recibo,reservas550 e somente uma previsão
pendente (zero liquidações); rascunho e revisão cancelada=uma carteira0/nenhum
recibo/item aplicado/movimento. Reload relê recibo e resumo original1451/350/656.

## Ocorrências iniciais, sem retries para mascarar erro

1. `contracts-initial.log`: EPERM no rename de cache temporário do Vitest, antes
   de qualquer caso. Execução seguinte autorizada fora da sandbox, mesmo comando.
2. `contracts-unsandboxed.log`:43/47; três fixtures recusadas por exigir SHA num
   token opaco e uma resposta com status herdado aceita indevidamente. Corrigido
   o leitor, preservados expected/exemplos; `contracts-flow-corrected.log`63/63.
3. `typecheck-initial.log`: casing do import modal e narrowing de Json; corrigidos.
   `typecheck-tests.log`: configuração importava extensão .mts e mocks perdiam
   tipos literais; corrigida infraestrutura, sem desligar regras de TypeScript.
4. `build-initial.log`: fontes públicas Geist indisponíveis na sandbox. Com rede
   autorizada, `build-network-allowed.log` aprovado. Sem substituir fontes/deps.
5. `e2e-initial-maven.log`/reports: colisão de nome do bean de relógio, antes de
   navegador. Nome único no harness, sem habilitar override global.
6. `e2e-clock-fixed`: config Playwright usava import.meta num runner CommonJS;
   corrigida para cwd explícito, sem mudar package.json ou contrato de produto.
7. `e2e-config-fixed`:6/9; observador lia GET antes do último save terminar e
   desmontava a interceptação antes de perder a resposta. Corrigido para aguardar
   heading/commit/abort/controle habilitado. Sem sleeps ou aumento de timeout.
8. `e2e-extended`:9/12; os três casos de401 tentavam clicar atrás do diálogo global
   de sessão expirada. Snapshot preservado identifica o botão legítimo. A jornada
   final usa “Ir para o Login” nesse diálogo; nenhum force click, ocultação de
   overlay ou mudança no produto para contornar o diálogo.
9. Revisão estática acrescentou guarda de versão/estado na releitura de save e
   retomada da revisão original em declarações de reserva. Casos novos cobertos
   pelos75 testes e pela rodada final. Índices de apresentação removem buscas
   repetidas; validação/identidade financeira não foram alteradas por esse ajuste.

Falhas anteriores, capturas e relatórios foram mantidos. Houve patches recusados
por contexto inexistente, sem aplicação parcial; reaplicados em alvos dirigidos.
Uma tentativa de contraprovas não chegou a executar por limite de créditos da
revisão automática. Após o usuário informar a retomada dos créditos, a mesma
ação autorizada foi executada; não houve contorno do gate.

## Reprodução

Da pasta frontend:

```powershell
node node_modules/vitest/vitest.mjs run --config src/screens/private/onboarding/vitest.config.mts
node scripts/test.mjs
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```

Da raiz: `./tasks/evidencias/CF-031/counterproofs.ps1` e
`./tasks/evidencias/CF-031/baseline-regressions.ps1`. Não sobrescrever evidências
existentes ao reproduzir; escolher novos nomes de saída/cópia. O runner Java exige
Docker local e JDK21; nenhum fallback de banco externo é admitido:

```powershell
./mvnw.cmd --batch-mode -Dtest=OnboardingFrontendPostgresE2E -Dcf031.evidence=../tasks/evidencias/CF-031/review-new test
```

O comando Maven é executado na pasta backend. O novo harness Java está fora dos
alvos frontend originais, justificado pelo pedido explícito de prova HTTP/SQL
descartável. Não altera código de produto Java, schema ou consumidores existentes.
