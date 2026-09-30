# SPEC-003 — Critérios e oracles independentes (CF-001)

Fixado em 07/09/2026. Este documento especifica o comportamento a verificar; não certifica que a aplicação já o atende. A conclusão de CF-001 entrega os critérios, não executa CF-004 a CF-036.

## Fontes e precedência

- **T**: [SPEC-002 — Calendário](002-datas.md), contrato e cenários de aceite.
- **O**: [SPEC-001 — Onboarding](001-onboarding.md), invariantes e aceite. Seus endpoints/DTOs ainda são **propostos**; não os tratar como contratos HTTP implementados/aprovados antes de CF-028.
- **A**: [Arquitetura](../arquitetura.md), ADR-001 a ADR-005; propostas continuam propostas.
- **P**: [Política de testes](../../../tasks/POLITICA-DE-TESTES.md).
- **D**: [Diagnóstico F-001 a F-017](../diagnostico.md). Evidência histórica, não resultado de execução desta tarefa.
- **CF-xxx**: aceite da tarefa correspondente no [catálogo](../../../tasks/CATALOGO.md). A tarefa dona resolve detalhes pendentes antes de alterar código ou expected.

Resultados abaixo vêm dessas fontes e de contas sintéticas feitas em centavos. Código, HTML observado e snapshots atuais não definem expected. Casos propostos ou ambíguos têm limites expressos; isso não autoriza escolher o comportamento hoje implementado.

Os dados literais estão em [cf001.json](../../../controle-financeiro-frontend/tests/oracles/cf001.json). O [guia das fixtures](../../../controle-financeiro-frontend/tests/oracles/README.md) explica isolamento e consumo. O [roteiro](003-roteiro-exploratorio.md) define classificação, severidade, telas e evidências. A [revisão dos testes](../../../tasks/evidencias/CF-001/revisao-testes.md) registra cobertura efetivamente observada.

## Matriz critério → cenário → teste → responsável

Cada ID é estável. Nas próximas tarefas, nomear testes com o ID e registrar arquivo/nome/comando na evidência da tarefa dona. As camadas abaixo são **requeridas/planejadas**, não executadas por esta matriz. CF-001 valida a consistência dos artefatos; CF-002/003 preparam ambientes; as donas implementam regressões; CF-015/033 fazem revisão independente.

### Calendário

| Critério | Fonte | Cenário e resultado esperado explícito | Camada de teste | Tarefa responsável |
|---|---|---|---|---|
| AC-TIME-001 | T §Contrato/1 | D-CIVIL: `2026-09-07` → `07/09/2026`; `2024-02-29` → `29/02/2024`, em São Paulo, UTC e Kiritimati. Lista e detalhe mantêm o dia. | Unitário + componente | CF-005; consumidores CF-012/013/014 |
| AC-TIME-002 | T §Contrato/5 | D-INVALID: `2026-02-29`, `2026-02-31`, `2026-04-31`, vazio, mês 00/13, dia 00, `07/09/2026` e timestamp não são datas civis válidas. Entrada é rejeitada, não persiste data normalizada; saída não mostra data válida nem atraso afirmativo. Marcador textual neutro exato: DEC-05. | Unitário + componente + contrato HTTP | CF-004/005/006/008 |
| AC-TIME-003 | T §Contrato/2; P | D-CLOCK: às `2026-09-08T02:59:59Z`, hoje em São Paulo é `2026-09-07`; em UTC/Kiritimati é `2026-09-08`. Às `03:00:00Z`, São Paulo passa a `2026-09-08`. Em Kiritimati `2026-09-07T09:59:59Z` → `2026-09-07` e `10:00:00Z` → `2026-09-08`. Abrir cada formulário com relógio congelado. | Unitário + componente dos quatro formulários | CF-005 |
| AC-TIME-004 | T §Contrato/4 | D-DEADLINE: agora `2026-09-07 23:59:59` local, prazo 06/09 não concluído → atrasado; 07/09 ou 08/09 → no prazo. À meia-noite de 08/09, prazo 07/09 não concluído → atrasado. Prazo 06/09 concluído → concluído, nunca atrasado. | Unitário + componente de meta | CF-005/014 |
| AC-TIME-005 | T §Contrato/3 | D-MONTH: 29/30/31 de janeiro +1 → `2026-02-01`; 31/03 −1 → `2026-02-01`; 31/12 +1 → `2027-01-01`; 31/01 −1 → `2025-12-01`. Valor original imutável. Cartões, planejamento e extrato exibem a competência resultante, sem saltar fevereiro. | Unitário + componente | CF-005/012/013 |
| AC-TIME-006 | T; P; CF-007 | Browser São Paulo/JVM UTC: salvar data civil `2026-09-07`, verificar request, persistência, response, lista/detalhe e reload → sempre dia 07/09. Repetir com browser UTC+14. DTOs concretos e tipos de coluna vêm de CF-004; nunca sufixar `Z` para passar. | Contrato HTTP + PostgreSQL + E2E integrado | CF-006/007; revisão CF-015 |
| AC-TIME-007 | A/ADR-003; CF-004 | D-INSTANT: `2026-09-07T23:30:00-03:00`, `2026-09-08T02:30:00Z` e `2026-09-08T16:30:00+14:00` representam o mesmo instante. `2026-09-07T23:30:00` legado sem origem conhecida não recebe UTC/offset inventado. Não passar esses valores pelo formatter civil. Rótulo/fuso visual: DEC-01/02. | Contrato HTTP + integração, após inventário | CF-004/006 |
| AC-TIME-008 | O §Cartões; CF-004/019 | Cartão com dia 31 em fevereiro comum/bissexto: reconhecer que 31/02 não existe; **data exata de fechamento/vencimento pendente de DEC-03**. Não presumir último dia, próximo mês ou dia útil. Navegação por competência continua coberta por AC-TIME-005. | Contrato e integração, após decisão | CF-004/019 |
| AC-TIME-009 | CF-004/015 | Página/formulário aberto cruza 23:59→00:00 com data já digitada: hoje recém-calculado segue AC-TIME-003; atualização automática de campo/status já montado precisa DEC-01. Registrar campo intocado e campo editado em separado; não inferir comportamento pelo helper isolado. | Componente com avanço de relógio + E2E | CF-004/005/007/015 |
| AC-TIME-010 | A/ADR-003; CF-006/022 | Dia de hábito, janela de recorrência e cron sob JVM UTC/browser São Paulo: fixar Clock, impedir execução duplicada para a mesma janela; fronteira exata do dia/semana depende de DEC-01/08. Não declarar fuso Jackson suficiente. | Integração PostgreSQL + E2E de hábito | CF-006/022/014 |

### Apresentação, contratos e confiança na validação

IDs AC-UI-013 a AC-UI-015 identificam gates transversais que sustentam a evidência de UI/API; não pretendem transformar falhas de ferramenta em defeitos visuais.

| Critério | Fonte | Cenário e resultado esperado explícito | Camada de teste | Tarefa responsável |
|---|---|---|---|---|
| AC-UI-001 | P; CF-010 | V-LONG: nome longo, token sem espaços e modal rolável em 360×800, inclusive zoom 200%. Sem sobreposição de texto/valor/ação; confirmar/cancelar alcançáveis por scroll/teclado. Foco fica no modal e retorna ao acionador ao fechar. Texto pode quebrar ou truncar com acesso ao conteúdo completo; não impor pixels inventados. | Componente + funcional + visual inspecionado | CF-010; consumidores CF-011/012/013/014 |
| AC-UI-002 | P; CF-012 | V-EMPTY/V-LOADING/V-ERROR: sucesso com coleção vazia mostra estado vazio; carregamento não afirma saldo zero; 503/timeout mostra falha recuperável, não lista vazia legítima. Retry bem-sucedido substitui erro por dados reais. | Componente + E2E de falha | CF-008/012/013/014 |
| AC-UI-003 | O/3; P; CF-012 | V-MONEY: `1300.00` → conteúdo monetário pt-BR `R$ 1.300,00`, `0.00` → `R$ 0,00`, `-125.45` → `-R$ 125,45`, `1234567.89` → `R$ 1.234.567,89`. U+0020/U+00A0 no espaço monetário são equivalentes; sinal/dígitos/centavos não. Privacidade ligada oculta os valores nas superfícies protegidas, inclusive detalhes/tooltips; não mascarar valores no teste com privacidade desligada. Escopo exato de privacidade: DEC-06. | Componente + visual | CF-010/012/013/014 |
| AC-UI-004 | D/F-005; CF-008 | H-401/H-403: GET privado retorna 401 → solicitar autenticação; 403 → exibir proibição e manter sessão válida. Uma próxima leitura autorizada continua funcionando após 403. Nenhum caso mostra sucesso. Não fixar rota de redirecionamento antes do contrato. | Contrato HTTP + componente + E2E | CF-008/011/023 |
| AC-UI-005 | D/F-006; CF-008 | H-400/H-409: entrada civil inválida/malformada → 400 identificando campo; conflito real de versão → 409 e possibilidade de reler/corrigir, sem sucesso fictício. Uma falha de servidor continua 5xx. Body/caminhos exatos mapeados em CF-008, não copiados do handler atual. | Controller/serializador reais + componente | CF-008; conflitos CF-024/030 |
| AC-UI-006 | CF-008/009 | H-503/H-TIMEOUT/H-500: falha ao salvar conserva formulário recuperável, mostra erro/retry, não fecha com sucesso e não presume gravação. Timeout após envio tem resultado desconhecido: reler/reconciliar antes de repetir operação monetária. Cancelamento por troca de seleção não vira falso 500. | Componente + contrato BFF + E2E de falha | CF-008/009/011/013 |
| AC-UI-007 | CF-008/011 | H-204: sucesso sem corpo não tenta parse JSON. Download com HTTP 500/JSON de erro não produz arquivo válido; sucesso binário preserva bytes e tipo. Payloads concretos dependem de CF-008. | Contrato HTTP + componente | CF-008/011 |
| AC-UI-008 | D/F-007 hipótese; CF-009 | Requisitar cartão A/setembro, depois B/outubro; B responde primeiro, A por último. Seleção e dados finais são B/outubro. Logout A seguido de login B não mostra resposta/cache de A. Hipótese de ocorrência ainda exige reprodução. | Componente com respostas controladas + E2E | CF-009; isolamento CF-023 |
| AC-UI-009 | D/F-007 hipótese; CF-009 | Mutação M1 falha depois de M2 válida: não chamar sucesso de M1, não apagar M2, permitir nova tentativa; duplo clique controlado não produz sucesso falso. Integridade no banco é AC-FIN-010, não comprovada pela trava do botão. | Componente + integração | CF-009/024 |
| AC-UI-010 | CF-011 | Salvar tema escuro/preferência autorizada e recarregar → valor salvo reaparece. Falha de gravação → erro e estado reconciliado, sem alegar persistência. Registro/login/recuperação/logout com teclado e provedor de e-mail falso. | Componente + E2E integrado | CF-011 |
| AC-UI-011 | CF-012/013/014; P | Data/competência/valor/status na lista, detalhe e reload correspondem à mesma resposta persistida. Ex.: pagamento F-PAY → conta `800.00`, dívida `0.00` e patrimônio `1300.00`; seleção de mês não muda por causa do pagamento. Valor incorreto da API é achado de regra/contrato; não recalcular no componente para escondê-lo. | E2E integrado + visual | CF-007/012/013/014/021/032 |
| AC-UI-012 | D/F-010; O/9; CF-014 | Consultar 2025 com abertura conhecida só em 2026: não rotular `1300.00` atual como patrimônio histórico nem preencher posição desconhecida com zero. Mostrar indisponibilidade ou seção explicitamente atual, conforme DEC-04. | Componente + contrato HTTP + integração | CF-014/016/021 |
| AC-UI-013 | D/F-012; P | Teste de cada risco deve falhar pela alteração da regra pertinente (ex.: usar UTC para hoje), não por import/ambiente. Registrar antes/depois/restauração e camada. E2E financeiro observa banco/reload sem sucesso interno interceptado. Verde de build/fixture não aprova fluxo financeiro. | Revisão de testes + mutações isoladas + CI | CF-001/002/003/005/007/015/032/033/034 |
| AC-UI-014 | D/F-014; CF-034/035 | Comandos documentados referem diretórios reais, Java 21 e configuração BFF `BACKEND_API_URL`. Checkout revisado executa gates sem segredos de produção; artefato publicado corresponde à revisão validada. Inspeção YAML não equivale a execução remota. | Inspeção + execução local/CI/homologação | CF-001/034/035 |
| AC-UI-015 | D/F-017; CF-026 | Lint final sem erros/avisos não justificados, typecheck/build e consumidores aprovados; não excluir arquivos, adicionar ignore global ou mudar assertion para obter verde. Quantidade histórica 70/37 não é meta nem recontagem atual. | Análise estática + regressão dos consumidores | CF-026/034 |

### Integridade e abertura

| Critério | Fonte | Cenário e resultado esperado explícito | Camada de teste | Tarefa responsável |
|---|---|---|---|---|
| AC-FIN-001 | O/1–3; P | F-OPEN: conta `1000.00`, investimento `500.00`, dívida `200.00` → ativos `1500.00`, patrimônio `1300.00`. Reservar `300.00` na conta → livres `700.00`, conta continua `1000.00`, patrimônio continua `1300.00`, não `1600.00`. | Unitário de domínio + PostgreSQL + E2E | CF-016/018/020/021/030/032 |
| AC-FIN-002 | O/1/5; CF-016 | F-OPEN/F-PENDING: abertura não gera receita realizada; previsão de receita `250.00` não paga não altera conta `1000.00`, realizado `0.00` ou patrimônio `1300.00`. Relatório de compromissos pode mostrar `250.00` pendente, distinguindo-o de realizado. | Domínio + queries reais + contrato | CF-016/018/021 |
| AC-FIN-003 | O/4; CF-016/019 | F-PAY: pagar dívida de abertura `200.00` integralmente sem taxa → conta `800.00`, passivo `0.00`, investimento `500.00`, patrimônio `1300.00`, livres na conta `500.00` após reserva de `300.00`. Uma saída de caixa `200.00`; nenhuma nova compra histórica. Replay não debita novamente. Regime/rótulos de relatório e contrato de replay: DEC-04/07. | PostgreSQL + contrato + E2E/reload | CF-016/018/019/021/024/032 |
| AC-FIN-004 | O/9; D/F-010 | Sem histórico anterior à data-base `2026-09-07`, posição de 2025 é desconhecida. Nunca usar posição atual como fechamento passado ou inventar saldo zero. DEC-04 decide reconstrução histórica versus seção atual rotulada. | Domínio + contrato + componente | CF-016/021 |
| AC-FIN-005 | O/7; A/ADR-004; CF-023 | Usuário B tenta ler/alterar/alocar fonte de A por ID válido: nenhuma leitura de dados financeiros de A, nenhuma mutação em A/B. Login B não vê cache de A. Status uniforme 403/404 é DEC-09; não fixar um dos dois pela implementação atual. | Contrato autenticado + PostgreSQL + E2E | CF-023/024/029/030 |
| AC-FIN-006 | O/8 e aceite; A/ADR-004 | F-REPLAY: mesma conclusão de onboarding/chave/conteúdo aplicada duas vezes retorna a mesma conclusão e IDs, quantidades/saldos iguais a F-OPEN; duas abas não criam segunda abertura. Mesma chave/conteúdo diferente → 409 no contrato proposto, a ratificar em CF-028. | PostgreSQL com conexões/barreira + contrato + E2E | CF-028/030/032 |
| AC-FIN-007 | O §Aceite | F-ROLLBACK: falha no último item da finalização → nenhuma entidade/saldo de abertura parcialmente criado; rascunho permanece corrigível. E-mail/cotação não ocorrem na transação. Reenvio corrigido cria uma conclusão. | Integração com falha determinística + E2E | CF-029/030/032 |
| AC-FIN-008 | O/2/6; §Destinação | F-ALLOC: origem `1000.00`, reservas `300.00` e `700.00` são limite válido; adicionar `0.01` rejeita excedente. Em rascunho, reduzir a origem de `1000.00` a `250.00` invalida reserva de `300.00` e impede conclusão até corrigir. Nunca criar ativo a partir da meta. | Domínio + PostgreSQL + componente | CF-016/020/028/030/031 |
| AC-FIN-009 | O §Contas; A/ADR-002; CF-016 | F-NEGATIVE/F-CENTS: conta `-125.45`, sem outros ativos/passivos → patrimônio `-125.45`, receita de abertura `0.00`; adições exatas `0.10` e `0.20` totalizam `0.30` sem tolerância flutuante. Não inventar regra de taxa, precisão de quantidade, empate de arredondamento ou estorno: DEC-07. | Domínio + contrato HTTP + PostgreSQL | CF-016/018/020 |
| AC-FIN-010 | A/ADR-004; CF-024 | Mesmo pagamento F-PAY em duas conexões concorrentes: no máximo um efeito econômico, conta final `800.00`, dívida `0.00`. Nenhum saldo perdido/débito duplicado; resposta da segunda requisição segue DEC-07. Cache após rollback reflete estado anterior e após commit confirma estado persistido. | PostgreSQL com barreiras, consulta após ambas + mutação isolada | CF-019/024; revisão CF-033 |
| AC-FIN-011 | D/F-013 risco; A/ADR-005; CF-025 | Listar/reordenar datasets sintéticos 1/10/100 itens e registrar SQL, round trips, tempo/memória e resultado. Consultas de relações não crescem uma por item nas rotas corrigidas; lista/paginação não duplica IDs, total não depende da página, reorder mantém posse. N+1 ainda precisa medição; não inventar latência/SLA. | Integração PostgreSQL instrumentada + EXPLAIN | CF-025 |
| AC-FIN-012 | D/F-011/016; CF-002/017/035 | Banco PostgreSQL vazio e descartável executa persistência/rollback; migrações aplicam sem ddl-auto update, reaplicação não duplica schema/dados. Wrapper em Java 21 executa ou registra bloqueio de ambiente; falha de conexão nunca prova bug de regra. Banco legado só migra com baseline revisado e restauração comprovada. | Ambiente + integração/migração + ensaio de restauração | CF-002/017/035 |
| AC-FIN-013 | O §Jornada/Aceite | F-DRAFT/F-ZERO: salvar/sair/recarregar mantém rascunho do proprietário sem criar posição real antes de concluir; perfil sem patrimônio conclui com totais zero e etapas opcionais puladas; conta legada mantém dados/acesso sem reinicialização automática. Endpoints/versionamento finais em CF-028. | Contrato + PostgreSQL + E2E | CF-028/029/030/031/032 |
| AC-FIN-014 | O §Parcelas/Aceite | F-INSTALLMENTS: fatura atual `200.00` já inclui parcela corrente `50.00`; três futuras explícitas `50.00`, `50.00`, `50.00` → obrigação total `350.00`, parcela corrente ocorre uma vez, nenhuma paga recriada. Competências fornecidas setembro/outubro/novembro/dezembro, não derivadas de regra bancária. Limite comprometido depende de DEC-03/07. | Domínio + PostgreSQL + E2E | CF-016/019/028/030/032 |

## Reconciliação manual dos oracles

Os estados são cenários independentes, não execução sequencial compartilhada. Moeda BRL, escala 2; dívida positiva denota passivo a subtrair. Conta negativa já reduz ativos líquidos e não é subtraída novamente como outra dívida.

| Cenário | Conta | Investimento | Dívida | Reserva da conta | Livre da conta | Patrimônio | Resultado adicional |
|---|---:|---:|---:|---:|---:|---:|---|
| F-OPEN (A) | 1000.00 | 500.00 | 200.00 | 300.00 | 700.00 | 1300.00 | 100000 + 50000 − 20000 = 130000 centavos; receita de abertura zero |
| F-PENDING (A) | 1000.00 | 500.00 | 200.00 | 300.00 | 700.00 | 1300.00 | Previsão não paga 250.00; realizado 0.00 |
| F-PAY (A) | 800.00 | 500.00 | 0.00 | 300.00 | 500.00 | 1300.00 | 100000 − 20000 = 80000; caixa sai 200.00 uma vez |
| F-USER-B | 42.17 | 0.00 | 0.00 | 0.00 | 42.17 | 42.17 | Sentinela distinta para detectar mistura entre usuários |
| F-ZERO | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | Zero conhecido é diferente de posição desconhecida |
| F-NEGATIVE | -125.45 | 0.00 | 0.00 | 0.00 | -125.45 | -125.45 | Abertura negativa não é renda; “livre” é saldo líquido, não autorização de alocação negativa |

F-CENTS soma 10 + 20 = 30 centavos. F-INSTALLMENTS soma 20000 + 5000 + 5000 + 5000 = 35000 centavos. Estes cálculos não escolhem regra de arredondamento, fechamento, limite ou reconhecimento contábil ainda pendente.

## Decisões pendentes e limites dos expected

| Decisão | Informação ausente / responsável | Trabalho que permanece válido |
|---|---|---|
| DEC-01 | Definida pela CF-004 na [SPEC-002](002-datas.md): defaults/prazo visual locais, hoje de backend/hábitos em America/Sao_Paulo, formulário aberto preservado e status reativo. Janela semanal permanece CF-022. | Data civil não converte; default calculado agora usa navegador neste lote; meta concluída nunca atrasa. |
| DEC-02 | Contrato e tratamento de origem desconhecida definidos pela CF-004 na [SPEC-002](002-datas.md). Proveniência real de cada linha permanece desconhecida até CF-017; não bloqueia exemplos sintéticos de origem conhecida. | Instantes com offsets conhecidos equivalem; legado desconhecido não recebe `Z`. |
| DEC-03 | CF-004/019: dia 29–31 em mês curto, fechamento/vencimento, data de compra na fronteira e limite comprometido. | Competência e datas civis válidas; parcelas explicitamente informadas contadas uma vez. |
| DEC-04 | Definida pela CF-016 na [SPEC-004](004-regras-financeiras.md): separar caixa realizado, receitas, consumo, investimentos e compromissos; relatório anual de fluxos com seção atual datada, histórico indisponível sem cobertura. Implementação CF-018/019/020/021. | Abertura não é renda; pendente não é realizado; meta não duplica patrimônio; pagamento não repete compra; posição sem história não é zero. |
| DEC-05 | Definida pela CF-004 na [SPEC-002](002-datas.md): `—` com nome acessível, datas de entrada obrigatórias e hora opcional explicitamente desconhecida; implementação CF-005/006/008/010 e schema CF-017 conforme perfil. | Rejeitar normalização silenciosa; marcador escolhido por não sugerir data/zero/epoch, sem tomar o teste atual como fonte. |
| DEC-06 | CF-010/011: superfícies cobertas por privacidade, persistência da preferência e exposição acessível. | Nas superfícies cobertas, não revelar valores por texto/tooltips; privacidade desligada mantém precisão. |
| DEC-07 | Regras financeiras definidas pela CF-016 na [SPEC-004](004-regras-financeiras.md): dinheiro em centavos/HALF_UP, quantidade/preço até oito casas, resto na última parcela, custo/avaliação, taxas, reservas, limite gerencial e compensações. CF-019 mantém DEC-03 do ciclo bancário; CF-024 detalha transporte/recibo durável e recuperação do protocolo de repetição. | Oracles CF-001 preservados; novos exemplos com taxas e arredondamento na CF-016. Um efeito econômico por operação; contratos existentes ainda não declarados conformes/idempotentes. |
| DEC-08 | Aprovada pelo usuário em 30/09/2026 na [SPEC-002](002-datas.md): semana segunda–domingo em Brasília, perdão diário preservado, correção passada/recusa futura, ofensiva recalculada, +1 reversível somente para meta NUMERIC do owner. | [Exemplos independentes CF-022](../../../tasks/evidencias/CF-022/CONTRATO.md); cron repetido estável, efeitos identificados por registro e nenhum backfill por texto/data. |
| DEC-09 | CF-023, 30/09/2026: referência inexistente/alheia em consulta de recurso, vínculo ou comando retorna 404 com mesma mensagem por recurso. Reorder misto falha integralmente; duplicação de IDs é 400. 401 distingue falta/invalidade/expiração de credencial; 403 fica para proibição independente da existência. [Contrato e oracles CF-023](../../../tasks/evidencias/CF-023/CONTRATO.md). | Nenhum dado alheio ou alteração parcial. Filtro de coleção consulta somente o owner, sem revelar dados/existência alheios. CF-028 ainda ratifica seus DTOs/status próprios de onboarding. |

Uma decisão pendente impede aprovar o comportamento dependente, não impede fechar a entrega documental CF-001. Antes de implementar tal comportamento, a tarefa dona deve registrar decisão/fonte, atualizar especificação e fixtures e só então escrever assertions definitivas. Nenhuma hipótese de F-007/F-013/F-015 é convertida em falha reproduzida aqui.

## Rastreabilidade individual dos achados

O estado é o do diagnóstico, com o patch inicial explicitado; não é encerramento do achado. F-012/F-014 já têm mudanças locais parciais.

| Achado | Natureza / limite da evidência | Critério(s) | Tarefa(s) dona(s) |
|---|---|---|---|
| F-001 | Semântica confirmada; patch de helper existente, consumidores sem E2E | AC-TIME-001, AC-TIME-006 | CF-004/005/006/007/015 |
| F-002 | Semântica confirmada; defaults nos formulários não exercitados | AC-TIME-003, AC-TIME-009 | CF-004/005/007/015 |
| F-003 | Semântica confirmada; status de meta concluída não coberto pela suíte atual | AC-TIME-004 | CF-004/005/014/015 |
| F-004 | Semântica confirmada; navegação dos consumidores não exercitada | AC-TIME-005 | CF-004/005/007/015 |
| F-005 | Código confirma tratamento; reprodução HTTP pendente | AC-UI-004 | CF-008/011/023 |
| F-006 | Código confirma handler genérico; reprodução HTTP pendente | AC-UI-005, AC-UI-007 | CF-008 |
| F-007 | Hipótese, reproduzir com ordem/barreiras controladas | AC-UI-008, AC-UI-009, AC-FIN-010 | CF-009/024/033 |
| F-008 | Lacuna de onboarding confirmada; endpoint ainda proposto | AC-FIN-006, AC-FIN-007, AC-FIN-008, AC-FIN-013, AC-FIN-014 | CF-016/020/028/029/030/031/032 |
| F-009 | Problema identificado; detalhes financeiros dependem de DEC-04/07 | AC-FIN-001, AC-FIN-002, AC-FIN-003, AC-FIN-008, AC-FIN-009 | CF-016/018/019/020/021 |
| F-010 | Posição atual misturada ao ano; decisão histórica pendente | AC-FIN-004, AC-UI-012 | CF-016/021 |
| F-011 | Migrações ausentes no diagnóstico; remoto desconhecido | AC-FIN-012 | CF-002/017/035 |
| F-012 | Cobertura insuficiente; cinco testes de helper agora existentes | AC-UI-013 | CF-001/002/003/007/032/033/034 |
| F-013 | Risco; round trips de reorder e N+1 precisam medição | AC-FIN-011 | CF-025 |
| F-014 | README/variável corrigidos no patch; pipeline remoto não verificado | AC-UI-014 | CF-001/034/035 |
| F-015 | Relato de usuário; nenhuma auditoria visual executada aqui | AC-UI-001, AC-UI-002, AC-UI-003, AC-UI-010, AC-UI-011, AC-UI-012 | CF-003/010/011/012/013/014/015 |
| F-016 | Bloqueio de wrapper do diagnóstico; não reexecutado em CF-001 | AC-FIN-012 | CF-002 |
| F-017 | Lint histórico falhou; contagem não reexecutada em CF-001 | AC-UI-015 | CF-026/034 |

## Escolhas e trade-offs desta fundação

Fixtures literais e pequenas favorecem auditoria e compartilhamento entre Node/Java; exigem atualização deliberada quando o contrato mudar. O validador usa apenas Node/BigInt para checar coerência dos dados, sem testar a aplicação nem reproduzir seu cálculo. Adapters dos futuros testes devem consumir esses expected; não usar um mesmo serializer/calculador de produção para gerar ambos os lados.

Matriz de telas por risco evita multiplicar todos os estados/fusos/viewports sem propósito, mas combinações não atribuídas permanecem lacunas explícitas. Concorrência financeira requer transações/conexões distintas: trava React não protege banco. Para CF-025, medir round trips separadamente de custo O(n) de percorrer/escrever n registros; leitura em lote pode reduzir viagens sem tornar a operação O(1). Fetch join de coleção paginada e cache antecipado podem mascarar duplicidade/invalidação, por isso não são soluções presumidas.
