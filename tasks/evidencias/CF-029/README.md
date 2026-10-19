# CF-029 — execução local, 18/10/2026

Estado final em19/10/2026: **em_revisao**. Base integrada dd554d188976144ccf00e00f9b20242196f70d90.
Não constitui aceite independente. Sem banco real, deploy ou implementação de sucessoras.

## Matriz definida antes da implementação

| Critério | Autoridade | Responsável | Resultado independente | Validação |
|---|---|---|---|---|
| Save sem efeito financeiro | SPEC-001 §§2/4/5/8 | Serviço de rascunho e armazenamento próprio | E02 versão1; nenhuma posição/transação alterada | HTTP real + snapshots SQL PostgreSQL |
| Conflito de abas | §§5/6 | Escrita transacional/versionada | Dois saves versão0/1: um200 e um409; resposta vencedora conservada | Conexões concorrentes e releitura |
| Ownership e retomada | §§2/5; CF-023 DEC-09 | Autenticação existente e consultas owner-scoped | A nunca lê/vincula B;401 conserva último save; novo login recupera | Tokens reais, HTTP, SQL |
| Entrada/precisão/limites | §4, FIN-06/NG-01 | Validador fechado específico v1 | Campos malformados400, limite de corpo413; folhas ausentes geram issues; strings exatas | Oráculos literais, limites, UUIDs/refs, datas |
| Persistência/schema/exclusão | §8; liberação CF-017 | Nova V15 e integração de exclusão | Criação/upgrade sem alterar V1–14; tombstone e versão duráveis; exclusão owner | Flyway+Hibernate validate, upgradeV14, rollback/exclusão |
| Confirmações atuais | §5.1/§8 | Draft e contrato de persistência | ASSIGN/CLOSE são propostas versionadas, nunca evidência histórica ou efeito financeiro | Releitura/ownership; rejeição de campos de evidência arbitrários |
| Evidências sensíveis a violações | Política de testes | Testes e cópia isolada | Remover guarda de versão/owner/precisão deve falhar causalmente | Contraprovas com restauração por hash |

## Fronteiras

CF-029: GET /onboarding, PUT /onboarding/draft; SAVE/PAUSE/RESUME/DISCARD,
sessão única, versão string, payload fechado, referências e issues, nenhuma expiração
automática. Confirmações são declarações propostas, protegidas pelo owner e versão.
Evidência validada/atribuição autoritativa exige identidade, owner, revisão e
proveniência; sua aplicação e validação do inventário pertencem à CF-030.

CF-030: prepare/cancel/complete/recibos, FinancialIntents, locks compartilhados
com writers, reconciliação financeira e SummaryAmount. CF-031: UI/BFF; CF-032: E2E.
E01 (1451/350/550), E23/E28/E34 KNOWN400 e E32 KNOWN500 permanecem oráculos
de finalização; salvar draft não calcula nem grava esses totais em domínios reais.
Nenhuma sucessora liberada por este trabalho.

## Base, dependências e preservação

CF-022 concluída pelo parecer revalidacao-saneamento-CF022; 13 commits
e1c6312..dd554d1, somente testes/harness/documentos/evidências. Fetch conferiu
0 divergentes/13 à frente; branch publicada sem force; main atualizada e integrada
por fast-forward. ls-remote confirmou main e codex/cf022-investigacao no hash acima.
Branch codex/cf029-onboarding criada nessa base. Novos commits permanecerão locais.

CF-017: liberação expressa em revalidacao-CF-017 (bcec50c), reconferida em
reconferencia-CF-017 (d806f82); CF-023 aceita; CF-028 aprovada em
revalidacao-CF-028-totais (a7bc256). Migrações existentes V1–V14.
CF-017/P01/P02 conservam adoção real; CF-010/015 conservam zoom200%.
Timeouts históricos CF-022 continuam inconclusivos/não bloqueantes com seus gatilhos.

README raiz SHA256 inicial e após branches:
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
Fora dos commits. .cf22/.cf22s/.cf22r preservados e não versionados.
Staging inicial vazio. Nenhum AGENTS adicional encontrado; instruções da conversa aplicadas.

## Resultado e encaminhamento independente

Implementado GET/PUT autenticado, sessão única/owner, versão exata, conflitos409,
save/pausa/retomada/descarte, classificação por fatos, validação fechada, precisão,
refs em lote e issues sem efeito financeiro. V15 cria persistência do rascunho e
contrato interno de registros de reserva; não cria histórico nem reconciliação.
Schema novo/upgradeV14 e Hibernate validate exercitados em PostgreSQL descartável.
Exclusão de usuário abrange ambas as tabelas atomicamente.

176/176 na seleção ampliada e verify aprovados. Delta final:53/53 em São Paulo
com verify e53/53 na cópia restaurada em Kiritimati. Três contraprovas detectadas
(versão/owner/precisão), cópias restauradas por hash. Não somar reexecuções como
casos distintos. [Execuções/falhas/reprodução](EXECUCOES.md) ·
[decisões, complexidade e limites](DECISOES.md).

README raiz conserva o SHA informado; .cf22/.cf22r/.cf22s não foram editados.
Runtime novo .cf029-mutation permanece local/ignorado; não integra commits.
As duas evidências RV24 sobrescritas pelo teste legado foram preservadas em nova
pasta e os históricos restaurados, com diff final zero. Nenhuma limpeza geral.

Revisor: comparar `dd554d1..HEAD` nesta branch, ler SPEC-001 antes dos expected,
executar runner com nome novo e desafiar ownership, limite decimal, primeiro save
concorrente, resposta perdida/GET, tombstone, schema/upgrade e exclusão. Conferir
diferença entre declaração proposta e evidência autoritativa; não usar este parecer
do executor como prova de aceite. Somente revisão independente está encaminhada.

CF-030/031/032 permanecem propostas. CF-030 ainda exige aceite CF-029 e demais
dependências; CF-031 exige também CF-015/030; CF-032 exige CF-031 e seus outros
gates. Sem deploy manual, banco real, writers liberados ou novos commits publicados.
