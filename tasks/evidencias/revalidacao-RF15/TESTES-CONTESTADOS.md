# Decisão independente sobre as três provas

Candidato db2d77d, teste original preservado em cards-planning-audit.original.txt. A execução contested-before.log reproduziu 3 falhas e4 aprovações. Os três casos exercitam InvoiceDetails real em jsdom: OPEN, CLOSED e PAID, competência09/2026, cartão fechamento30/vencimento10, relógio08/09/2026. Fixture original omite closingDate/dueDate; expected30ago/10set era inferido por regra anterior à DEC-03. Candidato mostra marcador de data ausente, conforme SPEC002 DEC05.

DEC-03 define competência do fechamento e vencimento nominal estritamente posterior: setembro fecha30/09/2026 e vence10/10/2026. Não há interpretação válida que torne agosto fechamento da competência setembro. Status da fatura não muda essas datas civis.

| Caso | Decisão | Cobertura mantida |
|---|---|---|
| OPEN | Expectativa antiga incompatível | Aberta, Adiantar Fatura habilitado, datas30set/10out |
| CLOSED | Expectativa antiga incompatível | Fechada, Pagar Fatura habilitado, mesmas datas |
| PAID | Expectativa antiga incompatível | Paga, Fatura Paga desabilitado, mesmas datas |

Atualização ativa somente do teste: incluir datas explícitas da API e corrigir os dois literais. Nenhuma assertion retirada; casos de erro, lista80 e reconciliação preservados. Ausência/data inválida continua coberta por rf15-causal.

Contraprova em cópia isolada de db2d77d: mesmo teste corrigido com InvoiceDetails de bc5532c reintroduzindo fórmula antiga →3 falhas nas datas/4 aprovações (counterproof-old-formula.log). Restaurar fonte do candidato na cópia →7/7 (counterproof-restored.log). counterproof.json confirma teste idêntico, cópia restaurada e fonte principal intacta. Script run-counterproof.ps1 não sobrescreve cópia anterior. Nenhuma mutação de produto na árvore principal.

Seleção ampla com os três testes incluídos:14 arquivos/115 testes aprovados (components.log), mesma seleção informada pelo executor, sem reduzir para esconder falhas. Esse gate não aprova automaticamente browser, foco residual, zoom ou RVA-03.
