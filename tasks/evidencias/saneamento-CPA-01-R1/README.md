# CPA-01/R1/P2 — agregação explícita de resultados

28/10/2026. **Saneado localmente, aguardando revisão independente. Parecer C
preservado.** O aceite anterior da seleção/cobertura não foi reaberto nem usado
como aprovação deste agregador.

Branch mantida: `codex/saneamento-cpa01-selecao-testes`.
Base conferida: `e837748a600c356e2e9d4f60291240cebf523916`.
Código anterior revalidado: `193916a1778f1322f5368f66d30a83286766b147`.
Entre esses pontos há somente provas/documentação da revisão independente;
nenhum delta em `.github`, backend ou frontend. `origin/main` local e merge-base:
`fb986456a37a48afcafef204f165d15354294d26`, sem fetch ou consulta de proteções nesta
execução. Entrada Git: somente README raiz alterado, index vazio, hash esperado.
Sem merge, rebase, cherry-pick ou nova branch. Implementação:
`b45284e876277e4136b6487ed3e3d9a320bfaa62`. Intervalo de código:
`e837748a600c356e2e9d4f60291240cebf523916..b45284e876277e4136b6487ed3e3d9a320bfaa62`.
HEAD documental e intervalo final são informados na entrega, sem hash autorreferente.

## Causa, reprodução original e semântica

O antigo required era também o executor Linux, com `needs: windows-native` e sem
condição de job. Windows falho/skipped bloqueava o pacote corretamente, mas fazia
o check required ficar skipped em vez de reprovar explicitamente os resultados.
A [revisão independente](../revalidacao-CPA-01/WORKFLOW-REQUIRED.md) delimitou R1
como resíduo distinto do seletor já aceito.

[Reprodução original executada](reproducao-original.json): a seção de contrato
de workflow de `revalidacao-CPA-01/executar.mjs` foi extraída byte a byte, com
todas as suas assertions intactas. O adaptador só fornece imports/bindings e muda
os destinos de saída. Usa o YAML da base em cópia isolada. O verificador original
inteiro inclui Java/produto; esses trechos independentes do achado não foram
repetidos. A fonte original continua intacta, SHA-256
`84727589105839cffee5e3a83e8cb80af7d87ff6df195e8e580ee385ce4c4579`;
trecho executado `2c92c79488bd9e46af4edc651038952fff33987b358da5bad6da3de80e6e3d5b`.
Resultado: Windows failure -> required skipped, pacote inacessível,
`jobIf.required=null`. Isso é contrato/modelo local, não execução do scheduler.

A [documentação de needs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs)
explica a propagação de falha/skip e a elegibilidade com always no job dependente.
A [documentação de status obrigatório](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
confirma que skipped pode satisfazer o check exigido. Não se inferiu que o remoto
atual exige somente esse check ou que algum merge indevido ocorreu.

O [contexto needs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context)
contém dependências diretas e seus resultados. Por isso o novo agregador declara
todos os três jobs diretamente, em vez de presumir que Windows aparecerá pela
dependência transitiva de Linux. A consulta foi somente à documentação pública.

## Implementação e contrato por modo

O job/check `required` mantém o nome. O antigo bloco de execução passou a se
chamar `linux`, conservando steps, ambiente,45min, geração/upload de pacote,
paths de runtime e artefatos; a única mudança dentro dele é acrescentar o novo
arquivo de contratos ao comando Node. O job Windows também só acrescenta esse
contrato. Expanded muda somente `needs: required` para `needs: linux`, mantendo
condição, seleção, prazo e conteúdo. Não há ciclo.

Fluxo: Windows -> Linux -> expanded quando solicitado; required aguarda os três.
Required tem `if: ${{ always() }}`, needs `[windows-native, linux, expanded]`,
Ubuntu/Node24 e prazo5min. Checkout/setup/verificação têm1min cada. Seu único
comando run é `node .github/scripts/required.mjs`, último passo. Erro de checkout,
setup ou avaliador não recebe continue-on-error nem comando de sucesso posterior.

| Evento/modo | Obrigatórios, todos success | Não aplicável, resultado exigido |
|---|---|---|
| push main com paths existentes |windows-native, linux|expanded=skipped|
| pull_request main com paths existentes |windows-native, linux|expanded=skipped|
| workflow_dispatch smoke |windows-native, linux|expanded=skipped|
| workflow_dispatch expanded |windows-native, linux, expanded|Nenhum|

Não há job opcional arbitrário. A exceção de expanded é restrita aos três modos
sem expanded e exige sua presença em needs/payload com skipped. Ausência continua
inválida; status diferente do esperado também reprova. Evento/suite desconhecidos
não caem silenciosamente em smoke. Push desta branch continua sem acionar ci.yml.

`jobRequirements` é a política única do avaliador. As chaves são confrontadas com
needs e existência dos jobs pelos contratos estruturais. Um oráculo independente
nos testes exige explicitamente Windows/Linux, e expanded no modo próprio; omitir
Windows simultaneamente na política e no YAML foi detectado.

O workflow transfere `${{ toJSON(needs) }}` pela variável de ambiente NEEDS_JSON,
sem interpolar valores em comandos shell. O script valida o JSON e cada resultado;
somente success nos obrigatórios aprova. Failure/cancelled/skipped obrigatório,
ausência/desconhecido e JSON vazio/inválido levam a exit1. Diagnóstico mostra IDs
conhecidos e estados de allowlist; outputs, valores desconhecidos e JSON bruto
não são impressos. Sentinelas e payload com sintaxe de comando foram exercitados
pela CLI real, sem avaliação por shell ou exposição.

Decisão: separar execução e agregação acrescenta um job curto, checkout e custo
de runner, mas permite avaliar explicitamente o resultado Linux e preservar o
check required. Acrescentar apenas always ao executor não agregaria um job Linux
separado nem a matriz expanded. O avaliador custa O(P+J), P bytes JSON e J jobs;
sem estado compartilhado, concorrência ou consultas de banco novas.

## Matriz local e contratos

[Matriz completa](matriz-resultados.json):82 cenários do avaliador real,
4 aceitos (um conjunto válido por modo) e78 rejeitados conforme o contrato.
Não há implementação paralela do avaliador no teste ou simulação de scheduler.

| Windows | Linux | Expanded/modo | Resultado local |
|---|---|---|---|
|success|success|skipped em push/PR/smoke|exit0|
|success|success|success em dispatch expanded|exit0|
|failure|success|Estado aplicável correto|exit1, Windows identificado|
|skipped|success|Estado aplicável correto|exit1, Windows identificado|
|success|failure|Estado aplicável correto|exit1, Linux identificado|
|cancelled|success|Estado aplicável correto|exit1|
|success|success|failure/cancelled/skipped em dispatch expanded|exit1|
|Múltiplas falhas|Múltiplas falhas|Qualquer modo|exit1, problemas acumulados|
|Job ou result ausente|Qualquer|Inclusive expanded não aplicável ausente|exit1|
|Resultado desconhecido/neutro, JSON vazio/inválido|—|Qualquer modo|exit1|

Combinações como Windows failure/Linux success são fixtures sintéticas do
avaliador; no YAML real Linux continua bloqueado por needs quando Windows falha.
Esses testes não alegam que o scheduler produziu tal combinação.

[Validação](validacao.json), [contratos32](contratos-ci.log),
[7 probes independentes](probes-independentes.log), [controle final32](contratos-finais.log).
Os32 incluem23 contratos anteriores (somente a assertion estrutural do antigo
executor required foi adaptada ao novo job Linux) e9 do agregador. Não somar as
repetições após restauração como novos testes únicos. Os7 probes anteriores
foram executados sem modificar seu arquivo/assertions. Windows/Node24.18.0;
nenhum Maven, teste TCP novo, startup, suíte financeira ou suíte Linux integral.

[YAML parseado e contrato](workflow-contrato.json): js-yaml4.1.1 existente, eventos,
needs, condição exata de job, ausência de continue-on-error, script/env reais,
comando final e limites de pacote conferidos. Comparação de objetos parseados
prova que Windows/Linux só mudam o comando de contratos e expanded só muda needs.
Os testes Node não precisam instalar dependência adicional para inspecionar os
campos explícitos; a prova ainda faz parsing completo independente do documento.

## Contraprovas e restauração

Todas em export isolado `cpa01-r1-validacao-01`, sem mutação no checkout original.
Cada negativo terminou com exit1/AssertionError pertinente, seguido de restauração
exata por hash e9/9 contratos do agregador. Ao final,32/32 novamente e157 inputs
conferidos contra o manifesto testado e os arquivos atuais.

| Mutação | Controle que a detectou |
|---|---|
|Remover condição de status do required|Condição e dependências reais do workflow|
|Aprovar sem verificar resultados|Matriz real/CLI rejeitando estados não verdes|
|Aceitar skipped em obrigatório|Cada obrigatório skipped deve reprovar|
|Omitir Windows da política e needs|Oráculo independente do conjunto obrigatório|
|Tratar job ausente como sucesso|Ausência de cada obrigatório deve reprovar|
|Tratar campo result ausente como sucesso|Resultado ausente deve reprovar|

Hashes de cada mutante, alterações exatas, logs e controles restaurados estão em
[validacao.json](validacao.json). Hashes restaurados:

- Avaliador: `f13b20e4b43a1b8f486d64a927a854d1381e91617c253a1b7bdc3b31a94c9975`.
- Workflow: `117f8e641f46e1d0c099c3f0a47f0bb6cad7ae16cbe4a589cdb3b7cffa19d8ba`.

Dois erros iniciais somente no adaptador da reprodução original foram preservados
em [ocorrências](ocorrencias.json); não contam como negativos do produto ou do
agregador. A prova original executou depois com seu trecho e assertions intactos.

## Pacote, seleção e preservação

Windows continua obrigatório e Linux continua dependendo de seu success.
Failure/skipped/cancelled de Windows não alcança o bloco Linux de pacote.
Falha dos gates Linux impede geração/upload pelo mesmo fluxo anterior. O
agregador always não executa Maven, não gera artefato e não faz upload. Como antes,
o artifact smoke pode existir antes de expanded; sua presença não aprova o lote
nem substitui o required final, que agora exige expanded quando solicitado.

[Conferência](conferencia.json):157 inputs testados coincidem com os atuais;
Linux100/115 + Windows1 = união101/116 por identidades completas contra a
referência independente anterior,15 históricos preservados. Seletor, testeTCP,
runnerMaven, sanitização e gate de relatórios não mudaram. Controles contra skips,
relatório ausente, seleção vazia e evidência antiga passaram; aceite mantido.

[Preservação inicial](preservacao-inicial.json) e [final](preservacao-final.json)
usam manifests existentes por referência/hash e arquivos relevantes. Somente
outputs novos foram referenciados, sem copiar ou reinventariar runtimes históricos.
Provas independentes originais, manifests e runtimes permanecem intactos.
README raiz alheio fora dos commits, inicial/final:
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.
JARp05 anterior, sem pacote novo:
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`.
Produto,16 migrations e todos os testes financeiros sem delta. Sem clean/reset,
limpeza geral de target ou qualquer banco real/hospedagem.

## Limites e verificação remota futura

Elegibilidade por always deriva da semântica oficial e foi conferida no YAML;
execução do avaliador e exit codes foram locais. Nenhum scheduler Actions,
runner remoto, check run ou regra de proteção foi consultado/exercitado.
A [referência de expressões](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions)
também alerta sobre always e tarefas sujeitas a falha crítica; por isso este job
é curto e limitado. A [referência de cancelamento](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-cancellation)
distingue reavaliação de condições e término forçado. Não se promete execução
após force-cancel, perda de runner ou indisponibilidade do serviço. Cancelado,
ausente ou não executado não deve ser interpretado como aceite operacional.

Em etapa posterior autorizada, conferir workflow `CI integrated gates`, job/check
`required` (UI `CI integrated gates / required`), mesmo nome anterior, origem
GitHub Actions, SHA exato, evento e required contexts/rulesets efetivos, inclusive
checks homônimos, resultados ausentes, política de atualização e eventuais filas.
Nenhuma proteção remota foi alterada ou presumida atual. Exercitar failure/skip/
cancelled por obrigatório e todos success, com e sem expanded; verificar saída
explícita do required e barreira de pacote. Exercitar cancelamento global/forçado
e indisponibilidade para delimitar a plataforma, preservando o primeiro resultado.

A documentação atual de checks citada acima distingue dispatch de eventos
elegíveis para checks de PR/ruleset. O dispatch expanded é evidência complementar,
não substitui automaticamente o check do PR. Integração só após revisão
independente favorável, autorização própria, checks aplicáveis aprovados no SHA
conferido, ausência de obrigatório não success e regras remotas atendidas.
O [plano de CI](../consolidacao-pre-adocao/PUBLICACAO-CI.md) e a
[proposta de PR](../consolidacao-pre-adocao/PROPOSTA-PR.md) foram atualizados nesse recorte.

Startup40s, HQL inconclusivo não bloqueante para preparação, TCP/reuso, RVPLA/audit
e PG16/17 mantêm aceites anteriores. CF034 integral, CI/matriz/configuração
remotas, zoom200%, CF017/P01/P02, adoção real e produção seguem pendentes.
Próximo passo: revalidação independente de CPA-01/R1 e novo parecer de prontidão.
Sem autoaprovação, push, PR, merge, CI remota, deploy ou alteração de produto.

## Comandos locais usados

```text
node tasks/evidencias/saneamento-CPA-01-R1/preservar.mjs inicial
node tasks/evidencias/saneamento-CPA-01-R1/reproduzir-original.mjs ../controle-financeiro-runtimes/preparacao-adocao/cpa01-r1-original-03
node tasks/evidencias/saneamento-CPA-01-R1/validar.mjs ../controle-financeiro-runtimes/preparacao-adocao/cpa01-r1-validacao-01
node tasks/evidencias/saneamento-CPA-01-R1/conferir.mjs
node tasks/evidencias/saneamento-CPA-01-R1/preservar.mjs final
```

Scripts recusam reuso de runtime/recibos. Para outra rodada, usar destino novo e
saída de evidência própria; não sobrescrever os arquivos duráveis desta execução.
O preservador inicial é específico da base recebida, não um teste do HEAD futuro.
