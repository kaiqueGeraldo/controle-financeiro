# CF-032 — matriz anterior à implementação das jornadas

22/10/2026, base 331d3344c24dc60f5e1940989b9a35c0d5da1aa6. Autoridades:
SPEC-001 v1 (§3/5/5.1/6/7), SPEC-002/DEC-08, SPEC-004/FIN-01–08,
CF-023/DEC-09 e CF-024/DEC-10. Expected literais em `oracle.json`, sem helpers
financeiros de produto. Cada cenário tem owner/fixture próprios; nenhum depende
da ordem de outro teste. Identidades geradas são apenas referências, nunca expected.

| Critério / cenário | Estado inicial | Operações | Oracle independente | Checkpoints | Borda / evidência |
|---|---|---|---|---|---|
| C1/C2 A: cadastro/entrevista | Registro vazio real | UI contexto/save/reload; E01 por PUT real, revisão/confirmar UI | E01: contas1300, investimentos501, dívida350, patrimônio1451, reservas350+200, livre950; custo agregado desconhecido | UI revisão/recibo, API, SQL antes/depois, reload | Save não cria efeitos; aplicação16 itens/1 recibo, 1 previsão pendente; captura |
| C1/C2 B: uso diário | E01 aplicado em owner exclusivo | UI receita250.10, despesa40.20, transferência100/taxa2; compra120/3 parcelas, pagamento200; compra2 unidades×10/taxa1 na ação E01; destinação corrente300→400 | CP1: contas1507.90/P1658.90; CP2 compra dívida470/P1538.90; CP3 pagamento contas1307.90/dívida270/P1538.90; CP4 investimento contas1286.90/ativos501.67/P1518.57; CP5 reservas contas450/invest200/livre836.90/P1518.57 | UI extrato/contas/cartões/investimentos/metas; API e SQL a cada CP; reload | NG01: avaliação TOTAL1 para3 unidades permanece referência:5 unidades valem1.67; custo0.60+21=21.60. Execução10 não substitui avaliação. Transferência elimina pernas; pagamento não é consumo; reserva não cria ativo |
| C1/C2 C: relatório/exportação | Owner isolado com mesmo E01 e movimentos B, sem depender de B | Relatório outubro/anual, download real XLSX período e filtro conta | Receita250.10; consumo162.20=40.20+2+120; resultado87.90; caixa−13.10=250.10−40.20−2−200−21; transferência consolidada0 | UI/API/SQL e leitura POI de todas as células relevantes | XLSX civil, origem/status/nomes, sem abertura como renda, sem dupla contagem de compra/pagamento, sem dados B; cobertura parcial mês anterior à data-base |
| C2 D: nova sessão | Estado A/B persistido próprio | Logout UI/login UI/reload; troca A→B→A | Mesmos IDs/saldos/recibos; B sem nomes/valores exclusivos de A | Cookie limpo sem registrar valor, UI/API/SQL e captura | Memória/cache anterior não atravessa sessão |
| C1/C2 E: legado | SQL sintético com abertura/origem/custo não comprovados, reserva incerta | Acesso regular, complemento LINK, leitura/confirmar sem sobrescrever; tentativa reserva vedada | Saldo1000/P1000, reserva/progresso/livre UNKNOWN, sem aquisição/transação fictícia | UI resumo, API e SQL antes/depois | E18/E21/E23/E25/E35; completar sem inferir proveniência; prova de ausência de writes históricos |
| C1/C2 F: receber/prazo/hábito | E01 + previsão80 e meta numérica4 | Baixa parcial30 e final50 em datas distintas; hábito marcar/desmarcar dia passado e rejeitar futuro | Contas1300→1330→1380; pendente80→50→0; patrimônio1451→1481→1531; numérico4→5→4, monetário invariável | UI/API/SQL/reload e XLSX baixas | Vencimento05/11 preservado; receita por liquidação em outubro; prazo ontem/hoje/amanhã em SP/UTC/+14 |
| C1/C2 G: resposta perdida | E01 e intenção de pagamento200 | Enviar request real; conferir commit SQL antes de abortar resposta; recuperar mesma identidade, replay mesmo corpo | Contas1100/dívida150/principal150/disponível850/P1451/livre750; 1 débito/1 recibo | Barreira SQL via harness, UI desconhecido/recuperação, API original/replay, SQL/reload | Requests, tentativas, GET e replays contados separadamente; nunca nova chave; payload/instante/recibo idênticos |
| C3 H: dois usuários | A1000/B2300, contextos independentes | Uso intercalado de receita/despesa; A tenta ler/mutar/vincular IDs B; ambos relêem/exportam | A1010/B2280; tentativas404 sem efeito; recibos de B inacessíveis | UI/API, barreira entre comandos, SQL e arquivos | Nenhum filtro apenas no browser; sem sleeps para presumir concorrência |
| C4 I: sensibilidade | Cópia isolada de runtime e artefatos sintéticos | Duplicar efeito, retirar owner de leitura, alterar valor exportado, perder persistência, deslocar civil | Mesmas assertions de A–H devem falhar pelo invariante, sem erro de ambiente | Logs por mutação, patch/hash antes/depois/restauração | Só cópia isolada; controles depois; sobreposição não somada |
| C2 E2/K/L: consumidores adversariais | Owners exclusivos; fonte legada incerta; E01 original sem ticker | Nova meta/destinação0.01, consulta limite, identificação das posições sem identificador | E2:400 e zero alocações; K:principal344/disponível656 nas duas superfícies; L:nomes permanecem visíveis e distintos | UI/API/SQL e regressões vermelhas preservadas | B usa a variante com identificador opcional CF032STOCK para continuar operações independentes; L conserva o E01 original e a assertion que expôs o defeito, sem torná-la verde por mudar o input |
| C1/C4 J: estados amplos/incertos | Fixtures independentes por família | E16–20 e E21–35 por cenários PostgreSQL existentes + probes HTTP/Browser do legado | Agregado1999999999999.98 conhecido, livre negativo amplo; desconhecido separado de zero; fonte independente só com evidência | Provas dirigidas de dependências executadas como complemento; não rotular como novos E2E | Tabela final deve distinguir browser real de integração direta e qualquer lacuna residual |

## Ambiente, divisão e gates

Spring HTTP em porta aleatória e banco Testcontainers16 com schema exclusivo,
Flyway V1–V16 e Hibernate `validate`. Next em cópia de execução e porta exclusiva;
registro/autenticação reais; doubles somente EmailService/MarketDataService.
JVM UTC, calendário produto22/10/2026, navegador Date-only com timers/rAF/WAAPI
nativos. Credenciais usam instante real separado para evitar JWT expirado pelo
relógio de produto. Não avançar timers nem desligar animações.

Capturas após conteúdo/opacity e dois frames nativos; traces desligados porque
podem reter cookies/senhas. Metadados de rede sem headers/body de autenticação,
checkpoints financeiros sintéticos e screenshots fornecem diagnóstico seguro.

Preparação compila/builda sem realizar ações financeiras da jornada. Runtimes
novos sob `../controle-financeiro-runtimes/CF-032/<execucao>/`, mediante aprovação
de ferramenta por estarem fora dos writable roots. Arquivo histórico não é tocado.

Dependências canônicas CF021/022/023/024/026 concluídas; CF031 aceita localmente
em 9d80d2e, ancestral da base integrada. Conferidos pareceres posteriores e DEC-ONB-03.
Autorização atual permite CF032 local; zoom200% CF010/015, adoção CF017/P01/P02 e
desempenho produção não são critérios aprovados por esta execução. Sem sucessoras.

## Trade-offs de teste

Fixtures via API/SQL tornam cenários independentes e diagnosticáveis, mas somente
ações efetivamente feitas pela UI serão descritas como interação E2E. SQL de
observação do harness é somente leitura; seed legado é explícito e restrito.
Oracles centesimais literais evitam dependência da fórmula de produto. Captura de
snapshot/exports custa O(n) linhas e tamanho de arquivo; nenhum resultado implica
certificação de throughput, ausência transversal de N+1 ou capacidade de produção.
