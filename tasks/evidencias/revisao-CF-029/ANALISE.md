# Código, contratos e fronteiras

Análise do intervalo dd554d1..5bac46e; produto original não editado. SPEC-001,
SPEC-002, FIN-06/NG-01, CF023/CONTRATO, CF024/CONTRATO, CF027/MAPA, CF028 e
pareceres de R28 foram confrontados com implementação e testes. Aprovação
documental final CF028 permanece preservada: o problema RC029-01 é implementação.

## Autenticação, referências e estado

GET/PUT recebem User via AuthenticationPrincipal; DTO fechado não admite owner,
sessionId alternativo ou evidência arbitrária. Sessão buscada por userId; UUID da
sessão nunca é escolhido pelo cliente. Referências agrupadas por kind e filtradas
por owner; alheio e inexistente retornam404 sem dados da referência. Revisão de
registro protegido divergente409. Não há escrita antes dessa validação.

GET não cria sessão. SAVE/PAUSE/RESUME usam substituição integral; folhas ausentes
persistem ausentes com issues, null malformado rejeitado, zero explícito preservado.
Listas vazias removem itens anteriores; referência temporária removida fica pendente.
PAUSE conserva o snapshot enviado; SAVE pausado continua SKIPPED; RESUME reativa.
DISCARD conserva identidade/versão/tombstone e limpa payload; SAVE posterior usa
versão atual. COMPLETED rejeita todos os comandos, sem produtor nesta tarefa.

LINK de conta própria arquivada pode persistir como declaração de referência.
Não equivale a autorização de aumento de reserva ou INITIALIZE_DEFAULT. Mudança
posterior de saldo não reescreve o draft no GET; remoção da referência impede novo
PUT404 sem sobrescrever o último confirmado. A tabela de concorrência financeira
§6 não deve impor409 universal a todo SAVE de recurso arquivado. A preparação
CF030 deverá avaliar elegibilidade/snapshot e aplicar SOURCE_CHANGED onde cabível.
Tipo de meta numérica no próprio snapshot já conhecido deve gerar issue: RC029-01.

## Transações, locks e custos

save é @Transactional, lock users FOR UPDATE antecede busca/criação da sessão,
verificação de versão e gravação; saveAndFlush não encerra a transação. Resposta
sai pelo proxy após commit. Unicidade user_id protege primeira criação. A revisão
bigint explícita só é segura enquanto todos os escritores de sessão respeitarem
esse protocolo: não é @Version global. Não há outro writer no candidato.

Exclusão usa o mesmo primeiro lock de owner e apaga ambas as tabelas na transação
existente. GET não adquire lock. SAVE não bloqueia fontes; portanto não há ciclo
novo owner→fonte→owner introduzido por ele. Writers financeiros antigos não passam
a respeitar um guard universal por causa desta tarefa; CF030 mantém essa obrigação.
Timeout5s vira409 LOCK_CONFLICT; sem retry automático. Captura de Clock uma vez,
Instant truncado a micros e datas civis permanecem strings validadas por LocalDate.

Vantagem: criação e atualização serializadas inclusive entre instâncias via banco.
Custo: saves e exclusão do mesmo owner disputam uma linha; atualizações da própria
linha users também podem esperar. Outros owners permanecem independentes. Não se
justifica redesenho distribuído/Kafka ou lock de inventário financeiro para salvar
rascunhos. Probes observam bloqueio real por pg_blocking_pids, sem sleeps arbitrários.

Para B bytes e N itens/referências, parse/validação/normalização/índices são O(B+N)
em tempo e memória; limite256KiB e cardinalidades contratadas delimitam entrada.
Há no máximo cinco consultas de referências, uma de confirmações e uma classificação
EXISTS, além de SET LOCAL, lock, busca da sessão e persistência ORM (merge de UUID
atribuído pode fazer SELECT adicional). Não há SELECT por item ou coleção EAGER.
O número de instruções tem teto independente de N; custo do banco não é O(1):
IN/EXISTS dependem de cardinalidade/índices. Sem benchmark de carga/EXPLAIN de
produção, não há promessa de latência. Classificação consulta fatos por owner,
sem inferir NEW pelo nome CASH ou pelo saldo zero isoladamente.

## Financeiro e migração

BigDecimal a partir da string, sem MathContext/double; escala excessiva é erro,
não arredondamento. Dinheiro assinado só em conta. TOTAL conserva amount/quantity,
UNKNOWN não recebe zero, MONETARY exige NOT_APPLICABLE para quantidade. Agregados
amplos e SummaryAmount são CF030, não inputs novos do rascunho.

Únicas escritas do serviço: onboarding_sessions. ReservationRecord é contrato
protegido de armazenamento sem writer HTTP. Confirmações não alteram attribution,
evidence ou revisão de domínio. Nem SAVE nem descarte produzem recibo financeiro.
V15 adiciona duas tabelas, FKs users CASCADE, unicidade sessão/owner, índices e
checks; nenhuma modificação V1–V14 ou backfill financeiro. TEXT conserva decimais
como strings JSON; não depende de coerção numeric. Cadeia Flyway e Hibernate validate
do contexto exercitam schema real; exclusão explícita e cascata são compatíveis.

O snapshot integral simplifica retomada e conflito, ao custo de reenvio completo.
JSON fechado evita DTOs parciais numerosos, mas centraliza responsabilidade por
validação semântica manual; RC029-01 demonstra esse risco concretamente. A menor
correção é completar o diagnóstico por referência, sem trocar o armazenamento.

## Testes anteriores

Inventário XML confirma176/53/53, sem somá-los como282 casos distintos. Os53 de
SP e+14 são o mesmo conjunto. A seleção176 contém40 casos do validador,11 integração,
1 migração e124 de consumidores; o delta final acrescentou um caso de issues,
resultando em41+11+1. Inventário de nomes em historical-test-inventory.json.

Os metadados históricos não identificam um commit imutável por execução; registros
descrevem a árvore em implementação sobre dd554d1. Não atribuir retrospectivamente
176 ao conteúdo final inteiro. Manifestos finais conferidos:22 fontes e96 evidências
idênticos aos hashes declarados. A reexecução baseline-utc usa o candidato final.
Mudança no teste de autenticação mantém401/mensagem/ausência de dados e distingue
envelope SPEC001; mudança no teste de exclusão só parametriza destino de evidência.
Nenhuma assertion financeira existente foi enfraquecida.

### Limite temporal identificado nesta revisão

`ControleFinanceiroApiApplication.java:22` executa TimeZone.setDefault(São Paulo)
em @PostConstruct, preexistente ao intervalo. Logo, parâmetros -Duser.timezone
UTC ou Pacific/Kiritimati não comprovam por si só o fuso efetivo durante os testes
Spring. Os logs históricos mudam de offset após inicializar o contexto. Não é
regressão CF029 nem justificativa para reabrir aceites anteriores.

Novo `OnboardingForeignZoneReviewTest` impõe e verifica Kiritimati em @BeforeEach
depois da inicialização, restaura em @AfterEach e herda os11 controles de integração.
`effective-kiritimati/` registra o controle explícito e resultados. A afirmação de
53 testes históricos integralmente em UTC+14 não foi aceita como evidência suficiente.
