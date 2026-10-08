# Execuções, bases e limitações — 08/10/2026

Produto examinado: `1b0d9bcefaba0bcc37a21955caa94db65a3bf383`. Nenhuma alteração de produto. Novos arquivos de teste:

- `controle-financeiro-frontend/tests/component/directed-temporal-review.test.tsx`;
- `controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/DirectedGoalHistoryTemporalTest.java`.

## Preparação e leitura

Na raiz: `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, `git diff --cached --stat`, `git merge-base --is-ancestor 1b0d9bcefaba0bcc37a21955caa94db65a3bf383 HEAD`, `git log --oneline 1b0d9bcefaba0bcc37a21955caa94db65a3bf383..HEAD`, `Get-FileHash README.md`. HEAD igual à referência, staging vazio, nenhum commit posterior. README foi o único delta preexistente. Busca AGENTS na árvore/ancestrais, instrução do usuário aplicada. Nenhuma branch nova foi necessária.

A matriz começou pela transcrição dos quatro critérios de cada tarefa; depois foram associados os itens de trabalho originais que exigem auditar consumidores e conformar serialização a CF-004. Leituras de fontes/pareceres foram dirigidas por essas garantias. `changes-since-temporal-review.txt` registra o stat de `1ced2f0..HEAD`; `changes-since-latest-consumer-review.txt`, paths de `06c1a51..HEAD`. O diff do spec/runner temporal de `3d64e7a..HEAD` é vazio, registrado em `integrated-test-delta.diff`. Esse vazio é comparação atual, não output de execução histórica.

## Componentes atuais

No frontend, mesma seleção nas duas tentativas:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/temporal-forms.test.tsx tests/component/temporal-navigation.test.tsx tests/component/temporal-presentation.test.tsx tests/component/temporal-compatibility.test.tsx tests/component/habit-product-day.test.tsx tests/component/planning-edit.test.tsx tests/component/http-contract.test.tsx tests/component/bff-contract.test.tsx tests/component/user-session-review.test.tsx
```

- `components.log/exit`: exit1, nove suítes falharam na inicialização por EPERM rename do cache em TEMP sandbox; **zero testes executados**.
- `components-authorized.log/exit`: acesso ao cache autorizado, mesmo comando/config/assertions, **64/64**, nove arquivos, exit0. Sem retries configurados nem alteração de timeout. Não é prova de banco/browser.

Novo probe, primeira versão com dois testes: mesmo comando base, arquivo `tests/component/directed-temporal-review.test.tsx`, `TZ=UTC`, `CF_TEST_TIMEZONE=UTC`; `probes-frontend.log/exit`, dois vermelhos causais. Separou-se a assertion positiva de estabilidade de seleção em teste próprio e colocou-se UTC no próprio teste via `vi.stubEnv`, com confirmação `getFullYear()===2027`; a restauração de ambiente é fornecida pelo `unstubEnvs:true` do harness existente. Nenhum expected foi modificado para aceitar produto.

Versão final, sem precisar configurar TZ externo:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/directed-temporal-review.test.tsx
```

`probes-final.log/exit`: **1 positivo e2 vermelhos**, exit1. São RD58-01 (ano2026 em vez de2027) e RD58-02 (histórico renderizado sem “Fuso desconhecido”). O cabeçalho genérico do setup registra America/Sao_Paulo; o primeiro teste explicitamente substitui TZ porUTC e observa o ano real do processo antes de testar o hook. Não depende desse cabeçalho como oráculo. A primeira versão e a final são sobrepostas, não cinco testes únicos. A suíte ampliada **não está verde**; testes foram mantidos ativos, sem skip/only/quarentena.

## Backend e PostgreSQL descartável

No backend:

```powershell
$env:JAVA_HOME=(Get-Content ../tasks/evidencias/revisao-CF-025-CF-027-RV24/runtime-path.txt -Raw).Trim()
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=DirectedGoalHistoryTemporalTest,TemporalCompatibilityIntegrationTest,PostgreSqlTemporalRoundTripTests,TemporalConfigTest,TemporalJsonContractTest,TemporalBoundaryReviewTest,CredentialExpiryClockTest,ScheduledCalendarClockTest,HttpContractControllerTest,PlanningEditIntegrationTest' '-Duser.timezone=UTC' test
```

Docker/Testcontainers e cache Maven acessados com autorização da ferramenta. JDK21, PostgreSQL16 descartável; e-mail/cotação são doubles externos do harness. Não há H2 nem substituição de persistência por mocks nas provas que dependem dela. Serviços de unidade seguem a camada própria, não são chamados de integração.

`backend.log/exit` e `backend-results.json`: **77 testes,76 aprovados,1falha,0erros,0skips**, BUILD FAILURE/exit1. Falha final de DirectedGoalHistoryTemporalTest: esperado `2026-09-08T03:10:00Z`, recebido `2026-09-08T00:10:00`; SQL confirma uma linha nova com `2026-09-08 00:10:00`. HTTP real pelo MockMvc/controller/serviço/ORM, commit e GET posterior; não é navegador nem BFF. Os demais nove arquivos passam. Compilation/testCompile foram executados pelo Maven; não existe nova regra Java estática configurada exigida para esse arquivo.

`backend-results.json` foi extraído dos relatórios Surefire desta execução, por lista explícita das dez classes, preservando nomes de casos/falhas sem publicar system properties/credenciais. O log e o resultado durável independem da permanência de target. Não houve `clean`, reset, remoção ampla ou reconstrução de outputs históricos.

Na inspeção do diff staged, o probe novo foi desacoplado do MutableClock da suíte
de compatibilidade: a versão final declara seu próprio Clock.fixed imutável, com
o mesmo instante/zona literal. Isso elimina possível dependência da ordem/cache
de contextos Spring, sem mudar o oracle. Reexecução final apenas de
`-Dtest=DirectedGoalHistoryTemporalTest`, demais flags iguais, registrada em
`backend-probe-final.log/exit`. Não é caso único adicional aos77.
Resultado final: uma falha pelo mesmo valor `00:10:00` sem offset, zero erros e
zero skips, exit1. `sanitization-final.json` registra hashes antes/depois da
redação de JWT sintético deste novo log, efetuada após o processo terminar.

## Verificações estáticas

No frontend:

```powershell
node node_modules/eslint/bin/eslint.js tests/component/directed-temporal-review.test.tsx
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

`static-result.json` para a primeira versão; após separar o controle e fixar TZ, `static-final.json`: lint0/typecheck0. Logs finais vazios indicam comandos sem diagnóstico, com exit0 registrado; não contam como testes funcionais. Não se executou build/lint global novo por edição apenas de testes/documentos; L/U preservam seus gates próprios de produto.

## Reuso e limites de execução

Nenhuma nova jornada Playwright ou mutação foi necessária para o recorte preservado: F registra M01/M02/M03/M10 e restauração; V/P/R/J/L/U cobrem alterações posteriores nas garantias consumidas, discriminadas no README/MATRIZ. Esses resultados não são somados aos atuais. M01/M02 verificam componentes reais, M10 verifica API real alterando o dia. As novas lacunas têm falha causal diretamente no candidato, dispensando fabricar mutante para demonstrar os defeitos atuais.

Contagem única desta revisão:67 testes frontend (65 positivos/2 negativos) e77 backend (76 positivos/1 negativo), sem somar tentativas de cache/primeira versão ou contagens históricas. Isso descreve execução; não determina o aceite por si só. Novos vermelhos não foram isolados do código regular para produzir falso gate verde.

## Sanitização e preservação

`sanitize-evidence.ps1` foi reutilizado do parecer de propriedades, aplicado somente à pasta nova. Primeira invocação interrompeu ao encontrar `typecheck-final.log` ainda aberto; havia redigido credenciais sintéticas no backend antes de alcançar esse arquivo. Nenhum teste foi repetido por isso. Após término do processo estático, a segunda invocação completou: `sanitization.json` descreve os hashes **na entrada dessa segunda passagem**, já sanitizados onde aplicável, e a saída publicada. Não se alegam hashes dos bytes brutos anteriores à primeira passagem. Outputs históricos não foram sanitizados novamente nem regravados.

Manifest final registra fontes novas, evidências publicadas e preservação do README. Staging explícito/diff inspecionado por commit; somente testes/probes/evidências/documentos/estados desta revisão. Commits e HEAD final são informados na entrega. Nenhum push, deploy, banco real ou implementação de CF-028.
