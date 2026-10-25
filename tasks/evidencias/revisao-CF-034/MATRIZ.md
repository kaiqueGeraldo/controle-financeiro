# Matriz independente local/remoto

Base272001f..64603a3; DEC-CI-04 autoriza somente preparação, infraestrutura,
testes/revisão locais. Estados abaixo não substituem o arquivo canônico.

| Critério/trabalho CF034 | Alcance autorizado e implementação | Evidência local e verificação desta revisão | Remoto ausente | Condição de aceite integral |
|---|---|---|---|---|
| Trabalho1: lint/tipos/build progressivos | ci.mjs frontend; npm ci lockfile; cwd explícito | Rodada11 comandos/exits/logs; subprocesso23 independente bloqueia avanço | Node/Linux/setup/cache efetivos | Mesmos comandos concluídos em Actions e checks corretos |
| Trabalho1: testes frontend | TAP3 fusos, Vitest componentes+onboarding | 18 execuções (6 casos×3); 620 assertions nominais brutas, zero falhas/skips; relatório ausente bloqueia | Execução remota não inferida | Resultado remoto e matriz aplicável; zoom separado |
| Trabalho1/2: backend sem skipTests | POM reportsDirectory, seleção94, verify e Testcontainers | XML de cada classe/caso:889; zero falhas/erros/skips, sem rerun; unitários não são todos PostgreSQL | Docker/Temurin21/Linux efetivos | Suíte requerida realmente executada e isolada no runner |
| Trabalho1: E2E real | FinancialJourneyPostgresE2E, Playwright CF032 | Wrapper1 e6 jornadas A/B/G/H/K/L, cada uma uma tentativa; SQL/reload/sessões e16 migrações/validate verificados | Rede loopback, browser/OS e cleanup Actions | Jornadas e matriz acordada aprovadas remotamente; sem ampliar smoke por inferência |
| Trabalho3: smoke/expanded e triggers | suites.mjs, ci.yml required e expanded needs required | YAML parseado; filtros backend/frontend/.github/tasks/docs;15 bridges diferidos declarados | Sem execução de evento/needs; expanded sem preparo validado | Preparar/executar matriz ampliada, comprovar eventos e checks |
| Aceite1: regressão bloqueia avanço | sequence/command/requireCounts/recibos | Negativos lint/data exit1, downstream ausente; JAR adulterado rejeitado; subprocesso e relatório ausente novos | Bloqueio real de jobs/merge, proteção de branch | Prova remota causal quando autorizada; não só YAML |
| Aceite2: checkout sem segredo de produção | prepare/source, npm ci, Testcontainers e guard | Export11 novo, README fora mas dirty registrado; dependências e inputs conferidos; sem .env exportado | Instalação limpa Linux e permissões reais | Checkout remoto e serviços descartáveis; nenhuma dependência secreta operacional |
| Aceite2: isolamento e encerramento/flaky | schema/contexto, UUID, retries0, finally/harness | Rodada11 sem reruns, prontidão observável e recursos finais históricos; RCI034-L01 limita cancelamento | Cleanup por cancelamento/timeout de job não ensaiado | Provar procedimento local suportado e cancelamento remoto separadamente |
| Aceite3: build/pacote correspondente | verify cria JAR; package exige recibos+SHA | 810 inputs; fonte a5ad7a6; resultado all e comandos da11; binário hash conferido; package standalone não é teste novo | Upload/download/identidade remota ausentes | Artifact remoto da revisão testada e vínculo de consumo comprovados |
| Trabalho2/aceite3: imagem | Dockerfile histórico não utilizado | verify da11 executa testes; skipTests histórico só empacota | Imagem publicada não construída/validada aqui | Definir cadeia da imagem para revisão testada antes de certificar imagem/uso |
| Trabalho3/aceite4: diagnóstico sanitizado | publish-evidence, collect, safe; allowlists | RCI034-01/P2 confirmado com sentinelas; logs/SQL/traces separados | Upload real ausente | Sanear/revalidar coleta local antes de testar upload |
| Aceite4: evidências e não enfraquecimento | deltas testes/POM/helpers; documentação CF034 | V1–V16 explícitas, segundos conforme SPEC002, cleanup original mantido; falhas02–10 preservadas | Evidência remota não substituída por logs locais | Limites honestos e revalidação do saneamento |
| DEC-CI-04 e dependências integrais | liberação local distinta da aresta integral CF015 | A/B/C/E sustentados; D reprovado; F não aceito; CF034 em_revisao | Publicação não autorizada aqui | CF015/zoom e critérios completos; gates CF017/P01/P02 e uso continuam próprios |

Validação estática ≠ execução local ≠ Actions. Compilação/empacotamento ≠ testes.
Pacote local rastreável ≠ reprodução binária ≠ imagem/pacote remoto ≠ liberação
para uso. A existência de pendência remota não é o motivo da reprovação local.
