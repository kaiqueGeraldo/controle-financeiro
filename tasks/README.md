# Plano de execução do monorepo

Prioridade: corrigir divergências de horário, calendário e apresentação no frontend; depois consolidar integridade financeira, onboarding e publicação. Criado em 07/09/2026 a partir do [SDD](../docs/sdd/README.md).

Estas são tarefas versionadas no repositório, abrangendo frontend e backend. Cada arquivo pode orientar uma tarefa no Codex. Criar os arquivos não inicia agentes, não muda o modelo desta conversa nem agenda execuções.

## Situação vigente — saneamento CF-022, 17/10/2026

**CF-022 permanece em_revisao. Critério4 implementado localmente, aguardando
revalidação independente.** Date-only no harness de hábitos e schema/contexto por
método saneados; regressões, quatro jornadas reais/reload/SQL,27 casos originais e
contraprova2→1006→2 registrados com falhas/limites.
[Candidato e encaminhamento preciso](evidencias/saneamento-CF022/README.md).
Critérios1–3 e aceites anteriores preservados; timeouts históricos inconclusivos.
CF029 conserva prontidão somente local/descartável, sem execução; zoom200% e adoção
real continuam separados. Nenhuma publicação ou integração deste lote à main.

## Situação anterior — revisão CF-022, 16/10/2026

**CF-022 permanece em_revisao**, exclusivamente pelo saneamento do relógio do
harness de hábitos e isolamento das fixtures do scheduler (critério4). Critérios
funcionais1–3 sustentados; nenhuma correção de produto indicada. RJ-022-01/H24-01
mantêm causalidade histórica inconclusiva, sem exigir reprodução retroativa para
fechamento. [Parecer independente, contraprovas e próximo lote restrito](evidencias/revalidacao-CF022/README.md).
CF029 conserva prontidão exclusivamente local/descartável; não executada. Aceites
RVA03/CF019/013/011/012/014 e pendências zoom200%/adoção real preservados.

## Situação anterior — RVA-03, 16/10/2026

**CF-019 e CF-013 concluídas.** Revisão independente do candidato18c7150 aprova
o mecanismo causal e a correção Date-only do harness. RVA-03 encerrada no recorte
demonstrado, com atribuição histórica sustentada sem medição retroativa inventada.
**CF-015 continua em_revisao por zoom nativo200%**, sem aceite global/publicação.
CF011/012/014 preservadas; CF017/P01/P02 mantêm adoção real. CF029 conserva
prontidão anterior somente local/descartável; nenhuma implementação iniciada.
[Parecer, matriz integral, provas e próximo trabalho delimitado](evidencias/revalidacao-CF019-RVA03/README.md).

## Situação anterior CF-010–CF-015 — histórico, 14/10/2026

**CF014 concluída** após revisão independente do histórico invisível: causa no
harness demonstrada, correção Date-only aceita, pintura/interação/reload e banco
inalterado comprovados. Critérios acumulados satisfeitos; CF011/012 e RF15-01–04
preservados. **CF015 em_revisao** por zoom nativo200% e RVA-03, sem aceite global.
Falha do observador preservada e corrigida separadamente; controles finais3/3.
[Parecer, matriz vigente e próximo trabalho restrito](evidencias/revalidacao-CF014-historico-invisivel/README.md).

## Situação anterior — ciclo visual e candidato de harness, 14/10/2026

Diagnóstico posterior do executor, base8096b22: [histórico invisível CF014](evidencias/investigacao-CF014-historico-invisivel/README.md)
atribuído ao relógio do harness por contraprova causal e fixture persistida;
ajuste somente de teste. Aguarda revisão independente, sem concluir CF014/015
ou alterar os aceites abaixo.

Encerrado independentemente o **P2 confirmado — CF014, ciclo visual da operação (vínculo RVR24-02)** em0f9beb1. CF014 continua em_revisao pela investigação específica de histórico invisível; CF015 conserva essa pendência, zoom nativo e RVA-03. CF011/012 e RF15-01–04 preservados. Nenhuma nova tarefa integralmente concluída. Seleção ampla219/219; os dois timeouts anteriores continuam inconclusivos quanto à causa, sem novo bloqueio por associação. [Parecer, provas e próximo passo restrito](evidencias/revalidacao-RVR24-02-ciclo-visual/README.md).

## Situação anterior CF-010–CF-015 — 13/10/2026

Candidato posterior do executor: [saneamento exclusivo do P2 de ciclo visual CF014, vínculo RVR24-02](evidencias/saneamento-RVR24-02-ciclo-visual/README.md), base cbbf58d. Aguardando revalidação dirigida, sem alterar os aceites/estados independentes abaixo.

Revalidação independente de a991114: RF15-02/04 e resíduos originais CF014 encerrados; **CF012 concluída**, CF011 preservada. CF010 segue por zoom nativo; CF013 por RVA-03 inconclusivo; CF014 por P2 confirmado de resposta tardia A→B e ocorrência visual inconclusiva; CF015 conserva essas pendências específicas. [Parecer, critérios completos e próximo trabalho delimitado](evidencias/revalidacao-residual-RF15/README.md). Sem alteração de produto ou aceite global por associação.

## Situação anterior CF-010–CF-015 — 12/10/2026

Revalidação independente do candidato db2d77d: RF15-01/03 encerrados; RF15-02/04 parcialmente saneados, com exposição visual na transição e atraso desatualizado na aba aberta. Resíduos de Escape/foco CF014 confirmados. CF010/012/013/014/015 permanecem em revisão; CF011 conserva conclusão. [Parecer atual e saneamento restante delimitado](evidencias/revalidacao-RF15/README.md). Zoom é verificação faltante; RVA-03 investigação inconclusiva, sem veto por associação.

## Situação anterior CF-010–CF-015 — 11/10/2026

CF-011 concluída após fechamento independente de recuperação, preferências e download. CF-010/012/013/014/015 seguem em revisão por defeitos e lacunas específicos. [Parecer completo e próximo saneamento delimitado](evidencias/fechamento-CF-010-CF-015/README.md). Aceites anteriores CF-005–009, RV24-01/02, CF-025–027 e CF-028 documental preservados.

Saneamento RF15-01–04 preparado localmente, sem alteração dos estados acima. [Candidato do executor e pendências delimitadas](evidencias/saneamento-RF15/README.md); aceites dependem do mesmo revisor.

## Por onde começar

1. Executar CF-001 para fixar critérios e casos independentes do código.
2. Preparar CF-002 e CF-003; esses ambientes usam somente dados sintéticos e não dependem de reativar produção.
3. Seguir CF-004 a CF-014 respeitando dependências e concluir a revisão CF-015. Esse é o primeiro marco: datas e frontend.
4. Seguir o catálogo para integridade, onboarding e liberação. Trabalho de especificação financeira pode avançar antes, mas não deve retirar prioridade dos defeitos relatados.

O [catálogo](CATALOGO.md) lista as 36 tarefas, dependências e modelos. O estado oficial está em cada arquivo individual; o catálogo não duplica status.

A [rastreabilidade](RASTREABILIDADE.md) relaciona todos os achados F e os 12 épicos anteriores às tarefas executáveis.

## Organização

```text
tasks/
  README.md
  CATALOGO.md
  EXECUCAO.md
  MODELOS.md
  POLITICA-DE-TESTES.md
  00-fundacao/           CF-001 a CF-003
  01-datas-integracao/   CF-004 a CF-009
  02-frontend/           CF-010 a CF-015
  03-integridade/        CF-016 a CF-027
  04-onboarding/         CF-028 a CF-032
  05-release/            CF-033 a CF-036
  templates/
  evidencias/
```

## Regras comuns

- Ler [execução](EXECUCAO.md), [política de testes](POLITICA-DE-TESTES.md) e o arquivo da tarefa antes de trabalhar. A regra expressa do usuário é: testes devem avaliar o código, não ser moldados para passar.
- Preservar o patch inicial já existente. CF-005 amplia e valida as correções de calendário; não recomeça o trabalho nem presume validação visual concluída.
- Cada correção pertence à tarefa que a implementa, junto com testes e evidências. CF-015 e CF-033 são revisões adicionais, não substitutos dos testes durante implementação.
- Não prometer ausência absoluta de bugs. O aceite exige comportamento especificado, falhas conhecidas tratadas, testes capazes de detectar regressão e riscos residuais registrados.
- Caminhos de escopo são relativos à raiz. Alterar arquivo compartilhado fora do escopo só com justificativa, atualização da tarefa e nova validação dos consumidores.
- A pasta tasks é a fonte de execução. docs/sdd guarda regras, decisões e evidências históricas. [Mapa dos antigos épicos](../docs/sdd/tarefas.md) mantém a rastreabilidade.

## Prontidão

Atualização CF-028 de10/10/2026, base `a7bc256`:
[aceite independente final](evidencias/revalidacao-CF-028-totais/README.md).
**CF-028 concluída exclusivamente como especificação; R28-01/02 encerrados.**
Próximo trabalho planejado: fechamento dirigido CF-010–015, não iniciado nesta
revisão. Nenhuma liberação automática de CF-029–034 ou implementação de onboarding.
As notas datadas anteriores abaixo permanecem históricas no recorte CF-028.

Parecer vigente de 09/10/2026 sobre `0c068d9`, intervalo `18cd6df..0c068d9`:
[revalidação independente RD58](evidencias/revalidacao-RD58/README.md).
RD58-01/02 aprovados; **CF-005 e CF-006 concluídas** após confronto de critérios
e obrigações originais com os aceites acumulados. CF-007/008 preservam conclusão
local da [revisão dirigida anterior](evidencias/revisao-dirigida-CF-005-CF-008/README.md).
P01/P02/CF-017 mantêm adoção real separada. CF-025–027, RV24-01 e CF-009 já
possuem aceites posteriores às notas históricas. Liberação de CF-028 somente
para especificação preservada; nenhum fechamento geral de CF-010–015.

Atualização dirigida de08/10/2026: [revalidação independente RVR24-01/P2](evidencias/revalidacao-RVR24-01-propriedades/README.md),
candidato `b5e8550`, encerra o resíduo e conclui RV24-01/CF-009 após confronto
individual dos critérios. Aceites e investigações dos demais recortes preservados.
CF-028 conserva a liberação anterior **somente para especificação**, sem execução
ou autorização de publicação. O registro datado de03/10 abaixo permanece histórico;
os arquivos individuais continuam sendo a fonte canônica de estado.

Parecer corrente do recorte em 03/10/2026: [revisão independente CF-025/026/027 e RV24](evidencias/revisao-CF-025-CF-027-RV24/README.md), base `06c1a51`, com [matriz de critérios/estados](evidencias/revisao-CF-025-CF-027-RV24/MATRIZ.md). CF-025/026/027 concluídas; RV24-01/CF-009 em revisão por RVR24-01, RVR24-02 encerrado. CF-028 pronta **somente para especificação**, sem implementação nem liberação automática das sucessoras. Demais aceites e investigações preservados; snapshots abaixo permanecem históricos.

Consultar o [snapshot documental de 01/10/2026, CF-001–026](evidencias/consolidacao-CF-001-CF-026/README.md)
e sua [reconciliação CF-001–027 de 03/10/2026](evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md),
com os pareceres referenciados. A revisão inicial de CF-001–009 é histórica:
P03/P04/P05 foram revalidados posteriormente; P01/P02 conservam gates de adoção.
Os arquivos individuais continuam sendo a fonte canônica de estado.

Estados: `proposta`, `pronta`, `em_execucao`, `em_revisao`, `concluida`, `bloqueada`. Todas as tarefas começam propostas ou prontas; escrever esta lista não significa executar seu conteúdo. `concluida` exige os critérios próprios e o aceite aplicável com evidência verificável; `em_revisao` não significa concluída. `bloqueada` exige impedimento concreto ao trabalho da própria tarefa.

Para iniciar um recorte dependente, exigir conjuntamente: implementação integrada
na base usada; aceite exigido ou liberação independente explícita da capacidade
consumida; ausência de bloqueante concreto nesse recorte; referência ao parecer,
base, consumidor e limitações. Seguir o [procedimento de execução](EXECUCAO.md).
Liberação parcial não exige concluir a origem, não aprova produção e não dispensa
testes dos caminhos alterados. Mudança posterior que afete a garantia consumida
exige reconferência. Gates de adoção real não impedem automaticamente trabalho
em ambiente descartável; nenhuma destas regras permite ignorar dependências.

Se uma investigação não reproduzir um defeito, registrar cenários executados e manter a incerteza. Não inserir alteração especulativa para justificar o fechamento. Defeitos novos recebem ID e tarefa derivada pelo [template](templates/TAREFA.md).


Saneamento residual RF15 do executor (12/10/2026): [evidências e matriz](evidencias/saneamento-residual-RF15/README.md). CF010/012/013/014/015 permanecem em_revisao; CF011 concluída. Sem aprovação do marco, onboarding ou tarefas posteriores.
