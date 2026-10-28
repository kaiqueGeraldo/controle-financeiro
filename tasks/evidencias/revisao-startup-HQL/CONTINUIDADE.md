# Prontidão e próxima autorização

**Startup local deixou de ser impedimento geral da preparação.** Investigação
histórica inconclusiva não bloqueia preparar consolidação/revisão do lote e plano
de validação do candidato. A liberação consome a capacidade de startup/controles
locais da matriz, não o aceite integral das tarefas de release/adoção.

Conferidos os estados canônicos, DEC-CI-04, EXECUCAO e os pareceres posteriores:
RVPLA-01/03/04/05 e audit/EPERM têm aceites específicos; TCP/reuso Windows/JAR/PG16/17
está aceito. Não há resíduo local novo demonstrado nesses caminhos que exija
reabrir as tarefas para este preparo. Produto e inputs relevantes não mudaram
desde seus aceites. Esta revisão não converte seus alcances em garantias Linux
nativo, Ctrl+C irrestrito ou produção.

| Próxima capacidade | Prontidão documental | Pré-condição / autorização |
|---|---|---|
| Consolidar o lote local | Pode ser preparado, com aceites e limites separados | Preservar README alheio; conferir commits/diff/index. Preparação não autoriza merge/push |
| Revisar intervalo acumulado a publicar | Pode ser preparado | Partir da última base integrada conhecida `fb986456a37a48afcafef204f165d15354294d26`, conferir referência remota novamente na etapa autorizada e revisar todos os deltas até o candidato escolhido. O parecer HQL cobre só c091abb8..ed42309f |
| Validação remota do candidato | Pode ser planejada; execução ainda não autorizada | Revisão do intervalo acumulado, candidato/seleção exatos, proteções de deploy e autorização específica de publicação/CI. Conferir head_sha efetivo; não atribuir o JAR p05 ao novo HEAD |
| Matriz pendente | Preparar seleção/fixtures/comandos/saídas | Preservar sete casos CF032 e15 harnesses conforme matriz canônica; incompatibilidade exige decisão explícita, sem exclusão silenciosa. Execução remota depende da mesma autorização própria |

Próximo passo concreto recomendado: **um lote de consolidação documental local e
revisão independente do intervalo acumulado**, com mapa commit→aceite→capacidade,
seleção real de CI/expanded e proposta exata do candidato a publicar. Não repetir
startups para obter outro verde. Esse trabalho é prontidão, não foi iniciado por
esta revisão nem aprova automaticamente o intervalo maior.

Depois dessa revisão, solicitar autorização delimitada para push/PR/CI do candidato
e execução da matriz aprovada, mantendo bloqueios de deploy. A autorização deste
pedido termina em provas/parecer/estados e commits locais; nenhuma ação remota foi
executada. Aceite local não implica CI remota já validada nem permissão de deploy.

## Impedimentos que continuam separados

- **Zoom nativo200% / CF010/015:** verificação própria pendente; não reaberta aqui.
  DEC-CI-04 permite o recorte de preparação de CI, não o aceite integral/uso.
- **CF017/P01/P02:** em_revisao; inventário real A–D, dados/brutos/null/UNKNOWN,
  compatibilidade, backup/restore, freeze, baseline/migrations, writers/clientes e
  medição reais não foram executados nem dispensados. CF017 local não certifica
  esse banco. Nenhum checkbox real foi marcado.
- **Configurações remotas:** última leitura documentada continua com DDL update,
  previews/destinos compartilhados e backup real não comprovado. Não houve nova
  leitura remota: tratar como pendências a reconfirmar, não estado atual observado.
  Mudança/ativação Railway/Vercel exige changeset, ordem, alvo e autorização próprios.
- **CF034 integral:** em_revisao; nova CI/expanded/candidato, dependências e limites
  de cancelamento continuam conforme a matriz, sem reabrir aceites locais válidos.
- **CF035/036:** propostas; homologação, promoção e uso real sem liberação.
- **Produção:** sem SLO/capacidade/HA/percentis certificados;40s é orçamento do
  harness, proposta300s Railway não foi aprovada nem aplicada por este parecer.

Não é necessária decisão do usuário para o aceite local delimitado: não se altera
prazo nem se exclui cenário/teste obrigatório. São necessárias autorizações futuras
para ações externas e, se desejada, uma decisão explícita sobre ambiente/orçamento
operacional. Nenhuma decisão de desempenho pode ser inferida deste aceite.
