# Revisão independente CF-025/026/027 e resíduos RV24 — 03/10/2026

## Decisão

**CF-025, CF-026 e CF-027 aceitas nos seus escopos e concluídas. RV24-01 e CF-009 permanecem em_revisao. CF-028 apta a iniciar exclusivamente a especificação, estado pronta.** Nenhuma implementação de onboarding foi iniciada. Não há autorização de deploy, migração real ou liberação automática de CF-029–034.

RVR24-02 (callback obsoleto) encerrado no alcance verificado. RVR24-01 permanece aberto: os corpos vazios/incompletos originais foram corrigidos, mas um resultado de investimento com bruto incompatível ainda confirma sucesso e apaga a intenção. [Achado e reprodução](ACHADOS.md). RV24-02 preserva seu aceite em `40e07ef`; não se confunde com o resíduo RVR24-02.

## Base e preservação

Base de produto examinada e executada: `06c1a516aa847088fa7b273601d618f69b489a21`, branch `main`. Não havia deltas posteriores no início. [Baseline](baseline.json): staging vazio e única alteração preexistente `README.md`, SHA-256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`. README não editado nem incluído nos commits. As instruções AGENTS fornecidas pelo usuário foram aplicadas; a busca no workspace não encontrou outro AGENTS.md.

| Entrega | Intervalo integral confrontado | Alterações posteriores relevantes |
|---|---|---|
| CF-025 | `846c64c..04cad8d`; produto/testes `65ec14e` | Habit/serviço/repositório sem delta posterior; CF-026 muda tipos/apresentação dos consumidores de hábitos |
| CF-026 | `5f26a1d..30211b8` | RV24 introduz outro hook e consumidores de criação em `53fa3a8`; saneamento `9e6e8d7`. Não atribuir esses defeitos ao cleanup de useOptimisticMutation |
| CF-027 | `40e07ef..a8c3724`; produto `dcac7c5` | Nenhum delta backend de produto após `dcac7c5`; revisão executa o candidato integrado |
| RV24 residual | `a8c3724..9e6e8d7` produto/testes | `9e6e8d7..039a116` reconciliação; `039a116..06c1a51` evidências/encaminhamento |

Ancestralidade de todas as referências confirmada. [Intervalos e nomes de arquivos](intervalos.txt). Aprovações valem para esses fontes no candidato; os commits desta revisão acrescentam somente provas/documentação/estados. Não foram revertidos fontes posteriores para reproduzir históricos na árvore principal.

Fontes normativas: tasks/README, EXECUCAO, POLITICA-DE-TESTES, canônicos CF-009/025–028, RV24-01/02 e dependências CF-028; SDD/ADR-001/004/005, SPEC-001/003/004, DEC-10 em CF-024/CONTRATO; critérios/oráculos CF-025. Pareceres e resíduos de `40e07ef`, evidências das três entregas, saneamento residual e reconciliação foram confrontados como registros históricos, não como instruções de aceite.

## Parecer RV24-01 — não concluída

Os seis testes originais foram executados com bytes idênticos aos publicados pelo revisor: SHA-256 `b58841ad01232c87d6edaa022226f5daf71775b5c77430eb9a1b9f40739620ec`. Em cópia isolada com os quatro consumidores/hook/serviço de `a8c3724`, cinco falham causalmente e o sexto passa; restaurando os fontes atuais, os seis passam. [Hashes/restauração](original-proof.json), [vermelho](original-before.log), [restaurado](original-restored.log). Isso é reprodução nova; os logs antes/depois do executor permanecem históricos.

**RVR24-01: aceite parcial do reparo, achado ainda aberto.** Null, array, objeto vazio, campos ausentes/não finitos, tipo/data/conta/categoria incompatíveis e identidade/kind de recibo não autorizam complete nos testes originais/residuais. Retry conserva comando/UUID; GET autenticado não cria operação. Storage indisponível impede envio; falha de remoção com DTO válido alcança removeItem e conserva a identidade. A sexta prova antiga isoladamente já não prova esse ramo após o parser, por isso foi conferido o complemento válido.

Entretanto `validateInvestmentResult` só exige que totalValue seja finito e positivo quando não há amount monetário. BUY quantidade 2/preço 100/total 999 é aceito. Três novas provas falham por resultado confirmed e storage/pending null em POST/retry/GET; controle positivo de HALF_UP (1 × 1.005 → 1.01) e custo histórico desconhecido passa. A falha pertence à RV24-01, não representa três achados nem prova de que o backend atual emite 999.

**RVR24-02: encerrado.** run captura geração; invalidation no layout cleanup, sessão ou unmount impede complete/erro/liberação de busy antiga. Outcome obsolete não chama onSuccess/onClose/onReconcile dos modais. A→B→A não reativa a geração antiga; envelope de A fica recuperável. Foram exercitados sucesso/erro tardios, unmount, A→B, A→B→A, expiração, recover/retry obsoletos e recuperação válida posterior. Unknown/rejected da execução ativa ainda reconciliam; confirmed fecha normalmente nas jornadas reais. Cancelamento lógico não desfaz o commit.

**Integração nova:** seis jornadas originais e seis com corrupção somente da resposta após `route.fetch()` confirmar POST real. Na variante inválida, POST vira null/array e GET real vira result={}; não há sucesso financeiro mockado. Browser Chromium → Next/BFF → Spring → PostgreSQL16/Flyway V1–V13 → reload. Cada conta de transação termina 950 (duas intenções legítimas de 25); cada conta de investimento termina 600 e posição 14 (duas compras de 200). Dois recibos para A e zero para B por jornada; replay exato não cria linhas; conteúdo diferente 409. Trigger de recibo prova rollback antes do commit e reutilização da identidade. [SQL original](validation-authorized/browser/postgres-oracles.txt), [SQL inválido](invalid-responses/browser/postgres-oracles.txt), persistência completa nas mesmas pastas.

Limites: integração de fault injection lógico, sem corte TCP físico; sessão multiusuário em contextos browser separados complementada por troca em componentes, sem nova bateria integral de sessões. Transferência/resgate/proventos têm provas backend e de parser; as jornadas novas são EXPENSE/BUY. H-RV24-01 ECONNRESET não ocorreu nessas jornadas, mas **permanece inconclusivo**. Não se encerra sua causa por repetição verde.

## Parecer CF-009 — em_revisao mantido

O aceite não decorre automaticamente da RV24. Os quatro critérios foram confrontados na [matriz](MATRIZ.md): seleção/rollback e segregação conservam os aceites de R01/R02 e R03/RV01, complementados pelas regressões atuais de componente. O critério de não haver falso sucesso permanece incompatível com RVR24-01. RVR24-02 agora satisfaz o recorte de callbacks obsoletos. H-RV24-01 continua investigação de transporte; não é novo defeito financeiro comprovado. Não foram repetidos todos os módulos, adoção temporal ou matriz visual do marco.

## Parecer CF-025 — concluída

O único delta de produto torna `Habit.specificDays` LAZY. Busca global dos usos e DTOs confirma que a lista/calculador não consomem essa coleção; lista converte DTO dentro de transação readOnly e busca logs por EntityGraph. Reorder não precisa dos dias e usa o mesmo OwnedResourceOrder MANDATORY, filtro de owner e SELECT ordenado por UUID com lock pessimista. Não há fetch de coleção paginada novo. Criação/update/toggle/cron continuam em seus limites transacionais; dias preexistentes permanecem no banco.

Nova medição 3/30/120: **1 SELECT + N UPDATEs**, sem buscas secundárias de dias; p95 local 7,981/26,041/104,838 ms. [CSV](validation-authorized/metrics.csv), [EXPLAIN](validation-authorized/plans.txt). Mutação isolada LAZY→EAGER somente em specificDays reprova o teste por 4 SELECTs versus 1, e a restauração passa. O antes/depois histórico com instrumentação corrigida conserva 4/31/121→1 e p95 205,648→119,037 ms para 120; é comparação histórica do executor, corroborada pela contraprova nova, sem comparar tempos de runs distintos como benchmark pareado.

Os sete testes CF-025 conferem cardinalidade/dias/logs, IDs únicos, páginas 20+10, entradas 300, posse, rejeição integral e waiter real observado por pg_blocking_pids em commit/rollback. Regressões adicionais de hábitos/calendário/scheduler passam na restauração. Nenhuma alteração de regra, índice, lock ou lote de escrita foi encontrada.

**Custo:** quantidade de SELECTs do reorder O(1), mas SQL total/execuções JDBC O(N); mapa/raízes O(N), dirty checking/escritas O(N). Ordenação no banco pode custar O(N log N); plano de 120 mostra Sort/quicksort antes de LockRows. JDBC não mede pacotes de rede. Listagem materializa H raízes + L logs, O(H+L), sem limite universal de memória. LAZY elimina carregamento não usado, não torna todo o fluxo O(1) nem resolve contenção de writers concorrentes. Próximo consumidor que precisar dos dias deve fazê-lo na transação e ter medição própria.

Medições são sintéticas, aquecidas, 20 amostras/rota, sem carga HTTP concorrente/pico de heap/SLA; cartões/investimentos não têm volume no benchmark. Esses limites são explícitos e proporcionais à alteração. RJ-022-01 e H24-01 permanecem inconclusivos, mesmo com scheduler verde nesta rodada. Apenas a aresta CF-025→CF-033 fica satisfeita.

## Parecer CF-026 — concluída

Diff completo: bindings removidos preservam awaits, refreshes, catches/finally e callbacks. GoalDepositDTO passa a representar o protocolo já enviado; genérico de reorder preserva IDs/objetos; datas de hábitos são string/tupla, eventos e ícones têm tipos concretos. Não foi introduzido cast cego, ignore, exclusão ou redução de regra. Essas anotações locais não são um validador global de todo HTTP.

Parser de configuração recebe JSON como unknown, testa array/record, reconhece ID antes de indexar CARD_DEF, filtra extras/desconhecidos, preserva booleano false, largura permitida e primeira duplicata, completa defaults. Complexidade O(K) no número de entradas com universo fixo de sete cartões; memória de parsing O(tamanho do JSON), saída no máximo sete. Trade-off: defaults recuperam apresentação malformada sem expor objetos arbitrários; não certificam persistência de toda preferência em todas as telas.

getErrorMessage só entrega texto ou fallback; erro null não lança novo erro. Protocolo numérico, erro/retry de reorder e releitura no 409 do aporte foram exercitados. Nesse 409, onSuccess é nome legado para refresh: o modal não fecha nem prova sucesso financeiro.

Cleanup captura o Map usado pelo efeito, mantendo geração, token e Promise da mutação. A→B→A, mesmo ID em execução nova, unmount e sucesso/erro tardios não liberam lock atual nem disparam callback/toast antigo. Contraprova remove somente comparação de geração em cópia: quatro cenários falham; restore passa. Fontes históricos de parser/erros produzem nove falhas e duas rejeições não tratadas originadas de null no próprio produto antigo (não erro de import); candidato 23/23. [Resultados/restauração](frontend-probes/result.json).

Lint atual zero erros/avisos em 247 alvos, typecheck exit0, build exit0 após download autorizado de fontes, 236 componentes e seis unitários por fuso SP/UTC/Kiritimati. A aprovação se apoia em diff, oráculos e contraprovas, não nas contagens. RV24 posterior conserva seu dono/achado; não se certificam todos os consumidores financeiros pelo aceite da tipagem. CF-032/034 têm esta aresta satisfeita, mantendo todas as demais dependências.

## Parecer CF-027 — concluída

FinancialIntents explicita replay/complete/recover, owner UUID e obrigação de sequência; PostgresFinancialIntents concentra JPA/advisory lock/JSON/Clock. TransactionService.create e InvestmentService.performOperation permanecem @Transactional; replay precede fontes/efeito e complete sucede o efeito na mesma transação. O adaptador preserva MANDATORY inclusive chave ausente. Recover readOnly pode abrir transação própria de leitura, como antes; não separa o commit financeiro. Controller mantém URL/status/DTO/ownership.

Fingerprint extraído conserva encoding, ordem/defaults dos argumentos e SHA-256; entidade/repositório/DTO só mudam pacote. Sem alteração de resources/schema/API entre base e extração. Snapshot antigo literal permanece legível, com timestamp, owner e conflito por kind/fingerprint; replay não recalcula estado atual. Falha no recibo desfaz efeito/recibo/cache; retry posterior funciona. Evento continua AFTER_COMMIT, sem cache externo antecipado ou novo retry interno. Ordem intenção→contas ordenadas ou conta→investimento permanece.

210 testes do gate delimitado incluem CF-02430, transações/investimentos, HTTP/segurança/isolamento, migrações sintéticas, arquitetura/fingerprint/proxy, exclusão e runner de seis jornadas. Nova contraprova elimina acesso direto ao repositório, REQUIRES_NEW e recuperação sem owner por três falhas causais independentes. Restaurados passam. Os outputs perdidos de target **não foram recuperados**; estas são provas novas suficientes para as garantias necessárias, não reconstrução do histórico.

Trade-offs: evita dependência de investimento na persistência de recibo hospedada em transaction e mantém atomicidade local. Interface genérica/Object não impõe replay→efeito→complete pelo sistema de tipos. Classes internas continuam públicas na JVM; teste de constant pool detecta referências compiladas diretas, não reflexão arbitrária/SQL indireto. DTO público ainda contém JsonNode, portanto existe acoplamento transitivo a Jackson; não há alegação de independência hexagonal total. UserService conserva cleanup SQL e pagamentos/comandos antigos mantêm protocolos próprios. O teste não substitui revisão dessas sequências. Nenhuma necessidade de microsserviços/módulos Maven adicionais foi identificada.

Fingerprint O(L), serialização O(S), número fixo de statements por intenção, lookup indexado e espera de lock dependentes dos dados/contenção. Colisão do hash advisory pode serializar intenções distintas; limitação herdada, sem promessa universal de ausência de deadlock. Apenas a aresta CF-027→CF-033 fica satisfeita; backend aceito não comprova parser frontend.

## CF-028 — apta a iniciar somente especificação

Consumirá os contratos de posição de abertura, dívida corrente/parcelas futuras, destinação, precisão e isolamento, não a interação de pagamento120 investigada em RVA-03. SPEC-001 exige definir novos DTOs/versão/idempotência e complemento de legado; ainda não existe aceite desses entregáveis.

CF-016/018/020/023 preservam aceites próprios J/R/C da reconciliação. Para CF-019, o parecer independente J (`9fa4fae`, MATRIZ-ESTADOS) aceita parcelas/ciclo/limite, pagamento/recibo e rollback; C (`846c64c`) aceita protocolo/concorrência no escopo. O código de abertura `CreditCardService.recordOpeningPosition` e domínio de cartão pertinentes não tiveram mudança de regra após J: owner/lock, saldo corrente uma vez, competências futuras estritamente posteriores, origem OPENING e rejeição de segunda abertura continuam integrados. PaymentReceiptDTO teve apenas canonicalização exata de centavos na CF-024 já aceita; V13 é outro namespace de criação. Extração CF-027 não migra pagamentos nem muda essa capacidade. Regressões atuais não indicam alteração invalidante.

**Liberação independente explícita de capacidade CF-019→CF-028 na base 06c1a51:** suficiente para escrever/revisar o contrato do onboarding. RVA-03 permanece na origem, CF-019 continua em_revisao. RVR24-01 é consumidor de criação existente; a especificação não depende de validá-lo como mecanismo de finalização. CF-028 deve definir suas próprias garantias e gates futuros, não herdar aceite de UI ou idempotência do onboarding ainda inexistente. Não se cria dependência direta CF-025/026/027. CF-029–034, publicação e banco real não foram liberados.

## Pendências e entrega

[Matriz de critérios, estados e fila dirigida](MATRIZ.md), [execuções/limites](EXECUCOES.md), [achados](ACHADOS.md). Contagem inicial confirmada: 10 concluídas/17 em revisão entre CF-001–027; resultante: **13 concluídas/14 em revisão**. CF-028 pronta é fora dessa contagem. Demais aceites preservados, sem encerramento por associação.

Próxima decisão prática: iniciar especificação CF-028 e encaminhar saneamento pontual do bruto em RVR24-01, em frentes independentes. Revalidar esse reparo com os probes preservados e integração pertinente; não repetir auditoria integral CF-001–027. Sem produto alterado nesta revisão, sem push/deploy/banco real/email real/clean.
