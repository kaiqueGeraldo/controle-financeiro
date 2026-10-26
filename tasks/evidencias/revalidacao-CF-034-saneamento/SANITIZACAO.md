# RCI034-01 — progresso sustentado e residual

## Fronteiras examinadas

Runner captura stdout/stderr do supervisor em arquivos brutos no runtime,
sem repassar chunks ao console. Ao encerrar, console recebe status fixo/erro
tratado. Collectors aplicam sanitizeFile ao arquivo completo, evitando a fronteira
de chunk. JSON integral usa parse/visit; texto usa expressões de textRules.
Diretório public nasce por rename do pending somente após todas as transformações.
Coletor durável faz o mesmo antes do destino final e sanitiza resumos.

O workflow só seleciona `public/` para diagnóstico quando collect.outcome é
success. Pacote em success normal seleciona JAR e **public/package-manifest.json**.
Não há fallback bruto em falha. Um public preexistente é recusado, não apagado;
ele continua no disco, mas a falha de collect o torna inelegível no workflow.
Isso foi verificado localmente com saída 1 e destino anterior inalterado; não
houve upload real. JSON inválido em diretório novo deixa somente pending privado.

Resultados em [sanitization.json](sanitization.json) e [supplement.json](supplement.json):
originais, caixa/espaços/escapes/múltiplos e JSON integral aninhado protegidos;
diagnostic=keep, count 3 e status failed utilizáveis. Segunda sanitização preservou
os bytes das saídas exercitadas. Arquivos .env/auth-state/XML/dump não aparecem
no público. Sentinelas divididas entre chunks permanecem somente no bruto para
os formatos tratados. O console do CLI real não emitiu as sentinelas do filho.
Isso certifica essas fronteiras locais; não apaga retroativamente console remoto.

## RCI034-01/R1 — P2 confirmado — publicação de segredo em mensagem aninhada

**Arquivos/localização:** `.github/scripts/sanitize.mjs:6–10,16,20–28`;
`.github/scripts/publish-evidence.mjs:19–25`; coletor durável
`tasks/evidencias/CF-034/collect.mjs:22,68–73`.

**Entrada sintética válida de log:**

```text
INFO {"status":"failed","count":3,"diagnostic":"keep","message":"{\"password\":\"SENTINEL_NESTED_MESSAGE\"}"}
```

**Esperado:** senha removida da mensagem JSON, ou coleta recusada de forma
explícita; diagnóstico comum preservado, sem liberar material sensível.
**Observado:** saída permanece com SENTINEL_NESTED_MESSAGE; coletores retornam 0.
O prefixo leva sanitizeText ao caminho textual. O match de message consome todo
o valor escapado e retorna-o intacto porque a chave externa não é sensível;
o conteúdo não é visitado. A mesma mensagem como JSON integral é protegida,
portanto não é segredo sem identificação nem formato criptografado arbitrário.

**Reprodução ponta a ponta:**

```text
node tasks/evidencias/revalidacao-CF-034-saneamento/sanitization.mjs ../controle-financeiro-runtimes/CF-034/<novo>
```

O script usa runner real com lint sintético exit 23 e stdout fragmentado, depois
coleta public/lint.log e coleção durável runs/runner/lint.log. Ambos contêm o
residual; as três sentinelas originais são removidas. O contrato independente
`no-secret-contract.mjs` termina 1 por assertion explícita sobre o segredo presente,
não por erro de import/ambiente. Runtime reproduzido: v02. Não alterar/reutilizar v02.

**Segunda variante confirmada, mesma condição de encerramento:**

```text
password='prefix SENTINEL_UNCLOSED
diagnostic=keep
```

A alternativa de valor sem aspas consome somente `'prefix`; saída vira
`password=[REDACTED] SENTINEL_UNCLOSED`, publicável com exit 0. Entrada de aspa
incompleta deveria bloquear ou reter seguramente o campo reconhecido. O código
já se propõe a bloquear JSON sensível incompleto; o texto produz falsa redação
parcial. Não se exige identificar todo segredo arbitrário: o próprio campo
password e a abertura de aspas estão presentes.

**Critério violado:** condição original de RCI034-01, CF034 trabalho3/aceite4,
PROP-CF034-01/A.3 e fronteiras JSON/texto declaradas no saneamento. A proteção
de upload em falha não ajuda quando o sanitizador retorna sucesso incorreto.

**Impacto:** credencial poderia entrar em artifacts/logs duráveis publicados
nesse formato de erro. Não foi usado segredo real, observado incidente real
nem acionado GitHub Actions. Mantém o item aberto/P2, sem invalidar controles
positivos já sustentados.

**Encerramento objetivo:** os dois inputs preservados não deixam sentinela em
nenhum dos caminhos finais, inclusive via stdout real; ou a coleção falha sem
liberar destino. Manter diagnóstico útil, validade JSON quando aplicável,
idempotência, originais privados e bloqueio de upload. Revalidar o mesmo contrato
vermelho e regressões pertinentes em nova execução. Nenhuma correção feita aqui.

## Limites honestos

O teste de reuso modifica deliberadamente somente inputs sintéticos de cada
caso após a primeira coleta para tentar reutilizar o public antigo; scripts e
hash inicial registram essas entradas. Logs reais do runner usados na prova
ponta a ponta não foram sobrescritos. SHA bruto e sanitizado são separados.

Não se promete detecção universal de tokens sem chave, base64 arbitrário,
mensagens irrecuperavelmente entrelaçadas ou auditoria de segredos do JAR.
Limitações gerais não justificam aceitar os resíduos concretos identificados.
Os oito testes existentes passam porque não exercitam esses dois formatos.
