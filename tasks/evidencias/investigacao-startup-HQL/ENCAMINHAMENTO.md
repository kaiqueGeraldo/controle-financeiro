# Encaminhamento independente

**E: causa ainda inconclusiva.** A rodada prevista foi encerrada após4 processos
de aplicação. Não continuar uma campanha de inicializações até obter falha ou
aprovação. Os40s permanecem; os novos sucessos não encerram as falhas antigas.

## O que foi enfraquecido e o que falta

Não se reproduziu query isolada acima de1s, repetição externa de HQL, longa
espera main por DB/monitor/park ou pausa GC dominante nas observações JFR. Uma
explicação exclusiva Windows não cobre os históricos Linux. Não foi demonstrado
observador perdendo readiness, relógio errado ou defeito Hibernate. São limites
dessas amostras, não exclusão universal dessas causas em condições diferentes.

Faltam, **na mesma ocorrência acima de40s**: sequência/identidade e intervalos
reais de query/validação, CPU/compilação/classes/GC/esperas, pressão do host/VM e
tempo entre porta, disponibilidade e HTTP. Pilhas antigas sem spans de query e
controles novos rápidos não fornecem essa correlação. Internos SLL→LL/caches do
parser e ordem de inicialização ainda não foram discriminados.

## Próximo experimento concreto, não executado

Planejar uma nova rodada curta, com primeiro alvo Windows/JAR/PG17 e caso exato
releasedProcess da revisão17, mesmo p05/JDK/heap/configuração e recursos do host
declarados. Comparar controle sem agent com captura desde premain, uma tentativa
por condição, sem instalações/compilações concorrentes. Registrar CPU do host e
VM/RSS/pressão de I/O de forma proporcional, com custo do coletor separado.

Na captura, JFR profile com dump antes do destroy já validado aqui e eventos
temporizados de query ligados ao hash/método; se a ocorrência lenta se localizar
em Spring Data HQL, adicionar apenas contador/tempo SLL/LL e carregamento/compilação
associados à query. Não repetir todo o catálogo ou executar SQL financeiro para
simular parsing. Preservar gate40s e, se estourar, até90s apenas para diagnóstico.
Se não reproduzir, encerrar novamente inconclusivo; não aumentar tentativas para
selecionar um resultado. Avaliar antecipadamente custo/reversibilidade do agent.

Trade-off: instrumentação completa identifica fase/consulta, mas altera classes,
JIT e duração; eventos mínimos têm menor custo e menor poder diagnóstico. Ordem
fixa anterior confundiu aquecimento com instrumentação; uma rodada futura deve
declarar e controlar essa variável sem apresentar duas amostras como percentis.
Não há proposta fundamentada de mudança arquitetural/upgrade nesta evidência.

Separadamente, dono operacional deve definir ambiente, início/fim de medição,
orçamento de inicialização e margem aceitos. A ausência de SLO40s documentado
justifica discutir o contrato, não sua dispensa nem implementação de prazo maior.
Nova medição/decisão é sucessora delimitada, não iniciada por este documento.

## Revisão e continuidade

Revisão independente deve conferir os dois commits locais desde c091abb8,
comparar os3 casos da revisão original17 com seus XMLs/logs, inspecionar
associação de queries/dupla contagem e custo do observador, verificar hashes de
preservação e o resultado estrito de cada40s. Não usar a conclusão deste README
como prova. Não há contraprova causal de correção porque nenhuma foi implementada.

Impacto exato: startup integral continua não aprovado; preparação diagnóstica
local pode prosseguir em lote autorizado, mas ativação/adoção real/produção
continuam sem liberação. TCP/reuso Windows/JAR/PG16/17 e recortes RVPLA aceitos
continuam válidos. CF017/P01/P02, CF034 integral, expanded/zoom200%, coordenação
de writers, backup/restore/configuração e gates reais não são encerrados por
associação. Sem push, merge, CI remota, alteração Railway/Vercel ou deploy.
