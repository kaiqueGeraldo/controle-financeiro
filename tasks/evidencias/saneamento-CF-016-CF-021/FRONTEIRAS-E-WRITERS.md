# Inventário de writers, fronteiras e custo

Escopo RVI-01/03/09 e H-01; levantamento final sobre o saneamento local.
Regra monetária: centavos sem truncamento, até 12 inteiros; quantidade/preço
informados até oito casas e 12 inteiros. Produto arredonda uma vez HALF_UP;
saldo resultante e escrita agregada são verificados antes do commit.

| Writer | Fonte / capacidade / arquivo | Fronteira e resultado |
|---|---|---|
| Conta criada; carteira automática | Fonte nova com declaração datada; não inventa renda | DTO Digits + domínio; carteira nova SYSTEM_INITIALIZED zero; legado permanece desconhecido |
| Receita/despesa direta realizada | Conta sob lock; ativo obrigatório; CHECKING pode registrar déficit real, CASH não | money/resultado em Account.credit/debit; previsão não afeta caixa |
| Transferência e realização de previsão | Contas em ordem UUID; principal + taxa usam saldo livre após reservas; pernas e taxa atômicas | dinheiro e saldo resultante; novo realize identifica intenção, preserva previsão |
| Baixa parcial/total e PUT legado | Conta → ledger, original preservado e restante calculado | Settle amount string canônica, sem expoente; legacy PUT delega ao mesmo caso de uso |
| Exclusão/estorno direto parcial | Conta → ledger; ativo; restante elegível e ownership | Reverse amount string, chave + fingerprint; estorno herda caixa/origem |
| Pagamento de cartão e listener bancário | Conta sob lock antes do cartão; ativo; débito bancário confirmado permite déficit CHECKING | valor/resultado bancário; retry exato recebe recibo antes de avaliar estado pago |
| Compra, posição inicial e reembolso cartão | Cartão sob lock; não há conta bancária movimentada | operação, dívida inicial/soma da dívida e crédito do cartão limitados; resto da parcela vai na última |
| Destinação/deposit monetário | Fonte sob lock; conta ativa para aumento; capacidade livre, ownership e total da meta | Set/Move novos usam string; deposit legado aceita decimal transportado e valida domínio; total fora da faixa rejeitado |
| Liberação/remoção/movimento de destinação | Liberação não é débito/crédito; permite liberar fonte arquivada; destino de aumento ativo | quantia validada, sem fabricar transferência bancária |
| Checklist e reembolso bancário | Compra bloqueia fonte antes de alterar meta; fato persistente independe da intenção; reembolso conta → ledger | preço informado, alvo somado e ajuste do alvo sem truncamento; retry sem efeito |
| BUY/SELL/monetário/provento | Conta → investimento, ativo inclusive líquido zero; BUY usa livre; custo/quantidade/avaliação separados | produto, taxas, quantidade, custo e saldo; resgate amount novo string; legado quantity/price mantém compatibilidade validada |
| Avaliação por total/preço | Não movimenta banco; data, origem e motivo auditados | total proporcional autoritativo NG-01; preço derivado não recompõe valor; encerramento zero conhecido |
| Compensação/substituição de investimento | Conta → investimento; chave/fingerprint; replay da cadeia, fato original imutável | returnedFees/replacement fields strings; quantidades/custos válidos em cada etapa; revisões de vendas dependentes separadas |

Contratos novos de abertura de investimento e Set/MoveAllocation usam
DecimalStringDeserializer. Comandos monetários já expostos antes do marco
mantêm o transporte legado, com validação decimal no domínio. Não converter
numeric/expoente automaticamente no BFF para contornar a fronteira nova.
Fixtures de browser serializam explicitamente os novos campos de abertura.
C06 prova recusa de numeric 1e2, string 1e2 e dinheiro 1.005 sem escrita;
100.00 de reserva e custo 1.00 canônicos passam. RV09/RV10/C05 permanecem.

Posições de contas usam soma BigDecimal e string exata; ultrapassar o limite
sinaliza indisponibilidade. Relatórios expõem `coverage` e `observed` separados;
dinheiro observado em string com duas casas. Totais completos nulos por
ausência/cobertura parcial/custo desconhecido/faixa não viram zero na UI/XLSX.
Soma frontend de posições usa centavos BigInt e aplica teto antes de Number;
subtotal fora de faixa fica nulo. Sem clamp nem epsilon.

## Custos e decisões

- Capacidade é consultada sob lock da fonte: outras contas continuam concorrentes;
  uma fonte disputada serializa writers e pode aumentar latência. Lock estável
  substitui o ciclo H-01; a espera do arquivamento foi demonstrada com PIDs distintos.
- Checklist: duas consultas em lote, O(metas + itens); ownership no predicado.
- Cobertura: dois agregados SQL por escopo, incluindo arquivo, sem consulta por
  linha/ativo/ponto. O(fontes + fatos do período); gráfico deriva metadados dos
  pontos em memória. Base coletiva conservadora usa a mais recente das fontes;
  uma fonte legada desconhecida impede declarar total completo. Subtotais
  observados continuam utilizáveis. Não presume existência anterior à declaração.
- Comparativo exige dois períodos completos; não compara ano corrente parcial
  com ano anterior inteiro. Base zero deixa crescimento percentual indisponível.
- Compensação reproduz O(operações do ativo); faz escrita das revisões afetadas.
  Histórico longo e disputa no mesmo ativo merecem medição na CF-025, sem
  substituir o replay por preço médio arredondado.
- XLSX usa uma transação read-only REPEATABLE_READ: resumo, cobertura e páginas
  compartilham snapshot. H-02 provou writer independente entre páginas e export
  seguinte enxerga o commit. Mantém conexão/MVCC durante geração; SXSSF 100 linhas,
  páginas 500 e arquivo final em memória O(tamanho do arquivo). CF-025 permanece
  responsável por medir volumes, plano/indexes e limites de duração/bytes.
- Serviços continuam cruzando domínios para garantir atomicidade. CF-027 pode
  extrair política de fonte e comandos após esta revisão; reorganização cosmética
  e divisão em microsserviços não resolvem estas invariantes.

Não certifica CF-023/024/025/027/032, adoção real CF-017 ou zoom nativo CF-015.

Fechamento do inventário: resumos de cartões/dashboard usam o mesmo agregador
em centavos, com faixa e ausência explícitas; sort usa cópia, sem mutar o estado
compartilhado de cartões. Agregador rejeita entrada com terceira casa em vez de
arredondá-la silenciosamente. Extrato recente apresenta caixa líquido e bruto
separado; SAN-E27 acrescenta conferência real de +9/bruto10 no dashboard.
Transferência legada de direção desconhecida é excluída do subtotal direcional,
sem adivinhar saída; coverage UNKNOWN_ORIGIN identifica a parcela desconhecida.
