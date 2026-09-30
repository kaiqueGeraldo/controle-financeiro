# Consolidação CF-016–CF-023

Base de revisão: `9ff1aec`; data do cliente: 30/09/2026. Estado oficial é
atualizado nos arquivos individuais pelos gates desta revisão. A conclusão
de uma tarefa se refere aos seus critérios; publicação e auditorias futuras
conservam gates próprios. Não se reexecutou a auditoria exploratória financeira
inteira: foram cruzados os critérios, pareceres, encerramentos e testes afetados.

| Tarefa | Estado consolidado | Critérios próprios e evidência de aceite | Pendência que permanece |
|---|---|---|---|
| CF-016 | concluida, preservado | Especificação: tabela sintética independente; abertura≠renda, pendente≠realizado, destinação≠patrimônio; precisão/taxas/estorno. SPEC-004/ORACLES, NG-01 decidido e revalidação dos oráculos atuais. RVA-01 foi defeito de implementação, encerrado posteriormente. | Verificador de preservação histórica estrita continua vermelho em pom.xml. Não aprova runtime, proveniência real ou publicação. |
| CF-017 | em_revisao, preservado | Migrações locais uma vez/reaplicação, upgrade de fixture, checksum, rollback/recuperação, Hibernate validate: parecer original e revalidações V1–V11; esta revisão acrescenta confronto e execução da V12. | RV17-01: preflight não compara todo inventário e aceita FK ausente. RV17-02: fingerprint de restore parcial. Inventário/schema/volumes/proveniência, backup/restore reais, rollout/writers e adoção continuam sem aceite. |
| CF-018 | concluida no escopo entregue | Abertura positiva/zero/negativa sem renda: Cf018RegressionIntegrationTest. Transferência/pêndencia/baixa/estorno único: regressões de comandos + encerramentos RVI-01/02/03/09/19 e SAN-D2. Falha na segunda perna e detecção de filtro/origem: integração, provas vermelhas/mutações originais. H-01 e política de fonte/arquivo aprovados independentemente. Parecer revalidacao-CF-016-CF-021 encerra os defeitos próprios. | Ordem global de locks, todos os writers em disputa, cache após commit e protocolo transversal são trabalho próprio CF-024; desempenho CF-025. Adoção real CF-017. Nenhum critério restante de CF-018 identificado no confronto. |
| CF-019 | em_revisao, preservado | Parcelas/ciclo/limite: DEC-03 e Cf019CardIntegrationTest. Pagamento/débito uma vez/recibo: RVI-11/12 e testes de intenção/fingerprint. Retry/cron/rollback: provas PostgreSQL originais. | RVA-03: pagamento120 confirmou POST200/débito/pagável0, mas modal ficou sem recuperação visível em15s. Falta classificar causalmente e comprovar a confiabilidade/recuperação do cenário. Repetições verdes e experimento sem POST não encerram essa obrigação de CF-019. |
| CF-020 | concluida no escopo entregue | Reserva300 de1000 sem criar patrimônio/capacidade: Cf020GoalAllocationTest, H-01/RVI-01. Custo/taxa/venda/cotação/precisão: Cf020InvestmentGoalIntegrationTest, MilestoneValuationTest e ResidualInvestmentRegressionTest. Exclusão/reembolso/origem/retry: MilestoneGoalFlowTest, RVI-13/14/15/16/17/18/21, SAN-B/C/C2 e card20/120. RVA-01/02 encerrados independentemente no parecer residual, com expected0,67→0,33→0 e rawNULL preservado. | RVA-03 conserva ressalva da interação de pagamento da CF-019 e do marco conjunto; não reabre por si só custo, exclusão ou reembolso já comprovados. Não é transferido para outra tarefa. Histórico desconhecido/adoção e concorrência transversal continuam nos gates próprios. |
| CF-021 | concluida no escopo entregue | Total global/filtros: Cf021ReportingIntegrationTest, RVI-04/08/10/20. Posição atual datada e histórico indisponível: RVI-05/06/07 e RVA-02 encerrado no parecer residual. XLSX/data/período/caixa: RVI-09/20, MilestoneReportingCoverage/Position/CashPresentationTest, SAN-E2 e H-02 com snapshot e writer independente. Mensagem mobile: RVI-22 encerrado no seu critério. | RVA-03 impede aceite integrado irrestrito da jornada afetada, mas não é defeito demonstrado de agregado/exportação. Zoom nativo200% continua CF-015; performance/carga e publicação permanecem pendentes. Nenhum critério próprio restante identificado. |
| CF-022 | em_revisao, preservado; backend aprovado | DEC-08; diário/semanal, marcar/desmarcar, efeito identificado, fronteiras, streak_as_of, concorrência/rollback/retry, V12 e consumidores GoalHistory. Scheduler real e contraprovas aprovados. Quatro jornadas browser passaram na execução diagnóstica. | RJ-022-01: tentativa semanal anterior sem POST, causa inconclusiva; verde posterior não fecha confiabilidade do caminho. Legado sem identidade exige reconciliação. SpecificDays/novo módulo fora do contrato; contenção/consultas/carga e adoção real não certificados. |
| CF-023 | concluida no escopo entregue | DEC-09; UUID assinado, tokens401, matriz de referências404/SQL, reorders, DTO/export/recibos, sessão/BFF/browser e contraprovas nesta pasta. Novos probes fecham as lacunas declaradas de move/realizations/note/copy. | JWT stateless: logout/reset não revoga cópia. BroadcastChannel Chromium sem fallback. Sem pentest exaustivo, carga, todos os browsers ou exclusão completa de usuário. |

## Encerramentos e fronteiras

Fontes cruzadas: [parecer original](../revisao-CF-018-CF-021/README.md),
[revalidação do marco](../revalidacao-CF-016-CF-021/README.md),
[revalidação residual](../revalidacao-CF-016-CF-021-residuais/README.md),
[CF-017 e achados](../revisao-CF-017/README.md), arquivos individuais CF-016–021.
Os pareceres antigos ficam intactos: refletem o candidato e a data original;
esta consolidação explicita o aceite por critério que faltava, sem apagá-los.

RVA-01 encerra também a borda residual de RVI-21/NG-01. RVA-02 encerra a
exposição remanescente vazia de CF-020 e sua leitura de CF-021; não certifica
custo baixado/ganho/proveniência históricos. RVA-03 não foi fechado, renomeado
ou transferido. CF-017 e CF-019 não se tornam concluídas para resolver o grafo.
H-01/H-02 continuam limitados às disputas/snapshot efetivamente testados.

CF-015/zoom nativo200%, RV17-01/RV17-02 e adoção real, CF-024/025/027/032,
lint global e cadeia CF-033–036 continuam gates de publicação. Nem concluir
um domínio nem liberar implementação local encerra esse conjunto.
