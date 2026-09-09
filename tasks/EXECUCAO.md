# Como executar uma tarefa

## Preparação

Abrir uma tarefa de cada vez e selecionar o modelo/esforço registrados nela. As recomendações são metadados para o operador; Markdown não configura o Codex automaticamente. Começar CF-001 com GPT-6 Astra, esforço xhigh.

Antes de executar: ler instruções do repositório, estado Git e mudanças locais. Há alterações do primeiro diagnóstico ainda não commitadas; não descartá-las. Para trabalho em branches/worktrees, incluir essas mudanças de forma deliberada numa base revisada antes de derivar outras branches. Um checkout a partir de main pode não conter o lote inicial.

Padrão de branch sugerido: `codex/cf-005-datas-frontend`. Não criar branches nem iniciar tarefas só por ler este guia.

## Prompt para implementação

```text
Execute a tarefa tasks/<pasta>/CF-XXX-<nome>.md neste monorepo.
Leia tasks/README.md, tasks/POLITICA-DE-TESTES.md e as referências da tarefa.
Confira dependências e alterações locais antes de editar; preserve trabalho existente.
Defina o resultado esperado a partir da especificação, reproduza o problema e construa
um teste que detecte o comportamento incorreto antes de corrigir. Para código já corrigido,
demonstre uma regressão ou mutação controlada em ambiente isolado e restaure ao final.
Implemente somente o escopo desta tarefa, com testes unitários, de integração ou E2E
proporcionais ao risco. Não mude resultados esperados para acomodar o código atual.
Registre comandos, resultado anterior/posterior, limitações e artefatos em
tasks/evidencias/CF-XXX/. Atualize o estado da tarefa com honestidade.
Se a regra estiver ambígua, registre a decisão necessária e avance no trabalho independente.
Não use produção para testes, não envie notificações reais e não faça deploy nesta tarefa,
exceto quando a própria tarefa e o pedido em execução autorizarem a publicação.
```

## Prompt para revisão independente

```text
Revise a tarefa CF-XXX usando seu arquivo de escopo, a especificação e o diff real.
Construa primeiro os resultados esperados pela regra de negócio e só então confronte
implementação e testes. Tente invalidar a solução com casos de borda, erros, concorrência
e respostas fora de ordem. Teste que passa sem executar a regra é insuficiente.
Verifique se a regressão falha pelo defeito e não por erro de ambiente/importação.
Não aprove snapshots automaticamente nem altere testes para aceitar o comportamento atual.
Registre achados com severidade, reprodução e critério violado. Se não houver achados,
informe o escopo efetivamente verificado e as limitações. Não declarar ausência total de bugs.
```

Revisão independente significa outra execução e uma análise do contrato sem usar a conclusão do implementador como prova. Trocar o modelo por si só não garante independência.

## Fechamento e concorrência de trabalho

Entregar código + testes + evidência + atualização da especificação quando necessária. Um verde obtido após retries não apaga falha na primeira tentativa. `Em_revisao` não é `concluida`.

Por padrão executar sequencialmente. Se o usuário iniciar tarefas em paralelo, usar worktrees isoladas, dependências integradas e um responsável por merge; não compartilhar banco de teste mutável. CF-002/003 podem avançar separadamente. CF-005/006 podem avançar após CF-004. CF-011/012/013/014 podem avançar após CF-010 e suas outras dependências. Revalidar o conjunto após integração.

Reservar edição exclusiva de package.json/lockfile/configuração de testes a CF-003 inicialmente; helpers temporais a CF-005/006; modais/layouts comuns a CF-010; migrações a CF-017 e, depois, à tarefa dona da mudança de schema. Não editar simultaneamente o mesmo arquivo em branches diferentes sem coordenação explícita.

## Limites e bloqueios

Falta de Docker local não autoriza testar em banco real: usar CI/ambiente de desenvolvimento descartável documentado. Estado do banco Railway ainda desconhecido bloqueia migração/publicação desse banco, mas não os testes sintéticos nem a investigação de UI. Credenciais ficam fora de commits e evidências.
