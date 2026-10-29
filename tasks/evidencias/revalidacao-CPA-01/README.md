# Revalidação independente CPA-01/P2 — 28/10/2026

**Parecer da consolidação: C mantido, agora por CPA-01/R1/P2, agregação de status
do required. A incompatibilidade original de seleção foi encerrada no alcance
examinado; cobertura preservada.** Não houve correção de implementação nesta revisão.

Base `434e293f76c3b6ff345fe03f2091149291316aac`; candidato
`193916a1778f1322f5368f66d30a83286766b147`, branch
`codex/saneamento-cpa01-selecao-testes`. HEAD e ancestralidade exatos, 43 arquivos
no diff recebido, dos quais seis de implementação/testes/workflow. Entrada apenas
` M README.md`, index vazio. Main remota reconferida por fetch somente de sua
referência: `fb986456a37a48afcafef204f165d15354294d26`, também merge-base, sem
divergência, 53 commits exclusivos no candidato recebido. Main local272001f mantida.

## Decisões separadas

| Decisão | Resultado independente | Alcance |
|---|---|---|
| A. CPA-01 | **Seleção original encerrada; CPA-01 continua aberto apenas pelo resíduo R1/P2** | O teste Windows sai da seleção Linux e continua obrigatório no job Windows. Required pode ser skipped por dependência, sem reprovação explícita do check agregado |
| B. Cobertura | **Preservada** | Linux 100/115 + Windows 1 = união 101/116, por identidade e sem duplicações;15 históricos preservados |
| C. Workflows | Execução Windows e barreira de pacote sustentadas estaticamente; **agregação required insuficiente** | Eventos previstos alcançam Windows; não há continue-on-error. Falha/skip de Windows impede pacote, mas propaga skip ao required. Actions e regras remotas não foram validados |
| D. Consolidação | **Parecer C mantido por impedimento concreto diferente do original** | Não há liberação irrestrita para publicação/validação remota; próximo lote é o saneamento local de R1 e sua revisão |

Não se mantém o defeito original artificialmente aberto: o [seletor](SELETOR.md)
foi aceito e o [resíduo de workflow](WORKFLOW-REQUIRED.md) tem caminho, consequência
e encerramento próprios. Não há impedimento genérico por ausência de Actions.

## Provas desta execução

Commit local de provas:
`3a0d41df4413dbaa7f48a042d30b0a6dd64469e4`.

| Prova | Resultado | Limite |
|---|---|---|
|23 contratos do candidato Windows |23/23, zero falhas/skips; repetidos após restauração com mesmo resultado | São os mesmos contratos, não46 testes únicos |
| Sete probes independentes |7/7 | Fixtures de classes arbitrárias, alvo ausente/inválido, relatórios, diretório novo e aliases Maven |
| TCP Windows real |Maven/Surefire1/1, zero falhas/erros/skips | Windows 11, Node 24.18.0, Temurin 21.0.12.1; estágio real do candidato, sem DB/JAR novo |
| Reprodução independente original | Verificador e assertions byte idênticos; seleção antiga101/116, condiçãoLinux simulada,1skip e rejeição | JVM Windows com os.name=Linux dentro da fixture original; não Linux real |
| JVM/controlador Linux reais |23 contratos passaram; seleção antiga dirigida4 execuções/1skip rejeitada; corrigida3/3 sem skips | Container Linux/WSL2, Node 22.23.1, Temurin 21.0.12+8; XML de ponte do resumo JUnit, não Surefire/Actions ou suíte integral |
| Duas mutações independentes | Filtro antigo e omissão de DateUtilTest detectados pelo oráculo anterior à correção | Cópia isolada, AssertionError pertinente, bytes restaurados e controles corrigidos verdes |
| Required diante de estados não verdes | Modelo local do YAML real confirma dependência skipped, sem agregador que falhe | Fundamentado na semântica oficial; não execução remota ou prova das regras atuais de merge |

[Matriz](MATRIZ.md), [identidades completas](identidades.json),
[execuções e contraprovas](EXECUCOES.md), [recibos Windows](execucoes-windows.json),
[recibos Linux](execucoes-linux.json), [conferência de inputs](conferencia-independente.json).
Os 470 inputs da exportação coincidem com o candidato e com o digest examinado;
42 referências explícitas de execuções anteriores foram rehashadas sem divergência.
Não se adotou a contagem do executor como prova suficiente.

## Preservação e próxima etapa

Startup local/40s, histórico HQL inconclusivo não bloqueante para preparação,
TCP/reuso, RVPLA/audit e PG16/17 preservados pelo diff. Zoom200%, CF034 integral,
matriz/configuração remotas, CF017/P01/P02, adoção real e produção mantêm gates.
CPA-02 permanece fora do saneamento, no alcance diagnóstico já delimitado.

[Proveniência e Git](PROVENIENCIA-GIT.md), [inicial](preservacao-inicial.json) e
[final](preservacao-final.json). README raiz mantém o SHA histórico fora dos commits;
produto, 16 migrations, JAR p05, provas/manifests e runtimes anteriores intactos.
Inventário somente do runtime novo em [runtime-files.json](runtime-files.json).

Próxima autorização: saneamento exclusivo de **CPA-01/R1**, para que um check
estável exigido na integração recuse explicitamente qualquer dependência não
concluída com sucesso, seguido de revisão independente. O [plano de CI](../consolidacao-pre-adocao/PUBLICACAO-CI.md)
e a [proposta de PR](../consolidacao-pre-adocao/PROPOSTA-PR.md) foram atualizados
documentalmente. Push/PR/CI e merge exigirão decisões posteriores; nenhuma ação
de hospedagem, deploy, serviço de produto ou banco real foi executada.
