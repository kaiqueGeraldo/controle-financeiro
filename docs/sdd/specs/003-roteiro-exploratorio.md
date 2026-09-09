# Roteiro exploratório e classificação — CF-001

Este é um plano de execução das tarefas donas da [matriz de critérios](003-criterios-oracles.md). **Nenhuma linha foi executada em navegador na CF-001.** Fixtures e relógios: [cf001.json](../../../controle-financeiro-frontend/tests/oracles/cf001.json), seed `cf001-v1`, usuários A/B sintéticos. Registrar o resultado de cada passo; não encerrar roteiro apenas porque a tela abriu.

## Classificar pela evidência

| Classe | Evidência para distinguir | Ação / esperado |
|---|---|---|
| Erro visual | Payload correto e regra conhecida, mas texto, data, status, foco ou geometria apresentados incorretamente | Captura/DOM/acessibilidade, viewport, tema, estado e request relacionado; encaminhar à tarefa de tela/componente. Não alterar o valor correto da API. |
| Erro de contrato | Request/response/status/campo/tipo viola contrato especificado; serializador/controller/BFF reais identificados | Guardar payload sintético e status, apontar campo/critério; CF-008 ou dona do domínio. HTTP 200 não prova persistência. |
| Erro de regra/integridade | Entrada válida e transporte correto, mas valor persistido, efeito econômico, ownership ou atomicidade viola invariante | Observar banco/nova leitura e cenário independente; CF-016 a CF-024/030. Não corrigir cálculo apenas no componente. |
| Regra ambígua | Fontes permitem mais de um expected (ex.: dia 31 para vencimento em fevereiro) | Registrar DEC, alternativas e responsável. Não marcar passou/falhou por preferência ou implementação. A aprovação desse cenário fica pendente. |
| Indisponibilidade | Falta de runtime, DB descartável, conexão recusada, serviço parado ou timeout impede observar regra | Registrar processo/comando/status e alcance. Não é evidência de bug financeiro. Timeout após escrita tem resultado desconhecido; reconciliar antes de reenviar. UI de recuperação pode ser avaliada separadamente com falha controlada. |
| Não reproduzido | Hipótese ou relato sem divergência nos cenários realmente executados | Registrar entradas, ordem de respostas, relógio e observações; manter limite da investigação. Não converter em correção ou aprovação geral. |

Classe e severidade são campos separados. Backend Railway informado como desligado no diagnóstico não confirma indisponibilidade atual nem justifica usar banco remoto. Só testar ambientes descartáveis sintéticos.

## Severidade

Usar a escala do [diagnóstico](../diagnostico.md):

- **P0**: integridade/isolamento confirmado que bloqueia dados reais (ex.: B lê dados de A, duplo débito, perda de saldo). Exige correção e regressão causal antes de liberação.
- **P1**: fluxo essencial comprometido (data financeira errada, meta vencida incorretamente, pagamento inacessível, logout por 403, erro escondido como sucesso). Impede fechar o marco afetado enquanto não corrigido ou delimitado por decisão explícita.
- **P2**: usabilidade/manutenção/desempenho sem perda essencial comprovada (truncamento com acesso alternativo, queries excessivas medidas, lint). Se impedir operação ou expor valores, elevar conforme impacto observado.

Hipótese pode ter prioridade de investigação P1 sem ser defeito P1 confirmado. Uma regra indefinida ou ambiente ausente é bloqueio do cenário; não inventar severidade de bug. Novo defeito reproduzido recebe próximo F disponível e tarefa derivada pelo [template](../../../tasks/templates/TAREFA.md), respeitando o escopo da tarefa em execução.

## Matriz mínima por tela

Todas as linhas: estado **planejado**. “Priv.” ligada exige fixture V-MONEY; desligada exige leitura dos valores literais. Não aplicar máscara no snapshot para esconder o valor sob teste. Dimensões em CSS pixels antes de aplicar zoom. Tema/privacidade são definidos explicitamente, sem depender de preferência deixada por outro teste.

| Roteiro / telas | Viewport; tema; priv. | Estado e ação | Expected / critérios | Dona |
|---|---|---|---|---|
| EXP-01 — Componentes comuns, sidebar, modal de formulário | 360×800; claro; desligada; repetir modal escuro e zoom 200% | V-LONG e 100 linhas; abrir, tabular, rolar, provocar erro, corrigir, fechar; modal aninhado apenas se existir | Sem sobreposição; erro legível; confirmar alcançável; foco retorna; conteúdo completo acessível. AC-UI-001 | CF-010 |
| EXP-02 — Autenticação (registro/login/recuperação/logout) | 360×800; escuro; desligada | V-LONG, 400, 401 e 503; teclado; recuperação com double | Campo inválido identificado, sessão exigida em 401, indisponibilidade distinta, sem e-mail real. AC-UI-004/005/006 | CF-011/008 |
| EXP-03 — Configurações e senha/exportação | 768×1024; claro→escuro; ligada→desligada | Salvar preferência, reload; repetir com falha; exportar 500 e binário válido | Reaparece só o salvo; erro sem sucesso fictício; nenhum JSON de erro salvo como planilha. AC-UI-007/010 | CF-011/008 |
| EXP-04 — Dashboard | 1440×900; claro; desligada; repetir ligada | F-OPEN, V-EMPTY/LOADING/ERROR; retry | Patrimônio 1300.00 e fontes sem duplicar meta; erro não é zero; privacidade protege superfícies definidas. AC-FIN-001, AC-UI-002/003 | CF-012/021 |
| EXP-05 — Contas | 360×800; escuro; desligada | F-NEGATIVE, V-LONG; criar zero/negativo, editar/arquivar/reordenar conforme contrato | Sinal/centavos legíveis, ações acessíveis, abertura não é receita; operações respeitam dono. AC-UI-001/003, AC-FIN-009/011 | CF-012/018/025 |
| EXP-06 — Extrato | 768×1024; claro; desligada | 100 linhas, filtro/página, janeiro/31 +1; D-CIVIL em lista/detalhe/reload | Competência fevereiro; data 07/09 igual; filtro/página não redefine total global sem rótulo de escopo. AC-TIME-001/005/006, AC-UI-011 | CF-012/007/021 |
| EXP-07 — Cartões e faturas | 360×800; claro; desligada; repetir escuro/ligada | V-LONG; fatura vazia/aberta/parcial/paga como estados de entrada; troca rápida A→B; F-PAY e 409/503 | Ação de pagamento alcançável; seleção atual preservada; conta 800.00/dívida 0.00 após pagamento/reload; status vem do contrato. Não decidir regra de pagamento parcial aqui. AC-UI-008/011, AC-FIN-003 | CF-013/009/019 |
| EXP-08 — Planejamento | 1440×900; escuro; desligada | Previsão 250.00 não paga; mês curto; data longa e falha ao salvar | Previsto distinto de realizado 0.00; fevereiro não salta; erro conserva possibilidade de correção. AC-TIME-005, AC-FIN-002, AC-UI-006 | CF-013/018/021 |
| EXP-09 — Metas | 360×800; escuro; desligada | D-DEADLINE, meta concluída/numérica/monetária, V-LONG; avanço do relógio | Hoje não atrasa antes da virada; concluída nunca atrasa; reserva não aumenta patrimônio; regra reativa em aberto é DEC-01. AC-TIME-004/009, AC-FIN-001/008 | CF-014/005/020 |
| EXP-10 — Investimentos | 768×1024; claro; ligada; repetir desligada | Posição 500.00, histórico D-CIVIL, loading/erro de cotação, texto longo | Valor preciso e data 07/09 no histórico quando civil; falha externa não vira posição zero; opening não debita conta. AC-TIME-001, AC-UI-002/003, AC-FIN-001 | CF-014/020 |
| EXP-11 — Hábitos | 360×800; claro; desligada | Marcar/desmarcar, calendário, cron/janela e passagem de dia com Clock | Dia/janela definida por CF-004/022; sem dupla aplicação; bloqueado o expected exato enquanto DEC-01/08 pendentes. AC-TIME-010 | CF-014/022 |
| EXP-12 — Resumo anual | 1440×900; escuro; desligada; repetir ligada | Selecionar 2025 e 2026, F-OPEN, notas longas, loading/erro | Histórico desconhecido não é zero nem posição atual rotulada 2025; valores conhecidos não se duplicam. AC-UI-012, AC-FIN-004 | CF-014/021 |
| EXP-13 — Quatro formulários temporais | 360×800; claro; desligada; browser São Paulo/JVM UTC e browser UTC+14/JVM UTC | D-CLOCK; abrir transação, compra no cartão, operação de investimento e pagamento; salvar D-CIVIL, reload/nova leitura | Default literal por fuso; 07/09 persiste e reaparece. Valores/status monetários só aprovados com contrato do domínio. AC-TIME-003/006 | CF-005/006/007 |
| EXP-14 — Isolamento e resposta atrasada | 1440×900; claro; desligada | A consulta; logout/login B; resposta de A chega por último; B tenta ID de A | Nenhum dado/cache de A aparece para B; conta sentinela B 42.17 permanece intacta. AC-UI-008, AC-FIN-005 | CF-009/023 |
| EXP-15 — Onboarding após implementação | 360×800 e 1440×900; claro/escuro respectivamente; desligada | F-DRAFT, F-ZERO, F-REPLAY, F-ROLLBACK, F-INSTALLMENTS; duas abas; usuário legado | Retoma rascunho, uma conclusão, rollback completo, parcelas sem duplicidade; saldo e fontes após reload. AC-FIN-006/007/013/014 | CF-031/032 |

Cobertura distribuída: todos os viewports, ambos os temas/privacidade, vazio, dados numerosos, texto longo, loading e erro estão atribuídos. Isso não cobre todas as combinações. CF-015 amplia as combinações onde houver componente compartilhado defeituoso; CF-032 cobre jornada completa. E2E financeiro não usa HTTP de sucesso simulado; mocks de estados visuais devem ser rotulados como componente/visual.

## Passos e evidência por execução

1. Registrar revisão Git **e hashes do diff local**, tarefa, ambiente/runtime, seed/namespace, usuário, URL/tela, viewport/zoom, tema/privacidade, fuso browser/JVM e instante do Clock. Confirmar ambiente descartável; não copiar dados da planilha real.
2. Selecionar AC/EXP e oracle antes de abrir a tela. Pendência DEC continua pendente. Registrar pré-condição, entrada e expected literal/semântico, sem tomar captura atual como golden.
3. Executar passos; guardar resultado por passo, requests/status sintéticos e, para persistência, nova leitura independente após reload. Em erro visual, comparar geometria/texto da captura e foco; em integridade, guardar efeito no banco e contagem de entidades.
4. Para corridas, controlar promessa/barreira ou respostas HTTP por evento, sem sleeps fixos. Separar duas chamadas sequenciais de duas transações efetivamente sobrepostas. Para timeout após escrita, verificar se houve commit antes de retry seguro.
5. Registrar `aprovado`, `falhou pelo defeito`, `bloqueado por ambiente`, `pendente de decisão` ou `não executado`, com classe/severidade. Falha inicial permanece registrada mesmo se uma tentativa posterior passar.
6. Na correção da tarefa dona, demonstrar assertion falhando pelo bug e passando após fix; para patch já pronto, usar cópia isolada/mutação dirigida e prova de restauração. Anexar diff temporário, logs e capturas inspecionadas. Sem remover assertions, skip ou aumento de tolerância para ocultar defeito.
7. Nome sugerido de artefato: `EXP-07_AC-UI-011_seed-cf001-v1_360x800_claro_priv-off_antes.png` (e depois/trace/log). Salvar em evidências da tarefa dona. Encerrar com cenários não executados, decisões pendentes e riscos; não com aprovação genérica de toda a tela.

Mutantes dirigidos para tarefas futuras: voltar data civil à conversão de instante (AC-TIME-001); default UTC (003); trocar `<` por `<=` no prazo (004); remover ancoragem no dia 1 (005); aceitar resposta obsoleta (AC-UI-008); retirar filtro realizado (AC-FIN-002); duplicar parcela (014); omitir owner/idempotência (005/006/010). Não executar mutantes em runtime compartilhado.
