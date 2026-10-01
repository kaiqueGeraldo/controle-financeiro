# CF-027 — fronteira backend de intenção/recibo

Entrega local em 01/10/2026, **em_revisao**, aguardando revisão independente. Base `40e07ef`, liberação delimitada no [parecer independente](../revalidacao-RV24-01-RV24-02/README.md). Modelo desta sessão: GPT-6/Codex, sem troca de modelo nem subagentes. Sem push, deploy, banco real ou email real. CF-028 não iniciada.

O [mapa anterior à extração](MAPA.md) identifica os três consumidores e as responsabilidades reais. O lote introduz `FinancialIntents` (replay/complete/recover, owner UUID), separa `IntentFingerprint` e encapsula lock/JPA/JSON/Clock em `PostgresFinancialIntents`. Recibo/repositório internos e DTO de recuperação passam a `domain.intent`. Os movimentos removem a dependência do protocolo de investimentos no domínio de transações; não reorganizam outros serviços.

O contrato de aplicação documenta ordem e transação, enquanto o adaptador mantém as anotações Spring executáveis. Não se adicionou service intermediário, nova transação, retry, cache, migração ou dependência Maven. DTOs financeiros, normalização de defaults, lógica monetária e posição das chamadas dos consumidores são idênticos. O [verificador](verify-evidence.cjs) compara essas garantias com o Git, além dos hashes da cópia efetivamente testada. Estado/código testado em [checkpoint.json](checkpoint.json); commits desta entrega no Git local.

## Critério → prova → resultado

| Garantia / oracle | Prova | Resultado |
|---|---|---|
| Consumidores não acessam adaptador, entidade/repositório de recibo ou SQL/namespace do protocolo | FinancialIntentArchitectureTest lê constant pool dos `.class`, inclusive descriptors/generics/calls; aplicação pública não referencia entidades financeiras, ORM, Spring ou JSON diretamente | Dois testes verdes; vermelho causal na base e mutação de acesso direto detectados |
| Canonicalização DEC-10 preservada | IntentFingerprintTest: SHA-256 literal calculado separadamente para vazio, null, string vazia, escala/notação científica, fronteiras de campos e UTF16/UTF8 | Quatro testes verdes; método extraído também comparado literalmente com base |
| MANDATORY inclusive chave ausente; lock/recibo na transação envolvente | FinancialIntentsIntegrationTest usa proxy real, TransactionTemplate, pg_locks e SQL após rollback/commit | Quatro testes verdes; mutação REQUIRES_NEW detectada |
| Recibo anterior continua legível e isolado | Snapshot literal anterior inserido por SQL, timestamp com microssegundos, replay de DTO, recuperação, owner/kind/fingerprint incompatíveis; result_json permanece byte a byte | Verde; recuperação sem owner detectada por mutação |
| Contratos HTTP e schema | HTTP/controller/segurança, Flyway vazio/legado/incremental + Hibernate validate; comparação de entity/query/DTO salvo package e nenhum diff em resources | Verdes; URLs/campos/status/constraints intactos |
| Uma intenção, um efeito; conflito e concorrência reais | CF-024 final30: replay HTTP, duas conexões/PIDs/pg_blocking_pids, fontes independentes, duas vendas, transferências opostas, deadlock/timeout409 | 30/30, zero skips |
| Efeito + recibo + AFTER_COMMIT | CF-024 trigger falha no recibo após writes; SQL restaura saldo1000/posição10/histórico vazio/zero recibos/cache anterior; mesma intenção depois funciona | Verde, sem afrouxar assertions |
| Consumidores e isolamento | CF-01824, CF-02011, comandos5, correções4, boundaries2, temporais2, isolamento80 e HTTP/segurança7 | Verdes; seleções exatas abaixo |
| Exclusão preserva nova entidade de recibo e outro owner | Seis contratos RV24-02 + três probes independentes publicados, somente na cópia, com snapshots de29 tabelas/rollback/email-afterCommit/writer bloqueado | 9/9, sem reabrir ou alterar RV24-02 |
| Browser → Next/BFF → Spring → PostgreSQL → reload | Seis jornadas EXPENSE/BUY × lost/before/unavailable; harness independente anterior, com espera por conteúdo final carregado | 6/6; SQL contas950/600, posição14, duas intenções legítimas A/dois recibos, B/zero; replay exato sem efeito extra |

**Contagens sobrepostas não se somam.** Gate dirigido42 está contido no consolidado203; o consolidado inclui um runner Java que executa seis Playwright. O número203 não inclui os três vermelhos de mutação ou o vermelho arquitetural anterior.

## Execuções reproduzíveis e falhas preservadas

Windows/PowerShell, Temurin21.0.12.1+1 já existente, Maven wrapper/POM intactos (Spring Boot4.0.2), PostgreSQL16-alpine via Testcontainers com database/schema sintéticos e guardas contra URL externa. Docker local; email/mercado são doubles. Browser Chromium instalado no frontend, viewport1440×900, timezone America/Sao_Paulo, relógio15/01/2027. Nenhuma instalação/upgrade. IDs aleatórios isolam fixtures; namespace do browser `rv24-658f4783`.

Na raiz, configurar o runtime:

```powershell
$env:JAVA_HOME=(Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH=$env:JAVA_HOME+'/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;'+$env:PATH
```

1. [architecture-before.log](architecture-before.log) e [diagnóstico](architecture-before-diagnostic.log): tentativas no sandbox pararam em AccessDeniedException ao fechar JAR do cache `.m2`; não são falha causal do teste. Execução normal com acesso ao cache produziu [architecture-before-causal.log](architecture-before-causal.log): `-Dtest=FinancialIntentArchitectureTest#onlyIntentInternalsMayReferenceReceiptPersistenceOrConcreteAdapter test`, 1 failure/0 errors/0 skips, referências proibidas dos consumidores antigos.
2. [directed.log](directed.log): erro do executor com `clean`, detalhado abaixo. Nenhum teste executou nessa tentativa. [directed-after-runtime-restore.log](directed-after-runtime-restore.log): wrapper com `-f controle-financeiro-backend/pom.xml --batch-mode -Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository -Dtest=FinancialIntentArchitectureTest,IntentFingerprintTest,FinancialIntentsIntegrationTest,Cf024ConcurrencyCacheIntegrationTest,TransactionServiceTemporalTest,InvestmentServiceTemporalTest test`;42/42 e exit0.
3. `& tasks/evidencias/CF-027/run-mutations.ps1 -RunName <nome-novo>` cria cópia isolada e combina três mutações independentes. [Resultado](mutations/result.json) e [log](mutations/backend-red.log):3 failures/0 errors/0 skips, uma por regra. Fontes da cópia restaurados em finally e hashes compartilhados conferidos. Classes compiladas dessa cópia representam as mutações; não servem de gate verde.
4. `& tasks/evidencias/CF-027/run-validation.ps1 -RunName <nome-novo>` cria cópia isolada e executa **verify**, sem clean. [Seleção literal](validation/selection.txt), [resultado por suíte](validation/result.json), [log](validation/backend-verify.log) e [caminho da cópia](validation/copy-path.txt):203/203, exit0, JAR gerado. O teste de exclusão só muda destino de evidência na cópia; os três probes da revisão anterior são copiados sem mudar assertions. O runner de browser só ganha frontend/config externos explícitos.
5. Playwright usa [spec efetivo](validation/effective-browser.spec.ts) e [config](validation/effective-browser.config.ts) externos, com junction para node_modules instalado. Frontend compartilhado não foi editado. [Log6/6](validation/browser/playwright.log), [SQL completo](validation/browser/persisted.txt), [oracles](validation/browser/postgres-oracles.txt) e seis PNGs finais em `validation/browser/`. Todas as capturas inspecionadas: três extratos mostram duas criações legítimas25 e subtotal50; três carteiras mostram ativo RV24 avaliado1400. Não são capturas de loading, nem aceite visual global/mobile/zoom.
6. `node tasks/evidencias/CF-027/verify-evidence.cjs --check` confere checkpoint, produto testado, comparação com base, scopes preservados, sanitização e gates. Sanitização registrada em [sanitization.json](sanitization.json); assertions/dinheiro/status não são mascarados. Logs podem conter ERROR de falhas deliberadas (trigger/deadlock/email), comprovadas pelas assertions de rollback.

## Incidente de preservação de artefatos locais

O executor incluiu indevidamente `clean` no passo2. Maven tentou apagar todo `controle-financeiro-backend/target` e parou em `temurin21/.../bin/java.dll` em uso. Isso removeu artefatos gerados e atingiu diretórios de cópias de verificações locais. Foi comunicado ao usuário imediatamente após constatação. Não houve diff em fontes/evidências históricas versionadas; README raiz conservou SHA256 `6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca` e ficou fora de todos os commits.

Runtime restaurado via ZIP local `target/temurin21-jdk.zip`. [Script de reconstrução](restore-historical-copies.ps1) refez os fontes nos dois caminhos explicitamente publicados pela revisão, a partir de5d0649a e probes preservados, e marcou cada diretório `CF027-RECONSTRUCTED.txt`. A primeira tentativa de reconstrução não reproduziu bytes de pom.xml; o uso do fonte compartilhado intacto e variantes de BOM/line endings resolveu isso. [Resultado](historical-reconstruction.json):232/234 hashes de produto iguais ao checkpoint antigo; InvestmentService/TransactionService reconstituídos do Git não reproduzem os bytes locais antigos (normalização de line endings). Não se afirma recuperação exata desses dois arquivos ou de edits temporários de harness.

Não havia inventário prévio de todos os ignorados em target: outputs/classes/logs temporários e cópias adicionais não têm restauração integral comprovada. Evidências publicadas antigas permanecem intactas e guardam a proveniência original. As cópias reconstruídas não são os artefatos originais e não podem receber crédito por execuções antigas. Incidente é limitação da entrega, não sucesso de preservação integral. Não houve nova tentativa de clean.

## Pendências e limites

CF-027 aguarda revisão independente do diff e dos aceites; os testes desta sessão são evidência do executor. RV24-02 continua concluída. RV24-01 continua aberta por **RVR24-01/RVR24-02**; **H-RV24-01 ECONNRESET inconclusivo** conserva a falha original e sua investigação. O verde6/6 desta sessão não fecha a causa histórica. RVA-03, RJ-022-01/H24-01, revisão CF-026, RV17-01/02, adoção real, zoom200% e publicação permanecem na origem. Nada de frontend/hook/parser/reconciliação foi corrigido.

Limites técnicos no [mapa](MAPA.md): interface/generics não impõem a sequência pelo sistema de tipos; pacote interno é protegido por teste, não classloader; DTO de transporte mantém JsonNode; financial_commands, pagamentos e acoplamentos financeiros existentes permanecem. UserService mantém cleanup SQL por schema. Não há benchmark, garantia universal contra deadlock, restart/múltiplas instâncias, corte TCP físico ou cache distribuído. A retirada desses limites exige trabalho próprio; não é motivo para microsserviços ou CF-028 neste lote.
