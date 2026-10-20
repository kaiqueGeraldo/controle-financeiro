# CF-030 — contrato anterior à implementação

Base: `5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251`, branch
`codex/cf030-aplicacao-onboarding`. SPEC-001 v1 aprovada, SPEC-004 FIN-01–08/NG-01,
SPEC-002, CF-024/027 e aceite RC029-01 são a autoridade. Esta matriz foi registrada
antes da edição de produto. A aprovação da fundação CF-017 é somente local.

| Critério | Regra normativa | Estado inicial | Resultado independente | Camada / prova necessária |
|---|---|---|---|---|
| Revisão atual | SPEC-001 §§2,4–6 | GET devolve issues do último save; não há prepare | Prepare reavalia folhas, identidade, referências, elegibilidade, inventário e reservas; nenhum efeito financeiro | Aplicação / HTTP+SQL; mudança após save |
| Confirmação congelada | §5 | Não há preparação durável | Uma PREPARED por sessão; save/discard impedidos; cancelar incrementa versão uma vez | Persistência+constraints / duas conexões, cancel/complete/save |
| Aberturas | §3, FIN-01/04, NG-01 | Serviços cotidianos não cobrem todos os fatos de abertura | E01 contas1300, investimentos501, dívida350, patrimônio1451; realizado0; nenhuma compra/aporte fictício | Domínio+aplicação / releitura SQL e serviços |
| Carteira default | §§3,8 | Auth cria CASH automático sem identidade inequívoca | Novos registros têm vínculo explícito; legado nunca inferido; initialize só sem uso e sem reservas | Domínio+schema / identidade, uso, concorrência |
| Cartões | §3, FIN-03, DEC-03 | Abertura presume principal integral | Principal194+150=344, disponível656 em E01; desconhecido preservado; datas civis/override | Domínio+schema+leitores / E01 e componentes desconhecidos |
| Metas e reservas | §§3,5,5.1, FIN-05 | Reservas com fonte; legado incompleto | Reservas550 não aumentam patrimônio; prazo vencido preservado; par final, sem soma duplicada | Reconciliação+persistência / capacidade, reduções, pares externos |
| Origem incerta | §5.1 DEC-ONB-02 | Armazenamento protegido sem produtor | União de riscos; fonte nova não independente; E23/28/34=KNOWN400, E32=KNOWN500 quando o universo é só ACCOUNT; conclusão sem alocação proibida permitida | Projeção+evidência / sobreposição, inventário, ASSIGN/CLOSE, rollback |
| Precisão | §4–5, FIN-06/NG-01 | Draft exato em strings; domínio incompleto para MONETARY | Centavos/8 casas e agregados amplos exatos; known/unknown/partial/NA distintos em prepare/recibo/GET/replay | Domínio+transporte / limites, total1/3, máximos e escala inválida |
| Atomicidade | §6 | Não há aplicação global | Falha final/recibo reverte todos os efeitos e COMPLETED; PREPARED permanece recuperável | Transação local / PostgreSQL real, falha injetada |
| Identidade/recuperação | §5–6, CF-024/027 | FinancialIntents porta compartilhada | Mesmo ID/corpo retorna recibo original antes da versão consumida; outro corpo409; GET recupera resposta perdida | Aplicação+porta / replay, conteúdo diferente, ownership |
| Concorrência | §6 | Writers possuem locks de fontes, sem coordenação de inventário | Mudança relevante não atravessa revisão; fontes de owners distintos independentes; uma aplicação por sessão | Guard comum+constraints / conexões independentes, barreiras observáveis |
| Recursos/custo | §5 capacidade, §6 | Sem leitura de inventário completo | Consultas em lote, sem SELECT secundário por item; erro503 sem truncar se capacidade operacional excedida | Projeções / 1, limites request e legado volumoso, bytes/tempo/queries |
| Migração/exclusão | §§2,8, CF-017/RV24 | V1–V15 | Nova V16 aditiva; vazio+upgrade+validate; legado preservado; delete engloba novas estruturas e rollback | PostgreSQL descartável / Flyway+SQL+exclusão integrada |
| Limites | CF-030/031/032 | CF029 concluída, CF031/032 propostas | Backend local, commits locais, CF030 em_revisao após provas; nenhum aceite/deploy/adoção real | Evidências e revisão independente posterior |

## Fronteira e invariantes propostos

Prepare/cancel/complete são transações locais curtas. Complete inclui efeitos,
mapping auditável, recibo FinancialIntents e estado COMPLETED no mesmo commit.
Nenhuma rede, cotação ou email nesse caminho. Eventos usam a invalidação existente
após commit. Recibo não é recalculado contra posições atuais.

Ordem: intenção (namespace FinancialIntents) → coordenação owner → sessão →
fontes (contas antes de investimentos, IDs ordenados) → efeitos/recibo. Writers
financeiros existentes participarão de um guard compartilhado; preparação e
aplicação usam seu modo exclusivo. Assim writers cotidianos mantêm concorrência
entre fontes distintas, enquanto o snapshot não mistura estados. Alterações após
prepare continuam permitidas nos módulos, mas invalidam a confirmação antiga.
Ordem e caminhos reais serão reconferidos e exercitados antes do aceite local.

Capacidade operacional configurável será distinta dos limites financeiros e dos
256KiB de request: nenhum corte silencioso de inventário/resumo. Medir bytes,
tempo, cardinalidade e queries nos ensaios; sem extrapolar desempenho de produção.

## Publicação anterior / preservação

Fetch conferido; `origin/main` era `dd554d188976144ccf00e00f9b20242196f70d90`.
Nove commits aprovados, nenhuma divergência. CF029 e main publicadas sem force,
ambas conferidas via ls-remote em `5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251`.
README raiz inicial SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`,
inalterado nas trocas. `.cf22/.cf22r/.cf22s`, ignorados, runtimes e provas anteriores
preservados. Primeira tentativa de fetch no sandbox foi negada por acesso a
FETCH_HEAD; execução autorizada fora do sandbox concluiu. ls-remote no sandbox
sem rede falhou por DNS; conferência autorizada posterior concluiu.

## Rastreabilidade do candidato para revisão

Esta seção posterior não substitui os oráculos registrados acima. Classes novas
ficam em `src/test/java/com/controlefinanceiro/api/domain/onboarding/`:

| Regra / fronteira | Evidência executável |
|---|---|
| E01, aplicação/recuperação/replay, revalidação, falha no último item | OnboardingApplicationTest |
| Intenções distintas, cancel/complete, writer real, recibo, exclusão e rollback | OnboardingLifecycleConcurrencyTest |
| E23/28/32/34, união, prova vencida, parcial, ASSIGN/CLOSE e déficit | OnboardingReservationsTest |
| Máximos/amplos, NG01, estados desconhecidos, HTTP fechado e ajuste legado | OnboardingPrecisionProtocolTest |
| Registro real/default, fatura vazia, liberação de par e progresso8 casas | OnboardingBoundaryTest |
| Falha posterior a recibo/COMPLETED | OnboardingAtomicityEventTest |
| Contrato de canonicalização e lacunas agregadas sem cópia quadrática | OnboardingCanonicalContractTest |
| Limites de draft,1000 fontes existentes e consultas instrumentadas | OnboardingCapacityCostTest |
| Capacidade503 sem efeito financeiro | OnboardingCapacityHttpTest |
| V15→V16 com dados e constraints; vazio por contextos Flyway+validate | OnboardingV16MigrationTest e suporte de aplicação |

As suites CF029 e regressões financeiras/temporais existentes integram a seleção
ampla. [Execuções e contraprovas](EXECUCOES.md) identifica logs, resultados e falhas
preservadas; [decisões](DECISOES.md) limita expressamente o alcance das provas.
