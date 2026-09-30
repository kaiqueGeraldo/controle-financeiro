# DEC-08 — contrato aprovado em 30/09/2026

Fonte: critérios CF-022, SPEC-002/AC-TIME-010 e resposta explícita do usuário
"Aprovar essas regras" à proposta registrada nesta execução. A implementação
anterior é objeto de investigação, não fonte dos expected abaixo.

- Dia civil literal; hoje e fechamento automáticos em America/Sao_Paulo.
  Correções passadas são permitidas; dia futuro é rejeitado sem efeito.
- Semana de segunda a domingo, inclusive, mesmo atravessando dezembro/janeiro.
  Semanas fechadas atingindo a quantidade configurada (1 a 7 dias distintos)
  valem uma unidade de ofensiva. Semana aberta não incrementa ofensiva semanal.
- Diário: cada COMPLETED vale um; uma ausência após dia COMPLETED é perdoada
  (SKIPPED, sem ponto). Segunda ausência consecutiva encerra a sequência.
  FAILED encerra sequência. Dia atual ainda aberto não é falha.
- Recalcular ofensiva corrente e maior sequência após correção, considerando
  dias civis e lacunas; marcar dias separados não fabrica sequência consecutiva.
  Desfazer também corrige o recorde derivado do calendário. Não alterar perdão.
- Marcar/desmarcar é toggle: duas ações intencionais alternam o estado. O payload
  atual não contém estado desejado nem chave de intenção: retry HTTP de toggle
  não pode ser distinguido de nova ação. Unicidade de dia e atomicidade são
  obrigatórias; não prometer semântica idempotente de comando que o DTO não oferece.
- Cada dia marcado agrega exatamente 1 à meta NUMERIC do mesmo usuário.
  Desmarcar remove exatamente aquela contribuição; renomear hábito ou clicar
  dia retroativo não altera a identidade do efeito. Hábitos com mesmo nome são
  independentes. Meta monetária não admite progresso numérico sem fonte financeira.
- Cron repetido, inclusive após expiração do ShedLock, não altera resultado.
  Cron e marcação concorrentes precisam serializar a atualização do hábito.
  Falha em um hábito faz rollback desse hábito, sem invalidar commits anteriores;
  erro deve ser observável para retry. Não enviar e-mail.
- Ordem de processamento não apaga dia já observado: uma operação capturada antes
  da meia-noite e concluída depois de outra operação do dia seguinte corrige seu
  próprio dia, recalculando até o maior dia de calendário já observado no hábito.

## Exemplos sintéticos calculados antes da correção

| Cenário | Resultado esperado |
|---|---|
| 28/12/2026 e 03/01/2027 COMPLETED, meta semanal2; 04/01/2027 cron duas vezes | Semana 28/12–03/01, ofensiva1, maior1, dois logs e nenhuma nova contribuição pelo cron |
| Semana anterior completa e semana seguinte com apenas1 de2 dias | Ofensiva0; maior sequência anterior preservada |
| Diário 07/09 COMPLETED, 08/09 ausente, processamento09/09 | 08/09 SKIPPED; ofensiva1 |
| Diário anterior + 09/09 ausente, processamento10/09 | 09/09 FAILED; ofensiva0; maior1 |
| Diário 07/09 e 10/09 COMPLETED | Ofensiva1, maior1 (duas ausências interrompem) |
| Diário 07/09 e 09/09 COMPLETED | Ofensiva2, maior2 (uma ausência perdoada) |
| Meta inicial10, marcar06/09, renomear, desmarcar06/09 em07/09 | 11→10; efeito removido por identidade, não texto/data de auditoria |
| Dois hábitos de mesmo nome/meta/data | Progresso10→12; desfazer um12→11, outro efeito intacto |
| Instante04/01/2027 02:59:59Z versus03:05:00Z | Primeiro ainda domingo03/01 em Brasília; segundo fecha semana em04/01; JVM não interfere |

Legado sem vínculo de histórico não permite adivinhar contribuição por nome/data.
Uma desmarcação de COMPLETED legado vinculado a meta exige reconciliação explícita.
Não se backfilla identidade nem se certifica banco real desconhecido.
