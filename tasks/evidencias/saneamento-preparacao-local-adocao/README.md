# Saneamento dirigido da preparação local — 26–27/10/2026

**Entrega em_revisao, sem autoaprovação.** RVPLA-01 corrigido no runner local.
Uma corrida de porta do harness foi reproduzida e corrigida. A causa dos estouros
históricos durante trabalho HQL permanece inconclusiva; startup previsível e
publicação continuam sem aprovação. Não houve alteração de produto ou pacote novo.

Base conferida: `07c396371029d9942b8667e5c638c04a9e6aeb4b`, branch
`codex/preparacao-local-adocao`; revisão161cd88 preservada como ancestral.
Intervalo de código/testes/probes:
`07c396371029d9942b8667e5c638c04a9e6aeb4b..b7b3be7ac919b3f9da0c3cb42929eb11ecef772f`.
O commit documental posterior e o estado Git final são informados na entrega.

| Parecer do executor | Resultado / limite para revisão independente |
|---|---|
| A. Resume | Corrigido localmente;28 cenários passaram, defeito antigo detectado por mutação, prova causal real em PG17 reutilizada com hashes/identidade/quiescência válidos |
| B. Startup | Corrida de porta do observador corrigida e comprovada; diagnóstico HQL aprofundado, sem causa completa dos estouros históricos. Não declarar startup integral corrigido |
| C. Aceites anteriores | Produto/configuração de runtime, queries, migrations e frontend idênticos; aceites PG16/17, inicialização/writers/jobs, saúde/preview e bytes do pacote preservados no alcance do parecer anterior |
| D. Adoção/produção | Não liberadas. Nenhum acesso ao banco real, alteração remota, push, merge, CI ou deploy |

## RVPLA-01 — causa, correção e provas

O finally antigo persistia status1 mesmo quando a validação causal lançava erro.
Resume filtrava esse status e pulava o caso como concluído. A reprodução **executou
tentativa e resume reais do script original**, byte idêntico ao blob07c3963
(SHA55849ecb4ca86ba98db2a1a07aeccb41c713f56e0b78c0c4da8c054a344e9292).
Falha de infraestrutura injetada em spawnSync, antes da observação, gerou status1,
registro persistido e skip indevido. Nenhum PostgreSQL ou Docker real nessa fixture.
Não é somente avaliação estática do predicado.

O mesmo cenário com o runner final mantém a tentativa falha, cria0002 no resume,
não avança ao caso seguinte e confere restauração. Reintroduzir o predicado
status===1 em cópia isolada faz a regressão falhar; fonte/cópia restauradas por SHA.
Além das fixtures, uma mutação real de preflight em PG17.11 gerou a assertion
esperada; resume revalidou e reutilizou sua conclusão, sem repetir Maven. Alterar
o observador recusou o checkpoint anterior, com exit não zero e sem reutilização.

[CONTRATO-RETOMADA.md](CONTRATO-RETOMADA.md) define estados, identidade, evidência,
restauração e compatibilidade. Implementação em
[counterproof-checkpoint.mjs](../preparacao-local-adocao/counterproof-checkpoint.mjs),
[verificador causal](../preparacao-local-adocao/counterproof-observation.mjs) e
[runner](../preparacao-local-adocao/counterproofs.mjs). Commits5078b40,09315b6 e
b7b3be7. O último cobre filhos nativos cujo comando referencia um JAR compartilhado,
sem o diretório do runtime. Um helper Java inofensivo fora do diretório foi detectado
antes de Maven; após encerrar somente esse PID conhecido, a prova PG17 terminou e
foi reutilizada. Recibo final em execucao/saneamento-quiescencia-01/quiescence.json.

O verificador também rejeita o receipt histórico p04 de readiness: aquela rodada
parou antes do probe com banco congelado. O status1 não certifica detecção causal.
Arquivo e falha históricos permanecem intactos. Isso não revoga o aceite da
implementação de saúde: a revisão independente possui sua contraprova estreita
`OperationBoundaryProbeTest.readyDatabaseProbeObservesRealUnavailableDependency`,
com503 esperado/200 observado, e controle restaurado próprios. Nenhum resultado
ambíguo antigo foi promovido ou convertido silenciosamente para o formato novo.

## RVPLA-02 — conclusão delimitada

[STARTUP.md](STARTUP.md) registra os três casos originais, configurações,
instrumentação, timeline, hipóteses e próximo experimento. Na rodada original
dirigida, dois casos passaram; readiness falhou com **Port52317 already in use**,
antes de40s. Não confundir essa falha com os estouros HQL anteriores.

A reserva temporária ServerSocket era fechada antes do Tomcat abrir o listener.
Um concorrente podia ocupar a porta nesse intervalo. A reprodução determinística
ocupou exatamente essa porta na cópia original e observou a falha do processo.
Agora Tomcat escolhe/reserva porta0; Docker reserva uma publicação dinâmica em
loopback. O observador descobre o endereço realmente vinculado, dentro do mesmo
orçamento40s, e continua fazendo HTTP real. Não houve mudança de readiness,
segurança, validação de schema/queries, heap do gate ou timeout/retry.

Regressão nova mantém outro listener aberto: com o alocador antigo, falha por
colisão; com o novo, a aplicação fica ready em outra porta. Mutação isolada foi
detectada e a fonte restaurada. Commit48856ab contém apenas testes/harness.

No diagnóstico,76 preparações HQL distintas foram observadas na ordem real de
bootstrap, sem repetição de hash: soma2,364s nativo/2,177s Linux; maior chamada
0,567/0,612s. Instrumentados, ficaram ready em23,215/21,137s. Isso não reproduz nem
explica os estouros antigos; não foi aplicada otimização especulativa de produto.
JFR Linux válido; JFR nativo vazio no encerramento não conta como prova. Probes e
limitações da instrumentação pertencem ao commit9f1c1f1.

## Execuções, sem soma de casos sobrepostos

| Rodada | Resultado original / interpretação |
|---|---|
| Resume original02 / reprodução pelo blob Git | Tentativa exit1, registro status1, resume exit1 após pular indevidamente o primeiro caso; fontes restauradas |
| Runner final, saneamento-runner-03 | 28 passaram;0 falhas/skips. Preparação, observação, interrupções, sobrevivência, restore, arquivos inválidos, identidade, concorrência e quiescência |
| Resume corrigido03 / mutante03 | Falha pré-efeito continua falha e é reexecutada; predicado antigo detectado por assertion; hashes restaurados |
| Resume real02 | Preflight mutante em PG17 detectado por assertion; conclusão validada/reutilizada; audit scoped executou zero testes novos |
| Quiescência nativa final | Helper fora do runtime bloqueou avanço antes de Maven; após encerramento do PID próprio, prova PG17 causal concluída/reutilizada e audit sem testes novos |
| Três contratos originais no JAR | 3 executados;2 passaram,1 falha de porta;0 erros/skips. Sem editar o observador original nessa rodada |
| Reprodução da corrida original | 1 passou, comprovando processo recusado por porta ocupada antes de40s |
| Diagnóstico instrumentado | Wrapper1/1; duas observações, nenhuma certificação estatística de startup |
| Harness corrigido, PG17/JAR | 4 passaram: três contratos afetados e regressão de porta;0 falhas/erros/skips |
| Harness corrigido, PG16/JAR | Regressão de porta1/1; sem repetir indiscriminadamente migrações/financeiro |
| Harness corrigido, PG17/imagem | Os3 contratos afetados passaram;0 falhas/erros/skips |
| Contraprova do alocador antigo | 1 falha esperada,0 erros/skips; colisão causal e fonte restaurada por SHA |

Preservadas as rodadas intermediárias: primeira reprodução interrompida por URL
ESM Windows incorreta antes de entrar no runner; primeira rodada Node bloqueada
por EPERM no rename atômico do diretório temporário do sandbox (21 casos falharam
antes dos efeitos de checkpoint esperados); depois21/27/28 passaram em runtimes autorizados após
preparação/expansão do mecanismo. Não se removeu gravação atômica para obter verde.
O primeiro coletor excedeu o buffer ao enumerar o Git inteiro; a consulta foi
restrita aos inputs pertinentes, sem repetir testes. A saída Node EPERM original
permanece no histórico da execução; o recibo desta coleta descreve o fato e não
se apresenta como log bruto inexistente. Falhas de produto/harness/fixture/ambiente
e causa inconclusiva são separadas, sem substituir a primeira rodada por verde.

[resultados.json](resultados.json) contém contagens JUnit/TAP, artefatos coletados,
hashes original/coletado e sanitização; logs/XML/checkpoints em [execucao](execucao).
Cópias sanitizadas são evidências de leitura, não checkpoints portáveis de resume.
Alguns nomes coletados foram encurtados para respeitar caminhos Windows; o mapa
preserva nome/origem completos e hashes, sem mover ou alterar o original do runtime.
Originais, JFR, agent, backups e targets mutantes permanecem nos runtimes novos
`../controle-financeiro-runtimes/preparacao-adocao/saneamento-*`, sem limpeza.

## Pacote e preservação

**Nenhum pacote de produto novo.** O JAR p05 continua ligado aos inputs
`24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`, SHA-256
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`.
Imagem antiga ID8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1
foi executada sem rebuild/push. O JAR do agent é ferramenta diagnóstica externa,
não uma revisão do produto. Seus hashes e Byte Buddy1.17.8 estão nos recibos.

Exportações de teste registram HEAD então07c3963/5078b40/48856ab e o delta local declarado;
seus832 inputs brutos e blobs normalizados conferem com o commit de código b7b3be7.
Contra os831 inputs do pacote anterior, mudaram somente AdoptionRuntimeTest e a
nova AdoptionPortAllocationTest. Nenhum input de produção/CI/frontend/lockfile muda.
Os831 inputs preservados do runtime p05 também conferem com seu manifesto antigo.

README raiz inicial/final:
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`,
fora dos commits. [Preservação inicial](preservacao-inicial.json) e
[final](preservacao-final.json) confrontam29 históricos,16 migrations e327 arquivos
protegidos, incluindo provas independentes e os recibos anteriores. Sem clean,
reset, repair, reescrita de histórico ou limpeza geral de target.

## Limites e próximo passo

Aceites locais anteriores permanecem no alcance do parecer07c3963; o delta não
altera regras financeiras, queries, locks ou contratos de produto. Não houve
mudança que justificasse repetir a suíte financeira integral, frontend ou E2E.
CF017/P01/P02 e CF034 integral não são encerradas; CF035/036 continuam propostas.
Expanded, zoom200% e limites de cancelamento permanecem pendentes.

As pendências remotas observadas na revisão continuam registradas: Hibernate
update, healthcheck ausente, previews/destino compartilhados e backups não listados.
Não houve nova inspeção ou alteração remota neste saneamento. Classificação A–D,
freeze/drenagem, backup/restore reais, proveniência e autorização de adoção continuam
separados. [Encaminhamento independente](ENCAMINHAMENTO.md) e
[comandos](COMANDOS.md) delimitam a revalidação do delta.
