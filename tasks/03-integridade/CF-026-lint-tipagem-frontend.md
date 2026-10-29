# CF-026 — Eliminar dívida de lint e tipagem sem esconder defeitos

- Estado: concluida
- Prioridade: P2
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-009](../01-datas-integracao/CF-009-estado-assincrono.md), [CF-015](../02-frontend/CF-015-revisao-marco-frontend.md)
- Origem: T-011; F-017

## Aceite independente — 03/10/2026, candidato 06c1a51

Quatro critérios aceitos no intervalo `5f26a1d..30211b8`, reconferido no candidato. Parecer separado (registro de execução privado) e matriz (registro de execução privado): narrowing real de preferências/erros, DTOs/efeitos preservados, cleanup por geração/token; contraprovas históricas e de geração falham causalmente, restauração23/23. Lint247 alvos0/0, typecheck/build e regressões atuais aprovados sem exclusões/ignores ou weakening.

RVR24-01 permanece com RV24-01, introduzida depois deste lote; não é aceito nem duplicado como defeito CF-026. CF-009/015 continuam em_revisao. Satisfeitas somente suas arestas CF-032/034; não há aceite de todos os fluxos financeiros, matriz visual ou produção. Notas abaixo são históricas.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categoria 1: revisão independente de 5f26a1d..30211b8, não nova implementação de lint. Examinar narrowing/efeitos/cleanup, contraprovas, consumidores e gates, distinguindo RV24 posterior. Condição: parecer próprio pelos quatro critérios sem supressões. Aprovação satisfaz suas arestas CF-032/034; CF-009/015 não precisam ser artificialmente concluídas.

Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências (registro de execução privado). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Problema e resultado esperado

Baseline de 70 erros e 37 avisos precisa ser reavaliado após correções. Tipagem e hooks devem revelar contratos, não silenciar o compilador.

## Escopo e referências

- `docs/sdd/lint-baseline.md`
- `controle-financeiro-frontend/src/`
- `controle-financeiro-frontend/eslint.config.mjs`
- Exceção de escopo justificada nesta execução: `controle-financeiro-frontend/tests/component/async-state.test.tsx` (dois bindings ociosos da baseline, sem alteração de assertions) e `controle-financeiro-frontend/tests/component/cf026-contracts.test.tsx` (regressões das fronteiras desconhecidas e cleanup dos consumidores alterados, no harness integrado). Nenhuma configuração/exclusão de teste será modificada.

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Reexecutar baseline e corrigir por regra/arquivo em lotes: DTOs desconhecidos, hooks, componentes estáticos, entidades JSX e variáveis.
2. Substituir any por contratos/unknown com narrowing, sem casts cegos; preservar efeitos e dependências funcionais.
3. Rodar testes dos consumidores a cada lote e atualizar baseline/resultados; escalar para Sol quando o problema for arquitetura de estado.

## Aceite e testes adversariais

- [x] Lint final sem erros e avisos não justificados; nenhum disable global/ts-ignore/any artificial para passar.
- [x] Remover variável não remove efeito colateral necessário; alteração de hook tem regressão de atualização/cleanup.
- [x] Typecheck/build e fluxos tocados continuam aprovados; baseline não é reduzido apenas excluindo arquivos.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Reescrever todas as telas ou enfraquecer regras sem justificativa do contrato.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

### Retomada local — 01/10/2026

Execução iniciada sobre `5f26a1d`, usando a liberação independente residual em
`0099185`, reconferida pela consolidação de `5f26a1d`. Limite: lint, contratos
de apresentação e cleanup; os achados funcionais/adoção/zoom listados abaixo
continuam com seus donos. README raiz preservado. Evidências novas em
`tasks/evidencias/CF-026/execucao/`, separadas da preparação histórica.

Entrega do executor pronta para revisão independente: lint **0 erros/0 avisos**
em 236 arquivos (234 anteriores preservados, dois novos), typecheck/build
aprovados, 180 testes de componente e 6 unitários em cada um dos três fusos.
Tipos explícitos para erro, aporte/protocolo, reorder, callbacks, datas de hábitos
e ícones; configuração do painel validada como `unknown`; cleanup captura a
instância do mapa de locks. Bindings removidos preservam chamadas e tratamentos.

Resultados esperados: campos válidos preservados; JSON não-array/membros inválidos
usam defaults; IDs duplicados conservam a primeira entrada; larguras respeitam
as opções existentes por cartão. Erro desconhecido apresenta fallback textual,
sem fechar formulário por sucesso. Rejeição 409 mantém a solicitação de releitura
do consumidor existente; isso não certifica a regra financeira de conflito.
Essas decisões de fronteira estão registradas nos oráculos da evidência.

Contraprovas na base original isolada falham por parser/erro inválido; restauradas
passam. Remover geração em cópia do hook falha nos cenários de sessão/unmount;
restauração e preservação comprovadas por SHA-256. Não houve relaxamento de
assertions, skips no código de teste, configuração, exclusões ou regras.

Entrega, critério→cenário→red/green, comandos e limites (registro de execução privado).
`em_revisao` conserva a distinção entre validação do executor e aceite independente.
Os checkboxes registram as provas do executor, sem aprovar o marco CF-009/015,
RV24-01/02, RVA-03, RJ-022-01/H24-01, zoom, migrações ou publicação. Nenhuma tarefa
seguinte ficou integralmente liberada: CF-032/034 ainda exigem aceite aplicável da
CF-026 e suas demais dependências. A revisão deste candidato é o próximo passo.

### Liberação pré-execução — consolidação documental de 01/10/2026

**CF-026 apta a retomar localmente no escopo de lint e tipagem.** Estado
pré-execução `pronta`; nenhuma correção executada e nenhum aceite marcado.
O bloqueio registrado em `c7f7ffc` fica superado documentalmente, preservado abaixo.

A liberação independente residual (registro de execução privado)
em `0099185` já permitia esse recorte sem concluir CF-009/015. O confronto com
as revisões CF-022/023 e CF-024, RV24-01/02 e a entrega CF-025 em `65ec14e`/`04cad8d`
não encontrou impedimento posterior concreto ao início desses lotes na base
`c7f7ffc`. Decisão, arquivos da baseline e limites (registro de execução privado).

CF-009/015 continuam `em_revisao`. RV24-01, RVA-03, RJ-022-01, H24-01 e zoom
nativo 200% não foram encerrados. Mudanças em hooks, sessão ou consumidores dos
fluxos afetados exigem reconferência e testes específicos, sem atribuir correção
funcional a uma limpeza de lint. Escalar defeitos encontrados com ID/dono/evidência;
se um lote depender da correção funcional, delimitar seu bloqueio e prosseguir
apenas nos lotes independentes comprovados.

Na execução futura: reconferir HEAD/diffs e baseline, corrigir em lotes,
preservar contratos/efeitos colaterais, validar consumidores e atualização/cleanup,
rodar typecheck, build e lint. Proibidos casts cegos, ignores e exclusões para
mascarar problemas. A baseline existente é 23 erros/21 avisos e typecheck aprovado;
não foi reexecutada nesta consolidação. CF-032/034 continuam exigindo aceite CF-026;
nenhuma homologação/publicação ou tarefa posterior está autorizada por esta nota.

### Histórico — preparação de 01/10/2026, registrado em c7f7ffc

Preparação executada em 01/10/2026 na base `04cad8d072f789fbe3f4050d8912d5526ec600f5`.
Implementação bloqueada: CF-009 e CF-015 permanecem `em_revisao` nos
arquivos canônicos integrados. CF-015 registra zoom nativo 200% sem evidência
nem aprovação; o encerramento dirigido de RV01 não concluiu o marco.
A instrução desta execução exige respeitar as dependências, sem antecipar
correções nem executar outra tarefa para encerrá-las.

Diagnóstico sem alterações de código: lint com 23 erros e 21 avisos em 234
arquivos; typecheck aprovado. A baseline histórica de 70/37 foi preservada
e a medição atual adicionada ao documento de referência. Nenhuma regra,
exclusão, contrato ou teste foi alterado. Build, testes dos consumidores,
regressões e revisão das correções não executados, pois não houve implementação.

Evidências, comandos, preservação e limitações (registro de execução privado).
Retomar após conclusão e integração de CF-009 e CF-015, com nova medição da
base então usada. Nenhum critério de aceite foi marcado como cumprido e
nenhuma tarefa ficou liberada; CF-032 e CF-034 mantêm CF-026 pendente.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.
