# RCI034-L01 — análise Windows, UUID e recursos

## Job Object e ordem de execução

Em owned-process.ps1:25–27, CreateJobObject recebe attributes nulo e nome nulo:
job anônimo, handle não herdável. SetInformationJobObject classe 9 recebe
ExtendedLimits com flags 0x2000 (KILL_ON_JOB_CLOSE); não há BREAKAWAY_OK nem
SILENT_BREAKAWAY_OK. O supervisor atribui **a si próprio** antes de construir/
iniciar o comando. Process.Start só ocorre na linha 38, depois do sucesso das
três operações. Não se inicia o filho para depois tentar associá-lo.

O contrato Win32 confirma que o handle criado sem SECURITY_ATTRIBUTES não é
herdável e que fechar o último handle com KILL_ON_JOB_CLOSE termina os membros.
[Microsoft: CreateJobObjectW](https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-createjobobjectw).
Filhos criados pelo caminho CreateProcess herdam a associação, distinta da
herança do handle; breakaway é uma capacidade separada.
[Microsoft: Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects),
[flags e estrutura](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_basic_limit_information).

A análise do código e as provas se complementam: supervisor guarda único handle
em campo estático até sair; não o duplica/exporta. Environment.Exit faz o sistema
fechar seus handles, inclusive o job. O pipe de stdin é privado entre runner e
supervisor; stdin do comando é outro pipe fechado pelo supervisor. EOF por
cancelamento ou morte do runner acorda Task.Run(Console.In.ReadToEnd), que
concorre com término do comando e drenagem stdout/stderr. Saída do supervisor
encerra membros restantes. Encerramento normal preserva o exit do comando.

Falha de criação/configuração/associação lança erro antes do filho e não tem
fallback sem proteção. Foi injetada em cópia uma falha no ramo de associação:
exit 1, mensagem Cannot establish owned Windows job e marcador de filho inexistente.
PS1 restaurado com o mesmo SHA. Não se pretende simular todos os erros Win32,
mas a ordem fail-closed foi exercitada além da leitura estática.

Quando o pipe já está fechado durante inicialização, o supervisor pode detectar
EOF antes ou logo depois de iniciar o comando; em ambos os casos o job já está
estabelecido. Não há garantia de zero instruções de filho em toda corrida de
cancelamento; há proteção de associação e término da árvore. Handler/estado do
runner impede o próximo gate e invalida recibos na saída cancelled.

## UUID e validação

cancellation.mjs cria UUID por execução/diretório novo; control.json registra
UUID, plataforma, PID informativo e início. Pedido é por arquivo fixo do próprio
diretório, nunca enumeração por nome/PID. check compara runId, torna cancelled
monotônico, interrompe supervisor ativo e é chamado pelo timer e antes/depois
dos comandos/fases. attach também interrompe filho se cancelamento já ocorreu.

Probe independente: v05/uuid. UUID sintaticamente válido mas obsoleto/diferente
foi escrito no pedido; heartbeat avançou e runner permaneceu ativo. Depois o
helper com UUID correto cancelou e a repetição foi segura. Nova chamada após
result terminal não o alterou. Caminho inexistente falhou sem criar execução
nem atingir processo. O UUID não é autenticação: pressupõe posse/autorização do
diretório de controle, e não é uma barreira contra alguém capaz de editar esses
arquivos. UUID velho em diretório velho não aponta para PID reutilizado.

Detalhe por inspeção: cancellation.mjs:13 cancela defensivamente quando o JSON
do pedido não pode ser lido/parseado. Portanto não declarar que *todo* arquivo
inválido é ignorado; a prova de UUID incorreto é para pedido JSON válido. Pedido
parcial durante escrita pode gerar esse cancelamento fail-closed, nunca sucesso
ou procura global de processo. Corridas com término observam o estado terminal
e não ressuscitam execução; diretório novo impede reciclar os recibos de controle.

## Provas dirigidas

[uuid-tree.json](uuid-tree.json), [original-abrupt.json](original-abrupt.json),
[rerun-proofs.json](rerun-proofs.json), [supplement.json](supplement.json).

| Cenário | Resultado observado |
|---|---|
| Filho e descendente ativos | Readiness com PID/parent e handles abertos antes da ação; ambos terminaram, sem marcador natural 45s |
| Pedido explícito válido | Runner 130, status cancelled, runId igual ao control, sem artifact/next gate; diagnóstico coletado |
| UUID incorreto/repetição | Incorreto ignorado; válido repetido seguro; terminal não reescrito |
| Inicialização | Pedido após control.json bloqueou avanço e terminou 130, sem filho sobrevivente declarado por associação |
| Morte abrupta só do runner | Novo probe encerrou filho e descendente por handle, ação observada em cerca de 119ms; nenhum próximo gate ou natural marker |
| Probe original | Mesmos limites 12s/1,5s, assertions intactas: assertion que exigia sobrevivência ficou vermelha; controle inverso confirma false e PID ausente |
| Filho/comando já terminado | Exit 17 e argumentos com espaços/aspas/barra preservados; parent exit 0 seguido de término do descendente; cancel tardio no-op |
| Processo alheio | Sintético fora do Job permaneceu vivo até comando IPC próprio; exit 0 observado, sem timeout natural |
| Remoção KILL_ON_JOB_CLOSE | Em cópia, dois handles WAIT_TIMEOUT 258/STILL_ACTIVE 259; runner 130 sozinho não bastou para aprovar; restauração SHA e controle encerraram membros |
| Erro ao estabelecer Job | Filho não iniciado, supervisor 1; restauração exata |

Não se usou processo real do usuário como alvo/controle. Os processos sintéticos
tinham limite natural de segurança; aprovação exige handles sinalizados antes
dele e ausência de marcador natural. Membros mortos pelo Job retornaram 0 em
alguns cenários: isso não é aprovação, pois runner/control mantêm130/cancelled.
Pai morto pelo sistema tem signal SIGTERM/code null; não se exige 130 nem result
final de quem não pode escrevê-lo. Coleta nessa condição rotulou missing/incomplete,
sem inferir sucesso.

## Alcance do aceite

Aceito o saneamento da sobrevivência de processos Windows no protocolo UUID e
na morte abrupta do runner. Sem nova evidência contrária aos encerramentos
normais anteriores. Não há certificação de Ctrl+C nativo entregue pelo host,
cancelamento Actions/Linux, falhas/limites de todos os hosts ou processos
deliberadamente iniciados por serviços externos fora do job.

Containers do daemon Docker são recursos externos ao job. O contrato do
saneamento reconhece expressamente que descarte após cancelamento é exigência
ainda aberta; não foi ensaiado aqui e não se encerra irrestritamente o critério
processos/banco. Isso é lacuna de evidência, não container abandonado confirmado.
Permanece a necessidade de prova/procedimento delimitado de recursos externos
quando for reivindicado esse alcance. Nenhum banco real ou descartável foi iniciado
nesta revalidação, e nenhum serviço alheio foi parado.

Trade-off: a associação antecipada e o handle não herdável eliminam busca por
nome/PID e protegem morte do pai, ao custo de um PowerShell/compilação C# por
comando. O percurso das operações é constante por comando, com teardown dos
membros feito pelo kernel. Não introduz query, domínio ou mudança financeira;
não implica garantia de limpeza de recursos de outro serviço.
