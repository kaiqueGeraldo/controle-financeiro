# Execuções e contraprova — 19/10/2026

Produto em aa88ecc, intervalo eb70a4b..aa88ecc. Runner próprio, saída nova, JDK21
existente e Maven wrapper; PostgreSQL16-alpine Testcontainers, Flyway e Hibernate
validate. E-mail/cotações são os doubles externos herdados. Nenhum banco real.

| Rodada desta revisão | Resultado | O que demonstra |
|---|---|---|
| original-and-directed |19/19,0 erros/skips |Probe original intacto e18 testes dirigidos do saneamento |
| independent-probes |3/3,0 erros/skips |Payload literal com reserva/ASSIGN mistos, IDs/lotes1/50 e GET após exclusão de referência |
| rule-removed |13 casos,7 falhas,0 erros/skips |Original+6 NUMERIC detectam falta da regra;6 MONETARY continuam passando |
| restored-rule |13/13,0 erros/skips |Mesma seleção após restauração byte a byte da cópia |

Não são48 cenários distintos: a seleção13 é subconjunto dos19 e foi repetida em
mutação/restauração. Não se usou soma de contagens como fundamento de aceite.
Os novos probes possuem expected literal independente; herdaram somente fixtures
e utilitários de transporte/observação. Método revalidation* seleciona apenas os3
casos novos, sem executar novamente todos os métodos herdados.

## Histórico conferido, não apresentado como execução nova

XMLs do saneamento confirmam66 controles originais (41 validador+22 revisão+3
contratos) e18 novos, total84. directed-regressions teve83 aprovados e uma falha
do observador de overloads; query-controls-corrected repetiu18, todos aprovados.
O mutant histórico13 teve7 falhas causais, e o controle restaurado13 passou.
original-before1 falhou e original-after1 passou. Sobreposições/nome de cada caso
foram inventariados em historical-inventory.json.

Rodadas históricas ocorreram na árvore de trabalho sobre eb70a4b; execution.base
é o HEAD coordenador, não prova de todos os bytes testados. Manifesto de368 fontes
do saneamento foi comparado com o checkout do candidato: todos iguais.49 arquivos
de evidência do saneamento,57 da revisão anterior e5 fontes/scripts independentes
também conferidos. A cópia histórica tinha overlays explicitamente registrados;
a cópia desta revisão foi exportada diretamente de aa88ecc, sem overlays de produto.

A falha inicial de query-count esperado1/observado2 e o bytecode da delegação
permanecem nos artefatos históricos. Nenhuma falha de produto ou infraestrutura
inesperada ocorreu nas rodadas novas. As sete falhas deliberadas foram examinadas
por assertion (issue ausente), não apenas exit1. Não houve retries ou timeout maior.

## Comandos

Da raiz, comandos executados, nomes novos e sem sobrescrita:

```powershell
& ./controle-financeiro-backend/src/test/cf029/revalidation-run.ps1 -Name original-and-directed -Tests 'OnboardingIndependentReviewTest#numericGoalAllocationIsPersistibleButMustCarryAnIssue,OnboardingReservationIssueTest#reservation*' -Zone America/Sao_Paulo
& ./controle-financeiro-backend/src/test/cf029/revalidation-run.ps1 -Name independent-probes -Tests 'OnboardingGoalRevalidationTest#revalidation*' -Zone America/Sao_Paulo
& ./controle-financeiro-backend/src/test/cf029/revalidation-mutation.ps1 -Workspace 'C:/Users/Aluga.com/.codex/visualizations/2026/10/19/01a15407-2487-76e2-8408-6b71244ade02/cf029-revalidation'
```

Para reexecutar, usar novos Name e pasta de evidências própria para a contraprova;
scripts recusam sobrescrita. revalidation-mutation exporta aa88ecc e retira somente
a chamada reservationGoalIssues em DraftReferences. finally restaura os bytes;
mutation.json registra hashes iguais antes/depois. O teste restaurado recompila
e passa. mutation.diff conserva o delta deliberado. Runtime novo preservado.

Cada execução contém seleção/backend/horários/exit, log e XML. O candidate no
runner identifica o código de produto examinado; rule-removed explicitamente o
modifica apenas na cópia. JWTs sintéticos são redigidos; assertions e payloads
sintéticos permanecem. Revisão não envia mensagens/e-mails reais.

## Limites

MockMvc integra autenticação/controller/serviço/serialização e PostgreSQL real
descartável; não certifica socket HTTP, BFF/browser, produção ou finalização.
JDBC e novo GET/token observam commits por contexto separado. Observador conta
overloads reais do template e parâmetros, não SQL total ou latência de produção.
Sem repetição da matriz temporal/migrações/conflitos integral: nenhum delta nessas
áreas, aceites independentes anteriores reaproveitados. A inicialização dos novos
contextos ainda valida o schema com Flyway/Hibernate. Ver ANALISE.md para GET e
para a distinção entre reutilizar aceites e aprovar funcionalidades futuras.
