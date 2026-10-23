# Achados independentes e condições de encerramento

Localizações abaixo são do candidato123e5a5; nomes/IDs originais preservados.

## CF032-01 — P2 — reserva sem capacidade comprovada

Defeito confirmado de autorização backend. `GoalService.java:251–274` chama
ensureCapacity (`350–359`) que soma apenas goal_allocations e passa conhecimento
como true. addValue (`164–183`) repete a mesma premissa; moveAllocation usa
ensureCapacity no destino. O guard de inventário/locks existente não cria a regra
faltante: serialização de uma decisão incorreta continua aceitando o aumento.

SPEC001 §5/5.1/DEC-ONB-02: nominal UNKNOWN e atribuição UNBOUNDED sem exclusões
atingem todas as fontes elegíveis do owner, inclusive novas. E2 possui conta1000,
opening_origin UNKNOWN, meta legada allocation_reconciled=false e reserva com
reservationId igual ao ID dessa meta (identidade correta, sem duplicata da mesma
pendência). evidence=[]; não há prova de independência. Saldo conhecido não implica
reserva0 nem capacidade1000. Nova meta reconciliada não limpa risco da fonte.

Reprodução nova `run-01/E2-before-sql.json`, `E2-response.json`,
`E2-after-attempt-sql.json`: PUT alocação0.01 retorna204, grava linha e progresso0.01;
conta permanece1000, pendência intacta. Não é apenas toast/aceitação visual. A soma
materializada aumenta0.01, mas disponibilidade verdadeira continua UNKNOWN; não
alegar déficit numérico quantificável ou débito de caixa. Critério3 impedido.

Controle positivo R1: E01 sem pendência aceita0.01, soma de reservas350.01, mesmo
caixa/patrimônio. Outro owner com UNBOUNDED registra despesa real1 pela UI,
saldo999, pendência intacta: não propor bloqueio geral da conta. Controle E32 em
OnboardingReservationsTest usa exclusão com evidência/revisão/inventoryToken,
permite100 na fonte independente e persiste, distinto de supor independência por ID.

Saneamento mínimo: decisão de domínio por fonte que inclua união de pendências,
evidências válidas e capacidade; integrar writers de destinação efetivamente
afetados, não importar a tela/estado da entrevista. Consumidores diretos: aporte,
ajuste/movimentação de reserva, apresentação de livre/progresso e qualquer writer
voluntário que use a mesma capacidade (investigar compra de ativo antes de afirmar
o mesmo defeito). Onboarding já tem controles positivos/negativos; não reabrir
CF030 inteira.

Encerrar com E2→400/sem alterações, conta e investimento, duas pendências, exclusão
válida/inválida, resolução parcial, redução conhecida e destino de move, mais
concorrência contra confirmação. Preservar transação e ordem de locks. Projeção
em lote O(N+R+E), E podendo chegar N×R para incidência ampla; evitar planner completo
por item/N+1. Há custo de leitura/consistência; não há medição que justifique cache,
índice novo ou mudança arquitetural nesta revisão.

## CF032-02 — P2 — limite disponível calculado pela fatura corrente

Defeito confirmado de fórmula/campo frontend, não cache, refetch ou oracle.
`useCards.ts:269–276`, `creditCardItem.tsx:55,131`; contrato TypeScript
`cardService.ts:3–14` sequer declara committedLimit/availableLimit retornados.
Backend `CreditCardService.java:355–400` usa agregado por cartão; repository
`CardTransactionRepository.java:15–24` considera principal aberto de todos períodos.

K: mesmo cartão E01 e instante, limite1000, dívida350, principal194+3×50=344,
encargos6, crédito0, pagamentos/estornos0. SQL comprova os componentes; novembro
ativo contém50 após fechamento20. Disponível656, nunca1000−50=950.
`run-01/K-card-sql.json`, `K-api-versus-ui.json` e imagem demonstram divergência
após reload; `run-02-supplemental/R2-card-session.json` após logout/login.
Não confundir este checkpoint com B final: principal270 e disponível730.

Critério2 impedido no consumidor. Saneamento: DTO/validação e uso de métricas
corretas no resumo/cartão/barra, preservando UNKNOWN/null sem default0. Encerrar
com K/R2 corretos, futuras/encargos/quitação parcial/créditos/estornos, limite0,
reduzido/negativo e agregado. Cálculo agregado frontend O(C), C cartões; reaproveitar
leitura em lote backend, sem request por cartão. Compatibilidade/incompletude é o
trade-off; renomear “Disponível” para encobrir a fórmula não atende FIN03.

## CF032-03 — P2 — identificação omitida para ticker opcional

Defeito confirmado de apresentação/acessibilidade. SPEC001 tabela Investment CREATE
exige name, torna identifier opcional. API/SQL guardam UUID, nome, tipo e valores
de duas posições legítimas ticker=null. `investmentItem.tsx:67,87` só usa ticker;
`investmentDetails.tsx:61` nome acessível null; `operationModal.tsx:176,312` rótulos
sem fallback. Descrição de aporte sem ticker também aparece como Aporte:null em C.

`run-01/L-api-versus-ui.json` e screenshot: dois botões “Ver detalhes do investimento
null”, nomes ausentes da lista. O tipo/valor ainda diferencia visualmente essas
duas posições, mas não substitui a identidade contratual. R2 navega cada botão,
captura GET de histórico por dois UUIDs diferentes e mostra respectivos nomes no
corpo do detalhe. `investmentsScreen.tsx` key=ativo.id e useInvestments seleciona
por id; payload operacional usa investmentId. **Não demonstrada associação,
key duplicada, edição ou operação no ativo errado.** Edição não foi exercitada;
não ampliar o impacto além da evidência.

Critério2/uso diário integrado pendente no consumidor, sem refutar persistência.
Encerrar com nome como fallback para lista/aria-label/detalhe/modal e descrição,
dois ativos sem ticker (também mesmo tipo), seleção por UUID preservada, reload,
privacidade e operação. Não exigir ticker. Função de rótulo O(1) por item evita
divergência entre consumidores; não usar o texto como chave nem alterar provenance.

## CF032-04 — P3 — segundos truncados ao serializar XLSX

Defeito confirmado na exportação, candidato `TransactionService.java:1102,1128`.
Entrada C12:34:56; DTO/API/SQL preservam segundos. Formatter HH:mm seguido de
setCellValue(String) produz12:34. Inspeção OOXML independente dos arquivos antigo
e novo: B9 inlineStr, style0/numFmtId0 (General), texto12:34. Não há fração de dia
numérica com segundos escondidos. Classificação **B**; transformação acontece
na exportação, não antes no armazenamento (**C refutado**). **A refutado**.

SPEC002 “Horário informado”: saída canônica HH:mm:ss; detalhe preserva segundos;
AC-UI-005/011 inclui exportação na conservação semântica. A permissão HH:mm está
expressamente na UI. Não foi encontrada política **D** que autorize truncar o
arquivo de detalhe. Há ausência de frase específica “XLSX HH:mm:ss”, mas não
ausência de precisão geral definida: este parecer aplica a regra geral. Nenhum
requisito de round trip de recordedAt/IDs ou tipo numérico foi inventado.

Critério2 pendente na dimensão temporal; dinheiro/escopo/status mantêm aceite.
Encerrar com valor12:34:56 visível/preservado em bytes, segundos00 e ausência
neutra, comparados com API/SQL e leitor, ou decisão contratual explícita que
autorize precisão diferente e seus consumidores. Compatibilidade de leitores é
risco de mudança; texto HH:mm:ss preserva o tipo atual sem conversões de fuso.

## Classificação das demais ocorrências

Falhas históricas de cwd/cookie do APIRequestContext, coluna time/operation_time,
seletor null, fixture duplicada, logout, competência e assertions K não aguardadas
são defeitos do harness já delimitados. Não reabrir sessão/financeiro por associação.
K-result run08 não vale como sucesso; relatório Playwright e run09/10/revisão
preservam a falha. Novo R2 vermelho é somente CF032-02, não erro do observador.
Zoom/carga/restart/edição e matrizes não executadas são limitações, não defeitos.
