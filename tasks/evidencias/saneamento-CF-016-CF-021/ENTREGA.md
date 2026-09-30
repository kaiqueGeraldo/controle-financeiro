# Entrega local do saneamento CF-016–CF-021

Em 30/09/2026, RVI-01–RVI-22 foram corrigidos/verificados localmente; NG-01
foi decidido pelo usuário e implementado por total autoritativo proporcional;
H-01/H-02 foram reproduzidas, confirmadas e corrigidas. A [matriz](README.md)
registra causa, dona, correção, regressão, situação e limites de cada identificador.
Probes RV/UI não substituem esses identificadores.

## Revisão e commits

Base exata: `4e685ce82f9f04491e68ca4d0b3b3d403e3d0743` (revisão independente 4e685ce; candidato 46d9fad).
Último commit de implementação/artefatos: `a752c6eed8ca9c1577af9014c21c6ac51690760b`.
Intervalo exato de código para revalidação: `4e685ce82f9f04491e68ca4d0b3b3d403e3d0743..a752c6eed8ca9c1577af9014c21c6ac51690760b`.
O commit final seguinte altera apenas este relatório e notas de estado nas tarefas;
o HEAD final integral é entregue no chat. Não houve reescrita de commits.

| Commit local | Unidade |
|---|---|
| 181d6e4d2646de939a2ae412241bae13d127ba24 | fix(finance): guard sources and preserve forecast settlements |
| a7410337318ad3cee6e2968831069490c1552390 | fix(goals): preserve purchase facts and complete checklist journey |
| 4580cf6da97a80638516a3a7b8d9dc6f0c916e79 | fix(investments): preserve total valuation and monetary redemption |
| 78d55ff7189463cc7ab54d35d077220bceb5a0e5 | feat(investments): record compensation and replay dependent costs |
| a4bb9bdd65a75d194d17757732d1fb5ed6dd3a47 | fix(investments): validate replacement ledger against migrated constraints |
| 7baffa3224378c5f34f27d70b9a5c00f59a3ee10 | feat(cards): preserve payment intent and recover committed receipts |
| ab93e78ef085fc272abe6fe926a429941c24d598 | feat(transactions): realize forecasts and track partial reversal intents |
| 14721231359dfa0a0e2af8f853f5442c87d42b71 | fix(reporting): export one PostgreSQL snapshot across pages |
| 383d4b862979289f7d6f2b65eaf5a0bc8ba9bfca | docs(finance): separate current oracles from historical preservation |
| 95ac3a6f1cbc2f48fc42e13402bcaef876cb1a4c | fix(reporting): preserve archived positions and scope exports consistently |
| ea982d4016ed697120a13d7acc88eb3d4f857fb5 | fix(reporting): expose net cash separately from gross investment income |
| 26f4d30068b0ea1f3a7579d91baca7ad5642cd44 | fix(finance): serialize archive and verify dependent purchase refunds |
| a752c6eed8ca9c1577af9014c21c6ac51690760b | fix(reporting): distinguish coverage and preserve exact monetary totals |

## Verificação final

| Camada | Resultado e evidência |
|---|---|
| Backend domínio/HTTP/PG/migração | 234 passes, zero falhas/erros/skips; backend-dominio-234-final.log |
| Browser de saneamento + pós-condições Java | 17 jornadas aprovadas; browser/entrega-final; Java no log combinado |
| Browser temporal + pós-condições SQL/XLSX | 18 jornadas aprovadas nos dois fusos, JVM UTC; browser/temporal-final; Java no log combinado |
| Componentes React | 152 passes em 33 arquivos; frontend-component-entrega-final.log |
| Última borda decimal | Oito casos direcionados; frontend-precisao-final.log |
| Unitários Node | Seis passes; frontend-unit-entrega-final.log |
| TypeScript e produção Next | Aprovados; frontend-typecheck-entrega-final.log e frontend-build-entrega-final.log |
| Lint afetado | 65 arquivos, zero erros/dois warnings anteriores; frontend-lint-afetados-final.log |
| Lint global | 23 erros/21 warnings; nenhum arquivo com erro no diff do saneamento; LINT-BASELINE.md |
| CF-016 atual/adversarial | Aprovado; cf016-oraculos-atuais-final.txt |
| CF-016 preservação histórica | Continua vermelho em pom.xml; cf016-preservacao-historica-final.txt |

O log combinado backend-entrega-fixture-vermelha.log tem 236 casos e um erro da
fixture que removia direção de TRANSFER canônica, contrariando a constraint V3.
Os dois harnesses de browser passaram, inclusive as pós-condições Java. A fixture
foi corrigida para UNKNOWN, sem mudar a constraint ou valores, e toda a suíte de
234 casos sem browser foi repetida com verde. Não se declara aquele run integral
verde, nem se soma execução parcial para esconder erro. Explicações dos ajustes
normativos e primeiros vermelhos estão em [ADAPTACOES-DE-TESTES](ADAPTACOES-DE-TESTES.md).
A revisão vermelha original permanece sem diff.

Dados sintéticos e PostgreSQL descartável; migrações V1–V11/Hibernate validate,
banco vazio, legado, upgrades, rollback e concorrência real. V1–V5 intactas.
Email/cotação são doubles nas fronteiras externas; nenhuma regra financeira ou
sucesso interno dos fluxos integrados foi neutralizado por mock. Falhas de
transporte/leitura nos cenários R03 são injetadas após commit real.

Imagens financeiras 360/768/1440 inspecionadas; compensação 360 final aguardou
opacity 1 e contém o histórico. XLSX efetivamente baixados foram abertos e
verificados pelo script, preservando caixa 9/0 versus gerencial 10/1, zero conhecido
versus ausência e filtro TRANSFER. Largura 180 e screenshots não são zoom nativo 200%.

## Comandos reproduzíveis

Executar os comandos de backend em `controle-financeiro-backend` e os de frontend
em `controle-financeiro-frontend`. Docker deve estar disponível para os containers
PostgreSQL. Backend no PowerShell, JDK 21 usado nesta execução:

```powershell
$env:JAVA_HOME='C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1'
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=*,!IntegratedMilestoneBrowserReviewTest,!MilestoneRemediationBrowserTest,!TemporalBrowserApiPostgresE2E' '-Duser.timezone=UTC' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=MilestoneRemediationBrowserTest' '-Dreview.evidence=revalidacao-nova' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=TemporalBrowserApiPostgresE2E' '-Duser.timezone=UTC' test
```

Executar harnesses sequencialmente, com porta3107 livre; produzem novos dados e
logs. O harness original de revisão permanece preservado como reprodução da
base, sem ser apresentado como suíte regressiva do contrato adjudicado. Os probes
de domínio existentes permanecem na suíte; consumidores equivalentes são
revalidados nas 17 jornadas e R03 nos dois fusos, sem remover suas assertions.

No frontend, depois de encerrar servidores dev dos harnesses:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node scripts/test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js .
node node_modules/next/dist/bin/next build
```

Na raiz:

```powershell
node tasks/evidencias/CF-016/verify.mjs --current --adversarial
node tasks/evidencias/CF-016/verify-preservation.mjs
& tasks/evidencias/saneamento-CF-016-CF-021/verify-downloaded-xlsx.ps1 -Run entrega-final
```

Os comandos de lint global e preservação estrita continuam com resultado
vermelho documentado; não atualizar hashes ou desativar regras para ocultá-lo.

## Custos, gates e riscos remanescentes

[Inventário de fontes/fronteiras](FRONTEIRAS-E-WRITERS.md) detalha política de
capacidade/arquivo, ordem de locks, consultas em lote e precisão. Lock por fonte
serializa disputa nessa fonte; snapshot mantém conexão/MVCC até concluir export;
SXSSF retém 100 linhas, páginas 500 e bytes finais usam memória proporcional ao
arquivo. Replay de custo é O(operações do ativo). Não houve benchmark amplo.
Cobertura coletiva conservadora e origem legada desconhecida podem indisponibilizar
totais completos; subtotal observado exato continua visível com motivo/data.

Não há decisão de produto pendente dentro do saneamento: NG-01 foi respondido.
O marco aguarda revisão independente; CF-016 continua concluída apenas no escopo
histórico de especificação e CF-017–CF-021 continuam em_revisao. Permanecem gates:
CF-015 zoom nativo 200%; CF-017 RV17-01/RV17-02 e adoção/backup/restore reais;
auditorias transversais CF-023/024/025/027/032; lint global preexistente. Identificação
em sessionStorage não certifica preservação após sua perda ou entre dispositivos.
Autotestes não autorizam aceite/publicação. Sem banco real, Railway, email real,
push ou deploy. Nenhuma tarefa CF-022+ foi executada; notas transversais delimitam
somente o alcance das provas locais.

README raiz alheio preservado, fora de todos os commits; SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
