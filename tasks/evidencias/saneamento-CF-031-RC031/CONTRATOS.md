# Saneamento dirigido RC031-01/02 — contratos e delta

22/10/2026, base `e1f5048a0d9c2ab1c98f192ba5476328dc5113d4`, mesma branch local
`codex/cf031-onboarding-frontend`. SPEC-001 §§3–5.1/6, exemplos E01/E16–20/E35,
contrato efetivo CF030 e DEC-ONB-03. Não é aceite independente.

## RC031-01

O parser conferia patrimônio e posições, mas não somava livres por fonte para
conferir as duas métricas de disponibilidade. A comparação com a preparação da
mesma montagem protegia confirmação/replay; o recibo recuperado depois de reload
não dispõe dessa preparação. contentHash não comprova coerência das métricas.

Fronteira corrigida: `parseSummary`, chamada por header/parsePrepared,
parseReceipt, parseSession e parseOperation; alcança prepare, POST complete,
replay, GET da operação e GET da sessão. A verificação usa somente componentes
do próprio snapshot recebido, sem comparar o recibo histórico com saldos atuais.
Caixa livre soma BySource.free de ACCOUNT; investimentos não destinados somam
os livres de INVESTMENT. E01:100+700+150=950 e300+1=301. Reserva não soma ativo.

Aritmética BigInt em centavos, sem teto individual imposto ao agregado ou Number
monetário. Soma completa/vazia é KNOWN; presença de livre desconhecido com parcela
conhecida é PARTIAL; sem qualquer parcela confiável é UNKNOWN. O subtotal exato
e o estado têm de corresponder; não se inventa zero para preencher lacuna.
Livre de uma fonte somente é KNOWN se valor e reserva inteira forem conhecidos;
nesse caso deve ser a diferença exata, inclusive déficit e valores além de M.

Não somar indiscriminadamente BySource.reserved para obter reservedAccounts:
§5.1 permite nominal conhecido com origem individual incerta. Não introduzimos
esse falso invariante. Nem substituímos a resposta adulterada pelo cálculo local:
incoerência rejeita a resposta inteira e conserva a recuperação.

## RC031-02

Antes havia validação parcial duplicada: inventário lia goal.value/partes por
acesso comum e antes/depois conferia somente cabeçalho e nominal. Agora
`legacyReservation` valida o mesmo contrato em reservationReview.reservations e
reservationChanges.previous/proposed: identidade/revisão, Fact GOAL, nominal,
Attribution e estruturas aninhadas. Cada campo obrigatório exige propriedade
própria, inclusive o value da variante KNOWN e membros de cada Attribution.

CONFIRMED exige partes não vazias, fontes únicas/refs válidas, parcelas individuais
Money válidas, KNOWN>0 ou UNKNOWN/PARTIAL e reconciliação de estado/subtotal com
o nominal amplo. CANDIDATES exige fontes não vazias/únicas e evidências;
UNBOUNDED exige excluded, com referências/evidências próprias por exclusão,
sem sources substituto; CLOSED exige evidência e nominal KNOWN0, sem partes.
Null não é Fact/Attribution/ref/lista; nulabilidade de SummaryAmount é preservada.
Metadados adicionais de leitura são aceitos; não afrouxa o schema de escrita.

O parser JSON já usado por api.ts (`vendor/lossless-json/parse.js`) constrói
propriedades com Object.defineProperty, inclusive __proto__. Não foi alterado
nem criado parser paralelo: as provas distinguem dado JSON próprio de uma
propriedade herdada em memória. Não há alegação de poluição global de protótipo.
Contadores wire usam Number conforme api.ts; dinheiro continua string exata.

## Consumidores, custo e limites

Rejeição em complete/operations conserva prepared/UUID/hashes e estado incerto;
retry usa o mesmo corpo. Falha de leitura após reload não apresenta conclusão:
permite tentar carregar outra vez, sem novo prepare/complete. Erro de resposta
inválida mantém mensagem própria; não vira sucesso, conflito ou saldo zero.
Estado/HTTP/geração não foram refatorados; A→B, desmontagem, busy, cancelamento
e comparação de conflito conservam seus controles anteriores.

Para S fontes e P partes/referências de reserva, delta de conferência é O(S+P),
com Map/Set e somas exatas; não há busca de cada reserva no inventário inteiro,
HTTP por item ou novas queries. Memória transitória O(S+P); custo de BigInt também
depende dos dígitos recebidos. Mantêm-se ordenação de hashes e relações de
incerteza já materializadas, sem prometer O(N+R) quando E pode ser N×R.

Trade-off: validar na fronteira central evita divergência entre consumidores,
ao custo de rejeitar o resumo inteiro quando inválido; a UI oferece recuperação
do recibo original. O cliente confere consistência, não autoriza reservas nem
substitui locks/ownership/avaliação financeira no servidor. Não muda FIN-06,
NG-01, migrations, produto backend ou contratos aprovados.
