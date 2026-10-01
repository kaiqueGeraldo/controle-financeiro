# CF-008 — Corrigir contratos HTTP e erros entre front e back

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-002](../00-fundacao/CF-002-ambiente-backend.md), [CF-003](../00-fundacao/CF-003-harness-frontend.md), [CF-004](../01-datas-integracao/CF-004-contrato-temporal.md)
- Origem: T-003; F-005, F-006

## Consolidação documental — 01/10/2026

P03/PUT foi revalidado na revisão CF-015; R06/ownership foi encerrado em `681102b`;
D16-T01 foi validado na revisão CF-017. P01/P02 e o fechamento integral dos contratos
continuam pendentes, estado `em_revisao`. Contratos HTTP/temporais necessários à CF-018
tiveram liberação independente explícita na revisão CF-017, e o recorte CF-023 na
revalidação residual. RV24-01 é defeito posterior do consumidor de resultado desconhecido,
sob derivada/CF-009: o erro de transporte corretamente sinalizado não prova reconciliação
segura.

[Snapshot, evidências, condições e limites](../evidencias/consolidacao-CF-001-CF-026/README.md).
As seções datadas abaixo preservam o histórico de suas respectivas bases.

## Problema e resultado esperado

403 tratado como expiração e validação genérica podem transformar erros esperados em logout ou 500. Alinhar status, DTOs e feedback sem esconder falhas.

## Escopo e referências

- `controle-financeiro-frontend/src/services/`
- `controle-financeiro-frontend/src/app/api/[...path]/route.ts`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/infra/exception/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/controller/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Mapear contratos consumidos; testar validação e desserialização reais e corrigir status/campos.
2. Separar 401 de 403, 204 sem corpo, erros JSON e downloads binários; padronizar timeout/cancelamento no BFF.
3. Verificar paginação e nomes de campos frontend/backend com exemplos reais sintéticos, corrigindo incompatibilidades encontradas.

## Aceite e testes adversariais

- [x] 401 privado exige login; 403 mantém sessão e mostra proibição; 400 identifica entrada inválida; 409 permite reconciliar.
- [x] 204 não lança parse error; download de erro não é salvo como planilha válida; AbortError não vira falso 500.
- [x] 503/timeout oferece recuperação sem mensagem de sucesso ou perda silenciosa de formulário.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Troca de stack de autenticação ou alteração de regras monetárias para satisfazer DTO.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Iniciada e concluída em 08/09/2026 sobre `main`, HEAD `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, preservando o patch local das tarefas anteriores. As dependências CF-002, CF-003 e CF-004 estão concluídas nesta base local.

O contrato consumido foi inventariado em `src/services/HTTP-CONTRACT.md`. Frontend e BFF agora distinguem 401/403, validação, conflito, indisponibilidade, rede, cancelamento, 204, JSON e binário; mutações com resultado desconhecido exigem reconciliação. No backend, validação/desserialização identificam campos, autenticação/autorização também são padronizadas antes do controller, falhas inesperadas de autenticação não são mascaradas e a paginação usa `PagedModel` explícito. `SecurityConfig` foi a alteração compartilhada fora dos caminhos enumerados, necessária porque falhas do filtro não chegam ao `@ControllerAdvice`.

Validação final: 25 testes de componente, 15 execuções unitárias frontend em três fusos, typecheck, lint focado e build Next aprovados; `clean verify` backend aprovou 54 testes com JDK 21 e PostgreSQL 16 descartável. Uma regressão final adicional aprovou 6/6 testes do contrato após comprovar que o update sem `@Valid` aceitava `24:00` com 200. As regressões novas falharam contra o cliente/handler anteriores (7/7 frontend, 3/5 backend e 1/6 no update temporal) pelas causas esperadas. [Evidência completa, comandos e limitações](../evidencias/CF-008/README.md).

Limites: o BFF anterior não teve execução vermelha independente para timeout/499; não houve Playwright, CI remoto ou produção; todos os JSON 200 ainda não têm validação runtime de schema. O `clean verify` de 54 testes precedeu o último `@Valid`; depois dele houve recompilação e 6/6 testes focados verdes, mas o `clean verify` de 55 não foi contabilizado porque a montagem do socket Docker do host no contêiner JDK foi recusada por segurança. CF-023 mantém a política uniforme de IDs alheios, pois os 29 `BusinessRuleException("Acesso negado...")` legados não devem ser reclassificados por texto. CF-009/024 continuam responsáveis por corridas, idempotência e consumo sistemático da reconciliação.

Tarefa liberada para execução nesta base local: **CF-009**, pois CF-003 e CF-008 estão concluídas. CF-011–014 ainda aguardam CF-010; CF-018 e CF-023 mantêm suas demais dependências. Nenhuma tarefa seguinte foi iniciada nem teve estado alterado.


## Revisão independente — 09/09/2026

R02/R04/R05/R07/R12/R15 corrigidos. PUT de planejamento P03 e adoção temporal canônica P01/P02 permanecem pendentes.

O [parecer da revisão](../evidencias/revisao-CF-001-CF-009/README.md) prevalece
sobre a conclusão histórica acima para o aceite atual. Somente o conjunto final
foi verificado; commits intermediários não são apresentados como testados.

- [ ] Fechar as pendências atribuídas a esta tarefa no parecer independente.

## Saneamento — 13/09/2026

P03 implementa PUT com contrato explícito; P01/P02 acrescentam erros por campo, DTO e perfil temporal candidato. Adoção real permanece pendente.

[Implementação, autotestes e limites](../evidencias/saneamento-P01-P05-2026-09-09/README.md).
Estado permanece em_revisao; esta execução não substitui revisão independente.

## Candidato de saneamento CF-015 — 21/09/2026

R06: criação, edição e cópia de planejamento validam a propriedade da categoria no backend antes de persistir. Integração com dois usuários e PostgreSQL observa sucesso legítimo, 404 e ausência de persistência parcial.

[Registro do saneamento e evidências](../evidencias/saneamento-CF-015/README.md).
Estado mantido em_revisao; fechamento depende de nova revisão independente.
CF-016 não iniciada. P01/P02/CF-017 mantém adoção temporal pendente; testes
sintéticos não certificam migração ou publicação. O parecer anterior permanece
preservado como registro histórico.

## Revalidação independente CF-015 — 21/09/2026

R06 encerrado para POST/PUT/cópia de planejamento com PostgreSQL e propriedade no backend. Isso não encerra adoção P01/P02 nem toda a CF-008.

[Parecer, rastreabilidade e execuções](../evidencias/revalidacao-CF-015/README.md).
