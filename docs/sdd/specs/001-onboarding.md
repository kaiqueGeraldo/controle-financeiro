# SPEC-001 — Contrato da entrevista financeira inicial

Contrato **v1**, candidato CF-028 de 09/10/2026, **em revisão independente**.
Base: `c6a7c3ef3b563e9a432f80166aa4982a25180cd5`. Fonte canônica dos DTOs/regras
futuros; não declara implementação. [Evidências](../../../tasks/evidencias/CF-028/README.md).

## 1. Autoridade, decisões e escopo

Aplicam-se [FIN-01–08, FIN-06/NG-01](004-regras-financeiras.md),
[SPEC-002/DEC-01/02/03](002-datas.md), [CF-023](../../../tasks/evidencias/CF-023/CONTRATO.md),
[DEC-10/CF-024](../../../tasks/evidencias/CF-024/CONTRATO.md) e
[CF-027](../../../tasks/evidencias/CF-027/MAPA.md). Código atual é capacidade,
não autoridade quando diverge dessas decisões.

Preservado: finanças primeiro; entrevista orientada; contas/saldos, investimentos
existentes, metas/progresso, reservas vinculadas, cartões/limites/fatura/parcelas;
nenhum histórico importado ou inventado. **DEC-ONB-01**, resposta do usuário nesta
execução: aceitar prazo original hoje ou vencido para metas preexistentes fora do
app, indicando atraso apenas se incompletas, pelo calendário do navegador. Não
altera a criação cotidiana de metas fora do onboarding.

[Liberação independente](../../../tasks/evidencias/revisao-CF-025-CF-027-RV24/README.md)
CF-019→CF-028 na base `06c1a51` permite consumir abertura/dívida/parcelas aceitas
em J/C exclusivamente para especificar. [RD58](../../../tasks/evidencias/revalidacao-RD58/README.md)
preserva essa liberação. CF-005–009 concluídas nos escopos aceitos; CF-017 mantém
adoção real; CF-019 continua em_revisao/RVA-03; CF-010–015 não integralmente aprovadas.
Nenhuma autorização de implementação, migração real ou publicação decorre daqui.

Fora do escopo: importação, Open Finance, cotação automática, recomendações,
múltiplas moedas, billing, novos hábitos/Roda da Vida. Previsões opcionais são
ocorrências pendentes confirmadas, sem motor de recorrência ou histórico fictício.
Planilha é referência funcional, não instrução nem contrato substituto.

## 2. Entrevista, estados e fronteira financeira

| Etapa | Perguntas e exibição | Regras |
|---|---|---|
| CONTEXT | Todos: BRL/data-base; nome preferido/objetivo opcionais | Explicar abertura e fronteira com movimentos posteriores |
| ACCOUNTS | Todos: carteira padrão, contas existentes/novas | Nome/tipo/saldo; zero válido, negativo exige ciência do déficit |
| CARDS | Tenho/não tenho/depois | Limite/dias, restante da fatura, crédito e futuras; nunca PAN/CVV |
| INVESTMENTS | Tenho/não tenho/depois | Posição atual; custo/história podem ser desconhecidos |
| GOALS | Tenho/não tenho/depois | Monetária/numérica, prazo original, progresso numérico inicial |
| ALLOCATIONS | Se há metas monetárias selecionadas | Fonte/valor, sem movimentação |
| FORECASTS | Opcional, preencher/depois/nenhuma | Ocorrências pendentes, nunca liquidadas |
| REVIEW | Sempre, inclusive perfil vazio | Antes/depois, lacunas, saldos, patrimônio, dívida, reservas e limite |

Seções usam `answer=UNANSWERED|NONE|PROVIDED|DEFERRED`. NONE declara ausência;
DEFERRED é adiamento, não zero. PROVIDED exige itens; NONE/DEFERRED listas vazias
(UI confirma antes de remover respostas). CONTEXT/REVIEW não podem ser pulados
ao concluir. ACCOUNTS permite PROVIDED/NONE; NONE preserva carteira existente.
ALLOCATIONS NONE permite meta monetária de progresso zero. Pular entrevista não
bloqueia acesso ao app. Usuário novo recebe sugestão; legado recebe complemento
voluntário mostrando primeiro seus registros, sem reinicialização forçada.

Salvar permite folhas obrigatórias ausentes, mas rejeita valores presentes
malformados. Inconsistências entre campos ficam como `issues` no rascunho.
Remover fonte conserva referência pendente na reserva para correção; não descarta
resposta nem finaliza com referência quebrada. Alterar data-base/resposta revalida
dependentes e invalida revisão anterior. Edição não salva fica em memória;
falha de save avisa, reload recupera apenas último save confirmado.

Rascunho autenticado no servidor, fora dos saldos/relatórios. Não guardar payload
financeiro em localStorage/sessionStorage. Logout limpa memória/cache e invalida
respostas pendentes do owner anterior. Sem expiração automática v1; exclusão do
usuário deve abranger rascunhos/recibos na transação própria.

Logs não registram payload financeiro, JWT ou credenciais. Auditoria operacional
usa IDs/código de erro/instante; dados financeiros ficam no armazenamento protegido
do domínio/recibo, não em mensagens de diagnóstico ou analytics.

Estados persistidos: NOT_STARTED (sem sessão), IN_PROGRESS, SKIPPED, COMPLETED.
FINALIZING/RESULT_UNKNOWN são estados da UI, não prova de commit. Primeiro save
cria sessão; saves incrementam versão. Pausar→SKIPPED conserva; retomar→IN_PROGRESS.
Cancelar oferece sair preservando ou descartar explicitamente. Descarte limpa
payload, incrementa versão e mantém identidade/tombstone SKIPPED e operações.
Intenção preparada impede editar/descartar até cancelamento confirmado.
COMPLETED terminal; correções posteriores são fluxos regulares rastreáveis.

Servidor classifica NEW/COMPLEMENT por fatos, não flag do browser. NEW só admite
cadastros automáticos comprovadamente vazios; fatos financeiros levam a COMPLEMENT.
Classificação não autoriza sobrescrita. Só commit da finalização integra todos os
itens selecionados aos domínios. DEFERRED fica no recibo como cobertura incompleta;
após COMPLETED completar pelos módulos regulares, não segunda abertura/replay.
Perfil sem patrimônio pode concluir com listas vazias.

Revisão de reserva existente mostra valor anterior/final/diferença; confirmação do
conjunto abrange essas alterações. Previsões recorrentes são ocorrências explícitas;
recurrenceLabel é descritivo, não agenda nem multiplica registros. Acima dos limites,
reduzir seleção ou usar módulos regulares, não importação disfarçada.

## 3. Reconciliação financeira

### Contas e carteira

Saldo inicial é estoque imediatamente anterior aos eventos posteriores da data-base,
não receita. Revisão exige `boundaryAcknowledged=true`: saldos não contêm movimentos
a registrar de novo. Sobreposição com fatos existentes não gera transação fictícia.

Conta usa CREATE/LINK/INITIALIZE_DEFAULT. LINK não envia saldo novo.
INITIALIZE_DEFAULT substitui abertura automática zero, sem soma ou outra conta,
com trilha. Exige identidade default comprovada, SYSTEM_INITIALIZED, saldo/abertura
zero, ativa, sem movimentação/reserva/uso financeiro e snapshot vigente. Caso
contrário409 DEFAULT_NOT_PRISTINE; usar LINK ou ajuste regular fora da entrevista.
Nunca inferir identidade por nome/CASH/zero. Legado sem vínculo inequívoco exige
seleção explícita da carteira existente, somente LINK. Múltiplas candidatas não
autorizam criação automática. CREATE CASH distinto exige `distinctCashConfirmed=true`.

Custódia contém só caixa não aplicado. Corretora1200=caixa200+ativos1000 vira
conta200/investimentos1000, não conta1200+ativos1000. Confirmar
`cashOnlyAcknowledged=true`. Nome/ticker/valor semelhante alerta, não faz merge.

### Investimentos

TOTAL preserva valor/quantidade de referência NG-01; preço derivado é descritivo:
200000000 unidades/1.00 não vira zero. PRICE multiplica quantidade×preço exato e
arredonda uma vez HALF_UP. Custo desconhecido não é zero/avaliação; ganho e
rentabilidade indisponíveis até comprovação. Aquisição/proveniência desconhecidas
ficam explícitas; USER_DECLARED descreve declaração atual, não aquisição histórica.

MONETARY usa quantity NOT_APPLICABLE, sem unidade inventada a preço igual ao saldo.
UNIT exige quantidade conhecida>0; desconhecida permanece rascunho ou item é
removido explicitamente da seleção. Avaliação UNKNOWN permite posição, sem total
completo/nova reserva. Sem cotação/rede externa, compra/aporte/débito de caixa ou
receita de rendimento anterior para registrar investimentos existentes.

### Cartões

currentOutstanding é restante a pagar, já incluindo parcela corrente e descontando
pagamentos anteriores. Original300/pago100→informar200, não criar débito100.
futureInstallments só competências posteriores à corrente. Agrupador da UI (valor,
primeira competência, quantidade restante/última parcela) expande linhas explícitas;
corrente não repete. Não exigir compra/data original ou parcelas pagas. Centavos
de divisão ficam na última; agenda explicitamente informada não é redistribuída.

Dívida=corrente+futuras. Principal/encargos por linha: ambos conhecidos somando a
linha ou ambos UNKNOWN. Desconhecido não vira principal. Dívida conhecida permite
patrimônio conhecido; composição desconhecida torna comprometimento/disponível
UNKNOWN. Principal inclui futuras; encargos não consomem limite. Crédito é ativo
separado≥0, não dívida negativa, não aumenta limite. Limite zero e disponível
negativo permitidos: mostrar excesso sem rejeitar posição real.

Não compensar crédito/dívida silenciosamente. Crédito já consumido para chegar
ao restante não pode reaparecer como ativo; `creditNotNettedAcknowledged=true`.
Encargos iniciais não são despesas novas. Cartão com fatos só LINK. Abertura usa
CREATE/INITIALIZE_EMPTY sob lock, sem abertura/compras/pagamentos/reembolsos/crédito
anterior. Competência corrente pode estar vencida. Datas gerenciais DEC-03 não
prometem regra do banco. dueDateOverride preserva vencimento civil declarado do
extrato, separado dos dias nominais; sem override calcular DEC-03. Futuras podem
ter lacunas/várias linhas no mês com IDs distintos, sem deduzir duplicata por valor.

### Metas e totais

NUMERIC não é dinheiro. MONETARY progride pela soma das reservas, não campo livre.
“Já consegui300” exige fonte dos300; sem fonte não há progresso monetário confirmado.
Checklist de bens comprados não vira reserva; importação detalhada fora de v1.

Reserva liga meta monetária a ACCOUNT/INVESTMENT; par único no snapshot. Valor
enviado é destinação final do par, não incremento. Outros pares permanecem e
contam para capacidade; alteração de par existente exige resumo antes/depois e
confirmação. LINK meta não redefine alvo/progresso numérico. Capacidade por fonte
=max(0,valor conhecido−reservas); negativa/desconhecida/arquivada/deficitária não
aceita aumento. amount0 libera par existente, sem dinheiro. Queda posterior
conserva reserva nominal e mostra déficit.

Patrimônio=contas assinadas+investimentos+créditos−dívida. Descoberto já reduz
contas; não subtrair duas vezes. Meta/custo/limite não somam ativo. Caixa livre
gerencial=contas assinadas−reservas em contas, pode ser negativo; não equivale à
capacidade de cada fonte. Investimento livre não é caixa. Dívida mostrada ao lado,
sem abatê-la de novo ou prometer autorização bancária para gastar.

Desconhecido/adiamento/legado sem prova impede rótulo total completo na dimensão
afetada; mostrar subtotal e lacunas. Agregado fora FIN-06→OUT_OF_RANGE/null, sem
overflow/zero/truncamento. Fonte individual/dívida por cartão precisam caber na
faixa, senão rejeitar finalização. Não reconstruir posição anterior à data-base.

## 4. Schema lógico dos DTOs futuros v1

Tabelas são schema fechado de escrita. `?` permite omissão, não null salvo indicação.
Demais campos obrigatórios ao finalizar. Rascunho permite folhas ausentes, mas
exige envelope/listas/IDs/discriminadores. JSON malformado, chave duplicada ou
campo não definido→400. Validar membros próprios, não array/null/herança, inclusive
em respostas; tipagem estática não substitui validação.

Notação: enums são strings JSON; tempId/id/sessionId/operationId usam UUID;
version/expectedVersion/draftVersion/revision usam Revision. Boolean não aceita
string. Leitura sem `?` exige campo, nulabilidade só explícita. mode de SessionView
é NEW/COMPLEMENT, também calculado no GET sem sessão. Contadores não financeiros
podem usar inteiros JSON dentro dos limites, sem confundir com decimal monetário.

| Tipo | Representação e limite |
|---|---|
| UUID | String canônica minúscula; owner exclusivamente da autenticação |
| Revision | String inteira sem sinal/zeros iniciais,0..9223372036854775807; não Number; impedir overflow |
| Money | String até12 inteiros/2 casas, máximo absoluto999999999999.99 inclusivo; saída2 casas |
| Quantity/Price | String não negativa até12 inteiros/8 casas, máximo999999999999.99999999; saída8 casas |
| Text(n) | Unicode trim,1..n pontos de código, sem controles/HTML interpretado |
| CivilDate | YYYY-MM-DD gregoriana, anos0001–9999, sem hora/fuso |
| Competence | {year:inteiro1..9999,month:inteiro1..12} |
| Instant | Servidor UTC Z, segundos/até6 casas; exibição America/Sao_Paulo |
| Fact<T> | {state:KNOWN,value:T} OU {state:UNKNOWN} OU {state:NOT_APPLICABLE}; sem value nos últimos |
| Ref | {kind:ACCOUNT/INVESTMENT/CARD/GOAL,tempId:UUID} OU {kind:…,id:UUID}; exatamente uma identidade |

Money assinado só conta/totais derivados. 1/1.2 strings normalizam para1.00/1.20;
zeros iniciais, negativo zero, expoente, vírgula, espaço/+ rejeitados. Terceira
casa monetária não arredonda na entrada. Zero KNOWN difere de UNKNOWN; omissão é
“ainda não respondeu”. NOT_APPLICABLE só onde autorizado. String input→decimal
exato/BigInt escalado cliente→BFF string→BigDecimal→numeric→string no recibo;
sem parseFloat/Number intermediário. Delimitar tamanho antes da aritmética.
HALF_UP só resultado calculado; preço médio/derivado não recompõe custo/TOTAL.
Preço derivado NG-01 não recebe teto de preço informado nem integra comando.

| DTO | Campos de escrita |
|---|---|
| DraftWrite | contractVersion:1,expectedVersion:Revision,action:SAVE/PAUSE/RESUME/DISCARD,payload:Interview; DISCARD omite payload, demais mandam snapshot completo |
| Interview | context:Context,currentStep:enum seção2,sections:{accounts,cards,investments,goals,allocations,forecasts} |
| Section | answer:enum seção2,items:lista tipada; UNANSWERED admite itens incompletos no rascunho |
| Context | currency:BRL,baseDate:CivilDate,preferredName?:Text(80),objective?:Text(200),browserZone?:Text(80) IANA válida contextual,boundaryAcknowledged:boolean,cashOnlyAcknowledged:boolean |
| Account CREATE | tempId,action:CREATE,name:Text(100),type:CHECKING/INVESTMENT/CASH/SAVINGS,balance:Fact<Money>,color?:#RRGGBB,deficitAcknowledged:boolean,distinctCashConfirmed:boolean |
| Account LINK | tempId,action:LINK,ref:Ref ACCOUNT persistida; sem novo saldo/nome/tipo |
| Account INITIALIZE_DEFAULT | tempId,action:INITIALIZE_DEFAULT,ref:Ref ACCOUNT persistida,balance:Fact<Money>,deficitAcknowledged:boolean |
| Investment CREATE | tempId,action:CREATE,name:Text(100),type:STOCK/FII/FIXED_INCOME/CRYPTO/TREASURY/OTHER,identifier?:Text(40),institution?:Text(100),positionMode:UNIT/MONETARY,quantity:Fact<Quantity>,cost:Fact<Money>,valuation:Valuation,acquisitionDate:Fact<CivilDate>,historicalSource:Fact<Text(200)> |
| Investment LINK | tempId,action:LINK,ref:Ref INVESTMENT persistida |
| Valuation | {state:UNKNOWN} OU {state:KNOWN,basis:TOTAL/PRICE,amount:Money só TOTAL ou price:Price só PRICE,date:CivilDate,source:USER_DECLARED,note?:Text(200)} |
| Card CREATE | tempId,action:CREATE,name:Text(100),last4Digits?:string4 dígitos,brand?:Text(40),limit:Fact<Money>,closingDay:inteiro1..31,dueDay:inteiro1..31,opening:CardOpening |
| Card LINK | tempId,action:LINK,ref:Ref CARD persistida |
| Card INITIALIZE_EMPTY | tempId,action:INITIALIZE_EMPTY,ref:Ref CARD persistida,opening:CardOpening; configuração do servidor |
| CardOpening | currentCompetence:Competence,currentOutstanding:Money,currentPrincipal:Fact<Money>,currentCharges:Fact<Money>,dueDateOverride?:CivilDate,credit:Money,creditNotNettedAcknowledged:boolean,futureInstallments:Installment[] |
| Installment | tempId,competence:Competence,amount:Money>0,principal:Fact<Money>,charges:Fact<Money>,description?:Text(200),dueDateOverride?:CivilDate |
| Goal CREATE | tempId,action:CREATE,title:Text(100),type:MONETARY/NUMERIC,target:Money ou Quantity,deadline:CivilDate,unit?:Text(30),initialProgress?:Quantity |
| Goal LINK | tempId,action:LINK,ref:Ref GOAL persistida |
| Allocation | tempId,goal:Ref GOAL,source:Ref ACCOUNT/INVESTMENT,amount:Money≥0 (zero só para liberar par existente) |
| Forecast | tempId,description:Text(200),direction:INCOME/EXPENSE,amount:Money>0,dueDate:CivilDate,account:Ref ACCOUNT,category:{id:UUID},recurrenceLabel?:Text(100) |

Regras finais: balance KNOWN, negativo exige deficitAcknowledged; cost KNOWN≥0/
UNKNOWN; acquisitionDate/historicalSource KNOWN/UNKNOWN. UNIT quantity KNOWN>0;
MONETARY só FIXED_INCOME/TREASURY/OTHER, quantity NOT_APPLICABLE e valuation TOTAL/
UNKNOWN. PRICE só UNIT. Avaliação conhecida≥0/data≤baseDate, se anterior mostrar
desatualização. Aquisição conhecida≤baseDate, não assumir data da avaliação.
Limite KNOWN≥0/UNKNOWN. Principal/encargos ambos KNOWN≥0 ou ambos UNKNOWN; corrente/
crédito≥0. Avaliação zero é explícita, não fallback. Balance UNKNOWN só rascunho.
Goal target>0; NUMERIC exige unit/initialProgress≥0 (pode superar alvo sem cortar);
MONETARY proíbe unit/initialProgress. Prazo original passado permitido. Forecast
pode estar vencida, continua pendente; categoria própria de direção compatível.

baseDate explícita≤hojeProduto na preparação. UI oferece hojeNavegador; se UTC+14
estiver amanhã do produto, erro explica e usuário escolhe, sem mudança silenciosa.
Não há hora de operação em abertura: time rejeitado, não preencher meia-noite.
Horário informado em operação cotidiana segue SPEC-002. browserZone não muda
auditoria/competência/cron/dia digitado. Capturar Clock uma vez por caso de uso.

Limites v1: UTF-8≤256KiB/profundidade JSON≤12;50 contas,50 investimentos,20 cartões,
100 metas,200 reservas,120 previsões;120 futuras por cartão/600 no total;1200 IDs
temporários no snapshot. Excesso→413 BODY_LIMIT ou400 ITEM_LIMIT, sem truncamento.
UUID temporário único/estável por sessão; Ref resolve só sessão/owner, inclusive
alias LINK. Grafo de tipos sem ciclos. Persistido duplicado no mesmo tipo→400
DUPLICATE_REFERENCE. Nome semelhante não é identidade. Sem posse/inexistente→404.

## 5. API, preparação e recuperação

Rotas Spring **propostas**, inexistentes nesta base; BFF acrescentará `/api`.
Respostas novas `{data:...}`, erros `{error:{code,message,fieldErrors:[]}}`.
Todos autenticados/owner-scoped; não alterar contratos legados.

| Operação | Request/resultado |
|---|---|
| GET /onboarding |200 SessionView; sem sessão:sessionId:null,version:"0",status:NOT_STARTED,payload:null,pendingIntent:null,completedReceipt:null |
| PUT /onboarding/draft |DraftWrite; expectedVersion:"0" inicial cria sessão única/owner;200 SessionView/versão incrementada/issues; stale409 sem escrita |
| POST /onboarding/prepare |{contractVersion:1,sessionId,expectedVersion,operationId:UUID}; valida snapshot/fontes;200 PreparedIntent durável sem efeitos financeiros; mesma identidade repete resultado |
| POST /onboarding/intents/{operationId}/cancel |{sessionId,expectedVersion}; PREPARED→CANCELLED/incrementa versão; COMPLETED→409/recuperar; ausente/alheia404 |
| POST /onboarding/complete |CompleteRequest abaixo;200 Receipt original no primeiro commit/replay |
| GET /onboarding/operations/{operationId} |200 OperationView PREPARED/CANCELLED/COMPLETED; sem recibo não confirmar sucesso |

SessionView: contractVersion,sessionId,version,status,mode,payload,issues:FieldError[],
updatedAt:Instant|null,pendingIntent:PreparedIntent|null,completedReceipt:Receipt|null.
Payload null só sem sessão/descarte. GET recupera operationId sem memória local;
COMPLETED contém recibo. Uma sessão/owner e no máximo uma intenção PREPARED.
Prepare congela versão/payload; corrigir exige cancelar/salvar/preparar outra
intenção. Dois prepares distintos→409 INTENT_PENDING. Expirar login não cancela.

Prepare não incrementa a versão; o bloqueio de edição é pendingIntent. Complete
incrementa versão/status da sessão atomicamente, mas recibo guarda draftVersion
confirmada. SAVE/PAUSE/RESUME/DISCARD em COMPLETED→409 ALREADY_COMPLETED; em PREPARED
→409 INTENT_PENDING. Cancel limpa pendingIntent e mantém operação recuperável.
Prepare com chave já usada e outro conteúdo/versão→409 INTENT_CONTENT_CONFLICT,
mesmo após commit; mesmo conteúdo concluído recupera a preparação original.
Save com resposta perdida: GET e comparar snapshot/versão; não sobrescrever versão
nova automaticamente. Retomar SKIPPED exige RESUME antes de preparar. Descarte
permite SAVE posterior na mesma sessão usando a versão atual, sem reutilizar IDs
de operações canceladas. Versão0 só é válida para primeira criação.

PreparedIntent: `{contractVersion:1,operationId,kind:ONBOARDING_COMPLETE,sessionId,
draftVersion,contentHash,reviewHash,sourceSnapshot,summary,mappingPreview,preparedAt}`.
Hashes SHA-256 lowercase64hex do servidor. SourceSnapshot:
`{inventoryToken,sources:[{kind,id,revision,token}]}`. Tokens cobrem valores,
configuração/eligibilidade e reservas dependentes, mesmo sem mudança @Version da
raiz; inventário owner detecta registros novos/duplicações. MappingPreview lista
`{tempId,kind,action,existingId:UUID|null}`, inclusive parcelas; sem IDs fictícios.

CompleteRequest: `{contractVersion:1,sessionId,expectedVersion,operationId,
contentHash,reviewHash,confirm:true}`. Todos obrigatórios. Sem payload alternativo;
confirma snapshot apresentado. confirm só após ação explícita; botão bloqueado
até revisão válida. Estrutura inválida400, divergência de versão/hash/conteúdo409.

Canonicalização v1: trim ao salvar, UUID minúsculo/decimais canônicos; opcionais
omitidos permanecem omitidos. Chaves ASCII ordenadas, itens por tempId, fontes por
kind/id, listas de resumo por identidade/nome da dimensão. JSON UTF-8 sem espaços,
escapes JSON, sem normalização Unicode heurística. contentHash cobre contractVersion,
sessionId,draftVersion,Interview. reviewHash cobre contentHash,sourceSnapshot,
mappingPreview,summary; exclui instantes de captura. Fingerprint inclui owner,kind,
operationId,versão/hashes em objeto canônico, não concatenação ambígua. Ordem visual
não é financeira; currentStep ainda integra snapshot salvo.

Objeto exato do hash de conteúdo: `{contractVersion,sessionId,draftVersion,payload}`,
com payload=Interview normalizado. Excluir somente summary.existingAsOf do hash
da revisão; preparedAt/completedAt já não pertencem aos objetos hasheados.

Receipt: `{contractVersion:1,operationId,kind:ONBOARDING_COMPLETE,sessionId,
draftVersion,contentHash,reviewHash,status:COMPLETED,completedAt,mapping,summary}`.
Mapping lista `{tempId,kind,id,action}` para ACCOUNT/INVESTMENT/CARD/GOAL/ALLOCATION/
FORECAST/INSTALLMENT. Reserva nova CREATE/par existente UPDATE/liberação RELEASE,
esta com ID do registro auditável. Outros itens preservam CREATE/LINK/
INITIALIZE_DEFAULT/INITIALIZE_EMPTY; parcelas CREATE. Toda tempId resolvida.
Summary original, não releitura atual. Recibo imutável/sem expiração automática.

Summary: `{baseDate,existingAsOf:Instant,scope:SELECTED_AND_EXISTING,coverage,metrics,
bySource,byCard,byGoal,deferredSections}`. Existentes contam uma vez, inclusive
arquivados, não só página. COMPLEMENT: baseDate é fronteira das novas aberturas;
existentes são posição capturada existingAsOf, nunca história reconstruída.
Exibir separadamente “aberturas na data-base”/“existentes na revisão”; também NEW
informa captura da carteira. Recibo conserva existingAsOf da revisão aceita.

Coverage lista `{dimension,complete,missingPaths}` para accounts/investments/cards/
allocations. UNKNOWN/defer/legado sem prova marca false. Metrics: accountsSigned,
investmentsValue,cardCredit,cardDebt,netWorth,reservedAccounts,reservedInvestments,
freeAccountCash,unallocatedInvestments. Cada métrica:
`{state:KNOWN|INCOMPLETE|OUT_OF_RANGE,value:Money|null,knownSubtotal:Money|null}`.
KNOWN exige value=knownSubtotal; outros value=null; subtotal fora da faixa é null.
BySource: `{ref,value:Fact<Money>,reserved:Money,free:Fact<Money>,
newAllocationCapacity:Fact<Money>}`. ByCard: `{ref,debt:Fact<Money>,credit:Fact<Money>,
committed:Fact<Money>,availableLimit:Fact<Money>}`. ByGoal:
`{ref,type,progress:string,covered:Fact<Money>}`; progress na escala do tipo,
covered NOT_APPLICABLE para NUMERIC. Déficit compartilhado→cobertura por meta
UNKNOWN, sem rateio arbitrário; déficit conhecido por fonte. Desconhecidos
propagam para métricas dependentes, não para dimensão independente conhecida.

Refs do resumo conservam tempId dos itens selecionados; existentes não selecionados
usam id. Mapping do recibo resolve tempIds, sem reescrever o resumo congelado.
Cobertura considera conhecimento da dimensão medida: custo desconhecido não torna
valor do investimento desconhecido; composição da dívida desconhecida só impede
limite comprometido. Campo financeiro obrigatório ausente em legado é UNKNOWN,
nunca zero. Reservas legadas não reconciliadas impedem novos vínculos nessa fonte;
resumo marca allocations incompleta e não atesta caixa livre total.

OperationView: `{contractVersion:1,operationId,kind,sessionId,state,
prepared:PreparedIntent,receipt:Receipt|null}`. COMPLETED exige recibo válido;
PREPARED/CANCELLED exigem null. Ausente/alheio→404 uniforme. Reuso de chave alheia/
outro kind em escrita→409 genérico sem dados.

Frontend valida envelope/membros próprios/tipos/versão/kind/geração autenticada,
sessionId/operationId/hashes/draftVersion/mapping completo e coerência decimal
com revisão congelada. Extra em resposta pode ser ignorado, não supre membro por
herança.200 null/{}/array/truncado/decimal divergente/recibo incompatível→RESULT_UNKNOWN,
sem sucesso/limpeza de intenção/nova chave. POST/replay/GET mesma validação; strings
exatas, sem Number legado. Falha de refresh após recibo válido só refaz leituras.

### Erros

FieldError=`{path:string JSON Pointer,code:string,message:string}` sem copiar
conteúdo financeiro. Ex.: `/sections/accounts/items/0/balance/value`.
400 INVALID_FIELD com REQUIRED/DECIMAL_SCALE/DECIMAL_RANGE/DATE_INVALID/ITEM_LIMIT/
DUPLICATE_REFERENCE;400 BUSINESS_RULE com código por campo
RESERVATION_EXCEEDS_SOURCE/INVOICE_COMPONENT_MISMATCH/CURRENT_INSTALLMENT_DUPLICATED/
BOUNDARY_UNCONFIRMED.404 REFERENCE_NOT_FOUND uniforme;401 UNAUTHENTICATED;
409 VERSION_CONFLICT/INTENT_PENDING/INTENT_CONTENT_CONFLICT/SOURCE_CHANGED/
DEFAULT_NOT_PRISTINE/ALREADY_COMPLETED/INTENT_CANCELLED/LOCK_CONFLICT;413 BODY_LIMIT.
500 inesperado/503 indisponível, sem detalhes internos. Erro de regra não escreve
finanças; transporte/5xx/resposta inválida não provam rollback.409 de conteúdo
diferente não desfaz commit anterior; recuperar primeiro.

## 6. Atomicidade, concorrência e custos

Reutilizar FinancialIntents quando adequado, adicionando kind/snapshot próprios,
sem mudar namespaces/recibos anteriores. Hoje não implementa sessão/prepare/revisão/
finalização onboarding. PREPARED é coordenação separada; recibo COMPLETED e efeitos
comitam juntos. Sem REQUIRES_NEW para recibo, HTTP interno por item ou rede/cotação/
email na transação. Save/prepare/cancel curtos sem efeitos financeiros. Eventos/
invalidação só pós-commit, rollback conserva cache.

Ordem: autenticar→lock intenção→replay concluída→lock sessão/coordenação owner→
validar versão/hash→fontes em ordem compatível com writers (contas ordenadas antes
de investimentos; cartões/metas segundo locks efetivos)→revalidar snapshot/
capacidade→aplicar→recibo+COMPLETED→commit. Replay precede checagem de versão já
consumida e não lê posição atual. Fonte mudou: cancelar/reler/preparar/confirmar
nova revisão, sem adaptar valores silenciosamente.

Coordenação owner deve cobrir criação concorrente de carteira/cadastros e mudanças
de inventário fora do onboarding. Lock só no serviço novo não protege de writers
antigos. CF-030 prova estratégia comum (guard adotado pelos writers relevantes ou
isolamento serializável/aborts), unicidade sessão/owner,intenção/ID,aplicação/sessão.
@Version da raiz não cobre reservas sozinho. Consultas de todas as reservas das
fontes participam da mesma transação financeira. Prepare lê snapshot coerente,
não mistura versões em várias queries; complete reconfere antes de qualquer efeito.

| Situação | Resultado exigido |
|---|---|
| Duplo clique mesma intenção |Um efeito; segundo replay ou LOCK_CONFLICT recuperável |
| Timeout/resposta perdida pós-commit |RESULT_UNKNOWN; GET encontra recibo; retry explícito só mesma identidade/corpo |
| Reload durante commit |GET primeiro; PREPARED não prova ausência de commit em curso; recuperar ou retry explícito idêntico |
| Duas abas salvam versão3 |Uma grava4, outra409 conserva edição em memória para comparação; sem last-write-wins |
| IDs distintos finalizam |Só uma PREPARED; outra INTENT_PENDING; após commit ALREADY_COMPLETED |
| Fonte removida/alheia |404 uniforme sem efeito; própria alterada/arquivada409 SOURCE_CHANGED |
| Reserva concorrente |Token/capacidade revalidados, revisão antiga não aplicada |
| Sessão expira |401; reautenticar mesmo owner/recuperar; rascunho durável |
| Troca A→B/resposta tardia |Invalidar geração, nenhum dado/callback de A em B |
| Falha último item/recibo |Rollback integral posições/dívida/reservas/previsões/mapping/COMPLETED; PREPARED recuperável |
| Cancel vs complete |Lock decide: cancel venceu→complete409; commit venceu→cancel409/recuperar; não desfazer finanças |
| Deadlock/timeout lock |Abort→409 LOCK_CONFLICT; recuperar antes de retry idêntico, sem retry interno cego |

404 da recuperação não prova não execução; reler sessão. Sem identidade/estado
reconciliáveis, continuar desconhecido, não oferecer nova chave como retry.
Falha de refresh após recibo válido: “concluído; atualização pendente”; refazer
GET, nunca confirmação. Repetir cancel de intenção CANCELLED retorna200 com o
estado original, sem novo incremento; prepare de operação CANCELLED retorna409.

Com volume delimitado: validação/reconciliação O(N+R), memória O(N+R), ordenação
locks O(N log N), hash O(bytes). Fontes/reservas em lote por owner/tipo, sem SELECT
por meta/parcela. Escritas O(N+R), não SQL total O(1). CF-030 mede queries com1 e
limites máximos, exige ausência de SELECT secundário linear por item, prova locks/
rollback. Guard owner serializa cadastros/confirmações do mesmo usuário; owners
diferentes independentes. Sem justificativa para Kafka/saga/ledger novo/microsserviços.
Não ativar cache financeiro nem prometer coerência distribuída inexistente.

## 7. Exemplos e oráculos independentes

### E01 — perfil completo, data-base 2026-10-09, BRL

Carteira automática zero inicializada100; corrente nova1000; poupança nova200.
Renda fixa MONETARY TOTAL500/custoUNKNOWN; ação UNIT3/custo0.60/TOTAL1.00 (NG-01).
Avaliações declaradas09/10. Cartão limite1000, fecha20/vence28, competência outubro,
restante200 (inclui parcela corrente50), principal194/encargos6; futuras novembro/
dezembro/janeiro50 cada, principal integral; crédito0. Viagem alvo600/prazo2027-06-30:
reserva300 corrente+200 renda fixa. Reserva alvo100/prazo2026-09-30:50 poupança.
Leituras alvo12/progresso4/unidade livros/prazo2026-12-31. Receita prevista80 em
2026-11-05 na corrente, pendente.

| Grandeza | Esperado |
|---|---:|
| Contas assinadas |1300.00 |
| Investimentos |501.00 |
| Dívida200+3×50 |350.00 |
| Principal194+150 |344.00 |
| Limite disponível1000−344 |656.00 |
| Patrimônio1300+501−350 |1451.00 |
| Reservas contas/investimentos/total |350.00 /200.00 /550.00 |
| Caixa livre100+700+150 |950.00 |
| Investimentos não destinados300+1 |301.00 |
| Progresso viagem/reserva/leituras |500.00 /50.00 /4.00000000 |
| Receita/despesa/fluxo realizados ao finalizar |0.00 /0.00 /0.00 |

Meta reserva atrasada em 09/10/SP. Custo agregado/rentabilidade indisponíveis pela
renda fixa, patrimônio conhecido. Pagamento posterior de 200 da corrente quita
encargos de 6 e principal de 194: contas1100/dívida150/principal150/limite disponível850/patrimônio1451,
sem nova compra/despesa. Previsão80 não altera números. Se todos350 fossem principal,
disponível650, como FIN-03. Reservas continuam550, caixa livre após pagar750.

### E02 — payload mínimo válido

Primeiro save vazio; carteira automática continua zero:

```json
{"contractVersion":1,"expectedVersion":"0","action":"SAVE","payload":{"context":{"currency":"BRL","baseDate":"2026-10-09","boundaryAcknowledged":true,"cashOnlyAcknowledged":true},"currentStep":"REVIEW","sections":{"accounts":{"answer":"NONE","items":[]},"cards":{"answer":"NONE","items":[]},"investments":{"answer":"NONE","items":[]},"goals":{"answer":"NONE","items":[]},"allocations":{"answer":"NONE","items":[]},"forecasts":{"answer":"NONE","items":[]}}}}
```

200 SessionView version1/statusIN_PROGRESS/issues[]/payload igual/sessionId atribuído.
Prepare com ID/version/UUID novo retorna hashes reais/resumo zero. Complete200
recibo/mapping vazio/mesmos hashes/resumo. Replay/GET conserva completedAt/IDs.
Payload E01 completo/respostas sintéticas: [examples.json](../../../tasks/evidencias/CF-028/examples.json).
Fixtures documentais, não respostas de endpoints executados; placeholders não
são valores de wire. Exemplos completos gerados somente a partir de dados sintéticos.

### E03–E15 — bordas

| ID/entrada | Resultado independente |
|---|---|
| E03 conta1000/reserva300+nova700 |Livre0/patrimônio1000; mais0.01→400 sem efeito |
| E04 corrente200 incluindo50+futuras3×50 |Dívida350, não400; futura corrente→400 CURRENT_INSTALLMENT_DUPLICATED |
| E05 carteira80 com fatos; INITIALIZE_DEFAULT100 |409/saldo80; LINK mantém80, não180 nem outra carteira |
| E06 posição500/custoUNKNOWN |Patrimônio500/ganho indisponível; valuationUNKNOWN→subtotal/sem reserva nova |
| E07 máximos999999999999.99/999999999999.99999999 |Válidos; dinheiro1.005/1000000000000.00 inválidos;1×1.00500000→1.01;0.125×10.04→1.26 |
| E08 TOTAL1/quantidade3 |Vendas futuras de1 deixam0.67/0.33/0.00, sem recompor preço derivado |
| E09 fecha31/vence30,2027-02 |Fecha28/02/vence30/03;2028-02 fecha29/02; próxima fecha31/03, não28/03 |
| E10 fecha20/vence31,2027-02 |Vence28/02;2028 vence29/02;2027-02-29→400 DATE_INVALID |
| E11 mesma chave/hash/resposta perdida |Um efeito; replay/GET mesmos IDs/centavos/instante; resposta{} mantém desconhecido |
| E12 mesma chave/outro hash ou versão |409 INTENT_CONTENT_CONFLICT, recibo intacto |
| E13 fonte1000/reservas300; outro writer reserva650 |SOURCE_CHANGED antes de aplicar mais100, reservas vigentes950 preservadas |
| E14 conta−100/investimento500/dívida200/crédito20 |Patrimônio220; conta sem capacidade; crédito não aumenta limite |
| E15 TOTAL máximo/quantidade0.00000001 |Total válido apesar do preço derivado; soma duas fontes máximas→OUT_OF_RANGE |

Erro para dinheiro1.005:

```json
{"error":{"code":"INVALID_FIELD","message":"Revise os campos informados.","fieldErrors":[{"path":"/sections/accounts/items/0/balance/value","code":"DECIMAL_SCALE","message":"Informe no máximo duas casas decimais."}]}}
```

Conflito409: `{"error":{"code":"SOURCE_CHANGED","message":"Os dados vinculados mudaram. Revise novamente.","fieldErrors":[]}}`.
Timeout não gera JSON de sucesso: UI RESULT_UNKNOWN consulta operação; PREPARED
mantém pendência, COMPLETED válido confirma,401 login,404 reconciliação.

## 8. Matriz de compatibilidade e implementação futura

Caminhos relativos a `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/`,
salvo frontend. Inspeção estática da base, não testes de produto executados aqui.

| Requisito | Capacidade atual | Diferença/dona | Aceite futuro |
|---|---|---|---|
| Rascunho |Sem controller/entidade onboarding |CF-029:sessão/schema/versão/GET/PUT |Save sem efeitos,stale409,owners,reload |
| Carteira |AuthService cria CASH/SYSTEM_INITIALIZED zero; Account version, sem vínculo default |CF-030:identidade explícita nova/seleção legado/schema/inicialização protegida |Duas conexões não duplicam nem sobrescrevem usada |
| Abertura |AccountService.create grava openingBalance/date/origin/recordedAt |CF-030:comando interno/data-base/atomicidade global |Positivo/zero/negativo sem receita;rollback |
| Investimento |Investment TOTAL/PRICE/custo nullable/NG-01; create usa reportingKnownFrom=hoje/quantity default0 |CF-030:data-base/MONETARY sem unidades fictícias/aquisição/origem/instituição/identifier opcional |500/custo desconhecido/extremos preservados/schema compatível |
| Cartão |recordOpeningPosition/CardOpeningBatch/linhas OPENING, sem rota onboarding |CF-030:principal/encargos desconhecidos/crédito/override/opcionais/limite0 |Dívida350 única/limite656 E01;unknown não vira principal |
| Meta |GoalService initialProgress/alocações; CreateGoalDTO FutureInProductZone/sem unit |CF-030:prazo original/unit/origem da meta preexistente |Prazo vencido aceito/auditoria atual separada |
| Reserva |GoalAllocation/setAllocation validam fonte sob lock |CF-030:refs temporárias/valores finais/reservas externas em lote |550 não aumenta1451;corrida invalida revisão |
| Previsão |Transações pendentes/planejamento existentes |CF-030:ocorrência pendente vinculada/sem série ou baixa |80 não muda caixa/realizado/patrimônio |
| Intenção |FinancialIntents replay/complete/recover MANDATORY, kinds criação/operação |CF-030:kind/prepare/cancel/snapshots/constraints/coordenação |Resposta perdida recuperável/erro recibo reverte tudo |
| Precisão |Frontend src/types/index.ts balance/currentValue number; parser legado exato restrito |CF-029/030:DTO strings;CF-031:tipos/validação próprios |Sem Number financeiro v1, POST/GET/replay |
| Jornada |Formulários cotidianos separados |CF-031:etapas/revisão/unknown/gerações |Teclado/mobile/foco erro/sem falso sucesso ou vazamento |
| Integração |Aceites financeiros localizados, não E2E onboarding |CF-032:browser/BFF/Spring/PostgreSQL/reload/exportação |E01/bordas persistem/reconciliam;só externos mockados |

Novas migrações rascunho:CF-029; posições/recibo/adaptações finalização:CF-030.
CF-017 conserva adoção real, não absorve implementação nova para encerrar CF-028.
CF-031 mantém CF-015/demais dependências;CF-032 não substitui testes próprios.
Nenhuma sucessora muda de estado. Fontes financeiras com dado UNKNOWN exigem
adaptação também dos leitores afetados em CF-030/031, sem default0 silencioso.

## 9. Trade-offs, revisão e limites

Prepare separado custa ida à API/estado persistido, mas vincula revisão/fontes/
versão a identidade recuperável sem payload financeiro no browser. Hash não
substitui locks/autorização. Strings preservam precisão e exigem input/formatação
próprios, sem migração inadvertida de contratos legados. Snapshot completo simplifica
retomada/conflito com payload limitado, sem merge automático financeiro. Desconhecidos
preservam verdade e reduzem totais. Complemento conservador evita sobrescrita, mas
ajustes posteriores dependem dos fluxos regulares rastreáveis.

Revisor independente deve confrontar FIN/NG/temporal/ownership, recalcular E01–E15,
tentar duplicar carteira/corrente/futuras/reservas, adulterar decimais/IDs/recibos,
examinar cada corrida e desconhecidos sem zero fictício. Conferir matriz antes de
estimar implementação. Validação documental não prova HTTP/PostgreSQL/locks/UI/
desempenho/atomicidade em runtime. Sem autoaprovação.

Pendentes: revisão independente e implementação/validação da matriz. DEC-ONB-01
respondida; demais protocolos/limites são escolhas técnicas CF-028, não decisões
atribuídas ao usuário. Após especificação e revisão, sequência planejada é
fechamento dirigido frontend CF-010–015; **não iniciar automaticamente onboarding**.
