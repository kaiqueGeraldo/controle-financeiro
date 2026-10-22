# Consumidores, integração e ocorrências históricas

parseSummary alimenta header de parsePrepared/parseReceipt. parsePrepared valida
hash da revisão; parseReceipt compara a preparação quando disponível. GET Session
COMPLETED valida recibo sem preparação anterior, justamente o caminho de RC031-01.
parseOperation valida preparação e recibo do mesmo comando. client.ts aplica esses
parsers antes de flow adotar sucesso. Review/Result apresentam o resumo recebido;
nenhum ramo recalcula um recibo adulterado para declarar sucesso.

flow.confirm mantém unknown/prepared antes do POST e só limpa ao receber recibo
válido. recover conserva preparação em erro e consulta a identidade anterior;
retry não inventa operationId. O teste recovery-remediation faz complete inválido,
GET operação inválido e POST idêntico válido. load não adota sessão malformada;
os controles HTTP/store fazem GET inválido→válido, sem comandos de escrita.
Retornos tardios, desmontagem e troca de owner seguem protegidos por geração,
active e abort; fluxo, hook e componentes não mudaram no saneamento. Os aceites
anteriores e testes correspondentes dentro138 foram preservados, sem afirmar
cobertura de todos os interleavings.

## Prova real e apresentação

12 cenários reais aprovados, sem retries; SQL12 executado após sucesso do navegador.
Nos três E01:3 contas/soma1300;16 itens aplicados;1 recibo; uma previsão pendente,
nenhuma transação paga; reservas550. O JSON SQL conta1 transaction, que é a previsão,
não um débito pago. Cenário vazio:1 carteira0/1 recibo/0 itens. Draft/visual cancelado:
1 carteira0/0 recibos/0 itens. Não confundir request de replay com segunda aplicação.

Após aplicação legítima, GET foi interceptado com valor999999 ou reserva inválida;
ambos produziram erro e ausência de sucesso/valor adulterado. Reativar a leitura
real e clicar recuperação devolveu o recibo original sem prepare/complete novo.
POST explícito de replay usou a mesma identidade e retornou o mesmo recibo; reload
conservou950. `*-remediation.json`, `sql-proof.json` e relatórios sustentam isso.

Os quatro cenários mobile estão incluídos nos12. Há scroll/interação, assertion de
visibilidade950 e duas pinturas antes da captura final. Inspeção visual de
`e2e/mobile-360-SP-valid-recovered.png` confirma R$950,00 legível no cartão
“Caixa livre gerencial”, patrimônio1451, reservas350/200 e investimentos livres301.
Não é somente presença no DOM. Capturas de rejeição preservadas, com ação de tentar
carregar; telas financeiras só retornam após recibo válido. Não certifica zoom200%.

## T01 e T02 — causa histórica inconclusiva

Lidos parecer original e `../saneamento-CF-031-RC031/SESSAO-CARREGAMENTO.md`.
As duas rodadas11/12 originais permanecem preservadas. T01 falhou no primeiro
carregamento da entrevista (desktop/+14), com captura posterior carregada. T02
falhou após relogin (tablet/UTC), mostrando sessão encerrada e falha de conexão.
Não há associação histórica suficiente entre request, duração e pintura para
identificar a causa. Não atribuir ao fuso, animação, API ou ambiente sem evidência.

Nesta rodada12/12, segurar categories reproduz loading até liberação; abortar
auth/user reproduz sessão encerrada+erro de conexão, mas GET autenticado ainda
retorna o recibo íntegro. Restaurar transporte recupera a conclusão. São estados
semelhantes provocados por injeção, não reprodução demonstrada do gatilho antigo.

A incerteza não invalida as provas dos P2: adulterações desta rodada partem de
commit legítimo, têm controles de recuperação e SQL, e não dependem de aceitar
nenhuma das assertions históricas falhadas. Nenhum defeito espontâneo de sessão
foi reproduzido agora. A cobertura12/12 atual atende o critério das jornadas,
sem transformar as duas falhas antigas em passagens verdes. Por isso T01/T02
podem permanecer registradas como não bloqueantes; o bloqueio atual é RC031-02.

Gatilhos de reabertura: loading além da assertion normal, sessão encerrada com
autenticação ainda válida, falha de relogin/retomada, ou divergência do registro
persistido. Próximo experimento discriminante: correlacionar timeline da request
pendente/falha com início/fim no BFF e Spring pelo mesmo ID sem credenciais, e
marcar settlement/pintura. Isso separa latência de endpoint/compilação/transporte
de atraso após resposta. Não aumentar timeout ou repetir até verde. As três
falhas amplas preexistentes não foram reabertas: não há nova relação demonstrada;
a suíte ampla não é declarada integralmente verde.
