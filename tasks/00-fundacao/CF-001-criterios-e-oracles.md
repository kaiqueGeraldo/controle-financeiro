# CF-001 — Fixar critérios e resultados esperados independentes

- Estado: concluida
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: xhigh
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: nenhuma
- Origem: T-001, T-011; F-012, F-015

## Problema e resultado esperado

Os testes atuais cobrem helpers, mas não demonstram persistência ou coerência entre telas. Fixar o que significa correto antes das próximas alterações.

## Escopo e referências

- `docs/sdd/specs/`
- `tasks/POLITICA-DE-TESTES.md`
- `controle-financeiro-frontend/tests/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Criar matriz requisito → cenário → camada de teste → tarefa responsável; usar IDs AC-TIME, AC-UI e AC-FIN.
2. Definir fixtures sintéticas de dois usuários e oracles de datas, saldos e apresentação sem chamar funções da aplicação.
3. Distinguir erro visual, erro de contrato, regra ambígua e indisponibilidade; definir severidade e roteiro exploratório.

## Aceite e testes adversariais

- [x] Cada F-001 a F-017 está ligado a uma tarefa e critério; hipóteses não recebem resultado inventado.
- [x] Casos de meia-noite, mês curto, fuso divergente, reload, 4xx/5xx e texto longo têm expected explícito.
- [x] Revisar criticamente os testes existentes: documentar quais comportamentos não conseguem detectar.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Alterar regra financeira sem decisão registrada; implantar framework de testes nesta tarefa.

## Modelo e revisão

A tarefa envolve decisão de contrato ou revisão crítica entre domínios; o esforço adicional se concentra em ambiguidades e riscos. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Iniciada e concluída em 07/09/2026. Entregues a [matriz de 39 critérios](../../docs/sdd/specs/003-criterios-oracles.md), [fixtures e oracles de dois usuários](../../controle-financeiro-frontend/tests/oracles/README.md), [roteiro exploratório](../../docs/sdd/specs/003-roteiro-exploratorio.md) e revisão crítica dos testes (registro de execução privado). Todos os 17 achados têm critério/tarefa; nove decisões ainda abertas ficam com suas tarefas donas, sem cristalizar comportamento ambíguo.

Validação: runner Node existente aprovado em 15 execuções (cinco testes em três fusos); verificador dos artefatos aprovado para referências, identidades e exemplos independentes. Tentativa via npm falhou por instalação local (`npm-cli.js` ausente); registrada como ambiente, não regressão de produto. Nenhum teste anterior foi alterado, nenhuma regra financeira implementada e nenhum framework instalado. Banco, browser/E2E e revisão independente não executados nem declarados aprovados.

Evidência completa, comandos e limitações (registro de execução privado). Base inicial (registro de execução privado) e conferência final preservam todos os arquivos preexistentes, exceto a atualização autorizada deste arquivo. Conclusão limitada à fundação de critérios.

Dependências: CF-004 fica liberada nesta base local; CF-002/003 já estavam prontas. CF-016 continua dependendo de CF-004. Para outro checkout, integrar o patch inicial e esta entrega antes de executar dependentes; nenhuma tarefa seguinte foi iniciada ou teve status alterado.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


## Revisão independente — 09/09/2026

Critérios/oracles e referências revalidados; validação documental não foi confundida com produto.

O parecer da revisão (registro de execução privado) prevalece
sobre a conclusão histórica acima para o aceite atual. Somente o conjunto final
foi verificado; commits intermediários não são apresentados como testados.
