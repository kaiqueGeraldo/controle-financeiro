# Evidência CF-005

- Estado real e data: concluída em 08/09/2026.
- Modelo/esforço usados: Codex, esforço alto; o identificador exato do modelo ativo não é exposto pelo runtime desta sessão.
- Commit/base e identificação do diff local testado: `main`, HEAD `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, sobre o patch local não commitado das CF-001–004. O `git status --short` inicial já continha as correções temporais em formulários, labels, hooks/contexto e os helpers/testes novos; nenhuma dessas mudanças foi descartada. A CF-005 acrescentou testes de consumidor, relógio compartilhado, captura única da abertura, saída neutra no detalhe e ordenação civil do extrato.
- Runtime, sistema, navegador, viewport, timezone e seed: Windows/PowerShell, Node `24.18.0`, Next `16.1.6`, React `19.2.3`, Vitest `4.1.11` + jsdom; componente em `America/Sao_Paulo`, relógio `2026-09-08T02:59:59.000Z`, seed `cf001-v1`. Unitários também executados em UTC e `Pacific/Kiritimati`. Não houve navegador real nesta tarefa.
- Dependências integradas: CF-003 e CF-004 concluídas na mesma base local; contrato normativo em [SPEC-002](../../../docs/sdd/specs/002-datas.md).

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| Data digitada = payload; hoje local | Às `2026-09-07 23:59:59` em São Paulo, o default civil é `2026-09-07`, embora o UTC seja `2026-09-08`; campo aberto não muda e nova abertura recalcula. Data/hora vêm do mesmo instante. | `temporal-forms.test.tsx`; suíte de componente | Os quatro formulários usam dia local; transação preserva `2024-02-29` e `23:59` no payload; após reabrir usa `2026-09-08 00:00`. |
| Label não desloca/normaliza dia | `2026-09-07` apresenta `07/09/2026` em qualquer fuso; `2026-02-29` é impossível e apresenta `—`. | `temporal-presentation.test.tsx`; unitários em três fusos | Fatura e investimento preservam o dia; detalhe de transação rejeita normalização para março. |
| Prazo de meta | Deadline igual a hoje não atrasa; ontem atrasa; concluída nunca atrasa; página aberta revalida no próximo dia e ao recuperar foco. | `temporal-presentation.test.tsx` com timers/relógio controlados | Passou na virada de `23:59:59` para `00:00:00`, em reentrada às `00:05` e para meta concluída. |
| Navegação por competência | Janeiro/31 +1 = fevereiro/01; próxima ação = março/01; entrada não carrega dia 31. | `temporal-navigation.test.tsx` sobre `useCards`, `useExtract` e `PlanningProvider` | Os três consumidores passaram; extrato também ordena chaves civis canônicas sem convertê-las em instantes. |
| Capacidade de regressão | Reintroduzir UTC, parsing local ou `setMonth` deve falhar no consumidor, não apenas no helper. | Três mutações temporárias descritas abaixo | Todas retornaram exit code 1 por divergência do oracle e foram restauradas. |

Os testes usam valores esperados literais derivados da SPEC-002. Nenhum expected importa o helper sob teste nem é calculado a partir do resultado observado.

## Falha anterior

O baseline com o patch inicial aprovou 15 execuções unitárias (5 cenários × 3 fusos), o único teste de componente então existente e o typecheck. Esse verde não exercitava formulários, labels, prazo nem navegação.

Após adicionar os testes e antes de ligar os consumidores restantes, a suíte de componente retornou exit code 1:

- o badge continuou `Iniciando` depois da virada, pois não assinava uma fonte reativa de “hoje”;
- `2026-02-29` foi normalizado por `Date` e apareceu como `01/03/2026`, em vez de `—`;
- houve ainda uma falha não causal de harness (`PrivacyBlur` sem `UserProvider`), corrigida com double de `useUser` sem alterar assertions de negócio.

As correções originais F-001–004 já estavam no patch recebido. Por isso, a evidência de sua versão anterior foi obtida por mutação isolada, como exige a política, sem descartar o patch local.

## Correção e validação

- [browserTodayContext.tsx](../../../controle-financeiro-frontend/src/contexts/browserTodayContext.tsx) mantém uma única data civil do navegador para toda a árvore: um timer calculado até a próxima meia-noite local, revalidação em `focus`/`visibilitychange` e cleanup completo. O valor inicial é neutro até o efeito do cliente, evitando que o fuso do servidor gere markup temporal divergente na hidratação.
- [providers.tsx](../../../controle-financeiro-frontend/src/app/providers.tsx) recebeu apenas o provider transversal no composition root. Este arquivo compartilhado fica fora da lista nominal da tarefa, mas a alteração é necessária para não acoplar relógio global ao domínio de metas nem criar um timer/listener por item.
- `StatusBadge` consome o dia compartilhado; meta concluída continua com precedência sobre atraso.
- Os três formulários que possuem data e hora capturam um único `openedAt`; cruzar meia-noite não altera campos já visíveis.
- `TransactionDetails` usa o formatter civil e apresenta `—` para inválido, sem concatenar meio-dia artificial.
- O extrato ordena `YYYY-MM-DD` canônico por comparação lexical. Para `d` grupos, permanece O(d log d), eliminando duas alocações/conversões `Date` por comparação. Parsing/formatação/default/status e mudança de competência são O(1); a atualização diária do contexto notifica O(c) consumidores inscritos uma vez por evento, com um único timer global.

Comandos finais reproduzíveis, executados a partir de `controle-financeiro-frontend`:

```powershell
node scripts/test.mjs
$env:TZ='America/Sao_Paulo'; node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src/utils/date.ts src/contexts/browserTodayContext.tsx src/app/providers.tsx tests/component/temporal-forms.test.tsx tests/component/temporal-presentation.test.tsx tests/component/temporal-navigation.test.tsx
node node_modules/next/dist/bin/next build
```

Resultados finais: 15/15 execuções unitárias, 11/11 testes de componente, typecheck, lint dos arquivos novos/sem baseline e build de produção aprovados, todos com exit code 0. O primeiro build falhou somente porque o sandbox bloqueou Google Fonts; a repetição autorizada com rede compilou e gerou 14 rotas. Não houve retry de teste funcional.

O comando `npm` global não executa neste host porque aponta para `%APPDATA%/npm/node_modules/npm/bin/npm-cli.js`, inexistente. Foram usados os mesmos scripts/binários locais via `node`, sem instalar ou alterar dependências.

## Verificação adversarial

Todas as mutações foram aplicadas uma por vez em `src/utils/date.ts`, testadas e revertidas antes da validação final:

1. `localDateString` → `date.toISOString().slice(0, 10)`: `temporal-forms.test.tsx` falhou 2/2, recebendo `2026-09-08` no lugar de `2026-09-07` (exit 1).
2. `formatCalendarDate` → `new Date(value).toLocaleDateString(...)`: apresentação falhou para labels (`07/09/2026` ausente, deslocado para o dia anterior) e para inválido sem saída neutra (2 falhas, exit 1).
3. `shiftMonth` → cópia + `setMonth`: cartões, extrato e planejamento receberam março (índice 2) no lugar de fevereiro (índice 1) a partir de janeiro/31 (3 falhas, exit 1).

A falha natural anterior do badge e do detalhe inválido também retornou exit 1 pela regra sob teste. `git diff --check` não encontrou erro de whitespace; avisos exibidos são apenas de conversão LF/CRLF configurada no checkout.

## Auditoria dos consumidores temporais

| Consumidor restante | Classificação/decisão |
|---|---|
| `GoalHistory.date` em `goalDetails` | Horário de registro/legado, não data civil. Conversão canônica e indicação de fuso dependem do perfil CF-008 e da proveniência CF-017; não foi mascarado como UTC. |
| `createdAt` em extrato/detalhe | Legado misto de data/hora de operação. Mantido sem redefini-lo como auditoria; adaptação coordenada pertence a CF-008/017. |
| `habitItem`/`habitDetails` (`T12:00:00`, hoje e semana locais) | Achado confirmado, mas DEC-08 e o calendário de hábitos são responsabilidade explícita da CF-022. Alterar agora cristalizaria semana/streak sem oracle aprovado. |
| Fechamento/vencimento calculados em `invoiceDetails` | Datas derivadas de dia nominal do cartão; a regra bancária exata para mês curto pertence à DEC-03/CF-019. A CF-005 não mudou esse cálculo. |
| Dashboard, resumo anual e limites de navegação | Defaults de competência/ano do navegador, compatíveis com DEC-01; seleção aberta permanece estável. |

Não restou `toISOString` nos formulários/hooks/contextos/utilitários auditados. As duas concatenações artificiais restantes são as de hábitos acima, com tarefa dona explicitada.

## Revisão e pendências

- A checklist React/Next foi aplicada: provider Client Component, sem componente client assíncrono, sem `Date` em props Server→Client, uma única inscrição global, cleanup de timer/listeners e sem estado derivado redundante por item.
- O lint global não foi usado como gate da CF-005: arquivos legados tocados pelo patch inicial ainda reproduzem o baseline delegado à CF-026 (principalmente `any` e avisos). O lint direcionado aos arquivos novos e testes passou; nenhuma regra foi desabilitada.
- O build mantém o aviso preexistente de depreciação de `middleware` no Next 16; migração para `proxy` não pertence a esta tarefa.
- Não foram executados navegador real, BFF, backend, PostgreSQL, reload ou API sem mocks. A validação navegador→API→banco pertence à CF-007 após CF-006; esta conclusão é de comportamento unitário/componente e build.
- Não houve revisão independente; CF-015 continua responsável pelo marco completo. Não há promessa de ausência absoluta de bugs.
- Nenhum snapshot, assertion, timeout, retry ou mock central de regra foi enfraquecido. Dados usados são sintéticos e nenhum serviço externo/produção foi acionado.

Dependências: esta conclusão satisfaz a parcela frontend da CF-007, que ainda aguarda CF-006. CF-012, CF-013 e CF-014 agora têm CF-005 satisfeita, mas ainda aguardam CF-008 e CF-010. Portanto, nenhuma tarefa ficou integralmente liberada apenas por esta conclusão; CF-006, CF-008 e CF-010 já estão liberadas pelas dependências anteriores.
