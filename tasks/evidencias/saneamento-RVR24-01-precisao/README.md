# RVR24-01/P2 — precisão de execução e recuperação

Entrega do executor sobre `28e568211c1b75b6f52c57b490a24a45c0801fb6`, main, 04/10/2026. **Sem autoaprovação. RV24-01 continua em_revisao pelo critério4; CF-009 somente pelo critério2.** Mesmo achado RVR24-01; nenhum ID novo. CF-025/026/027, RVR24-02 e RV24-02 conservam seus aceites. CF-028 não executada.

## Causa e contrato

FIN-06 admite quantidade999999999999.99999999; NG-01 permite resgate integral amount1.00 com preço descritivo0E-8. O POST tinha token exato, mas JSON.parse entregava Number1e12. O validador corretamente aplicava o teto à informação já perdida. GET tinha perda anterior: JsonMapper.readTree criava DoubleNode a partir do recibo exato e emitia1.0E12. Armazenamento/DTO tipado/replay não perderam os dígitos nessa prova. BFF transporta arrayBuffer sem parsing.

[Matriz de campos, limites, alternativas e consumidores](CONTRATO.md). Snapshot não é posição atual. FIN-06: dinheiro máximo999999999999.99 inclusivo/escala2; quantidade/preço informado12+8; bruto HALF_UP uma vez, taxas separadas; NG-01 amount autoritativo, preço derivado descritivo. Nenhum epsilon, clamp, teto maior ou reconstrução de dígitos.

## Correção

- Cliente: parser lossless-json4.3.0 fixado, apenas no POST/retry de investimento e GET de sua intenção. Seis campos preservam token em LosslessNumber; validação converte diretamente a BigInt. Igualdade de quantidade/preço/taxa não passa por Number. Strings JSON financeiras indevidas e objetos forjados continuam rejeitados.
- Backend: ObjectReader local com USE_BIG_DECIMAL_FOR_FLOATS ao recuperar recibo. Mesmo formato HTTP numérico; mapper global e DTOs não mudam. Recibos existentes exatos são lidos sem regravação.
- operationId, command/payload, fingerprints, ownership, transação, locks, schema e snapshots sem mudança. Nada de reenviar com outra identidade. Incompatível mantém unknown, não prova ausência de commit.
- Consumidores atingidos: investmentService.operation → useCreationIntent → validateCreationResult; recoverCreation → mesmo validador. OperationModal usa outcome, não calcula/apresenta campos do snapshot. Histórico/posição/telas de avaliação conservam seus endpoints e tipos. Testes HTTP/BFF confirmam que APIs restantes mantêm representação.

Dependência pequena sem novas transitivas, custo linear de parsing do corpo, mais lento que JSON.parse. Evita mudar DTO compartilhado com histórico ou implementar parser próprio. Não acrescenta consultas, locks ou recomputação financeira. Comandos v1 pendentes continuam sendo lidos sem alterar UUID/payload; números legados são comparados ao decimal efetivamente serializado. Não há recuperação possível de dígitos perdidos antes da intenção histórica.

## Antes/depois executado agora

Todos os logs abaixo são desta execução; evidências anteriores referenciadas continuam históricas.

| Prova | Antes | Depois |
|---|---|---|
| Seis probes independentes +controle |6falhas/1passa, probes-before.log |5falhas corrigidas; 6passam/1falha, probes-after-original.log; ressalva abaixo|
| NG-01 integrado original, mesma spec |before-authorized: GET1.0E12, modal e intenção pendentes, um efeito/saldo1001 |after-original: browser1/1, GET exato e intenção removida|
| Regressões151 +adaptado7 +novos20 |151 constavam do parecer; reexecutados aqui |178/178, components-final.log|
| HTTP/BFF/lifecycle adicionais |sem nova alegação histórica |46/46, http-regressions.log; BFF ganhou2 casos exatos e passou8/8 em bff-decimal.log:226 testes únicos no conjunto|
| Recibos PostgreSQL |novo caso direcionado ao recibo exato |5/5 em buy-regression, inclui4anteriores e1novo|
| Concorrência/rollback/owner/replay CF-024 |aceite histórico preservado |30/30 em after-recovery|
| NG-01 unknown/replay/GET inválido/reload/GET válido |novo cenário |browser1/1, after-recovery|
| BUY200 +POST/GET acima do teto |aceite histórico preservado |browser1/1, buy-regression, SQL saldo800/efeitoúnico|
| lint/typecheck/build |não usar histórico como gate atual |lint0/0 e typecheck0 (static-final.json); build0|

### Probe que não pode passar sem violar FIN-06

Arquivo original **intacto**, SHA256 `DFDBD8D15D1B7A4FC3711799E78FDF6D1030C6444536CDE90AFF1AE4D1BF4C1A`, preservado aqui como json-precision.original.test.tsx e na revisão28e5682. Os mesmos sete testes foram executados antes/depois, sem filtros/skips.

Seu primeiro teste chama JSON.parse diretamente, confirma quantity===1000000000000 e exige que validateCreationResult aceite. Após essa conversão não há como distinguir o máximo legítimo de uma quantidade realmente proibida. A regra não foi afrouxada: ele continua vermelho por construção. Não alegamos seis vermelhos originais verdes.

precision-boundary.test.tsx preserva payloads/expecteds dos cinco probes de transporte e o controle. Apenas o primeiro foi adaptado explicitamente: objeto perdido deve ser rejeitado; mesmo JSON bruto via parser produtivo deve ser aceito. Não houve alteração silenciosa do original nem informação inventada. O revisor deve avaliar esta substituição de fronteira, que conserva o requisito de aceitar a resposta legítima e acrescenta rejeição da já inválida.

Provas anteriores200→999 e teto preservadas byte a byte (hashes em hashes.json). A nova cobertura usa JSON textual, incluindo último incremento1e-8, máximo exato, excedente, centavos abaixo/no/acima, expoentes reais BigDecimal, fees com dígito adicional, HALF_UP1.005→1.01, preço descritivo alto/zero, null/negativo, JSONmalformado, objeto forjado, UUID/payload/storage e recuperação após remount.

### Ocorrências intermediárias preservadas

1. before: Maven restrito parou no acesso ao JAR do cache durante compilação; não executou teste. before-authorized executou e reproduziu a falha real. Sem retry/sleep/timeout alterado.
2. components-first:156passam/2falham. Além do probe impossível, aceitar strings JSON indevidas foi identificado pela regressão antiga; implementação passou a preservar instâncias LosslessNumber, rejeitando strings. Final151 preservadas.
3. after-original: jornada original passou, mas2testes Java compararam DoubleNode com DecimalNode. after-recovery:30CF024 e jornada passaram, restou1fixture Java que já perdia escala ao criar o snapshot via readTree padrão. Ajuste explícito do fixture para DTO BigDecimal tipado, mesmo literal/expecteds financeiros; comparação esperada usa nó decimal. buy-regression:5/5. Logs falhos permanecem. Nenhum produto foi modificado entre essas três jornadas; apenas fixture de teste.
4. npm install informou18 vulnerabilidades no conjunto instalado; não se executou audit fix nem se atribuiu causalidade à dependência nova. Lockfile adiciona apenas lossless-json4.3.0. A execução não é auditoria de dependências.

## Integração e fronteiras

PostgreSQL16 descartável/Testcontainers/Flyway, JDK21, Chromium headless Playwright, São Paulo1440×900. Scripts geram cópias backend isoladas em TEMP; evidências permanecem aqui. Doubles somente email/mercado; dinheiro persistido real. A jornada original não adultera resposta.

| Fronteira | Antes observado | Depois observado |
|---|---|---|
| invest_transactions.quantity |numeric(20,8):999999999999.99999999 |igual, raw_operations SQL|
| result_json persistido |token999999999999.99999999 |igual, raw_receipts SQL; teste recibo preexistente não regrava texto/fingerprint|
| POST/replay DTO BigDecimal → HTTP/BFF |POST token exato |POST e replay byte a byte iguais, quantity exata|
| recuperação readTree → HTTP/BFF |DoubleNode, GET1.0E12 |BigDecimal/DecimalNode, GET999999999999.99999999|
| BFF → cliente |arrayBuffer sem conversão; JSON.parse perde no POST |bytes iguais; parser específico entrega LosslessNumber exato|
| validador → lifecycle |falso negativo máximo e falsos positivos por colisão |máximo confirma; token divergente não confirma; intenção só encerra após resultado válido|

Arquivos operation-raw.json/receipt-raw.json são corpos HTTP capturados, não logs de objetos JS. SQL raw_operations/raw_receipts usa ::text/->> para evitar nova perda em diagnóstico. O campo operations.quantity desserializado no relatório SQL ainda aparece1e12: **não é o oráculo**, são os campos textuais e os corpos brutos. consumer-projection.json é releitura complementar dos bytes capturados com parser/validador produtivos, não captura histórica reconstruída.

Jornada original antes: UUIDc9fe534c-86b8-4146-9d3c-63bd66759bdb,1POST/1operação/1recibo/saldo1001, pendência mantida. Depois original: consulta payload/SQL em after-original/browser.

Jornada dirigida: UUID **0fce3961-20f4-4dd4-8f20-d6bdca3b07bf**,1POST da UI +1POST explícito de replay (mesmo command),2requisições de mutação e **um efeito financeiro**. Resposta inicial válida foi capturada após commit e a entrega trocada por502 no harness. GET adulterado no harness para quantity1e12 manteve exatamente a intenção. Reload preservou UUID/payload; GET original válido removeu pendência e fechou modal. Segundo reload: posição0, saldo1001,1crédito1,1operação1,1recibo1. Checkpoints committed/afterReplay/recovered invariantes. Nenhuma operação proibida enviada ao banco.

BUY200: spec anterior intacta,1POST/1operação200/1recibo200/1débito200/saldo800; respostas adulteradas1e12 somente no harness, recuperação válida/reload. SQL em buy-regression/browser/sql-checkpoints.json.

## Limites e revalidação

Nenhuma certificação global de browsers/telas/novos clientes. Formulários legados por unidades e endpoints de posição/histórico que já usam Number não foram migrados; esta fronteira de resultado não inventa dígitos perdidos previamente em comandos. DTO HTTP mantém números, portanto qualquer consumidor externo que escolha double ainda precisa preservar os tokens; não foram inventados consumidores externos. Escopo interno examinado está na matriz.

Não houve migração real, clean, reset, push, deploy ou CF-028. Nenhuma nova ocorrência ECONNRESET/RVA-03/RJ-022-01/H24-01 observada, sem declará-las resolvidas. Deadlock/locktimeout/falha de recibo dos30CF024 são injeções esperadas dos testes, não incidentes espontâneos. Não foi necessária mutação da árvore principal nem contraprova adicional: probes e jornada antes já demonstraram causalidade.

[Encaminhamento e critérios objetivos](ENCAMINHAMENTO.md). README raiz permanece fora dos commits, SHA2566235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA. Base/staging em baseline.json; hashes originais e produto em hashes.json. Commits/intervalo serão registrados no encaminhamento após o commit funcional.
