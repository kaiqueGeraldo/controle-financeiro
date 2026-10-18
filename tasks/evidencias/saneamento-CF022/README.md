# CF-022 — saneamento do harness e das fixtures

Base `eb41301ec7d2f08007c7c4637463df81e8460a54`, branch
`codex/cf022-investigacao`. Execução em17/10/2026, America/Sao_Paulo
(logs iniciais Java mostram18/10 em UTC); finalização documental em18/10 após
retomada. **CF-022 permanece em_revisao**.
Este lote implementa localmente o saneamento do critério4; exige revalidação
independente. Critérios1–3 e aceites anteriores não são retirados nem reaprovados.

## Alterações efetivas

Todos os arquivos alterados de execução estão em
`controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/`.
Produto backend/frontend sem delta. [Plano e trade-offs](PLANO.md).

| Achado | Mecanismo confirmado | Correção usada pelos testes reais |
|---|---|---|
| RJ-022-01 | Clock completo substitui performance/timers/rAF; após navegação a origem diverge da timeline nativa e animações têm tempo negativo | `browser.cjs` usa `civil-date-clock.cjs` antes da navegação. Proxy altera somente Date; init script reaplicado no reload. Animações normais, sem CSS/force/sleep/prazo maior |
| H24-01 | Novo usuário não limita o cron global: métodos herdam hábitos de outros métodos | `HabitIntegrityIntegrationTest` encerra contexto após cada método; `HabitSchemaInitializer` cria UUID/schema por contexto. Pré-condições vazias, JUnit Isolated; nenhum filtro de produto, truncamento ou rollback fictício |

O consumidor adicional do initializer é `HabitBrowserIntegrationTest`, validado
pelas jornadas/SQL. O helper TS de Date-only e seus consumidores existentes não
mudam: CJS local evita acoplamento do runner Java/Node a um loader TypeScript.
Outros usos de controle completo de relógio continuam fora deste recorte.

As assertions originais de hábito/meta/calendário/SQL e os10s de cada Future
permanecem. Novas assertions exigem retirada do modal, botão pintado recebendo
pointer input, calendário fixo e relógios nativos após reload. Capturas e dados
de relógio são persistidos. Java agora registra o inventário SQL final também
na falha; mantém o encerramento dos processos Next criados pelo teste.

## Resultados e contraprovas

| Prova | Antes | Depois / significado |
|---|---|---|
| Regressão do relógio,1 teste Node | Falha em timers/performance/rAF nativos com a instalação antiga preservada | Passa com helper efetivamente importado pelo harness; navegação/reload em2 fusos e novo contexto sem vazamento |
| Contraprova independente de relógio,16 observações | Original: drift final933,8ms/SP e504,534ms/UTC+14; animações negativas | Date-only:0,5/1,1ms e animações positivas. Comparação deliberada bad/good deve passar; não é teste vermelho nem prova do timeout histórico |
| Regressão de fixtures,4 métodos ordenados | Volume passa; outros3 falham herdando501 hábitos |4/4 passam, schemas distintos e0 hábitos antes de cada método; leituras1002/2/2/1002, SQL501/1/1/501 FAILED, GoalHistory0 |
| Jornadas integradas | Primeira execução para no setup de autenticação, antes de hábitos | Com pré-compilação explícita:4 jornadas diário/semanal SP/UTC+14, UI→BFF→Spring→PG, marcar/desfazer/reload, mesmas assertions |
| Classe original + probe independente posterior | Fronteira de fixture compartilhada afetava todos os métodos |27 casos originais +1 probe,0 falhas/erros/skips; fresca2→residual1006→isolada2, SQL FAILED1→503→1 e GoalHistory0 |

No probe posterior, fresca69ms, residual16594ms e isolada108ms são durações dos
casos inteiros (recusa de lock e dois callbacks), não duração de uma Future ou
SLA. Os mesmos limites10s individuais passaram. JVM já executara os27 casos;
não se atribui diferença de latência exclusivamente ao saneamento ou a aquecimento.
A comparação causal relevante é cardinalidade/trabalho, reversível pela isolação.
O resultado anterior com expiração permanece na tabela de falhas; não foi apagado
nem houve série de retries até passar.

Contraprovas finais: `mutation-without-isolation` executa somente uma subclasse
na cópia, que troca o descarte por método por descarte após a classe. Primeiro
caso501 passa; segundo falha na pré-condição0, observado501. Resultado esperado:
2 casos,1 falha; a regressão detecta a retirada do isolamento. Nenhum arquivo
candidato precisou ser mutado. A classe mutante permanece apenas como evidência
e no runtime descartável, nunca no src/test do checkout.
`counterproof-clock` repete a comparação original em cópia separada:16 observações
passam, exigindo distorção/animação negativa no completo e relógios nativos no
Date-only. São controles causais, não novos aceites funcionais independentes.

[Resultados browser](corrected-browser-warm/results.json),
[SQL final](corrected-browser-warm/sql-terminal.txt),
[pintura/relógios](corrected-browser-warm/paint-clocks.json),
[síntese do relógio](clock-summary.json). Doze observações de pintura: relógios
nativos, maior diferença performance/timeline15,818ms, zero animação negativa.
SQL terminal:4 hábitos com streak/current/highest0,4 logs PENDING em04/01/2027,
goal_history_id nulo,4 metas0 e GoalHistory0. Progresso após marcação1 e após
desfazer0 conferido pela API real após reload e assertions originais.

Inspeção visual manual: SP semanal marcado mostra1/2 e Feito Hoje; UTC+14 semanal
desfeito mostra0/2 e Avançar Progresso, com layout carregado. As demais capturas
foram geradas e têm verificações automatizadas de pintura/interação, sem alegar
inspeção manual integral, acessibilidade completa ou zoom200%.

## Falhas mantidas e adaptação de ambiente

1. `before-scheduler`: probe independente original, sem alteração. Fresca passa
   com2 leituras; residual503 hábitos expira em10s na primeira execução efetiva
   (446 leituras observadas/445 logs no snapshot terminal). Preservados log,
   amostrasPG e relatórios. Sem blockers/lock não concedido no snapshot final;
   amostragem não exclui esperas entre amostras. Não se conclui causa histórica.
2. `before-isolation-regression`:3 falhas esperadas por dataset501 em vez de0.
3. `before/clock-regression.log`: vermelho esperado pela instalação antiga.
4. `corrected-browser`: cadastro/login200, URL ainda em/auth ao vencer5s. SQL
   vazio de hábitos/metas; Next ainda compilava a home. Falha não atribuída ao
   calendário. Logs sanitizados; cinco originais em raw/ e trace permanecem locais.

`warm-browser.cjs` prepara apenas a compilação da home por BFF real com usuário
sintético adicional, sem hábito/meta. Em seguida carrega **o mesmo browser.cjs,
byte a byte**, inclusive cadastro/login UI e assertion original5s. A home respondeu
em9,8s,9,2s de compilação. `prepare-warmup.cjs` altera somente o caminho do launcher
na cópia Java; todas as assertions SQL são mantidas. Esse launcher foi restaurado
por cópia e hash antes das demais verificações. Não é alteração de produto nem
correção/autocertificação do fluxo de autenticação. Uma execução fria sem essa
preparação continua sujeita ao impedimento documentado; não aumentamos seu prazo.

## Isolamento, custo e limites

Contexto novo também recria pool, Clock e scheduler. Schema novo impede herdar
commits dos workers, inclusive quando rollback do thread principal nada desfaz.
Métodos desta classe não executam concorrentemente no mesmo JVM; `Isolated`
explicita a restrição. JVMs separadas usam containers UUID separados, sem fallback
para banco externo; não medimos throughput de processos concorrentes no host.

Schemas antigos ficam até o descarte Testcontainers/Ryuk, sem limpeza de banco
compartilhado. Recursos Spring são fechados por DirtiesContext; executores
explícitos existentes conservam seus fechamentos. Inicializações adicionais nos
quatro casos custaram aproximadamente3–4,6s cada nesta máquina, além da primeira;
isso é custo observado, não benchmark universal. Caso501 continua real.

O cron mantém custo em função de H hábitos e seus históricos. `findForUpdate`
conta operações com lock, não SELECTs totais nem diagnóstico N+1. Não modificamos
LAZY/EAGER, queries, índices, ShedLock ou scheduler. A sequência2→1006→2 refere-se
somente à fixture definida pela revisão, não a SLA ou limite geral de performance.

## Preservação e encaminhamento

[Manifesto inicial](preservation-initial.json) e final comparam2313 arquivos
preexistentes, incluindo .cf22 e provas independentes. README raiz conserva
SHA2566235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
431 arquivos de produto da cópia equivalem ao checkout/base (CRLF normalizado
somente em texto); sete arquivos candidatos conferidos por hash após restauração.
`EVIDENCE-SHA256.json` preserva os bytes públicos; .gitattributes evita conversão
de logs. .cf22, novo .cf22s, dependências, raw e traces não são versionados.

Revisor: confrontar somente `eb41301..HEAD`, o delta nos sete arquivos de teste,
regressões antes/depois, inventários/schemas e jornadas reais/SQL. Conferir também
a adaptação de compilação, a falha residual anterior e as contraprovas finais,
sem repetir toda a investigação. [Comandos e resultados](EXECUCOES.md).

RJ-022-01/H24-01 históricos seguem com atribuição inconclusiva. Reabrir se callback
com fixture conhecida expirar, retry duplicar efeito, Date-only voltar a bloquear
clique/produzir zeroPOST ou persistência violar o contrato. Nenhum resultado
sintético certifica produção ou inocenta LAZY/EAGER em todo cenário.
CF029 conserva prontidão exclusivamente local/descartável, sem início. Aceites
RVA03/CF019/013/011/012/014 e critérios1–3 preservados; zoom200% CF010/015 e adoção
real CF017/P01/P02 continuam separados. Sem push, integração à main ou deploy.
