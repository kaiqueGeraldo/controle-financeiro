# Diagnóstico delimitado dos dois timeouts Linux

**Conclusão D: causa histórica inconclusiva.** Os dois timeouts não foram
reproduzidos na matriz dirigida. Os controles passaram com os mesmos dados e
assertions, mas isso não resolve a falha anterior nem sustenta correção causal.
Nenhum componente, teste funcional, timeout ou configuração de concorrência foi
alterado. A rodada reprovada continua preservada e não houve nova expanded.

Base inicial: 2a22739b08b749a73b37224519ab6a3faf880ab3, limpa, branch
codex/saneamento-pr3-expanded. Candidato anterior a7f2256b; diferença posterior
somente documental. Mesmos 860 inputs de 0aac7ccd, digest
d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660.
Instrumentação em cópia Linux descartável, com deltas/hashes explícitos.
Scripts novos foram executados a partir do delta local; seus bytes exatos ficam
arquivados no runtime e vinculados à versão entregue. Não se atribui execução
anterior aos commits documentais posteriores.

## Natureza dos cinco segundos

Em Vitest 4.1.11, 5000 ms é o watchdog padrão de teste no modo Node/jsdom.
Não há override nesses casos/config nem assertion explícita de desempenho de 5 s.
O callback do teste e sua Promise entram nesse orçamento: render, interações,
waits e assertions executados no corpo. beforeEach/afterEach têm orçamento
separado de 10000 ms; coleta/import/transform também ficam fora desse watchdog.
A duração reportada do caso pode incluir hooks e não equivale ao tempo só do corpo.

O código instalado usa timers seguros reais e verifica o tempo novamente ao
retornar do callback. Assim, um teste síncrono pode concluir as operações e ser
reprovado pelo tempo total, mesmo sem o timer poder interromper o JavaScript.
Isso não identifica retrospectivamente qual operação consumiu o prazo.

findBy/waitFor têm orçamento próprio de 1000 ms, intervalo 50 ms e observação de
mutações nesta versão de Testing Library. Não confundir esse wait, tempo de
interação, watchdog do framework e latência normativa do produto. Nenhum requisito
de produto 5 s correspondente foi identificado nos contratos consultados.
Fontes: versão/código instalado arquivado por hash e documentação oficial de
[testTimeout](https://vitest.dev/config/testtimeout) e
[hookTimeout](https://vitest.dev/config/hooktimeout).

## Casos e resultados

| Identidade exata | Ocorrência anterior |
|---|---|
| CF-013: cartões, faturas e planejamento lista longa mantém a ação de pagamento fora da área rolável — tests/component/cards-planning-audit.test.tsx |5769,337 ms reportados; Error: Test timed out in 5000ms. |
| compares conflict snapshots and does not silently choose the server — src/screens/private/onboarding/screen.test.tsx |5432,949 ms reportados; mesma mensagem |

| Experimento | Seleção | Resultado | Tempo do caso fatura / onboarding |
|---|---|---|---|
| A fatura |caso isolado |1 passou;6 não selecionados pelo filtro |578,571 ms / — |
| A onboarding |caso isolado |1 passou;10 não selecionados |— /519,465 ms |
| B fatura |arquivo completo |7/7, zero skips |448,713 ms / — |
| B onboarding |arquivo completo |11/11, zero skips |— /246,548 ms |
| C |6 arquivos relacionados/sobrepostos |69/69, zero skips |1185,194 ms /235,471 ms |
| E |microprobe separado 20/40/80 |3/3;7 casos originais não selecionados |não substitui o caso 80 |
| C8 |controle final de 8 arquivos |100/100, zero skips |629,639 ms /190,697 ms |

Os grupos são sobrepostos e não são somados como identidades distintas.
C8 contém 100 chaves arquivo+título distintas; os filtros A/E são seleções
diagnósticas explícitas. Não há gate 626 aprovado ou seleção de release reduzida.

C8 foi o único complemento por informação nova: os intervalos de arquivos no
relatório anterior atingiram pico 8, enquanto C mediu 6 workers. Acrescentaram-se
temporal-forms e onboarding/identity-remediation, presentes no pico anterior.
Intervalo de arquivo não mede worker/importador; esse controle não reconstrói
toda a carga dos 71 arquivos originais. Após C8, a matriz foi encerrada.

## Linha do tempo medida — A isolado

Tempos emms, relógio monotônico real capturado antes de fake timers. Etapas
contidas em uma etapa maior não devem ser somadas novamente.

| Fatura | Custo observado |
|---|---:|
| beforeEach: mocks, fake timers e relógio fixo |1,545 até marcador preparado |
| criação das 80 transações |0,081 |
| renderização completa |216,159 |
| getByRole do botão de pagamento |318,089 |
| assertion shrink-0 do contêiner |0,558 |
| consulta/assertion da transação 79 |23,135 |
| cleanup React |13,421 |
| intervalo instrumentado, incluindo hooks/overhead |576,949 |

A fixture permaneceu80 em todos os controles funcionais. Um commit de render;
2534 elementos e 496 chamadas a getComputedStyle. A consulta de papel/nome foi
o maior custo observado; formatação de data/moeda não dominou. Não há wait ou
Promise no corpo desse caso. Fake timers foram restaurados; DOM ficou vazio.

| Onboarding | Custo observado |
|---|---:|
| preparação de mocks/crypto |2,138 até marcador preparado |
| render+findBy do cabeçalho+user-event.setup |103,028 |
| consulta do campo |17,604 |
| digitação real de Resposta local |101,844 |
| consulta+clique em Salvar rascunho |27,489+27,029 |
| preparação do mock de resposta remota |0,058 |
| consulta+clique em Verificar salvamento |18,299+142,211 |
| espera pela região Comparar rascunhos |7,996 |
| assertions local/remoto e uma gravação |45,369 |
| cleanup React |22,575 |
| intervalo instrumentado, incluindo hooks/overhead |517,975 |

Timers reais; 24 commits de renderização, 2 GETs simulados e 1 save, 1446 elementos.
As esperas instrumentadas terminaram; nenhum estágio ficou pendente no flush.
A normalização ocorre na gravação pelo fluxo real; as interações não foram
substituídas por chamada interna. Assinaturas/effects têm cleanup no código
consultado, e o DOM ficou vazio nos controles. Isso não prova ausência universal
de Promise/listener pendente nem reconstrói a condição da rodada histórica.

Nenhum teste expirou com instrumentação. O ponto exato aos 5000 ms da ocorrência
original permanece desconhecido; o stack antigo aponta a declaração do teste,
não a etapa lenta. Não apresentar uma etapa medida agora como causa confirmada.

## Custo por fixture e recursos

No microprobe 20/40/80:674/1294/2534 elementos e 136/256/496 chamadas de estilo.
São 31n+54 elementos e 6n+16 chamadas nessa estrutura, compatíveis com render/map e
varreduraO(n), para n transações. Tempos totais181,271/146,413/259,434 ms e consultas
78,105/71,995/151,020 ms. Warm-up tornou20 mais lento que40; essas três amostras não
estabelecem um limite geral de latência nem demonstram gargalo assintótico.
O probe teve assertions próprias e foi restaurado por SHA256; não reduziu os80
itens nem substituiu o caso original.

Imagem exata sha256:c7492c6f8ef9a57a98ff15dc7a6c82a96712b99a97a5fa19edb9576a7b34d5b1;
Node 24.18.0 e dependências do mesmo lock; jsdom, sem navegador real ou backend.
Fonte/dependências executadas em /work/s nativo, sem bind como filesystem de execução.

16 CPUs visíveis, limite padrão de 15 forks derivado do código instalado; workers
efetivos 1/6/8. Container sem quota específica de CPU/memória, dentro da capacidade
da VM Docker Desktop. C8 observou cerca de 1,61 GiB de RSS somado com amostragem de 500 ms.
Nenhum throttling ou PSI de memória; stalls de CPU baixos nos controles.
A/B precederam C/C8 na mesma instalação; processos de teste eram novos, mas ordem,
aquecimento por casos anteriores e caches diferem do contexto integral inicial.
Essas amostras não excluem picos não capturados nem permitem atribuir a causa à
pressão histórica, que não foi medida na rodada reprovada.

D/maxWorkers2 não foi executado: não houve contenção medida que justificasse
redução de concorrência. Não se desativou paralelismo nem mudou CI remota.
Não há evidência para aumentar o watchdog; estreitar seletores sem preservar
acessibilidade/unicidade também poderia esconder regressão e não foi aplicado.

## Restauração, limites e próximo experimento

Overlays, helper e bloco do microprobe foram restaurados/removidos por hash.
sourceFor voltou aos 860 arquivos/digest original. Executor próprio encerrado,
sem processos de teste ativos; recursos Docker históricos coincidem com baseline.
Relatórios, timelines, versão do framework e todos os exits ficam privados no
runtime componentes-timeout-20261103-01, com referências SHA256 em
[DIAGNOSTICO.json](DIAGNOSTICO.json). Não houve cópia recursiva do acervo antigo.

READMEs dos dois checkouts, 1.113 referências, originais dos 11 deltas, relatórios da
rodada reprovada, provas independentes, migrations, pacotes e runtimes conferidos
inicial/finalmente. README principal mantém
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
A única atualização de estado é documental em CF034; não promove aceite.

Sem causa demonstrada, não há correção ou mecanismo antigo legítimo a reintroduzir.
Não se forçou timeout artificial. A condição dos itens 11/13 do pedido para avançar
a 626 após correção causal não foi satisfeita. Componentes completos, builds,
backend, RF15, E2E financeiro e pacote não foram executados neste diagnóstico.

Próximo experimento específico, proposto e não executado: uma única reprodução
instrumentada dos 626 componentes/71 arquivos no contexto integral original,
mesmo teto padrão de forks/watchdog, registrando início dos dois casos e etapa
ativa antes da expiração, atividade de import/transform dos forks e recursos/
agendamento da VM e do host. Encerrar após essa execução, reproduza ou não.
É diagnóstico de contexto, sem executar expanded nem inventar correção por verde.

As alterações operacionais 9d3c384a..2a22739b e este novo delta seguem para revisão
conjunta; não foram autoaprovadas ou reabertas por associação. DEC-ZOOM-05,
CF010/CF015 e CF017/P01/P02 mantêm limites/pendências. Sem push, PR, CI remota,
merge, hospedagem, deploy ou banco real.
