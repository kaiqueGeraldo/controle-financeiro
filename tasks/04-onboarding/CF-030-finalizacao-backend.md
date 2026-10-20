# CF-030 — Finalizar onboarding com atomicidade e idempotência

- Estado: em_revisao (revisão independente concluída no candidato 89760e6; saneamento RC030-01/02 P2 e RC030-03 P3 pendente, exclusivamente local/descartável)
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-018](../03-integridade/CF-018-contas-transacoes.md), [CF-019](../03-integridade/CF-019-cartoes-faturas.md), [CF-020](../03-integridade/CF-020-investimentos-metas.md), [CF-024](../03-integridade/CF-024-concorrencia-cache.md), [CF-029](../04-onboarding/CF-029-rascunho-backend.md)
- Origem: T-006; F-008, F-009

## Problema e resultado esperado

Prontidão técnica em 19/10/2026: CF-018/019/020/024 concluídas e integradas;
CF-029 aceita independentemente no escopo local/descartável.
[Parecer e limites de dependência](../evidencias/revalidacao-CF-029-RC029-01/README.md).
O parecer de prontidão anterior não iniciou CF-030 nem autorizou publicação ou
adoção real. Em etapa posterior explicitamente autorizada pelo usuário, o lote
CF029 foi publicado/integrado e esta implementação partiu da main integrada.
Banco real e adoção CF017/P01/P02 continuam fora do escopo.

Reenvio ou falha no último item não pode duplicar patrimônio nem deixar metade da entrevista aplicada.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/`
- `controle-financeiro-backend/src/main/resources/`
- `controle-financeiro-backend/src/test/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Implementar confirmação que resolve referências e aplica aberturas/alocações/dívidas numa transação local.
2. Persistir chave de idempotência vinculada a usuário e conteúdo; restrições únicas e controle de versão defendem concorrência.
3. Publicar efeitos externos/invalidação após commit; evitar cotação/rede externa dentro da transação.

## Aceite e testes adversariais

- [x] Falha injetada no último item faz rollback integral; rascunho pode ser corrigido.
- [x] Mesma chave/conteúdo após timeout retorna resultado anterior; chave com outro conteúdo falha sem duplicar.
- [x] Duas conexões finalizando simultaneamente deixam uma única carteira/posição/dívida; totais coincidem com oracle.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

Marcações registram validação local do executor; não substituem aceite independente.

## Fora de escopo

Orquestrar vários cadastros pelo browser como garantia de atomicidade ou reaplicar abertura em conta legada.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Iniciada em 19/10/2026, prosseguindo em 20/10/2026 na branch local
`codex/cf030-aplicacao-onboarding`, base integrada `5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251`.
Lote CF029 publicado/integrado por autorização explícita; novos commits CF030
permanecem locais. [Matriz registrada antes da edição de produto](../evidencias/CF-030/MATRIZ.md).
Validação corrigida504/504, quatro mutações detectadas por assertions e controle
restaurado21/21; hashes dos400 fontes principal/cópia reconferidos. Falhas anteriores
preservadas com investigação causal. [Entrega, decisões, comandos e limites](../evidencias/CF-030/README.md).
[Roteiro da revisão independente](../evidencias/CF-030/REVISAO.md). Novos commits
permanecem locais. CF031/032 não iniciadas/liberadas; gate CF015/zoom e adoção real
CF017/P01/P02 preservados. Nenhum aceite antecipado.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Revisão independente — 20/10/2026

**Não aprovada no candidato `89760e64a73b6268d8cf34745cf41d6b00dcd781`.**
[Parecer, matrizes, reproduções e limites](../evidencias/revisao-CF-030/README.md).
Preservados os critérios sustentados de atomicidade, replay/recuperação,
concorrência dos writers participantes, E01, reservas legadas, precisão e migração.
195 casos distintos na seleção consolidada:191 passaram;4 assertions reproduzem
3 achados (2P2/1P3). Contraprova remove guard apenas em cópia: reserva1200 sobre
fonte1000; restauração por hash e controle positivo aprovados.

Pendente: prioridade de encargos entre linhas/faturas na leitura/pagamento das
aberturas (RC030-01), validação de vencimento calculado em INITIALIZE_EMPTY
(RC030-02) e erro400 para versão contratual fora da faixa (RC030-03).
Nenhum produto corrigido nesta revisão; probes vermelhos preservados.
CF031/032 não liberadas; CF031 continua dependendo também do gate CF015.
Zoom CF010/015 e adoção real CF017/P01/P02 permanecem separados e pendentes.

