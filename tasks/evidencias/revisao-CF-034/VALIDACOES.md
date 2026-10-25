# Workflows, runner, testes e isolamento

## Execução efetiva da revisão

Scripts novos não alteram candidato, dependências ou evidências anteriores.
`review.mjs audit` e `supplement.mjs` são leitores dos runtimes, gravando somente
resultados neste diretório. Probes são sintéticos e usam cópias/fixtures em
diretórios novos; não são contados como testes de produto.

```text
node tasks/evidencias/revisao-CF-034/review.mjs audit
node tasks/evidencias/revisao-CF-034/review.mjs probes ../controle-financeiro-runtimes/CF-034/rv01
node tasks/evidencias/revisao-CF-034/cancellation.mjs ../controle-financeiro-runtimes/CF-034/rv02
node tasks/evidencias/revisao-CF-034/supplement.mjs
node tasks/evidencias/revisao-CF-034/review.mjs final
```

Os diretórios dos exemplos já existem e devem ser preservados. Para reproduzir
probes usar nomes novos. Escritas externas foram autorizadas pelo mecanismo de
permissões. npm dos probes usa lockfile sem dependências, cache próprio e modo
offline. Nenhum Maven, Docker, banco ou serviço financeiro foi iniciado nesta
revisão. Não houve necessidade de repetir suítes financeiras: as lacunas eram
do runner/coletor e puderam ser isoladas diretamente.

## Workflow e comandos

Existe um workflow `ci.yml`, substituindo ci-backend/ci-frontend. Parser js-yaml
das dependências preservadas reconheceu os eventos push, pull_request e
workflow_dispatch, os dois jobs e permissions contents:read. Leitura estática
conferiu needs/if e paths. Não valida expressões no serviço GitHub.

required roda na raiz após checkout; setup Node24 e Temurin21, caches npm/Maven
de dependências, teste do runner e `ci.mjs all`. expanded depende de required
e só é selecionado por dispatch com suite expanded. Sem continue-on-error,
deploy, secrets declarados, shell pipelines ou cache de relatórios/target.
Checkout sem persistir credenciais e clean:false; sourceFor exige checkout
Git limpo quando cria manifesto em Actions. A identidade dos actions é por tag,
não digest imutável; não se promete ambiente binariamente reprodutível.

Runner é o mesmo arquivo nas duas plataformas; Windows chama mvnw.cmd via cmd,
Linux chama sh ./mvnw. npm CLI é localizado junto ao Node/which npm. Diretórios
frontend/backend são explícitos. Instalação npm ci usa lockfile; wrapper Maven
e POM estão entre inputs. Local não fixa/verifica versão do Node/Java por si:
a rodada11 registra Node24.18.0, Maven3.9.12/Temurin21 conforme evidências da entrega.
Browser é instalado via Playwright chromium. Instalação de bibliotecas Linux não
foi ensaiada e o script não pede --with-deps; não presumir prontidão ubuntu-latest.

Ambiente remove SPRING_, RESEND_, BRAPI_, JWT_ e DATABASE_URL, impõe BFF inválido
até o wrapper real, browser local e telemetry off. Não se trata de allowlist de
todas as variáveis possíveis: a garantia é runtime de teste, export sem .env,
config sintética e datasource substituído pelo Testcontainers/guard. Necessários:
Node/npm, Java21, wrapper/dependências e Docker disponível; CF034_SUITE/out/root;
CF032_RUNTIME/REPO/EVIDENCE/HEAD/GREP são construídos pelo próprio runner.

Sequência: install→lint→typecheck→unit→components→build→browser-install→backend
verify→wrapper E2E→package. spawn shell:false, exceção em error ou close diferente
de zero; null também reprova. Uma coleta posterior exit0 não altera process.exitCode1
do processo anterior. Em Actions a coleta always não torna steps anteriores
bem-sucedidos; a prova dessa semântica no runner remoto permanece pendente.

Relatórios são em diretório novo (reuso recusado), frontend invalida três recibos,
backend invalida backend/E2E, E2E invalida seu próprio recibo. XML deve existir,
ter atributos de totais e representar cada classe requerida. Zero/skips/failures/
errors reprovam. Frontend exige três TAPs não vazios; Vitest JSON obrigatório.
Browser exige seis resultados, zero skipped/unexpected/errors/flaky. Não é uma
verificação por contagem apenas: seleção e casos nominais foram auditados.
Package confere fontes novamente e hash do JAR aprovado pelo verify.

Saída de subprocesso23 foi preservada em steps e propagada como exit1 do runner;
somente install/lint rodaram. No segundo probe, componentes termina exit0 sem
JSON: ENOENT reprova, build/backend/E2E/pacote não avançam. Os TAPs dessa fixture
são deliberadamente sintéticos para alcançar o contrato de relatório; não são
evidência temporal de produto. Quatro testes originais do runner passaram na
nova execução, incluindo rejeição de suite faltante e fonte extra/modificada.

Cancelamento: ver RCI034-L01. Não existe handler/supervisor de árvore no ci.mjs.
O wrapper possui limite15min/finally, Playwright não reutiliza servidor existente,
Testcontainers usa recursos efêmeros; isso sustenta encerramento normal, não
execução garantida de finally após matar um processo ancestral.

## Testes da rodada11 conferidos

| Conjunto | Conferência independente | Limite |
|---|---|---|
| Temporais18 | TAP seis casos em São Paulo/UTC/Kiritimati, totais e negativos de hoje/prazo | São seis casos repetidos em três fusos; não18 regras distintas |
| Componentes620 | SHA JSON bruto; todas620 assertionResults passed; nomes em component-cases.json | HTTP/mock permitido nessa camada; não prova E2E |
| Backend889 | Hash de cada XML; testcase nominal;94 classes selecionadas com relatório; totais zero erro/falha/skip | Inclui unitários, contratos e integração; não889 jornadas nem889 testes necessariamente PostgreSQL |
| Runner4 | Reexecutados sem skips em rv01/temp, saída completa em probes.json | São contratos do runner, não testes financeiros |
| E2E6 | SHA JSON bruto, A/B/G/H/K/L, uma tentativa cada, zero flaky/skips/errors; oráculos SQL verificados | Smoke desktop Chromium1440×900; sem matriz ampliada/zoom |
| Wrapper Java1 | XML próprio e um testcase passando, processo browser exit0 exigido | Wrapper engloba os6; não somar como sétima jornada |
| Lint/tipos/build/verify | Nove etapas exit0 em sequência, logs e comandos preservados; sem skipTests em verify | Compilação e empacotamento não acrescentam casos de teste |

Inventários nominais: [backend](surefire-cases.json), [wrapper](e2e-surefire-cases.json),
[componentes](component-cases.json). Os casos da seleção smoke continuam os mesmos
do candidato; a revisão não alterou seleção/assertions/retries/timeouts.

As seis jornadas cobrem criação/onboarding/rascunho/recibo, uso diário entre
domínios, perda de resposta após commit e efeito único, ownership/troca de sessão,
limite de cartão e identificação de investimento sem ticker. As94 classes incluem
concorrência, constraints, migração/restore, autenticação e capacidade financeira.
A escolha é adequada como smoke declarado, não como substituição da matriz UI
completa.15 bridges históricos estão diferidos de modo explícito; não marcados
passados nem dispensados por esta revisão.

## Isolamento, oráculos e mudanças de testes

PostgresTestContainerInitializer cria DB cf_test_UUID, valida loopback+nome exato,
sem fallback; schema cf_context_UUID por contexto evita que create-drop de um
contexto evicto apague tabelas de outro. Marcador por bean factory impede dupla
inicialização de sobrescrever schema especializado. Não há schema de produção.
O custo é DDL por contexto e mais estado efêmero; o container pertence ao processo.

`application-test.yml` usa create-drop/Flyway false como default legado. Migrações
CF017 e wrapper CF032 sobrescrevem para Flyway/validate: não generalizar a prova
de schema aos889. Environment bruto da11 comprova cf_test_/cf032_, V1…V16 e
validate; assertions exigem16 e schema. Esse E2E não usa auto-DDL para esconder
incompatibilidade de migração.

Playwright usa workers1, fullyParallel false, retries0, forbidOnly e
reuseExistingServer:false em3142; servidor real Next start do build. Spring usa
porta aleatória; readiness de auth é observada. Usuários são namespace UUID,
contextos de browser separados e sessões trocadas; observer só aceita namespace
da execução e domínio example.invalid. SQL é observado no banco sintético real.
Únicos doubles Spring: EmailService/MarketDataService. G usa route.fetch real
antes de abortar a resposta: não fornece payload financeiro fictício.

Clock de produto fixo e auth clock separado preservam validade de login. Browser
fixa somente Date civil; performance/rAF/timers/WAAPI continuam nativos. Esperas
nas jornadas usam estado/response/reload, sem sleeps arbitrários. SQL observado
A=1300+501−350=1451; B=1286,90+501,67−270=1518,57; G recarregado tem um pagamento e
uma transação INVOICE_PAYMENT. Observações são hashes e checkpoints independentes,
não somente toast/status200 ou contagem.

Diff dos testes: V1…V16 e upgrades correspondem às migrações presentes, mantendo
assertions de dados/checksum/restore/rollback; HH:mm:ss com segundos45 decorre
da SPEC002, não do observado; mock inventoryGuard fica no teste de calendário,
não no caminho integrado. Provider de privacidade sintético torna o teste de
apresentação válido. advanceTimersByTime(0) drena selectionchange da fixture,
mantém assertion de cleanup e teve contraprova do cleanup documentada. Vitest
amplia descoberta para src, sem exclusão compensatória. Nenhum enfraquecimento
financeiro identificado nesse delta.

## Falhas e contraprovas anteriores

02 formato TAP ausente,03 fixtures/timers/provider,05/06 preparação/diagnósticos,
07=22falhas/10erros e08=521erros de contexto preservados. Inicializador idempotente
em a5ad7a6 resolve a dupla chamada;10 backend aprovado/E2E ENOENT antes do produto.
11 nova exportação do mesmo candidato, caminho curto, nova instalação e sequência
completa. Não apagar essas falhas nem somar seus verdes; não há retry de assertion
até passar dentro da rodada11. Falha do browser10 é distinta de flaky financeiro.

Lint/data usam7ac7407; os scripts/helper pertinentes não mudaram até a5ad7a6.
Lint falha por no-explicit-any; data troca calendário local por UTC e falha nas
assertions de hoje/prazo em São Paulo. Ambos exit1 antes de backend/E2E/pacote,
restauração SHA e controle lint/18temporais. JAR adulterado em a5ad7a6 falha por
`Package changed`, exit1 sem artifact; hash restaurado igual ao positivo.
restored-package apenas copia JAR existente, não recompila/testa.

Trade-offs: sequência serial simplifica falha e reduz disputa de fixtures, com
latência e repetição no expanded. Hash percorre O(bytes), ordenação O(n log n),
checagem de classes O(classes×relatórios), pequena para94. Não há mudança de
queries ou domínios neste delta; reavaliar N+1/produção não pertence a esta revisão.
Separar jobs/retomar fases exigirá recibos com identidade da execução e outputs.
