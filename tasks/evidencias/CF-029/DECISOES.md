# Decisões e limites técnicos — CF-029

## Fronteira de escrita

`OnboardingController` limita leitura a 256KiB+1 antes do parse. `DraftValidator`
valida o schema fechado da SPEC-001, rejeita chaves duplicadas/JSON adicional e
normaliza strings decimais sem float. `DraftConsistency` produz issues de respostas
incompletas/inconsistências locais; não autoriza finalização nem calcula patrimônio.
`DraftReferences` consulta somente IDs enviados, agrupados por tipo e owner.
`OnboardingDraftService` coordena versão, estados e transação; o repositório JPA
persiste a sessão. Nenhum serviço de escrita financeira é chamado pelo save.

Árvore JSON foi escolhida para conservar ausência de folhas e uniões fechadas sem
centenas de DTOs parcialmente nulos. Custo: maior responsabilidade de validação
explícita; testes de discriminadores/ausência/tipos são essenciais. Não é um framework
genérico nem substitui os DTOs dos módulos existentes. JSON financeiro persistido
contém strings exatas, não números binários. Money/Quantity mantêm teto individual;
SummaryAmount/AggregateMoney não são tipos de escrita aceitos por esta API.

O estado SKIPPED com respostas só volta a IN_PROGRESS por RESUME. SAVE de um
tombstone descartado é permitido, conforme §5. DISCARD mantém ID/versão e limpa
payload/issues. Login expira; draft não. COMPLETED rejeita os quatro comandos.
Não existe produtor de COMPLETED/PREPARED nesta tarefa: prepare/cancel/complete,
pendingIntent e completedReceipt exigem implementação conjunta na CF-030. O teste
do bloqueio terminal injeta estado sintético; não certifica finalização.

## Transações e concorrência

PUT autentica/valida o corpo antes da transação, captura Clock uma vez e adquire
lock da linha do owner em users antes de consultar/criar a sessão. A exclusão
existente já usa esse primeiro lock. Unicidade user_id no PostgreSQL é a segunda
defesa da primeira criação. Versão explícita bigint começa em1 e é transportada
como string; maxLong conflita, sem overflow. Sem last-write-wins, retry interno,
merge silencioso, HTTP interno, email, cotação ou gravação financeira.

Lock de owner serializa saves daquele usuário, inclusive primeiro save, com
lock_timeout5s. Diferentes owners possuem linhas distintas. Contenção→409
LOCK_CONFLICT; cliente deve recuperar por GET antes de tentar novamente. Resposta
perdida de PUT não é replay: recuperar snapshot/versão. Não foi introduzido um
protocolo paralelo de idempotência. FinancialIntents/CF-024/027 continuam reservados
para a finalização da CF-030, com sua ordem intenção→owner→fontes.

Consultas de referências são de validação do rascunho, sem locks de fontes. Um
writer financeiro pode mudar/remover uma referência depois de SAVE. CF-030 deverá
revalidar inventário, evidência, versões e capacidade sob coordenação comum antes
de preparar/aplicar; um draft salvo ou suas issues vazias não são autorização.
GET devolve o último payload/issues confirmado; não reconcilia posição atual.

## Persistência protegida de confirmações e evidência

V15 adiciona `onboarding_sessions` e `onboarding_reservation_records`, sem backfill
ou alteração de V1–V14. Sessão guarda snapshot de propostas ASSIGN/CLOSE e sua
versão; autor vem somente da autenticação. Não há owner/evidence/independent/
candidates/inventoryToken aceitos na escrita. Confirmar no draft não altera
atribuição/evidência do domínio nem encerra reserva.

`onboarding_reservation_records` define armazenamento interno de identidade,
owner, revisão, snapshot de atribuição/evidência e instante. Não possui endpoint,
repositório de escrita público, população automática ou classificação por nome,
ID novo, ausência de vínculo ou valor zero. CF-029 apenas verifica owner/revisão
dos IDs propostos. Os testes semeiam um registro sintético explicitamente.

CF-030 é responsável pelo produtor autoritativo desses registros: validação dos
DTOs de leitura §5.1, exaustividade/independência, inventário-base, evidências com
IDs/revisões/proveniência/validatedAt, preservação histórica imutável das revisões,
tokens, composição da união de bloqueios e commit atômico. Não alimentar a tabela
com texto de cliente nem sobrescrever trilha anterior. A tabela atual não é um
serviço de reconciliação nem prova de que esses requisitos futuros estão cumpridos.
Migração de eventual trilha adicional pertence à tarefa que implementar seu writer.

Exclusão de usuário inclui explicitamente ambas as tabelas na mesma transação;
FKs ON DELETE CASCADE também protegem o schema gerenciado. Sem política de retenção
ou expiração nova. Persistência protegida significa fronteira autenticada, consultas
por owner e ausência de escrita arbitrária, não certificação de ACL/criptografia
de um ambiente real que não foi acessado.

## Consultas, volume e custo

N é número de itens/partes/refs do request limitado, B seus bytes. Parse,
normalização, índices de tempId e comparação de pares: O(B+N) tempo/memória;
passagens por tipos fixos não geram N+1. Ordenação dos seis nomes de seções é
constante. Fonte/refs em lote: no máximo cinco consultas de tipos, uma de
confirmações, uma consulta EXISTS de classificação, além de lock/lookup/escrita
da sessão. Não carrega inventário financeiro completo ou coleção ORM EAGER.

IN por PK restringe consultas aos IDs enviados; índice único de owner na sessão,
índice de owner no registro e índices anteriores dos módulos auxiliam buscas.
A classificação usa EXISTS para fatos e origem automática explicitamente
comprovada; nome/CASH/saldo0 isolados não classificam NEW. SQL constante em número
não significa custo O(1) no banco: probes dependem dos índices, cardinalidade e
seletividade do owner. Em pior caso a classificação visita seus fatos/contas.
Fixtures pequenas não certificam latência/carga/planos de produção.

## Contratos financeiros preservados e sucessoras

E01 conserva inputs, prazo vencido e avaliação TOTAL1.00/quantidade3; save não
aplica patrimônio1451/dívida350/reservas550. UNKNOWN não vira zero, custo não vira
avaliação, quantidade MONETARY não vira unidade fictícia. Dívida/reservas/limite
não se tornam saldos. Nenhum histórico de aquisição, transferência ou transação
é inferido. E23/E28/E34 KNOWN400 e E32 KNOWN500 permanecem oráculos documentais
de CF-028, não resultados financeiros certificados nesta entrega.

CF-030 conserva SummaryAmount, agregados amplos, bloqueios por origem incerta,
finalização segura com lacunas e revalidação concorrente. CF-031 conserva UI/BFF,
calendário do navegador, limpeza de memória e apresentação; CF-032 conserva E2E.
Sem UI nesta tarefa, não há teste de browser ou alteração de relógios/animações.
CF-010/015 zoom200% e CF-017/P01/P02 adoção real permanecem pendentes.
