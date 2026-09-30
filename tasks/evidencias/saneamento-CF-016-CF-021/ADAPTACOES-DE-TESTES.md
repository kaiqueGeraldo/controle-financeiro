# Adaptações normativas sem trocar os valores esperados

As evidências vermelhas em revisao-CF-018-CF-021 e as primeiras rodadas deste
diretório permanecem. Valores não foram recomputados por query de produção.

| Testes | Norma / adaptação | Oráculos mantidos |
|---|---|---|
| Cf021ReportingIntegrationTest; RV08/C05; MilestoneCashPresentationTest | FIN-08 separa observado de total completo: asserts aritméticos consultam observed e coluna C; contexto HTTP também exige UNKNOWN_ORIGIN e entries null | 12.34, 100/40/60, caixa -160, estornos ±200, ganho 18.20, cartão 140/100, máximo 999999999999.99 |
| MilestoneExportSnapshotTest | H-02 ainda compara os mesmos totais, agora subtotal observado decimal exato; resumo completo pode ser indisponível | 501, 511, 501 linhas únicas, nenhuma duplicação nem escrita posterior no primeiro arquivo |
| MilestoneReportingPositionTest | Export adiciona aba Cobertura, sem inserir cartão no filtro TRANSFER | cartão excluído; consumo zero observado; pernas 200 preservadas |
| SAN-E27/SAN-E2 | Período janeiro parcialmente coberto exige totals null; mesmo valor financeiro em observed | caixa 9/0/9, conta1009, transferência0/0/0 no consolidado, posição2000 |
| goals-investments-habits-annual-audit | DEC-04 posição atual em qualquer ano com data própria | 1300 permanece visível; texto proíbe tratá-lo como fechamento de 2025/2026 |
| CF015 recovery component/browser | FIN-07 GET de recibo novo confirma commit após resposta perdida; 404 conserva intenção e permite retry exato | POST único, conta900/dívida0/planoPAID/reload; botão novo envio bloqueado enquanto desconhecido |
| CF015 visual | FIN-01 abertura não é receita nem linha de ledger; fixture acrescenta receita explícita no mês controlado do backend, preservando abertura e geometria | 123456789.12 e mesmas assertions geométricas; não equivale a zoom nativo200% |
| InvestmentServiceTemporalTest; TransactionServiceTemporalTest | Mocks acompanham contrato repository.save e finder com lock | datas07/09/2026 e horas09:15/23:30:45 intactas |
| Empty/Legacy/Incremental migration tests | V11 aditiva: count/version cresce; contagem das dez colunas da V3 continua dez | snapshots antigos idênticos, origens null, valores e timestamps integrais; rerun zero, falha rollback e checksum permanecem |

Primeira execução global de backend: temporal browser exigiu servidor UTC mas
foi chamado no fuso local; dois mocks antigos precisavam dos contratos atuais.
Execução conjunta seguinte: schema public do Hibernate já preenchido recusou
Flyway. Harness do saneamento passou ao schema isolado migrado e verifica V11;
nenhum baseline automático foi introduzido. CF-007 tem execução própria UTC.

Lint global preserva 23 erros e 21 warnings fora dos arquivos do saneamento.
Lint dos arquivos afetados: zero erros, dois warnings preexistentes de parâmetros
nos testes de async-state. Não remover regra nem corrigir módulos alheios.

CF007 browser passou a selecionar a correção08:15 em vez de exigir descrição
única: FIN-07 mantém fato original23:30 e correção08:15. As datas30/01 e29/01
continuam esperadas; XLSX exige ambas, sem trocar a data pela observada.
Capturas CF015 desta revalidação têm diretório novo pelo harness; evidências
históricas CF015 permanecem sem diff. A segunda rodada atravessou suspensão
da máquina (Hikari clock leap5h42 e timeout de autenticação); isso não é
reprodução causal financeira. Os dois erros visuais restantes vieram da
fixture fora do mês controlado que o endpoint de recentes usa por padrão.
Registro vermelho integral preservado em temporal-segundo.log.

Terceira rodada temporal: 18 jornadas de navegador passaram; pós-condição Java
antiga exigia plan_items.amount100 após quitação, contradizendo o contrato já
presente em 4e685ce/Cf019CardIntegrationTest: plannedAmount após quitação é0
(saldo ainda devido), enquanto card_payments guarda o pagamento100. Ajustada a
mesma assertion para exigir simultaneamente planoPAID/restante0 e pagamento100
persistido vinculado à mesma fatura. Banco900, débito100 único, dívida0 e todos
os cenários R03 permanecem; browser acrescenta restante0. O valor100 não foi
alterado para0 nem descartado: cada quantidade é conferida no fato que representa.
Falha anterior preservada em temporal-terceiro.log. Não alterou listener ou regra
de planejamento para acomodar um probe temporal de contrato anterior à CF-019.

Novo caso de direção legada: primeira fixture tentava remover direção de uma
linha ainda marcada TRANSFER canônica; a constraint V3 rejeitou corretamente.
Fixture passa a representar legado UNKNOWN, mantendo a mesma quantia10 e
esperados independentes (observado conhecido100/saída0; total completo ausente).
Não alterou constraint/migração, não removeu assertion e não é vermelho causal
financeiro. A execução integral anterior permanece registrada.
