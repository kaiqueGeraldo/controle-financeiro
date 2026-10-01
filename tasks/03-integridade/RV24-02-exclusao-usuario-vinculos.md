# RV24-02 — Corrigir exclusão de usuário com vínculos financeiros

- Estado: proposta
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

- [ ] Contrato vermelho original passa por correção causal, com pagamento/alocação presentes.
- [ ] Usuário com vínculos representativos é removido sem órfãos; outro owner permanece intacto.
- [ ] Falha intermediária faz rollback completo e preserva cache anterior.
- [ ] Commit invalida cache no escopo declarado; nenhum efeito externo real durante testes.
- [ ] Recibos novos/herdados e vínculos entre domínios têm política e evidência de remoção.

## Evidência e revisão

Usar `tasks/evidencias/RV24-02/`, PostgreSQL descartável e política de testes.
Tarefa apenas registrada; não corrigida nesta revisão e não transferida para
CF-025. Exclusão completa continua sem aceite até satisfazer estes critérios.
