# CF-007 — Validar datas pelo fluxo navegador–API–banco

- Estado: concluida
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-002](../00-fundacao/CF-002-ambiente-backend.md), [CF-003](../00-fundacao/CF-003-harness-frontend.md), [CF-005](../01-datas-integracao/CF-005-datas-frontend.md), [CF-006](../01-datas-integracao/CF-006-datas-backend.md)
- Origem: T-002, T-008, T-010; F-001–004

## Parecer vigente — 08/10/2026

**Concluída no escopo local original**, após confronto separado dos quatro
critérios: data escolhida preservada ao criar/editar/reabrir, erro 400 sem
persistência e com entrada recuperável, sensibilidade integrada à alteração
de dia na API, evidências e limites. Reutilizados os aceites F/V/R/U e suas
bases, reconferidos diffs/consumidores e complementados com testes atuais.
Não houve novo Playwright nesta revisão; as jornadas históricas permanecem
identificadas como tais, sem contagem duplicada.

Matriz, parecer individual, comandos e limites (registro de execução privado),
base `1b0d9bcefaba0bcc37a21955caa94db65a3bf383`. RD58-01/02 mantêm CF-005/006
em revisão, mas não violam a data escolhida nas jornadas próprias comprovadas
desta tarefa. Capacidades temporais consumidas têm liberação independente e
foram reconferidas; não houve alteração das arestas de dependência.
P01/P02 reais permanecem CF-017; nenhuma certificação Railway/publicação.
A aresta CF-007 de CF-015 está satisfeita, sem encerrar o marco frontend.
Esta decisão supera as pendências genéricas das notas históricas abaixo.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categorias 1 e 5: P03/P04/P05 foram revalidados; falta parecer final sobre criar/editar/reabrir, erro recuperável e sensibilidade do E2E, confrontando as jornadas existentes e mudanças posteriores. Adoção P01/P02 conserva gate próprio. Não executar novamente toda a matriz apenas pelo estado em revisão.

Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências (registro de execução privado). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Consolidação documental — 01/10/2026

P03/PUT, P04/relógios e P05/diaProduto foram revalidados na revisão CF-015; o checklist
histórico de pendências não significa que esses três defeitos ainda exigem correção.
Estado `em_revisao` mantido: o parecer posterior não concedeu conclusão integral e
preservou condições P01/P02. Próximo parecer deve confrontar os critérios com a evidência
temporal já existente e delimitar aceite local versus adoção real, sem repetir auditoria
ampla por status.

Snapshot, evidências, condições e limites (registro de execução privado).
As seções datadas abaixo preservam o histórico de suas respectivas bases.

## Problema e resultado esperado

Uma label correta com payload errado ainda grava o dia incorreto. Testar criação, leitura, edição e reload pelo BFF e backend reais.

## Escopo e referências

- `controle-financeiro-frontend/tests/`
- `controle-financeiro-backend/src/test/`
- `docs/sdd/specs/002-datas.md`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Criar transação, compra de cartão, operação de investimento, meta e registro de hábito por fluxos reais disponíveis.
2. Validar payload/resposta, persistência e apresentação após reload; combinar JVM UTC com browser São Paulo e UTC+14.
3. Controlar hoje e navegar mês/ano; comparar listagem, detalhe, dashboard e exportação quando o campo existir.

## Aceite e testes adversariais

- [x] O mesmo registro conserva a data escolhida ao criar/editar/reabrir; backend e browser não precisam ter o mesmo TZ.
- [x] Falha de gravação não deixa uma data visualmente salva sem persistência; 400 mantém entrada recuperável.
- [x] Fluxo integrado falha se a API alterar o dia; não validar E2E usando mock do serviço financeiro.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Teste apenas de screenshot, cobertura de todo o onboarding ainda inexistente.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Concluída em 08/09/2026 sobre `main` (`HEAD 169d7be4c7d3db97d4c318ff3f99d9de3a808067`), preservando o patch local das CF-001–006. Foi adicionada uma jornada Playwright real que atravessa navegador, BFF Next, Spring e PostgreSQL descartável para transação, cartão, investimento, meta, hábito e exportação, com JVM UTC e Chromium em São Paulo/UTC+14. O cenário compara payload, resposta, SQL e UI após reload, mantém o formulário recuperável em 400 e não simula sucesso das APIs financeiras.

Validação final: matriz integrada 2/2, backend `clean verify` 45/45, frontend unitário 15/15 em três fusos, componentes 11/11, typecheck, lint dos E2Es e build Next aprovados. Uma mutação temporária de `date.plusDays(1)` falhou com esperado `2027-01-30`/recebido `2027-01-31`, foi removida e seguida da execução verde. Evidência completa, falhas encontradas, comandos e riscos (registro de execução privado).

Limites principais: o relógio do middleware de autenticação não é injetável; fatura ainda não expõe horário; o carregamento único de hábitos evita N+1 mas materializa todos os logs; duas violações `no-explicit-any` preexistentes permanecem fora das linhas alteradas. Contratos detalhados, migrações e lint amplo continuam em suas tarefas próprias.

Dependências: nenhuma tarefa nova ficou integralmente liberada apenas por esta conclusão. A CF-015 passa a ter a CF-007 satisfeita, mas ainda aguarda CF-009 e CF-011–014. CF-008 e CF-010 já estavam liberadas e permanecem executáveis. Nenhuma tarefa seguinte foi iniciada ou teve seu estado alterado.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


## Revisão independente — 09/09/2026

Jornadas reais São Paulo/UTC+14 aprovadas; P04 (relógio real do middleware) e P05 (dias divergentes) impedem aprovação integral.

O parecer da revisão (registro de execução privado) prevalece
sobre a conclusão histórica acima para o aceite atual. Somente o conjunto final
foi verificado; commits intermediários não são apresentados como testados.

- [ ] Fechar as pendências atribuídas a esta tarefa no parecer independente.

## Saneamento — 13/09/2026

P04 separa relógios somente no harness; P03 tem percurso de edição UI/BFF/Spring/PostgreSQL. Os gates e tentativas finais estão na evidência de saneamento.

Implementação, autotestes e limites (registro de execução privado).
Estado permanece em_revisao; esta execução não substitui revisão independente.
