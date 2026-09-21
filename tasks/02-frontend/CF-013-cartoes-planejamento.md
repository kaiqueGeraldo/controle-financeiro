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

Implementada em 13/09/2026 sobre `main`, HEAD `1ced2f027fa46ab265b211829375581880cbb07b`, preservando todas as alterações locais preexistentes. O cartão é acionável por teclado, o detalhe de fatura é um diálogo nomeado e tipado, e o pagamento aguarda a releitura antes de fechar; falhas de resultado desconhecido preservam os dados e orientam reconciliação. A validação de componente, typecheck e lint focal foram aprovadas; a mutação que remove o `await` falhou pelo fechamento prematuro e foi restaurada. [Evidência completa, comandos e limites](../evidencias/CF-013/README.md).

Estado em revisão, não concluído: faltam captura visual em navegador e E2E BFF→Spring→PostgreSQL com reload. O build local ficou bloqueado apenas pelo download de fontes Geist em `fonts.googleapis.com`; o aviso de `middleware` depreciado é preexistente. O usuário confirmou a finalização das tarefas anteriores, mas CF-005 e CF-008 ainda registram `em_revisao`, divergência documental mantida como limitação. CF-019 continua dona de algoritmo bancário e da representação de pagamento parcial; este lote não mudou esses cálculos.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Parecer independente CF-015 — 14/09/2026

R03: pagamento fecha sem reconciliar após 503; R05: erro de leitura vira vazio; R06: POST de planejamento aceita categoria alheia e persiste; R08/R10: foco/layout. O PUT de planejamento saneado foi revalidado; isso não aprova criação ou pagamento.

Estado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.

## Candidato de saneamento CF-015 — 21/09/2026

R03 distingue recusa, confirmação com releitura pendente e resultado desconhecido; recovery não repete POST. A proteção backend contra fechamento repetido/concorrente é localizada e não encerra CF-024. R05 explicita indisponibilidade; R06 protege categorias em todos os writers investigados; R08/R10 tratam foco e geometria.

[Registro do saneamento e evidências](../evidencias/saneamento-CF-015/README.md).
Estado mantido em_revisao; fechamento depende de nova revisão independente.
CF-016 não iniciada. P01/P02/CF-017 mantém adoção temporal pendente; testes
sintéticos não certificam migração ou publicação. O parecer anterior permanece
preservado como registro histórico.

## Revalidação independente CF-015 — 21/09/2026

R05/R06/R08 revalidados. Pagamento sequencial e jornada BFF/Spring/PostgreSQL/reload aprovados, mas R03 permanece aberto por RV01: sobreposição de refresh absorve falha e fecha modal. Corrigir esse bloqueio; idempotência durável CF-024 não foi encerrada. Estado em_revisao mantido.

[Parecer, rastreabilidade e execuções](../evidencias/revalidacao-CF-015/README.md).

## Correção dirigida R03/RV01 — 21/09/2026

Reconciliação substituída não resolve como sucesso: o modal conserva confirmação
financeira e atualização pendente, com recuperação por leitura sem reenviar.
O teste intacto do revisor falhou antes e passou depois da correção. Candidato
aguarda confirmação independente; estado em_revisao mantido, sem reabrir R05/R06/R08
ou alterar regras backend/CF-024:
[rodada, cenários e limites](../evidencias/saneamento-CF-015-RV01/README.md).
