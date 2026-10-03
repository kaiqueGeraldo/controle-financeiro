# Encaminhamento para revisão independente dirigida

Base inicial `a8c3724f386e0b249d09615d6343ba5774c0658f`. Emitir **parecer separado**
para CF-025, CF-026, CF-027 e RV24-01. A reconciliação documental exige decisões
por critério, não nova auditoria integral CF-001–027. Não executar CF-028+ por
efeito deste encaminhamento. Commits desta entrega serão identificados em
COMMITS.md; os intervalos históricos abaixo são exatos e resolvíveis no Git.

## CF-025 — consultas e desempenho

- Produto/testes: `846c64c8a144f35cb62a7fa30c3bcadbfefad5af..65ec14e`;
  entrega completa `846c64c..04cad8d`. Localizar pelo diff `Habit.java`,
  `Cf025*`, instrumentação de SQL e tarefas/evidências CF-025.
- Critérios: os quatro do [canônico](../../03-integridade/CF-025-consultas-desempenho.md),
  [oráculos](../CF-025/ORACLES.md), DEC-08/SPEC-004, isolamento/locks de CF-024.
- Provas: SELECTs reorder 4/31/121→1, N UPDATEs preservados; lista sem duplicar
  logs, paginação/total/owner, dias e rollback, waiter observado com
  pg_blocking_pids. Usar testes nomeados em [entrega](../CF-025/README.md).
- Reutilizar CSV/EXPLAIN/logs antes/depois e gate396; não reler todos os módulos
  como nova auditoria. Conferir consumidores LAZY fora da transação e mudanças
  posteriores: CF-026 toca frontend hábitos; CF-027 não reorganiza hábitos.
- Lacunas: 20 amostras locais aquecidas não certificam SLA, heap ou cartões/ativos
  volumosos. UPDATEs/locks/memória continuam O(N). RJ-022-01/H24-01 não encerrados.
- Se aprovada: satisfaz a aresta CF-025→CF-033; CF-027/032 continuam gates distintos.

## CF-026 — lint/tipagem e efeitos

- Intervalo `5f26a1d56f94a21d75e67c375ea9095aaec3a79f..30211b85db5ecda23f7956ccf8471765056fc4c5`.
  Arquivos exatos em `git diff --name-only 5f26a1d..30211b8` e manifesto da entrega.
  Foco: configDashboardModal/parser, utils/errors, formulários/managers, hábitos,
  auth, useOptimisticMutation, tipos e cf026-contracts.test.tsx.
- Critérios: [canônico](../../03-integridade/CF-026-lint-tipagem-frontend.md),
  HTTP-CONTRACT, AC-UI-005/006/009 e contratos financeiros preservados.
- Provas que devem reprovar: preferências null/array/membros inválidos/defaults,
  erro desconhecido, bindings com efeito, reorder/aporte e callbacks;
  cleanup/sessão A→B→A/unmount/geração. Contraprovas antigas e hashes estão em
  [execucao](../CF-026/execucao/README.md), incluindo correção documentada da prova.
- Lint0/0, typecheck/build e 180 componentes eram do executor. RV24 foi
  introduzida depois: `30211b8..53fa3a8`, revalidada em `40e07ef` com resíduos.
  O saneamento atual não pode servir como aprovação retroativa do lote CF-026.
- Se aprovada: satisfaz CF-026→CF-032/034 no seu alcance; não conclui CF-009/015,
  não certifica zoom, privacidade ou publicação.

## CF-027 — fronteira backend de intenção/recibo

- Produto `40e07ef4e2b1897a33430b256afaa36586bfc055..dcac7c588010dbe6cdd1a466797ae1947b92d855`;
  entrega completa `40e07ef..a8c3724f386e0b249d09615d6343ba5774c0658f`.
- Foco: FinancialIntentController, TransactionService/InvestmentService,
  service/intent, domain/intent e testes FinancialIntentArchitectureTest,
  IntentFingerprintTest, FinancialIntentsIntegrationTest. [Mapa](../CF-027/MAPA.md).
- Critérios: fronteira concreta e dependência proibida; invariantes sem mudança
  de schema/API; acoplamentos remanescentes/trade-offs; evidência. DEC-10 e
  [liberação independente restrita](../revalidacao-RV24-01-RV24-02/README.md).
- Provas: acesso indevido ao adaptador deve falhar; MANDATORY inclusive chave
  ausente; efeito+recibo/rollback; owner/kind/fingerprint/snapshot antigo;
  ordem de locks; CF-02430, HTTP/consumidores e SQL/reload. Reutilizar
  [203 testes e mutações](../CF-027/README.md), sem somar subconjuntos.
- API/DTO persistido não mudou salvo pacotes; revisor deve confrontar o diff,
  não aceitar só a declaração. Interface não impõe ordem no sistema de tipos;
  pacote interno depende de teste arquitetural; pagamentos, hábitos, metas,
  correções e UserService não foram reorganizados.
- Incidente target: outputs temporários originais parcialmente perdidos.
  Relatórios versionados são fontes históricas; reconstruídos não provam runs
  antigos. As integrações desta entrega são **novas execuções**, não restauração.
- Se aprovada: satisfaz CF-027→CF-033; CF-025/032 continuam necessárias.

## RV24-01 — revalidar somente os resíduos e consumidores

- Origem `30211b8..53fa3a8`, checkpoint `5d0649a`; revisão independente
  `40e07ef` examinou `5d0649a`. Novo saneamento parte de `a8c3724`; intervalo
  exato em COMMITS.md. Arquivos: services/creationResult.ts, creationIntent.ts,
  hooks/useCreationIntent.ts, newTransactionModal/operationModal e testes rv24.
- Critérios: [RVR24-01/02](../revalidacao-RV24-01-RV24-02/ACHADOS.md), canônico
  RV24-01, AC-UI-005/009, HTTP-CONTRACT, DEC-10 e DTOs Java de transação/investimento.
- Cinco provas originais: GET result vazio; POST investimento null/array;
  sucesso tardio após unmount/troca de owner. Arquivo do revisor idêntico por
  SHA-256 em baseline e cópia executada; `independent-before.log` tem cinco
  falhas causais e um verde. `first-after.log` passa as seis originais.
- Complementos: campos inválidos, POST/retry/GET, correspondência do comando,
  remoção de storage realmente exercitada com DTO válido, A→B→A, expiração,
  erro/sucesso tardios, falha ativa ainda reconcilia, recuperação da sessão
  correta. Fixtures antigas corrigidas com demonstração em [FIXTURES](FIXTURES.md).
- PostgreSQL real: integração original e variante que corrompe apenas resposta
  após commit; recibo incompleto não confirma. SQL/reload, replay exato,
  conflito409, outro owner404 e segunda intenção legítima distinguem HTTP/UI/banco.
- Riscos/limites: storage por aba, ID perdido não recuperável automaticamente;
  cancelamento lógico não desfaz commit; resposta de investimento não contém
  owner/asset/intent ID e não se inventa essa garantia. GET vincula operationId/kind;
  POST vincula request e campos expostos. Sem novo protocolo/migração.
- H-RV24-01 ECONNRESET continua categoria3: instrumentar passivamente as
  fronteiras Playwright/BFF/backend para classificar a ocorrência histórica.
  Verdes novos não provam causa nem confiabilidade irrestrita. RVA-03 e
  RJ-022-01/H24-01 são investigações diferentes, com donos preservados.
- Se aprovada: encerra RVR24-01/02 no alcance comprovado e permite ao revisor
  decidir o aceite da RV24-01 com ressalva explícita do transporte; não fecha
  automaticamente CF-009/014/015. RV24-02 permanece concluída conforme I.

## Decisões documentais restantes e CF-028

A [matriz atualizada](../consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md)
fornece critérios, base, alterações, categorias, responsáveis e condição de
encerramento das 27 tarefas. CF-005–008 exigem parecer final que confronte os
quatro critérios com V/M/J e mudanças pertinentes, sem promover liberação local
a adoção temporal real. CF-010–015 exigem somente lacunas do próprio aceite,
incluindo recuperação por e-mail/privacidade/estados e zoom; não se pede refazer
todas as suítes. CF-017, CF-019 e CF-022 conservam achados/investigações explícitos.

CF-028 depende canonicamente de **CF-016/018/019/020/023**, sem dependência direta
de CF-025/026/027. O próximo passo para especificá-la é uma decisão independente
delimitada sobre o consumo de CF-019: dívida, parcelas e abertura já aceitas,
sem depender da interação120 inconclusiva. Explicitar base atual, alterações
posteriores e limites conforme EXECUCAO; os pareceres existentes liberaram
CF-024 e o recorte CF-027, não automaticamente todo consumidor futuro.
CF-028 permanece proposta e não foi executada. Sem banco real ou publicação.

## Preservação operacional após o incidente target

Manter JDK em diretório de ferramentas fora de target (por exemplo, runtime
gerenciado do usuário) e configurar JAVA_HOME; nunca colocar a única cópia de
runtime, fonte de contraprova ou relatório durável em output de build.
Novas cópias desta execução ficam em diretórios únicos do temporário do sistema,
e logs/spec efetivo/SQL/resultados publicados ficam em tasks/evidencias.
O script ainda referencia o JDK já restaurado em target para não reorganizar
o ambiente nesta tarefa; lê esse runtime e não executa clean/remoção ampla.

Para a próxima execução, fornecer runtime externo preservado e exportar os
relatórios necessários antes de qualquer limpeza planejada. Não executar os
comandos clean antigos dos relatórios como instruções desta rodada. Provas
perdidas necessárias aqui foram substituídas apenas por novos runs do candidato:
componentes originais preservados e integração selecionada. Não reconstruir o
histórico inteiro nem afirmar que os outputs antigos foram recuperados.
