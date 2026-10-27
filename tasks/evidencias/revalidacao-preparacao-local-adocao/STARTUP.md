# Startup: classificação independente

**Inconclusivo para previsibilidade no gate40s.** Falhas de observação existem,
mas não há causa completa demonstrada nem defeito de query confirmado. O delta
do candidato não altera fontes/configuração de produto nem bytes do JAR p05.

| Grupo | Ocorrências e conclusão |
|---|---|
| A — explicadas por corrida de porta | Saneamento original: readiness interrompido por “Port52317 already in use”; reprodução determinística e mutação antiga confirmam a janela reserva/liberação/bind. Não identificam o ocupante da ocorrência natural |
| B — ainda não explicadas | p03:1 estouro por classes; p05:3 por JAR; p04 restored witness:2 Linux; revisão independente:3 dos17 contratos originais. Logs/pilhas/hashes preservados; não há prova de bind nessas ocorrências |
| C — prontidão dentro do controle | Três contratos afetados passaram novamente em PG17/JAR e imagem. Diagnósticos anteriores:37,365/34,321s e23,215/21,137s. Não são amostra suficiente para SLO/percentis nem apagam B |
| D — além do limite, somente diagnóstico | Observadores permitiam90/100s para capturar dados; não aprovam gate após40s. Nas duas timelines do saneamento a primeira prontidão foi antes40s. Attach/pilhas25/35s localizam trabalho, sem inferir sucesso posterior |

A duração JUnit inclui fixtures/migrations/cleanup e pode haver dois processos
por caso; não equivale a tempo de boot. O gate usa nanoTime,40s, connect1s,
request8s e espera100ms. Requisição/consulta já em curso pode ultrapassar a borda
externa; o delta não corrige nem aprova um limite de parede rigoroso. A descoberta
Docker tem teto5s. Não houve aumento de timeout ou repetição para substituir falha.

Origem40s: commit8605ea425706c82328ceb6e0283644b8dbe976a2 no harness. Nenhum
SLO correspondente foi identificado no SDD consultado. A ausência de SLO não
dispensa o critério. Eventual proposta de orçamento precisa decisão posterior
baseada em recursos, condições frias e variância; prazo do provedor é separado.

As duas timelines foram reconferidas nos logs brutos, além dos hashes dos
162 artefatos originais/coletados da revisão/saneamento. Native:76 hashes/76
preparações HQL, soma2363,883ms, maior566,595ms; imagem:76/76, soma2176,960ms,
maior611,578ms. Nenhuma repetição ou chamada isolada de40s nessas rodadas.
JFR Linux3.399.604bytes/SHA486d1c84…060ed confere. JFR nativo0bytes é inválido.
O agent/JFR acrescenta class loading/JIT/trabalho; as rodadas rápidas não
explicam causalmente os estouros históricos. A revisão não tomou soma de amostras
como tempo exato de CPU ou ausência universal de espera SQL/GC.

Na reprodução anterior, main RUNNABLE em ANTLR→HqlParser→JpaQueryEnhancer→
SimpleJpaQuery após Hikari/JPA, com CPU alta. Há histórico Linux e Windows;
não concluir exclusividade de SO, query específica ou impossibilidade de subir.
Heap384m nativo e ergonomia da imagem, carga de instalação npm anterior e custo
do attach são fatores declarados, não causas comprovadas. Timezone São Paulo
nativo/UTC imagem foi respeitado nas timelines; nanoTime mede probes.

Nenhum experimento HQL adicional foi executado: os dados existentes não fornecem
uma nova hipótese discriminante melhor que capturar uma ocorrência lenta.
O experimento de porta é causal e limitado, sem simular explicação para HQL.

Próximo trabalho concreto: uma captura fria nativa e uma Linux, sequenciais, mesmo
JAR/digest/JDK/heap/configuração, PG já pronto/schema validado, CPU/memória/carga
registradas, sem compilação/instalação concorrente. Instrumentar sequência real
com tempos por hash e JFR; flush explícito antes de encerrar, inclusive no Windows.
Registrar resultado40s independentemente; observar até90s somente para diagnóstico;
parar após essas duas observações, mesmo sem reprodução. Se lento e soma HQL
domina, localizar método/ordem e comparar alteração mínima em nova execução;
se class loading/JIT/GC domina, comparar esse custo; se DB/lock domina, evidência
JDBC/espera; se tudo rápido, manter inconclusivo e decidir plano amostral/orçamento
em etapa própria. Não alterar produto sem esse vínculo causal.

O critério ainda ausente é explicação/controle discriminante das falhas e aceite
documentado da previsibilidade sob o orçamento aplicável. Publicação/ativação da
API e preparo integral continuam sem liberação. Isso não bloqueia investigação
local nem encerra as obrigações reais de CF017/CF034 por associação.
