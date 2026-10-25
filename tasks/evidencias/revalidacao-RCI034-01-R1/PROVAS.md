# Comandos, resultados e capacidade de detectar o defeito

Executados da raiz do repo; em uma reprodução, usar nomes novos para runtimes.

```text
node tasks/evidencias/revalidacao-RCI034-01-R1/review.mjs inventory
node tasks/evidencias/revalidacao-RCI034-01-R1/review.mjs run ../controle-financeiro-runtimes/CF-034/r1-review-01
node tasks/evidencias/revalidacao-RCI034-01-R1/boundaries.mjs ../controle-financeiro-runtimes/CF-034/r1-review-02
node tasks/evidencias/revalidacao-RCI034-01-R1/audit.mjs ../controle-financeiro-runtimes/CF-034/r1-review-03
node tasks/evidencias/revalidacao-RCI034-01-R1/review.mjs final
```

O driver executa `node --test .github/scripts/ci.test.mjs .github/scripts/sanitize.test.mjs`.
Resultado em [node-tests.json](node-tests.json): 12 passam, sem falha, skip, cancel
ou todo. TEMP/TMP próprios; npm das fixtures offline, cache próprio e lockfile sem
dependências. Não foram instaladas dependências de produto nem executados Maven,
browser, banco, suíte financeira ou cancelamento integral.

## Provas originais e contraprova

[proofs.json](proofs.json) contém a nova execução do observador do saneamento,
auditado linha a linha. [observer.json](observer.json) registra sua fonte e a
única relocação de import; saída vai para o novo runtime por import.meta.dirname.
Nenhuma assertion, prazo, input ou condição de contrato foi alterada. O observador
usa o primeiro loop original independente e a assertion original de ausência de
senha, além das regressões ordinárias já independentes.

Oito casos originais: originais JSON/Bearer/cookie; caixa/escapes/múltiplos;
JSON estruturado aninhado; mensagem aninhada com prefixo; aspa textual incompleta;
JSON incompleto no log; arquivo JSON inválido; texto malformado inofensivo.
Todos atendem ao contrato atual. `mustReject` e `contractSatisfied` originais
foram mantidos; o SHA do probe original é
`c3727905fb8a4d4c406091d303bd6782e162a9538841856b221b9bf668fe13da`.

Na cópia `r1-review-01/execution/scripts`, o sanitizador foi substituído pelo
objeto versionado `418a648:.github/scripts/sanitize.mjs`. Exatamente
`nested-message-in-log` e `unterminated-text-quote` deixaram de satisfazer o
contrato: coletores saíram 0 e arquivos finais retiveram as sentinelas. A assertion
original de ausência de senha terminou 1 por `public log must not retain password`,
não por erro de import/ambiente. Mutation-contract registra o SHA do mutante.

Restauração exata do sanitizador corrigido:
`1589f580bdf02b6e5b5daed48816c8ce841cad09bb7b9cca8aaaaf38737f14fa`
antes/depois. Os mesmos oito contratos voltaram a passar. A árvore candidata
nunca recebeu a mutação. Logs dos vermelhos permanecem; não houve retry para
obter verde, aumento de timeout ou assertion removida.

Runner real: fixture lint emite o mesmo payload em fragmentos e termina 23;
runner retorna 1, sem build/backend/E2E/pacote. Bruto contém as sentinelas; CLI não.
Mensagem aninhada é redigida nos dois destinos finais. Variante com aspa incompleta
é recusada por ambos os coletores sem destino final. Os coletores processam o
arquivo completo, não cada chunk da captura.

Regressões ordinárias: filho 23 reprova gate; componentes com exit 0 sem relatório
obrigatório causam ENOENT/runner 1 e bloqueiam avanço; um byte alterado da cópia do
JAR causa `Package changed`, runner 1 e nenhum artifact. JAR restaurado por SHA
`28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8`.

## Polaridade do observador histórico

O script original completo de reprodução também contém uma assertion que exige
que o vazamento exista (`published.includes(...)`). Ele não é, inteiro, um teste
de aceite. Em r1-review-03 foi executada sua cópia com apenas import relocado:
falhou precisamente nessa assertion após coleta real, pois a senha já não está
no arquivo. [audit.json](audit.json) preserva comando/erro e hashes. O original
não foi editado. O primeiro loop/contrato negativo usados no aceite têm polaridade
correta e detectaram o defeito reintroduzido na cópia. Isso demonstra a adequação
da adaptação, em vez de transformar um erro de observador em defeito do candidato.

## Provas complementares independentes

[boundaries.json](boundaries.json): 27 casos novos, com expected definido pelo
contrato, exercitam função e **ambos** os CLIs de coleta. Campos positivos e JSON
interno são conferidos, assim como ausência da sentinela e representações Unicode/
JSON relevantes. Busca aplicada a todos os arquivos finais, não só ao log principal.
Destinos reais, tamanhos e hashes de cada arquivo ficam no resultado.

Recusas por ambiguidade/profundidade/tamanho não liberam destino final. Reuso
após input sintético inválido retorna 1; bytes do destino anterior não mudam.
O input sintético dos controles complementares é restaurado por SHA. No loop
histórico, a mutação de reuso no input permanece como já definida no observador;
seu SHA registrado é o original, anterior a essa tentativa. Não confundir esse
input deliberadamente modificado com o bruto imutável do runner real.

Resumos derivados de Playwright/environment sintéticos também passaram pelo
coletor durável sem reintroduzir a senha. Isso testa transformação de resumo,
não executa nem certifica jornadas de browser. Foram inspecionados manifests
sintéticos e collection, além de result.error e logs.

O executor tinha falhas de auditoria próprias preservadas em saneamento-RCI034-01-R1:
SyntaxError e expectativa que omitia control.json da allowlist durável. Conferida
a lista real, a correção do observador era legítima; não mudou coletor nem teste
financeiro. Nesta revisão não houve falha inesperada dos novos probes; os
vermelhos descritos são intencionais e causalmente discriminados.
