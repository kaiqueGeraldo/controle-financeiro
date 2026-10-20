# RC030 — execuções e reprodução

JDK21.0.12.1 preexistente, Maven Wrapper, Testcontainers/PostgreSQL16-alpine.
Schemas descartáveis com Flyway V1–V16 e Hibernate validate; sem banco externo.
Email/cotação são doubles. rc-run.ps1 recusa nomes existentes, não limpa target,
guarda seleção/horários/exitCode/logs/relatórios novos e oculta JWTs sintéticos.
Não houve alteração de timeout, tolerância, expected ou migração.

| Execução | Casos | Resultado e interpretação |
|---|---:|---|
| before-original-four |4|4 falhas/0 erros; três achados confirmados antes de editar produto |
| after-original-four-unmodified |4|0 falhas/1 erro;3 verdes e observador RC02 interrompido pela rejeição antecipada correta |
| corrected-directed |54|1 falha/0 erros; controle novo de ano0001 detectou binding indireto deslocando28→26; assertion preservada |
| corrected-civil-binding |54|54 verdes,0 skips; verify/empacotamento concluído |
| affected-regressions |80|80 verdes,0 skips; verify/empacotamento; consumidores compartilhados/guard/temporalidade |
| mutation-rc030-01 |1|1 assertion falha/0 erros: principal179 em vez de189 |
| mutation-rc030-02 |2|2 assertions falham/0 erros: prepare indevido e ano10000 persistido |
| mutation-rc030-02-binding |5|1 assertion falha/0 erros:0001-01-26 em vez de0001-01-28;4 controles passam |
| mutation-rc030-03 |1|1 assertion falha/0 erros:HTTP500 em vez de400 |
| mutation-restored-control |54|54 verdes,0 skips, na mesma cópia restaurada |

Os relatórios não são somados como casos únicos. As execuções posteriores abaixo
registram o candidato congelado e os consumidores diretamente afetados. Demais
aceites independentes são preservados; não se repetiu a suite inteira por rotina.

Seleção final sem sobreposição:54+80=134 casos distintos, conforme
final-selection.json (identidades classe/método/argumentos). Os54 do controle
restaurado repetem a seleção dirigida e não são casos adicionais.411 fontes
principal/cópia idênticos após restauração, conforme final-restoration.json.
O detalhe por arquivo/mutação está em mutation-restoration.json.

## Comandos

```powershell
& ./controle-financeiro-backend/src/test/cf030/rc-run.ps1 -Name nova-validacao-dirigida -Tests 'OnboardingReviewFinancialTest,OnboardingRc030PaymentTest,OnboardingRc030CivilTest,OnboardingRc030VersionTest' -Verify
& ./controle-financeiro-backend/src/test/cf030/rc-run.ps1 -Name novas-regressoes -Tests 'Cf019CardIntegrationTest,Cf024ConcurrencyCacheIntegrationTest,OnboardingReviewConcurrencyTest,OnboardingApplicationTest,OnboardingBoundaryTest,OnboardingReviewTemporalTest,OnboardingPrecisionProtocolTest' -Verify
```

Para repetir a seleção vermelha original, usar o arquivo fonte original do commit
251d6c7 em cópia dedicada com o produto daquela base; o texto integral e seus hashes
estão neste pacote. Não sobrescrever o candidato nem restaurar o checkout atual.
O execution.json da primeira execução tem os quatro seletores literais.

## Contraprovas

rc-mutations.ps1 exige cópia dedicada cf030rc-copy-* na raiz permitida de
visualizações, nunca o backend principal. Reintroduz somente os arquivos daquele
achado a partir de251d6c7, preservando os guards existentes. Gera diff efetivo,
exige falha de assertion sem erros de ambiente/compilação e restaura bytes em
finally com SHA256. A regressão adicional de binding tem contraprova separada.

```powershell
$label='revalidacao-'+(Get-Date -Format yyyyMMdd-HHmmss)
& ./controle-financeiro-backend/src/test/cf030/rc-mutations.ps1 -Prefix $label -Backend 'C:\Users\Aluga.com\.codex\visualizations\2026\10\20\01a1570b-cd5c-77c0-b013-cf54480e8e48\cf030rc-copy-20261020-01'
```

frozen-source-and-copy-sha256.json registra411 arquivos idênticos na criação.
Runners usam o JDK do checkout principal, sem copiar/remover runtimes. Em outra
máquina adaptar somente as localizações de JDK/raiz dedicada, preservando seletores,
oracles, tipo de banco e limites. A cópia executada e os snapshots antes de cada
mutação ficam preservados; não é necessário excluir evidências para repetir.
