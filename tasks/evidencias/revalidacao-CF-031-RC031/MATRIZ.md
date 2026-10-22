# Matriz e execuções

Base/candidato e preservação: `initial.json`. Sete probes originais mantêm blob
Git `ed3e087dafa8c3cd46f20c47cff893254c8bc77b`, igual ao de e1f5048; hashes SHA256
também conferidos pelo manifesto histórico548. Antes:4 verdes/3 vermelhos
(`../revisao-CF-031/probes-expanded.log` e saneamento/probes-before.log).
Vermelhos: caixa adulterado, goal.value herdado, snapshots null. Controles já
verdes: recibo/sessão E01 válido, cleanup calendário em focus e visibilitychange,
diagnóstico isolado de Modal. Agora7/7 (`original-probes.log`), sem editar assertions.

| Critério | Prova atual | Resultado |
|---|---|---|
| Livres agregados coerentes | coherence-remediation,9 casos; independent,3 mutações de fonte | Aprovado |
| UNKNOWN/PARTIAL, negativos, acima de M e NA numérico | snapshots normativos consumidos nos138 | Aprovado |
| Reservas e antes/depois: próprios/null/variantes/nominais | reservation-remediation,53 casos | Casos cobertos aprovados; residual específico permanece |
| JSON bruto, metadados, __proto__, duplicatas | independent,7 controles verdes | Aprovado; sem poluição |
| Identidade herdada alternativa | independent,2 assertions vermelhas | RC031-02 residual |
| Complete inválido + operation GET inválido + replay | recovery-remediation,1 caso dentro138 | Preparação mantida; corpos POST idênticos |
| Commit/recovery/replay/reload real | e2e e e2e-reports |12/12 e SQL12; mobile4 incluído |
| Sensibilidade a remoção das proteções | counterproof-results.json e mutation-*.log/diff |2/2 detectadas por AssertionError |
| Cópia restaurada | counterproof-control-restored.log |127/127;209 hashes idênticos |
| Qualidade básica/regressões | checks.json; lint/typecheck/build/unit.log |exit0;6/6 temporais |

As contagens declaradas foram conferidas:138=75 anteriores+9 coerência+53 reserva+1
recuperação.127 exclui11 de tela. A entrega tem12 jornadas e complemento mobile4;
o complemento repete os mesmos quatro cenários, acrescentando visibilidade do950.
Nesta revisão a configuração já inclui essa assertion nas12, portanto não foi
necessário executar outra rodada mobile idêntica. Não houve retry/aumento de timeout.

## Comandos reproduzíveis

Na pasta frontend, redirecionar saídas para **nova** pasta para não sobrescrever:

```powershell
node node_modules/vitest/vitest.mjs run --config src/screens/private/onboarding/vitest.config.mts
node node_modules/vitest/vitest.mjs run --config ../tasks/evidencias/revisao-CF-031/probes.config.mts
node node_modules/vitest/vitest.mjs run --config ../tasks/evidencias/revalidacao-CF-031-RC031/independent.config.mts
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node scripts/test.mjs
node node_modules/next/dist/bin/next build
```

No backend, JAVA_HOME aponta para `target/temurin21/jdk-21.0.12.1+1` preservado,
PATH com esse bin. `CF031_CHECK_REMEDIATION=1`, `CF031_RUN_ORIGINAL_PROBE=0`.
Executado Maven com `-Dtest=OnboardingFrontendPostgresE2E`,
`-Dcf031.config=../tasks/evidencias/revalidacao-CF-031-RC031/integration.config.ts`,
`-Dcf031.evidence=../tasks/evidencias/revalidacao-CF-031-RC031/e2e` e `test`.
Docker/PostgreSQL descartáveis;12 cenários em360/SP,768/UTC,1440/Kiritimati.
`integration-maven.log`, Playwright e SQL sustentam o resultado. Relatório Java
copiado antes de outra execução. Build executado depois de encerrar integração.

`counterproofs.ps1` copiado da entrega para esta pasta: fonte copiado para TEMP,
dependências/fixtures somente lidas via junction; mutações restritas à cópia.
Uma remove reconcileSum dos livres; outra enfraquece legacyReservation. Logs
preservam falhas e controle antes/restaurado. Não é prova de ausência do residual.

Sem falha intermediária de produto nos conjuntos existentes desta rodada.
As duas falhas dos probes novos permanecem registradas; nenhuma assertion alterada
para obter verde. Falhas históricas e a tentativa inicial de parseJson sem política
de números, documentada no saneamento, não foram apagadas nem contadas como sucesso.

## Custo e arquitetura

reconcileSum usa BigInt e uma passagem por componentes:O(n), com custo adicional
proporcional aos dígitos dos agregados. Reservas custam O(r+p+e), considerando todas
as partes/fontes/evidências; Sets evitam deduplicação quadrática. Filtros por dois
tipos continuam O(n); arrays auxiliares usam memória linear. Canonicalização já
existente ordena listas O(n log n), separada da soma. Não há queries, N+1 ou novo
trabalho concorrente neste delta. Validador comum reduz divergência entre inventário
e snapshots, mas exige uma identidade coerente até os consumidores (residual).

Livre de fonte desconhecida permanece UNKNOWN, não saldo menos subtotal; agregação
soma apenas componentes conhecidos e deriva KNOWN/PARTIAL/UNKNOWN. Vazio é KNOWN0.
NOT_APPLICABLE não é parcela financeira. Não se soma indiscriminadamente nominal
incerto de reservas por fonte: isso duplicaria riscos por candidatas. As verificações
usam o próprio recibo, não saldos atuais, e rejeitam sem fabricar resultado corrigido.
