# Execuções da revisão independente

20/10/2026; candidato de produto `89760e6`, sem edição em src/main. JDK21.0.12.1,
Maven Wrapper e Testcontainers/PostgreSQL16-alpine; schema descartável por contexto,
Flyway V1–V16 e Hibernate validate. Email/mercado externos substituídos, regras
financeiras e banco reais. Nenhum fallback para banco externo.

## Resultados

| Execução | Casos | Resultado / interpretação |
|---|---:|---|
| baseline-utc |92|92 passaram; seleção de aplicação, rollback, precisão, reservas, capacidade, migração, CF029 e protocolos |
| independent-concurrency |5|5 erros do observador; não são contraprovas do produto |
| independent-probes-corrected |8|5 concorrências +1 precisão passaram;2 assertions reproduziram RC030-01/02 |
| additional-financial-temporal |10|6 passaram;4 assertions financeiras/HTTP falharam por3 achados, sem erros de ambiente |
| writer-regressions-final |93|93 passaram, incluindo8 probes próprios; CF019/024, política de writers e exclusão |
| mutation-real-reservation-writer |1|Falhou causalmente:1200 reservados em vez de600; sem erro de infraestrutura |
| mutation-restored-control |1|Passou na mesma cópia restaurada |

Consolidação sem somar sobreposições: baseline92 + writer-regressions93 +
additional10 =195 casos;191 passaram,4 assertions falharam por3 achados.
Não é suite geral verde. As demais execuções documentam evolução do observador,
sensibilidade e repetição dirigida, não casos únicos adicionais. Nenhum skip.

### Correção do observador

Na primeira tentativa de `OnboardingReviewConcurrencyTest`, o stubbing atravessou
o proxy de OnboardingOpenings e seu MANDATORY antes de existir transação:
IllegalTransactionStateException, seguida de estado Mockito incompleto.
O observador agora configura o spy alvo via AopTestUtils; **as chamadas do produto
continuam pelo proxy e callRealMethod**. Não se modificou propagação, critério,
regra, timeout ou assertion. Fonte inicial preservado em
`independent-concurrency/observer-initial.java.txt`.

O probe de versão foi escrito para400. A hipótese de wrap mencionada no nome não
ocorreu: Jackson3 lançou JsonNodeException e a resposta foi500; RC030-03 registra
esse fato, sem transformar o observado em expected.

### Interleavings e transações

Sem sleeps; CountDownLatch posiciona o ponto real e pg_blocking_pids observa espera
entre conexões. Future concluído antes de bloquear também é observado para que a
mutação falhe pelo resultado financeiro, não por timeout. Casos finais incluem
os dois vencedores de cancel/complete e delete/complete, duas preparações distintas,
replay concorrente, descarte concorrente, writer real e independência de owners.
Uma falha depois de todas as entidades processadas permite retry idêntico.

### Temporalidade efetiva

A aplicação redefine TimeZone em startup. Por isso `-Duser.timezone=UTC` sozinho
não comprova JVM UTC. OnboardingReviewTemporalTest altera e verifica a zona **após**
o startup e restaura no finally. Em UTC, São Paulo e Kiritimati: data-base09/10 e
prazo30/09 permanecem; completedAt=2026-10-10T02:30:00.123456Z, igual em replay/GET.
Às02:30Z, hojeProduto ainda09/10: base10/10 é recusada em UTC e UTC+14.
Cinco casos passam; não foram repetidas matrizes sem relação com o delta.

### Migração e compatibilidade

Baseline inicializa cadeia completa em schemas novos com validate. O ensaio V15
semeia conta no limite, origem e draft versão3; V16 preserva valores/texto/versão,
não inventa identidade default, rejeita vínculo default de owner diferente e
preparação pendente duplicada, valida Flyway e rerun executa0 migrations.
As migrações V1–V15 não mudaram no intervalo. Novos nulls de principal/custo/
quantidade são exercitados em aberturas; exclusão do grafo concluído e rollback
foram verificadas tanto na seleção original como nas corridas próprias.
Não se certificam dados reais nem adoção CF017/P01/P02.

## Auditoria da evidência entregue

`historical-audit.json` reconta XMLs:504 casos únicos/0 falhas/erros/skips em
verify-corrected;21/21 no restaurado; cada uma das quatro mutações tem1 falha de
assertion/0 erros. Lidos diffs e resultados: frescor removido deixa aceitar stale;
abertura duplicada gera2500 em vez de1300; commit parcial conserva1300 em vez de0;
desbloqueio de fonte nova aceita reserva proibida. Os testes não eram apenas
verificações de resposta HTTP ou erros de compilação.

400 hashes comparados com release-source-and-copy: única diferença é o runner
mutations.ps1, parâmetro Prefix documentado depois da execução; nenhum Java/SQL
diverge. Manifest delivered-source identifica essa versão entregue. Logs de
compilação, pool esgotado, fixture e regressão de queries anteriores permanecem
históricos. Os31 casos HabitFixtureIsolation da execução anterior não integram504.
O relatório não é usado como aceite independente nem como prova de todos os ramos.

## Contraprova nova e preservação

Backend copiado para pasta nova `cf030-copy` na área de visualizações deste chat.
404 arquivos src da cópia/principal tiveram hashes iguais na criação. Depois,
somente na cópia, removeu-se o guard de GoalService.setAllocation. O writer
concorrente comitou600, onboarding comitou outros600; teste exige total600.
Restore em finally, hash de GoalService anterior/final idêntico; controle1/1.
Todos404 arquivos da cópia reconferidos iguais ao manifesto inicial.
A cópia conserva a versão dos probes daquele momento; extensões posteriores dos
probes no principal não são alterações/restaurações de produto.

Após a execução, o runner recebeu somente a exportação de mutation.diff, sem
alteração da mutação ou dos testes. O diff da execução foi preservado também
no pacote. A sintaxe dos dois runners foi validada antes dos commits.

README raiz mantém hash informado;4123 arquivos de .cf22/.cf22r/.cf22s comparados
com o manifesto preexistente, nenhuma diferença. JDK preexistente apenas reutilizado;
hashes dos binários registrados em preservation.json. target não foi limpo; logs e
relatórios próprios copiados por execução; evidências originais não editadas.

## Reprodução

Da raiz, PowerShell, com Docker local disponível:

```powershell
& ./controle-financeiro-backend/src/test/cf030/review-run.ps1 -Name nova-revisao -Tests 'OnboardingReviewConcurrencyTest,OnboardingReviewFinancialTest,OnboardingReviewTemporalTest'
```

Usar nome novo: o runner recusa sobrescrever evidências. Cada execution.json guarda
seleção exata, início/fim, backend, zone e exitCode. Os probes financeiros devem
permanecer vermelhos no candidato até saneamento; não aumentá-los para500 ou
trocar189 por179. Contraprova usa review-mutation.ps1 e recusa caminhos fora da
cópia dedicada; não executar no backend principal.
