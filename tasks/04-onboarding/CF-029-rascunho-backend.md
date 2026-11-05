# CF-029 — Implementar rascunho autenticado e retomável

- Estado: concluida (aceite independente; exclusivamente no escopo local/descartável)
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-017](../03-integridade/CF-017-migracoes.md), [CF-023](../03-integridade/CF-023-isolamento-autenticacao.md), [CF-028](../04-onboarding/CF-028-contrato-onboarding.md)
- Origem: T-006; F-008

## Prontidão independente local — 15/10/2026

Reconferência independente sobre d806f82 (registro de execução privado)
mantém esta prontidão e seus limites; código da fundação idêntico a bcec50c.
Nenhuma implementação desta tarefa foi iniciada.

Base `bcec50c`, parecer CF-017 e decisão de dependência (registro de execução privado).
Fundação versionada V1–V14/upgrade/Hibernate/restore local aprovada; CF-023 aceita
no recorte de isolamento/sessão e CF-028 concluída como SPEC-001 v1, integradas e
conferidas nos deltas pertinentes. Satisfeita a regra de liberação parcial de
EXECUCAO.md, sem concluir CF-017/P01/P02 nem executar esta tarefa.

Usar somente banco novo/gerenciado descartável. O resíduo RV17-01 foi encerrado
localmente/documentalmente (registro de execução privado), sem ampliar
esta prontidão nem concluir adoção real. Nova migração
posterior à V14, persistência protegida de evidência/atribuição, ownership, versão,
conflitos, retomada e ausência de efeito financeiro exigem testes próprios conforme
SPEC-001. Reconferir base se houver mudanças posteriores. Adoção real, baseline,
publicação e sucessoras não estão liberadas.

## Problema e resultado esperado

Usuário precisa responder por etapas sem perder dados ou criar saldos parcialmente. Rascunho deve permanecer isolado dos módulos financeiros até confirmação.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/`
- `controle-financeiro-backend/src/main/resources/`
- `controle-financeiro-backend/src/test/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Criar sessão de onboarding, versionamento, GET e PUT de rascunho conforme CF-028.
2. Validar campos/referências temporárias/limites e status de novo usuário versus legado; migrar schema versionadamente.
3. Testar save/retomada, versão antiga e sessão expirada sem registrar payload financeiro em logs.

## Aceite e testes adversariais

- [x] Salvar rascunho não altera conta, fatura, investimento ou saldo real.
- [x] Duas abas com versão antiga produzem conflito explícito, sem perder silenciosamente respostas.
- [x] A não acessa rascunho de B; dados sobrevivem a reload/novo login e erros apontam campo. (RC029-01 encerrado pela revalidação independente dirigida.)
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Finalizar posições financeiras ou guardar rascunho em localStorage.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Iniciada em 18/10/2026 na branch local `codex/cf029-onboarding`, base integrada
`dd554d188976144ccf00e00f9b20242196f70d90`. Matriz e evidências (registro de execução privado).
Evidência das correções anteriores não equivale à conclusão desta tarefa.

Entrega local em 19/10/2026: GET/PUT, SAVE/PAUSE/RESUME/DISCARD, versão string,
schema V15, ownership, validação fechada/decimais exatos, referências em lote,
propostas de confirmação protegidas e exclusão transacional. 176 regressões
aprovadas; delta final validado por53/53 em São Paulo e53/53 na cópia restaurada
em UTC+14. Três contraprovas causais detectadas e restauradas. Contagens são
seleções/reexecuções, não somadas como casos únicos. Falhas anteriores preservadas.
Decisões/limites (registro de execução privado) e
comandos/resultados (registro de execução privado).

Checkboxes atualizados pelo parecer independente abaixo; a entrega do executor
e suas contagens permanecem históricas. Intervalo completo desde dd554d1 revisado.
Nenhum prepare/complete/recibo/UI implementado. Registro de evidência não possui
produtor autoritativo nesta entrega; sua população, validação, trilha histórica,
tokens/reconciliação e aplicação são CF-030. CF-030/031/032 conservam seus gates;
CF-017/P01/P02 adoção real e CF-010/015 zoom200% permanecem separados.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Parecer independente — 19/10/2026

Registro histórico anterior ao saneamento e ao aceite final abaixo.

**Não aprovada integralmente; em_revisao mantido.** Candidato5bac46e:
parecer, matriz e execuções (registro de execução privado).
RC029-01/P2: reserva vinculada por tempId a meta NUMERIC é salva e relida com
issues vazias. Deve permanecer persistível com diagnóstico por campo, sem efeito
financeiro; não transferir essa validação já possível no draft para CF030.

Persistência, isolamento nos caminhos exercitados, conflitos/locks reais, ciclo
de vida, precisão, V15/upgrade/validate e exclusão/rollback sustentados.53 controles
originais passaram; probes independentes confirmaram o defeito e preservaram sua
reprodução. Três contraprovas causais com restauração por hash. Controle adicional
de fuso efetivo+14 passou; parâmetro JVM sozinho era insuficiente porque o startup
redefine São Paulo. Erro de fixture do revisor preservado e corrigido separadamente.

Próximo lote restrito: saneamento RC029-01 e revalidação independente, conforme
condição de encerramento (registro de execução privado).
Nenhuma correção de produto nesta revisão. CF030/031/032 não liberadas/iniciadas;
aceites anteriores, zoom200% e adoção real preservados. Sem publicação ou banco real.

## Saneamento local RC029-01 — 19/10/2026

Registro histórico do executor, anterior à revalidação independente abaixo.

Diagnóstico de reserva para meta NUMERIC implementado em `DraftConsistency`, usando
os tipos próprios já lidos em lote por `DraftReferences`. CREATE/tempId, LINK/alias,
ID persistido e proposta ASSIGN recebem `GOAL_TYPE_MISMATCH` no campo `goal` do
item afetado. Salvamento preserva respostas, valores e vínculos; GET recupera as
mesmas issues persistidas. Correção/remoção reavalia no próximo SAVE/PAUSE/RESUME.

Provas antes/depois, regressões, contraprova e encaminhamento (registro de execução privado).
O checkbox de diagnóstico permanece pendente de revalidação independente; este
registro do executor não encerra RC029-01 nem autoaprova CF-029. Persistência,
isolamento, concorrência, precisão, V15, exclusão e ausência de efeitos financeiros
mantêm os resultados anteriores no recorte sustentado. CF030/031/032 continuam
sem liberação; nenhum prepare, aplicação financeira ou UI foi implementado.

## Aceite independente final RC029-01 — 19/10/2026

**RC029-01 encerrado; CF-029 concluída no escopo local/descartável.**
Parecer, matriz, contrato do GET, provas e limites (registro de execução privado).
Candidato aa88ecc: 19 controles dirigidos/original e três probes independentes
aprovados. Remoção isolada da regra produziu sete falhas causais em 13 controles;
restauração por hash recuperou 13/13. Contagens sobrepostas não são somadas.

Diagnóstico NUMERIC correto em reserva/ASSIGN por CREATE, alias e ID próprio,
sem perda de payload ou efeito financeiro. GET recupera a avaliação persistida;
próxima escrita reavalia referências. Demais aceites sustentados preservados,
sem mudança de schema, locks, versão, precisão ou exclusão nesta revisão.
CF-030 tecnicamente apta somente local/descartável, não iniciada; publicação e
integração do lote aprovado exigem etapa autorizada antes de nova branch.
CF-031/032 mantêm suas dependências. Zoom CF-010/015 e adoção real CF-017/P01/P02
permanecem separados. Nenhum produto alterado, push, merge, deploy ou banco real.

