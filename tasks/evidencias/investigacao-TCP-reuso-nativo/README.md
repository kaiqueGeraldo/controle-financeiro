# Investigação dirigida TCP/reuso nativo — 28/10/2026

**Correção implementada localmente, aguardando revisão independente.** A janela
foi reproduzida no mesmo probe/JAR e em dois processos sintéticos: no Windows,
`waitFor`/`isAlive=false` antecederam a liberação TCP e o bind imediato encontrou
o listener ainda atribuído ao PID encerrado. O harness confundia essas condições.
Não foi demonstrado TIME_WAIT, processo órfão, ocupação alheia ou defeito de produto.

Base/ancestralidade conferidas em
`3b245d9dd23e876700507718767827ea5e9f8a11`, branch original
`codex/preparacao-local-adocao`. Branch local própria
`codex/diagnostico-tcp-nativo`. Diagnóstico/probes em
`6af9e4304b57f4c7edb328309cada5f4b5a0fdb2`; correção/testes em
`b8b645d00556307e6d7405968277f22c779f7983`; documentação/estados no commit
seguinte identificado na entrega. Nenhum push, merge ou rebase.

## Contrato e conclusão causal

Tomcat escolhe/reserva a porta real0; o harness descobre pelo log de sua JVM.
`App.close` encerra essa JVM e o probe independente exige bind imediato na
**mesma porta**, preservando prontidão/identidade e o serviço alheio. O contrato
da fixture é explícito, mesmo sem SLO correspondente encontrado no produto.

A correção acrescenta confirmação externa de ausência dos endpoints próprios
ao close nativo Windows de porta conhecida, compartilhando os budgets originais
de10s/5s. Inspeção inconclusiva/retida/estourada falha; sem sleep de sucesso,
retry de bind, troca de porta ou relaxamento de sockets. Docker/Linux/porta0
continuam no ramo anterior. Somente código de testes foi alterado.

Os dois erros históricos têm a mesma exceção/linha32 após prontidão e processo
ausente, mas **não têm amostra TCP no instante do erro**. A reprodução equivalente
explica um mecanismo causal do harness; não inventa o estado perdido de cada
ocorrência. [Contrato, comandos, ocorrências e timeline](CONTRATO-E-OCORRENCIAS.md).

## Provas, contraprovas e estados

- Originais corrigidos PG16/JAR e PG17/JAR:3/3 por invocação, incluindo negativo
  de listener retido; sem erros/falhas/skips. Grupos se sobrepõem.
- Reverter o close na cópia restaurou BindException; tornar a inspeção falha
  bloqueou close/reuso. Fontes restauradas por SHA, controle final verde depois.
- Controle final: replacement do PID do teste, ConnectException no endereço
  antigo após fechá-lo, alheio preservado, amostra final vazia.
- Primeira invocação PG16 falhou2 vezes por startup40s, antes de validar TCP.
  Essas falhas permanecem. Nenhuma reclassificação causal para HQL.

[Matriz completa, custo, contraprovas e limites](VALIDACAO.md),
[plano e refinamentos prefixados](PLANO.md), [recibos/resultados](resultados.json),
[comandos reproduzíveis](COMANDOS.md), [encaminhamento A–E](ENCAMINHAMENTO.md).

| Conclusão | Estado |
|---|---|
| A — TCP/reuso |Saneado localmente; revisão independente pendente, sem autoencerramento |
| B — contenção/quiescência |RVPLA-01/03/04/05 e EPERM preservados nos recortes aceitos; runner/broker/mailbox intactos |
| C — startup HQL |Inconclusivo,40s mantidos; próximo experimento delimitado somente preparado |
| D — preparação local |Aceites anteriores mantidos; CF017/P01/P02 e CF034 integral em_revisao |
| E — adoção real |Não liberada; configuração/gates remotos e demais pendências preservados |

## Preservação e proveniência

Inventário anterior de25.100 entradas e referências integralmente conferido,
mais3.630 arquivos do runtime residual anterior. Manifestos inicial/final desta
investigação:30.962/30.964 entradas; único delta autorizado entre as entradas
iniciais é `src/test/.../AdoptionRuntimeTest.java`, mais dois helpers de teste
novos no inventário final. Backend `src/main`, frontend,16 migrations,29 históricos,
provas independentes/checkpoints/runtimes antigos intactos. Contagens de inventário
não pretendem deduplicação física de caminhos representados de formas distintas.

README raiz alheio fora dos commits, SHA-256 inicial/final
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.
JAR p05 preservado:
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`,
produtor anterior `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`. Maven test na cópia
compilou classes/testes; não gerou pacote novo nem build atribuível ao HEAD atual.

Coletados95 artefatos com SHA bruto/coletado e sanitização/conversão explícitas;
inventariados1.479 arquivos novos, incluindo classes somente por hash. Originais
em `../controle-financeiro-runtimes/preparacao-adocao/tcp-nativo-20261028-01/`,
sem sobrescrever execuções anteriores. Exportação inicial834 inputs,833 intactos
e um harness com delta autorizado; probes adicionais e mutações isoladas têm
recibos/fontes próprios. [Preservação inicial](preservacao-inicial.json),
[final](preservacao-final.json), [inventário novo](runtime-files.json).

Auditoria final somente por leitura:0 processos associados,0 endpoints nas portas
amostradas,0 containers ativos; Java preexistente20288/nascimento original vivo.
Sem banco real, clean/reset destrutivo, limpeza geral de target, políticas globais,
Railway/Vercel, CI remota, publicação ou deploy. Nenhuma liberação nova.
