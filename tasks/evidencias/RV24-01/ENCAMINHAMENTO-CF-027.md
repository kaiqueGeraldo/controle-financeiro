# RV24-01 / RV24-02 — encaminhamento para revisão independente

01/10/2026, America/Sao_Paulo. Ambos os RV24 estão **em_revisao**.
Este documento registra entrega do executor; não aprova os RV24 nem libera CF-027.
CF-027 permanece proposta, sem implementação, movimentos de pacote ou extração
de interfaces de caso de uso nesta task.

## Versões e intervalo

| Versão | Unidade funcional |
|---|---|
| `30211b8` | Base CF-026; revisão independente pendente |
| `53fa3a8` | RV24-01: intenção persistida, retry exato e reconciliação dos dois consumidores |
| `805f588` | RV24-02: limpeza transacional do grafo por proprietário e email pós-commit |

Intervalo funcional para revalidação: **`30211b8..805f588`**.
O commit posterior de fechamento contém este encaminhamento, o checkpoint e
somente remoção de uma linha vazia excedente no EOF de três testes de RV24-01.
Não muda comandos, assertions ou comportamento. Revalidar sobre esse fechamento
também permite conferir as evidências e hashes; obter seu SHA com `git log -1`.
Não houve amend, rebase, push ou deploy.

O README raiz alheio ficou fora dos commits e manteve SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Logs/XML/JSON/textos de execução são preservados como bytes originais via atributos
locais `-text`, incluindo CRLF e whitespace do reporter. O check de whitespace de
código/documentação exclui esses artefatos brutos; não altera lint nem testes.

## Componentes e fronteiras alterados

| Fronteira | Alteração / contrato conservado |
|---|---|
| Formulário de transações e OperationModal monetário | Emissão de UUID por nova intenção; bloqueio enquanto desconhecida; recuperação/retry do corpo original |
| Hook, aviso e parser de criação novos | Extração pequena necessária aos dois consumidores; storage por owner/kind, validação de desconhecido e cleanup de callbacks/subscriptions |
| DTOs frontend | `operationId` opcional nas duas criações; contratos tipados da CF-026 conservados |
| BFF, serviços financeiros backend, schema/recibos | Protocolo CF-024 e autenticação existentes; sem alteração de API, obrigatoriedade, constraints, cascatas ou migrações |
| UserService.deleteAccount | Seleção das raízes por owner, ordem bulk do grafo atual/herdado, guardas de referências alheias SET NULL/UUID, flush/lock/clear na mesma transação |
| Cache / email de exclusão | Listener AFTER_COMMIT e alcance global anteriores preservados; submissão do email passa a pós-commit, com double e falha externa explícita |
| Infraestrutura somente de teste | PostgreSQL descartável, fault trigger/controller ausente do JAR de produto, browser/BFF real e snapshots SQL independentes |

## Resultado e causalidade

- [RV24-01](README.md): probe original vermelho antes da mudança e investimento
  dinamicamente vermelho. Seis jornadas browser → BFF → backend → PostgreSQL →
  reload passaram: perda após commit, falha pré-commit e recuperação indisponível
  para transação e investimento. Cada jornada confirma retry sem segundo efeito,
  duas intenções iguais legítimas, conflito de conteúdo e isolamento de principal.
- [RV24-02](../RV24-02/README.md): violação real de FK com pagamento/alocação antes
  da correção; compra comum paga também falha com UserService histórico numa cópia
  isolada. Seis testes dirigidos atuais passam; grafo representativo de 29 tabelas,
  outro owner integralmente igual, rollback intermediário real, cache e doubles.
- Frontend completo: 193/193 componentes, zero skips; lint 244 alvos com zero erros
  e avisos; typecheck/build e 18 execuções temporais verdes. Backend afetado:
  verify/JAR 135/135 sem failures/errors/skips, mais gate final próprio de exclusão
  6/6. Quatro jornadas originais R03 passaram, preservando R03/RV01.
- As contagens se sobrepõem; não somar os gates. Primeiras falhas, ajustes de
  fixtures e limitações permanecem registradas. Não houve alteração de expected
  financeiro para obter aprovação nem test.skip introduzido.

O [checkpoint](checkpoint.json) registra hashes raw/LF das fontes e hashes dos
artefatos. `node tasks/evidencias/RV24-01/verify-evidence.cjs --check` confere o
checkout local registrado sem sobrescrever a prova. Hash raw de fonte/Markdown
pode variar num clone com normalização CRLF; LF de fonte é o comparador portable.
Hash de log bruto deve coincidir. Metadados de gates no checkpoint são índice dos
relatórios, não um runner nem prova autossuficiente de aprovação.

## Pendências que permanecem

**CF-019 — RVA-03:** continua inconclusiva a interação/recuperação do pagamento
relacionada ao limite de 120 segundos. R03 verde aqui conserva sua regressão no
escopo original; não explica nem encerra RVA-03.

**CF-022 — RJ-022-01 / H24-01:** continuam pendentes o timeout da jornada semanal
sem POST e a causalidade do timeout histórico de scheduler. Os 27 testes de
hábitos verdes no verify não substituem a investigação desses achados.

CF-019/022 não foram concluídas para destravar dependências. O revisor deverá
avaliar a relevância desses achados para a fronteira escolhida de CF-027 e
registrar saneamento, bloqueio ou delimitação fundamentada segundo os contratos.

CF-026 mantém sua revisão independente pendente. Não foi adicionada às
dependências de CF-027. As dependências declaradas continuam CF-018/019/020/022/024;
esta entrega não altera o escopo ou os gates dessas tarefas.

## Garantias a confirmar antes de avaliar prontidão CF-027

1. Invalidar as provas vermelhas com a base histórica e confirmar a correção
   causal no intervalo candidato. Executar os comandos registrados e conferir
   expected contra contratos, SQL pós-reload e versão exata das fontes.
2. Confirmar identidade/corpo imutáveis no retry, nova identidade por intenção
   legítima, conflito por payload e recibo autenticado por owner. GET404 ou outage
   não liberam POST com nova chave. Confirmar fechamento/reabertura/reload,
   callbacks após troca de owner/expiração/unmount e limite da identidade perdida.
3. Conferir inventário completo atual/herdado, ordem dos deletes e raízes por
   owner, inclusive recibos/compensações/revisões. Confirmar ausência de órfãos,
   preservação integral do outro owner e rollback de falha intermediária. Rejeição
   de referências alheias inconsistentes não pode virar limpeza cruzada.
4. Confirmar cache apenas após commit e email apenas pós-commit, usando doubles;
   falha externa não pode alegar rollback nem recriar dados. Não há garantia de
   entrega durável sem outbox no contrato atual.
5. Confirmar preservação das invariantes de CF-018/019/020/022/024 e de R03/RV01,
   sem converter este gate em aceite de RVA-03, cache de produção ou isolamento
   completo de CF-023. Examinar as pendências acima e o estado das dependências
   integradas antes de aprovar uma fronteira concreta de CF-027.
6. Só então registrar um parecer independente sobre RV24 e a prontidão da
   refatoração futura. Checkboxes do executor, este documento e gates verdes não
   constituem liberação de CF-027.

## Trade-offs e limites residuais

Storage custa O(L) por comando e conserva dados financeiros locais; não fornece
catálogo entre abas/dispositivos nem restaura identidade perdida. Testes integrados
exercitam EXPENSE/BUY e descarte lógico de resposta com commit real; não certificam
todos os tipos monetários, corte TCP físico ou restart/distribuição do backend.

Bulk evita N+1/materialização do histórico, mas joins/FKs podem custar O(N) sem
índices úteis e a ordem explícita exige manutenção ao evoluir schema. Lock do user
serializa exclusões e aumenta contenção; não certifica ausência universal de
deadlock entre writers com outras ordens de locks, carga ou SLA. Cache global
herdado permanece; dados do outro owner são preservados, mas suas entradas podem
ser invalidadas após commit. Email não possui retry durável. Essas limitações são
parte da revisão, sem antecipar a reorganização arquitetural CF-027.
