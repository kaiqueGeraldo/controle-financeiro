# Execuções independentes — 18/10/2026

Branch codex/cf022-investigacao. Entrada exata5e2fae5355ad2c745b955b66d676b6c479edf8e1;
intervalo eb41301..5e2fae5, quatro commits b8bc945/c4cd0da/9cade4e/5e2fae5.
Nenhum avanço inesperado. Staging inicial vazio. README modificado anteriormente,
.cf22 e .cf22s não versionados. Hash inicial do README:
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.

## Preparação e comandos

`prepare.cjs` exporta5e2fae5 para .cf22r e recusa diretório existente. Preserva3792
arquivos históricos (runtimes antigos e evidências, sem seguir junctions), confere
90 hashes do manifesto público do saneamento e cria junction de dependências.
Turbopack.root aponta ao workspace; fonte Tailwind descoberta:322 arquivos,
classes fixed/flex presentes. Produto vem do git archive, nunca do runtime antigo.

Na raiz, execução fora do sandbox para Docker/Chromium/HTTP local:

```powershell
node tasks/evidencias/revalidacao-saneamento-CF022/prepare.cjs
$env:PLAYWRIGHT_BROWSERS_PATH='0'
$env:CF022_CLOCK_HELPER=(Resolve-Path 'tasks/evidencias/revalidacao-saneamento-CF022/old-clock.cjs').Path
node --test .cf22r/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/civil-date-clock.test.cjs
Remove-Item Env:CF022_CLOCK_HELPER
node --test .cf22r/controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/civil-date-clock.test.cjs
./tasks/evidencias/revalidacao-saneamento-CF022/run-java.ps1 -Name backend -Tests 'HabitIntegrityIntegrationTest,LifecycleReviewTest#aVolumeThenCallback+bCallbackAfterVolume+cRepeatedCallbackBeforeVolume+dVolumeAfterCallback'
./tasks/evidencias/revalidacao-saneamento-CF022/run-java.ps1 -Name mutation -Tests 'UnisolatedFixtureMutationTest#aVolumeThenCallback+bCallbackAfterVolume'
./tasks/evidencias/revalidacao-saneamento-CF022/run-java.ps1 -Name browser -Tests HabitBrowserIntegrationTest -WarmBrowser
node tasks/evidencias/revalidacao-saneamento-CF022/check-cjs.cjs
node tasks/evidencias/revalidacao-saneamento-CF022/verify.cjs
```

Comandos acima agrupados por função; a bateria Java começou antes dos dois
processos Node de relógio, que não compartilham banco, fixture ou servidor com
ela. Execuções Java/containers foram sequenciais. Não há benchmark de latência.
Runner configura JDK21.0.12.1, JVM UTC, cache Maven existente, captura exitCode e
somente relatórios surefire recentes. Node24.18.0/Chromium Playwright instalado,
PostgreSQL16-alpine gerado por Testcontainers, mocks de email/mercado herdados.
Nenhum acesso externo real de negócio, migração real ou notificação.

## Probes e resultados

Clock antigo: exit1, assertion de timers/performance/rAF nativos falha; calendário
ainda correto. Candidato: exit0, oito documentos nos dois fusos (inclui reload),
interação real com botão e novo contexto sem Date modificado. Arquivos clock-old.log
e clock-candidate.log preservados. O teste para na primeira assertion falsa do
controle antigo; não se afirma que mediu o timeout30s ou animação negativa nesse
controle. Mecanismo de origem divergente tem contraprovas anteriores preservadas.

Backend:31 casos, zero falhas/erros/skips. São27 originais e4 casos herdados
executados pela subclasse LifecycleReviewTest, não31 cenários novos. A subclasse
não muda expected/fixture/callback: observa current_schema na conexão e durante
findForUpdate, incluindo scheduling-1; verifica4 schemas únicos e fechamento de
4 contextos,4 pools e término de4 executores. Volume roda no thread main; os casos
de callback usam o worker real registrado. Leituras1002/2/2/1002 e datasets
501/1/1/501 continuam as assertions originais. Consultas de observação adicionam
custo; durações deste probe não são estimativa do custo normal de produção.

Mutação: a subclasse AFTER_CLASS mantém contexto deliberadamente. Não altera
arquivos candidatos. O primeiro método cria/processa501; o segundo deve falhar na
precondição vazia (expected0/actual501), sem executar a ação sobre fixture errada.
Logs/exit e totais são conferidos pelo verificador; não contar essa falha como
defeito do candidato. Mutante só existe na cópia descartável, não no src/test principal.

Browser: launcher temporário chama warm-browser.cjs antes do mesmo browser.cjs
candidato. Todos os asserts e prazos originais mantidos. Hash do launcher restaurado
em finally, mesmo na falha. SQL terminal e12 observações de pintura/relógios são
conferidos com os resultados das4 jornadas. Preparação e limites em FALHAS-E-LIMITES.

Lint/sintaxe: três CJS alterados passam node --check e ESLint com no-unused-vars,
no-unreachable/no-constant-condition; resultados em cjs-validation.json. Java
compilado com release21 nas execuções. Não há TS/TSX ou helper TS alterado;
não foi executado tsc global nem build de produção. Nenhum filtro removendo teste,
timeout maior, retry automático, animação desativada ou click forçado foi usado.

## Provas reaproveitadas e preservação

2→1006→2 conferido nos logs/SQL da revisão independente anterior e no resultado
corrected-integrity-and-causal do candidato; não é execução nova desta revisão.
As quatro ordens e27 casos foram reexecutados por incidirem na fronteira de
setup modificada. Provas originais e falhas intermediárias não foram apagadas.

verify.cjs confronta os3792 hashes históricos,431 fontes de produto, sete fontes
candidatas na cópia e checkout contra5e2fae5 (CRLF normalizado em texto), resultados
Java, schemas/recursos e pintura/calendário. Nenhum produto ou harness compartilhado
é modificado por esta revisão. A única adaptação transitória é o launcher na cópia.

Versionados: plano, probe novo, preparador/runner/verificador, logs/results/SQL/
capturas, validaçãoCJS, hashes e pareceres. Locais: .cf22/.cf22s/.cf22r, junction
node_modules/Chromium, cache Maven/JDK/Docker, raw/traces privados. Não seguir
junction significa que hashes não certificam todos os bytes das dependências
externas. Outro ambiente precisa instalar as versões e ajustar os caminhos locais
do runner. Não executar preparadores sobre runtimes existentes ou suite inteira
da cópia que contém o mutante. Usar diretório/nomes novos para reproduzir.

Nenhum clean/reset/remoção de target, push, merge ou deploy. Arquivos históricos
e runtimes antigos permanecem no lugar. Runtime novo não será adicionado ao Git.

## Falha própria do verificador e resultado final

Primeira chamada do verificador falhou na comparação binária com o blobGit.
Script preservado em verify-initial.cjs; repetição apenas dessa leitura para
capturar stderr em verify-bytecheck-failure.log confirmou o mesmo erro. A exportação
git archive aplicou CRLF: HabitBrowserIntegrationTest.java tem73 CRLF na cópia,
zero no blob; texto normalizado é idêntico. O runner já havia confirmado restauração
exata dos bytes exportados do launcher. Não houve alteração de comportamento.
verify.cjs foi corrigido para normalizar somente CRLF do texto, conservando hashes
brutos e contagem de CRLF. Binários continuam comparados por bytes. Resultado final:
3792 históricos intactos,431 fontes de produto equivalentes, sete fontes candidatas
conferidas,31/31 backend, mutante2/1falha esperada, browser1/1 com4 jornadas e12
observações. Não é relaxamento de assertions funcionais ou apagamento de vermelho.

Staging explícito separado para provas, parecer e estados. Logs e metadadosJSON
emitidos pelo PowerShell mantêm CRLF e espaços das ferramentas; checagem de whitespace documental/código é
separada desses bytes históricos. Nenhuma normalização de logs para obter verde.
Manifesto EVIDENCE-SHA256 registra os arquivos públicos finais; runtimes e traces
não entram no index. Hash do README e staging são conferidos novamente na entrega.
