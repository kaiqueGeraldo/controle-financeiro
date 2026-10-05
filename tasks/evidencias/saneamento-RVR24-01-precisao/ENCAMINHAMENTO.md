# Encaminhamento ao mesmo revisor — RVR24-01/P2

Base independente: **28e568211c1b75b6f52c57b490a24a45c0801fb6**.
Commit funcional: **2d3245d6f4e44337318b5962d93da07e203b887c**.
Intervalo funcional exato: `28e568211c1b75b6f52c57b490a24a45c0801fb6..2d3245d6f4e44337318b5962d93da07e203b887c`.
Intervalo completo: essa base até o commit documental que contém este encaminhamento (`git log -1 --format=%H -- tasks/evidencias/saneamento-RVR24-01-precisao/ENCAMINHAMENTO.md` identifica o extremo de forma inequívoca). HEAD/intervalo completo também informados na entrega final.

## Escopo e arquivos

Código/testes listados em code-staging.txt (12arquivos): PostgresFinancialIntents e seu teste PostgreSQL; api/creationIntent/creationResult/investmentService; novo investmentResultJson; package/lock; precision-boundary/precision-decimals e bff-contract.
Documentação: FIN-06 explicita preservação do token, duas tarefas mantêm estados e esta pasta guarda provas. HTTP continua numérico, sem alteração de DTO/schema/fingerprint/recibo/comando. Internamente, seis campos do resultado usam LosslessNumber antes de BigInt; GET lê decimais como BigDecimal. Não regravar históricos.

## Revalidação dirigida

1. Conferir seis probes originais intactos, hashDFDBD8D15D1B7A4FC3711799E78FDF6D1030C6444536CDE90AFF1AE4D1BF4C1A: antes6falhas/1controle passa; depois5corrigidas/1original ainda falha. **Avaliar explicitamente a adaptação do primeiro probe:** ele chama JSON.parse, exige quantity1e12 e depois aceitação. Isso contradiz FIN-06 e o pedido de não afrouxar a guarda. Novo teste mantém rejeição desse objeto perdido e aceita o mesmo payload bruto pelo parser real. Demais cinco e controle com critérios/entradas intactos.
2. Conferir os três originais200→999 e quatro originais do teto, hashes preservados; 151regressões incluídas nos178componentes. Adicionais de HTTP/BFF levam a226casos únicos; novos limites com JSONbruto, NG-01/preço descritivo, fees/escala/HALF_UP, UUID/payload/remount e GETinválido→válido. BigInt não recebe decimal previamente convertido do HTTP.
3. PostgreSQL:30CF024 e5FinancialIntents aprovados nas execuções indicadas; snapshot preexistente exato recupera/replay sem regravar texto/fingerprint; owner/locks/rollback preservados. Logs intermediários de representação do fixture não foram apagados.
4. NG-01 real: before-authorized falha; after-original passa a spec original, hash336B4627A4EC9DC55391D7475A6793DF7094904329E7DCCFC2E6CCF63A65A1D7. after-recovery acrescenta perda da entrega póscommit, replay, GETadulterado e recuperação apósreload. Corpos HTTP POST/replay/GET exatos; SQLoperação/recibo têm999999999999.99999999. UUID0fce3961-20f4-4dd4-8f20-d6bdca3b07bf,2POSTs (um deles replay),1efeito/1recibo/crédito1/saldo1001/posição0/pendingvazio. consumer-projection.json verifica parser produtivo sobre esses bytes, como prova complementar identificada.
5. BUY200/saldo800,1POST/1efeito/1recibo, resposta adulterada rejeitada e GETválido encerra; lint0/0, typecheck0, build0. Navegador Chromium headless/SãoPaulo; sem matrizglobal.

## Critérios objetivos de encerramento

RV24-01/4: respostas legítimas de precisão máxima confirmam/recuperam; nenhuma quantidade divergente colide antes da decisão; teto/escala/coerência/NG-01 preservados; desconhecido retém identidade e corpo, recuperação válida encerra, SQL confirma um efeito. CF-009/2: nenhum callback/toast/fechamento indevido, retry/GET funcionam no mesmo UUID e lifecyclecontinua isolado.

**Ambas permanecem em_revisao.** O executor não aprova RVR24-01 nem conclui CF-009. Sem motivo concreto para revisão integral CF-025–027; reconferência apenas das fronteiras alteradas. RVR24-02/RV24-02 e demais aceites preservados. CF-028, push, deploy e banco real fora da execução.

Limites: comandos/posição/histórico legados fora desta fronteira não foram migrados de Number; dígitos já perdidos não podem ser inventados. Não tratar o original impossível como6/6verde nem a releitura dos corpos como captura histórica original. Evidências, comandos, ocorrências e trade-offs no README/CONTRATO/EXECUCOES.
