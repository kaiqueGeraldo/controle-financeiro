# Sequência executada e proveniência

Registro da execução já concluída, sequencial e finita, a partir da raiz do
repositório. Scripts criam recibos com exclusividade; nova reprodução requer
outro diretório no prefixo revalidacao-tcp e inputs do candidato delimitado.
Os recibos preservam argumentos efetivos, versões/fontes, SHA e resultado Maven.

## Preparação e execução

Ambiente Windows; Temurin 21.0.12.1+1; Docker Desktop para PostgreSQL descartável.
O JAR é o p05 anterior, sem novo package. O runtime foi exportado enquanto HEAD
era b7a2c206459f8f376b7bb7a84580444b2b6b4f15, com 836 inputs no manifesto.

```powershell
$env:JAVA_HOME = Join-Path (Get-Location).Path 'controle-financeiro-backend\target\temurin21\jdk-21.0.12.1+1'
$env:PATH = "$env:JAVA_HOME\bin;C:\Users\Aluga.com\AppData\Local\Programs\DockerDesktop\resources\bin;$env:PATH"
$taskRoot = '../controle-financeiro-runtimes/preparacao-adocao/revalidacao-tcp-20261028-01'
node tasks/evidencias/revalidacao-TCP-reuso-nativo/preservar.mjs inicial
node tasks/evidencias/revalidacao-TCP-reuso-nativo/executar.mjs $taskRoot setup
node tasks/evidencias/revalidacao-TCP-reuso-nativo/preparar-timeline.mjs $taskRoot
node tasks/evidencias/revalidacao-TCP-reuso-nativo/executar.mjs $taskRoot originals
node tasks/evidencias/revalidacao-TCP-reuso-nativo/executar.mjs $taskRoot causal
node tasks/evidencias/revalidacao-TCP-reuso-nativo/executar.mjs $taskRoot synthetic
node tasks/evidencias/revalidacao-TCP-reuso-nativo/complemento.mjs $taskRoot
node tasks/evidencias/revalidacao-TCP-reuso-nativo/analisar.mjs $taskRoot
powershell.exe -NoProfile -NonInteractive -File tasks/evidencias/revalidacao-TCP-reuso-nativo/recursos.ps1 -Runtime $taskRoot
node tasks/evidencias/revalidacao-TCP-reuso-nativo/coletar.mjs $taskRoot
node tasks/evidencias/revalidacao-TCP-reuso-nativo/auditar.mjs
```

As duas invocações originais selecionam PortLifecycleProbeTest e
AdoptionNativeSocketsTest, com cf017.postgres.major=16 ou 17. Cada uma passou
3/3, sem erros/falhas/skips. O grupo causal executa apenas
PortLifecycleProbeTest#ownedListenerEndsWhileUnrelatedReadyServiceSurvives,
uma vez por variante: App antigo, query falha, candidato restaurado.
Os dois primeiros resultados Maven têm um erro esperado cada; o terceiro passou.
Não foram suprimidos nem contados como testes verdes de aplicação.

Maven, dentro da cópia, recebeu --batch-mode, timezone UTC,
surefire.rerunFailingTestsCount=0, diretório de relatório por invocação,
preparation.jar apontando ao p05, tcp.runtime e tcp.observer; goal test.
Argumentos integrais nos receipts, inclusive seleções do grupo sintético e do
complemento. Nenhuma suíte financeira completa ou CI remota foi executada.

## Adaptações transparentes

executar.mjs adapta o driver da investigação anterior: destino novo e alias para
combinar reversão exata do App antigo com instrumentação de janela já existente.
O fonte antigo vem de git show 3b245d9d; não é uma aproximação reescrita.
TcpNativeDiagnosticTest e TcpObserver são copiados da investigação preservada.
preparar-timeline.mjs acrescenta, apenas no controle corrigido copiado, marcas de
waitFor, deadline e retorno da inspeção; não altera checks, opções ou prazos.
O driver mantém/restaura cada mutação em finally, com SHA antes/executado/restaurado.

complemento.mjs injeta override de query e telemetria somente no helper da cópia,
para executar ReviewNativeSocketsTest uma vez. Originais PG16/17 usaram helper
sem essa instrumentação. SHA do helper antes/restaurado:
b32deceab79052d6cd44e078042e011948f933515b2716cc13d02a1e75751d28.
Respostas inválidas/lentas são cenários controlados; resultados positivos reais
e substituto usam a consulta normal. Nenhuma alteração canônica de implementação.

O plano fixou seis sintéticos cooperativos e dois abruptos. Resultados: seis
binds bem-sucedidos e dois BindException diagnósticos. Complemento: dez casos,
onze chamadas, três liberações dos endpoints originais e oito bloqueios esperados.
Cada grupo ocorreu uma vez; nenhum rerun para obter a corrida ou melhor tempo.
Nenhuma falha operacional de observador nesta execução foi descartada.

## Coleta, preservação e commits

resultados.json vincula cada artefato à origem e aos SHA original/coletado.
Coleção de 107 artefatos textuais com decodificação UTF-8 e sanitização
declaradas; fontes originais continuam no runtime. Nomes longos compactados na
cópia de coleta. runtime-files.json inclui 1.491 arquivos, com binários por hash;
JAR, .env e binários não entraram nos commits. Os 836 inputs foram conferidos
após restauração. A auditoria final é somente leitura, sem kill por porta/nome.

Provas registradas no commit local
ed978c1d5393b3260ff70c007a3d17e03a9e9a97, após staging explícito e auditoria
--staged. Parecer/estados e fotografia final ficam no commit documental seguinte.
Depois dos documentos:

```powershell
node tasks/evidencias/revalidacao-TCP-reuso-nativo/preservar.mjs final
node tasks/evidencias/revalidacao-TCP-reuso-nativo/auditar.mjs
git diff --check
```

A fotografia final registra HEAD do commit de provas, pois precede o próprio
commit documental. Conferência inicial/final das 32.555 entradas e hashes de
README/JAR, mais diff dos caminhos canônicos, fundamentam a preservação.
README raiz alheio permanece fora dos commits. Sem limpeza geral, correção de
implementação, novo pacote, banco real, HQL, push/merge/deploy ou ação remota.
