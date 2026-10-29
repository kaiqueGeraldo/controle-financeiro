# Jobs, broker e integração

O controlador persiste identidade UUID/raiz real/PID/nascimento/sessão antes de
lançar guardião. Este cria e entra no Job sem breakaway/handle herdável antes de
criar worker/adaptador/executável. O worker registra apenas papéis iniciais;
contador vitalício, active e identidades coerentes selam esse grupo de controle.
Comandos nascem do broker externo em grupos diferentes. Não há produtores de
comando autorizados no worker após o registro fora da API síncrona.

TotalProcesses inclui os encerrados; ActiveProcesses é estado distinto. Essa
premissa foi conferida na documentação primária de
[accounting](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_basic_accounting_information).
O encerramento e a destruição do grupo, além da herança normal, são fundamentados em
[Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects).
Não se usa active0, fotografia vazia ou contador sozinho como certificado positivo.

| Estado | Consumidor e prova |
|---|---|
| Job de comando ativo/não confirmado | Broker não entrega resultado; boundary recusa comandos pendentes |
| Job vazio, handle externo retido | Objeto ainda existe, closed falha; fonte mutante e resume bloqueado até liberação |
| Job de comando ausente | Resultado pode voltar; guarda worker precisa também manter baseline/contador |
| PID desaparecido/roster incoerente | Exceção inconclusive, nunca lista vazia ou aprovação |
| Erro de acesso/API/protocolo | Exceção operational; nenhum certificado |
| Encerramento solicitado | stopOwned fecha pipe próprio; conclusão depende de close/consulta ao Job |
| Broker morto | EOF dos pipes de worker e comandos;4/4 incluiu interrupção do owner com filho/neto |
| Guardião de worker morto | Worker encerra, controlador cancela comandos; handles e ausência confirmados |
| Canal JSON corrompido | Controle independente cancelou árvore, sem decision/restore; nova geração recuperou só depois de Job ausente |
| Outra execução na mesma raiz | Mutex recusou segundo dono sem interromper o primeiro ou restaurar sua fonte |
| Outra raiz/mesmo executável | Controle4/4 preservou terceiro e outra execução legítima; não há cleanup por nome/porta |

O broker mantém estado pendente antes de spawn e só o remove após closed real.
finally fecha logs/timers, mas não transforma falha de consulta em closed. No
fim do worker, para os canais próprios, aguarda tarefas e recusa sucesso se
algum comando continua sem confirmação. O ProofStore não mudou: exceções antes
do restore conservam restoration-pending; hashes/evidência causal precedem complete.
Resume confere Jobs/owner anteriores e identidade do observador, incluindo adaptador.

Mailbox fixa e Set dão despacho O(1) médio em tamanho de histórico, sob o contrato
de um worker síncrono/um pedido em voo. Não se certifica produtores arbitrários
concorrentes dentro desse worker. Mutex serializa donos da mesma raiz; raízes
distintas têm IDs/canais/Jobs próprios. Outros consumidores API/adoption podem
ser bloqueados conservadoramente pelos guards de recursos, sem terminação.

Inspeção custa O(p) no pequeno baseline; abertura/recovery percorre recibos O(r),
retenção e memória de requests O(r), além de logs. Essa complexidade não mede
latência real: lançamentos/compilação PowerShell e confirmação por comando têm
custo alto observado. A arquitetura é proporcional ao runner local, mas falhou
no orçamento20s. Não há delta de queries/N+1/locks financeiros nem justificativa
para adicionar banco/coordenação distribuída. Otimizar o transporte não pode
cachear quiescência ou dispensar fechamento dos grupos.

Limites: Windows/mesma sessão, criadores controlados/CreateProcess, poucos processos
abaixo dos limites de contador/buffer. Não é política contra código hostil,
delegação WMI/serviço externo, host Linux ou daemon/SQL fora do Job. Docker API
rotulado conserva guard separado. TCP/HQL não recebem aprovação por esses testes.

Audit de preflight falhou por EPERM na substituição da mailbox: a exceção impediu
aprovação, sem causa de bloqueio de arquivo determinada. Canal corrompido e esse
erro operacional não foram chamados de “limpos”. Consulta final separada de
recursos certificou79 Jobs ausentes com owners encerrados; nenhum processo
associado/API container ativo, sem terminação nessa auditoria de leitura.
