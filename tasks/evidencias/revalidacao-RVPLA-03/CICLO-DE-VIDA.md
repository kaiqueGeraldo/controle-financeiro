# Identidade, ciclo de vida e alcance

Controlador Node persiste runId/raiz real/PID/nascimento/sessão/checksum antes de
criar guardião. O guardião cria Job nomeado sem breakaway/handle herdável, associa
a si mesmo e só depois verifica owner e mutex. Crianças normais herdam associação.
Recibo antecipado e owner revalidado cobrem guardião tardio: se B já viu ausência,
o guardião A posterior não pode liberar worker de owner morto. As duas barreiras
before-job/after-job distinguiram essa janela do EOF real, sem soltar trabalho A.

Essas propriedades do kernel têm base na documentação primária de
[Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
e [CreateJobObjectW](https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-createjobobjectw).
O teste usou handles de processo abertos/identidade validada antes da intervenção;
a ausência do Job foi consultada fechando cada handle de leitura. Identidade de
terceiro divergente provocou recusa; não houve encerramento por nome/porta.

| Fronteira | Prova independente / decisão |
|---|---|
| Antes de criar Job; owner morre; B já avança | Barreira de cópia, velho worker nunca inicia; guardião tardio encerra |
| Job criado antes de registrar worker | B bloqueia por mutex/Job/owner; após fechamento, nova tentativa segura |
| Owner morto antes de Java | Original antigo reproduziu efeito tardio; candidato encerrou wrapper e reobservou fonte restaurada |
| Filho/neto já existem |5/5 e morte direta do guardião: handles sinalizados, nenhum tardio; sockets sem tráfego reutilizados |
| Reuso de PID | Nascimento divergente simulado, processo real preservado, terminação recusada |
| Recibo/cross-session | Checksum inválido e sessão sintética diferente bloquearam antes de worker. Não é teste real de múltiplas sessões |
| Consulta de identidade falha | Falha injetada na fronteira nativa: nenhuma mutação/observação, sem sucesso falso |
| Stop enviado, objeto ainda existe | Handle de leitura retido/active0; B bloqueou sem restaurar. Liberação do objeto e ausência precederam recuperação |
| PID termina durante enumeração | **RVPLA-04**: pai capturado sai após criar filho; filtro descarta pai e omite filho novo; restauração/conclusão antecipadas |
| Recurso no daemon Docker | Container de controle permaneceu ativo após recusa do runner; nenhum avanço. Somente seu criador o parou por ID e confirmou ausência |
| Modo compartilhado sem nome | Saída normal e morte de owner, guardião/filho/neto sinalizados; caminho null/string vazio exercitado sem CI remota |

O roster inicial contém identidades de guardião, worker e consoles observados.
Ele não é exclusão genérica por executável. A falha nova nasce da fotografia
incoerente durante Members, não de PID isolado no comando de terminação.
Job/mutex protegem entre donos; a consulta current não dá, hoje, o mesmo aceite
ao restauro dentro do worker. closed de processo também não significa prova
causal complete; os recibos são separados e o caso pré-efeito continua failed.

Plataforma certificada neste recorte: Windows/sessão atual/criação normal
CreateProcess. O ramo Linux de recovery foi exercitado por simulação explícita
de process.platform, confirmando recusa; **não é execução real em host Linux**.
Os4/4 da aplicação Linux são Docker em Windows. Serviços/WMI criando processos
fora da árvore e daemon Docker não recebem garantia universal de encerramento.

Custo: processos PowerShell/compilação nativa e arquivos nas fronteiras. Consultas
e scans crescem linearmente com recibos/membros; retenção também linear, além de
bytes de evidência/inputs. O controlador varre pedidos periodicamente. Nenhuma
query financeira/N+1 ou lock de domínio muda. A solução é proporcional ao runner
local, com custo de I/O e bloqueios conservadores; não há evidência para impor
banco de checkpoints/coordenação distribuída. Resolver a consistência local do
roster antes de ampliar garantias ou infraestrutura.

Consulta final:45 Jobs,44 ausências certificadas na sessão,1 sessão sintética
divergente mantida sem certificado e1 recibo inválido preservado. Zero processos
associados ao runtime e zero API containers ativos. Nenhuma terminação nessa
auditoria; não se converte desconhecido/bloqueio em “limpo”.
