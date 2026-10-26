# Comandos, fronteiras e proveniência

Base documental integrada:272001f7b4c39aebd18bdcd856109f9a0f6c1213.
O candidato usado em cada tentativa consta em seu result.json; execuções
anteriores não são reaproveitadas como testes do pacote de uma execução nova.

Preparação local, na raiz do repositório:

```text
node .github/scripts/prepare.mjs ../controle-financeiro-runtimes/CF-034/<execucao>
node <execucao>/checkout/.github/scripts/ci.mjs all <execucao>/checkout <execucao>/evidence-01
node --test .github/scripts/ci.test.mjs
```

`prepare` exige destino novo sob CF-034, exporta fontes rastreados mais inputs
explícitos de CI e dois oráculos JSON; não exporta README raiz, target, node_modules,
.next ou .env. A condição real da árvore original fica no manifesto, incluindo
README modificado. `sourceFor` exige igualdade de bytes SHA256 e do conjunto de
inputs, recusando arquivo modificado ou arquivo novo sem registro. Complexidade
linear no total de bytes relevantes, com custo de I/O deliberado por gate.

Neste checkout Windows de raiz longa, escolher identificador curto (por exemplo
`CF-034/11`): o browser em node_modules excedeu o caminho iniciável na tentativa10
(264 caracteres, executável presente, spawn ENOENT). O experimento de caminho
curto no mesmo arquivo demonstrou a causa; a tentativa11 usa250 caracteres.
Isso é limitação local demonstrada, não uma promessa de compatibilidade com
qualquer comprimento de caminho. Runner Linux ainda exige sua própria execução.

O mesmo ci.mjs atende local e Actions. Windows usa Node/npm CLI e mvnw.cmd; Linux
usa npm CLI e sh ./mvnw. Diretório de trabalho frontend/backend é explícito.
JAVA_HOME local aponta ao Temurin21 já existente sob target da raiz, somente lido;
PATH recebe seu bin. Não houve `clean`, limpeza geral de target ou instalação de
runtime temporário na raiz. CI prepara Temurin21 e Node24 por Actions.

Sequência obrigatória, interrompida no primeiro erro:

```text
frontend: npm ci --no-audit --no-fund
          npm run lint -- --max-warnings=0
          npm run typecheck
          npm test
          npm run test:component -- --reporter=json --outputFile=<novo>/components.json
          npm run build
          npm run test:e2e:install
backend:  mvnw --batch-mode -Duser.timezone=UTC -Dspring.test.context.cache.maxSize=4
          -DfailIfNoTests=true -Dtest=<classes de backend-selection.json>
          -Dcf034.reportsDirectory=<novo>/surefire verify
E2E:      mvnw --batch-mode -Duser.timezone=UTC -Dspring.test.context.cache.maxSize=4
          -Dtest=FinancialJourneyPostgresE2E -Dsurefire.failIfNoSpecifiedTests=true
          -Dcf034.reportsDirectory=<novo>/e2e-surefire test
pacote:   recibos da mesma fonte + SHA do JAR do verify + novo package-manifest.json
```

Compilação não é contagem de testes. `verify` engloba compilação, teste e JAR
somente quando termina com sucesso; seus XML novos determinam os totais reais.
O E2E é outro comando e outros relatórios. Pacote só é elegível após ambos e
frontend aprovados; recibos antigos são invalidados antes da reexecução. Não há
skipTests, continue-on-error ou retry que transforme falha obrigatória em aprovação.
Execução remota de Actions permanece uma categoria separada e não executada.

O harness E2E inicia PostgreSQL16 descartável, Spring em porta aleatória, Next
na3142 e Chromium real. Usa usuários sintéticos, email/mercado externos substituídos,
credenciais de teste e proteção contra DB externo. BFF e serviços financeiros
continuam reais. Readiness do Next é observada pelo Playwright; Spring e PostgreSQL
precisam estar disponíveis para o wrapper/jornadas. Resultado SQL e releitura
integram os oráculos CF032. Não há envio real de emails/notificações.

As contraprovas usam `counterproofs.mjs` em exportações sem .git e diretórios novos.
O script registra o exit não zero do gate, a ausência de aprovação posterior e
restaura bytes/descriptor por SHA256 em finally. O exit0 do **experimento** significa
detecção da falha esperada, jamais êxito do gate mutado. O teste de cleanup do
calendário foi diagnóstico separado, com oráculos originais preservados.

Coleta durável por `collect.mjs`: resumos por suíte com SHA dos XML brutos, totais
de componentes/browser, result e manifests; somente logs frontend explicitamente
permitidos. Os diagnósticos brutos ficam preservados no runtime externo. O workflow
usa publish-evidence.mjs para sanitizar a allowlist antes de artifact upload; não
inclui XML com propriedades, perfil de browser, auth state, SQL/dump ou .env.
O coletor de CI foi efetivamente exercitado na execução falha08:
[diagnosis-check.json](diagnosis-check.json), sete arquivos permitidos, nenhum
XML/SQL bruto e zero JWT completo na busca aplicada ao material coletado. Isso
é verificação local da coleta, não prova de upload remoto ou auditoria exaustiva
de todos os formatos possíveis de segredo.
`versioned-evidence.mjs` compara os bytes de cada arquivo staged com `cat-file`
do objeto Git e preserva ambas as identidades. Uma conversão CRLF→LF só é
registrada quando seu SHA reproduz exatamente o blob; qualquer diferença sem
explicação interrompe a conferência. Manifests históricos permanecem intactos.

Versões observadas na preparação: Windows, Node24.18.0, npm11.16.0,
Temurin21.0.12.1+1, Docker29.6.2, PostgreSQL16-alpine, Next16.1.6,
React19.2.3 e Playwright1.63.0. Instalação usa package-lock e wrapper/POM existentes.
Consulta efetiva `mvnw.cmd --version` no runtime 11: Apache Maven3.9.12,
Java21.0.12.1 Eclipse Adoptium, Windows11/amd64, UTF-8; wrapper3.3.4.
Browser instalado: Chrome for Testing / Headless Shell153.0.8010.12, revisão
Playwright1243. Imagem PostgreSQL observada no Docker:
`postgres@sha256:cf78e76683b9ca8c5733cbbdce6c9262b45b6767934dd0a95e671f9a0fc20685`.
Tags de imagem e dependências transitivas não constituem promessa de reprodução
binária. O SHA do JAR demonstra identidade do pacote desta execução, não uma
segunda compilação idêntica. Nenhuma imagem Docker recebeu aceite nesta entrega.
