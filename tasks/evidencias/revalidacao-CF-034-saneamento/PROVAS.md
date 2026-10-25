# Execuções, contraprovas e observadores

Todos os diretórios abaixo são novos sob CF-034. Não reutilizar seus nomes para
nova execução. Nenhum npm de produto, Maven, browser, banco ou suite financeira
foi iniciado. npm dos probes usa lockfile vazio, cache próprio e offline.

```text
node tasks/evidencias/revalidacao-CF-034-saneamento/review.mjs inventory
node tasks/evidencias/revalidacao-CF-034-saneamento/review.mjs run ../controle-financeiro-runtimes/CF-034/v01
node tasks/evidencias/revalidacao-CF-034-saneamento/sanitization.mjs ../controle-financeiro-runtimes/CF-034/v02
node tasks/evidencias/revalidacao-CF-034-saneamento/finish-observers.mjs ../controle-financeiro-runtimes/CF-034/v03
node tasks/evidencias/revalidacao-CF-034-saneamento/uuid-tree.mjs ../controle-financeiro-runtimes/CF-034/v04
node tasks/evidencias/revalidacao-CF-034-saneamento/uuid-tree-v2.mjs ../controle-financeiro-runtimes/CF-034/v05
node tasks/evidencias/revalidacao-CF-034-saneamento/provenance.mjs ../controle-financeiro-runtimes/CF-034/v06
node tasks/evidencias/revalidacao-CF-034-saneamento/review.mjs final
```

v01 e v04 não são rodadas integralmente verdes. Seus erros de observador e
resultados parciais são preservados, conforme abaixo. Não somar repetições ou
subconjuntos como novos casos financeiros.

## Provas concluídas

- [eight-tests.json](eight-tests.json): oito testes Node relatados reexecutados,
  todos passam, zero failures/skipped/cancelled/todo. TEMP/TMP no runtime próprio.
  Eles não exercitam as duas entradas residuais novas e não substituem análise.
- v01 copia a fonte/JAR/recibos históricos para baseline **novo**, sem mutar s01
  ou 11. Copia observadores proofs.mjs, preservando assertions/prazos; imports e
  baseline apontam para cópias próprias. Nove controles/mutações concluídos estão
  em [rerun-proofs.json](rerun-proofs.json), antes da falha de relocação.
- Sanitização original: bytes b59b7f23… dos mesmos sentinelas/diagnóstico passam.
  Mutação para algoritmo anterior restaura as três passagens; algoritmo corrigido
  é restaurado por SHA 0898be0d… e controle volta a proteger. O experimento exit 0
  significa detecção do vazamento esperado do mutante, não sanitização aprovada.
- Subprocesso23 produz runner 1, só install/lint. Componentes exit 0 sem JSON causa
  ENOENT/runner 1 e impede build/backend/E2E/pacote. TAP da fixture é sintético para
  alcançar o gate de relatório, não uma suíte temporal.
- JAR em cópia sofre um byte alterado; package retorna1/Package changed, sem
  artifact. Finalmente restaura SHA 28b13d76…; nenhum build/teste novo de produto.
- Job com flag removida deixa membros ativos, apesar de runner 130. Handles
  demonstram falha; cópia PS1 restaurada SHA 9608d89d… e controle posterior termina
  membros antes do natural. Filho não zero e quoting Windows são conferidos.
- v02 executa oito variações de conteúdo/coleta. Seis satisfazem os controles;
  duas mantêm sentinela. Publicação real do runner e coleta durável reproduzem
  mensagem aninhada; assertion dedicada termina 1 pela presença proibida.
- v03 conclui somente original abrupto e suplemento que faltaram: console/chunks,
  coleta durável em sucesso/erro, comando terminado/descendente e YAML/condições.
- v05 amplia observação independente para UUID errado e filho+descendente na
  morte abrupta; testes de associação falha e processo sintético alheio completam
  os controles. Saída130 só é exigida do protocolo cooperativo.
- v06 prova exclusivamente a nova fronteira de coleta do manifesto histórico:
  semântica preservada e hashes de representação separados. Não certifica pacote
  novo ou reexecuta os testes do JAR antigo.

## Falhas dos observadores nesta revalidação

**v01:** o adaptador inicial aplicou substituição de import a todo o texto do
observador e também alterou um literal usado por ele para gerar outra cópia.
Assim, original-abrupt.mjs gerado conservou import relativo incorreto. Falhou
ERR_MODULE_NOT_FOUND antes de iniciar cenário; o invocador em seguida encontrou
abrupt.json ausente. Não é falha do Job nem teste abrupto executado.
Versão review.mjs inicial e v01 preservados. [observer-failure.json](observer-failure.json)
reproduz o erro antes de qualquer criação do diretório indicado. finish-observers
altera apenas linha de import/destino do original e faz a checagem inversa do
mesmo resultado; não muda assertions/limites nem repete os nove controles completos.

**v04:** .ready é escrito antes do primeiro .beat; observador tentou ler child.beat
antes de existir e recebeu ENOENT. O finally solicitou cancelamento da execução
própria e encerramento IPC do controle. Não há result final nessa rodada, portanto
não é aprovação. PIDs próprios foram conferidos ausentes depois, sem kill amplo.
[uuid-observer-failure.json](uuid-observer-failure.json) registra erro/hashes/estado.
uuid-tree.mjs original e v04 preservados. v2 acrescenta apenas a existência do
heartbeat ao predicado de readiness; deadline 25s e demais assertions continuam
idênticos. v05 é a primeira execução válida desse cenário ampliado, não retry
de regra financeira até passar nem timeout aumentado.

**Vermelhos esperados:** original abrupto contém assertion que exige o defeito
de sobrevivência. Seu exit 1 atual é esperado e acompanhado de relatório que
mostra false/filho ausente. O contrato novo de senha aninhada, em contraste,
fica vermelho por defeito ainda presente. Não confundir os dois significados.

Falhas s03/s05/s06 do executor foram lidas e preservadas com seus limites;
não foram transformadas em verdes nem exigidas como nova execução financeira.
Nenhuma prova independente original em revisao-CF-034 foi editada.
