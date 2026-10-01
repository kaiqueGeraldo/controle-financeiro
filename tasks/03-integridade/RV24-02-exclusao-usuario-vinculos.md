# RV24-02 — Corrigir exclusão de usuário com vínculos financeiros

- Estado: concluida
- Prioridade: P2
- Marco: integridade
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: schema e contratos CF-018/019/020/023/024 integrados
- Origem: revisão independente CF-024, RV24-02; funcionalidade UserService.deleteAccount

## Problema e resultado esperado

Usuário com compra paga não pode ser excluído: UserService.java:82 remove
CardTransaction antes de CardPaymentAllocation e viola FK. Rollback conserva
dados/cache, mas a operação funcional não conclui. A limpeza autorizada do
proprietário deve respeitar o grafo de dependências e não atingir outro owner.

## Escopo e referências

`controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/UserService.java`,
repositórios e vínculos necessários à exclusão. Ver
[contrato vermelho, rollback e limites](../evidencias/revisao-CF-024/ACHADOS.md).
Não confundir esta entrega com o aceite de isolamento da CF-023 nem com bare
deletion/cache da CF-024. Nenhuma limpeza de dados reais está autorizada aqui.

## Trabalho

1. Inventariar FKs e política de remoção dos fatos, alocações, correções e recibos
   V13/herdados, preservando fronteiras de owner e integridade transacional.
2. Corrigir a ordem/estratégia somente depois de reproduzir; não presumir que
   uma troca pontual de deletes resolve todos os vínculos.
3. Validar sucesso e falha intermediária por proxy real; verificar efeito de
   notificações externas com double e contrato explícito de pós-commit.

## Aceite e testes adversariais

- [x] Contrato vermelho original passa por correção causal, com pagamento/alocação presentes.
- [x] Usuário com vínculos representativos é removido sem órfãos; outro owner permanece intacto.
- [x] Falha intermediária faz rollback completo e preserva cache anterior.
- [x] Commit invalida cache no escopo declarado; nenhum efeito externo real durante testes.
- [x] Recibos novos/herdados e vínculos entre domínios têm política e evidência de remoção.

## Evidência e revisão

Usar `tasks/evidencias/RV24-02/`, PostgreSQL descartável e política de testes.
Na revisão original CF-024, tarefa apenas registrada; não corrigida naquela revisão
e não transferida para CF-025. Exclusão completa exige o aceite destes critérios.

## Entrega de saneamento — 01/10/2026

UserService corrige a ordem do grafo completo e agenda email após commit;
constraints/migrações e alcance de cache CF-024 preservados. Vínculos inconsistentes
de outro proprietário são rejeitados com rollback, inclusive SET NULL/UUID legado.
Checkboxes registram evidência do executor, não revisão independente.
[FKs, contraprovas, grafo29 tabelas, rollback/cache/efeitos externos e limites](../evidencias/RV24-02/README.md).
Gate afetado135/135 e gate dirigido final6/6 têm subconjuntos sobrepostos.
Nenhuma exclusão de usuário real, migração nova, push ou deploy. CF-027 não executada
e sua prontidão continua sujeita a avaliação independente posterior.

## Revalidação independente — 01/10/2026

**Concluída no contrato de exclusão integral autorizada do proprietário.** FK da
compra comum paga reproduzida com UserService histórico em cópia; candidato6/6
e três probes adicionais aprovados. Grafo29 tabelas/FKs/UUIDs herdados confrontado;
outro owner permanece integralmente igual; rollback intermediário conserva
dados/cache e não envia email. Outra conexão vê o commit quando o double de
email é chamado; falha de submissão não alega rollback. Writer concorrente
espera e falha sem fato/recibo órfão. Gate afetado139/139 verify/JAR, R03 4/4;
contagens sobrepostas. [Parecer e limites](../evidencias/revalidacao-RV24-01-RV24-02/README.md).

Não há garantia durável de email, ausência universal de deadlocks ou política
completa de cache de leitura. Alcance global herdado de evicção preservado.
RV24-01 continua em_revisao pelos resíduos próprios; CF-019/022/026 e pendências
anteriores não foram encerradas. Produto/migrações/README alheio preservados;
sem banco real/email real/push/deploy. CF-027 não foi executada.
