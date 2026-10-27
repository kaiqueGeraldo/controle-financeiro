# Revalidação independente RVPLA-03 — 27/10/2026

**RVPLA-03 encerrado no abandono original Windows. Novo RVPLA-04/P2 confirmado
na inspeção de quiescência dentro do worker. Preparação integral não liberada.**
Reuso nativo e startup HQL permanecem inconclusivos. Nenhuma correção implementada.

Branch `codex/preparacao-local-adocao`; base `9bed5e20f2cc46e4c7ae721ff2390054eb6db141`;
candidato `0b4c659877f579da6529c13c4e531769494f25be`, intervalo `9bed5e2..0b4c6598`.
HEAD/ancestralidade/diff/working tree conferidos. Entrada: somente README raiz
preexistente modificado, staging vazio; nenhuma alteração posterior a descartar.
Provas desta revisão no commit `eb785362a3a95dfb00a66e235890f701edecdc88`;
parecer/estados em commit posterior identificado na entrega.

| Parecer | Decisão e alcance |
|---|---|
| A — RVPLA-03 | **Encerrado no cenário original**: interromper Node/guardião não deixa wrapper/descendentes capazes de atuar depois de retomada autorizada, no Windows/sessão atual. A mutação antiga ficou vermelha e o mesmo controle restaurado passou |
| B — reuso nativo | **Inconclusivo**: dois BindException pós-app.close, PG16/JAR2/3 e PG17/JAR5/6, sem estado TCP no instante. Reserva dinâmica aceita no recorte anterior; reuso imediato não certificado |
| C — startup HQL | **Inconclusivo/não aprovado**,40s preservados. Rodada verde não explica falhas históricas nem confirma defeito no parser |
| D — preparação local | RVPLA-01, reserva dinâmica, PG16/17, guard/writers/jobs, saúde/preview e pacote preservados. **RVPLA-04 novo** impede aceite amplo de quiescência/restauração; reuso imediato e startup mantêm limites próprios |
| E — adoção real | **Não liberada**. CF017/P01/P02 e CF034 integral em_revisao; expanded, zoom200%, configurações remotas, inventário/backup/restore/freeze reais e produção pendentes. Sem sucessoras iniciadas |

[Achados](ACHADOS.md), [matriz](MATRIZ.md), [ciclo/identidade](CICLO-DE-VIDA.md),
[reuso e startup](REUSO-STARTUP.md), [encaminhamento](ENCAMINHAMENTO.md).
RVPLA-04 ocorre durante limpeza com worker vivo; não se mantém RVPLA-03 aberto
por associação com esse disparo diferente, com bind nativo ou HQL.

## Execuções efetivas, sem soma de sobreposições

| Rodada nova | Resultado |
|---|---|
| Original9bed5e2 | Script byte idêntico, assertions/hash preservados. Só Copy-Item redirecionou os três módulos para blobs antigos. Wrapper sobreviveu e iniciou Java depois de resume |
| Unitários/contratos existentes |43/43,0 skips:28 checkpoint +10 independentes anteriores +5 CI. São novas execuções de testes existentes, não43 testes novos |
| Processos do candidato |5/5: antes/depois de Java/neto, normal, cleanup parcial, legado. Preservou terceiro e outra execução legítima |
| Janelas/identidade |5/5: antes/depois de Job, recibo inválido, nascimento divergente e sessão divergente sintéticos; sem matar o processo real de identidade diferente |
| Helper compartilhado | Normal e interrupção no modo sem nome passaram; handles e sockets sem tráfego, sem execução de CI remota |
| Independentes finais |5/5: wrapper antes de Java, guardião abrupto, Job retido/active0 bloqueando restauração, consulta falha e ramo Linux recusado. Linux é simulação de plataforma, sem certificação de host Linux |
| Contraprova independente | Mecanismo antigo: mesmo expected exit1 por wrapper/Java tardio. Fonte restaurada por SHA, mesmo expected exit0; controles anteriores não somados |
| Handoff durante inspeção | **Defeito novo detectado**: barreira após captura de PIDs, pai termina/cria filho; complete+envVerified+input restaurado antes do efeito do filho. Wrapper diagnóstico exit0 significa observação concluída; teste contratual exit1 pelo motivo específico |
| PG16/JAR |3 testes,2 pass/1 erro de bind,0 skips |
| PG17/JAR |6 testes,5 pass/1 erro de bind,0 skips; três contratos originais passaram |
| Aplicação Linux em Docker/Windows |4/4,0 falhas/erros/skips; não encerra erros nativos |
| Alocador antigo/restaurado |1 assertion esperada por porta ocupada,0 erros/skips; SHA restaurado e1/1 positivo |
| Daemon e preflight realPG17 | Container lógico alheio preservado e avanço bloqueado; criador parou só ID próprio e confirmou ausência. Preflight mutante detectado causalmente,833 inputs restaurados; resume/audit sem Maven e checkpoint idêntico; outro observador recusado |

43 testes,5/5 e5/5 sobrepõem contratos de identidade/cleanup/resume; os probes
independentes também repetem parte desses contratos. O caso novo cobre a criação
de descendente entre captura e resolução de IDs, ausente nesses controles.
Não houve repetição da suíte financeira integral, frontend/E2E ou diagnóstico HQL
sem nova hipótese. Os cenários dirigidos usaram o candidato final, cobrindo também
helpers compartilhados posteriores às exportações anteriores do implementador.

Falhas dos observadores desta revisão preservadas: versão1 colocou terceiro em
pasta cujo prefixo parecia a execução, acionando corretamente o guard conservador;
versão2 supunha que handle de Job retido manteria filhos vivos, mas os handles
mostraram processos mortos e Job active0 ainda presente. A versão final mede o
objeto retido e seu bloqueio real; não apresenta isso como limpeza incompleta de
processos. Fontes v1/v2 e logs não foram apagados. Nenhum expected original,
timeout40s ou retry de teste foi relaxado.

## Proveniência e preservação

Mesmo JAR p05, produtor dos inputs `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`, SHA-256
**b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b**.
Imagem local `sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`.
Contratos JAR/Linux acima executaram esses artefatos. Maven test compilou classes
e probes descartáveis; nenhum JAR/imagem de produto novo, build atribuído ao HEAD
documental ou reprodução binária alegada. Handoff.exe é ferramenta GUI de prova,
externa ao Git/produto.

Nenhum diff de backend/frontend no intervalo: src/main, queries, configurações e
16 migrations intactos. O delta está nos helpers de supervisão/runner e provas.
833 inputs da exportação atual restaurados;831 inputs p05 e manifests anteriores
preservados. Observador/fixture podem mudar sem que isso mude bytes do pacote.

Preservação inicial/final:4.808 arquivos, incluindo894 artefatos originais do
saneamento e suas cópias,29 históricos,16 migrations, JAR/manifests e provas
independentes. README raiz mantém
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`, fora dos commits.
Snapshots e auditoria não restauram divergência automaticamente. Sem clean/reset,
limpeza geral de target ou sobrescrita de runtime histórico.

Nova coleta:513 artefatos com SHA original/coletado; sanitização/decodificação de
logs explicitadas. Nomes longos compactados deterministicamente, sem mover o
original. Checkpoints coletados são leitura, não recibos portáveis de resume.
Runtimes novos ficam sob revalidacao-rvpla03-20261027-01. Auditoria final de leitura:
45 Jobs,44 ausências certificadas,1 sessão sintética divergente não certificada,
1 recibo inválido preservado; zero processos associados/API containers ativos.

Sem correção de implementação, DB real, Railway/Vercel, CI remota, push, merge,
deploy ou término de processo desconhecido. [Comandos](COMANDOS.md),
[resultados e mapa](resultados.json), [plano prévio](PLANO.md).
