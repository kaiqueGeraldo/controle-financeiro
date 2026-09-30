# CF-019 — Validar faturas, parcelamento e pagamento

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-006](../01-datas-integracao/CF-006-datas-backend.md), [CF-016](../03-integridade/CF-016-regras-financeiras.md), [CF-017](../03-integridade/CF-017-migracoes.md), [CF-018](../03-integridade/CF-018-contas-transacoes.md)
- Origem: T-004, T-009; fluxo de cartões

## Problema e resultado esperado

Cartões combinam competência, limite, parcelas e pagamento parcial. Pequena divergência temporal ou arredondamento pode gerar dívida duplicada.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/CreditCardService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/InvoiceCronService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/listener/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/card/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Definir exemplos de compra antes/no/depois do fechamento, vencimento 29–31, parcelamento e última parcela em centavos.
2. Testar pagamento parcial/total/antecipado, rolagem, exclusão/estorno e limite comprometido com banco real descartável.
3. Preparar representação de dívida inicial/faturas futuras para onboarding sem fabricar parcelas pagas.

## Aceite e testes adversariais

- [x] Soma das parcelas é o valor exato da compra; competência e limite obedecem CF-016.
- [x] Pagamento reduz saldo e obrigação uma vez, não duplica despesa; segunda tentativa não repete baixa.
- [x] Retry de fechamento/cron não duplica fatura/parcela; erro de operação intermediária faz rollback.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Regras bancárias supostas sem contrato ou reconstrução fictícia de histórico passado.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Implementação local encerrada em 28/09/2026 sobre `a2a7761bc57e95c0757f304cb9c0e7f0a65008d6`, com a alteração preexistente de `README.md` preservada. A política gerencial DEC-03 foi escolhida explicitamente pelo usuário e registrada em SPEC-002/004. Testes com PostgreSQL descartável cobrem centavos, ciclo, dívida/limite, pagamento, estorno, abertura, concorrência, rollback e migração. A tarefa segue `em_revisao` até revisão independente; não há certificação de banco real ou emissor. CF-006, CF-017 e CF-018 têm implementação integrada localmente, porém permanecem `em_revisao`; adoção em banco real segue bloqueada. Evidências, comandos e limites em [CF-019](../evidencias/CF-019/README.md).

CF-019 satisfaz sua parte das dependências de CF-021/024/027/028/030, ainda com outras pendências; nenhuma dessas tarefas está integralmente liberada por este fechamento. CF-020 não depende de CF-019 e já tinha base local integrada, sujeita aos estados de revisão das próprias dependências.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Saneamento do marco em 30/09/2026

RVI-11/12 e compras dependentes de metas: intenção identificada e fingerprint persistidos, GET recupera recibo após resposta perdida, refresh não repete POST e valor sugerido usa saldo pagável/crédito. Compra 120 após pagamento 20 ou 120 conserva histórico após excluir meta; reembolso deixa banco 980/880, dívida 0 e crédito 20/120, sem repetição. Dívida/crédito agregado validados antes do commit.

[Matriz, checkpoints e limitações](../evidencias/saneamento-CF-016-CF-021/README.md). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.
