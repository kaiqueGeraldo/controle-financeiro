# Achados independentes

## RVPLA-03 — encerrado no cenário original de abandono Windows

O cenário original é Node interrompido, wrapper ainda capaz de criar Java e uma
retomada concorrendo com essa capacidade. A reprodução byte idêntica pelo blob
9bed5e2 voltou a demonstrar o defeito. No candidato, a árvore entra no Job antes
de executar comandos; identidade/recibos, mutex e confirmação de encerramento
protegem a retomada. Grupos5/5 e5/5 e controles independentes confirmam o recorte.

A contraprova retirou somente supervisão e boundary de quiescência, em cópia.
Wrapper sobreviveu, iniciou Java após resume e o mesmo expected de encerramento
ficou vermelho: exit1, OWNED_WRAPPER_SURVIVED_AND_CREATED_LATE_JAVA. SHA restaurado
2aba6b28…96c1; mesmo expected restaurado exit0. Não foi apenas um modo que espera
o bug e retorna verde. O modo antigo da prova do implementador também foi
reexecutado, mas o aceite usa adicionalmente esse oracle independente.

Alcance: host Windows/sessão atual, criação normal na árvore gerenciada. Morte
abrupta do guardião encerrou wrapper, filho e neto, observados por handles abertos
antes da intervenção. Terceiro Java de mesmo nome permaneceu vivo. Job retido
por handle de leitura, já com active0, impediu a retomada até fechar o objeto;
isso é bloqueio conservador, não prova de processos ainda vivos. PID/nascimento
divergentes, recibo inválido, sessão diferente e falha de consulta não autorizaram
mutação/recovery. Não há certificação de recovery em host Linux ou outras sessões.

## RVPLA-04 — P2 confirmado: handoff pode produzir falsa quiescência antes de restaurar

Local: `.github/scripts/owned-job-probe.ps1:14,44–45`; efeito em ProofStore.run
ao confiar em verifyEnvironment antes de restaurar/concluir. Este disparo acontece
com owner/worker vivos, durante a inspeção; difere do abandono Node de RVPLA-03.

Members captura os IDs com QueryInformationJobObject e depois resolve nascimento/
nome de cada PID. Se um wrapper cria filho após a captura e termina antes dessa
resolução, GetProcessById lança ArgumentException, que é silenciosamente ignorada.
O pai some da lista, o filho não estava na captura e o filtro vê zero extras.
active>=1 não valida a coerência entre a contagem e o roster resolvido.

Reprodução determinística em handoff/: cópia dos módulos do candidato; **somente
uma barreira adicionada depois de QueryIds e antes do loop de identidades**.
Nenhum predicado, retorno, limite ou assertion do candidato foi removido. A
barreira exige que o PID alvo esteja na captura e abre seu handle com nascimento
validado. O pai GUI61016 cria filho GUI47652 e termina; o handle sinalizado permite
continuar o loop original. GUI evita acrescentar conhost ao alvo. Não se usou
sleep ocasional para inferir a sequência.

A resposta original certificou noCommandDescendants=true, enumerando apenas
guardião27092, worker22568 e conhost62208. O checkpoint ficou complete às
18:43:03.902Z, environmentVerified/restorationVerified=true e input restaurado.
Somente depois desse marco o worker liberou o filho, que gravou às
18:43:03.9516127Z: `child=47652 input=original`. Assim, houve trabalho gerenciado
após restauração e conclusão, enquanto a quiescência estava falsamente certificada.
O teste contratual ficou vermelho pelo motivo OWNED_DESCENDANT_EFFECT_AFTER_COMPLETE.

Provas: execucao/handoff/result.json, completion-observed.json, instrumentacao.json,
reply do boundary, checkpoint/eventos, identidades e teste vermelho. O mapa
resultados.json preserva SHA original/coletado e caminhos compactados. O probe
nativo da cópia foi restaurado por SHA; fonte canônica permaneceu intacta.
O Job inteiro desapareceu no encerramento final; isso não torna verdadeira a
certificação antecipada. A fixture trabalha com um arquivo sintético e processos
GUI locais, sem SQL/DDL ou ação financeira. Não se afirma ocorrência espontânea
em produção nem execução de um próximo gate; a restauração/conclusão insegura
foi diretamente observada.

Impacto: comando tardio pode observar fonte já restaurada ou contaminar evidência
da tentativa. O contrato amplo de quiescência do runner continua sem aceite,
mesmo com o abandono original corrigido. Não se reabre RVPLA-01 ou controle de
porta por associação.

Menor saneamento recomendado: recusar uma fotografia inconsistente quando um
PID capturado desaparece antes de sua identidade ser verificada; não descartá-lo
como prova de inexistência de descendentes. Definir uma enumeração/fence coerente
com a condição “nenhum produtor de comandos fora do baseline”. Comparação de
contagens ou duas amostras iguais sem esse vínculo não é garantia suficiente.
Um caminho conservador pode bloquear, fechar o Job e só recuperar depois de
ausência comprovada. Fechar com a mesma barreira, fonte ainda mutante enquanto
não segura, ausência de efeito tardio e retomada posterior válida. **Sem correção
nesta revisão.**

## Reuso nativo e HQL — investigações distintas

Dois erros de bind nativo continuam inconclusivos; ver REUSO-STARTUP.md. Ocorrem
dentro do teste Java depois de app.close e processo morto, sem interromper Node
e antes do boundary pós-Maven. Não há vínculo causal demonstrado com RVPLA-03
ou com a nova enumeração RVPLA-04. HQL mantém falhas históricas e40s, sem causa
completa ou query defeituosa comprovada. Não são motivo para manter RVPLA-03 aberto.
