# Mapa do intervalo acumulado

Fotografia `fb986456a37a48afcafef204f165d15354294d26..56eb80b5cb867539d94995ec58b63ce2dbc519fa`.
SHAs completos de cada commit e33 arquivos de código em
[reconciliacao-git.json](reconciliacao-git.json). Intervalos abaixo são exclusivos
à esquerda/inclusivos à direita; aceites dependem do escopo da prova, não apenas
da presença de um commit. Nada deste intervalo está publicado na main consultada.

| Conjunto / commits | Arquivos/componentes | Parecer vigente | Limitações / próximo exame |
|---|---|---|---|
| Prontidão: fb986456..46b85ee0 (ec6d4e74, 46b85ee0) | Revisão CF034/CF017, plano A–D, configuração e cadeia main | Revisão documental preservada | Provedor observado26/10 é histórico, banco real desconhecido; reconferir antes de ação remota |
| PG16/17: fe770d9d | PgSchemaInventory, RestoreSnapshot, DatabaseVerificationCli, catalog.sql, suporte de testes | Revisão preparação A, 16.15/17.11 local | Mesma major em dump/restore; não prova upgrade16→17, ACL/RLS/globals/alvo real |
| Bootstrap/manutenção/jobs:02b43641 | Perfil adoption, spring.factories, initializer, OperationsState, MaintenanceFilter, SchedulerConfig, EmailService | Revisão preparação B | Flags por processo não congelam instâncias/transações/consumidores antigos; guard não é exclusividade de DB |
| Saúde:6e751934 | HealthController, SecurityConfig/Filter | Revisão preparação C | GETs mínimos, um borrow/isValid; não drift completo nem monitor contínuo do provedor |
| Preview:1982dc7c | BFF route.ts, vercel.json | Revisão preparação C, 14 contratos BFF | Depende VERCEL_ENV; arquivo não revoga deploy antigo/manual; destino externo não foi corrigido |
| Testes/pacote:8605ea42, 24844b59; revisão6f70a877..07c39637 | AdoptionRuntimeTest, SchedulingBoundaryTest, Email/Health tests, HabitIntegrity fixture, Dockerfile.release; scripts/evidências p05 | Revisão preparação A/B/C/E | p05 verify selecionou58 hábitos; provas financeiras de outras rodadas mantêm alcance; não suíte integral do pacote novo |
| Resume causal:07c39637..9bed5e20 | counterproof-checkpoint/observation/supervision/counterproofs; alocação real em48856abf | RVPLA-01 encerrado; reserva dinâmica aceita | Status1 isolado não vale como prova; prova causal+hashes+restauração; TCP/reuso tem aceite posterior próprio |
| Árvore própria:9bed5e20..3a6e95be (64105c97, 0cf06dc6, df3ac949, 0b4c6598, eb785362, 3a6e95be) | Helpers owned-process, owned-job-probe, runner/probes | RVPLA-03 encerrado no abandono original | Windows/mesma sessão, identidade/nascimento, sem extensão a Linux; handoff tratado no lote seguinte |
| Handoff:3a6e95be..9c27881c (5c751cb7, 1eb5bbdc, badecb55, 32d445e3, 9c27881c) | owned-command, Job de comandos, fronteira selada, worker | RVPLA-04 encerrado no handoff | Desconhecido bloqueia restore/complete/avanço; prazo de 20s é critério separado |
| Saída/audit:9c27881c..acaa6ed9 (762a085e, d254822b, 019a6ce3, 98869a1d, acaa6ed9) | Guardian, mailbox por slots imutáveis, contraprovas | EPERM causal aceito; prazo nesse ponto falhou | Detentor histórico não identificado; fixture alheia expirava naturalmente; não promover grupo completo antigo |
| Prazo residual:acaa6ed9..3b245d9d (e88ee50a, d8bd180a, 66f0ec62, 3b245d9d) | Verificações externas agrupadas em counterproofs | RVPLA-05/P2 encerrado, 3/3 no prazo de 20s |9 consultas/3 comandos/13 launches; sem cache/omissão de confirmação; não SLA universal |
| TCP:3b245d9d..c091abb8 (6af9e430, b8b645d0, b7a2c206, ed978c1d, c091abb8) | AdoptionRuntimeTest.close, AdoptionNativeSockets, teste Windows | TCP aceito Windows/JAR/PG16/17 |10s/5s+até2s de cleanup em erro; não certifica tuplas históricas. **CPA-01** no consumo CI/Linux |
| HQL:c091abb8..56eb80b5 (aa4749f3, ed42309f, 6cdf3a49, 56eb80b5) | Probes/agent/JFR/leitor e parecer final, sem produto | Startup local aceito; causa histórica E/inconclusiva não bloqueante para preparação |4 capturas, demais modos com provas anteriores, 40s obrigatório; leitor com envelope permissivo delimitado em CPA-02 |

Migrations V1–V16, queries/regras financeiras e POM não mudam entre a main e o
candidato, exceto ferramentas operacionais/controle de ingresso descritos. Não
há query nova de listagem ou N+1 introduzido nesse delta. A revisão não refaz a
auditoria do domínio financeiro. Entre produtor p05 e candidato, `src/main`, POM,
frontend e Dockerfile.release não têm delta; quatro arquivos do harness Java e
quatro helpers `.github/scripts` mudaram, além de scripts/documentação/provas em tasks.

A consolidação acrescenta somente documentação/provas. O achado CPA-01 cruza os
lotes TCP e CI; ele impede aprovação A do conjunto, preservando os aceites de
cada mecanismo. O saneamento não foi misturado ao aceite independente.
