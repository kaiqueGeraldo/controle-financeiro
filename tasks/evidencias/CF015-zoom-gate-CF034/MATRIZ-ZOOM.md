# Matriz futura de zoom — não executada

Base do produto: `e1a01b6`. **Todas as linhas estão sem evidência de zoom nativo**.
Fonte: CF010/aceite1, SPEC003/AC-UI-001, roteiro EXP01–15 e DEC-ONB-03 §Pendência
de zoom. O contrato aceita quebra/truncamento com acesso ao conteúdo completo;
exige ações essenciais alcançáveis, leitura, scroll e foco. Não se acrescenta
proibição absoluta de rolagem horizontal.

Mínimos de dimensões CSS **antes de zoom**: 360×800, 768×1024 e 1440×900.
Registrar também janela externa, área interna e dimensões resultantes a 200%.
Configurar indicador nativo 200% e capturá-lo associado à janela/URL/execução;
DPR relativo e geometria apenas corroboram, nunca substituem esse indicador.
Distribuir claro/escuro, privacidade on/off, vazio, dados extensos/loading/erro
segundo o roteiro, ampliando combinações quando surgir falha compartilhada.

| Tela/fluxo | Interação e conteúdo exigidos a 200% | Referência / aceite condicionado |
|---|---|---|
| Shell/sidebar e diálogo comum | Abrir/fechar navegação móvel; nome longo/token sem espaços; formulário com 100 linhas; alcançar confirmar/cancelar por scroll e teclado; erro legível; modal aninhado real quando existir | CF010/1, AC-UI-001, EXP01 |
| Autenticação/configurações | Registro/login/recuperação sintéticos, erros 400/401/503, formulários e preferências/exportação; teclado e mensagem legível, sem e-mail real | Consumidor CF011, EXP02/03 |
| Dashboard/contas/extrato | Valores negativos/extensos, estados vazio/loading/erro; criar/editar/arquivar/cancelar conforme contrato; paginação e conteúdo completo; modal de transação | CF012, EXP04/05/06/13 |
| Cartões/fatura/pagamento/planejamento | Fatura longa (12 compras), último item e CTA; correção de erro, salvar/cancelar; Tab/Shift+Tab contidos; Escape só no filho e retorno ao acionador; lista e competência legíveis | CF013, EXP07/08/13 |
| Metas/investimentos | Prazo, reserva, checklist, detalhes/histórico longo, operação/erro/cancelamento; retorno de foco entre camadas; conteúdo monetário legível com privacidade desligada | CF014, EXP09/10/13 |
| Hábitos/resumo anual | Criar/editar/cancelar, calendário, nota extensa e ações; foco, leitura e scroll até o fim | CF014, EXP11/12 |
| Onboarding: contexto/contas/cartões/investimentos/metas | Navegar etapas e voltar com rascunho; nomes longos; campos/erros; completar ou cancelar etapa sem controles recortados | DEC-ONB-03, CF031, EXP15 |
| Onboarding: reservas/previsões/revisão/confirmação/recuperação | Conteúdo extenso; erros por campo; corrigir fonte/reserva; revisar/confirmar; falha recuperável/reload/retomada; teclado e alcance de todas as ações | DEC-ONB-03, CF031/032, EXP15 |

Por linha: base/hashes, usuário/seed sintéticos, navegador/versão, URL, dimensões,
tema/privacidade/fusos/relógio; captura do indicador, topo/fim e modal/erro;
sequência real de cliques/teclas/scroll e resultado por passo. Presença no DOM
não comprova usabilidade. E2E financeiro usa BFF/Spring/PostgreSQL descartáveis,
sem sucesso HTTP interno simulado. Não ampliar este ensaio para nova revisão
financeira integral sem regressão concreta.

Ao terminar ou interromper após alterar zoom, restaurar e comprovar configuração
inicial. Defeito recebe tela/condição/critério/impacto/reprodução; correção em
tarefa própria, sem editar produto nesta análise. Cobertura parcial não encerra
todo AC-UI-001. Executor reúne provas CF010; revisão independente CF015 confronta
o conjunto e os demais aceites antes de alterar estados. O preflight atual parou
antes da primeira linha: [limite comprovado](CAPACIDADES.md).
