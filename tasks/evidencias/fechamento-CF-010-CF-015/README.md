# Parecer independente CF-010–CF-015 — 11/10/2026

**CF-011 concluída. CF-010, CF-012, CF-013, CF-014 e CF-015 permanecem em_revisao.** A revisão foi encerrada com decisões por critério; o marco não foi aprovado. Não houve alteração de produto.

Base examinada: `62ca2366053d04cb74abf4b7442669ec223fa160`, branch `codex/cf-028-contrato-onboarding`. `a7bc256` é ancestral. Aceites `681102b`, `e4079a9`, `9ff1aec`, `06c1a51`, `0c068d9`, `b5e8550` e `40e07ef` estão presentes. Nenhum delta de produto acima da base informada. As alterações durante esta execução são probes, evidências e documentação.

O README da raiz era a única alteração inicial, staging vazio. Seu SHA256 permaneceu `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`; fica fora dos commits. Não houve push, deploy, merge, reset, clean, onboarding ou acesso a banco real. CF-028 conserva aceite exclusivamente de especificação.

## Resultados por etapa e tarefa

| Etapa | Parecer | Critérios atendidos e impedimentos específicos |
|---|---|---|
| A / CF-010 | em_revisao | Geometria em 360/768/1440, temas e diálogo de fatura/pagamento aninhado revalidados; aceites R08/R10/R12 preservados. Zoom nativo 200% não aplicado por limitação documentada da ferramenta. Defeitos de consumidores RF15-01/03 têm donos CF-014/012, sem imputar falha ao componente compartilhado. |
| B / CF-011 | concluida | Recuperação mobile por teclado com email falso e backend real; código inválido/reutilizado e senha antiga rejeitados, nova senha permite login após reload. Preferência persistida, erro 503 sem alteração fictícia; tema e reload. Download 500 não emite arquivo; exportação real retorna binário ZIP/XLSX. Reutilizados R07, sessão CF-023 e exclusão RV24-02; componentes de auth/configurações passaram. Não há impedimento próprio remanescente. Zoom da CF-010 não é aceite próprio desta tarefa e não impede esta conclusão delimitada. |
| C / CF-012 | em_revisao | Lista de 100 lançamentos, páginas 30→60, filtro vazio/entradas e reload, saldo real 100; moeda extensa/negativa e estados de erro em componentes. F018/CF-021 e temporal aprovados continuam válidos. RF15-02 expõe saldo arquivado no modo privacidade; RF15-03 impede Escape no detalhe. Não se infere correção financeira pela aparência. |
| D / CF-013 | em_revisao | Fatura longa e ação mobile, aninhamento/foco, vazio/aberta e pagamentos parciais/integrais do saldo têm prova. RF15-04 mostra fechamento/vencimento e atraso falsos no detalhe. RVA-03 não reproduzido no experimento delimitado, causa permanece inconclusiva. Adiantamento integral com status OPEN não equivale à prova visual do estado PAID. |
| E / CF-014 | em_revisao | Nota anual/reload, posição desconhecida explícita, investimento sem cotação, meta numérica vinculada e checklist com pagamento têm prova; R01/R04, RD58, CF-020/021 e RV24-01 preservados. RF15-01 bloqueia nome acessível de criação mobile. Clique semanal atual envia POST200 e persiste 0→1→0; não determina causa histórica RJ-022-01. Matriz delimita estados e modais ainda sem nova prova suficiente. H24-01 segue separado sob CF-022. |
| F / CF-015 | em_revisao | Relatório e regressões dirigidas produzidos; aceites causais anteriores preservados. RF15-02/04 são P1, RF15-01/03 P2, além das lacunas explícitas. Impedem alegar conclusão do marco. CF-017 não foi usado como veto à validação local. |

## Evidências e continuidade

- [Matriz pré-execução](MATRIZ-PRE.md) e [matriz final por critério](MATRIZ.md).
- [Achados, investigações e saneamento delimitado](ACHADOS.md).
- [Execuções, comandos e limites](EXECUCOES.md), [inspeção visual](VISUAL.md) e [primeiras ocorrências/harness](OCORRENCIAS.md).
- Logs/JSON/SQL/capturas em `browser/`, com hashes no `MANIFEST-SHA256.txt`. Contagens de execuções sobrepostas não são novos casos únicos.

Próximo saneamento: corrigir somente RF15-01–04, começando por privacidade e datas da fatura; executar seus probes vermelhos sem alterar expected. Em trilha de verificação separada: zoom nativo, estado PAID e recortes de modais/estados indicados na matriz. RVA-03 e RJ-022-01 exigem experimento causal delimitado, não séries de retries. Não iniciar CF-029–034 nem reabrir R03/RV01, RV24-01/02 ou RD58 já aceitos.
