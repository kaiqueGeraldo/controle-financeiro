# Decisões e limites do saneamento CF-015

Execução iniciada em 14/09 e retomada em 20–21/09/2026. Este documento é do
implementador; não substitui o [parecer independente](../revisao-CF-015/README.md).

## R06 — propriedade antes da escrita

POST e PUT consultam categoria por ID e proprietário, retornando o mesmo 404
para vínculo inexistente e alheio. POST valida antes de criar o plano mensal;
PUT valida antes de alterar a entidade gerenciada. Cópia do mês anterior também
é um writer: rejeita vínculos legados de categoria alheia antes de criar o destino.
Itens de cartão continuam fora da cópia, conforme o contrato existente.

A cópia reutiliza o fetch join de plano/itens/categoria/cartão e percorre os itens
em O(n), sem consulta de categoria por item. A leitura do ID de proprietário usa
o ID do proxy Hibernate. POST/PUT fazem uma consulta indexada por ID com condição
de dono. Não se adicionou índice ou migração; não foi realizado benchmark ou
certificado o número total de queries de todos os fluxos. A transação de serviço
continua delimitando rollback. Os testes observam ausência de item e de plano
parcial, valores anteriores após PUT recusado e sucesso legítimo.

## R03 — resultado financeiro separado da releitura

O modal conserva três estados: recusado (4xx definitivo), confirmado com
reconciliação pendente, e resultado desconhecido (perda de comunicação). Uma
referência síncrona impede duplo clique antes do próximo render. O estado
pendente fica em sessionStorage, separado por usuário/cartão/ano/mês, antes do
envio. Reconciliação executa somente GETs; não chama novamente o pagamento.

`useCards.refreshAll` aguarda fatura, lista de cartões, FinanceProvider e os
consumidores DashboardProvider/PlanningProvider. Um evento interno coleta as
Promises dos providers montados; `allSettled` aguarda todas, mas qualquer falha
rejeita a reconciliação. Cada consumidor apresenta seu próprio erro. O evento
não é persistência nem confirmação financeira. Os hooks de extrato/resumo
anual são locais à tela e refazem a leitura ao montar. O retry do dashboard
solicita sua atualização uma vez, evitando que dois refreshes concorrentes se
invalidem mutuamente.

Trade-off: o lote de leituras aumenta o trabalho pós-pagamento e acopla a conclusão
às fontes afetadas, mas evita declarar sucesso quando só a fatura foi atualizada.
A coordenação utiliza as primitivas existentes, sem uma nova biblioteca de estado.
Falhas de refresh em callbacks sem retorno observável são consumidas apenas
depois de o hook registrar erro; no caminho financeiro são propagadas ao modal.

### Dependência financeira efetivamente encontrada

O backend permitia repetir o fechamento de fatura já PAID, debitando novamente.
Um teste sequencial e outro concorrente com conexões/transações separadas
reproduziram a falha em PostgreSQL. A correção bloqueia o cartão por proprietário
com `PESSIMISTIC_WRITE`, lê/cria a fatura dentro da mesma transação e rejeita PAID
antes do evento de débito. A validação do valor também antecede o evento.

O lock é por cartão, não global. Serializa pagamentos de meses diferentes do mesmo
cartão, um custo aceito neste escopo para proteger também a criação de fatura.
Contas conservam o controle de versão existente. Não foi certificado um protocolo
global de ordem de locks entre todos os writers, nem throughput sob carga.

**Limite concreto vinculado à CF-024:** não existe recibo durável com chave de
idempotência para recuperar o resultado de uma operação específica. A proteção
PAID cobre repetição de fechamento; não prova idempotência de adiantamentos,
operações em abas/dispositivos diferentes ou depois de perder o sessionStorage.
Resultado desconhecido permanece explicitamente desconhecido após GETs; o
frontend não o deduz como confirmado pelo saldo. A UI preserva o bloqueio de
reenvio nessa sessão. Isso não encerra CF-019/CF-024 nem certifica publicação.

## R01/R02/R04/R07 — identidade e rascunho

Cache hit também invalida a geração da requisição anterior. O AbortSignal reduz
trabalho, mas o oráculo de aceitação continua sendo `isCurrent()`, inclusive
quando o serviço entrega sucesso/erro depois do cancelamento. Troca de sessão
zera caches e troca de ano invalida a escrita de nota no escopo anterior.
Coordenação por seleção tem custo O(1); não houve refatoração geral de providers.

A nota registra identidade, texto, versão e dirty. Salvar captura o texto enviado;
só aquela versão pode ser confirmada. Refetch não substitui texto dirty e erro
não desmonta o editor existente. O cache da nota é invalidado ao escrever,
evitando reutilizar o texto antigo ao voltar ao ano depois de uma confirmação
tardia. Editor por ano e modal por identidade impedem transportar rascunho.
Perfil inicializa ao abrir/trocar usuário; cancelar e reabrir recupera o valor
confirmado do contexto, descartando a edição cancelada.

Trade-off: rascunho local não é salvamento automático e não é garantido após
reload. A garantia após reload aplica-se ao texto confirmado pelo servidor,
verificado por HTTP e banco. Não se adicionou armazenamento de rascunhos.

## R05/R08/R10/R11/R12 — leitura e interação

Cartões distinguem erro, carregamento, vazio confirmado e recuperação. Detalhe
sem leitura válida exibe valor indisponível e bloqueia pagamento; não mostra
fatura zerada. O erro de planejamento também passa a ser consumido pela tela.

Modal comum e detalhe de fatura compartilham contenção/retorno de foco, Escape
somente no topo e bloqueio de rolagem. Portals no body evitam contenção por
ancestrais transformados. Ao pagar, o acionador torna-se desabilitado; o retorno
de foco usa então o fechar do diálogo pai. Tab/Shift+Tab e filho aninhado têm
regressões próprias. Não se adicionou dependência de modal.

Sidebar fixa passa a 1280px; abaixo disso usa o controle móvel existente. Grades
de resumo adaptam-se ao espaço disponível e rótulos/valores podem quebrar linha.
Cabeçalhos e controles do gráfico quebram em vez de sobrepor; nenhum valor foi
removido. É uma correção de geometria, sem redesign. Capturas requerem inspeção
humana/visual: ausência de overflow no documento não prova ausência de recorte
interno. O roteiro ampliado cobre valores longos, fatura com 12 itens e ambos os
temas. Reduzir viewport a 180px é apenas teste adicional de largura, **não zoom
nativo de 200%**. Essa equivalência incorreta foi removida do nome da captura.

R11 remove quatro bindings não usados do double de animação, preservando seus
testes. R12 nomeia a ação mobile “Novo lançamento”. Os seletores semânticos de
R09 e os expected financeiros/temporais originais permanecem preservados.

## Ambiente e preservação

O README raiz conserva o SHA-256 inicial
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Nenhum reset, clean, stash, checkout de limpeza, push, deploy ou banco real.

Na retomada o Docker Desktop falhava em sockets AF_UNIX antigos. Depois de
inspecionar os diretórios e parar somente processos iniciados nesta execução,
diretórios contendo apenas sockets de zero bytes foram movidos, com os caminhos
absolutos conferidos, para `AppData/Local/Docker/run.cf015-backup-20260920`,
`run.cf015-backup-20260920-retry` e
`AppData/Local/docker-secrets-engine.cf015-backup-20260920`. Diretórios vazios
foram recriados. Backups permanecem locais; volumes, configuração, credenciais e
imagens não foram apagados, e não houve factory reset. Docker respondeu versão
29.6.2 após a recuperação.

Maven/JDK21 e Docker exigiram execução fora do sandbox para o cache e engine
locais; build precisou acesso às fontes Geist. Uma chamada ao shim npm falhou
porque apontava para npm-cli.js inexistente; usou-se diretamente o CLI instalado
em node_modules, sem instalar/atualizar dependências. Falhas de ambiente não são
contadas como regressões de produto.

CF-017/P01/P02 mantém adoção temporal pendente. Relógio de produto, autenticação,
metadados de origem e auditoria permanecem separados. PostgreSQL sintético não
certifica legado, migração, backup/restore ou rollout. F-018/CF-021 e a dívida
geral de lint CF-026 continuam fora deste lote.
