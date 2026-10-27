# Propriedade, quiescência e limites

O bug estava na fronteira `spawnSync(cmd→mvnw→PowerShell/Java)` do runner. UUID
dos containers e Job Object da CI já existiam, mas não envolviam aquela árvore.
Adicionar mais consultas de Java deixaria a janela de criação futura intacta.

Decisão: reutilizar `spawnOwned`, envolvendo o worker inteiro e mantendo o
ProofStore síncrono aprovado. Um controlador Node fora do Job atende consultas
nativas do worker por arquivos atômicos. Os recibos de processo são separados
dos checkpoints causais; encerrar processos não produz `complete`.

1. Antes de criar guardião, o controlador grava recibo imutável com UUID, raiz
   real normalizada, Job nomeado, mutex, PID/nascimento/sessão do owner e checksum.
2. O guardião cria Job, configura KILL_ON_JOB_CLOSE e associa a si mesmo antes
   de owner/recibos/worker. Handle não herdável; breakaway não é habilitado.
3. Adquire mutex estável da raiz; colisão bloqueia. Confere owner exato e recibos
   anteriores. Owner vivo, sessão diferente/desconhecida, checksum inválido,
   consulta negada ou Job anterior presente bloqueiam antes de criar worker.
4. Confere owner novamente. Somente então cria worker; membros herdam o Job.
   Se o owner morrer nessa janela, a nova tentativa encontra o Job/mutex e não
   avança; EOF do pipe privado encerra o guardião e fecha o único handle próprio.
5. Antes de comandos, worker pede registro inicial. Consulta externa confirma
   sua associação e a identidade do guardião no roster. Não há Maven nessa fase.
   Conhost reais entram por PID+nascimento; não há exclusão genérica por nome.
6. Antes de restaurar ou avançar, consulta exige apenas membros do roster
   inicial, sem cmd/wrappers/filhos adicionais. Se não confirmar, o checkpoint
   conserva `restoration-pending`; o processo sai e o fechamento do Job encerra
   a árvore. Uma próxima execução deve comprovar a ausência do Job anterior.
7. Depois da saída do guardião, o controlador só grava `closed` se abrir o Job
   retornar inexistente. O guardião tardio de recibo cujo owner já morreu pode
   ainda chegar a criar Job, mas testa owner antes de qualquer worker e sai.

No Windows, associação de filhos criados por CreateProcess e fechamento do Job
com KILL_ON_JOB_CLOSE têm suporte no kernel. Um Job é destruído após fechar o
último handle e terminar seus membros. Esse contrato fundamenta a prova de
árvore encerrada; não depende de procurar nomes numa amostra de processos.
[Microsoft: Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects).
Colisão de nome é recusada antes de alterar limites do objeto já existente;
o handle criado por CreateJobObject sem SECURITY_ATTRIBUTES não é herdável.
[Microsoft: CreateJobObjectW](https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-createjobobjectw).

As consultas de Job abrem acesso somente de leitura e fecham o handle em cada
observação; não mantêm o último handle vivo durante a espera. Há observação
limitada de até10s do encerramento e até15s da resposta do controlador. A espera
não reinvoca Maven, não retenta teste nem altera o orçamento de readiness40s.
Se expirar, bloqueia e preserva a prova. O limite1s do drain de stdout no modo
nomeado impede descendente órfão de prolongar o guardião por um pipe herdado;
o kernel encerra os membros e a consulta posterior confirma a condição final.

As intervenções dos probes usam handle de processo aberto com direito de
consulta/terminação, com nascimento validado no próprio handle antes de agir.
Divergência para sem terminar. O runner de produção encerra pelo próprio pipe
ou Job, nunca por nome/porta nem por PID isolado. PID core legado continua
checagem conservadora adicional; pode bloquear por reuso, sem matar terceiros.

Limites e trade-offs:

- Recuperação durável aqui só é certificada em host Windows na mesma sessão.
  Como os Jobs são Local, sessão divergente ou não registrada bloqueia. O runner
  recusa host Linux antes de mutações; não se anuncia que process group POSIX
  tem a mesma garantia. O `spawnOwned` POSIX original permanece para os seus
  outros consumidores. Aplicação Linux via Docker em host Windows foi testada.
- Docker é daemon externo ao Job. Containers de API com label própria continuam
  bloqueando restauração pelo guard existente; não se promete que matar Node
  encerre automaticamente recursos de daemon. Nenhum container desconhecido é
  encerrado. PostgreSQL das provas é descartável, sem acesso a banco real.
- A garantia cobre criação normal pela árvore do harness. Não cobre um programa
  deliberadamente adversarial que delegue criação por WMI/serviço externo;
  o código usa WMI somente para consulta. Novo mecanismo de criação exige novo
  contrato de recursos antes de alegar quiescência.
- Checksum detecta corrupção/incompletude local; não é assinatura contra usuário
  malicioso com acesso à pasta. Legado sem recibo de propriedade bloqueia, sem
  tentar recuperar automaticamente a árvore desconhecida. Evidências antigas
  permanecem legíveis e são usadas para revisão, não para certificação implícita.
- Custo: mais processos PowerShell e I/O nas fronteiras, mantendo semântica
  síncrona e evitando reescrever o ProofStore. Em cada verificação, custo linear
  em recibos/requests da execução e membros do Job; retenção linear dos recibos.
  A pasta é pequena e descartável por execução. Não há query financeira ou N+1
  nesse delta. Se o volume deixar de ser pequeno, rever transporte/índice dos
  recibos com provas equivalentes; não apagar evidências para esconder custo.

HQL continua fora dessa inferência. As rodadas dirigidas de regressão passaram
readiness dentro do gate existente, mas não explicam os estouros históricos.
Próximo experimento de startup: execução limpa com identidade completa, capturar
tempo/pilhas antes e depois de JPA/HQL em controles comparáveis, preservando40s;
não implementar lazy initialization ou otimização de query sem causa demonstrada.
