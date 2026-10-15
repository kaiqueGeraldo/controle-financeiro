# Revalidação documental independente RV17-01/P2 — 15/10/2026

**P2 encerrado. RV17-01 encerrado no escopo local e do procedimento operacional
documentado**, combinando o aceite anterior do código com este aceite da janela.
Nenhuma nova omissão impeditiva encontrada no delta. Não certifica execução dos
controles em um ambiente existente nem conclui adoção real.

## Base, escopo e preservação

Branch `codex/cf017-preflight-restore`; HEAD de entrada/candidato
`6e64aad2e4bdc1a953b846d10f4788ea2e509ac1`. Base
`ef08950059ef0366ca48172cad48e5ee3a6906e8`, intervalo `ef08950..6e64aad`.
Ancestralidade confirmada, um commit documental, nenhum commit posterior na
entrada. Exatamente os cinco documentos informados alterados; nenhum delta de
produto, migração ou configuração. Staging inicial vazio; única mudança local
preexistente: README raiz, SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Preservado e fora do commit.

Aplicadas instruções AGENTS da conversa; busca atual não encontrou AGENTS na
árvore, e a busca de ancestrais desta mesma sessão não encontrou adicionais.
Regras pertinentes de EXECUCAO/POLITICA-DE-TESTES relidas. Examinados integralmente
o delta e os cinco documentos: ROLLOUT-LEGADO, saneamento-RV17-01-P2/README,
saneamento-CF-017/ENCAMINHAMENTO, CF-017-migracoes e CF-017-P01-P02-adocao-temporal.
Confrontados o achado em revalidacao-CF-017/ACHADOS e o último parecer em
reconferencia-CF-017/README, além da anotação de prontidão CF-029.

Leitura dirigida de DatabaseVerificationCli apenas para conferir argumentos,
identificação e códigos de saída; sem reabrir revisão de código. Aceites de
catálogo/read-only/initializer e restore reutilizados do parecer anterior, com
ausência de delta confirmada. O probe previousPassDoesNotAuthorizeChangedSchema
é evidência causal anterior, não execução nova. Nenhum teste, build, baseline,
migração, backup/restore ou acesso a banco foi executado nesta revisão.

## Regra e controles avaliados

Runbook do candidato, linhas77–102: resultado completo COMPATIBLE/exit0 vinculado
a recurso/geração, ambiente, endpoint/porta, database/schema, inventário/V1,
artefato/catalog.sql/classpath, versões e configuração efetivas. Registro externo
ao CLI é exigido explicitamente. Mesmo nome/IP e timestamp recente não transferem
validade. Continuidade é condição de uso; falta de prova interrompe o avanço.

Linhas108–152: controles começam antes do gate. Executor único da baseline e
responsável pela janela identificam aplicação, jobs, pipelines e operadores com
caminhos de DDL/migração/restore/administração. Suspensões têm responsáveis e
confirmações; se insuficientes, o plano deve prever restrição aprovada de acesso.
Cobertura desconhecida ou executor não controlado impede prosseguir. Registrar
eventos e confirmar que controles continuam vigentes evita presumir segurança
apenas pela ausência de logs. Registro mínimo nas linhas184–194 torna a decisão
auditável por tentativa, com causas, evidências, responsáveis e vínculos.

Isso é executável como procedimento delimitado: determina quem confirma, o que
impedir, que prova guardar e quando abortar. A capacidade concreta de controle
do ambiente real permanece gate de adoção, não alegação satisfeita nesta revisão.
Vantagem: dispensa infraestrutura nova sem necessidade demonstrada. Custo/risco:
janela coordenada, suspensão de executores e eventual indisponibilidade de writers;
execução depende da cobertura comprovada. A impossibilidade de cobertura leva a
abortar, não a um aceite por confiança. Não há mudança de queries, Big-O ou locks.

O texto nega corretamente garantias que o CLI não fornece: transação de leitura
encerrada não protege outra conexão; lock posterior do Flyway não cobre o intervalo
anterior; repetir o gate imediatamente antes não elimina uma corrida sem controle.

## Matriz independente A–I

Expected derivado do critério do achado: só usar resultado completo aplicável ao
mesmo estado estrutural/identidade/versões, com continuidade controlada. As linhas
da matriz do executor foram confrontadas com a sequência e esse critério; sua
mera presença não foi tratada como prova operacional.

| Cenário | Decisão e justificativa | Evidência necessária | Condição para retomar/avançar |
|---|---|---|---|
| A. Alvo confirmado, versões e controles mantidos | Prosseguir somente à baseline autorizada; resultado ainda aplicável | Identidade/geração, hashes/configuração, saída completa/exit0, confirmações contínuas e autorização | Backup/restore/recuperação atuais já aprovados; responsável mantém exclusividade até confirmação da baseline |
| B. DDL após aprovação, inclusive índice permitido | Parar e repetir: o estado observado mudou, ainda que a alteração pareça compatível | Evento/autor/alteração e relatório anterior preservados | Resolver/revisar alteração, restabelecer controles e obter novo gate completo; history criado exige fluxo gerenciado |
| C. Interrupção sem prova de continuidade | Parar e repetir; recência do relatório não basta | Causa/intervalo da interrupção e nova confirmação de identidade/controles | Nova janela demonstrada e novo gate; interrupção apenas do operador com continuidade integral comprovada pode satisfazer A |
| D. Relatório usado em outro alvo | Rejeitar reutilização; aprovação não é transferível | Identidade observada e registro de provisionamento do novo escopo | Identificação/autorização próprias, controles e preflight do alvo correto |
| E. Banco restaurado/substituído, mesmos nomes | Invalidar: geração do recurso mudou | Registro de restore/substituição e identidade nova | Conferir controles/estado, repetir gate aplicável e atender gates de dados; gerenciado não recebe nova baseline |
| F. Inventário/ferramenta/configuração relevante alterados | Invalidar e repetir: sem garantia da mesma interpretação/visibilidade | Versões/hashes/configuração efetiva e mudança aprovada | Versões aprovadas, alvo/controles conferidos e resultado novo completo |
| G. DML durante a janela | Classificar efeitos; DML restrito a dados não invalida automaticamente catálogo, mas violação do freeze de dados impede avanço | Operação/efeitos conhecidos, ausência de DDL/history indiretos e estado do freeze/backup | Se freeze violado, novas captura/dump consistentes e prova de restore, ou recuperação das etapas de migração afetadas; fora dele, reavaliar backup/recuperação; natureza desconhecida segue H |
| H. Não se pode controlar alterações estruturais | Interromper; repetir SELECT não compensa ausência de exclusividade | Inventário de executores/acessos e falha concreta de cobertura | Restabelecer e comprovar controles antes de novo gate; se impossível, abortar janela |
| I. Requer revisão, mesmo sem INCOMPATIBLE | Parar para análise; exit2 não autoriza baseline | Relatório completo e motivo da divergência | Resolução aprovada e novo gate, sem exceção manual ao resultado |

Todos os casos atendidos. Adicionais: erro/timeout/resultado incompleto param;
history alterado exige investigar e escolher fluxo gerenciado, sem apagar histórico
para fazer gate passar. Baseline incerta exige inspecionar info/history, sem repetição
cega ou repair. Baseline bem-sucedida encerra o estado pré-baseline; não se exige
que o gate legado continue passando depois de criar history.

## DDL, DML, comandos e consistência

Runbook linhas168–182 preserva a distinção: DML conhecido somente em dados não é
DDL; efeitos indiretos/operation mista ou desconhecida não recebem essa tolerância.
Sequences/nextval/setval continuam fora da garantia transacional de linhas e exigem
freeze próprio. Captura e dump em sessões separadas exigem freeze contínuo; escrita
no intervalo requer novas captura/dump e restore. Aprovação estrutural não libera
migração, coexistência de versões ou writers. RV17-02 e suas pré-condições permanecem
aceitos, sem nova execução nem reabertura.

Comandos conferidos estaticamente: argumentos preflight schema expectedDatabase
coincidem com CLI; todo exit não zero interrompe; variáveis de segredo são injetadas
sem valores nos exemplos. Identificação SQL auxilia a conferência e não é apresentada
como prova suficiente de geração. Novo texto exige autorização, backup restaurável
atual e recuperação antes da baseline; passo8 não posterga esses pré-requisitos.
Baseline explícita, migração e liberação de writers têm decisões e registros separados.

Os cinco documentos são coerentes no candidato: entrega ainda aguardava revisor,
CF-017/P01/P02 em_revisao e CF-029 local pronta. Encaminhamento antigo está marcado
como histórico, portanto sua antiga negativa de prontidão não é regra vigente.
Relatórios anteriores datados permanecem intactos. Nesta entrega, apenas notas de
situação vigente e referências são atualizadas; nenhuma regra do runbook é reescrita
para obter aprovação. CF-029 recebe ajuste da menção obsoleta ao resíduo, sem mudança
de prontidão ou escopo.

## Parecer separado e próximos trabalhos

* **A/P2: encerrado**, janela consistente e executável, com invalidação e recuperação
  de controles explícitas. Nenhum saneamento normativo adicional exigido.
* **B/RV17-01: encerrado no escopo local e do procedimento documentado.** Soma-se
  este aceite ao código aprovado anteriormente; não atesta uso correto em banco real.
* **C/CF-017 e P01/P02: em_revisao mantido.** Restam inventário/compatibilidade real,
  backup/restore do alvo, proveniência, coordenação de writers/clientes, medição e
  execução/autorização próprias. Nenhum checkbox de adoção real foi concluído ou
  transferido para outra tarefa. V1–V14 e RV17-02 local preservados.
* **D/CF-029: prontidão exclusivamente local/descartável preservada**, sem execução.
  Nenhuma ampliação para ambiente existente, sucessoras ou publicação.

Próximo trabalho planejado pelo usuário: investigação dirigida CF-019/RVA-03,
começando pela avaliação de possível relação com o relógio do harness. **Não iniciada**;
relação é hipótese a investigar, não causa diagnosticada nesta revisão.

## Comandos e evidência documental

Executados git status/branch/rev-parse/log/diff, merge-base --is-ancestor (exit0),
Get-FileHash, buscas/leitura local e diff --check do candidato (exit0). Nenhum comando
de banco nem suíte75 executados. A prova nova é o confronto documental acima;
não é simulação de operação real nem teste automático por presença de palavras.
Commit local com staging explícito e inspeção do diff staged; somente parecer e
notas de estado. README raiz e relatórios históricos preservados. Sem push/deploy,
checkout/reset/clean/merge/rebase, baseline ou alterações de produto.
