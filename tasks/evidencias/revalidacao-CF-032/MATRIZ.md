# Matriz independente

Base `f521523` → candidato `864a3c7`; provas originais conservadas por SHA256 em
`proof-hashes.json`. Não se confundem correção do observador, contraprova e novo caso.

| Achado/regra | Prova original | Causa e arquivos/consumidores alterados | Resultado/controle positivo |
|---|---|---|---|
| CF032-01/P2 — SPEC-001 §5.1, FIN-05 | E2:400 esperado,204 recebido e reserva0,01 persistida | GoalService e InvestmentService passam por SourceReservationService; OnboardingProjection incorpora pendências/provas por fonte; exclusividade antes da leitura/gravação | E2 rejeita sem efeitos; R1 mantém reserva conhecida e débito real;20 DailyReservationCapacityTest cobrem fontes conta/investimento, exato+centavo, exclusões, múltiplas pendências, redução/zero, movimento e replay |
| Complemento CLOSE/ASSIGN | closed-capacity-before-02: CLOSE efetivo ainda deixava capacidade desconhecida | OnboardingOpenings certifica inventário após gravações/flush, só para novas declarações | Controles de CLOSE/ASSIGN imediatos; cinco probes independentes; mutação sem binding detectada nos dois comandos; histórico/rollback verificados |
| CF032-02/P2 — FIN-03 | K:656 esperado,950 apresentado; R2 repete após sessão | useCards, CardsSummary, CardsScreen, CreditCardItem, cardService e cardLimitMetrics consomem availableLimit/committedLimit | K/S2:656; S5:850 antes/depois reload; barra15%; RV6 cobre nova sessão paga; componentes incluem missing/null/NaN/fração/zero/limite excedido/loading/privacidade/erro e consumidores assíncronos |
| CF032-03/P2 — identificação permitida por SPEC-001; UUID operacional | L não encontra Ação sintética; R2 demonstra dois IDs distintos, não ativo errado | investmentLabel, InvestmentItem/Details/OperationModal, Modal compartilhado; Investment.displayName e descrições de operações; ticker nullable | L/S2/S3 e componentes: duas sem ticker, uma com ticker, texto longo, detalhe/modal/nome acessível; BUY e histórico pelo UUID correto, reload mantém nomes |
| CF032-04/P3 — SPEC-002 saída canônica e AC-UI-005/011 | C/R3:API/SQL12:34:56, arquivo12:34 | TransactionService usa formatter HH:mm:ss; arquivo continua textual | C/R3/S4, POI+OOXML:56 segundos,00 e ausência“—”; mesma data civil; controle financeiro/isolamento/cobertura preservados |

Não há fórmula alternativa de disponibilidade na UI alterada: resumo agrega os
campos autoritativos; cartão os apresenta; barra calcula apenas a proporção do
principal comprometido. Campo incompleto é indisponível, sem fallback à fatura.
Histórico/seleção/operação de investimento continuam por UUID; label só apresenta.

## Critérios completos

| Critério | Evidência de atendimento e alcance |
|---|---|
| 1 — BFF/Spring/PostgreSQL reais | Sustentado anteriormente e preservado. Harness em banco descartável; apenas email/cotação externos substituídos. Nenhuma regressão concreta encontrada |
| 2 — reload/sessão e relatório/exportação conciliados | B/C: oito checkpoints recalculados; B final=nova sessão; K/S2/S5/RV6 para cartão; L/S3 identidade; seis arquivos lidos, cinco variantes diretamente pertinentes; origem/UNKNOWN/PARTIAL preservados |
| 3 — dois usuários e falhas mantêm invariantes | H intercalado A/B com404 e sem efeito cruzado, XLSX sem outro usuário; G resposta perdida após commit e replay único; E2 sem persistência; backend replay de investimento após nova pendência recupera resultado e nova operação rejeita; concorrência/rollback da certificação |
| 4 — provas e limites sem enfraquecimento | Sustentado anteriormente e preservado. Oito arquivos originais intactos; falhas intermediárias registradas; sem retries/timeouts relaxados; mutações e seus escopos separados |

Lacunas de alcance, não falhas ocultas: token comparado nos probes pelo serializer
do protocolo (não implementação independente do hash); esperados financeiros e
rollback literais; nenhum teste de carga/produção ou ausência universal de corridas.
R2 original é caracterização que procura nomes vazios, incompatível com a correção;
permanece vermelho e intacto. S2 exige os nomes legítimos sem mudar656 nem os dois
UUIDs; K/L/R3/E2, as reproduções normativas originais, passam sem alteração.
