# Revisão crítica dos testes existentes — CF-001

Leitura e execução em 07/09/2026 sobre HEAD `169d7be4c7d3db97d4c318ff3f99d9de3a808067` + patch local identificado em [base-inicial.json](base-inicial.json). Revisão do executor desta tarefa; **não é a execução de revisão independente sugerida**. Resultados esperados comparados primeiro com SPEC-001/002 e política de testes, depois com assertions existentes.

## Inventário e alcance observado

- [date.test.mjs](../../../controle-financeiro-frontend/tests/date.test.mjs): cinco testes Node, quatro helpers importados de `src/utils/date.ts`, expected de strings/booleanos literais. Não monta React, não executa request nem acessa persistência.
- [scripts/test.mjs](../../../controle-financeiro-frontend/scripts/test.mjs): inicia exatamente esse arquivo em processos separados com TZ São Paulo, UTC e Kiritimati; propaga exit code não zero. Não descobre automaticamente outros arquivos.
- [Teste backend](../../../controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/ControleFinanceiroApiApplicationTests.java): apenas `@SpringBootTest contextLoads()` vazio. Carregamento de contexto não comprova regra financeira, query, rollback ou isolamento.
- [CI frontend](../../../.github/workflows/ci-frontend.yml): patch local já inclui `npm test` e build, Node 24 e `BACKEND_API_URL` corrigida. Não há gate de componente/E2E/lint/typecheck nesse workflow inspecionado.
- [CI backend](../../../.github/workflows/ci-backend.yml) e [Dockerfile](../../../controle-financeiro-backend/Dockerfile): ainda usam `-DskipTests`. Nenhuma execução remota foi feita.

## Capacidade e lacunas por teste

| Teste existente | O que a assertion observa | O que não consegue detectar / melhoria da tarefa dona |
|---|---|---|
| `datas civis preservam o calendário, inclusive ano bissexto` | Dia/mês/ano de 07/09/2026, 29/02/2024, 01/01/2026 e formato curto; três fusos | Um componente pode ignorar o helper e voltar a converter UTC sem afetar esse teste. Não observa lista versus detalhe, request ou reload. CF-005/007/012/013/014: AC-TIME-001/006. |
| `datas inválidas e instantes não são normalizados como datas civis` | Oito entradas inválidas exigem `—` no formatter e false na comparação | Não verifica bloqueio de submit, 400/DTO ou ausência de normalização no banco. Glifo `—` e retorno false são decisões hoje codificadas; SPEC-002 exige saída neutra e rejeição, sem determinar contrato completo. Preservar teste; DEC-05 registra lacuna de especificação, não motivo para remover assertion. CF-004/005/006/008: AC-TIME-002. |
| `hoje corresponde ao dia local nos dois extremos do dia` | Dois Date explícitos, às 00:30 e 23:30 locais, retornam dia 07/09 | Não congela relógio global nem chama o default sem argumento usado pelos quatro modais; não verifica 23:59:59→00:00, mesmo instante em browser/JVM distintos, abertura de modal ou campo previamente editado. CF-004/005/007: AC-TIME-003/009. |
| `prazo de hoje só se torna atrasado no dia seguinte` | Prazo ontem/hoje/amanhã, 23:59:59 e próximo dia no helper | Helper não recebe conclusão da meta; teste não monta StatusBadge, logo remover a proteção de meta concluída no componente passa despercebido por este arquivo. Não observa UI montada atravessando meia-noite. CF-005/014: AC-TIME-004/009. |
| `navegação mensal não pula fevereiro nem altera a data original` | Janeiro/março dias 29/30/31, dezembro/janeiro e imutabilidade do Date de janeiro | `localDateString(shiftMonth(...))` compõe dois helpers de produção; o expected é literal (não circular), mas erros compensatórios podem passar e a falha fica menos localizada. Verificar ano/mês/dia e timestamp original diretamente na regressão de CF-005; não alterar a suíte nesta fundação. Não cobre callbacks/useCards/useExtract/planningContext, ordem de respostas, limite de navegação ou persistência da seleção. AC-TIME-005, AC-UI-008. |
| `contextLoads` | Inicialização de contexto quando ambiente/configuração disponíveis | Não executa transação financeira, nenhuma assertion de saldo/ownership/persistência, rollback, concorrência, migração, query ou contrato. Executá-lo contra banco não isolado é inadequado. CF-002 prepara ambiente; testes de domínio pertencem às tarefas de integridade. |

Os testes de helper têm expected majoritariamente independentes e não usam mocks que neutralizam a regra. Isso é uma propriedade útil, mas 15 execuções significam cinco cenários repetidos em três fusos, **não 15 fluxos da aplicação**. Matriz, fixtures e validador CF-001 também não completam a cobertura do produto.

## Resultado executado e falhas

1. `npm --prefix controle-financeiro-frontend test` → **exit 1**, `MODULE_NOT_FOUND` em `npm-cli.js`. Também `npm --version` falhou pelo mesmo motivo; [runtime.json](runtime.json) registra npm indisponível. Log da tentativa: [testes-existentes.txt](testes-existentes.txt). É falha de instalação/ambiente, não vermelho causal de regressão.
2. `node controle-financeiro-frontend/scripts/test.mjs` → **exit 0**, cinco aprovados por fuso, total 15, zero falhas/skips. Executa o mesmo runner declarado em package.json sem passar pelo launcher npm avariado; não houve mudança de assertion ou retry para esconder defeito. Log: [testes-existentes-node.txt](testes-existentes-node.txt).
3. O Node 24.18.0 emitiu aviso `MODULE_TYPELESS_PACKAGE_JSON` ao carregar TypeScript; o runner concluiu. Configuração de pacote não alterada fora de escopo. CF-003 pode tratar compatibilidade do harness; CF-034 verifica execução no CI.

Não foram executados build/typecheck/lint, wrapper/Maven, PostgreSQL, servidor Next/Spring, navegador, CI remoto, produção ou deploy. Alterações desta tarefa são especificação, dados e verificador sem dependências; ampliar essas execuções não validaria a entrega documental nem preencheria as lacunas reais. Resultados históricos de build/lint permanecem históricos.

## Verificação adversarial planejada, não executada

Na CF-005, reintroduzir em **cópia isolada** a conversão de calendário para instante, default UTC, `<`→`<=` e navegação sem dia 1; exigir falha das assertions relevantes, registrar diff e restauração. Em componentes, desviar um consumidor do helper e remover condição de meta concluída; o teste de tela deve detectar. Não alegar que o runner atual mata esses mutantes sem executar.

Na CF-015 revisar tais evidências e estado assíncrono. Na CF-033, aplicar mutantes de isPaid/origem, parcela duplicada, owner e idempotência em integração real. Cada mutante sobrevivente exige cenário faltante ou justificativa de equivalência. CF-001 não corrige o patch inicial nem produz vermelho/verde financeiro.

Lacunas associadas aos achados já existentes F-012/F-015 (P1), F-007 (hipótese), F-009/F-010 (regras a especificar) e F-017 (P2). A falha de launcher npm é limitação ambiental desta execução, recuperada pelo runner Node; não foi atribuída ao código do produto nem criada tarefa de implementação adicional. O ensaio de ambiente da CF-003 deve verificar o comando npm.
