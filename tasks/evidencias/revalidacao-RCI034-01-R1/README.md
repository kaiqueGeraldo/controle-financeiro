# Revalidação independente RCI034-01/R1 — 25/10/2026

**RCI034-01/R1 encerrado. Recorte local da CF-034 aprovado sob DEC-CI-04.
CF-034 integral permanece em_revisao.** Nenhum defeito residual foi reproduzido
nas classes de entrada e canais examinados. O aceite é delimitado pelo contrato;
não é descoberta universal de segredos nem autorização de publicação/uso.

## Candidato e leitura

- Base: `418a648ba06786f2d0d78a0ed03baf4df0dd1d6d`.
- Candidato: `ea00a0674a01078584dcc075359d60e38115597b`.
- Branch: `codex/cf034-ci-local`; ancestralidade confirmada. Sem trabalho posterior
  ao candidato na entrada, staging vazio e somente README raiz preexistente modificado.
- Commits examinados: `32f4618` (sanitizador/testes), `ea00a06` (documentação/provas).
  Delta de implementação limitado a `.github/scripts/sanitize.mjs` e
  `.github/scripts/sanitize.test.mjs`. Runner, Job Object, UUID, coletores, workflow
  e produto não mudaram. Esta revisão não os corrigiu.

Lidos os caminhos reais de tasks/README, EXECUCAO, POLITICA-DE-TESTES, canônico
CF-034-gates-ci, DEC-CI-04, PROP-CF034-01, DEC-ONB-03, revisão independente anterior
e saneamento-RCI034-01-R1, inclusive contratos, provas, falhas e critérios de
encerramento. Não foram encontrados AGENTS.md no repo/ancestrais consultados;
aplicadas as instruções AGENTS fornecidas pelo usuário. Relatórios do executor
foram confrontados com código, hashes e execuções novas, não tomados como aceite.

## Decisões A–D

**A. RCI034-01/R1 encerrado:** os oito casos independentes originais atendem aos
mesmos critérios. JSON escapado com prefixo perde a senha, conserva diagnóstico
e estrutura; aspa incompleta bloqueia ambos os coletores, sem destino final.
Os arquivos efetivamente publicáveis foram inspecionados. Mutação isolada para
a versão anterior faz exatamente os dois resíduos reaparecerem; contrato de
ausência de senha retorna 1 pela assertion esperada. Restaurado o SHA, os oito
controles voltam a passar. Os formatos JSON/Bearer/cookies já aceitos permanecem
protegidos. A condição objetiva original de encerramento foi satisfeita.

**B. RCI034-L01 preservado:** aceite anterior Windows/processos permanece:
UUID, morte abrupta do runner, filho/descendente encerrados, próximo gate
bloqueado e processo sintético alheio preservado. Arquivos responsáveis idênticos;
nenhum impacto do delta demonstrado que justifique repetir ou reabrir cancelamento.
Não se amplia esse aceite a Ctrl+C nativo, Actions/Linux ou containers após aborto.

**C. CF-034 local aprovada:** encerrado o impedimento de coleta, somam-se os
controles atuais aos aceites anteriores não afetados de comandos/gates ordinários,
isolamento/E2E smoke e rastreabilidade do pacote histórico. Esse aceite atende
ao recorte local delimitado no pedido e na DEC-CI-04; não afirma todos os cenários
de encerramento externo, execução remota ou matriz ampliada. Nenhum novo banco,
browser/E2E financeiro ou pacote foi necessário para julgar o delta.

**D. CF-034 integral/publicação/produção pendentes:** não marcar concluida nem
os checkboxes integrais por associação. CI remota, Actions/Linux, matriz ampliada,
artifacts/imagem remotos, Ctrl+C nativo e descarte de containers após aborto
continuam sem certificação. Zoom nativo 200%, CF-010/015 em_revisao, adoção real
CF-017/P01/P02, gates das sucessoras e limites de produção continuam inalterados.
Nenhuma sucessora iniciada. DEC-ONB-03 não foi ampliada.

## Evidências e limites

- [Matriz de critérios e canais](MATRIZ.md).
- [Execuções, contraprovas e observador original](PROVAS.md).
- [Análise do sanitizador, coletores e limites](ANALISE.md).
- [Preservação, pacote e encaminhamento](PRESERVACAO-E-ENCAMINHAMENTO.md).
- [Entrada Git e duas mudanças autorizadas](entry.json),
  [preservação inicial](preservation-before.json) e [final](preservation-final.json).

Novas execuções: `CF-034/r1-review-01`, `r1-review-02`, `r1-review-03`.
Doze testes Node, oito casos originais antes/depois da mutação, 27 casos
complementares e resumos derivados foram exercitados. Não somar repetições como
novos casos financeiros. Brutos, cópias e outputs grandes ficaram nos runtimes;
somente probes, resultados sintéticos resumidos, hashes e parecer são versionados.

Probes/resultados no commit local `32dc897`; parecer e estados registrados em
commit documental separado. Esses commits não mudam o candidato examinado.

Nenhum push, merge, CI remota, deploy, banco real, notificação real, pacote novo,
clean/reset ou limpeza de target. README raiz fora dos commits, hash histórico
inalterado. Próximo passo permitido: preparar uma etapa separada de publicação
revisada e execução remota controlada, sujeita à autorização específica do usuário.
