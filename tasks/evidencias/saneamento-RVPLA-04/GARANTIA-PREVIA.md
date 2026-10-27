# Garantia definida antes da implementação

Base3a6e95be68678e394cd718d9d688fab1fdc428ce. Reprodução original concluída
antes de editar: observação exit0 e teste contratual original exit1, com
OWNED_DESCENDANT_EFFECT_AFTER_COMPLETE. Fonte original e teste preservados;
única adaptação de execução é a allowlist do novo runtime rvpla04-*.

Uma fotografia de PIDs não será mais a autoridade de quiescência. Solução
escolhida: reutilizar os Jobs existentes, separando o worker de controle dos
comandos. Cada comando deve ser iniciado pelo controlador externo em Job próprio,
com recibo antes de spawn, associação do guardião antes do filho e o mesmo
KILL_ON_JOB_CLOSE/owner exato. O resultado só volta ao worker depois do Job de
comando desaparecer. Nenhum produtor desse comando pode agir após esse marco.

O Job do worker fica reservado a guardião, worker e infraestrutura de console
identificada antes de liberar código. O worker síncrono só pode criar comandos
pelo broker. O guardião inicia esse worker uma vez; não cria outros depois.
Qualquer processo adicional criado diretamente nesse Job invalida sua fronteira
durante toda a execução, pelo contador de processos associados ao longo da vida
do Job (inclusive os já terminados), além de identidades/roster coerentes. Não
se tenta tornar uma execução contaminada limpa por duas listas iguais.

Enumeração serve para identidade e diagnóstico. PID desaparecido, identidade
inconsultável, contagem incoerente ou erro de API não viram lista vazia. Os
resultados serão quiescência comprovada, grupo ativo, inspeção inconclusiva ou
erro operacional; todos os três últimos bloqueiam restore/complete/avanço.
O checkpoint usa os estados existentes, conservando restoration-pending.
Recuperação exige fechar os Jobs anteriores e abrir execução supervisionada nova.

Alternativas: apenas propagar ArgumentException fecha a reprodução específica,
mas não fecha criação concorrente; repetir listas reduz probabilidade sem fence.
Encerrar o worker a cada experimento exigiria nova máquina de checkpoints e
reativação automática, afetando mais o contrato RVPLA-01. O broker acrescenta um
Job por comando, mantendo ProofStore e suas regras causais aprovadas.

Fronteiras de comandos existentes (Maven, ferramentas Docker e consultas nativas)
devem usar o broker. Chamadas diretas de criação a partir do worker serão tratadas
como violação recuperável. Daemon Docker continua com guard de recursos separado.
Sem aumento de40s, retries ou alteração de produto. Host Linux recovery continua
recusado; aplicação Docker/Linux em Windows não certifica supervisor Linux.
