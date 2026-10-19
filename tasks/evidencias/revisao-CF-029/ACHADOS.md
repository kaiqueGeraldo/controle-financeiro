# Achados independentes

## RC029-01 — P2 — Reserva para meta numérica salva sem issue

- Candidato: `5bac46ee65cfbf4dade0705b7a430a15731be832`.
- Local: `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/onboarding/DraftConsistency.java:57–66`.
  O laço de alocações verifica pares duplicados, mas não o tipo da meta resolvida.
  `DraftValidator.java:98–101` valida Ref GOAL sem distinguir MONETARY/NUMERIC.
  `DraftReferences.java:19–31` lê o tipo persistido, mas só utiliza o tipo de CATEGORY.
- Norma: SPEC-001 §2, “Inconsistências entre campos ficam como issues no rascunho”;
  §3, “NUMERIC não é dinheiro” e “Reserva liga meta monetária a ACCOUNT/INVESTMENT”.
  CF-029, Trabalho2: validar campos/referências temporárias/limites.

### Reprodução e resultado

Probe preservado: `OnboardingIndependentReviewTest#numericGoalAllocationIsPersistibleButMustCarryAnIssue`.
Cria usuário sintético autenticado; envia PUT versão0 contendo conta CREATE100,
meta CREATE NUMERIC (alvo12 livros, progresso4, prazo2026-12-31) e alocação10
daquela conta àquela meta, resolvidas por tempId. Todos os campos presentes são
bem formados. Não há referência ausente, alheia ou problema de infraestrutura.

Esperado: HTTP200 conserva respostas e valor10.00, incrementa versão e informa
issue identificando a incompatibilidade da alocação. Não exigir rejeição da
gravação nem antecipar aplicação financeira.

Observado: HTTP200, versão1, payload persistido com10.00, GET retorna `issues: []`.
Releitura JDBC confirmou o payload; comparação de todas as tabelas de domínio
confirmou ausência de efeitos financeiros. A assertion de issue falhou depois
dessas verificações. Log e XML em `independent-sp/`.

Impacto: rascunho estruturalmente válido é apresentado sem uma inconsistência
que já pode ser determinada pelo próprio snapshot. O consumidor perde o erro de
campo e pode encaminhar uma seleção incompatível para revisão. Não se demonstrou
perda de saldo nem aplicação financeira; finalização não existe neste candidato.
Não classificar como P1 nem transferir o diagnóstico atual para CF-030.

### Encerramento / saneamento delimitado

Adicionar diagnóstico no rascunho ao resolver o tipo da meta da alocação,
preservando snapshot incompleto, valor, versão e ausência de efeitos. Cobrir
tempId CREATE, alias LINK e referência persistida própria, com controle positivo
MONETARY e referência ainda pendente. Reaproveitar consultas em lote; não criar
SELECT por alocação. Conferir o mesmo caminho de meta em proposta ASSIGN, sem
implementar produtor autoritativo de evidências ou finalização.

O probe acima deve passar sem remover/relaxar a assertion. Revalidar isolamento,
persistência e número de consultas no recorte alterado. Nenhuma correção de
produto foi aplicada nesta revisão.

## Falha do probe, não do produto

`accountDeletionRollbackRestoresDraftAndProtectedRecords` inicialmente capturava
SessionView antes de semear o registro protegido. A fixture tornou mode=COMPLEMENT,
mas o expected ainda era NEW. A SPEC exige classificação por fatos; o produto
estava correto. Ajuste exclusivo de preparação: capturar estado após concluir
a fixture e antes da transação alvo, exigir explicitamente COMPLEMENT e manter
a igualdade integral depois do rollback. Falha inicial preservada em `independent-sp/`;
verificação dirigida em `rollback-contracts-sp/`. Não é saneamento do RC029-01.
