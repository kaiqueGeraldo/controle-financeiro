# Plano de execução do monorepo

Prioridade: corrigir divergências de horário, calendário e apresentação no frontend; depois consolidar integridade financeira, onboarding e publicação. Criado em 07/09/2026 a partir do [SDD](../docs/sdd/README.md).

Estas são tarefas versionadas no repositório, abrangendo frontend e backend. Cada arquivo pode orientar uma tarefa no Codex. Criar os arquivos não inicia agentes, não muda o modelo desta conversa nem agenda execuções.

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

Revisão independente de 09/09/2026: [parecer CF-001–009](evidencias/revisao-CF-001-CF-009/README.md).
CF-005/006/007/008 retornaram a `em_revisao`; resultados verdes parciais não
fecham os contratos e cenários pendentes. Consultar o parecer antes de avançar.

Estados: `proposta`, `pronta`, `em_execucao`, `em_revisao`, `concluida`, `bloqueada`. Todas as tarefas começam propostas ou prontas; escrever esta lista não significa executar seu conteúdo. `Concluida` exige os critérios da tarefa e evidência verificável. Dependência concluída precisa estar integrada na base usada pela próxima tarefa.

Se uma investigação não reproduzir um defeito, registrar cenários executados e manter a incerteza. Não inserir alteração especulativa para justificar o fechamento. Defeitos novos recebem ID e tarefa derivada pelo [template](templates/TAREFA.md).
