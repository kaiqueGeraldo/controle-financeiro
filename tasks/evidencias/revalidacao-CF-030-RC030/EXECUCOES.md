# Execuções independentes — 21/10/2026

Candidato c13aecd, base 251d6c7. JDK Temurin 21.0.12.1+1 existente,
Maven Wrapper, Testcontainers/PostgreSQL 16-alpine, schemas descartáveis,
Flyway V1–V16 e Hibernate validate. Email/mercado externos substituídos;
persistência e serviços financeiros reais. Sem banco externo ou ORM update.

## Seleções no candidato

| Execução | Casos | Resultado |
|---|---:|---|
| directed | 76 | 55 passaram, 21 erros de fixture própria; não são falhas do produto |
| directed-valid-fixture | 76 | 76 passaram; verify e empacotamento concluídos |
| affected-regressions | 80 | 80 passaram; verify e empacotamento concluídos |

Final: **156 casos distintos, 156 aprovados, zero falhas/erros/skips**.
cases.json contém as identidades e final-selection.json a consolidação sem
somar repetições. Os 76 são 54 controles entregues e 22 provas independentes
novas (21 combinações civis e uma rejeição HTTP). As 80 regressões incluem
CF019/024, concorrência real, aplicação, fronteira, temporalidade e precisão.

### Erro e correção da fixture independente

O primeiro OnboardingRevalidationCivilTest gravava fechamento e vencimento iguais,
contrariando ck_invoice_cycle_dates, constraint V4 que exige vencimento posterior.
As 21 combinações foram interrompidas na inserção; os outros 55 casos passaram.
Fonte inicial e relatórios preservados em directed/observer-initial.java.txt.
Corrigiu-se somente a fixture para pares válidos de dias consecutivos (no limite
superior, 30/31 de dezembro). Comparações continuam exatas, sem tolerância,
sem remover a constraint, sem modificar produto ou aumentar timeout. Não confundir
essa correção com o observador do saneamento, avaliado separadamente em ANALISE.md.

### Comandos reproduzíveis

Da raiz, PowerShell, Docker disponível; nomes novos obrigatórios para preservar
evidências. O runner usa o JDK existente e não executa clean.

```powershell
& ./controle-financeiro-backend/src/test/cf030/revalidation-run.ps1 -Name nova-dirigida -Tests 'OnboardingReviewFinancialTest,OnboardingRc030PaymentTest,OnboardingRc030CivilTest,OnboardingRc030VersionTest,OnboardingRevalidationCivilTest' -Verify
& ./controle-financeiro-backend/src/test/cf030/revalidation-run.ps1 -Name novas-regressoes -Tests 'Cf019CardIntegrationTest,Cf024ConcurrencyCacheIntegrationTest,OnboardingReviewConcurrencyTest,OnboardingApplicationTest,OnboardingBoundaryTest,OnboardingReviewTemporalTest,OnboardingPrecisionProtocolTest' -Verify
```

## Auditoria do pacote anterior

historical-audit.json reconta 134 identidades únicas (54+80), todas verdes,
quatro experimentos mutantes e controle restaurado 54/54. Mutações anteriores:
RC01 uma falha; RC02 duas; binding uma em cinco; RC03 uma; zero erros.
Antes do saneamento, quatro falhas; depois sem adaptar o observador, três
aprovadas e um erro DraftProblem na rejeição antecipada. A execução intermediária
de binding registra 0001-01-26 em vez de 0001-01-28, preservada.

Os 411 fontes do manifesto congelado coincidem com o candidato. Dos 83 arquivos
do manifesto independente anterior, somente o observador declarado difere; os
outros 82 estão intactos. Seu original preservado é idêntico ao blob Git da base,
não apenas uma cópia nomeada como original. Relatórios históricos não contam
como testes independentes novos nem como aceite automático.

## Contraprovas desta revalidação

Nova cópia dedicada cf030-revalidation-copy na área de visualizações deste chat,
com 413 arquivos src conferidos por hash. Runners preservam snapshots/diff da
mutação, restauram bytes em finally e recusam caminho diferente da cópia exata.
Reintroduzem somente os arquivos relevantes da base 251d6c7; o candidato principal
não é alterado. O controle posterior usa os mesmos 76 casos dirigidos.

```powershell
& ./controle-financeiro-backend/src/test/cf030/revalidation-mutations.ps1 -Backend 'C:\Users\Aluga.com\.codex\visualizations\2026\10\20\01a1598d-84a2-7cb3-8777-089eb30b441d\cf030-revalidation-copy' -Prefix nova-contraprova
```

Consultar results.json, independent-restoration.json e os diretórios independent-*
para resultados efetivos, diffs e hashes. A seleção de binding mutante usa a nova
prova independente de 21 combinações; as outras usam as reproduções originais,
incluindo o observador adaptado para a data inválida. Falha por assertion e zero
erros são exigidos; falha de ambiente/compilação não é considerada contraprova.

Resultado final: RC01 1/1 falha; RC02 2/2 falhas (incluindo o observador adaptado);
binding 6/21 falhas (datas antigas, nos três fusos); RC03 1/1 falha. Todas por
assertion, zero erros. Controle restaurado76/76, zero skips. final-restoration.json
confere413 arquivos da cópia sem diferenças e produto principal sem alterações.

## Limites e preservação

As matrizes gerais de writers/reservas/V16 já aceitas são reaproveitadas; o delta
não muda migrações, locks ou identidade do recibo. Não se repete a auditoria geral
nem se certificam SLA, todos os interleavings, UI ou dados reais. Compatibilidade
de datas armazenadas não equivale a reparar valores históricos deslocados.

preservation.json registra README com hash informado, 4123 arquivos dos runtimes
sem diferenças e 169 evidências anteriores intactas. JDK reutilizado; target
contém saídas dos builds, sem limpeza geral. Nenhum push, merge ou deploy.
