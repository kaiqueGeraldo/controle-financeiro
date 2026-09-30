# CF-022 — Validar hábitos e execução dos crons

- Estado: em_execucao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-006](../01-datas-integracao/CF-006-datas-backend.md), [CF-017](../03-integridade/CF-017-migracoes.md)
- Origem: T-010; investigação temporal

## Problema e resultado esperado

Hábitos dependem de dia/semana, ofensiva e jobs. O fuso do servidor e uma execução repetida não devem alterar contagem ou progresso vinculado.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/HabitService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/HabitCronService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/habit/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Especificar exemplos do comportamento existente de frequência/perdão, deixando ambiguidades explícitas.
2. Testar diário/semanal, marcar/desmarcar, semana/ano novo, repetição do job e vínculo com meta numérica.
3. Validar lock/scheduler no PostgreSQL isolado sem e-mail real.

## Aceite e testes adversariais

- [ ] Mesmo dia não ganha registros/progresso duplicados; desfazer marcação desfaz efeito correspondente.
- [ ] Trocar TZ da JVM não desloca dia do hábito definido no contrato; virada semanal preserva meta semanal.
- [ ] Duas execuções/retry do job preservam invariantes de ofensiva e histórico.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Novo módulo de rotina ou mudar regra de perdão sem decisão de produto.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Execução iniciada em 30/09/2026 sobre `6f0d474`. A revisão dirigida de resíduos
[libera CF-022 localmente](../evidencias/revalidacao-CF-016-CF-021-residuais/README.md),
usando a fundação descartável CF-006/017 integrada; não libera produção.
README raiz alheio preservado e excluído dos commits. DEC-08 aprovada pelo usuário
nesta execução; [contrato e exemplos independentes](../evidencias/CF-022/CONTRATO.md).
Exceções de caminho necessárias: migração aditiva em `src/main/resources/db/migration/`
para vínculo persistido de contribuição; testes em `src/test/java/.../domain/habit/`
e adaptação dos consumidores temporais existentes em `src/test/java/.../service/`.
Esses caminhos permitem validar Flyway/Hibernate e preservar o contrato temporal.
`domain/goal/GoalHistory.java`: retirar geração automática que sobrescreve o
Clock explícito nos dois writers existentes (HabitService e GoalService);
validação inclui consumidores de metas e contratos temporais. Os três testes
existentes de migração passam a exigir a versão 12 e checksum de V12, mantendo
todas as assertions históricas; adaptação restrita ao novo inventário aprovado.
SPEC-002 e matriz DEC-08 atualizadas para refletir a decisão explícita do usuário;
nenhuma outra tarefa foi iniciada. Harness de browser e isolamento de schema
ficam em `src/test/java/.../domain/habit/`, sem alterar produto frontend.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.
