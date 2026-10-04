# Revalidação independente do teto FIN-06 — 04/10/2026

**A. Saneamento residual não aprovado integralmente.** A ausência do teto foi corrigida: quatro contraprovas anteriores passam e a jornada BUY200 com resposta acima do teto preserva intenção/recuperação. Porém a nova guarda rejeita um resgate legítimo NG-01 por perda de precisão do JSON Number. A recuperação real também aproxima a quantidade persistida. Probes adicionais mostram confirmação indevida por colisão entre quantidades diferentes. Mesmo **RVR24-01/P2**: [achado e encerramento](ACHADOS.md), [decisão explícita de precisão](JSON-PRECISAO.md).

**B. RV24-01 permanece em_revisao, critério4 pendente. C. CF-009 permanece em_revisao, somente critério2 pendente.** A pendência agora é precisa: confirmar/recuperar o resultado legítimo de alta precisão e rejeitar resposta divergente, preservando identidade. Não é ausência do teto anterior nem uma investigação vaga. Demais critérios/aceites preservados, sem conclusão por associação.

## Base e preservação

Branch main, HEAD inicial e candidato `01d44d8fb306740d301ad19c02d6697d161f0b44`; base `1e9e932bafac8a5feac3e1ee81fcb1bb08a439fc`; produto/testes `c702739070fcd544537aa9df509e0ba4e3b7c19b`. Ancestralidade confirmada e nenhum avanço posterior no início. Intervalos1e9e932..c702739 e1e9e932..01d44d8 confrontados. Funcional: creationResult.ts e dois testes novos; documentação: duas tarefas e evidências. Hooks/modais/BFF/backend/schema/fingerprint sem delta funcional.

[Baseline](baseline.json): staging vazio, único delta README raiz com SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`. Preservado fora dos commits. AGENTS do usuário aplicadas, nenhum adicional encontrado na árvore/ancestrais consultados. Lidos tasks/README, EXECUCAO, POLITICA-DE-TESTES, FIN-04/06/NG-01, DEC-10, canônicos, parecer/probe1e9e932 e evidências/encaminhamento/FIXTURE atuais. Outputs históricos continuam nas suas pastas; novas execuções duráveis aqui, sem depender de target. Sem clean/reset/remoção ampla/produto alterado.

## Contrato e código

[Oráculos](ORACLES.md): teto monetário inclusivo999999999999.99, escala2; execução quantity/price informado12 inteiros/8 casas; produto exato HALF_UP a centavos antes das taxas, comparar resultado arredondado. Guardas separadas de fees, bruto+fees BUY, líquido não negativo nos demais e dinheiro conhecido do snapshot; não calcular patrimônio, custo histórico ou cotação. amount canônico é autoritativo, sem multiplicação por preço derivado. NG-01 permite preço descritivo zero/grande e histórico null.

BigInt compara centavos/unidades, sem clamp ou epsilon. amountCents usa regex ancorada com até12+2 casas, confere match integral e só depois BigInt; não há coerção Number nesse ramo. boundedUnits reutiliza mesma guarda para POST/retry/GET. HALF_UP e inclusividade dos valores monetários representáveis estão corretos nos testes. Não faltou definição normativa indispensável.

Complexidade limitada: coeficientes contratuais até20 dígitos e produto até40; multiplicação não é universalmente O(n), mas tamanhos são delimitados. Mesmo Number inválido finito tem mantissa/expoente limitados, potências nesta conversão da ordem máxima322, sem inteiro arbitrário vindo de string externa. amount textual tem regex de repetições limitadas, sem quantificadores explosivos; forma inválida rejeitada antes do BigInt. Nenhum I/O/query/N+1/lock novo. O limite de runtime não preserva algarismos já perdidos no parsing; o impacto foi demonstrado, não presumido.

Trade-off: validar o snapshot comum é apropriado; verificar apenas seu Number aproximado não satisfaz toda a faixa contratada. O próximo ajuste deve preservar os campos exatos nessa fronteira e no GET, mantendo guardas e contratos; não requer reorganização de domínios nem migração geral de dinheiro por hipótese.

## Resultados novos

| Prova | Resultado | Evidência |
|---|---|---|
| Arquivo original na base1e9e932 isolada | 4 falhas causais/21 positivos | original-red.log |
| Mesmo arquivo após restauração candidata | 25/25 | original-restored.log, components-result.json |
| Nove arquivos pertinentes (inclui originais/lifecycle/200→999) | 151/151 | components.log |
| JSON bruto candidato | 6 falhas/1 controle positivo | json-precision.log |
| Mesmo JSON bruto com validador antigo isolado | 3 falhas/4 positivos | json-before.log |
| Centavos válidos, amostragem bruta | 10069 casos,0 divergências a2 casas | json-roundtrip.json |
| Lint/typecheck/build | 251 arquivos lint0/0, exits0 | static-results.json e logs |
| BUY200 real com POST/GET adulterados1e12 | 1 runner/1 jornada aprovados | integration/ |
| NG-01 real, primeira captura | 1 jornada/runner reprovados no recibo arredondado | precision-integration/ |
| NG-01 com coleta posterior de SQL/estado | 1 jornada/runner reprovados; mesmo expected mantido | precision-observations/ |

Contagens sobrepostas: não somar originais ao151 nem apresentar151 como gate integral aprovado. Os seis vermelhos de precisão permanecem, separados dos gates estáticos verdes. A segunda execução NG-01 não é retry para ocultar a primeira: a assertion do recibo passou de hard para soft, com o **mesmo expected e reprovação obrigatória**, para coletar também pendência/SQL; a primeira evidência permanece intacta. Sem skips, aumento de timeout/sleeps ou alteração de resultados esperados. A captura auxiliar não comprova visualmente o modal; DOM, storage e SQL sustentam a observação.

Original/cópia integrada/cópia executada: SHA256 `7b293c5a328231d950b456e95a847273e66439b22588f55026f8d1d5608bd255`, cobrindo quatro provas e21 controles. Reintroduzido somente creationResult.ts antigo em TEMP, depois restauração exata do candidato (`b868202035e321e508c55180adcbbdb3b6095a587979aefff347fb53ccc1de13`). Os logs históricos do executor4/21→25 foram conferidos como históricos. A prova de JSON identifica a regressão: quatro casos legítimos passam na base e falham no candidato; os dois de colisão já falhavam, e o controle de teto passava indevidamente na base. Não se alterou a árvore principal.

## Integração e precisão

Chromium/headless do Playwright instalado (manifest153.0.8010.12/revisão1243),1440×900, São Paulo. BFF Next→Spring→PostgreSQL16/Flyway descartável; doubles apenas email/mercado. Uma jornada não certifica todos os browsers/modalidades. [Scripts e comandos](EXECUCOES.md).

BUY200: [três checkpoints SQL](integration/browser/sql-checkpoints.json) conservam um POST, uma operação200, recibo `93fc095a-2d09-43ab-81b1-08194f1f6666`/200, débito200, saldo800; GET legítimo posterior fecha pendência e reload conserva posição12. route.fetch observa resposta legítima antes de adulterar apenas entrega para1e12; GET também adulterado, sem operação proibida no banco. Esse cenário testa recuperação, mas excesso também viola coerência200→1e12; contraprovas isolam o teto.

NG-01: abertura por strings com quantity999999999999.99999999, custo/valor1.00; resgate real pela UI amount1.00. **Nenhuma resposta adulterada.** [Estado SQL](precision-observations/browser/precision-state.json) registra um POST, conta1001, operação/recibo1, ambos com quantidade textual exata, posição final0 no persisted.txt. POST bruto mantém quantidade exata, JSON.parse entrega1e12; GET bruto já entrega1.0E12, embora JSON persistido seja exato. Intenção permanece após recuperação, DOM ainda contém o modal. O runner Java reprova pelo cenário browser e conserva persistência coletada; não alegar que seus asserts finais após essa falha foram executados.

Não houve duplicação de dinheiro nem divulgação de outro owner. UUID do comando/recibo/pendência é o mesmo; GETs não são novas mutações. [Payloads, primeira perda e decisões](JSON-PRECISAO.md) distinguem falso negativo real e falso positivo induzido. Dinheiro válido a2 casas não apresentou perda de centavo; quantidades válidas a8 casas causaram impacto. Não se usou escala monetária malformada para justificar veto.

## Decisões por critério e próximo passo

| Item | Decisão |
|---|---|
| Ausência de teto FIN-06 relatada em1e9e932 | Corrigida e revalidada nos quatro originais. Aceite restrito desse comportamento. |
| RVR24-01/saneamento completo | Não aprovado: regressão NG-01 e integridade de quantidade/recibo não satisfeitas no domínio válido. |
| RV24-01/4 | Pendente: precisa confirmar/recuperar o resgate legítimo e não confirmar quantidade divergente; seis probes e jornada NG-01 definem encerramento. |
| RV24-01/1/2/3/5/6 | Aceites preservados; contraprovas, SQL800, regressões lifecycle/owner/identidade corroboram, sem nova auditoria integral. |
| CF-009/2 | Pendente pelos efeitos concretos de resultado incompatível/recuperação; não pela falta de teto já reparada. |
| CF-009/1/3/4 | Seleção/rollback, isolamento/dupla chamada e evidências mantêm aceites acumulados; async-state e testes atuais passam. |

RV24-01/CF-009 permanecem em_revisao com rastreabilidade nova, sem mover/retirar critérios. RVR24-02/RV24-02 e CF-025/026/027 preservam seus escopos aprovados; nenhuma regressão de lifecycle/exclusão foi encontrada. A precisão do GET é evidência nova na fronteira do resíduo, não atribuição automática à introdução da CF-027 ou convite à auditoria global. H-RV24-01/ECONNRESET, RVA-03 e RJ-022-01/H24-01 não reapareceram e não foram encerrados.

Próximo passo somente: preservar precisão de quantity/price do snapshot e recuperação nos caminhos afetados, manter teto/HALF_UP/amount/NG-01, revalidar os probes e as duas jornadas. Não aumentar teto, clamp ou epsilon. CF-028 continua apenas com a liberação anterior de especificação; não foi executada. Sem push, deploy, banco real ou autorização de publicação.
