# RVA-03 / CF-019 — diagnóstico dirigido, 15/10/2026

**Defeito de integração do relógio do harness confirmado em reprodução equivalente. Produto inalterado.** O pagamento120 fica visualmente pendente porque a animação de saída começa no futuro da timeline nativa; AnimatePresence conserva o conteúdo antigo (inclusive spinner e fieldset desabilitado) enquanto aguarda a saída. Na reprodução, reconciliação e fechamento React já terminaram. A atribuição ao original é fortemente sustentada pela mesma configuração, código relevante, sequência, rede, estado financeiro e imagem; o original não gravou Fiber/timeline, portanto não existe medição retroativa de seu `onClose`.

CF-019, CF-013 e CF-015 continuam **em_revisao**, aguardando avaliação independente deste diagnóstico e do ajuste restrito de teste. Nenhum aceite anterior reaberto. Sem onboarding, CF-022, zoom200%, adoção real CF-017, deploy ou migração real.

## Git e base

[GIT.json](GIT.json) registra entrada, upstreams, único worktree, staging vazio, hash do README, fetch, grafo e publicação. Destino conferido: `https://github.com/kaiqueGeraldo/controle-financeiro.git`. Os15 commits `8096b22..8a83c35` foram publicados na branch de origem e integrados por fast-forward em main. `git ls-remote` confirmou ambos em `8a83c357880ad20d4adff119a60100dae20cb868`. Não foi necessário PR, stash, rebase, reset, force ou exclusão de branch.

Investigação em `codex/cf019-rva03-investigacao`, criada dessa main integrada. Novos commits somente locais. README raiz preexistente fora do staging/commits, SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.

## Reconstrução original — evidência histórica reutilizada

Origem: [parecer](../revalidacao-CF-016-CF-021/README.md), [achado RVA-03](../revalidacao-CF-016-CF-021/ACHADOS.md), [execuções](../revalidacao-CF-016-CF-021/EXECUCOES.md), pasta `browser/falha-pagamento120` e SQL `browser/saneamento/persisted.txt`. Candidato documentado `3d64e7af64e0c6e6cea576ecce34fc1d2711e708`, último código `a752c6e`, relatório posterior `e927aea`. Não se atribui ao runtime um HEAD que o trace não registrou.

Usuário `cf003-a-san1821-f7516a59-goal-card-120@example.invalid`; conta sintética1000; cartão limite1000, fechamento20/vencimento28; meta1000; item120 comprado no cartão em uma parcela pela UI. Backend fixo15/01/2027 12:00:00.123456Z, São Paulo; credenciais/BFF fixos compatíveis; browser `page.clock.setFixedTime(2027-01-15T12:00:00Z)` antes de cadastro/navegações. Pagamento20 precede120, em usuários/fixtures distintos; não são dois pagamentos na mesma dívida.

Sequência: cadastro → conta/cartão/meta por API (preparação) → `/metas` → adicionar item → reload → comprar item no cartão pela UI → `/cartoes` → fatura janeiro2027 → pagamento, modo Adiantamento, valor120, conta de origem → Confirmar Pagamento. POST para cartão `49a7567c-1e98-436e-a20d-d9fc5cdd769c` retornou200 em132,445ms.

Recibo extraído agora do **trace original**, sem reconstruir resposta:

- operação `785387bd-b62f-4904-8bc1-28228da40998`;
- pagamento `846cedb6-9e6c-47b0-9b6b-fb33b590859f`;
- conta `2bb16ff1-c553-4c20-b79d-f183f919548f`;
- débito `3e9acf5e-fb53-4d7e-91cf-d632fb26b100`;
- amount120, date2027-01-15, recordedAt2027-01-15T12:00:00.123456Z.

Nove GET posteriores200: cartões, contas, fatura, categorias, posição, fluxo, transações recentes, gráfico e planejamento;50,389–285,319ms. Algumas requisições anteriores não têm término; isso não demonstra bloqueio do pagamento. SQL histórico registra saldo880 e compra120 integralmente paga. Snapshot/captura mostram pagável0, saldo880, controles desabilitados e spinner, sem ação de recuperação. Assertion `toHaveCount(0)` falhou após15s, DOM1. Exclusão de meta/reembolso ainda não ocorreram. Não existe reload pós-pagamento bem-sucedido nessa primeira execução; o reload aprovado pertence a outra execução.

[Resumo novo extraído do trace antigo](original-trace-summary.json), [hashes da origem](original-hashes.json). Clock instalado em128831,170ms; navegação para cartões em146639,679ms:17,808509s no relógio do runner. Clique confirmar150018,640ms; assertion inicia150222,790ms. Não subtrair esses valores de `performance.now` do browser. O snapshot terminal registra diálogo de pagamento `opacity:1; transform:scale(0.8)` e backdrop opacity1, compatíveis com saída retida no primeiro keyframe.

Artefatos originais existentes e preservados: error-context, screenshot, network-summary, trace.zip e vídeo local, SQL e logs daquela execução. O banco descartável original e seu estado vivo não estão disponíveis; não há captura histórica de Fiber, resolução de cada promise, timeline/WAAPI ou entrada/saída do handler. Nenhuma cópia reconstruída foi executada como runtime histórico. O script desta rodada lê o zip em modo read-only e não exporta headers/cookies/credenciais. Vídeo apenas inventariado por hash; imagens e dados de trace efetivamente inspecionados.

## Ocorrências diferentes

| Registro | Fato e limite |
|---|---|
| Original, namespace f7516a59 | POST200, recibo/débito120,880/0, modal retido15s; alvo desta investigação |
| Repetição histórica115748ae | Jornada completa aprovada; verde não explica o original |
| [Saneamento residual](../saneamento-CF-016-CF-021-residuais/RVA-03.md) | Duas rodadas instrumentadas sem reprodução; quatro reads/close/finally concluíram; não demonstraram causa |
| [Cópia0099185/.r3](../revalidacao-CF-016-CF-021-residuais/EXPERIMENTO-RVA-03.md) |17 casos,7 falhas antes do envio por nextjs-portal/ausência de estilo;120 com zeroPOST/recibos,1000/120; não é falha pós-commit |
| [RF15, closure-62b8079c](../saneamento-RF15/RVA-03.md) |20→120 aprovados, cada caso com umPOST/recibo; clock fixo; não isolou o mecanismo |
| CF014 histórico invisível | Entrada opacity0 retida por clock/WAAPI; precedente causal que motivou o experimento, não prova automática de RVA-03 |

## Fixture e desenho novos

[Plano definido antes da execução](PLANO.md), probe `tests/e2e/cf019-rva03.integrated.spec.ts`, runner `Cf019Rva03DiagnosticTest`. PostgreSQL16-alpine Testcontainers novo, schema próprio, Flyway1–14/validate, sem fallback externo; email/cotações substituídos na fronteira. Nenhum dado/conta real. Preparação reutiliza a sequência original até pagamento, sem excluir/reembolsar na matriz causal, para conservar o checkpoint.

Quatro usuários novos `rva03-71d559db-{original,date-only}-{20,120}`; por caso conta1000, cartão1000/20/28, dívida120 em janeiro2027, nenhum pagamento anterior. Carteira Física padrão0 é criada pelo cadastro. Conta/cartão/meta são setup API; item/compra/pagamento são UI. Invariante esperada independente:20→980/100;120→880/0; umPOST/recibo/débito. Adiantamento em fatura aberta conserva statusOPEN, mesmo pagável0; não trocar por PAID.

Mesmos navegador/viewport1440×900/fuso/reducedMotion configurado, backend, data civil, sessão, sequência e assertions. Alteração entre modos: clock original vs Date-only. Em ambos os casos120, exposição controlada por `performance.now()>=25000` **antes** da navegação para cartões; não é sleep/retry nem espera para obter verde. A diferença de origem após navegar é a variável causal. Date-only tem tempo monotônico por documento; o tempo total de preparação não é idêntico, mas a exposição mínima pré-navegação é definida e a regra financeira é igual.

Date-only preserva15jan2027, hora09:00, competência janeiro, fechamento20/vencimento28 e autenticação BFF/backend. Mantém performance/rAF/timers nativos. Nativo puro foi excluído por alterar a data civil/default de competência frente ao backend2027; Date-only fornece o controle temporal nativo necessário sem perder a garantia do cenário. Esta investigação não exige simular expiração de sessão, vencimento em trânsito ou passagem de dia; não certifica essas regras nem substitui Clock nesses outros testes.

## Resultado novo e correlação causal

[Resumo verificado](causal-summary.json), [verificador sem novos pagamentos](verify-causal.mjs), JSON completos e capturas em `run-01/`, [SQL](run-01/persisted.txt).

| Modo/valor | Diferença performance−timeline ao final | React final | DOM pagamento após prazo | Financeiro/reload |
|---|---:|---|---|---|
| Original20 |11141,772ms|closed/loading=false|remove dentro15s, após atraso~11s|980/100, umPOST/recibo |
| Original120 |24919,104ms|closed/loading=false|1, spinner, disabled, opacity1; falha preservada|880/0, umPOST/recibo |
| Date-only20 |3,132ms|closed/loading=false|0|980/100, umPOST/recibo |
| Date-only120 |8,798ms|closed/loading=false|0|880/0, umPOST/recibo |

No original120 novo: operação `8e78263a-4666-48cc-a4fb-26d2a300a28d`, pagamento `fc3ae145-bdb5-4c76-be1b-429ce96eee7e`, débito `9baa4b75-0ed3-45e0-9e81-68cf1b215097`. POST/requestfinished e GET de recibo correlacionados ao mesmo cartão/usuário. SQL confirma exatamente quatro card_payments para quatro casos, valores20/120/20/120, cada qual com operationId, fingerprint e bank_transaction_id. `financial_intent_receipts` vazio é esperado: pagamento usa `card_payments`, não o namespace de criação/aporte. Não houve replay nem novo pagamento para resolver o spinner. GETs e reload não mutam.

Cadeia observada: clique real → POST único → logs Spring de pagamento/listener de débito → resposta200 e corpo com recibo → reads/reconciliação → raiz React comprometida com isOpen=false/isLoading=false e intention storage limpo → DOM ainda retido por AnimatePresence → pintura do spinner antigo. O primeiro sample fechado120 está em performance28239/timeline3323,108. No terminal41975/timeline17055,896, animações de saída têm startTime28130 e currentTime−11074,104; keyframes opacity1→0. A rotação CSS do spinner possui tempo positivo e continua rodando: não é congelamento global de renderização.

O observer lê a raiz Fiber `stateNode.current`, nunca o alternate antigo apontado pelo DOM. Leitura passiva, sem alteração de hooks/props/timers; rede não interceptada. Não gravamos logs dentro de handleSubmit/refreshAll. A passagem por remember(ready)/onClose/finally é inferência do estado comprometido e do fluxo de código, não suposta medição de spans internos. Limpeza da intenção e fechamento só ocorrem depois de `await onSuccess`; isso elimina promise de reconciliação pendente como causa do estado terminal **desta reprodução**. `response.text` do runner e requestfinished, isoladamente, não certificariam consumo pelo app.

## Mecanismo e hipóteses

Playwright1.63.0 `setFixedTime` instala o Clock completo: Date fica fixa, mas timers/performance/rAF são substituídos e ticks atravessam navegações. A timeline WAAPI reinicia por documento. Motion12.33.0 usa performance/frame timestamp em `frameloop/sync-time.mjs`, passa startTime a `NativeAnimationExtended` e a `animation.startTime` em `NativeAnimation`. `onfinish` só ocorre depois do início/duração. `AnimatePresence` conserva renderedChildren até exitComplete; conserva também os filhos antigos com spinner enquanto o componente proprietário já fechou.

No modal do produto, exit opacity0/scale0.8 depende dessa saída. Não é o mesmo elemento/entrada da CF014: aqui a falha é **remoção pós-commit**, com opacity1 e spinner antigo. A prova própria são estado React, storage, animações e controle financeiro acima.

| Hipótese | Decisão delimitada |
|---|---|
| H1 clock/WAAPI | Confirmada causalmente na reprodução equivalente; alta sustentação para o original; não medida retroativamente |
| H2 promise/GET/lock pendente | Descartada como explicação terminal desta reprodução por fechamento React e reads; HTTP200 histórico sozinho não descartava. Sem motivo para consultar locks ou adicionar lock |
| H3 mudança aprovada já corrigiu | Não sustentada: [blobs idênticos](source-comparison.json) de PayInvoiceModal/useCards/Modal/coordenador/reconciliação entre3d64e7a e8a83c35; runtime atual ainda reproduz com clock antigo. CardsScreen recebeu referenceDay, sem mudar callback de pagamento; lockfile acrescentou lossless-json, não versão de Motion/Playwright |
| H4 clique não recebido/envio ausente | Excluída nos quatro casos novos por POST/recibo; preservada como classificação separada da cópia antiga bloqueada |
| Erro financeiro/duplicação | Não observado; um efeito/recibo e reload consistente em todos os casos; sem auditoria financeira transversal |

## Correção e trade-offs

Somente `start(goal-card-*)` de `milestone-remediation.integrated.spec.ts` passa a usar o helper Date-only já aprovado em CF014. Demais cenários mantêm seus clocks. Sem alteração de src/main/src de produto, timeout, retries, animação, CSS, expected ou identidade de pagamento. Contraprova antiga permanece executável no probe novo, independente do helper aplicado ao cenário original.

Benefício: origens temporais nativas coerentes, mantendo data civil exigida. Limite: helper não permite avançar timers/dias; não generalizar a testes de virada/expiração. Observação Fiber é específica do React de desenvolvimento e custa O(n) por sample; pode alterar timing, razão para a verificação adicional sem ela. Não há alteração de queries, N+1, locks, complexidade ou domínios de produto. Não se recomenda refatorar reconciliação/financeiro com base neste sintoma. Os locks por intenção/cartão e recuperação por recibo seguem os contratos CF019/024; o SQL de evidência é agregado por namespace em banco descartável, sem N+1 por entidade.

## Limites e encaminhamento

Matriz finita4 casos e verificação2 casos, nenhum retry automático. Não mede frequência de ocorrência nem garante ausência de outros defeitos. Não houve execução do runtime histórico inteiro nem medição histórica de React/WAAPI; não se usa verde isolado como explicação. O tempo pré-navegação controlado25s é maior que17,808s do original, expondo o mesmo mecanismo acima do prazo15s. R03/RV01 (resposta perdida/substituída) e RV24 conservam os aceites prévios; não foram reexecutados nem reabertos, seus caminhos não foram alterados. Sem cobertura nova de dispositivos/expiração.

Próximo passo: revisão independente de `8a83c35..HEAD`, confrontar original, contraprova, controle Date-only, jornada original e garantias financeiras. CF-019 mantém sua ressalva de aceite integrado até essa avaliação. CF-013 mantém aberto o critério de estado recuperável/snapshot, agora com diagnóstico candidato; CF-015 mantém revisão e zoom nativo200% separado. CF-014/011/012, CF-017 local, CF-028 especificação e CF-029 exclusivamente local/descartável preservados. Se a revisão encontrar discrepância histórica, próximo probe específico é repetir a exposição17,808s (uma vez por clock), mantendo todos os demais fatores, não ampliar indiscriminadamente pagamentos.
