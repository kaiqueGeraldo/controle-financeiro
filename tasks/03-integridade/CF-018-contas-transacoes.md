# CF-018 — Corrigir contas, abertura e fluxo de transações

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md), [CF-016](../03-integridade/CF-016-regras-financeiras.md), [CF-017](../03-integridade/CF-017-migracoes.md)
- Origem: T-004; F-009

## Problema e resultado esperado

É necessário distinguir abertura, previsão e fluxo realizado sem quebrar transferência, edição, exclusão ou saldo negativo.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/AccountService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/TransactionService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/account/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/transaction/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Aplicar modelo de abertura e filtros realizados da CF-016 com migração versionada se necessária.
2. Testar crédito/débito/transferência e transições pendente→pago→estornado, incluindo edição e exclusão de item gerenciado.
3. Conciliar saldo de conta, extrato e agregados a partir de fixtures independentes e cenários de erro.

## Aceite e testes adversariais

- [x] Saldo inicial positivo/zero/negativo concilia e não entra como receita do período.
- [x] Transferência conserva patrimônio; item pendente não muda realizado; baixa/estorno acontece uma vez.
- [x] Falha no segundo lado da transferência reverte tudo no PostgreSQL; teste detecta remoção de filtro isPaid/origem.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Alterar produção por heurística textual, ignorar versão otimista ou compensar divergência só no dashboard.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Execução iniciada em 22/09/2026 sobre `0cc24b7`, somente em PostgreSQL
descartável e com o `README.md` preexistente preservado fora do staging. Usar
`tasks/evidencias/CF-018/README.md` com o [template](../templates/EVIDENCIA.md).
Registrar critério, comando, versão/diff testado, resultado anterior/posterior,
dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência
das correções anteriores não equivale à conclusão desta tarefa.

Gate de início revisado em 22/09/2026: **pode iniciar localmente** sobre V1/V2 em
PostgreSQL descartável. A parte necessária de CF-008 (contratos HTTP/temporais de
contas/transações) está comprovada nos limites registrados; pendências de
planejamento, hábitos, UI e a política global CF-023/024 não exigem encerrar toda
a CF-008 antes desta implementação. Adoção de banco real continua bloqueada e não
faz parte dessa autorização local. [Parecer dirigido CF-017](../evidencias/revisao-CF-017/README.md).

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

Implementação local encerrada em 28/09/2026 no commit de produto `4203f18`,
com V3 aditiva, 24 regressões PostgreSQL da CF-018, 8 verificações de migração
e a suíte backend completa em 136/136. A [evidência](../evidencias/CF-018/README.md)
registra a reprodução anterior, comandos, atomicidade, concorrência, trade-offs
e limites. O estado é `em_revisao`: não houve revisão independente nesta
execução, nem baseline/migração em banco real. RV17-01/RV17-02, backup/restore e
adoção temporal real permanecem abertos exatamente como na revisão CF-017.
