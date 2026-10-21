# Matriz prévia da revalidação — 21/10/2026

Candidato c13aecd; base 251d6c7. Sem alterações de produto.

| Item | Oracle independente | Evidência entregue / lacuna e execução escolhida |
|---|---|---|
| RC030-01 | FIN-03: encargos conhecidos elegíveis antes do principal por competência/parcela/ID; débito e alocações exatos; UNKNOWN preservado | Reler planner e consulta, executar controles de pagamento menor/igual/maior que encargos, quitação, excesso, rollback, replay e CF019/024 |
| RC030-02 | CivilDate 0001–9999; configuração autoritativa; rejeitar derivados fora da faixa sem efeitos | Executar CREATE/INITIALIZE, futura e override; acrescentar HTTP estrito para inválido e prova independente das três colunas civis |
| Binding Invoice | DATE persiste/restitui exatamente LocalDate, sem calendário intermediário; leitura de dados SQL existentes e update preservam literal | Acrescentar limites, corte gregoriano, bissexto/secular e datas ordinárias em UTC/SP/+14 efetivos, consulta JPA e serialização |
| RC030-03 | Somente inteiro JSON 1, erro400 de campo, sem writes; erro interno legítimo500 | Executar matriz HTTP prepare/complete, conflitos de revisão separados e falha interna induzida |
| Observador | Rejeição específica antes do commit deve ser aceita; aceitação indevida precisa continuar falhando | Conferir diff/original/erro histórico; mutação sem proteção civil em cópia deve falhar também no observador adaptado |
| Integração | Guard/ordem/transação/ownership/recibo preservados; migração não alterada | Inspecionar delta e executar seleção afetada; reaproveitar matriz geral anterior sem nova auditoria |

Contraprovas novas em cópia dedicada: pagamento antigo, validação civil antiga,
binding antigo e versão antiga; restauração por hash e controle positivo. Contar
casos sem sobreposição. Conferir alegação de custo separando planner O(N) da
ordenação SQL e das escritas/eventos por fatura. Sem certificação de produção.
