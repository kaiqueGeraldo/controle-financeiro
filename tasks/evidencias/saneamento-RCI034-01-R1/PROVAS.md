# Provas, comandos e rastreabilidade

Base418a648, branch codex/cf034-ci-local, staging inicialmente vazio e somente README raiz preexistente modificado. Não havia trabalho posterior ao HEAD informado. Não há AGENTS.md nos ancestrais/repo consultados; instruções AGENTS fornecidas pelo usuário aplicadas. DEC-CI-04, canônico CF034, execução, política, contratos e revalidação foram lidos. Nenhum agente auxiliar nem tarefa sucessora iniciado.

```text
node tasks/evidencias/saneamento-RCI034-01-R1/baseline.mjs ../controle-financeiro-runtimes/CF-034/r101
node --test .github/scripts/ci.test.mjs .github/scripts/sanitize.test.mjs
node tasks/evidencias/saneamento-RCI034-01-R1/proofs.mjs ../controle-financeiro-runtimes/CF-034/r104
node tasks/evidencias/saneamento-RCI034-01-R1/audit.mjs
```

Reproduzir em diretórios novos, sem substituir os exemplos existentes. TEMP/TMP dos testes estão em r102/temp; npm das fixtures usa cache próprio/offline, lockfile sem dependências e ci sem audit/fund. Não houve npm de produto, Maven, browser ou banco.

## Antes e depois com o contrato independente

baseline.mjs, executado antes de editar o sanitizador, conferiu4.323 caminhos sem diferença e hash do probe sanitization.mjs independente. Copiou-o para r101, relocando exclusivamente a linha do import source.mjs; assertions/payloads/expecteds intactos. As saídas foram naturalmente gravadas no diretório da cópia, sem tocar sanitization.json da revisão. Esse script observa os defeitos e tem assertions que exigem a presença do residual; o exit0 do observador não é aceite da sanitização.

Resultados antes: seis casos satisfizeram o contrato, dois não. A mensagem aninhada com prefixo e a aspa textual incompleta chegaram a public/backend.log com exit0. O runner real ainda mostrou a mensagem aninhada em public/lint.log e coleção durável runs/runner/lint.log. A assertion independente no-secret-contract terminou1 pela presença proibida da sentinela. Nenhum segredo real foi usado.

Depois: o prefixo do mesmo script independente (definições, oito entradas, primeiro loop e suas assertions/condições originais) foi executado em diretório novo, com imports/caminhos de execução relocados e escrita de resultado acrescentada após o loop. Não se alterou mustReject nem contractSatisfied. Todos os oito casos satisfizeram o contrato: mensagem redigida; aspa incompleta retorna1 sem public; demais formatos preservados. Não se executou o trecho posterior que exige o defeito como se fosse um teste de aceite.

O contrato no-secret-contract original foi preservado com hash, copiado trocando somente o caminho do arquivo lido. O trecho da assertion foi comparado em bytes. Com o mesmo emitter/package da reprodução anterior, o SHA do bruto real foi idêntico antes/depois; console não contém sentinelas. Contrato vermelho1 antes→verde0 depois. Bruto continua local e imutável; hashes de representação são novos e separados. Para a aspa incompleta também houve stdout sintético→bruto→cada coletor real: ambos recusam a liberação do destino final, sem ecoar o texto rejeitado.

## Controles e contraprovas

| Conjunto | Resultado efetivo |
|---|---|
| Node |12/12, zero failures/skips/cancelled/todo: quatro contratos do runner, quatro controles anteriores de sanitização/coleta e quatro novos grupos do residual |
| Casos novos | Prefixos distintos, duas camadas serializadas, literal JSON com prefixo, campos embutidos/aninhados, truncamento/escaping sem moldura, caixa/espaços, ocorrências múltiplas, diagnóstico preservado e idempotência |
| Limites |16MiB e64 níveis declarados, terceira camada estruturada recusada; registro representativo1MiB no sanitizador e coletor, cada operação abaixo de5s; limites são asseridos independentemente |
| Coleta anterior | JSON/Bearer opaco/cookies originais, cabeçalho continuado, escapes, JSON integral e texto malformado inofensivo continuam protegidos; arquivos proibidos ausentes |
| Reuso | public anterior é recusado com exit1 e bytes mantidos; não vira sucesso atual nem elegível pelo workflow |
| Mutação isolada | Somente sanitize.mjs da cópia r103/scripts substituído pelo objeto versionado418a648. Exatamente os dois resíduos reaparecem nos coletores reais; contrato de senha volta a1 por assertion, não erro de ambiente |
| Restauração | SHA do sanitizador corrigido idêntico antes/depois da mutação; oito condições independentes voltam a passar, sem mutação no checkout principal |
| Subprocesso falho | Assertions originais:23→runner1, só install/lint; nenhum gate posterior/pacote |
| Relatório obrigatório ausente | Componentes exit0 sem JSON→runner1/ENOENT; build/backend/E2E/pacote não avançam; TAP fixture não é teste financeiro |
| JAR adulterado | Cópia nova do histórico a5ad7a6, um byte alterado→runner1/Package changed, sem artifact; bytes restaurados por SHA |

As contagens por camadas/repetições não são somadas como casos financeiros. A mutação foi detectada em conteúdo efetivamente coletado; não depende de novos exports do módulo nem falha por import. O JAR copiado não foi recompilado nem usado para certificar testes novos.

Fluxo público inspecionado: result.json e lint.log sanitizados, collection.json com rawLocalSha256/sanitizedSha256; não inclui install.log bruto, .env, auth-state, XML ou SQL. Coleção durável efetiva também foi conferida. No caso recusado, somente o staging privado pode existir; não há destino final public/runs. Workflows e ambos coletores são byte a byte os aceitos na base: apenas chamam a política compartilhada atual. needs/if/upload foram inspecionados estaticamente; nenhum upload remoto realizado.

## Preservação e limites

Nenhum teste de produto/financeiro, cancelamento, Ctrl+C ou container foi reexecutado. Hashes do runner e arquivos Job Object/UUID permanecem idênticos; as regressões ordinárias usam o adaptador existente sem modificar seu mecanismo. O aceite independente Windows/processos permanece sustentado na base418a648; seus limites permanecem abertos.

Os comandos de prova concluíram sem falha inesperada de teste. Vermelhos esperados do contrato anterior/mutante, falhas23/relatório/JAR e recusas do sanitizador estão preservados. Uma leitura ad-hoc de resumo tentou aplicar filter a um objeto de relatórios e recebeu TypeError; ocorreu após as provas, sem modificar resultados nem causar rerun ou mudança de assertion. Não houve aumento de timeout/retry.

Inventário final separa implementações alteradas, históricos idênticos e mudanças documentais de estado fora do inventário antigo. README raiz não restaurado/staged; SHA inicial/final histórico mantido. Manifests antigos,57 representações brutas não reconstruídas e JAR da11 permanecem inalterados. O intervalo local informado na entrega é para revalidação independente, sem autoaceite de R1/CF034.

Rodada r103 preservada em proofs-r103.json. Depois da inspeção de whitespace Unicode/campo vazio, r104 reconferiu o sanitizador final e o mesmo conjunto de contratos/regressões. Não somar essas rodadas; nenhuma assertion ou prazo foi relaxado para obter aprovação.

O observador documental audit.mjs teve duas falhas próprias preservadas: parêntese excedente (SyntaxError, antes de qualquer verificação) e expectativa incompleta do conjunto durável. O coletor durável já permite control.json, com UUID/PID/plataforma/início/request; não é um bruto nem um arquivo selecionado pelo workflow public. Conferido o contrato da allowlist, o observador passou a exigir exatamente quatro arquivos duráveis (collection/control/lint/result) e três públicos (collection/lint/result). Nenhum coletor foi modificado; não se retirou a assertion de conjunto exato. Logs em logs/audit-syntax-failure.log e logs/audit-allowlist-failure.log. Auditoria final passou mantendo hashes e assertions independentes.
