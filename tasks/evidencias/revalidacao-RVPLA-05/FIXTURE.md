# Fixture alheia — classificação própria

**Categoria B: fixture terminou naturalmente antes da observação histórica.**
O Java OwnedTree original abre socket, publica identidade e espera `stop-java`
ou30s em relógio monotônico. Não há outra saída normal no trecho. O source SHA
`de1fd374659eac94e805ffffab23125a005b2be2a5208654260395246a496c60`
permaneceu intacto; nenhum lifetime/assertion do original foi ampliado.

Na rodada do saneamento: fixture iniciou em2026-10-28T01:20:33.327Z; o checkpoint
que antecede a assertion de preservação foi publicado01:21:16.036Z, **42,709s**
depois. A assertion recebeu exitCode0 em vez de null; não existe `stop-java`
da fixture antes da falha. O runner só termina seus Jobs privados, e o alheio
foi criado pelo teste fora deles. Não há indício de término solicitado pelo
runner. Não se inventa evento exato de exit ou identificação de um handler na
captura histórica, que não os registrou.

Nesta revisão, o probe completo original foi reexecutado uma vez, sem alteração
de critérios. O trace identificou a fixture23732, criada pelo próprio probe e
fora dos guardiões: `spawned`01:59:43.793Z, exit/close **02:00:14.111Z**,
~30,318s monotônicos após spawned, code0/signalnull.
Não há stop-own direcionado a essa identidade antes do exit nem marker stop-java.
A sequência não alcançou a assertion original: falhou antes no retorno20s.
Logo, **não é reprodução integral verde nem repetição da assertion0≠null**;
é observação independente do autodesligamento previsto, compatível com a causa
histórica. Os cenários posteriores do grupo completo não foram executados.

## Complemento com ciclo de vida explícito

ReviewForeign abre socket/ready e aguarda `test-release`, sem expiração temporal.
Foi criado pelo teste fora da supervisão; identidade PID+nascimento foi conferida
antes e depois do mesmo probe control original, com20s intactos. Continuava vivo
após~39,896s de script A/B. O probe falhou no prazo, resultado preservado; o oracle
independente de processo alheio passou e **não** aprova o prazo do runner.

Para demonstrar sensibilidade, o teste simulou cleanup indevido terminando **só
sua própria fixture pela identidade exata**, antes de uma segunda observação.
O mesmo oracle acusou FOREIGN_PROCESS_TERMINATED_BEFORE_OBSERVATION, exit1,
usando o estado real do processo. Isso é mutação do cenário, sem alteração do
supervisor nem alegação de que o runner tenha efetuado esse término. Outro
exemplar confirmou a saída normal por `test-release`, motivo gravado e exit0.

Esse complemento não retoca o original nem converte o grupo antigo em verde.
Os4 cenários do broker também preservaram processo alheio do mesmo nome e outra
execução legítima. Não houve kill por nome/porta/PID isolado. A constatação da
fixture não reabre RVPLA-03 sem evidência concreta de término indevido, e não
remove a falha pertinente de latência RVPLA-05.
