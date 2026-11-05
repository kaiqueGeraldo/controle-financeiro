# CF-006 — Aplicar relógio e serialização temporal consistentes no backend

- Estado: concluida
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-002](../00-fundacao/CF-002-ambiente-backend.md), [CF-004](../01-datas-integracao/CF-004-contrato-temporal.md)
- Origem: T-010; investigação temporal

## Parecer vigente — 09/10/2026

RD58-02 aprovado independentemente sobre `0c068d9bd750e648ba839742991108deace31f9f`,
intervalo `18cd6df..0c068d9`: todos os writers de GoalHistory registram o instante
do Clock, SQL/HTTP/reload preservam UTC e proveniência; legado bruto/null permanece
UNKNOWN. V14 aprovada localmente em banco vazio e upgrade V13, sem backfill.
Os quatro critérios originais e trabalhos1/2/3 foram confrontados com aceites
acumulados: todos atendidos no escopo próprio; tarefa **concluida**.
Parecer, matriz, hashes, validação e limites (registro de execução privado).
Não se transfere obrigação para encerrar a tarefa: adoção real já pertence ao
escopo original CF-017/derivada e continua aberta, sem certificação Railway.
CF-007/008 local, CF-009/RV24-01 e contratos financeiros preservados.
CF-028 conserva liberação somente para especificação, sem execução nesta revisão.
Os registros datados abaixo descrevem suas bases históricas e não o estado vigente.

## Parecer — 08/10/2026

Estado `em_revisao` mantido por RD58-02: gravação nova de GoalHistory perde o
offset do instante exigido por CT-10/E11. POST/commit/GET/PostgreSQL descartável
com Clock fixo reproduz `00:10:00` sem offset em vez de `03:10:00Z`.
Trabalho original 1/2 de aplicar o contrato e serializar datas/horários ainda
incompleto nesse writer/DTO; não atribuir origem ao legado para encerrá-lo.
Clock/fuso, civil/hora informada, bordas/token e P01/P02 sintéticos preservam
aceites nos caminhos comprovados. Adoção real continua na CF-017/derivada.

Matriz por critério, parecer e condições de encerramento (registro de execução privado),
base `1b0d9bcefaba0bcc37a21955caa94db65a3bf383`. Não é pendência genérica de
revisão ou exigência de operar banco real; as notas datadas abaixo são históricas.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categorias 1 e 5: falta decisão integral por critério sobre Clock/fuso, round trip/horário, bordas/token e writers; schema/proveniência/coordenação reais continuam CF-017/P01/P02. Calendário backend local já foi liberado para CF-022. Encerrar exige parecer delimitado, sem converter aprovação sintética em adoção real.

Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências (registro de execução privado). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Consolidação documental — 01/10/2026

P01/P02 possuem writers/DTOs revalidados em ambiente sintético; a fundação Flyway avançou
até V13 nos recortes revisados. O calendário necessário à CF-022 tem aceite independente
local. Estado `em_revisao` mantido para o aceite final e adoção temporal real, sob
CF-017/derivada; nenhuma migração remota ou proveniência foi certificada. Adoção pendente
não é impedimento automático de desenvolvimento descartável.

Snapshot, evidências, condições e limites (registro de execução privado).
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

Evidência completa, falha anterior, mutações, comandos, mapa de schema e riscos residuais: tasks/evidencias/CF-006/README.md (registro de execução privado).

Gate final em JDK 21 com JVM UTC: `mvnw.cmd ... -Duser.timezone=UTC clean verify` — `BUILD SUCCESS`, 45 testes, 0 falhas, 0 erros, 0 ignorados, com integração em PostgreSQL `16-alpine` descartável e JAR empacotado. Nenhum teste foi enfraquecido; três mutações temporárias produziram quatro falhas causais e foram executadas apenas em cópia isolada.

Dependências: a CF-007 fica integralmente liberada. CF-019 e CF-022 passam a ter a CF-006 satisfeita, mas continuam aguardando suas demais dependências. Nenhuma tarefa seguinte foi iniciada ou teve seu estado alterado.


## Revisão independente — 09/09/2026

R06/R07/R15/R16 corrigidos. P01/P02 dependem de proveniência e transição de esquema; perfil canônico não está integralmente entregue.

O parecer da revisão (registro de execução privado) prevalece
sobre a conclusão histórica acima para o aceite atual. Somente o conjunto final
foi verificado; commits intermediários não são apresentados como testados.

- [ ] Fechar as pendências atribuídas a esta tarefa no parecer independente.

## Saneamento — 13/09/2026

P01/P02 receberam armazenamento aditivo candidato, writers explícitos e testes PostgreSQL. Migração real/proveniência continuam abertas na derivada CF-017.

Implementação, autotestes e limites (registro de execução privado).
Estado permanece em_revisao; esta execução não substitui revisão independente.

## Saneamento restrito RD58 — 09/10/2026

Candidato implementado sobre `18cd6df`, aguardando revalidação independente.
Estado **em_revisao** preservado, sem autoaprovação dos achados ou da tarefa.
RD58-01 restaura o ano inicial do navegador conforme DEC-01 e preserva seleção/query.
RD58-02 adiciona auditoria de GoalHistory por Clock, V14 sem backfill, DTO com
proveniência e apresentação de legado com fuso desconhecido. Provas originais
preservadas; integração PostgreSQL, upgrade/legado e regressões documentados.
Aceites locais CF-007/008 e CF-009/RV24-01 preservados; adoção real sob CF-017.
CF-028 não iniciada. Causas, provas, limites e encaminhamento (registro de execução privado).
