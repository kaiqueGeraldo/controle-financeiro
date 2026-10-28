# Classificação histórica e alcance da inconclusão

Os35 arquivos de ocorrências do manifesto anterior e três relatórios adicionais
foram rehashados, além do catálogo de queries. XMLs foram lidos novamente e casos
falhos/positivos extraídos em [conferencia.json](conferencia.json). Não houve rerun
dos históricos nem reconstrução fictícia de t0/CPU que não foram capturados.

| Invocação original | Resultado do XML AdoptionRuntimeTest / PortLifecycleProbeTest | Alcance |
|---|---|---|
| p03/classes PG17 |17 testes,1 falha jobs | Não é prova binária do JAR p05 |
| p05/JAR PG17 |17,3 falhas released/db/maintenance | Jobs passou; não chamar a suíte de verde |
| p05/imagem PG17 |17,0 falhas/erros/skips | Prova positiva de todos os modos nessa invocação |
| p04/witness restaurado imagem |2 casos AdoptionRuntimeTest,2 falhas db/maintenance | O relato global4 inclui outros testes; não atribuir4 a este XML |
| revisão original17/JAR |17,3 falhas released/db/jobs | Manutenção e negativos passaram; falhas pré-bind preservadas |
| saneamento-startup-01/JAR |3,1 falha db com erro de bind | released/jobs passaram; corrida de reserva API distinta |
| TCP histórico PG16/JAR |2,2 falhas de startup pré-bind | Não confundir com os dois BindException pós-readiness/reuso |

Essas invocações se sobrepõem; não somar contagens como testes distintos. Os
relatórios de reuso PG16/PG17 anteriores têm BindException depois da prontidão e
close, outra classe de ocorrência. O controle mutante de filtro em Linux também
parou em startup e nunca provou detecção do filtro; permanece inconclusivo.

## Condições conhecidas e ausentes

Nos JARs: p05/SHA b2967058…, inputs24844b59, adoption, Java21.0.12.1+1/Xmx384m.
Na imagem: ID8c102183…, mesmo JAR, Java21.0.12+8/heap ergonômico, host compartilhado.
PG17.11 nos grupos17, PG16 indicado no diagnóstico TCP, schema sintético UUID,
migrations antes da API/ORMvalidate. writers=true nos modos abertos; jobs=true
somente jobs; manutenção false/false. Portas antigas explícitas versus atuais
dinâmicas são diferenças do harness, não demonstração de causa dos atrasos.

Os XMLs/logs ligam falhas a processos e fases. Exemplo revisão17: PIDs47912,
58044 e42124, JPA concluído, sem Tomcat started antes da falha de readiness40s.
O dump47912 aos35,16s mostra main RUNNABLE, CPU cumulativa28.812,5ms, em
Spring Data HQL/ANTLR → JpaQueryEnhancer → SimpleJpaQuery → bootstrap repositories.
Das8 tentativas de dump,6 têm main válida e2 falharam attach; nenhuma falha omitida.

Faltam início exato monotônico de cada ocorrência antiga, pressão contemporânea
de CPU/memória/I/O, intervalos/hash de cada query e estados TCP antigos. JUnit
inclui preparação/cleanup. npm ci sobrepôs parte da revisão17 e jcmd tem custo;
não foram demonstrados como causas. Não exigir reconstrução impossível desses dados.

## Classificação causal

| Categoria | Conclusão sustentada |
|---|---|
| Causa confirmada em mecanismo próprio | Corrida de reserva da porta API e mecanismo Windows de término antes de liberação TCP foram saneados e aceitos nos pareceres correspondentes. Não explicam todos os estouros pré-bind |
| Fato confirmado | Existiram falhas de40s no Windows e Linux com JPA concluído; pilhas válidas localizam trabalho ativo de preparação HQL. Não prova uma query de40s |
| Explicação compatível, sem confirmação | Variação de CPU/JIT/classes/caches, pressão de host/VM, parsing interno/SLL→LL; combinações possíveis sem contraprova causal |
| Hipótese enfraquecida | Causa exclusiva Windows (há falhas Linux); repetição externa/query isolada dominante/espera longa main por DB/GC dominante nas duas novas JFRs (não reproduzidos nelas) |
| Informação indisponível | Identidade/duração de queries e carga exata no estouro; família/tuplas TCP antigas; completude de cada transição. Não preencher por inferência |

O histórico permanece **E: causa inconclusiva**. A conclusão atual não o atribui
retroativamente a TCP, carga, HQL ou harness; também não afirma que ele nunca
voltará. O aceite local é uma decisão de capacidade/escopo sob EXECUCAO, apoiada
em provas positivas e com40s preservados, não contraprova de uma correção inexistente.
As falhas continuam classificadas como falhas daquelas invocações; a investigação
é não bloqueante para preparar a próxima validação, cujos testes seguem obrigatórios.
