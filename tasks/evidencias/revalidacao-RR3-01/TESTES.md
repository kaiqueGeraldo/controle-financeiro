# Provas e reprodução

Runtime novo:C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/preparacao-adocao/revalidacao-rr3-01-01. Cópia física s/f, dependências instaladas reutilizadas por hardlinks imutáveis;846 fontes backend/frontend/.github vinculados por SHA. Só o caminho físico do frontend nos wrappers Java foi adaptado. Sem .env, cache anterior, instalação ou JAR novo.

| Execução nova | Resultado | Alcance |
|---|---|---|
| candidate-original-static |10/10 | geometry.mjs original por bytes |
| candidate-live |2 JUnit aprovados,1 Playwright em cada | Prova real original e SAN-E2 em3larguras |
| old-original-static |vermelho esperado,2 falsos aceites | Apenas helper antigo na cópia |
| old-original-live |1 JUnit/Playwright vermelho,2 soft assertions | Mesmos dois falsos aceites no produto sintético |
| restored-original-static |10/10 | Candidato restaurado por SHA |
| restored-original-live |1 JUnit/Playwright aprovado | Fonte/assertions originais intactos |
| controls24 |24/24,0 skips/flaky/retries |19 cenários básicos+5 controles especiais do candidato |
| independentes |21 condições:19 esperadas,2 falsos aceites | Interrupções/restauração/alinhamento/variações e dois efeitos colaterais da máscara |
| complementos |4/4 | Fonte pendente, continuidade após timeout, novo nó normal e animação tardia |
| CI |32/32,0 skips | Contratos canônicos de seleção/relatórios/required/sanitização |
| Tipagem/lint |ambos saída0;3 arquivos lint sem warnings | Fontes do candidato, sem mudar implementação |

Reaproveitados após hashes:8 recibos de testes do implementador (4 estáticos,4 Maven),23+1 controles históricos,3 geometrias do consumidor,31 arquivos/probes da revisão independente anterior e evidências de zoom. Os relatos de tipagem/CI históricos tinham referência de transcript; esta revisão guardou logs novos. Não são contados como novas execuções. Os88 JUnit anteriores continuam históricos, fora da presente seleção.

Reprodução, na worktree correta, com runtime NOVO:
~~~powershell
$rt='C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\revalidacao-rr3-01-NOVA'
node tasks/evidencias/revalidacao-RR3-01/auditar.mjs $rt initial
node tasks/evidencias/revalidacao-RR3-01/executar.mjs prepare $rt
node tasks/evidencias/revalidacao-RR3-01/provas-originais.mjs prepare-live $rt
node tasks/evidencias/revalidacao-RR3-01/provas-originais.mjs static $rt candidate-original-static
$env:REVALIDATE_GREP='SAN-E2-visual|Independent live reason'
node tasks/evidencias/revalidacao-RR3-01/executar.mjs run $rt candidate-live IndependentRR3LiveProbe MilestoneRemediationBrowserTest
node tasks/evidencias/revalidacao-RR3-01/independentes.mjs $rt
node tasks/evidencias/revalidacao-RR3-01/complementos.mjs $rt
node tasks/evidencias/revalidacao-RR3-01/verificacoes.mjs $rt
node tasks/evidencias/revalidacao-RR3-01/contraprovar.mjs $rt
~~~

independentes.mjs deve reprovar enquanto os dois efeitos colaterais da máscara forem aceitos; sua saída1 não é erro de preparação. contraprovar.mjs deve registrar antigos vermelhos e controles restaurados verdes, guardando o candidato em finally. Não executar simultaneamente verificacoes/contraprovar, porque ambos leem o helper da cópia. Nenhuma assertion original foi modificada para obter aprovação.

Versões usadas:Windows/Node24.18.0/JDK21.0.12.1/Maven3.9.12 offline/Next16.1.6/Playwright1.63 Chromium1243/PG16-alpine Testcontainers. JVM UTC, cache de contextos4, failIfNoTests e nenhum retry. Os probes estáticos usam relógios/animações nativos; a jornada real conserva o helper civil original. DPR2 é apenas teste de alinhamento, sem equivalência a zoom.

Os dados/cookies/traces/certificados históricos e SQL completos ficam privados. RESULTADOS.json traz hashes/contagens/alcance, não credenciais. Nenhuma suíte financeira completa foi repetida.

A primeira comparação de preservação com uma variante homogênea LF/CRLF não acomodava o newline misto já existente em REGISTRO-FINAL.md da revisão anterior. O recibo privado de fechamento c3867993 confirmou diretamente os31 hashes brutos; não houve alteração nova, normalização do original ou restauração automática. Esse ajuste do auditor não é falha do candidato.
