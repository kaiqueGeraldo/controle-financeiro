# Timeout legado: contrato, comparação e impacto

O original está em saneamento-RVPLA-03/process-probes.mjs. exit(child) retorna
se close já ocorreu; caso contrário, disputa child.done com timer20000. Para B,
é chamado logo após start(resume), abrangendo bootstrap, registros, verificação,
recuperação, ferramenta, validação, restore e fechamento. Para A, após a terminação
solicitada, observa seu fechamento. Espera por wrapper.json tem outro20s próprio.
Não há orçamento separado que termine quando apenas os descendentes de A morrem.

| Observação | Base3a6e95be | Candidatobadecb55 |
|---|---:|---:|
| Probe legado original |exit0|exit1, Owned process did not exit|
| Close de B observado pelo original |7,711s|20,903s, após interrupção do observer|
| Momento da consulta para cleanup do timeout |não precisou|20,004s|
| Complemento: término natural de B |7,985s|28,181s|
| Wrapper de A antes de B |handle sinalizado|handle sinalizado|
| Jobs registrados de A antes de B |ausentes|ausentes|
| Java tardio após sinal antigo |não|não|
| Teste de segurança física |exit0|exit0|

O complemento preservou o marco20s, permitiu até60s **só diagnóstico** e não
aprovou o gate. Aos20s do candidato, o checkpoint estava no caminho de falha
pré-conclusão; a fonte seguia mutante e não havia complete. A fotografia nativa
identificou owners/guardian ativos e Job de comando de verificação ainda aberto.
Mailbox/checkpoint e trace mostram trabalho de B, não sobrevivência de A.
Query dos Jobs abriu/fechou handles só para leitura; identidade de processos
foi comparada por PID+nascimento. Não foram terminados processos desconhecidos.

Comparação finita: uma execução original por versão e uma diagnóstica por versão,
mesmo Java/Node/fixture/tooling e ausência de outra aplicação de teste concorrente.
Preload só registrou spawn/close, consultas e commits de checkpoint; não mudou
retorno/limite. Seu SHA e a troca de allowlist estão publicados. Acrescenta I/O,
portanto não é benchmark sem instrumentação. Medidas de20s são monotônicas do
próprio controlador; horários de log auxiliam a ordem, sem misturar fusos.

O mesmo complemento foi executado no mecanismo vulnerável9bed5e2: wrapper vivo
antes de B, Java criado depois de resume; oracle de segurança exit1 por
ORIGINAL_ABANDONMENT_VIOLATION. Não se substituiu o teste por um complemento
incapaz de detectar a violação original. Nesse mecanismo não há recibos de Job;
lista vazia de Jobs não é certificado. O handle vivo/efeito tardio decidiu a falha.

Decisão: categoriaC, regressão de custo no contrato de retorno global20s. Não
há evidência de A (abandono inseguro), B (oracle20s inválido) ou D (causa ambiental)
para explicar essa ocorrência. O fato de o protocolo ter mais etapas não torna
o prazo obsoleto. O caso não é permanente: B concluiu sem intervenção em28,181s.
Outra recuperação explícita da tentativa cortada pelo original terminou failed
com fonte restaurada, conservando os estados/bytes anteriores. Isso não apaga
a primeira falha nem promove a fixture sem JUnit a contraprova completa.

Impactos: RVPLA-03 específico de contenção continua sustentado por handles/Jobs
e teste vulnerável; o aceite funcional de retomada20s está limitado por RVPLA-05.
RVPLA-04 pode ser encerrado por suas provas próprias de bloqueio/recuperação.
Quiescência segura não equivale a aprovação do custo do ciclo. Preparação integral
e prontidão do runner continuam pendentes, sem elevar20s ou40s.

Fontes: cost-classification.json, abandonment/summary.json, traces jsonl, fotografia
at-original-deadline.json, snapshots de checkpoints e legacy-recovery.json, ligados
ao mapa SHA em resultados.json. A primeira falha está preservada nas cópias anteriores
à recuperação e nos eventos append-only; o checkpoint corrente avançou pela
recuperação normal, sem reescrever o resultado do probe ou seus traces originais.
