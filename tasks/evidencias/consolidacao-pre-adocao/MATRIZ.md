# Aceites e pendências vigentes — fotografia28/10/2026

Atualização por [revalidação independente CPA-01/R1](../revalidacao-CPA-01-R1/README.md),
candidato81b20bca: **R1 encerrado localmente; parecer A — candidato apto a publicação
controlada e CI remota**. Seleção original/cobertura/pacote preservados. As demais
linhas mantêm o alcance anterior; não são novas execuções de produto ou Actions.
Os pareceres C anteriores permanecem históricos nos respectivos relatórios.

Base recebida56eb80b5, main fb986456. Fonte canônica é cada tarefa e o parecer final
do recorte. Linhas datadas anteriores permanecem históricas, inclusive vermelhos.

| Critério/capacidade | Estado atual | Fonte e alcance | Implicação |
|---|---|---|---|
| Startup local / 40s | Aceito localmente | [Revisão final HQL](../revisao-startup-HQL/README.md),[matriz](../revisao-startup-HQL/MATRIZ.md); quatro capturas18,925/13,824/19,652/18,669s; demais modos nas provas anteriores | Não bloqueia preparação; próxima falha bloqueia sua invocação e aciona reabertura; nenhuma suíte de 17 contratos nova aprovada |
| Causa histórica HQL | E/inconclusiva | Mesmo parecer final | Não é pré-requisito adicional de causa raiz; sem atribuição a TCP/query/carga |
| PG16/17 | Aceito localmente | [Preparação independente A](../revisao-preparacao-local-adocao/README.md) | Não certifica banco real/outras majors/globals |
| Guard/validação/migrations/writers/jobs | Aceitos localmente | Preparação independente B; controles HTTP/SQL e mutações estreitas | API adoption não migra; GO/jobs por reinício drenado; freeze real pendente |
| Saúde/preview | Aceitos localmente | Preparação independente C; BFF14 contratos | Probes mínimos e preview sem upstream; destinos/deployments antigos remotos pendentes |
| Resume causal RVPLA-01 | Encerrado no recorte | [Revalidação preparação A](../revalidacao-preparacao-local-adocao/README.md) | Provas/status/checkpoints não são cache de exit1 |
| Abandono/contenção RVPLA-03 | Encerrado no original | [RVPLA-03](../revalidacao-RVPLA-03/README.md) | Windows/mesma sessão/criadores controlados |
| Handoff/quiescência RVPLA-04 | Encerrado no recorte | [RVPLA-04](../revalidacao-RVPLA-04/README.md), aceites preservados pelas revisões posteriores | Não restaura/complete/avança sem inspeção conclusiva; não supervisor Linux |
| Prazo de retomada RVPLA-05/P2 | Encerrado | [Residual final](../revalidacao-RVPLA-05-residual/README.md), 3/3 no prazo de 20s, mínimo4,916s margem observada | Falhas anteriores continuam falhas; não margem normativa nova |
| Audit/EPERM | Correção causal aceita | [RVPLA-05](../revalidacao-RVPLA-05/README.md), preservado por residual final | Handle histórico desconhecido; novo audit limitado não aprova runner universal |
| TCP/reuso nativo | Aceito Windows/JAR/PG16/17 | [Revalidação final TCP](../revalidacao-TCP-reuso-nativo/README.md) | Originais3/3 por invocação; atribuição histórica qualificada; mecanismo preservado |
| Pacote p05/imagem local | Bytes/vínculo aceitos | Preparação independente E + [proveniência](PROVENIENCIA.md) | Sem atribuir build ao HEAD documental; próxima CI produz artifact próprio |
| Sanitização/CI local DEC-CI-04 | Aceite anterior preservado | Revalidação RCI034-R1 e contratos atuais | Seleção e agregação aceitas localmente; sem exceção nos gates integrais |
| Integração seleção/OS de CI | **Defeito original encerrado; cobertura preservada** | [Revalidação](../revalidacao-CPA-01/SELETOR.md);Linux100/115 + Windows1 =101/116,15 históricos | Não reabrir a seleção por associação; jobWindows ainda sem execuçãoActions |
| Agregação de status required | **CPA-01/R1/P2 encerrado localmente** | [Nova revisão independente](../revalidacao-CPA-01-R1/README.md),500 combinações/CLI/YAML/7 mutações | Pronto para publicação controlada/CI remota; nenhuma aprovação Actions ou proteção configurada por associação |
| Leitor JFR como JSON estrito geral | **CPA-02/P3 aberto, delimitado** | Parecer HQL e 2 entradas inválidas reproduzidas | Não invalida capturas atuais conferidas; corrigir antes de ampliar uso/aceite do leitor |
| Zoom nativo 200% CF010/015 | Pendente local | Tarefas canônicas, DEC-CI-04 | Sem defeito presumido; gate integral/uso preservado |
| CF034 integral/matriz remota | `em_revisao` | CF034, matriz CF034 de prontidão; remoto anterior smoke não testa este candidato | Required atual novo, expanded13CF032/15 harnesses e limites de cancelamento pendentes |
| CF017/P01/P02/adoção real | `em_revisao` | Tarefas canônicas, plano A–D/runbook | Falta alvo/schema/proveniência temporal, backup/restore, freeze/coordenação reais; sem baseline/DDL autorizados |
| Configuração remota | Pendente de reconferência/tratamento | Inventário26/10 é histórico;[próximo plano](PUBLICACAO-CI.md) | Não presumir autodeploy off, previews isolados, DDLvalidate/flags/health corretos hoje |
| CF035/036 e produção | `proposta` / não liberadas | Tarefas de release e plano A–D | CI verde não autoriza ativar, adotar, deploy ou uso |

Critérios de startup/TCP/RVPLA aceitos não aparecem como bloqueios atuais. O
impedimento de CI foi encerrado no recorte local por revisão independente; suas
reproduções anteriores permanecem históricas. Não há bloqueio genérico por `em_revisao` nem dispensa dos critérios
integrais ainda faltantes. Nenhum checkbox integral foi marcado nesta execução.
