# CF034 — matriz do alcance autorizado

Decisão [DEC-CI-04](../../../docs/sdd/decisoes/004-liberacao-local-CF-034.md),
PROP-CF034-01/A. Entrega local sujeita a revisão independente. Os quatro
checkboxes de aceite integral do arquivo canônico não são autoaprovados.

| Critério canônico | Entrega local autorizada | Verificação necessária / evidência | Dependência remota | Outros gates preservados |
|---|---|---|---|---|
| Lint e tipagem progressivos | Comandos canônicos ESLint e tsc separados; warnings reprovam | result.json e logs novos; erro de lint deve interromper sequência | Node/Linux, Actions e nomes de checks reais | Sem liberação de produto |
| Testes frontend |18 execuções temporais em3 fusos; Vitest inclui componentes e onboarding antes fora da descoberta | Totais positivos e zero falhas/erros/skips; relatório da própria execução | Executar os mesmos comandos no runner | Não cobre zoom200% |
| Testes backend / PostgreSQL |94 classes obrigatórias nomeadas; PostgreSQL16 Testcontainers sem fallback real; schema por contexto | Surefire novo por execução; relatório de cada classe; zero falhas/erros/skips; verify sem skipTests | Docker/runner Linux e isolamento de jobs | CF017 operacional não autorizada; restore apenas sintético |
| E2E integrado | Jornadas CF032 A/B/G/H/K/L: browser, Next BFF, Spring e PostgreSQL reais | Seis casos sem flaky/skips; relatório Java e Playwright, SQL/reload; readiness observável | Executar mesma seleção em Actions | Demais jornadas e15 harnesses legados na matriz ampliada, sem aprovação implícita; nenhum zoom nativo |
| Smoke e matriz ampliada | Separação declarada em suites.mjs; expanded opt-in depende de required | Revisar se todas garantias obrigatórias têm representante corrente; seleção e relatório por execução | Triggers, needs/if, timeout e matriz ampliada completos não certificados localmente | Não dispensa falha de regra obrigatória nem aprova teste histórico não executado |
| Detecção causal | Contraprovas apenas em exportações descartáveis; saída não zero e restauração SHA256 | Lint e regra de data devem bloquear backend/E2E/pacote; pacote adulterado deve ser recusado; logs preservados | Condições do Actions e bloqueio de integração por proteção remota | Nenhuma mutação publicada ou aplicada ao checkout principal |
| Build / empacotamento | Next build e Maven verify distintos; JAR só elegível após gates; SHA conferido contra recibo do build | Manifesto vincula commit, árvore relevante, lockfile/POM, comandos, resultados e hash do JAR desta execução | Upload e identidade do pacote remoto pendentes | Dockerfile histórico não foi usado nem aprovado; imagem/publicação para uso/deploy pendentes |
| Cache, falhas e recursos | Cache só dependências; recibos invalidados antes dos gates; coleta sanitizada por allowlist; processos sob harness | Falhas anteriores mantidas fora do checkout, sem clean; verificar término de recursos próprios | Permissões contents:read, coleta always e upload apenas em sucesso exigem ensaio remoto | Sem produção, secrets reais, notificações reais ou writers liberados |
| Rastreabilidade histórica |67 caminhos auditados por bytes e objetos Git; manifests antigos intactos | historical-hashes.json mantém SHA original/observado/blob e limite das57 representações não reconstruídas | Não depende de CI para comparar os objetos existentes | Relatórios antigos não são testes do pacote novo |
| Aceite integral | Não concedido; CF034 termina em_revisao no recorte local | Parecer de revisor independente e resolução dos critérios pendentes | Execução efetiva em CI e pacote remoto ainda necessários | CF010/015 em_revisao; zoom200% sem validação; CF017/P01/P02 condicionadas; sucessoras sem liberação |

Trade-off: o runner compartilhado reduz divergência entre comandos locais e CI,
mas condições/permissões de Actions continuam fora da prova local. Schemas por
contexto custam DDL e espaço temporário proporcionais ao número de contextos,
evitando interferência de create-drop; o container descarta esse estado ao fim.
A seleção smoke é revisão de cobertura pendente, não autorização de remover
garantias. Ver [seleção e limites](SELECAO-E-LIMITES.md).

## Evidência produzida na rodada 11

| Critérios acima | Prova da própria execução / resultado |
|---|---|
| Lint, tipos, comandos e exits |[result.json](runs/required-11/result.json), sequência completa exit0 |
| Temporal / componentes |18 testes em3 fusos e [620 componentes](runs/required-11/components-summary.json), zero falhas/skips |
| Backend / PostgreSQL |[889 testes](runs/required-11/surefire-summary.json), [94 classes exigidas](runs/required-11/backend-selection.json), zero falhas/erros/skips |
| E2E real |[Seis jornadas aprovadas](runs/required-11/browser-summary.json), [ambiente e migrações](runs/required-11/browser-environment.json), [hashes das observações SQL](runs/required-11/browser-observations.json) |
| Causalidade / bloqueio |[Lint](runs/negative-lint/counterproof.json), [data](runs/negative-date/counterproof.json), [JAR adulterado](runs/negative-package/counterproof.json): exit1 sem aprovação posterior; fonte/artefato restaurados |
| Controles após restauração |[Lint +18 temporais](runs/restored-control/control.json) e [pacote](runs/restored-package/result.json), exit0; não são nova suíte remota |
| Pacote / fonte / dependências |[Manifesto](runs/required-11/package-manifest.json), [810 inputs e SHA do JAR](package-trace.json), candidato a5ad7a6 |
| Diagnóstico / preservação / recursos |[Coleta testada](diagnosis-check.json), [430 arquivos históricos +67 entradas](preservation.json), [recursos encerrados](resources-final.json) |
| Hashes históricos |[Comparações completas](historical-hashes.json),10 transformações comprovadas e57 representações originais não reconstruídas |
| CI remota e aceite integral |Não executados/concedidos; revisão independente, matriz ampliada, imagem/pacote remoto, zoom e adoção conservam pendências |
