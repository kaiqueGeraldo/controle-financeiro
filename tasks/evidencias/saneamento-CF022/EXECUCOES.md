# Execuções e reprodução

Execução17/10/2026, finalização18/10 após retomada; fuso America/Sao_Paulo.
Base eb41301ec7d2f08007c7c4637463df81e8460a54. Node24.18.0,
JDK21.0.12.1, Playwright1.63.0, PostgreSQL16-alpine/Testcontainers.
Docker, navegador e HTTP local executados fora do sandbox pelo mecanismo de
aprovação; nenhuma rejeição de revisão automática, banco real ou serviço externo.

## Ordem e resultados

Comandos da raiz. `run-java.ps1` configura JDK/cache local e JVM UTC, cria pasta
nova, recusa sobrescrever evidências e executa Maven test. O parâmetro Candidate
seleciona .cf22s; antes dele, a exportação fica em runtime/. Logs/surefire são
mantidos por execução, sem somar observações ou testes repetidos como independentes.
As primeiras cópias manuais de surefire incluem relatórios anteriores já existentes;
o log Maven da execução e as datas identificam os casos novos. O runner posterior
copia somente relatórios gravados desde o início daquela execução.

```powershell
node tasks/evidencias/saneamento-CF022/prepare.cjs
./tasks/evidencias/saneamento-CF022/run-java.ps1 -Name before-scheduler -Tests 'IndependentFixtureProbeTest#freshResidualIsolated'
$env:PLAYWRIGHT_BROWSERS_PATH='0'
node tasks/evidencias/saneamento-CF022/before/clock-probe.cjs
```

prepare preservou2313 arquivos por SHA256 e exportou a base. As duas provas
independentes foram copiadas sem modificar seus bytes. Clock16 observações PASS;
scheduler1 teste ERROR no residual (TimeoutException10s), fresca2 leituras. Arquivos
originais e resultado parcial estão em before/ e before-scheduler/.

Regressão de relógio: `CF022_CLOCK_HELPER` apontou para before/old-clock.cjs,
que preserva a chamada `page.clock.setFixedTime(date)` do browser original.

```powershell
node --test controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/civil-date-clock.test.cjs
```

Com helper antigo:1 falha por clocks não nativos, before/clock-regression.log.
Sem a variável, helper candidato:1 PASS, clock-corrected.log. O segundo processo
não herda a variável do primeiro. Oito documentos (incluindo reload) e contexto
novo sem vazamento são observações dentro desse único teste, não nove testes.

Antes da correção, copiar HabitFixtureIsolationIntegrationTest.java para a
exportação da base e executar:

```powershell
./tasks/evidencias/saneamento-CF022/run-java.ps1 -Name before-isolation-regression -Tests 'HabitFixtureIsolationIntegrationTest#aVolumeThenCallback+bCallbackAfterVolume+cRepeatedCallbackBeforeVolume+dVolumeAfterCallback'
node tasks/evidencias/saneamento-CF022/prepare-candidate.cjs
./tasks/evidencias/saneamento-CF022/run-java.ps1 -Candidate -Name corrected-isolation -Tests 'HabitFixtureIsolationIntegrationTest#aVolumeThenCallback+bCallbackAfterVolume+cRepeatedCallbackBeforeVolume+dVolumeAfterCallback'
```

Antes4 casos/3 falhas (501 herdados); depois4/4 PASS. `prepare-candidate.cjs`
preserva relatórios, move somente o runtime desta execução para .cf22s e sincroniza
os sete arquivos candidatos. Runtime não ignorado permite descoberta Tailwind;
junction node_modules e turbopack.root adaptam a cópia ao Windows local. Nenhum
arquivo da .cf22 antiga é alterado. Inicialização Java recompilou225 fontes de
produto e testes com javac/release21, sem falhas de compilação.

```powershell
./tasks/evidencias/saneamento-CF022/run-java.ps1 -Candidate -Name corrected-browser -Tests HabitBrowserIntegrationTest
node tasks/evidencias/saneamento-CF022/prepare-warmup.cjs
./tasks/evidencias/saneamento-CF022/run-java.ps1 -Candidate -Name corrected-browser-warm -Tests HabitBrowserIntegrationTest
```

Primeiro:1 falha na URL de autenticação durante compilação da home, SQL vazio.
Segundo:1 orquestrador PASS com4 jornadas integradas; mesmas assertions e arquivo
browser.cjs. A adaptação de launcher/pré-compilação está explicada no README.
Restaurado HabitBrowserIntegrationTest.java na cópia a partir do checkout; hashes
conferidos por verify.cjs. Não se repetiu execução idêntica até passar.

```powershell
./tasks/evidencias/saneamento-CF022/run-java.ps1 -Candidate -Name corrected-integrity-and-causal -Tests 'HabitIntegrityIntegrationTest,IndependentFixtureProbeTest#freshResidualIsolated'
```

27 casos originais +1 probe PASS,0 falhas/erros/skips,2min54s Maven.
Probe posterior:2→1006→2; SQL FAILED1→503→1 e GoalHistory0. Mesmos10s por Future,
sem mudar produto ou probe. JVM aquecida pela classe original: não comparar
latência com JVM anterior como benchmark causal. Aviso de erro sintético emitido
pelo teste de rollback é esperado, não falha escondida.

Contraprovas finais, com arquivos exclusivos na cópia:

```powershell
node tasks/evidencias/saneamento-CF022/counterproof-clock/clock-probe.cjs
./tasks/evidencias/saneamento-CF022/run-java.ps1 -Candidate -Name mutation-without-isolation -Tests 'UnisolatedFixtureMutationTest#aVolumeThenCallback+bCallbackAfterVolume'
```

Copiou-se o probe original para counterproof-clock/ e a subclasse mutante desta
pasta para o runtime. Clock16 observações PASS bad/good; mutante2 casos/1 falha
esperada (pré-condição0, observado501). Arquivos candidatos permaneceram iguais.
Para reproduzir, usar exportação nova e nomes/pastas próprios; não executar
preparadores sobre artefatos existentes nem a suíte inteira do runtime que contém
a mutação deliberada. Seletores acima delimitam o que foi executado.

## Verificações finais

ESLint nos três arquivos CJS candidatos, com `--no-config-lookup --no-ignore`,
regras no-unused-vars (args/caughtErrors:none), no-unreachable e
no-constant-condition: sem erros, lint.log. Não há configuração ESLint backend;
não se aplicou a configuração de aplicação Next a esse runner CJS.
`node --check` nos mesmos três arquivos:0, syntax-checks.json. Typecheck Java feito
pelo javac em todos os runs; nenhum TS/TSX ou helper TS foi alterado, portanto não
se ampliou para tsc/build de produção frontend. Next compilou as rotas reais no
E2E. Não se apresenta isso como build/deploy de produção.

`sanitize.cjs` preservou cinco arquivos brutos da falha de auth em raw/ e ocultou
somente a senha sintética dos logs públicos. Trace privado ignorado; capturas não
contêm credenciais reais. Os sources sintéticos continuam completos/reproduzíveis.
`verify.cjs` confere preservação2313, fontes431, sete arquivos candidatos e gera
manifesto SHA256 de evidências públicas. CRLF normalizado somente na comparação
de fontes de produto; provas públicas mantêm bytes com .gitattributes.

Commits de execução: b8bc945 (relógio), c4cd0da (fixtures),9cade4e (regressões).
Evidências/estados em commit local posterior. Revisão do saneamento:
`eb41301..HEAD` nesta branch. Investigação/revisão anteriores não fazem parte do
delta novo; permanecem consultáveis e preservadas. Main local continua
e1c63120129f202440992f29276fa4372111513a; nenhum push/merge/remoção de branch.
