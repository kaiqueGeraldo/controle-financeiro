# CF-013 — Auditar e corrigir cartões, faturas e planejamento

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-005](../01-datas-integracao/CF-005-datas-frontend.md), [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](../02-frontend/CF-010-componentes-comuns.md)
- Origem: T-008; F-015

## Problema e resultado esperado

Faturas e planejamento reúnem datas, competências e status que podem divergir visualmente. Validar a navegação e apresentação sem redefinir fechamento bancário.

## Escopo e referências

- `controle-financeiro-frontend/src/screens/private/cards/`
- `controle-financeiro-frontend/src/screens/private/planning/`
- `controle-financeiro-frontend/src/components/screens/cards/`
- `controle-financeiro-frontend/src/components/screens/planning/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Cobrir fatura vazia/aberta/paga/parcial, lista longa, troca de cartão/mês e formulário de pagamento.
2. Comparar vencimento/fechamento/status entre resumo e detalhe; usar dados conhecidos para esperado visual.
3. Corrigir truncamentos, área de clique, estados de botão e erro; registrar dúvidas monetárias para CF-019.

## Aceite e testes adversariais

- [ ] Mesma competência permanece selecionada e datas não recuam; status após operação é confirmado pela API/reload.
- [ ] Valores extensos e lista longa não escondem ação de pagamento em mobile.
- [ ] Falha ou conflito conserva estado recuperável; snapshot é inspecionado e ligado ao defeito.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Alterar algoritmo de fatura ou duplicar dívida no frontend para alinhar uma label.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-013/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Parecer independente CF-015 — 14/09/2026

R03: pagamento fecha sem reconciliar após 503; R05: erro de leitura vira vazio; R06: POST de planejamento aceita categoria alheia e persiste; R08/R10: foco/layout. O PUT de planejamento saneado foi revalidado; isso não aprova criação ou pagamento.

Estado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.
