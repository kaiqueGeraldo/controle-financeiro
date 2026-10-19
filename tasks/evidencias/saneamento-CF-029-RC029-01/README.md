# Saneamento local RC029-01 — 19/10/2026

**Implementado localmente; CF-029 permanece em_revisao, aguardando revalidação
independente dirigida.** Este registro do executor não encerra o achado nem
autoaprova a tarefa. CF-030/031/032 continuam sem liberação.

## Base e preservação

Branch mantida: `codex/cf029-onboarding`. Entrada exata:
`eb70a4b3d2d26cfeb43b9064c29f75c27cfdee52`; sem trabalho posterior versionado e com
staging vazio. Provas/parecer independentes `82b8ee4`/`eb70a4b` preservados.
Alterações preexistentes: README raiz e diretórios não rastreados .cf22/.cf22r/.cf22s.
`initial-state.json` foi registrado após criar esta pasta; sua própria presença
como não rastreada pertence a este saneamento, não ao trabalho preexistente.

README raiz fora dos commits, SHA-256 inicial/final esperado:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Sem restauração automática, clean, reset destrutivo, limpeza geral de target,
edição/remoção de runtimes anteriores, troca/exclusão de branch, push, merge,
deploy ou banco real. Maven atualizou seus artefatos normais de compilação/teste;
o JDK existente foi reutilizado. A nova cópia de contraprova foi preservada.

`probes-before.json` verifica os cinco fontes/scripts independentes contra o
manifesto original. `review-evidence-before.json` registra os arquivos da revisão
anterior; a conferência final está em `preservation-final.json`. Nenhuma assertion
ou critério das provas independentes foi alterado. Não houve outro AGENTS aplicável
no repositório ou ancestrais; aplicaram-se as instruções da conversa e a skill
Tech Lead & Arquiteto, além de EXECUCAO/POLITICA-DE-TESTES e referências da CF-029.

## Reprodução e causa

Antes de editar produto, foi executado sem alteração o probe
`OnboardingIndependentReviewTest#numericGoalAllocationIsPersistibleButMustCarryAnIssue`.
`original-before/`: 1 teste, 1 falha causal, 0 erros. HTTP 200/versão 1, payload e
10.00 persistidos/reconsultados via JDBC, tabelas de domínio intactas; depois disso,
a assertion da linha 174 detecta GET com `issues: []`. Não foi falha de fixture.

`DraftConsistency` examinava duplicação de pares, mas não o tipo da meta.
`DraftValidator` verificava a estrutura e o kind GOAL da referência;
`DraftReferences` já consultava o tipo persistido em lote, sem usá-lo para metas.
Assim, o snapshot salvo não representava uma incompatibilidade já determinável.

## Norma e correção

SPEC-001 §2 permite salvar inconsistências entre campos como issues; §3 define
NUMERIC fora do dinheiro e reserva entre meta monetária e ACCOUNT/INVESTMENT.
§5.1 exige meta monetária também em ASSIGN; FIN-05 preserva destinação sem custódia.
O formato de FieldError é o de SPEC-001 §5: path JSON Pointer, code e message.

`DraftConsistency.reservationGoalIssues` indexa tipos CREATE por tempId e resolve
LINK/alias ou ID próprio com o mapa já obtido por `DraftReferences`. Avalia cada
Allocation e cada proposta ASSIGN uma vez, após verificar ownership/revisão.
O serviço conserva sua composição de issues e as persiste junto com o payload;
GET recupera essas mesmas issues. SAVE/PAUSE/RESUME usam o mesmo caminho.
DISCARD continua limpando payload/issues.

Código técnico `GOAL_TYPE_MISMATCH`, seguindo a convenção já usada por
`CATEGORY_DIRECTION_MISMATCH`; a especificação define a regra e o formato,
sem enumerar um código específico para esta incompatibilidade. Caminho:
`/sections/allocations/items/{i}/goal` ou `/reservationConfirmations/{i}/goal`.
Mensagem genérica existente: `Revise este campo.` Nenhuma severidade nova foi
adicionada ao contrato (FieldError não possui esse membro); severidade do achado
permanece P2. A incompatibilidade deve ser corrigida/removida da seleção antes da
finalização conforme SPEC-001; prepare/complete e seu bloqueio pertencem à CF-030
e não foram implementados aqui. Rascunho sem issues tampouco autoriza finalização.

Não se rejeita o save por esta inconsistência; reserva, valor, vínculo e meta
permanecem. Referência temporária pendente mantém REFERENCE_PENDING, folha ausente
mantém REQUIRED; referência estruturalmente ambígua continua 400, alheia/ausente
no banco continua 404 uniforme, revisão protegida obsoleta continua 409.
Nenhum campo monetário é ajustado ou meta convertida para obter compatibilidade.

GET continua sendo recuperação do último snapshot confirmado, conforme a decisão
anterior da CF-029 (`../CF-029/DECISOES.md`, fronteira de concorrência).
Mudança externa de tipo não reescreve issues no GET; o próximo SAVE/PAUSE/RESUME
reavalia. Revalidar inventário/versões/capacidade sob coordenação de writers antes
de preparar/aplicar permanece obrigação da CF-030. Não foi antecipada essa política.

## Arquitetura, custo e trade-offs

Somente dois fontes de produto mudaram:
`domain/onboarding/DraftConsistency.java` e `service/onboarding/DraftReferences.java`.
O avaliador de domínio tornou-se público para receber do serviço o mapa de tipos,
sem introduzir dependência JDBC no domínio. Não há regra duplicada em escrita/GET.
Também foram adicionados `OnboardingReservationIssueTest.java`, `sanitation-run.ps1`
e `sanitation-mutation.ps1`. Documentação: esta pasta, tarefa CF-029 e tasks/README.

Para G metas no draft, R metas persistidas distintas, A alocações e C confirmações,
a avaliação adicional custa O(G+R+A+C) em tempo e O(G+R+I) em memória (I issues).
Mapas evitam procurar metas em laços aninhados. O mapa de tipos vem da mesma query
de ownership já existente: nenhuma consulta adicional ou por item. O teste mede
uma chamada de query de metas para 1 e 50 referências; GET faz zero dessas queries.
O banco ainda paga a cardinalidade do IN; não se declara latência constante.

Vantagem: menor mudança, sem schema/novos locks/writers ou alteração de versão,
transação e conflitos. Custo: mais um passe linear, limitado pelo contrato, dentro
da avaliação já transacional. Risco preservado: issues salvas representam o último
save, não prova de validade atual do inventário; CF-030 revalidará a aplicação.
Nenhuma migração foi alterada ou criada.

## Execuções e limites

Java Temurin 21.0.12.1 existente, Maven wrapper, Spring Boot 4.0.2, PostgreSQL
16-alpine descartável via Testcontainers e schema isolado. E-mail e cotações são
doubles nas fronteiras, conforme o harness original; nenhum serviço externo real.
O sandbox negou acesso inicial ao Docker; a execução ampliada foi autorizada
automaticamente, sem fallback para banco real. Não houve rejeição de auto-review.

| Artefato | Resultado | Interpretação |
|---|---|---|
| original-before | 1 caso, 1 falha, 0 erros | Defeito reproduzido antes de produto |
| original-after | 1/1 aprovado | Mesma prova e assertion após correção |
| directed-regressions | 84 casos: 83 aprovados, 1 falha, 0 erros | 66 originais aprovados; 17/18 novos; falha no observador de queries |
| query-controls-corrected | 18/18 aprovados | Correção exclusiva do observador, expectativa 1 query preservada |
| mutation-missing-rule | 13 casos: 7 falhas, 6 aprovados, 0 erros | Regra retirada só na cópia; original e 6 casos NUMERIC detectam; 6 MONETARY passam |
| isolated-restored | 13/13 aprovados | Mesma seleção depois de restaurar bytes da cópia |

Os 66 originais são 41 DraftValidatorTest, 22 OnboardingIndependentReviewTest
(incluindo os 11 controles de integração herdados) e 3 IndependentContractTest.
Os novos 18 cobrem CREATE/alias/ID × NUMERIC/MONETARY em reserva e ASSIGN,
ciclo SAVE/PAUSE/SAVE/RESUME, troca de tipo/vínculo, remoção/descarte, composição,
índices mistos, 400 estrutural, 404 uniforme e batching/alteração externa.
São 84 casos distintos aprovados nas rodadas aplicáveis; reexecuções da prova
original e da contraprova não são casos inéditos nem uma soma de suítes únicas.

A primeira medição por spy contava tanto `query(String,Map,RowCallbackHandler)`
como sua delegação `query(String,SqlParameterSource,RowCallbackHandler)`.
`query-overload-bytecode.txt` comprova a delegação no spring-jdbc 7.0.3 local.
O observador passou a contar só a entrada Map usada pelo produto; expectativa
permaneceu exatamente 1 para 1/50 e 0 no GET. Nenhum produto, timeout, retry,
tolerância ou assertion independente mudou para resolver essa falha do teste.
Log/XML da falha inicial preservados. Uma inspeção preliminar selecionou o jar de
fontes e falhou; a inspeção corrigida usa o jar executável, conforme query-overload.txt.

Persistência: comparação de payload e issues via JDBC após commit, GET com novo
token, versão/status e referências. `allDomainTables` compara todas as tabelas
do schema, exceto users/sessão/Flyway, incluindo registros protegidos e todos os
módulos financeiros, antes/depois dos cenários. Reserva 10.00 continua exata e
o payload inteiro permanece igual ao valor normalizado contratual. Nenhuma
movimentação, alocação real, histórico ou alteração de revisão/evidência foi criada.

Não se repetiram matrizes de fusos nem toda a suíte do monorepo: nenhum contrato
temporal/infraestrutura mudou. V15, upgrade e demais aceites anteriores permanecem
sustentados pela revisão; os contextos novos ainda executam Flyway e Hibernate
validate, e o probe original de reexecução Flyway passou. Sem nova auditoria universal,
benchmark, browser/BFF, finalização, certificação de produção ou banco real.

## Contraprova e integridade

Cópia nova em `C:/Users/Aluga.com/.codex/visualizations/2026/10/19/01a155e0-717a-7b73-93f7-788580959cb7/cf029-rc029-01-counterproof`.
Archive do backend em eb70a4b com sobreposição explícita dos dois fontes corrigidos
e do novo teste, equivalentes aos fontes Java do commit de implementação abaixo.
`isolated-source-before/after.json`: 371 arquivos conferidos; remoção somente da
chamada à avaliação em DraftReferences, diff em mutation.diff. Restauração em
finally por bytes/hash; `mutation.json` registra 7 falhas/0 erros/restauração.
A integridade foi reconferida também após o controle restaurado.

`tested-source-sha256.json` identifica 368 fontes/configurações de teste do checkout
efetivamente validado; os hashes são de bytes do checkout (EOL do archive pode
diferir nos demais arquivos da cópia). `execution.json.base` registra o HEAD do
checkout coordenador no encerramento da rodada; os manifestos identificam o
conteúdo da cópia e evitam atribuir um HEAD do coordenador à árvore isolada.
JWTs sintéticos redigidos nos relatórios; não se retiraram payloads sintéticos,
oracles ou erros das provas. Evidências anteriores não foram regravadas.

## Comandos e encaminhamento

Da raiz, execução de fato (cada Name recusou sobrescrita):

```powershell
& ./controle-financeiro-backend/src/test/cf029/sanitation-run.ps1 -Name original-before -Tests 'OnboardingIndependentReviewTest#numericGoalAllocationIsPersistibleButMustCarryAnIssue'
& ./controle-financeiro-backend/src/test/cf029/sanitation-run.ps1 -Name original-after -Tests 'OnboardingIndependentReviewTest#numericGoalAllocationIsPersistibleButMustCarryAnIssue'
& ./controle-financeiro-backend/src/test/cf029/sanitation-run.ps1 -Name directed-regressions -Tests 'DraftValidatorTest,OnboardingIndependentReviewTest,OnboardingIndependentContractTest,OnboardingReservationIssueTest#reservation*'
& ./controle-financeiro-backend/src/test/cf029/sanitation-run.ps1 -Name query-controls-corrected -Tests 'OnboardingReservationIssueTest#reservation*'
& ./controle-financeiro-backend/src/test/cf029/sanitation-mutation.ps1 -Workspace 'C:/Users/Aluga.com/.codex/visualizations/2026/10/19/01a155e0-717a-7b73-93f7-788580959cb7/cf029-rc029-01-counterproof'
```

Para reexecutar controles, usar Name novo. A contraprova registrada é uma execução
única com workspace e nomes de evidência próprios; preservar os diretórios existentes.
Comando Maven, seleção, horários e exit constam de cada execution.json.

Commit de implementação/testes: `536f370ebc7f0bdc31328469d8c9a3b7539cdf9f`.
Commit documental subsequente contém evidências/estado; seu hash é informado na
entrega e no log Git, sem autorreferência no conteúdo do próprio commit.
Intervalo para revalidação: `eb70a4b..HEAD`, nesta branch. Revisor deve executar
a prova original preservada e os 18 casos dirigidos, conferir preservação dos
demais aceites e decidir o encerramento de RC029-01/aceite da CF-029. A decisão
permanece independente; nenhum checkbox de aceite foi marcado pelo saneamento.
