# CF-028 — Finalizar contrato da entrevista inicial

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: xhigh
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-016](../03-integridade/CF-016-regras-financeiras.md), [CF-018](../03-integridade/CF-018-contas-transacoes.md), [CF-019](../03-integridade/CF-019-cartoes-faturas.md), [CF-020](../03-integridade/CF-020-investimentos-metas.md), [CF-023](../03-integridade/CF-023-isolamento-autenticacao.md)
- Origem: T-006, T-007; F-008; SPEC-001

## Prontidão independente restrita — 03/10/2026

**Apta a iniciar exclusivamente a especificação**, base `06c1a51`. [Decisão independente](../evidencias/revisao-CF-025-CF-027-RV24/README.md) confronta CF-016/018/019/020/023 e alterações posteriores. CF-016/018/020/023 conservam aceite próprio; CF-019 oferece dívida/parcelas/abertura e backend aceitos em J/C, suficientes para definir contrato/DTOs/validações do onboarding sem consumir a interação de pagamento120 investigada em RVA-03.

Liberação explícita de capacidade CF-019→CF-028, sem concluir CF-019 ou fechar RVA-03. Não há dependência direta criada de CF-025/026/027. Não implementada nem aprovada antecipadamente: todos os critérios abaixo permanecem pendentes. CF-029–034, finalização, UI, migração real e deploy não liberados por esta nota; protocolo/concorrência próprios do onboarding ainda serão especificados e validados nas tarefas correspondentes.

## Problema e resultado esperado

A entrevista já está especificada, mas deve usar o modelo financeiro corrigido. Fechar ambiguidades de dívida, alocação e usuário legado antes da implementação.

## Escopo e referências

- `docs/sdd/specs/001-onboarding.md`
- `tasks/evidencias/CF-028/` (fixtures e scripts exclusivamente documentais)
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/`
- `controle-financeiro-frontend/src/types/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Detalhar DTOs e schema de rascunho/finalização com exemplos válidos/inválidos, limites e erros por campo.
2. Definir versão/idempotência, carteira padrão e diferenciação entre novo usuário e complemento de usuário com dados.
3. Fixar fluxo ramificado com fatura/parcelas pendentes, metas vinculadas e progresso numérico inicial.

## Aceite e testes adversariais

- [x] Exemplo completo reconcilia patrimônio/dívida/reservas e cada payload tem regra de validação.
- [x] Reenvio após timeout, duas abas e alteração de fonte vinculada têm resultado determinado.
- [x] Nenhuma etapa cria receita histórica, compra fictícia ou segundo saldo da carteira padrão.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

Checks atestam entregáveis documentais do executor, não aceite independente ou
conformidade de produto. A tarefa aguarda revisão, não está concluída.

## Fora de escopo

Implementar UI antes do contrato ou ampliar para Roda da Vida/Presentes.

## Modelo e revisão

A tarefa envolve decisão de contrato ou revisão crítica entre domínios; o esforço adicional se concentra em ambiguidades e riscos. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Executada exclusivamente como especificação em 09/10/2026 sobre
`c6a7c3ef3b563e9a432f80166aa4982a25180cd5`, branch
`codex/cf-028-contrato-onboarding`. [Evidências e reprodução](../evidencias/CF-028/README.md).
README raiz preexistente preservado por hash e fora dos commits. Estado passou
pronta→em_execucao→em_revisao, sem autoaprovação ou execução das sucessoras.

SPEC-001 v1 contém fluxo/estados, schema lógico/DTOs, limites/validações,
preparação/finalização/recuperação, concorrência/atomicidade exigidas, exemplos
e matriz de capacidades/diferenças CF-029–032. DEC-ONB-01 respondida pelo usuário:
metas preexistentes aceitam prazo original hoje/passado. Liberação parcial CF-019
confirmada; CF-017/019/frontend conservam gates.

Nove grupos de verificações documentais aprovados em três TZ; cinco corrupções
em memória rejeitadas. E01: patrimônio1451.00/dívida350.00/reservas550.00;
pagamento posterior conserva patrimônio. BigInt/esperados literais e calendário
gregoriano sem helpers de produto. Sem testes fictícios de HTTP/SQL/locks;
garantias nos aceites futuros. Nenhum endpoint/serviço/migração/tela alterado.
Sem push/deploy/banco real. Após revisão, sequência planejada: fechamento dirigido
frontend CF-010–015, não implementação automática de onboarding.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Revisão independente — 10/10/2026

**Não aprovada; em_revisao mantido.** Candidato `b7ebac8`, intervalo
`c6a7c3e..b7ebac8`. [Parecer, matriz, achados e provas](../evidencias/revisao-CF-028/README.md).
E01 reconciliado independentemente: patrimônio1451/dívida350/reservas550.
Protocolo de recuperação/concorrência e proibições de histórico fictício atendem
ao contrato; primeiro critério permanece parcial por R28-01/02 (P2): detalhes do
Summary sem representação de agregados fora de faixa e de reserva/progresso legado
desconhecido. Checks acima registram entrega do executor, não superam este parecer.

Saneamento documental dirigido dos DTOs/validações/exemplos e posterior revalidação,
sem implementação, revisão global ou liberação CF-029–034. DEC-ONB-01 preservada.
Somente após aceite, sequência planejada de fechamento dirigido CF-010–015.

## Saneamento documental R28-01/02 — 10/10/2026

Sobre a revisão `ef5cfae`, corrigidos agregados exatos e estados de conhecimento
no Summary, com E16–E20, atualização de E01 e contraprovas documentais.
[Delta, resultados e encaminhamento ao mesmo revisor](../evidencias/saneamento-CF-028-R28/README.md).
Parecer/provas independentes e README raiz preservados por hash. Sem implementação,
mudança de dependências ou nova decisão de produto. **em_revisao mantido**; saneamento
é candidato à revalidação, não encerramento dos achados nem aprovação do executor.

## Revalidação independente R28 — 10/10/2026

Candidato `4dc5f67`, intervalo `ef5cfae..4dc5f67`:
[parecer, matriz e provas independentes](../evidencias/revalidacao-CF-028-R28/README.md).
**R28-01 encerrado; R28-02 parcialmente saneado, permanece aberto (P2).**
Agregados exatos e representação de conhecimento aprovados no recorte. Falta
determinar fontes afetadas/bloqueios quando reserva legada não tem vínculo de
fonte comprovado, sem liberar capacidade falsa nem bloquear fontes comprovadamente
independentes. E01 preservado; oito contraprovas causais confirmadas.

CF-028 permanece **em_revisao**, não aprovada integralmente. Sanear somente esse
resíduo documental e revalidar; aceites anteriores e encerramento R28-01 preservados.
Nenhuma implementação, liberação CF-029–034 ou início do fechamento frontend.

## Continuação documental R28-02 — origem incerta

Base `1c54533`, mesma branch. Política conservadora autorizada nesta conversa
incorporada como DEC-ONB-02: candidatas comprovadas, universo elegível quando
indeterminado, independência comprovada, união dos riscos e reconciliação atual
sem histórico fictício. [Evidências e encaminhamento](../evidencias/saneamento-CF-028-origem/README.md).
E21–E35 e revalidação documental E01/E16–E20; provas anteriores preservadas.
CF-028 **em_revisao**, R28-02 candidato a encerramento somente pelo revisor.
R28-01 encerrado e demais aceites mantidos; sucessoras/frontend não iniciados.

## Revalidação independente de origem — 10/10/2026

Candidato `dc02cd1`, intervalo `1c54533..dc02cd1`:
[parecer e provas independentes](../evidencias/revalidacao-CF-028-origem/README.md).
Política de fontes, evidências, união dos bloqueios, reconciliação e concorrência
atendidas. **R28-02 permanece aberto (P2) somente por inconsistência documental
introduzida nos totais por dimensão; CF-028 permanece em_revisao.** E23/E28/E34
têm universo apenas ACCOUNT e nominal400, mas esperam UNKNOWN em reservedAccounts;
E32 deve totalizar500 (400 legado +100 independente), mas espera PARTIAL100.
O texto já exige contar nominal uma vez quando todas as origens possíveis são
do mesmo tipo. Corrigir somente avaliador/fixtures/esperados desse ramo, mantendo
bloqueios e controles de universo misto/sem fontes, e revalidar o delta.

14 conjuntos/status, seis snapshots/hashes e nove contraprovas conferidos;
divergência reproduzida por oráculo independente. E01, E16–E20, R28-01 e demais
aceites preservados. Não há nova decisão de produto pendente nem revisão global
requerida. Sem implementação, CF-029, frontend, push/deploy ou banco real.

## Saneamento residual dos totais R28-02

Sobre `bbbe8c3`, corrigidos somente os totais E23/E28/E34=KNOWN400.00 e
E32=KNOWN500.00, com avaliador/fixtures coerentes e regressão dirigida.
[Evidência e encaminhamento](../evidencias/saneamento-CF-028-totais/README.md).
Demais campos e aceites preservados, incluindo R28-01 encerrado. CF-028 permanece
**em_revisao** e R28-02 aguarda revalidação independente, sem autoaprovação.
