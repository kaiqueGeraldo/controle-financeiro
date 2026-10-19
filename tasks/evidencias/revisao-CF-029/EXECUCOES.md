# Execuções independentes — 19/10/2026

Produto em5bac46e, sem deltas locais de src/main. JDK21 existente, Maven wrapper,
PostgreSQL16-alpine Testcontainers. Apenas fixtures sintéticas; Email/MarketData
são doubles externos. Sem browser/BFF, rede financeira, produção ou deploy.
MockMvc usa autenticação/controller/serialização/serviço reais; não é teste de
socket HTTP nem certificação de interface. Migrações Flyway, Hibernate validate.

Matriz escrita antes de executar testes: [MATRIZ.md](MATRIZ.md).

| Pasta | Resultado | Interpretação |
|---|---|---|
| baseline-utc |53/53, exit0 |41 validador,11 integração,1 upgrade; parâmetro UTC, aplicação redefine defaultSP |
| independent-sp |22:20 passam,2 falham,0 erros |11 controles herdados +11 probes; RC029-01 confirmado e erro de fixture de rollback |
| rollback-contracts-sp |4/4, exit0 |Rollback com fixture corretamente capturada e3 bordas financeiras novas |
| effective-kiritimati |12/12, exit0 |11 controles herdados com default+14 confirmado após startup +1 registro do fuso |
| mutation-version |1 falha,0 erros, exit1 |Dois200 em vez de200/409 após retirar guarda de versão |
| mutation-owner |1 falha,0 erros, exit1 |200 em vez de404 ao retirar owner do SQL de referências |
| mutation-precision |1 falha,0 erros, exit1 |999999999999.99999999 vira1000000000000.00000000 via double |
| restored-controls |3/3, exit0 |Os três controles passam após restauração da cópia isolada |

Controle da cópia restaurada: `restored-controls/`, três testes correspondentes
às mutações aprovados; resultado no execution.json. Não somar reexecuções
ou casos herdados como cenários inéditos. O teste que reproduz RC029-01 permanece
vermelho deliberadamente; nenhum ajuste de produto foi feito.

## Provas de concorrência e persistência

Quatro disputas forçadas: SAVE×DISCARD, DISCARD×SAVE, PAUSE×SAVE e RESUME×SAVE.
A primeira transação grava e mantém o lock; a segunda conexão espera; o observador
exige pg_blocking_pids apontando para o PID vencedor antes de liberar o commit.
Resultado409, versão2 e snapshot vencedor conferidos por GET/JDBC; versão antiga
continua409 e RESUME explícito com versão atual funciona. Sem sleeps/retries.

Duas ordens de save/exclusão: exclusão primeiro impede save com401; save primeiro
é seguido pela exclusão completa. Nenhuma sessão órfã, outro usuário preservado.
Rollback depois de executar todas as exclusões repõe usuário, sessão e registro
protegido, com comparação integral do estado. Falha inicial do probe foi capturar
mode antes de concluir a fixture; a captura foi movida para antes da transação,
exigindo COMPLEMENT e conservando igualdade integral. Não houve mudança de expected
para acomodar defeito de produto. Log inicial preservado.

Comparação antes/depois de todas as tabelas do schema, exceto users/sessão/Flyway,
durante SAVE/PAUSE/RESUME/SAVE/DISCARD: inclui accounts, transactions, investments,
invest_transactions, investment_valuations/corrections, goals/goal_allocations,
credit_cards, invoices, card_transactions, card_payments, card_refunds,
card_opening_batches, financial_commands/intents e registros protegidos de reserva.
Nenhum efeito financeiro. Payload relido por JdbcTemplate fora da transação de
escrita; remoção por snapshot integral e decimal máximo exato confirmados.

Flyway: contexto vazio V1–15+Hibernate validate, upgrade14 preservando conta no
teto, constraints e reexecução sem reaplicar migrations. Nenhum ORM create-drop
nesses contextos novos. Só V15 consta no delta de migrações.

## Reprodução

Da raiz, usar Name novo (scripts recusam sobrescrita):

```powershell
& ./controle-financeiro-backend/src/test/cf029/review-run.ps1 -Name nova-baseline
& ./controle-financeiro-backend/src/test/cf029/review-run.ps1 -Name nova-revisao -Tests OnboardingIndependentReviewTest -Zone America/Sao_Paulo
& ./controle-financeiro-backend/src/test/cf029/review-run.ps1 -Name novo-contrato -Tests OnboardingIndependentContractTest
& ./controle-financeiro-backend/src/test/cf029/review-run.ps1 -Name novo-fuso -Tests OnboardingForeignZoneReviewTest -Zone Pacific/Kiritimati
```

A seleção nova-revisao deve permanecer vermelha somente por RC029-01 enquanto
não houver saneamento. Scripts registram comando/seleção, backend, fuso solicitado,
horários, exit e relatórios. Logs de MockMvc redigem apenas JWTs sintéticos, sem
retirar payloads/oracles/erros. Nenhuma credencial real utilizada.

Contraprovas: git archive5bac46e do backend exportado para pasta nova cf029-review
no diretório de visualizações desta conversa. `review-mutations.ps1 -Backend <cópia>`
altera um fonte por vez e restaura bytes em finally; mutations.json registra hashes
antes/depois iguais3/3. A cópia exportada usa EOL do Git, diferente do checkout;
comparar hashes dentro da mesma cópia. Original permaneceu sem diff de produto.
Não reutilizar nomes/pastas de evidências existentes ao repetir o script.

## Ambiente e limites

Preflight Docker no sandbox retornou “permission denied ... dockerDesktopLinuxEngine”.
Acesso ampliado aprovado automaticamente permitiu Docker29.6.2. Não houve troca
para banco real, retry de teste por erro Docker nem limpeza geral. Avisos de
Mockito/agent dinâmico foram preservados. Lock timeout nos logs é cenário esperado
do teste contendedOwner, validado como409 e sem gravação.

Timestamps de+14 podem indicar20/10; data de revisão em São Paulo é19/10/2026.
A configuração antiga de startup redefine defaultSP, portanto as rodadas históricas
53SP/53+14 não provam sozinhas isolamento do fuso; o novo controle fecha essa lacuna
no recorte de integração executado. Não houve modificação da configuração de produto.

Não foram reexecutados todos os124 casos de consumidores da seleção histórica176:
revisados seus deltas/relatórios, com nova execução dos caminhos de autenticação,
referências e exclusão afetados via os probes de onboarding. Sem benchmark, teste
de grande inventário real, todas as combinações de estado/recurso ou finalização.
Esses limites não foram apresentados como defeitos provados ou aceite de produção.
