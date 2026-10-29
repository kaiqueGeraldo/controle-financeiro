# Estados e encaminhamento independente

## A. TCP/reuso nativo

Correção **implementada localmente, aguardando revisão independente**. Mecanismo
equivalente demonstrado: o processo Windows sinaliza término antes de a porta
ficar disponível; o harness precisava confirmar a pós-condição de liberação TCP.
Os dois erros históricos não possuem captura do instante do bind. A reprodução
no mesmo método/JAR e a contraprova sustentam a correção, sem inventar tuplas
históricas nem autoencerrar o achado. Revisar o intervalo entregue e os negativos.

O revisor deve conferir: compartilhamento real dos budgets10s/5s; inspeção falha
fechada; filtro PID/porta sem término por porta; ausência de relaxamento de socket;
assertions originais e hashes da restauração. Uma consulta ausente é evidência
temporal, não reserva atômica da porta; outro processo pode ocupá-la depois. O
bind original continua detectando isso e não é repetido silenciosamente.

## B. Contenção/quiescência e aceites preservados

RVPLA-01, RVPLA-03/04, RVPLA-05 residual e correção causal audit/EPERM permanecem
aceitos nos respectivos recortes. Nenhum módulo do runner/broker/Job Object,
checkpoint, mailbox, confirmação externa ou contagem de consultas foi alterado.
Não se repetiu o ciclo20s nem audit/EPERM integral. A alteração é no App.close
do teste de runtime; os negativos/reuso/identidade e preservação de listener
alheio foram revalidados nesse caminho. Não transfere aceite para supervisor Linux.

## C. Startup HQL

Continua inconclusivo e separado, com40s. A nova primeira rodada PG16 falhou
antes do bind e não foi reclassificada como TCP: faltava marcador Tomcat/porta
efetiva, logo não havia prova do mecanismo de reuso. Não houve parser tracing,
troca de query, pacote novo ou investigação ampla. As ocorrências históricas com
pilhas HQL mantêm suas próprias evidências.

Próximo experimento específico, **somente preparado**: uma captura fria nativa
e uma aplicação Linux em Docker, sequenciais, mesmo JAR/digest/JDK/heap/configuração,
PG descartável já pronto e schema validado. Registrar carga/memória, identidade,
listener efetivo e tabela TCP antes do start/depois da parada; no Windows usar
close com confirmação TCP e incluir o custo do observador. Manter o resultado40s
independente e observação diagnóstica até90s somente para captura; JFR com flush
explícito e tempos HQL por hash, sem alterar produto. Parar após essas duas
observações. Essa proposta já delimitada não foi executada aqui.

Se falhar antes de qualquer listener, não atribuir a reuso. Se falhar com bind,
preservar a ocorrência específica e correlacionar processo/tuplas; isso não explica
outras ocorrências observadas no parser. Não iniciar uma campanha de queries.

## D. Preparação local

Aceites anteriores de PG16/17, guard/writers/jobs, saúde/preview e proveniência
continuam no alcance anterior. Novos controles exercitam apenas os caminhos
afetados. CF017/P01/P02 e CF034 integral permanecem em_revisao, assim como suas
pendências próprias. Nenhuma liberação local nova é criada por este diagnóstico.
Investigação HQL e trabalhos que já tinham recorte liberado podem avançar sob as
dependências de tasks/EXECUCAO.md; este lote não satisfaz dependências integrais
nem inicia CF035/036, expanded ou zoom200%.

## E. Adoção real

Não liberada. Sem banco real, inventário/backup/restore/freeze/baseline/DDL reais,
push, merge, rebase, CI remota, alteração Railway/Vercel ou deploy. Configuração
e gates remotos mantêm seus estados anteriores. Nenhuma aprovação por associação.
