# RVR24-01 — P2 — precisão do snapshot ainda impede aceite residual

Mesmo identificador/responsável RV24-01. A ausência do teto monetário foi corrigida; novas provas mostram que o saneamento completo não preserva todas as respostas legítimas/compatíveis no domínio contratado. Não se reabre RVR24-02 ou RV24-02.

**Locais:** `controle-financeiro-frontend/src/services/creationResult.ts:70` (nova rejeição da quantidade convertida), `:75–76` (igualdade/produto após perda); primeira desserialização do POST em `src/services/api.ts:100`; GET de recibo em `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/intent/internal/PostgresFinancialIntents.java:54`.

**Reprodução/esperado/observado:** [análise com payloads brutos](JSON-PRECISAO.md), [probe](json-precision.test.tsx), [log candidato](json-precision.log), [base isolada](json-before.log).

1. NG-01 legítimo: abrir quantity999999999999.99999999/valor1/custo1, resgatar amount1.00. POST bruto exato vira quantity1e12 em JSON.parse; candidato rejeita. Esperado confirmed e descarte da pendência por resultado legítimo; observado unknown e storage/pending preservados em POST/retry/GET. Quatro testes falham; na base anterior esses quatro passam.
2. Recuperação real: banco/recibo persistido têm quantity exata, mas GET emite1.0E12. Esperado mesmo snapshot; observado valor aproximado. [SQL e estado](precision-observations/browser/precision-state.json), corpos brutos na mesma pasta. Sem adulteração do harness nessa jornada; cliente não consegue encerrar pendência mesmo após commit válido. Esse caminho backend não foi modificado pelo saneamento candidato.
3. Incompatibilidade induzida: quantity de resposta999999999999.00010001 difere do comando999999999999.0001, ambos válidos em FIN-06, mas viram o mesmo Number. Esperado unknown; observado confirmed e intenção removida em POST/GET. Duas falhas, também existentes na base; não foi observado esse corpo incompatível emitido pelo backend real.

**Contrato violado:** FIN-06 admite as quantidades usadas; FIN-04/NG-01 permitem o resgate de montante autoritativo; DEC-10 requer resultado original do recibo. RV24-01/4 exige ausência de falso sucesso e recuperação explícita; CF-009/2 inclui retry/recuperação funcionando sem callback indevido. Quantidade da posição não é patrimônio agregado e não pode ser silenciosamente arredondada para decidir a faixa.

**Impacto:** pendência legítima não encerrável pelo cliente após efeito confirmado; corpo diferente pode ser confirmado por colisão de Number. Uma operação/recibo e saldo1001 foram comprovados, sem duplicação financeira. P2 pela borda de alta precisão e por falso positivo induzido, sem perda monetária comprovada. A guarda do teto funciona nos casos ordinários; não declarar o reparo anterior inexistente.

**Encerramento:** preservar precisão e semântica do snapshot nos endpoints afetados antes da comparação, inclusive GET do recibo. Fazer passar os seis vermelhos novos com os mesmos payloads/expecteds, as25 provas anteriores e as151 regressões; resgate máximo válido deve concluir e recuperar sem outro POST/efeito, resposta com quantidade divergente não deve remover intenção. Manter teto999999999999.99 inclusivo, HALF_UP, taxas, amount textual/NG-01 e lifecycle. Não aceitar correção que amplie teto, trunque/clamp, use epsilon ou descarte o caso válido.

## Hipóteses, lacunas e aceites

Não há lacuna impeditiva para reproduzir este achado: componente, JSON bruto e banco real descartável convergem. Não houve nova ocorrência ECONNRESET/RVA-03/RJ-022-01/H24-01 nem encerramento dessas investigações. Não se certificam todas as modalidades/browsers, nem se imputa uma regressão à extração CF-027 sem análise de introdução. Aceites anteriores permanecem nos seus escopos; este achado exige saneamento dirigido de resultado/recuperação, não auditoria global.
