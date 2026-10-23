# Revisão independente CF-032 — 23/10/2026

**Não aprovada integralmente; manter em_revisao. Critérios 1 e 4 sustentados;
critérios 2 e 3 pendentes, com subgarantias preservadas.** Nenhuma correção de produto.

Candidato `123e5a5e3625f6958d15992794b63ba1e1e3db17`, base
`331d3344c24dc60f5e1940989b9a35c0d5da1aa6`, branch
`codex/cf032-e2e-financeiro`. Intervalo examinado: 065c609, 995efb8, 123e5a5.
Não havia commits posteriores ao candidato; staging inicial vazio e somente
README.md raiz modificado, com o hash histórico informado. O intervalo não altera
src/main backend nem src frontend. O aceite 9d80d2e da CF031 é ancestral da base.
Instruções do usuário, EXECUCAO, POLITICA-DE-TESTES, tarefa, SPEC001/002/004,
DEC-ONB-03 e aceites localizados CF021/CF031 orientam esta análise.

## Parecer

| Achado preservado | Resultado independente | Prioridade |
|---|---|---|
| CF032-01 | Confirmado: PUT aceita/persiste reserva em fonte UNBOUNDED sem independência comprovada | P2, primeiro saneamento |
| CF032-02 | Confirmado: UI usa fatura corrente; 950 em vez de 656, também em nova sessão | P2 |
| CF032-03 | Confirmado na identificação visual/acessível; IDs e seleção dos dois detalhes preservados | P2 |
| CF032-04 | Confirmada truncagem em texto no XLSX: inlineStr 12:34, banco 12:34:56; não é formato ocultando segundos | P3 |

Para CF032-04, a SPEC002 define saída canônica HH:mm:ss e conservação semântica
na exportação (AC-UI-005/011); a exceção HH:mm é de UI compacta. Não foi localizada
exceção normativa para o arquivo. Este parecer aplica a regra geral ao arquivo de
detalhe e confirma P3; uma política diferente exige decisão explícita versionada,
não troca silenciosa do expected. Não houve perda do valor no banco.

Nova reprodução dirigida: **8 cenários, 4 passam/4 falham** exatamente em C/E2/K/L.
Três probes adicionais: R1 passa; R2 falha somente no limite, completando a prova
de seleção distinta dos investimentos; R3 falha somente nos segundos do XLSX,
com entrada/API/GET/SQL preservados. Reconciliação independente de 8 checkpoints
de B/C aprovada. Os 13 cenários históricos continuam sendo 13, com 9/4; não somar
reruns, controles ou subassertions como casos novos.

O patrimônio final 1518.57 e caixa livre 836.90 estão sustentados nos caminhos B/C.
Isso não torna correta a disponibilidade mostrada no cartão nem autoriza reservas
com conhecimento incompleto. Recibo de onboarding é snapshot da aplicação; deve
continuar com 1451.00 após movimentos, sem ser confundido com posição atual.

[Matriz por critério](MATRIZ.md) · [Achados e encerramento](ACHADOS.md) ·
[Reconciliação e XLSX](RECONCILIACAO.md) · [Execuções e limites](EXECUCOES.md).

## Encaminhamento delimitado

1. Backend/domínio de reservas: incorporar conhecimento e incidência das pendências
   na autorização dos writers cotidianos, sob a fronteira transacional existente.
   Não bloquear débitos reais nem exigir reconciliação global. Revalidar E2 e os
   controles positivos/independência, incluindo concorrência e consumidores.
2. Frontend/cartões: consumir committedLimit/availableLimit com incompletude explícita
   no resumo, cartão e barra. Revalidar K, sessão nova, encargos/futuras/créditos.
3. Frontend/investimentos e descrições backend: fallback pelo nome quando ticker
   ausente; preservar IDs. Revalidar L e duas posições sem ticker, detalhe/operação,
   privacidade e nomes acessíveis. Não tornar ticker obrigatório.
4. Backend/exportação: preservar segundos no valor textual; verificar XML, API/SQL
   e leitores. Se optar por minutos, aprovar primeiro exceção contratual explícita.

Depois, revalidação independente dos probes originais e consumidores afetados.
Não iniciar CF033/034: ambas dependem de CF032; CF033 também de CF025/027 e CF034
de CF015/026/033. Nenhuma sucessora foi alterada ou iniciada. CF021/029/030/031 e
demais aceites não são reabertos integralmente; os recortes novos estão acima.

DEC-ONB-03 permanece local/descartável. Zoom nativo 200% CF010/015, adoção real
CF017/P01/P02 e desempenho de produção não foram aprovados. Sem push, merge,
deploy, banco real, exclusão de branch, clean ou limpeza de target.
