# CF-032 — reconciliação e cobertura observadas

Matriz final `run-10-utc`: **13 cenários distintos, 9 passaram/4 falharam**.
Falhas C/E2/K/L associadas aos [achados](ACHADOS.md), sem expectedFailure, skip,
retry ou correção de produto. Run-08 executou os mesmos 13 em JVM São Paulo,
também 9/13; não somar essas execuções. O delta de K para aguardar assertions foi
revalidado sozinho no run-09 e está incluído na matriz UTC.

| Cenário | Alcance efetivamente executado | Resultado |
|---|---|---|
| A | Cadastro/login UI reais, contexto digitado/save/reload, E01 por PUT real, revisão/confirmar UI, recibo/reload/API/SQL | Passou; E01 completo não foi digitado campo a campo |
| B | E01 com identificador opcional CF032STOCK declarado; receita/despesa/transferência/compra/pagamento/aporte/reserva pela UI, telas relacionadas, reload/logout/login | Passou; preserva variante original sem identificador em L |
| C | Owner independente, movimentos de caixa/compra/investimento/reserva via browser/BFF como fixture explícita; pagamento UI, relatório/anual/período, download real e POI | Totais/datas civis/estados/origens/parcelas/posição atual/cobertura conciliam; segundos exportados falham |
| E | Fixture SQL legada, complemento LINK com UI, confirmação/reload; abertura e reserva desconhecidas preservadas sem histórico financeiro fabricado | Passou |
| E2 | Mesmo estado legado em owner exclusivo; nova meta e tentativa0.01 por outro fluxo browser/BFF; SQL/captura | Falhou:204 com reserva indevida |
| F | Previsão80 baixada30 e50 pela UI em21/22 de outubro, vencimento05/11 preservado; SQL/reload e arquivo | Passou |
| G | Pagamento200 real, commit SQL antes de abortar resposta, UI desconhecido, GET de recuperação, replay idêntico, conflito de conteúdo e reload | Passou; um débito/recibo |
| H | Contextos A/B independentes; uso intercalado, mutação/vínculo/leitura/recibo alheios404, SQL e exports próprios, logout B→A | Passou |
| K | E01 original; limite principal/futuras por API/SQL versus resumo e cartão após reload | Falhou: UI950, API/oracle656 |
| L | E01 original sem identifier; API/SQL com nomes, lista e rótulos acessíveis após reload | Falhou: nomes ausentes, dois rótulos null |
| T0/T1/T2 | SP360×800, UTC768×1024, Kiritimati1440×900; hoje/ontem/amanhã, hábito marcar/desmarcar e futuro rejeitado, meta4→5→4, reload/SQL | Três passaram; relógio nativo de animação/pintura preservado |

## Checkpoints financeiros independentes

BRL; valores literais de SPEC-001 E01, FIN-01–08 e NG-01. `B-*-sql.json`,
`B-api.json` e C equivalente demonstram efeitos persistidos; `reconciliation.json`
reconfere os artefatos com inteiros em centavos, sem helpers de produto.

| Checkpoint | Contas | Investimentos | Dívida | Patrimônio | Reservas conta/invest. | Livre em contas |
|---|---:|---:|---:|---:|---:|---:|
| E01 |1300.00 |501.00 |350.00 |1451.00 |350.00/200.00 |950.00 |
| Receita250.10/despesa40.20/transferência100+taxa2 |1507.90 |501.00 |350.00 |1658.90 |350.00/200.00 |1157.90 |
| Compra120 em3×40 |1507.90 |501.00 |470.00 |1538.90 |350.00/200.00 |1157.90 |
| Pagamento200, encargos6 antes de principal194 |1307.90 |501.00 |270.00 |1538.90 |350.00/200.00 |957.90 |
| Compra2 unidades×10/taxa1 na ação E01 |1286.90 |501.67 |270.00 |1518.57 |350.00/200.00 |936.90 |
| Destinação corrente300→400 |1286.90 |501.67 |270.00 |1518.57 |450.00/200.00 |836.90 |

Final por conta: carteira 100, corrente 886.90, poupança 300. Ação: quantidade 5,
custo 21.60, avaliação 1.67 pela referência TOTAL 1/3 da abertura. Renda fixa:
MONETARY 500, quantidade não aplicável, custo/aquisição/proveniência desconhecidos.
Não somar custo/metas ao patrimônio; investimento livre 301.67 não é caixa livre.
Principal final 270/limite disponível API 730; UI conserva o defeito K, sem atribuir
aos números corretos da persistência uma aprovação de todas as telas.

Contagens finais B/C: 8 linhas bancárias (inclui previsão pendente), 7 linhas de
cartão, 2 posições, 3 metas, 3 alocações, 16 itens de aplicação, 5 recibos de criação/
onboarding/investimento e 1 pagamento no namespace próprio. Transferência é uma
operação com duas pernas e taxa; linhas/requests/intenções não foram confundidos.

G: conta total 1100, corrente 800, dívida/principal 150, disponível 850, patrimônio 1451,
reservas 550/livre 750. Uma requisição inicial UI com resposta abortada após commit,
um replay explícito idêntico e uma tentativa de conteúdo diferente rejeitada 409:
**3 POSTs, 1 intenção aceita, 1 efeito financeiro**. GET não cria novo pagamento.
operationId, corpo original, IDs/centavos e recordedAt do recibo/replay iguais.

F: contas 1300→1330→1380, dívida 350 invariável, patrimônio 1451→1481→1531;
pendente 80→50→0 e vencimento 05/11 intacto. H: A 1010/B 2280 após receitas/despesas
próprias; snapshots B antes/depois das tentativas alheias são iguais.

## Relatório e arquivos lidos

Arquivos sintéticos reais em `run-10-utc/`: C-october.xlsx, F-receivables.xlsx,
H-A.xlsx e H-B.xlsx. Cada um possui `.analysis.json` produzido por Apache POI a
partir dos bytes baixados. C expõe Extrato Financeiro, Cobertura e Consumo cartão.
Receita 250.10; consumo/encargos 162.20; resultado 87.90; caixa −13.10.
Compra 120 compõe três linhas 40, pela data 15/10; pagamento 200 e aporte 21 ficam
fora de nova despesa de consumo; transferência consolidada elimina suas pernas.

Cobertura mensal/anual é PARTIAL: abertura 09/10 não comprova início do mês/ano.
Coluna C preserva subtotal exato e coluna de total informa indisponibilidade.
Posição atual 501.67 continua datada 22/10 até ao selecionar 2025; custo total e
comparação anual permanecem indisponíveis, sem substituir ausência por zero.
O formato não contém IDs de todas as entidades nem auditoria recordedAt;
identificação foi conferida por nomes sintéticos exclusivos, IDs nas APIs e SQL.
Precisão monetária verificada nestes valores; XLSX usa células numéricas double,
sem certificação de todos os extremos de precisão. Horário com segundos não
preservado: CF032-04. Nenhum expected foi arredondado para ocultar essa diferença.
Os downloads desta matriz cobrem período e owner; o filtro por conta planejado
não recebeu nova execução CF032 e conserva somente o aceite anterior da CF-021.

## Configuração efetiva, visual e limites

Na matriz final, PostgreSQL 16 vazio/schema cf032 único, Flyway 1–16/checksums e
Hibernate validate; porta Spring 52357, Next 3142, observador loopback exclusivo.
Detalhes em environment.json, incluindo banco/schema, versões e namespace.
Inicialização do produto força JVM São Paulo; o parâmetro inicial UTC não bastou.
Harness final registra startupJvmZone=America/Sao_Paulo e altera somente a JVM de
teste após startup para **UTC efetivo**, restaurando no cleanup. Clock de produto
em São Paulo 22/10/2026 09:00Z, credenciais no instante real; navegador Date-only,
sem alterar performance/timers/rAF/WAAPI. Não declarar que runs anteriores usaram UTC.

Capturas A/B/C/E/E2/G/H/K/L e T0–T2 vêm após estado, opacity/hit test e dois frames
nativos. Inspeção visual dirigida de B nova sessão, G desconhecido, K limite,
L nomes ausentes e T0 prazo confirmou conteúdo/pintura e os achados; não é aceite
global de layout. Tema escuro/privacidade desligada nesta matriz; outros modos têm
aceites anteriores preservados, sem alegar nova cobertura cartesiana.
Sem zoom nativo 200%, comparação por screenshots não aprovados ou animação desativada.

40 controles Java complementares passaram: aplicação/recuperação/atomicidade,
reservas incertas e amplas, precisão/protocolo, concorrência com conexões/barreiras,
encargos e datas civis. São integrações diretas, não 40 novos E2E de navegador nem
prova de cada E16–E35 em todas as telas. Não há nova certificação exaustiva de todos
os universos de evidência/combinações legadas; essa limitação permanece explícita.
6 testes unitários temporais executados em 3 fusos; não contar 18 cenários distintos.
Lint src+novos testes, typecheck, build padrão Next, compilação Java e parsing de
scripts aprovados. Não foi executada suíte ampla de 441 testes de componentes nem auditoria
de desempenho/N+1 por ausência de alteração de produto que justificasse esses gates.

Revisão independente deve validar os achados, fixtures e alcance dos contratos;
não conceder aceite integral nem liberar sucessoras por este relatório.
