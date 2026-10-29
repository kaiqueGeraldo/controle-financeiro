# Execução e proveniência

Raiz do repositório, Windows/PowerShell. Runtime novo e exclusivo:
`../controle-financeiro-runtimes/preparacao-adocao/startup-hql-20261028-01/`.
Comandos abaixo registram o que ocorreu, não devem sobrescrever recibos existentes.
Para reprodução, usar execução nova e scripts deste intervalo sobre a base
conferida. preparar.mjs exige HEAD c091abb8 e a branch própria; scripts/probes
devem estar disponíveis nesse ambiente sem modificar o produto. Não resetar
esta branch de evidências nem descartar trabalho para satisfazer a pré-condição.

## Base e preparação

git status/branch/rev-parse, diff/cached, log e merge-base confirmaram a origem
c091abb8, ancestralidade do candidato TCPb7a2c206 e seus2 commits de revalidação.
Nome da branch nova ausente antes da criação; git switch -c a partir do HEAD
exato. README raiz foi conferido antes/depois; staging inicial vazio.
Não houve fetch, push ou consulta a configuração/banco remotos.

```powershell
node tasks/evidencias/investigacao-startup-HQL/preparar.mjs $taskRun
powershell.exe -NoProfile -NonInteractive -File tasks/evidencias/investigacao-startup-HQL/ambiente.ps1 -Runtime $taskRun -Fase inicial
docker run --rm --network none --entrypoint sha256sum $taskImage /app/api.jar
docker run --rm --network none --entrypoint java $taskImage -version
node tasks/evidencias/investigacao-startup-HQL/executar.mjs $taskRun
```

taskImage é exclusivamente o ID local8c102183…568ef1; taskRun deve ser o caminho
absoluto exclusivo. Hash embarcado comparado ao p05 em analisar.mjs, Java da
imagem21.0.12+8. JDK nativo Temurin21.0.12.1+1 em backend/target/temurin21;
Maven wrapper3.9.12, Node24.18.0, Docker29.6.2. Sem instalação ou build concorrente
enquanto os4 processos de aplicação rodavam. A compilação da exportação terminou
antes do @BeforeAll/banco e dos processos. Outros programas do host não foram
congelados; Java20288 preexistente foi inventariado sem terminação.

Exportação apenas dos452 arquivos backend rastreados, sem frontend/evidências
históricas/target/.env. A fonte do App na cópia recebeu somente timestamps de
criação e opções opt-in para agent/JFR/mount; o trecho desde awaitStatus até close
foi comparado byte a byte com o original e permaneceu idêntico. Controles não
recebem opções JVM diagnósticas. Fontes canônicas não sofreram essas adaptações.
Proveniência: [inputs-diagnostico.json](inputs-diagnostico.json) e os452 SHA em
[preservacao-inicial.json](preservacao-inicial.json).

Agent compilado do BootAgent.java anterior e Byte Buddy1.17.8 já em cache;
externo ao JAR/imagem, nenhum pom modificado. Não houve build de pacote novo.

## Comando efetivo e observações

Na exportação backend, Maven --batch-mode --offline, timezoneUTC,
cf017.postgres.major=17, test=StartupHqlProbeTest, rerunFailingTestsCount=0,
reportsDirectory novo, preparation.jar=p05/package/api.jar e hql.runtime explícitos;
goal test. Argumentos literais, tempos, hashes e exit no
[execution-receipt.json](execucao/execution-receipt.json).

Resultado único:4/0/0/0,87,27s de JUnit; Maven165,874s incluindo preparação/
compilação. Nenhum skipTests, verify de produto,17 contratos completos, teste
financeiro, suíte TCP/RVPLA ou CI remota foi contado como executado nesta rodada.
O método de observação registra falha original separadamente e permite análise
pós-gate; o resultado de cada awaitStatus, não a cor do wrapper, está nos JSONs.
Todos4 retornaram sucesso estrito dentro do prazo, cleanup confirmado.

```powershell
node tasks/evidencias/investigacao-startup-HQL/historico.mjs
node --test tasks/evidencias/investigacao-startup-HQL/jfr-stream.test.mjs
node tasks/evidencias/investigacao-startup-HQL/analisar.mjs $taskRun
node tasks/evidencias/investigacao-startup-HQL/complemento-historico.mjs
powershell.exe -NoProfile -NonInteractive -File tasks/evidencias/investigacao-startup-HQL/ambiente.ps1 -Runtime $taskRun -Fase final
node tasks/evidencias/investigacao-startup-HQL/coletar.mjs $taskRun
```

A ordem real da auditoria final precedeu a análise/coleta, depois de todos os
processos encerrarem. O parser incremental passou5/5: chunks1/7/65536 caracteres,
escaping aninhado e rejeição de truncamento/separador inválido. Não são testes
financeiros nem se somam aos4 contratos de observação. node --check conferiu
preparar/executar/analisar/coletar. git diff --check no intervalo versionado.

analisar.mjs invoca jfr summary e print --json --stack-depth64 com eventos
CPU/GC/park/monitor/socket/file/classes/compilação. Primeira extração nativa tinha
também alocações e gerou1,21GB; a leitura integral no Node falhou. Preservado em
analysis-attempt-01.json, reanalisado incrementalmente na tentativa02, **sem
repetir startups**. Leitura existente não é sobrescrita. A imagem usou a seleção
compacta; os eventos comparados são os mesmos. JFRs/expansão continuam somente no
runtime, inventariados. A associação inicial que exigia hash idêntico também
para texto Hibernate foi rejeitada; a análise distingue20 textos transformados
por cenário, sem mascarar divergências dos inputs HQL.

## Limites e preservação da coleta

21 arquivos textuais selecionados, originais preservados; cópias UTF8/LF, BOM e
trailing whitespace retirados e segredo sintético substituído. SHA original e
coletado registrados por arquivo. Nenhum .env, JAR, agent binário, classes, JFR,
expansão gigante ou credencial real versionados. Manifestos antigos referenciados
por caminho/hash; somente runtime novo foi inventariado.

A chamada inicial sem privilégios não pôde escrever .git nem acessar o pipe Docker;
nenhuma branch/teste foi executado nessas chamadas. Preparação/execução local
autorizadas completadas com a permissão apropriada. Não foram erros de produto
ou retries de startup. A coleta textual histórica teve um erro de sintaxe no
rascunho de geração de Markdown, sem alterar runtime/resultado; o documento
final foi escrito e confrontado com JSON. Recibos de origem não foram restaurados
ou sobrescritos para esconder falhas.
