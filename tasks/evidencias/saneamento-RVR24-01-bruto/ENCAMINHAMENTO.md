# Revalidação dirigida — RVR24-01

Base: `c45bfb6fa658a7d31e11353c8fb1a667123ebf64`.
Commit funcional: `a93c52ffef82b31b7b9848932c32ba6e29cbdf95`.
Intervalo funcional completo:
`c45bfb6fa658a7d31e11353c8fb1a667123ebf64..a93c52ffef82b31b7b9848932c32ba6e29cbdf95`.
Documentação/evidências: commit que adiciona este arquivo, filho do funcional
(resolver por `git log --diff-filter=A --format=%H -- tasks/evidencias/saneamento-RVR24-01-bruto/ENCAMINHAMENTO.md`).

Único produto alterado: creationResult.ts; dois arquivos novos de testes em
frontend/tests/component. Nenhum hook, modal, backend, schema, fingerprint ou
snapshot alterado. Não solicitar revisão integral CF-025/026/027: aceites
c45bfb6 preservados, assim como RVR24-02 e RV24-02.

Revalidar o mesmo [RVR24-01](../revisao-CF-025-CF-027-RV24/ACHADOS.md):

1. Conferir FIN-04/06, NG-01 e DEC-10 conforme [contrato](CONTRATO.md). Bruto por
   unidades = produto decimal exato HALF_UP em centavos, antes de taxas; SELL
   monetário = amount autoritativo, sem recomposição por preço descritivo.
2. Reexecutar financial-result-review.test.tsx: três originais POST/retry/GET
   e controle positivo, hash `0174865c3f241459bb2dfae5eb9540b2a95c47c92be72f5b427a59dcb5a69143`.
   [Antes](before.log) falha3/passa1; [depois](after.log) passa4, mesmos bytes.
3. Conferir rv24-gross.test.tsx e regressões rv24-residual,
   rv24-independent-review, rv24-creation-intent e temporal-forms: 89/89 nesta
   execução. Cobrem limites decimais, taxa, total incompatível, NG-01, envelope
   imutável, recuperação válida, novas intenções iguais e lifecycle já aceito.
4. Integração nova: [checkpoints SQL](integration/browser/sql-checkpoints.json)
   comprovam commit antes da resposta falsa999, pendência após POST/GET
   incompatíveis, GET válido/reload e um único efeito200/recibo/POST/saldo800.
   Scripts preservados usam backend temporário/PG descartável e fault injection
   exclusivamente no harness. Não inferir que o backend real emitia999.
5. Critério de encerramento do resíduo: nenhuma resposta incompatível remove
   a intenção/confirma sucesso; respostas legítimas e arredondamentos aceitos
   continuam confirmando; identidade/payload se preservam até recuperação
   coerente; não há duplicação nem callback de execução obsoleta.

RV24-01 e CF-009 permanecem **em_revisao**. O revisor deve emitir julgamento
delimitado do resíduo e de seu impacto no critério de falso sucesso, sem conclusão
automática de CF-009. H-RV24-01 ECONNRESET, RVA-03 e RJ-022-01/H24-01 continuam
separados e inconclusivos. CF-028 pronta apenas para especificação, não executada.
Limites: JSON Number legado, sem recompor custo histórico/posição, uma jornada
Chromium integrada, sem auditoria visual ou bancos reais. Lint/typecheck/build
aprovados pelo executor não são aprovação independente.
