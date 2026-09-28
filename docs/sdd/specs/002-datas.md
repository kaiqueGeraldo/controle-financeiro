# SPEC-002 — Contrato temporal

Contrato definido pela CF-004 em 08/09/2026. Descreve o resultado exigido; **não declara DTOs, banco ou telas já conformes**. O primeiro patch frontend permanece preservado. Implementação/regressões: CF-005/006; HTTP: CF-008; fluxo integrado: CF-007; revisão: CF-015. [Critérios CF-001](003-criterios-oracles.md), [evidências CF-004](../../../tasks/evidencias/CF-004/README.md).

## Fontes e fronteiras

Mantêm-se os critérios originais: data civil sem conversão de fuso, defaults locais do navegador, prazo de hoje não atrasado, meta concluída nunca atrasada, navegação mensal pelo dia 1 sem mutação e rejeição de datas impossíveis. As decisões abaixo resolvem DEC-01/02/05 sem tomar o código atual como oracle. DEC-03 recebeu política gerencial explícita na CF-019; DEC-08 (recorrência semanal) continua com CF-022.

O inventário descreve fatos do checkout; regras e exemplos são normativos. Exemplos HTTP são **projeções dos campos temporais**, com demais campos válidos e identidades sintéticas omitidos, não corpos completos para envio. Rotas são Spring; o BFF acrescenta `/api` e preserva valores sem acrescentar horários/fusos. Comandos sem JSON temporal exigem a releitura indicada. Status/envelope completos pertencem à CF-008.

## Tipos semânticos

| Tipo | Formato de contrato | Regra / apresentação | Persistência de destino |
|---|---|---|---|
| Data civil | string `YYYY-MM-DD`, anos 0001–9999, gregoriana válida | Sem hora/offset; `2026-09-07` → `07/09/2026` em qualquer fuso. Não parsear como instante. | Java LocalDate / PostgreSQL date |
| Horário informado | `HH:mm` ou `HH:mm:ss`, 00:00–23:59:59 | Hora de parede da operação, sem offset/fração/24:00. Saída canônica HH:mm:ss; UI HH:mm, detalhe preserva segundos quando presentes. | LocalTime / time without time zone separado de auditoria |
| Instante conhecido | `YYYY-MM-DDTHH:mm:ss[.fração]` com Z ou offset ±HH:mm obrigatório | Segundos obrigatórios, fração opcional de 1–6 dígitos. Saída UTC Z; não arredondar entrada mais precisa silenciosamente. UI dd/MM/yyyy HH:mm com rótulo America/Sao_Paulo. | Instant/OffsetDateTime na fronteira / timestamp with time zone |
| Competência | JSON `{"year":2026,"month":9}`; query year=2026&month=9; chave interna 2026-09 | Inteiros year 1–9999/month 1–12; sem dia/fuso; UI setembro de 2026. | YearMonth no cálculo; colunas year/month existentes |
| Ano | inteiro 1–9999 | Não é data 01/01 nem duração. | inteiro / projeção |
| Dia nominal do cartão | inteiro 1–31 | Configuração recorrente, não data: 31 não autoriza criar 31/02. | closing_day/due_day inteiros |
| Timestamp local legado | `YYYY-MM-DDTHH:mm:ss[.fração]` sem offset | Só leitura de compatibilidade com origem explicitada; não é instante conhecido. | Coluna original preservada até migração com proveniência |

LocalDate e LocalDateTime não carregam fuso; o segundo também não identifica sozinho um instante. [Java 21 LocalDate](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDate.html), [LocalDateTime](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDateTime.html). No PostgreSQL, timestamp with time zone preserva o instante, mas não guarda a zona original; proveniência necessária fica separada. [Documentação PostgreSQL](https://www.postgresql.org/docs/current/datatype-datetime.html). Esses fundamentos não decidem regras bancárias.

Instantes equivalentes: `2026-09-07T23:30:00-03:00`, `2026-09-08T02:30:00Z`, `2026-09-08T16:30:00+14:00`. Todos exibem `07/09/2026 23:30 (America/Sao_Paulo)`, mesmo em browser UTC+14. Horário informado `23:30` não passa por essa conversão.

## DEC-01 — Relógio, hoje e página aberta

Dois calendários explícitos neste marco: **hojeNavegador** é o dia no relógio/fuso local do navegador, exigido pela SPEC-002/CF-001; **hojeProduto** é o dia do instante do Clock do servidor em **America/Sao_Paulo**, ratificando a proposta do ADR-003 para operações automáticas. JVM, SO e conexão JDBC não definem regra de produto. Nenhum fuso acompanha data civil.

| Consumidor | Fonte / ação exigida |
|---|---|
| Abrir transação, compra, operação de investimento, pagamento | Calcular hojeNavegador na abertura, salvo data explicitamente selecionada. Hora default local capturada na mesma abertura. Não usar UTC via toISOString. |
| Formulário aberto com default intocado **ou** campo editado | Preservar data/hora ao cruzar meia-noite, voltar de background ou trocar fuso. Submeter exatamente o que está visível. Reabrir como novo recalcula; edição recupera persistido. Não atualizar só a data mantendo hora do dia anterior. |
| Prazo/status visual de meta | `deadline < hojeNavegador` e não concluída. Recalcular após meia-noite local e ao ganhar foco/visibilidade, antes de permitir interação; nunca alterar deadline. Inválido/ausente não produz atraso afirmativo. |
| Cartões, planejamento, extrato, seletor anual | Competência/ano inicial do navegador; seleção aberta fica estável ao mudar dia/mês/ano. Ação explícita “hoje/mês atual” recalcula. Navegar muda uma competência, ancorada no dia 1, sem mutar entrada. |
| Backend sem data no request | Conta atual, aporte/compra/estorno de meta, ajuste de investimento, relatório sem filtro, cron/notificação: capturar um instante por caso de uso e derivar hojeProduto; reutilizar nos efeitos/eventos. Data explícita sempre se propaga aos efeitos bancários, mesmo diferente de hoje. Abertura financeira continua CF-016/018. |
| Hábito: “hoje”, destaque diário e cron | HojeProduto também na UI, com contexto de horário de Brasília. Dia explicitamente clicado vai sem conversão. Virada do dia renova destaque/janela sem remapear logs. Semana, permissões retroativas/futuras e streak: DEC-08/CF-022. |
| Expiração de credenciais | Comparar instantes: expirado quando `now >= expiresAt`. Duração desde emissão, independente de fuso; Clock e validador controláveis. Durações atuais de 10 min (recuperação) e 24 h (JWT) são inventário de segurança, não nova decisão de prazo. |

Um provedor compartilhado deve atualizar no próximo limite de dia e revalidar em foco/visibilidade, com limpeza de timers/listeners. Não pressupor dia de 86.400 segundos nem timer por item. Aba suspensa pode atrasar callback: aceite observa primeiro processamento/retorno à visibilidade, sem prometer execução durante suspensão. Cliente não autoriza expiração/crons.

| Instante fixo | Navegador São Paulo | Navegador UTC | Navegador Kiritimati | Produto, qualquer JVM |
|---|---|---|---|---|
| 2026-09-08T02:59:59Z | 2026-09-07 | 2026-09-08 | 2026-09-08 | 2026-09-07 |
| 2026-09-08T03:00:00Z | 2026-09-08 | 2026-09-08 | 2026-09-08 | 2026-09-08 |
| 2026-09-07T09:59:59Z | 2026-09-07 | 2026-09-07 | 2026-09-07 | 2026-09-07 |
| 2026-09-07T10:00:00Z | 2026-09-07 | 2026-09-07 | 2026-09-08 | 2026-09-07 |

Trade-off: preservar defaults/atraso visual locais mantém os expected da CF-001, mas viajantes podem ver “hoje” diferente do calendário automático. Isso é deliberado; hábitos precisam do contexto de Brasília. Fuso por usuário/unificação futura exigem novo contrato; não aplicar São Paulo globalmente aos helpers frontend.

## DEC-05 — Ausência, validação e saída neutra

- Datas de criação/operação/toggle são obrigatórias: omissão, null, vazio e inválido → HTTP 400 identificando campo, sem persistência ou normalização. Atualização parcial de transação/meta: omissão preserva; null explícito não apaga data obrigatória e falha. PUT de planejamento ainda não tem controller correspondente: CF-008, sem presumir sucesso.
- time é opcional: omitido/null em criação = **horário não informado**. Vazio, espaços, 24:00, 12:60, offset ou timestamp completo falham. Atualização: omissão preserva; null remove só horário informado. Nunca substituir inválido/ausente por hora atual. Armazenamento precisa evoluir para representar isso; ver transição.
- Leitura obrigatória ausente/inválida é inconsistência, não hoje. Apresentação compacta usa `—` (U+2014), com nome acessível `Data indisponível` ou `Horário não informado`. Decisão de UX: não sugere zero, epoch, data válida ou atraso. Nunca mascarar valores válidos nem enviar marcador à API.
- Prazo hoje não atrasa até mudar o dia; ontem atrasa se não concluída. Isso não decide admissibilidade de **criar** meta com prazo passado/presente. @Future atual é restrição adicional sem oracle aprovado na CF-001; CF-020 decide manutenção/relaxamento antes de alterá-la. CF-006 verifica calendário do validador com Clock de produto, sem usar @Future como definição de atraso.
- Rejeitar 2026-02-29, 2026-02-31, 2026-04-31, mês 00/13, dia 00, 07/09/2026, 2026-9-7, ano 0000 e qualquer timestamp num campo civil. 29/02: 2024 e 2000 válidos; 2026 e 1900 inválidos.
- Competência usa ano/mês juntos: par parcial, mês 0/13, fração, null ou ano fora do domínio → 400. Em GET /transactions, omitir ambos = competência hojeProduto; em /annual-summary, ano omitido = ano hojeProduto. Nos demais requests de competência o par é obrigatório. Entrada malformada nunca recebe default.

## DEC-02 — Hora informada, auditoria e compatibilidade

date responde em qual dia a operação pertence ao calendário; time é a hora de parede informada; auditoria é o instante em que o servidor registrou. Receber em 08/09 uma operação de 07/09 às 23:30 não transforma sua data em 08/09.

Transaction.createdAt e CardTransaction.createdAt são legados mistos: data+hora de operação, editáveis, e geração automática. **Não podem passar a significar auditoria por troca de serializador.** Destino: time explícito e recordedAt como instante de registro, imutável após criação e não controlado pelo request. Linha histórica sem auditoria comprovada: recordedAt null. Campos de auditoria enviados na escrita devem gerar erro de campo em CF-008, nunca backdating.

Perfil canônico após adoção coordenada (definido aqui, ainda não implementado):

```json
{"date":"2026-09-07","time":"23:30:00","recordedAt":"2026-09-08T03:10:00Z"}
```

Editar só date para 2026-09-06 preserva time/recordedAt; editar só time para 08:15 preserva dia/auditoria e devolve 08:15:00. 00:00:00 não prova ausência: pode ser hora intencional ou artificial.

O adaptador de serviço distingue civil, hora de parede, instante conhecido e legado desconhecido; componentes não espalham heurísticas new Date/split('T')/+Z. Legado local validado de origem desconhecida é exibido literalmente no detalhe com `Fuso desconhecido`; auditoria canônica indisponível. Se nem significado civil estiver comprovado (histórico misto de investimento), data operacional mostra `Data indisponível` e detalhe preserva bruto, sem ordenar como instante. Legado não é formato válido de escrita de novos instantes.

GoalHistory.date é horário de registro; InvestTransaction.date é data operacional misturada com geração automática. Não aplicar um único conversor a ambos.

## Inventário de campos

[Inventário completo por DTO/entidade/consumidor e exemplos E01–E21](../../../controle-financeiro-frontend/src/types/temporal-contract/inventory.md). Inclui nulabilidade atual/exigida, origens, formatos/fusos, colunas inferidas, entidades expostas, time em String, competências em queries/Map, auditoria não exposta, rótulos de gráficos e datas geradas sem input. Tipos SQL são inferidos do modelo; schema real do Railway permanece desconhecido.

## Migração e adoção

**CF-004 não altera runtime/schema nem executa migração.** Os exemplos canônicos definem destino; convivência com legado requer rollout coordenado. Não converter em massa LocalDateTime nem redefinir createdAt silenciosamente.

| Origem comprovada por linha/lote | Tratamento previsto CF-006/017 | Limite |
|---|---|---|
| Coluna date/input civil original | Manter dia literal; validar round trip. | Sem hora/offset. |
| Data+hora digitadas, inclusive createdAt de transação/cartão | Extrair dia/hora conforme trilha de escrita, preservando bruto. | Não reconstruir instante de registro; recordedAt histórico null. Fallback de DateUtil não comprova hora informada. |
| Investimento comprovadamente de LocalDate.atStartOfDay | Mapear dia civil literal com trilha da transformação. | Prefixo/00:00 não prova origem; ajuste de saldo tem outra fonte. |
| Timestamp com offset conhecido | Converter para UTC equivalente; preservar bruto/offset na proveniência se necessário. | Offset não identifica zona IANA. |
| Auditoria local + zona de origem comprovada na gravação | Resolver pelas regras históricas do ZoneId, guardar evidência e versão das regras. | Hora inexistente/duplicada em mudança de offset exige resolução explícita; não usar offset de hoje. |
| Origem/tipo SQL real desconhecidos | Preservar original, classificar desconhecido, UI neutra/detalhe legado. | Configuração atual do servidor, nome createdAt, descrição, isSystemManaged, tipo INTEREST e meia-noite não provam proveniência. |

CF-006 inventaria serialização e implementa Clock/validação que não dependam de schema; CF-005 trata consumidores do perfil real; CF-008 coordena tipos/payloads. CF-017 exige inventário real, backup restaurável, dry-run sintético, contagens/reconciliação e reversão antes de migrar. Adicionar armazenamento de time/recordedAt/origem preservando originais; backfill apenas comprovado; novas escritas capturam origem. Nomes físicos e mecanismo da migração: CF-017. DTO/adaptador explícito, testes de versão antiga/nova e remoção anunciada do alias ao final.

**Gate:** enquanto NOT NULL de created_at/LocalDateTime impedir hora ausente e auditoria separada, não simular conformidade com hora atual/meia-noite. CF-006 registra a parte dependente de schema como pendência; teste só de DTO não fecha esse aceite. Novos campos canônicos não existem nesta base. Proveniência remota ausente bloqueia backfill, não contrato/teste sintético.

Ordenação de extrato: data civil, hora informada conhecida, desempate estável por ID; desconhecidos após horas conhecidas dentro do dia. Auditoria é dimensão separada. Não usar epoch artificial ou timestamp local ambíguo como instante; CF-008/024 coordenam paginação/ordenação cliente/servidor. Ordenar uma página não prova ordem global.

## Cenários adversariais e responsabilidades

| Critério | Oracle independente | Validação de produto |
|---|---|---|
| AC-TIME-001/002/006 | Dia 07 em três fusos; bissexto válido; inválido não normaliza; E01–E21. | CF-005 componente; CF-006 serializador/PostgreSQL; CF-007 browser São Paulo/UTC+14 e JVM UTC com reload; CF-008 erro de campo. |
| AC-TIME-003/009 | Matriz DEC-01; cruzar meia-noite mantém default intocado e campo editado; novo formulário usa dia novo. | CF-005 relógio/foco/visibilidade; CF-007 E2E; CF-015 mutação UTC/atualização involuntária. |
| AC-TIME-004 | Ontem atrasa; hoje/amanhã não; concluída nunca; inválido não afirma atraso. | CF-005/014, inclusive página aberta. |
| AC-TIME-005/008 | 29/30/31 de janeiro +1 = fevereiro/01; março/31 −1 = fevereiro/01; dezembro→janeiro; original intacto. 31/02 impossível. Ciclo de cartão segue a política gerencial DEC-03 em SPEC-004. | CF-005/006 calendário; CF-019 ciclo gerencial. |
| AC-TIME-007 | Offsets equivalentes; desconhecido não recebe Z; editar operação não altera auditoria. | CF-006 contrato/integração; CF-017 migração; CF-005/008 perfis de UI/adaptador. |
| AC-TIME-010 | DiaProduto independe de JVM; dia clicado preservado; instante único no caso de uso. | CF-006 Clock; CF-022 define semana/reprocessamento/concorrência/vínculo de meta antes de expected exato. |
| AC-UI-005/011 | Inválido não persiste; lista/detalhe/exportação/reload conservam semântica. | CF-008/007/012–014; validador documental não substitui essas camadas. |

[Vetores e verificador](../../../controle-financeiro-frontend/src/types/temporal-contract/) conferem exemplos sintéticos/inventário sem importar helpers ou executar API. Verde documental não comprova produto. Fechamento e semana não têm expected gerado do código.

## Trade-offs e limites de engenharia

Parsing/comparação civil e mudança de competência são O(1) por valor; render de n linhas é O(n). Normalização na fronteira reduz divergência, mas custa um adaptador legado temporário. Alias TypeScript sem validação runtime não garante formato.

Consultas mensais devem expressar [primeiroDia, primeiroDiaDoPróximoMês); para instantes, converter cada limite na zona explícita. Limite superior interno 10000-01-01 no extremo 9999-12 não é ano aceito na API. Evita dia 31 e horário 23:59:59.999999. Índices/EXPLAIN são CF-025, sem alegar ganho não medido. DTOs explícitos evitam carregar relações por linha (N+1); não expandir grafo só para obter data.

Um Clock capturado por operação evita dias divergentes dentro dela, mas não resolve concorrência, cron duplicado ou pagamento repetido. Unicidade/transação por janela/usuário e idempotência: CF-022/024. Zone no agendamento sem Clock nos cálculos é insuficiente.

Pendências delimitadas: regras contratuais de dia útil e emissor permanecem desconhecidas; DEC-03/CF-019 define apenas calendário gerencial (CF-013 coordena vencimentos copiados). DEC-08/CF-022 (semana/streak/efeito em meta); admissibilidade de prazo passado/presente na criação CF-020; proveniência/schema CF-017; entidades expostas/PUT planejamento/envelopes CF-008; regime de relatório CF-016/021. Não são resolvidas por inferência do código. Revisão independente e conformidade do produto não executadas pela CF-004.
