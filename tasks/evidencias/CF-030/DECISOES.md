# CF-030 — invariantes, fronteiras e trade-offs

## Revisão e autoridade

SPEC001 v1, FIN01–08/FIN06/NG01, contratos temporais e CF024/027 definem os
resultados; o código anterior é capacidade reutilizável. A CF029 guarda respostas
e sua avaliação no save. Prepare refaz o parser/validação de folhas e referências
atuais e projeta todos os ativos/passivos existentes com os novos comandos.
Não usa a lista persistida de issues como autorização. Complete reconfere o
inventário e a revisão antes de escrever. Remoção/referência alheia tem404 uniforme;
alteração própria preservada na revisão antiga conflita409.

O hash de conteúdo cobre exatamente contractVersion/sessionId/draftVersion/payload.
Canonicalização ordena chaves e identidades, preserva strings decimais/Unicode e
não passa por double. O vetor documental E01 continua sendo oracle do contentHash.
ReviewHash inclui sourceSnapshot, mappingPreview e summary, excluindo apenas
existingAsOf. Evidência de proveniência, inclusive validatedAt, continua no hash.
Preparação repetida conserva seu instante e snapshot original, mesmo após commit.

Para cumprir o antes/final/diferença já normativo, Summary expõe opcionalmente
allocationChanges para pares existentes e reservationChanges para declarações
atuais. Esses dados integram a revisão e o recibo; são leitura adicional, não
permissões ou novos comandos. Omitidos em E01. Explicitação registrada na SPEC001,
sem alterar DraftWrite/GET/aceites CF029 nem recalcular recibos anteriores.

## Transação e recuperação

Prepare/cancel/complete usam transações locais. Complete inclui todas as aberturas,
vínculos, reservas, declarações/evidência/história, previsões pendentes, mapping,
recibo FinancialIntents, versão da sessão e COMPLETED. Não usa REQUIRES_NEW, rede,
cotação, email, HTTP interno ou transação por item. Exceção em qualquer ponto reverte
tudo; PREPARED foi persistida antes e permanece recuperável após rollback.
Eventos de invalidação usam o listener AFTER_COMMIT existente; não se ativa cache
financeiro. Cancelamento do cliente não desfaz um commit realizado.

FinancialIntents ganhou o kind ONBOARDING_COMPLETE e a operação de lock do namespace
existente. Não há segundo armazenamento de recibo: preparations armazena coordenação,
enquanto financial_intent_receipts continua a autoridade do resultado confirmado.
Chaves de preparação também impedem reuso pelos kinds antigos. Mesmo ID/corpo
recupera o recibo antes de checar a versão consumida; outro conteúdo conflita409.
GET da operação é owner-scoped e lê um snapshot REPEATABLE READ. PREPARED/404 não
são prova de que outra requisição em curso não comitará.

## Concorrência real

Ordem: intenção → guard de inventário owner → linha users/sessão → fontes e demais
gravações. O guard PostgreSQL advisory é compartilhado nos writers cotidianos e
exclusivo no prepare/complete/cancel/exclusão. Assim dois writers de fontes distintas
do mesmo owner continuam concorrentes; captura/aplicação global bloqueia-os enquanto
o snapshot é avaliado. Owners distintos usam chaves diferentes, salvo a possibilidade
herdada de colisão de hash advisory (contenção indevida, não acesso cruzado).

Participam: contas/create/update/archive/reorder; transações/criação/edição/baixa/
estorno/transferência/exclusão; investimentos/criação/operação/avaliação/correção/
exclusão; metas/alocações/itens/compras/reembolsos; categorias mutáveis; hábitos
que podem mudar progresso numérico; cartões e seus comandos, GET que materializa
fatura, cron de fechamento; persistência de cotação e exclusão de usuário.
Listeners de pagamento executam sob a transação e o guard do comando de origem.
Registro de usuário cria identidade e carteira antes do primeiro commit, portanto
não existe inventário visível concorrente nessa criação. Cron de hábitos não cria
contribuição financeira; planejamento/notas não modificam o inventário consumido.
Ordenação de hábitos também não altera esse inventário; mantém o caminho anterior
de lote único e comandos inválidos/vazios sem SQL. CF025 detectou a coordenação
indevida desse caminho e suas assertions foram mantidas na correção.

A chamada por intenção precede o guard nos writers já identificados, preservando
seus locks existentes (contas ordenadas, conta antes de investimento). O onboarding
não precisa adquirir centenas de locks individuais: o modo exclusivo exclui os
writers participantes. As constraints continuam defendendo PKs/pares/versões.
Custos: cadastros e confirmações aguardam leituras/escritas em curso do owner;
transações longas ampliam contenção. Há orçamento máximo de5s para locks,
preservando orçamento menor já configurado. Timeout/deadlock aborta e retorna409;
sem retry interno ou aumento de timeout para encobrir falha.
O caso máximo sintético levou3,55s e10,60s em duas execuções locais;5s limita
espera de lock, não duração do commit. Outro writer desse owner pode receber409
durante a aplicação. Perfilamento de escrita/batching é uma otimização futura
possível; deve manter o commit único e os oráculos, sem flexibilizar consistência.

Essa é uma garantia do protocolo da aplicação. SQL administrativo/writer externo
que ignore o guard não está certificado. Nenhum writer real foi liberado. A adoção
real exige a coordenação e os gates próprios CF017/P01/P02. Novos writers deverão
aderir ao protocolo antes de alterar esses recursos.

## Efeitos financeiros

Abertura é estoque. Conta usa a regra de abertura do domínio, não uma transação de
receita. Carteira só pode ser inicializada por identidade registrada pelo produtor
AuthService: nome/CASH/zero não são prova; a V16 não faz backfill. Saldo negativo
permanece assinado e exige ciência no draft. Inicialização de carteira usada falha.

Investimentos reutilizam evaluate/evaluateTotal e a referência TOTAL de NG01.
MONETARY não recebe unidades nem preço médio fictícios: quantity/averagePrice são
null e positionMode informa a semântica. Custo/aquisição/origem desconhecidos ficam
null; nenhum aporte, compra ou rendimento histórico é criado. A API cotidiana que
exige unidades rejeita essa modalidade com regra explícita; avaliação monetária
permanece disponível. Evoluir um comando de operação monetária sem unidades e sua
UI não foi antecipado nesta tarefa. Posições UNIT e os aceites anteriores mantêm
os comandos existentes. Atualização de cotação ocorre fora do onboarding, com rede
antes da transação local guardada.

Cartões usam CardCycle/DEC03 e linhas OPENING, sem compra histórica. Principal e
encargos conhecidos somam a dívida; desconhecidos não viram principal. Crédito é
ativo separado, não aumenta limite. Leitores de comprometimento consideram o
principal remanescente e devolvem null quando não é conhecido; disponível aceita
negativo. Override civil é armazenado separado do calendário calculado. Uma fatura
vazia existente pode ser reutilizada; não se duplica a chave cartão/competência.

Meta numérica mantém oito casas e não entra nas somas monetárias. Prazo original
vencido é conservado apenas no adaptador de onboarding, sem relaxar o cadastro
cotidiano. Reserva é valor final de par único; não move dinheiro, não soma ao
patrimônio e não é cortada pelo alvo. Redução/liberação conhecida preserva outros
pares e mantém uma identidade auditável. Previsão é ocorrência pendente; não cria
série, liquidação, caixa, receita realizada ou passivo de cartão.

## Reservas legadas

Registros protegidos validam identidade/revisão/estrutura, estados de conhecimento,
partes/nominal e referências de evidência. O browser só propõe ASSIGN/CLOSE atuais;
não escreve owner, candidates, independent ou evidências. Flags V5 de falta de
reconciliação são materializadas com identidade estável, nominal UNKNOWN e nenhuma
história inventada. Um vínculo direto de investimento comprova a fonte, não o valor.

CONFIRMED com parte incerta afeta a fonte; candidatas com prova exaustiva vigente
afetam todas as candidatas; prova vencida/sem delimitação volta conservadoramente ao
universo elegível. Exclusão só vale com evidência compatível para aquela pendência.
Novo ID/dinheiro/ausência de par não é independência. União preserva cada pendência:
fechar uma não fecha outras. Inventário-base de evidência inclui fontes propostas
do draft e não contém as próprias evidências, evitando hash circular.

Nominal com origem incerta entra uma vez na dimensão se todo o universo possível
tem o mesmo tipo: E23/E28/E34=KNOWN400 e E32=KNOWN500. Isso não torna livres/progresso
conhecidos. Partes comprovadas preservam subtotais PARTIAL; desconhecido não vira0.
Conclusão sem alocação proibida é admitida. Declaração ASSIGN pode revelar déficit
real, sem autorizar aumento. CLOSE/ASSIGN preservam revisão anterior e evidência
na história, sem movimento financeiro retroativo.

## Consultas, capacidade e migração

O inventário usa dez consultas em lote por relação/owner. Categorias são restritas
às previsões selecionadas; não se carregam históricos de transações/investimentos.
Cartões capturam linhas ainda relevantes à dívida e faturas vazias necessárias à
abertura; existência de fatos antigos continua vedando INITIALIZE_EMPTY. Pristina
da carteira consulta uso apenas da identidade default, evitando varredura de
histórico por cada conta. Dados existentes não são limitados ao tamanho do draft.

Instantes do inventário são serializados com timezone UTC local à transação,
evitando tokens distintos pela configuração de conexão; datas civis continuam
literais. INITIALIZE_EMPTY reutiliza a fatura vazia já existente e preserva os
vencimentos/overrides comprovados, sem duplicar a chave card/mês/ano. Fatura atual
zero é preservada sem fabricar uma linha financeira zero. Ajuste legado negativo
sem semântica comprovada torna a composição da dívida UNKNOWN; não é abatido como
crédito conhecido. Cotações em lote ignoram ticker nulo/modalidade monetária.

Escritas crescem com os itens efetivos, sem SELECT por parcela/meta. Projeções usam
índices de incidência em memória; ordenação/canonicalização tem custo O(N log N),
reconciliação e materialização O(N+R+E), com buscas ordenadas adicionais e E relações
fonte–pendência (pode chegar a N×R). Agregação de lacunas concatena listas imutáveis
sem recopiá-las a cada soma; deduplicação/ordenação ocorre na saída. Não se alega
SQL total O(1) ou desempenho de produção com estes dados sintéticos.

Orçamento operacional padrão:32MiB para inventário/snapshot/recibo e200000 relações
de bloqueio, configuráveis por onboarding.snapshot.max-bytes/max-relations.
Exceder produz503 SUMMARY_CAPACITY_EXCEEDED, sem truncamento ou commit financeiro.
Não é teto de dinheiro/cardinalidade financeira; request continua256KiB. Snapshot
é durável e o recibo não se recalcula na recuperação. Medições estão nos logs COST.

V16 acrescenta coordenação, identidade default, mapping e história protegida;
adapta modalidades/nulls/componentes e metas numéricas/agregadas. V1–V15 não são
editadas. PK/uniques parciais asseguram uma PREPARED e uma COMPLETED por sessão;
FK composta default assegura owner da conta. Índices de owner atendem recuperação/
exclusão; índice reservation_id atende reconciliação do par; uniques de pares e
índices financeiros anteriores continuam usados. Custo adicional de escrita e
armazenamento é aceito em troca dessas garantias, sem benchmark de produção.
