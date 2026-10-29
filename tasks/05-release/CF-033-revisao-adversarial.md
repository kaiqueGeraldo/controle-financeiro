# CF-033 — Revisar integridade, testes e comportamento final

- Estado: concluida
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: xhigh
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-025](../03-integridade/CF-025-consultas-desempenho.md), [CF-027](../03-integridade/CF-027-fronteiras-backend.md), [CF-032](../04-onboarding/CF-032-e2e-financeiro.md)
- Origem: T-009, T-011; todos os riscos críticos

## Publicação e integração autorizadas — 24/10/2026

Sete commits aprovados até `e1a01b6` publicados na branch CF033 e integrados por
fast-forward; main remota `e1a01b62e0766c92120c3cefc2bc4b4fc316ce58`.
Provas da integração e análise sucessora delimitada (registro de execução privado).
Aceite local CF033/CF033-01 preservado, sem ampliar liberação para uso/produção.
Novos commits da análise CF015→CF034 permanecem locais; CF034 não iniciada.
Notas abaixo descrevem as execuções anteriores e conservam seus limites.

## Problema e resultado esperado

Revisão final deve procurar defeitos e lacunas nos testes usando os requisitos, sem aceitar a conclusão do implementador como evidência suficiente.

## Escopo e referências

- `docs/sdd/`
- `tasks/evidencias/`
- `controle-financeiro-frontend/tests/`
- `controle-financeiro-backend/src/test/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Confrontar requisitos/paridade com código e testes; executar casos novos de arredondamento, concorrência, sessão e fuso.
2. Aplicar mutações controladas em cópia isolada em filtro de realizado, ownerId, parcela e idempotência; verificar detecção/restauração.
3. Consolidar defeitos residuais por severidade e tarefas de correção; repetir apenas verificações impactadas após correção.

## Aceite e testes adversariais

- [x] Todos os critérios críticos têm teste eficaz ou bloqueio explícito de liberação.
- [x] Mutações plausíveis são detectadas pelos testes certos; sobrevivente é analisado, não ocultado por meta de cobertura.
- [x] Relatório deixa claros cenários não executados e riscos; P0/P1 de uso diário pendente impede aprovação.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

Os checkboxes encerram **a execução da revisão independente**, não aprovam
irrestritamente o candidato. CF033-01/P2 foi aberto no parecer original e
**encerrado por revalidação independente de8de766f..d059bc9**: progresso entre
fontes independentes e proteção de dependências/capacidade sustentados juntos.
Provas vermelhas históricas preservadas. P0/P1 e novos resíduos não confirmados
no alcance. Zoom, adoção real e limites de produção continuam com gates próprios.

## Fora de escopo

Aprovar por contagem de testes, alterar expected para aceitar resultado atual ou prometer ausência absoluta de bugs.

## Modelo e revisão

A tarefa envolve decisão de contrato ou revisão crítica entre domínios; o esforço adicional se concentra em ambiguidades e riscos. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Revalidação independente de24/10/2026: **CF033-01/P2 encerrado**, candidato
d059bc9 aceito neste saneamento local.49 controles e24 finais restaurados (8
sobrepostos); seis interleavings novos de criação/remoção/commit/rollback e três
mutações distintas detectadas sem erros ambientais. Original e históricos
preservados;430 fontes restauradas por hash,627 arquivos históricos conferidos
sem divergência. Sem correção de produto, push, merge, deploy ou banco real.
Parecer A–E, matriz e execução (registro de execução privado).
CF033 continua concluída como marco de revisão, sem aprovação irrestrita de
publicação. CF034 proposta/não iniciada; CF015 ainda em_revisao por zoom nativo,
DEC-ONB-03 não dispensa essa dependência. Próximo passo: decisão de publicação
do lote local e prova de zoom/parecer CF015 em trabalho próprio autorizado.

Notas anteriores preservadas abaixo, superadas somente no achado revalidado.

Atualização dirigida de24/10/2026: **CF033-01 saneado localmente, aguardando
revalidação independente; achado sem autoencerramento**. A tarefa permanece
concluida como execução de revisão, sem aprovação irrestrita do candidato.
DEC-10 preservada pelo protocolo de dependências/capacidade por fonte, com
proteção global para inventário certificado/legado. Probe original intacto
vermelho→verde;43 dirigidos e229 regressões aprovados (sobrepostos), duas
contraprovas finais detectadas/restauradas e controles2/2; Maven verify/JAR local
sem clean. Reconciliação, provas, falhas, custos e encaminhamento (registro de execução privado).
Mesma branch, commits locais, README/runtimes preservados. Aceites anteriores,
zoom nativo200%, adoção CF017/P01/P02 e DEC-ONB-03 conservam seus alcances;
CF034+ não iniciadas. Próximo passo: revalidação independente dirigida.

Iniciada em 23/10/2026 sobre a base integrada/publicada `bfb6c61`, na branch
`codex/cf033-revisao-integrada`. Dependências CF025/027/032 aceitas no alcance
local e integradas; escopo, matriz normativa anterior à execução e gates em
CF-033 (registro de execução privado). Revisão sem correção silenciosa de produto;
zoom200%, adoção real, produção e sucessoras conservam seus limites.

Encerrada em24/10/2026 como o próprio marco de revisão independente, com parecer
restritivo e CF033-01/P2 aberto.7 casos backend novos aprovados;3 jornadas reais
aprovadas; quatro mutações causais detectadas/restauradas; seleção74 com73
aprovações/1 timeout, seguida de probe causal1 assertion falha/0 erros. Sem
correção de produto, repetição até passar ou aprovação por contagem.
Parecer, matriz, falhas, limites e saneamento delimitado (registro de execução privado).
Produto487 fontes e README/runtimes preservados; novos commits exclusivamente
locais. Próximo passo: reconciliar o contrato de progresso CF033-01 sem invalidar
capacidade/certificação. CF034 e demais sucessoras não iniciadas; zoom nativo200%,
adoção CF017/P01/P02 e produção continuam com gates próprios.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

