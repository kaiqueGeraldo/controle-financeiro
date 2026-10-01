# CF-006 — Aplicar relógio e serialização temporal consistentes no backend

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-002](../00-fundacao/CF-002-ambiente-backend.md), [CF-004](../01-datas-integracao/CF-004-contrato-temporal.md)
- Origem: T-010; investigação temporal

## Consolidação documental — 01/10/2026

P01/P02 possuem writers/DTOs revalidados em ambiente sintético; a fundação Flyway avançou
até V13 nos recortes revisados. O calendário necessário à CF-022 tem aceite independente
local. Estado `em_revisao` mantido para o aceite final e adoção temporal real, sob
CF-017/derivada; nenhuma migração remota ou proveniência foi certificada. Adoção pendente
não é impedimento automático de desenvolvimento descartável.

[Snapshot, evidências, condições e limites](../evidencias/consolidacao-CF-001-CF-026/README.md).
As seções datadas abaixo preservam o histórico de suas respectivas bases.

## Problema e resultado esperado

Configurar Jackson não controla LocalDate.now/LocalDateTime.now nem o calendário dos crons. Centralizar decisões de tempo mantendo compatibilidade dos DTOs.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/utils/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/`
- `controle-financeiro-backend/src/main/resources/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Introduzir Clock/ZoneId conforme contrato; aplicar aos pontos de criação, prazo, fatura, hábitos e recuperação de senha relevantes.
2. Testar desserialização/serialização reais de datas e horários, incluindo inválidos e ausência de campo.
3. Mapear schema afetado por eventual troca de tipo temporal; migração fica condicionada a CF-017 e à origem comprovada.

## Aceite e testes adversariais

- [x] Mesmo instante com JVM UTC e São Paulo produz o calendário de produto especificado.
- [x] Payload civil mantém YYYY-MM-DD no round trip; horário fornecido não é sobrescrito silenciosamente por hora do servidor.
- [x] Meia-noite, ano bissexto, fechamento em mês curto e expiração de token são verificáveis com Clock fixo.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Converter em massa LocalDateTime legado sem provenance; mudar schema de produção ou adicionar fuso em campo civil.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Concluída em 08/09/2026 sobre `main`, HEAD `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, preservando o patch local preexistente. Foi configurado um `Clock`/`ZoneId` único de produto (`America/Sao_Paulo`), aplicado aos pontos temporais relevantes dos serviços, crons e credenciais. Datas civis e horários agora têm desserialização/validação estrita, e cada operação preserva valores explícitos do usuário enquanto captura uma única hora de fallback.

O schema foi verificado em PostgreSQL descartável e não houve troca de tipo: `date` continua representando dia civil e os `timestamp without time zone` legados permanecem mapeados para decisão da CF-017. A exceção de caminho `infra/security/TokenService.java` foi necessária e coberta por teste de fronteira de expiração; controllers/envelopes HTTP continuam na CF-008.

Evidência completa, falha anterior, mutações, comandos, mapa de schema e riscos residuais: [tasks/evidencias/CF-006/README.md](../evidencias/CF-006/README.md).

Gate final em JDK 21 com JVM UTC: `mvnw.cmd ... -Duser.timezone=UTC clean verify` — `BUILD SUCCESS`, 45 testes, 0 falhas, 0 erros, 0 ignorados, com integração em PostgreSQL `16-alpine` descartável e JAR empacotado. Nenhum teste foi enfraquecido; três mutações temporárias produziram quatro falhas causais e foram executadas apenas em cópia isolada.

Dependências: a CF-007 fica integralmente liberada. CF-019 e CF-022 passam a ter a CF-006 satisfeita, mas continuam aguardando suas demais dependências. Nenhuma tarefa seguinte foi iniciada ou teve seu estado alterado.


## Revisão independente — 09/09/2026

R06/R07/R15/R16 corrigidos. P01/P02 dependem de proveniência e transição de esquema; perfil canônico não está integralmente entregue.

O [parecer da revisão](../evidencias/revisao-CF-001-CF-009/README.md) prevalece
sobre a conclusão histórica acima para o aceite atual. Somente o conjunto final
foi verificado; commits intermediários não são apresentados como testados.

- [ ] Fechar as pendências atribuídas a esta tarefa no parecer independente.

## Saneamento — 13/09/2026

P01/P02 receberam armazenamento aditivo candidato, writers explícitos e testes PostgreSQL. Migração real/proveniência continuam abertas na derivada CF-017.

[Implementação, autotestes e limites](../evidencias/saneamento-P01-P05-2026-09-09/README.md).
Estado permanece em_revisao; esta execução não substitui revisão independente.
