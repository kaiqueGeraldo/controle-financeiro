# Contenção e fronteiras de quiescência

O defeito era uma inferência inválida de Members: QueryIds produz fotografia;
GetProcessById pode falhar depois. Descartar esse PID não prova ausência de seu
sucessor. A correção não usa duas listas iguais ou espera fixa como fence.

Dois papéis, reutilizando o supervisor existente:

1. **Worker de controle.** Guardião, worker e consoles identificados no registro
   inicial. O guardião associa a si mesmo ao Job antes de iniciar o worker.
   O worker para na primeira operação do protocolo, antes de comandos/mutações.
   Total/active/roster precisam ser coerentes, sem processo inicial já retirado.
   Guardian/worker são validados por PID+nascimento; consoles entram por identidade
   específica nessa fase, sem excluir genericamente conhost posterior.
2. **Comando.** Controlador externo escreve recibo UUID/owner PID+nascimento/sessão
   antes de spawn. Outro guardião cria/entra no Job próprio antes do adaptador
   Node e do executável. Criação normal herda associação, sem breakaway ou handle
   herdável de Job. O adaptador conserva a passagem de argumentos do spawnSync
   original, incluindo cmd /c. Resultado/log só são devolvidos após ausência
   confirmada do Job, encerrando também wrappers/filhos/netos remanescentes.

O comando pode criar descendentes até o fechamento do seu Job. Depois de sua
ausência comprovada, nenhum desses membros pode criar outros. O worker só cria
comandos pelo protocolo síncrono; seu guardião inicia esse worker uma única vez.
O contador vitalício do Job de controle precisa continuar no valor registrado.
Qualquer criação direta adicional, mesmo já terminada, invalida essa geração.
O cenário handoff/retired verifica que retirar PIDs não restaura esse contador.

TotalProcesses inclui processos encerrados; ActiveProcesses tem significado
distinto. A conferência antes/depois detecta inconsistência de identidade; o
contador vitalício e a separação de produtores sustentam a fronteira positiva.
[Microsoft: accounting](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_basic_accounting_information).
Jobs agrupam processos criados normalmente; KILL_ON_JOB_CLOSE encerra membros
ao fechar o último handle e a destruição exige o fim dos membros. Consultas abrem
somente acesso de leitura e fecham seus handles, sem mantê-los durante polling.
[Microsoft: Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects).

Não é uma política de segurança contra código hostil. As hipóteses são os
criadores controlados do harness, criação normal por CreateProcess e número
pequeno/limitado de processos, muito abaixo do limite DWORD do contador. Não
se certificam delegação WMI/serviços externos ou alteração adversarial do código.

## Resultados e integração

| Resultado | Significado e efeito |
|---|---|
| quiescent | Worker registrado/coerente, contador intacto, nenhum comando sem fechamento confirmado. Permite ao caller continuar a validação/restauração |
| active | Comando ainda sem fechamento confirmado ou geração do worker invalidada por criação não gerenciada. Pode existir somente histórico de criação; não é afirmação de que todo PID antigo ainda vive |
| inconclusive | PID desaparecido, identidade/roster incoerente ou certificado incompleto. Não equivale a lista vazia |
| operational | Falha de ferramenta, acesso/API ou protocolo. Sem certificado |

Os últimos três são exceções no caller. O ProofStore conserva seus estados
existentes: restoration-pending, fonte mutante, sem complete e sem próximo gate.
Ele não foi alterado. Sua sequência continua verifyEnvironment → restauração →
hashes → complete, exigindo também evidência causal válida. O teste real PG17
confere essa parte sem mocks. Recuperação abre outra geração somente após owner
anterior encerrado e Jobs antigos ausentes; o mutex da raiz serializa donos.

Todos os consumidores de produção do probe passam pelo módulo de supervisão:
register, current e closed. current valida também o formato/status do certificado;
execução não zero/erro nativo não vira [] nem sucesso. O runner canônico usa o
broker para Maven, Docker/tooling e consultas de ambiente. Scripts históricos de
prova permanecem intocados e podem ter contratos antigos, conforme seus recibos.
Audit/reuse passam pela verificação de ambiente antes de validar/restaurar.

A identidade de observador inclui os helpers, inclusive o adaptador novo.
Checkpoint complete de outro observador é incompatível; não é promovido por
booleano environmentVerified antigo. Recibos de processo e prova causal continuam
separados. Um command Job fechado com status255 ou JUnit ausente termina como
failed; o cleanup não produz a contraprova.

Morte do owner fecha os pipes privados dos Jobs de controle e comando. Morte
do guardião de controle encerra o worker; seu controlador cancela os comandos
ainda pendentes, e confirma seus Jobs. Se houver handle externo retido, ausência
não é certificada mesmo com active0. O teste mantém fonte mutante e bloqueia
resume até liberação, sem encerrar o processo que segurou o handle.

## Alternativas, custo e limites

Propagar o PID desaparecido fecharia o disparo pontual, mas deixaria a garantia
dependente de fotografias. Encerrar worker a cada experimento exigiria uma nova
máquina de checkpoint/finalização. O broker acrescenta um Job por comando e I/O,
preservando o núcleo causal aprovado e permitindo prova de fim do grupo real.

Polling de pedidos e fechamento foi de25 para100ms. Uma consulta nativa é feita
na fronteira, não a cada100ms de um Maven ativo. A espera de Job continua limitada
a10s; resposta de inspeção15s; startup40s. Maven continua sem deadline externo
adicional, como antes. Não há reinvocação automática/retry para obter verde.

Com r recibos/requests e p membros, o protocolo final3 consulta uma mailbox fixa
por tick e usa lookup por UUID em Set, O(1) médio no tamanho do histórico. O
payload tem tamanho limitado pelos comandos do harness. Jobs confirmados saem
do conjunto ativo; o histórico fica em disco, sem revarrê-lo a cada fronteira.
A inspeção custa O(p) no baseline pequeno; registro/recovery percorrem recibos
O(r) uma vez ao abrir geração. Retenção O(r), mais os logs. O coletor usa índice
por origem para reconferir cópias, evitando lookup quadrático. Não se instalou
infraestrutura adicional. Mailbox é atômica e separada do pedido imutável de
auditoria; protocolo incompatível bloqueia em vez de aceitar frame antigo.

Custo observado no preflight final: oito comandos auxiliares levaram3,52–5,12s
cada, do recibo à confirmação de fechamento; Maven52,85s inclui compilação/teste.
Não é benchmark de CPU nem latência da API. O orçamento global20s do probe legado
de abandono não foi atendido; isso permanece falho, sem aumento de prazo. O
controle causal novo de interrupção antes do filho passou por handles/Job.
Essa regressão de custo limita a entrega e merece revisão, sem provar nova
quiescência falsa nem explicar HQL.

Uma primeira coleta e resultado-final preservam o protocolo2 e suas medições.
O protocolo3 só alterou o despacho e a retenção em memória: mailbox atômica e
conjunto ativo sem revarrer históricos. Handoff, inspeção falha, ciclo de vida,
antes do filho e preflight/resume foram conferidos novamente sobre essa versão.
O núcleo de ProofStore e o modelo causal continuam byte idênticos à base.

Host Windows/mesma sessão é o alcance. Sessão desconhecida/diferente bloqueia;
recovery em host Linux continua recusado, sem fallback de process group alegado.
Aplicação Docker/Linux em Windows não prova supervisor nativo Linux. Daemon
Docker não pertence ao Job: o guard de containers API rotulados permanece;
não há certificado universal de recursos de daemon/SQL externo. Os bancos desta
prova são descartáveis e não há DB real. Nenhum processo alheio é terminado.
