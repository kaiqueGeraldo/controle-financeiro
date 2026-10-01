# Revalidação independente RV24-01 / RV24-02 — 01/10/2026

**RV24-01 permanece em_revisao. RV24-02 aceita e concluída. CF-027 apta a iniciar localmente**, somente na fronteira backend de identidade/recibos de criação descrita adiante. CF-027 não foi executada. Não há aceite irrestrito de consumidores, CF-019/022/026 ou publicação.

O reenvio sem identidade que originou RV24-01 foi corrigido nos cenários exercitados, inclusive com dinheiro persistido. Contudo, contraprovas novas detectaram confirmação indevida de respostas incompletas e callback de reconciliação após invalidação do consumidor. Não se encerra o achado apenas porque o defeito inicial deixou de ocorrer. [ACHADOS.md](ACHADOS.md) contém local, severidade, reprodução e encerramento dos resíduos.

## Base, preservação e método

HEAD auditado: `5d0649a`, entrega sobre `30211b8`; `53fa3a8` contém identidade/recuperação, `805f588` exclusão/email e `5d0649a` checkpoint/encaminhamento. Ancestralidade conferida; staging inicial vazio, única alteração preexistente README raiz, SHA256 `6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`, preservado e fora do staging. Foram lidos os contratos/tarefas RV24, achados originais, evidências/encaminhamento, política de testes/execução, DEC-10/CF-024, ADRs e pareceres vigentes das dependências CF-027.

O checkpoint do executor confere540 fontes e72 artefatos; isso confirma a base, não o aceite. Expected dos probes adicionais estão em [ORACLES.md](ORACLES.md). Não se alteraram código de produto, migrações, configurações de lint ou testes compartilhados. Cópias isoladas e arquivos temporários de teste tiveram destinos explícitos; os temporários foram removidos. Não houve banco real, email real, push ou deploy.

Backend: Spring/proxies/ORM reais, PostgreSQL16 descartável, Flyway V1–V13 e Hibernate validate; email e mercado externo são doubles. Frontend: componentes com mocks nas fronteiras, além de Playwright→Next/BFF→Spring→PostgreSQL real. A skill vercel:agent-browser foi consultada; o CLI não estava disponível no PATH. Usou-se o Playwright instalado do repositório e inspeção visual de capturas, sem instalar outra ferramenta. [EXECUCOES.md](EXECUCOES.md) separa camadas, versões, gates, contraprovas e falhas de execução.

## Parecer RV24-01: reparo original comprovado, encerramento recusado

O hook persiste envelope v1 em sessionStorage por owner/kind **antes** de enviar, com operationId UUID e corpo serializado. Retry conserva o corpo, sem recalcular campos a partir do formulário; nova intenção legítima recebe outro UUID. Transação e investimento monetário adotam o protocolo existente, mantendo chave opcional no servidor. UPDATE_BALANCE continua no contrato próprio, sem recibo de criação inventado.

| Critério | Evidência independente / resultado | Limite |
|---|---|---|
| Reenvio original | Dois componentes com modais históricos30211b8 falham expected1/observed2; contratos adaptados do candidato passam no conjunto193 | O original preservado não foi reescrito para passar |
| Dinheiro e intenção depois de resposta perdida | Seis jornadas reais (EXPENSE/BUY × lost/before/unavailable), SQL final950 ou600/posição14, dois recibos para duas intenções legítimas e zero para owner B | Descarte lógico após route.fetch confirmar commit; não corte TCP físico |
| Mesmo ID/corpo no retry e conteúdo diferente | Replay conserva975 ou800; mudança de amount/quantity recebe409, sem efeito adicional | Transferência/SELL/DIVIDEND/INTEREST conservam provas backend; não foram novas jornadas browser |
| Recuperação autenticada sem POST | GET do owner confirma e fecha; GET alheio404, escrita alheia409; componente confere que consultar não chama create | Owner B é contexto de navegador separado na jornada; troca dentro do componente é prova complementar, não browser multiusuário completo |
| Fechamento/reabertura/reload | Pendência reaparece e retry preserva comando; duas criações iguais posteriores têm IDs distintos | Mesma aba; sem catálogo entre dispositivos |
| GET404 e GET503 | Conservam pendência/trava, permitem só retry da mesma intenção |404 não comprova que um writer terminou; contrato servidor já preservado em CF-024 |
| Falha antes do commit | Trigger real recusa recibo; conta1000, posição10 e histórico vazio; mesmo corpo funciona após remover trigger | Controller de fault injection está em src/test, não no produto |
| Storage indisponível/corrompido | Nenhum POST antes de conseguir persistir; leitura inválida bloqueia com instrução de conferir histórico | Perda também da identidade não pode ser recuperada automaticamente; limite explícito no aviso |
| Falha ao remover storage | Probe novo conserva envelope e não chama sucesso mesmo após resposta de retry | Não transforma falha local em outra identidade |
| Resposta de recuperação inválida | ID/kind incompatível, array e erro HTTP são recusados, mas **result={} é aceito** | RVR24-01/P2: critério ainda incompleto |
| Resposta inválida de POST monetário | investmentService/apiRequest reais no componente aceitam200/null e200/[]; o hook chama complete e consumidor chama onSuccess | Mesmo RVR24-01; não é prova de que o backend atual produziu esses corpos |
| Cleanup e troca de usuário | Identidade de A fica salva e onSuccess tardio é suprimido; **onReconcile ainda roda** após unmount/troca A→B no investimento | RVR24-02/P2: não se declarou vazamento de dados ou dinheiro repetido sem prova |

O parser valida estrutura do envelope, owner/kind, campos usados e UUID antes do cast. Campos desconhecidos são preservados para retry; regras de dinheiro permanecem no servidor. A separação de envelope de transporte e regra financeira é adequada, mas o cast/tipagem do pedido não valida a resposta. O retorno booleano do hook também mistura pendência com invalidação de ciclo de vida; o consumidor interpreta todo false como motivo para reconciliar. Sugestões delimitadas em ACHADOS, sem implementar correção nesta revisão.

R03/RV01 foram preservados. RVA-03 continua na CF-019; uma execução verde de R03 não explica o spinner após pagamento120 do histórico. CF-026 permanece aguardando sua revisão própria: lint/typecheck/build verdes e componentes existentes não neutralizam os resíduos novos de parser/cleanup.

## Parecer RV24-02: aceito no contrato de exclusão integral autorizada

A contraprova histórica de compra comum25 paga/alocada voltou a falhar pela FK `card_payment_allocations_card_transaction_id_fkey` quando somente UserService foi substituído pelo de30211b8 em outra cópia. O candidato atual passou os seis contratos dirigidos. Nenhuma FK ou assertion de dinheiro/owner/rollback foi removida.

A estratégia faz flush, bloqueia o owner, verifica vínculos alheios que SET NULL/UUID não protegeriam sozinhos, executa28 bulk deletes em ordem, limpa o persistence context e remove o user na mesma transação. O evento de cache continua AFTER_COMMIT/global herdado; email é submetido por synchronization.afterCommit e falha dessa submissão não desfaz a exclusão.

| Grafo / garantia | Confronto e prova |
|---|---|
| Compra paga / alocações | Compra comum via serviços, originPURCHASE, paid_amount25 e allocation25; lote de abertura/pagamento herdado também coberto; filhos removidos antes de compras/pagamentos |
| Transferências / comandos antigos | Probe novo cria transferência realizada, previsão de transferência e realização, baixa, estorno parcial e correção; verifica referências settlement/reversal/realization/correction antes da exclusão e ausência posterior de fatos/financial_commands/recibos |
| Metas / reservas / compra sobrevivente | Grafo tem alocação bancária e de investimento, item/history/goal_purchases; probe novo compra via GoalService, exclui a meta, prova que a compra sobrevive e só desaparece na exclusão integral do usuário |
| Investimentos / histórico | BUY, SELL, compensação, revisão de custo e avaliação presentes; investimentos/goal_id legado e dependentes removidos na ordem necessária |
| Cartão / planejamento / hábitos | Refunds/purchase UUID, opening_batches, invoices, plan_items/plans, hábitos/dias/logs com identidade atual e legado sem identidade incluídos |
| Recibos | financial_commands vivos, financial_intent_receipts snapshot de ambos kinds, pagamentos com fingerprint legado nulo e correções mantêm seus contratos até a limpeza integral; sem backfill |
| Outro owner / órfãos | Snapshot SQL de todas as linhas das29 tabelas de aplicação, com outro owner também completo, fica exatamente igual ao baseline esperado; FKs ativas e inventário conferido com migrações/entidades |
| Dados alheios inconsistentes | Guardas rejeitam referências herdadas SET NULL/UUID em vez de desvincular/apagar dados alheios; testes preservam snapshots dos dois owners |
| Falha intermediária | Trigger real em DELETE investments, depois de remover vários dependentes: rollback restaura snapshot completo/cache e zero email |
| Commit / email / cache | Dentro da transação envolvente não há email nem evicção; depois há evicção global herdada. Probe independente abre outra conexão dentro do double de email e encontra owner ausente, confirmando visibilidade do commit |
| Falha externa após commit | Double lança falha de submissão; exclusão permanece concluída e cache invalidado, sem alegar rollback ou recriar dados |
| Writer concorrente | PIDs distintos e pg_blocking_pids comprovam writer esperando exclusão; após commit, writer falha inteiro, sem fato/recibo órfão e com uma notificação de exclusão |

As provas por snapshot são de fixture representativa, não amostragem de base real. Locks de owner não substituem locks de fonte. Na direção inversa, writer que já segura fonte e precisa inserir filho do owner pode disputar a ordem com a exclusão; não se certifica ausência universal de deadlocks, nem se promete SLA. Preservar rollback, tratamento de conflito e investigação de ordem ao mudar esses fluxos. Não se exigiu outbox: email sem retry durável/garantia de entrega continua limitação contratual. Cache não tem leitores Cacheable ativos, e alcance global de exclusão é herdado, não uma política nova de cache distribuído.

Custo: quantidade fixa de statements para o schema atual elimina materialização/N+1 por entidade; trabalho de joins/FKs/deletes cresce com linhas e índices, podendo ser O(N). Não é exclusão O(1). O snapshot global O(N) está apenas no teste. O acoplamento da ordem SQL ao schema exige manter inventário/regressões em migrações futuras; não justifica reorganizar todos os domínios nesta revisão.

## Qualidade e limitações das execuções

193 componentes existentes, lint244 alvos com zero erros/avisos, typecheck e build passaram no candidato. As seis contraprovas novas têm cinco falhas de assertion e um caso positivo: são problemas publicados, não skips ou falhas de import. Uma parametrização inicial tratou [] como lista vazia de argumentos; foi corrigida para objeto de caso e preservou o vermelho para array real. Não houve reparo de produto.

As capturas do runner original eram feitas durante loading após reload. Elas não foram aceitas como prova visual. O harness independente acrescentou espera por botão/lista/ticker reais, sem mudar expected financeiro: cinco jornadas passaram, uma sofreu ECONNRESET no replay explícito do cliente de teste; SQL dessa jornada ficou975, sem segundo efeito. O recorte exato passou depois isolado, com mesma assertion e timeout. A causa do reset continua aberta (H-RV24-01), sem reclassificá-lo como defeito financeiro nem apagá-lo por um verde posterior. Capturas finais carregadas foram inspecionadas; não há aceite de matriz visual completa/mobile/zoom.

Os resultados consolidados e seleções exatas estão em [EXECUCOES.md](EXECUCOES.md) e no checkpoint desta revisão. Não somar193/dirigidos/contraprovas ou suites Java sobrepostas. Evidências históricas permanecem intactas; logs novos e trace publicado são sanitizados sem remover dinheiro, status ou assertions.

## Decisão explícita sobre CF-027

**CF-027 apta a iniciar localmente** para organizar **a fronteira de identidade/recibos duráveis de criação entre os casos de uso de transações/investimentos e a implementação de persistência/lock/serialização atualmente em FinancialIntentService**.

Problema concreto: InvestmentService depende de um protocolo e repositório hospedados no domínio de transações; TransactionService e controller também conhecem a implementação concreta que mistura PostgreSQL advisory lock, JSON e identidade de transporte. O primeiro lote pode explicitar um contrato de aplicação para replay/complete/recover e encapsular essa implementação, com teste de dependência proibindo acesso direto dos consumidores ao repositório/EntityManager desse protocolo. A escolha exata de interfaces/pacotes cabe à CF-027 depois de mapear os imports; não é autorização para só mover pastas ou alterar semântica financeira.

### Dependências concretas e pareceres preservados

| Origem | Capacidade integrada usada / aceite vigente | Pendência que não se encerra |
|---|---|---|
| CF-018 | Criação/transferência, fonte/capacidade/owner, baixa/estorno e atomicidade aceitos na consolidação independente e revalidados pelos testes pertinentes | Adoção real/release têm gates próprios |
| CF-019 | Pagamento/intenção/fingerprint/recibo e invariantes backend aprovados no parecer conjunto CF-022/023; não será migrado ao novo namespace | RVA-03 permanece em_revisao; UI de pagamento excluída da reorganização autorizada |
| CF-020 | Posição/custo, reservas/capacidade, avaliações e compensações aceitos no escopo próprio; operação com recibo novo participa da fronteira | Não reorganizar metas/investimentos inteiros ou mudar valuation/custo neste lote |
| CF-022 | Backend DEC-08/calendário/ownership/locks/migrações aprovado; hábitos não é consumidor do protocolo V13 escolhido | RJ-022-01/H24-01 permanecem em_revisao; scheduler/GoalHistory excluídos |
| CF-024 | DEC-10: chave opcional, fingerprint canônico, resultado atômico, replay/recuperação owner, ordem intenção→fonte e cache após commit aceitos | Ausência universal de deadlock, cache distribuído/leitores, restart/rede real não certificados |
| RV24 | Exclusão aprovada; caminhos originais de criação identificada revalidados | RV24-01/RVR24-01/RVR24-02 e H-RV24-01 permanecem; parser/hook/modal fora do lote |

CF-026 não é dependência de CF-027 e sua revisão continua pendente. Os resíduos frontend não exigem alterar a persistência/semântica do protocolo para serem corrigidos; portanto não são bloqueio técnico da extração backend delimitada. Não se concluiu CF-019/022 para ajustar rótulos nem se transferiram os achados a CF-027.

### Contratos e testes obrigatórios no lote autorizado

- Preservar MANDATORY e uma única transação para efeito+recibo; nenhuma divisão de commit, REQUIRES_NEW, chamada remota ou retry interno cego.
- Manter namespace/owner/kind/fingerprint, chave opcional, canonicalização, snapshots/DTOs/status HTTP, GET404 sem revelação, replay sem recalcular recurso atual e sem expirar recibos.
- Manter ordem de locks intenção→fontes, fontes distintas independentes, constraints V13 e mapeamento específico409; falha genérica de persistência não vira conflito de intenção.
- Manter efeitos financeiros/planejamento síncronos necessários e invalidação AFTER_COMMIT; não ativar cache de leitura.
- Executar classe CF-024 final30, contratos HTTP, consumidores de transação/investimento, rollback/serializer/mutações pertinentes e jornadas identificadas com SQL/reload. Se a superfície de imports tocar pagamentos/correções, incluir suas regressões/recibos sem alterar seus namespaces.
- Criar verificação arquitetural proporcional que detecte dependência proibida; comparar API/schema antes/depois e explicar o que continua acoplado, com monólito preservado.

**Reavaliar a liberação** se o lote alcançar pagamento/modal/reconciliação, UserService/cleanup/email, scheduler/hábitos/metas, regras de dinheiro, esquema/DTO/fingerprint/retention, ordem dos locks ou fronteiras transacionais; ou se nova falha demonstrar comprometimento da base usada. Outras fronteiras exigem novo recorte fundamentado. Nenhuma extração, novo módulo/interface, benchmark ou implementação CF-027 foi feita nesta sessão. Permanecem também RV17-01/02, adoção real, zoom200% e cadeia de publicação.
