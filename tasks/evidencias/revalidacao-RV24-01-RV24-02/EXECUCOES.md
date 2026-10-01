# Execuções e contraprovas — 01/10/2026

HEAD `5d0649a07550b3db1058f6094c51d2beef64095a`, produto53fa3a8/805f588, base30211b8. Windows/PowerShell, Temurin21.0.12.1, Maven wrapper, Node/Next/Vitest/Playwright existentes, PostgreSQL16/Testcontainers; sem upgrade. Browser/autenticação usam Clock sintético15/01/2027 e timezone America/Sao_Paulo. Algumas classes mudam o default JVM; horário do log não foi usado como oracle financeiro.

## Resultados por camada

| Artefato | Conteúdo executado | Resultado |
|---|---|---|
| browser-backend.log + browser/ | Checkout, runner Spring, seis jornadas originais EXPENSE/BUY × lost/before/unavailable |Java1/1, Playwright6/6, SQL950/600, posição14, dois recibos A/zero B |
| components-independent.log | Seis probes novos; parametrização inicial [] virou undefined |Cinco falhas e um positivo; não prova array real |
| components-independent-final.log | Mesmo conjunto com casos explícitos null/array |Cinco falhas causais de RVR24-01/02 e um positivo |
| original-consumers-red.log | Cópia frontend, somente os dois modais substituídos pelos de30211b8 |Dois vermelhos expected1/observed2; nenhum erro de import/ambiente |
| components-complete.log | Checkout,40 arquivos existentes incluindo CF-026/R03/RV01/RV24 |193/193, sem skips; novos probes vermelhos executados separadamente |
| lint.json / typecheck.log / build.log / frontend-results.json | Configuração intacta do candidato |244 alvos lint0 erros/0 avisos; typecheck e build exit0 |
| deletion-directed.log + deletion/ | Cópia backend, seis contratos atuais selecionados por método |6/6; banco real descartável, inventário/snapshot29 tabelas |
| deletion-independent.log | Três novos métodos review*, sem casos herdados |3/3: grafo adicional/compra sobrevivente, email visto por outra conexão, writer concorrente sem órfão |
| paid-purchase-red/ | Outra cópia, somente UserService de30211b8, teste atual de compra comum25 paga/alocada |Uma failure de FK;0 errors/skips; produto compartilhado intacto |
| browser-dom-backend.log + browser-dom/ | Spec adicional espera conteúdo visível após reload |Playwright5/6; ECONNRESET no replay explícito de transaction-before; Java1 failure. SQL coletado mesmo na falha |
| browser-dom-failure/ | Artefatos copiados antes de nova execução |Trace sanitizado, contexto, screenshot e vídeo preservados |
| browser-before-isolated-backend.log + browser-before-isolated/ | Cenário exato filtrado, mesmo timeout/assertions financeiras |Playwright1/1 e Java1/1; SQL950/dois recibos e DOM carregado; causa do reset anterior aberta |
| affected-verify.log + affected/ + payment-R03/ | Cópia backend, seleção consolidada e browser R03 original |**139/139 verify/JAR**,0 failures/errors/skips; **R03 4/4**, conta900/quatro pagamentos. Hábitos27 verdes não encerram H24-01 |

**Não somar contagens sobrepostas.**139 inclui CF-02430, exclusão6, probes3 e um runner Java que executa quatro Playwright R03.193 inclui contratos adaptados já existentes. Os cinco vermelhos novos não viraram skips nem foram escondidos no gate verde.135 era a execução histórica do executor, com cinco exclusões e sem os três probes desta revisão; não foi reescrita como139.

## Comandos e cópias

Ambiente Maven, na raiz:

```powershell
$env:JAVA_HOME=(Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
```

Primeiro browser:

```powershell
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Rv24CreationBrowserIntegrationTest' '-Drv24.run=../revalidacao-RV24-01-RV24-02/browser' test
```

Esse nome já existe; escolher outro para reproduzir. O runner recusa saída existente. BACKEND_API_URL aponta para porta efêmera do Spring/Testcontainers; Next127.0.0.1:3107. O controller de fault injection está somente em src/test. Trigger recusa recibo após writes, antes do commit. route.fetch permite commit real antes do descarte lógico da resposta; GET503 é falha de transporte induzida, não sucesso financeiro falso. SQL independente é consultado após Playwright e salvo junto dos testes.

Frontend, cwd `controle-financeiro-frontend`:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node node_modules/eslint/bin/eslint.js --format json
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/next/dist/bin/next build
```

Cada comando tem log/exit próprio. O novo rv24-independent-review.test.tsx desta pasta foi copiado temporariamente para tests/component, executado sozinho pelo mesmo config e removido em finally antes do gate193. POST de investimento usa investmentService/apiRequest reais, com apenas fetch como double; os casos de transação usam serviço double. Não são provas de dinheiro no banco. Unitários temporais históricos não foram repetidos sem alteração do utilitário; consumidores pertinentes estão nos componentes/backend/browser. Avisos do build sobre convenções/dependências não são erros de ESLint.

Contraprova frontend: cópia única de src sob backend/target, junction apenas para node_modules instalado, config/setup/probes copiados. Somente newTransactionModal.tsx e operationModal.tsx recebem conteúdo de `git show 30211b8:<caminho>`. Local em front-causal-copy.txt. O probe original de transação mantém expected1 e observação sem chave; no candidato o contrato adaptado acrescenta principal sintético e exige UUID, preservando expected1. Mudança de requisito documentada, sem remover a prova histórica.

Backend: src/.mvn/pom.xml/mvnw.cmd copiados para diretório único (copy-path.txt). Alteração do teste existente de exclusão é apenas o destino dos arquivos de evidência, de RV24-02 para esta revisão. Novo Rv24IndependentDeletionReviewTest.java fica só na cópia. Produto/resources/POM iguais ao checkout. Seleções dirigidas:

```text
Rv24DeletionIntegrationTest#contractLinkedDeletionMustCompleteWithoutForeignKeyFailure+ordinaryPaidPurchaseAllocationMustAlsoDeleteWithoutForeignKeyFailure+completeGraphDeletionPreservesEveryOtherRowAndNotifiesOnlyAfterCommit+intermediateDatabaseFailureRollsBackAllRowsCacheAndNotification+foreignLegacySetNullAndUuidOnlyLinksRejectDeletionWithoutChangingEitherOwner+postCommitNotificationFailureDoesNotRecreateUserOrPretendRollback
Rv24IndependentDeletionReviewTest#review*
```

Invocação: wrapper da cópia, `-f <cópia>/pom.xml --batch-mode -Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository -Dtest=<seleção> test`. `#review*` evita recontar os casos herdados. PIDs/conexões distintos, latches e pg_blocking_pids comprovam espera; sem sleep como sincronização.

Contraprova FK:

```powershell
& tasks/evidencias/revalidacao-RV24-01-RV24-02/reproduce-paid-purchase.ps1 -RunName paid-purchase-red
```

O script deriva do executor com destino nesta pasta. Substitui apenas UserService na cópia histórica, exige a FK específica e compara SHA do fonte compartilhado. A cópia histórica permanece para inspeção; não se afirmou restauração dela. Gates verdes usam a cópia candidata intacta. O nome da evidência já existe e deve mudar em outra execução.

DOM adicional:

```powershell
& tasks/evidencias/revalidacao-RV24-01-RV24-02/run-browser-review.ps1 -RunName browser-dom
& tasks/evidencias/revalidacao-RV24-01-RV24-02/run-browser-review.ps1 -RunName browser-before-isolated -Grep 'RV24 transaction before'
```

O script usa copy-path.txt preparado acima, ajusta somente o runner da cópia para localizar frontend/config, cria spec/config temporários e os remove em finally. Specs efetivos em browser-review.spec.ts e browser-before-isolated-spec.ts. No recorte isolado, expected exige uma conta nomeada, dois owners, dois recibos A/zero B e zero operações de investimento. Nenhuma assertion de valor/replay/conflito/owner foi retirada. Timeouts/retries não mudaram. A captura intermediária nomeada pending não comprova visual do modal; aceite visual limita-se às capturas finais carregadas e assertions de DOM.

Consolidação: seleção literal em affected-selection.txt, wrapper da cópia com `-Dreview.grep=R03 -Drv24.run=../revalidacao-RV24-01-RV24-02/payment-R03 verify`. A saída de inventário da exclusão foi redirecionada para affected/deletion para conservar a dirigida. Inclui contratos HTTP, migrações vazio/legado/incremental, transações/investimentos/metas, hábitos27, CF-02430, exclusão6, probes3, temporais e R03. Sem benchmark novo ou CF-027 implementada.

## Falhas e preservação

- Uma tentativa de execução foi rejeitada pela revisão automática de aprovação por limite de uso, antes de executar. Após o usuário informar restabelecimento, foi submetida novamente pelo fluxo normal. Não houve bypass nem classificação de insegurança.
- test.each inicialmente interpretou [] como lista vazia de argumentos; corrigido para objeto de caso. Log anterior mantido e array real também vermelho, sem afrouxar expected.
- Capturas do runner original mostravam loading; acrescentadas esperas por conteúdo visível, sem alterar finanças. ECONNRESET no segundo run é H-RV24-01;5/6 mais1/1 posterior não são uma execução6/6 fictícia. Não se atribuiu causa sem evidência.
- Logs de testes verdes podem conter ERROR de falhas sintéticas de trigger/email/deadlock: a prova é a assertion de rollback, não a ausência dessas mensagens.
- Capturas finais inspecionadas; sem matriz visual global/mobile/zoom, restart, múltiplas instâncias/dispositivos ou corte TCP físico.
- verify-evidence.cjs confere fontes, hashes históricos, base, produto da cópia e gates. sanitize-evidence.ps1 registra SHA original/publicado e remove autenticação sintética de logs/trace. Não reaplicar para substituir proveniência original. Nenhuma evidência histórica foi regravada.
