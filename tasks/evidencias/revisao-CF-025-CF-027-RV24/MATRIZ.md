# Matriz de critérios e estados — candidato 06c1a51

> Referência posterior de 08/10/2026: [revalidação de propriedades](../revalidacao-RVR24-01-propriedades/README.md)
> encerrou RV24-01/CF-009. [Revisão dirigida CF-005–008](../revisao-dirigida-CF-005-CF-008/README.md)
> concluiu CF-007/008 e identificou RD58-01/02 em CF-005/006. A matriz e a fila
> abaixo conservam a data/base do parecer original, sem reescrita histórica.

Parecer corrente: [README](README.md). Critérios originais preservados nos arquivos canônicos; a tabela os identifica por ordem e resume sua prova. Histórico reutilizado é marcado explicitamente, sem convertê-lo em execução desta revisão.

| Tarefa / critério | Prova e origem | Decisão |
|---|---|---|
| RV24-01/1: probe causal | Nova execução do original idêntico; cinco falhas históricas reproduzidas, restore seis verdes; reenvio original já aceito em I/40e07ef | Aceite original preservado |
| RV24-01/2: efeito único após resposta perdida | Novas 6 jornadas normais + 6 respostas inválidas com backend/PG/reload e SQL | Atendido no recorte EXPENSE/BUY; demais modalidades com provas backend |
| RV24-01/3: conflito/nova intenção igual | Replay/409/duas intenções distintas, recibos por owner, SQL novo | Atendido |
| RV24-01/4: desconhecido sem falso sucesso | Originais null/array/vazio passam; novo bruto999/esperado200 é confirmado em três caminhos | **Não atendido: RVR24-01** |
| RV24-01/5: owner/ciclo invalidado | Original + residual43; sucesso/erro tardios, sessão, A→B→A, storage e recuperação ativa | Atendido; RVR24-02 encerrado |
| RV24-01/6: preservar R03/RV01 e RVA-03 | Aceite histórico de R03/RV01; regressões atuais de componentes; jornadas alteradas integradas | Preservado; não houve nova investigação de RVA-03 |
| CF-009/1: seleção/rollback | Aceites V/P de R01/R02 e R03/RV01; async-state e consumidores no gate236 | Preservado no alcance aceito |
| CF-009/2: erro/callback/retry/cancelamento | R03/RV01 não reaberto; callback obsoleto corrigido; bruto inválido ainda confirma | **Pendente por RVR24-01**, não pelo defeito R03 já encerrado |
| CF-009/3: isolamento A/B e dupla chamada | Aceites históricos I/J, componente atual e integração owner/recibo/PG | Preservado; não prova sessões simultâneas em todos os browsers |
| CF-009/4: evidência e testes não enfraquecidos | Logs/probes/hash/limites desta revisão e históricos | Atendido documentalmente; não neutraliza critério2 |
| CF-025/1: consultas/datasets | CSV/EXPLAIN novo3/30/120; mutação EAGER elimina a garantia de1 SELECT | Atendido |
| CF-025/2: projeção/paginação/valores | Teste SQL/serviços: IDs únicos,7 logs,20+10/count30/300; owner alheio | Atendido |
| CF-025/3: benefício/isolamento/locks/memória | Diferença única LAZY; counterproof; waiter PG commit/rollback, dias preservados, consumidores39; custo O(N) explicitado | Atendido no volume sintético; sem SLA/heap ilimitado |
| CF-025/4: evidência/limites | Comparação histórica corrigida + prova nova, sem mudança de expected | Atendido; **concluida** |
| CF-026/1: lint sem supressão | Diff completo, regras/config intactas, lint247 zero/zero | Atendido |
| CF-026/2: efeitos/hooks | Revisão dos bindings; parser/erro/protocolo/reorder; A→B→A/unmount; mutação geração4 vermelhos | Atendido no lote CF-026 |
| CF-026/3: types/build/fluxos | Typecheck/build novos; componentes236, unitários6×3; CF02623 restaurados | Atendido; RV24 posterior tem dono separado |
| CF-026/4: evidência/limites | Históricos confrontados e contraprovas novas; 19 não selecionados no filtro de mutação não são skips de produto | Atendido; **concluida** |
| CF-027/1: fronteira/acoplamento | Diff3 consumidores/porta/adaptador; constant pool; mutação acesso indevido falha | Atendido |
| CF-027/2: invariantes/schema/API | Comparação de fontes/resources, gate210, CF02430, proxy MANDATORY, rollback/owner/replay,12 jornadas | Atendido no recorte de intenção/recibo |
| CF-027/3: trade-offs/acoplamentos | README/MAPA; sequência não imposta por tipos, pacote público/teste, JSON transitivo, outros protocolos intactos | Atendido |
| CF-027/4: evidência/limites | Novas execuções duráveis substituem necessidade dos outputs perdidos; hashes/restaurações | Atendido; **concluida** |

## Estados e dependências

| Canônico | Antes → depois | Justificativa e efeito |
|---|---|---|
| CF-025 | em_revisao → concluida | Quatro critérios aceitos; satisfaz sua aresta CF-033 |
| CF-026 | em_revisao → concluida | Quatro critérios do lote aceitos; satisfaz suas arestas CF-032/034 |
| CF-027 | em_revisao → concluida | Fronteira delimitada aceita; satisfaz sua aresta CF-033 |
| RV24-01 | em_revisao → em_revisao | RVR24-01 residual; RVR24-02 encerrado individualmente |
| CF-009 | em_revisao → em_revisao | Critério de falso sucesso ainda não atendido |
| RV24-02 | concluida → concluida | Aceite I preservado; nove regressões de exclusão nesta rodada sem regressão |
| CF-019 | em_revisao → em_revisao | RVA-03 preservado; capacidade de dívida/abertura/parcelas liberada para especificação CF-028 |
| CF-028 | proposta → pronta | Somente especificação; nenhuma implementação/checkbox concluída |

CF-016/018/020/023 são dependências já concluídas de CF-028; aceites reutilizados, não reabertos nem concluídos por esta revisão. CF-019 oferece o recorte explicitamente liberado em README. CF-028 não depende diretamente de CF-025/026/027. CF-029/030/031 dependem de entregas de onboarding ausentes; CF-032 ainda depende de CF-022/031 e demais gates; CF-033 ainda depende de CF-032; CF-034 conserva marco CF-015/032/033. Nenhuma liberação integral dessas tarefas.

Contagem CF-001–027: 10/17 antes, **13 concluídas/14 em_revisao** depois. Exclui derivadas e CF-028. Não há meta de contagem.

## Fila curta de obrigações antigas, por critério

Não é autorização de nova bateria integral. Base: reconciliação anterior e aceites F/V/P/M/R/J/C/I, preservados. A revisão atual não encerra tarefas fora do recorte.

| Dono | Aceite preservado | Pendência/decisão dirigida |
|---|---|---|
| CF-005 | P05/data civil/virada/foco V/M | Decisão documental dos4 critérios com consumidores posteriores L/U; P01/P02 são adoção separada, não repetir P05 encerrado |
| CF-006 | Writers/DTOs/calendário V/M/J | Confrontar4 critérios/writers com provas existentes e limites de proveniência; gates reais CF-017 não desaparecem |
| CF-007 | P03/P04/P05 e jornadas temporais V/M | Parecer final de suficiência por critério; novas jornadas U corroboram EXPENSE/BUY, não toda adoção temporal |
| CF-008 | P03/R06/D16-T01/HTTP e erros V/M/C/I | Confronto documental restante; consumo de falso sucesso continua RVR24-01, sem reabrir transporte por associação |
| CF-009 | R01/R02/R03/RV01 e segregação | Saneamento do bruto e revalidação dirigida; H-RV24-01 investigação separada |
| CF-010 | Foco R08/geometria R10/R09/R11 | Zoom nativo200% com ações/scroll/foco; viewport menor não substitui |
| CF-011 | R07/sessão/exclusão RV24-02 | Recuperação por email com provedor falso E2E e confronto auth/preferência/erro/reload/teclado |
| CF-012 | R02/R12/erro/retry/F-018 | Células faltantes de moeda/privacidade/lista/detalhe/valores extensos/estados e zoom compartilhado |
| CF-013 | R03/RV01/R05/R06/R08 | Estados fatura vazia/aberta/paga/parcial, lista longa/mobile/zoom; RVA-03 com CF-019 |
| CF-014 | R01/R04/notas/CF020/021/DEC08 | Matriz por módulo/estado/modal longo; RVR24-01 e investigações de hábitos com seus donos |
| CF-015 | Encerramentos históricos e testes causais | Parecer de marco após lacunas CF010–014; não reduzir o marco a zoom apenas |
| CF-017 | Migrações descartáveis atéV13 | RV17-01 preflight incompatibilidades; RV17-02 fingerprint/restore; inventário/proveniência/writers/backup/adoção real autorizada |
| CF-019 | Domínio/parcelas/abertura/backend | RVA-03: correlação passiva pagamento120/saída ou recuperação sem novo POST |
| CF-022 | DEC08/backend/calendário/locks | RJ-022-01 ausência de POST e H24-01 scheduler, separadamente; CF025 concluída não os fecha |

Decisões documentais potencialmente resolvíveis com material já suficiente: fechamento por critério CF-005–008 e consolidação dos aceites backend já existentes, sem repetir provas encerradas nem inventar adoção. Faltam os julgamentos integrais explícitos dessas tarefas; esta revisão não os emite por associação. Verificações novas devem se limitar às células/garantias ausentes acima.
