# CF-019 — Validar faturas, parcelamento e pagamento

- Estado: proposta
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

- [ ] Soma das parcelas é o valor exato da compra; competência e limite obedecem CF-016.
- [ ] Pagamento reduz saldo e obrigação uma vez, não duplica despesa; segunda tentativa não repete baixa.
- [ ] Retry de fechamento/cron não duplica fatura/parcela; erro de operação intermediária faz rollback.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Regras bancárias supostas sem contrato ou reconstrução fictícia de histórico passado.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-019/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

