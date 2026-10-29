# Contratos independentes antes da execução

Base3a6e95be, candidatobadecb55. Sem correção de implementação. Preservar5.854
arquivos do inventário e toda prova posterior do saneamento, README/JAR/migrations.

Reexecutar reprodução original e teste contratual byte idêntico; apenas plumbing
de destinos/fontes antigas pode ser necessário e terá SHA/delta declarado. Mesma
barreira captura→handoff→pai terminado→filho ativo. O candidato pode bloquear e
reter mutação; nunca deve restaurar/complete/avançar com inspeção inconclusiva.
Recuperação exige Jobs anteriores ausentes, identidade e nova prova causal.

Rodadas dirigidas finitas:43 controles,4 broker,2 falhas de inspeção, controle
antes do filho, handoff antigo vermelho/corrigido verde e fonte restaurada. Provar
terceiro de mesmo nome e outra execução preservados; nenhum kill por nome/porta.
Acrescentar morte do broker/canal enquanto comando está vivo, se não coberto.
Delimitar Windows/mesma sessão e criação normal; Docker/Linux não é host Linux.

Timeout legado: manter script/expected/20s. Executar base e candidato em novas
pastas equivalentes, uma vez cada. Instrumentação só observa spawn/close/consultas
e commits de checkpoint por relógio monotônico, sem mudar argumentos retornados
ou limites. O20s observa retorno do resume inteiro, não apenas morte do wrapper.
Complemento poderá observar até60s, marcando o resultado20s separadamente, sem
conceder aprovação ao gate original. Handles/Jobs provam árvore encerrada; dados
de fase distinguem custo, bloqueio, EOF/handle retido ou falha ambiental.
Complemento deve acusar o antigo wrapper tardio em cópia/versão vulnerável.

Inspeções desconhecidas/erros devem bloquear e preservar falha/mutação; finally
não pode promover complete. Job vazio e objeto ausente são estados diferentes.
Segurança de contenção e capacidade funcional de concluir têm parecer separado.

PG17 preflight/resume/audit no candidato final, somente recorte necessário. TCP
e HQL reaproveitados sem investigação ampla,40s mantidos. Sem pacote novo, DB
real, Railway/Vercel, CI remota, push, merge, deploy ou sucessoras.
