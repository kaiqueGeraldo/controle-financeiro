# Revalidação independente RVR24-01 — 04/10/2026

**RVR24-01 residual não aprovado integralmente.** A incoerência200→999 foi corrigida e suas três provas originais passaram; o teto monetário de FIN-06 continua ausente. Quatro novos testes demonstram aceitação de bruto1000000000000.00, acima do máximo999999999999.99, e descarte da intenção em POST/retry/GET. [Achado reproduzível e saneamento pontual](ACHADOS.md).

**RV24-01 e CF-009 permanecem em_revisao**, por critérios identificados abaixo. Nenhum código de produto corrigido. Aceites CF-025/026/027, RVR24-02 e RV24-02 preservados. CF-028 conserva somente sua liberação anterior para especificação; nenhuma implementação/publicação autorizada ou executada.

## Base, escopo e preservação

HEAD inicial e candidato completo `e069e33d45c25eb9c3edd6d46fa9645e9dc45381`, sem avanço posterior no início. Base anterior `c45bfb6fa658a7d31e11353c8fb1a667123ebf64`; funcional até `a93c52ffef82b31b7b9848932c32ba6e29cbdf95`; entrega até e069e33. Ancestralidade confirmada. Diff funcional: somente creationResult.ts e dois testes novos (financial-result-review, rv24-gross). Diff documental: duas tarefas e evidências/encaminhamento. Sem delta backend, hook, modal, schema ou fingerprint. [Baseline](baseline.json).

Staging inicial vazio; único delta README raiz, SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`, preservado fora dos commits. Instruções AGENTS do usuário aplicadas; não encontrado AGENTS adicional na árvore nem ancestrais consultados. Lidos tasks/README, EXECUCAO, POLITICA-DE-TESTES, canônicos RV24-01/CF-009, parecer/matriz/achado anterior, FIN-04/06, decisão NG-01 e DEC-10, evidências/encaminhamento atuais. Não houve clean, reset, exclusão ampla ou banco real.

## Regra e implementação

[Oráculos](ORACLES.md) derivam da SPEC-004, anterior à implementação. BUY/SELL/DIVIDEND/INTEREST por unidades: quantidade×preço exatos, HALF_UP a centavos uma vez, depois taxa monetária. Bruto, líquido, custo e avaliação são distintos: compra capitaliza taxa; venda/provento descontam taxa; taxa igual ao bruto mantém bruto positivo/líquido zero. Custo histórico null não deve ser inventado.

SELL monetário: amount autoritativo; quantidade/preço derivados não recompõem o bruto. NG-01 define referência TOTAL proporcional e permite preço descritivo arredondado/zero ou acima do teto do preço informado. Avaliação PRICE é outro contrato. UPDATE_BALANCE fica fora da criação identificada. Snapshot do recibo é imutável e não depende da posição atual. Não faltou definição normativa indispensável.

O código utiliza representação decimal do Number legado e BigInt, sem multiplicação binária/epsilon. A conversão exige representabilidade em oito casas para os operandos e duas para bruto. Fórmula de arredondamento é correta para valores positivos; HALF_UP e taxa separada foram exercitados nos quatro tipos. A lacuna é **faixa**, não fórmula: decimalUnits aceita expoentes que ultrapassam o teto normativo.

Complexidade: para entradas contratuais, coeficientes de unidades têm até20 dígitos e produto até40; multiplicação inteira não é universalmente O(n), mas seu tamanho é limitado. Mesmo entradas Number fora da faixa têm mantissa finita de até17 algarismos significativos e expoentes limitados pelo IEEE754; as potências aqui não são dirigidas por strings BigInt arbitrariamente longas (ordem máxima de322 casas). NaN/Infinity/negativos/escala excessiva são rejeitados controladamente nos probes. O custo é aritmética sobre inteiros pequenos e delimitados; não há I/O, N+1, lock ou benchmark geral. O algoritmo não recupera dígitos já perdidos ao representar o JSON legado como Number. Limite de runtime não substitui limite de negócio, como demonstra o achado.

Trade-off aceito: conferir a relação normativa do snapshot na fronteira cliente evita falso sucesso sem recalcular carteira/custo/avaliação. A guarda de teto deve completar essa relação; o backend continua autoridade de execução e atomicidade. Não se propõe migração ampla de tipos nesta revisão.

## Provas e resultados novos

| Prova | Resultado | Evidência |
|---|---|---|
| Três originais + controle no validador c45bfb6 em cópia | 3 falhas causais /1 positivo | original-red.log |
| Mesmos bytes após restauração candidata | 4/4 | original-restored.log, components-result.json |
| Primeira regressão, antes de acrescentar os quatro casos do teto | 121/121 (89 executor +11 async +21 bordas) | components.log |
| Probe final de limites | 21 passam /4 falham | decimal-limits.log |
| Gate final completo com quatro casos novos | **121 passam /4 falham,125 total** | components-final.log |
| Lint/typecheck/build | 249 arquivos lint,0 erros/avisos; exits0 | lint.json, static-results.json, build.log |
| Spring/PostgreSQL + Chromium/reload | 1 runner /1 jornada passam | integration/result.json, integration/browser/ |

Contagens sobrepostas, não somar. A versão inicial do probe tinha21 casos; depois foram adicionadas quatro provas de teto sem enfraquecer as21. O gate final é125 com4 falhas, não um verde121 apresentado como aceite global. Logs anteriores do revisor e do executor foram lidos como históricos (ambos3 falhas/1 positivo; executor depois4 verdes), não reconstruídos ou atribuídos a esta execução.

Original versionado, cópia integrada pelo executor e cópia efetivamente executada têm SHA256 `0174865c3f241459bb2dfae5eb9540b2a95c47c92be72f5b427a59dcb5a69143`. Assertions intactas. A mutação substituiu somente creationResult.ts na cópia TEMP pelo fonte c45bfb6. Restauração byte a byte candidata comprovada por SHA256 `1500b313647fcd97f090941c4e4606822c51ab90880243f48d94906b15306d72` antes/depois. Fontes compartilhados não foram mutados. Evidências duráveis ficam aqui, nunca dependem de target.

Regressões preservam unmount, A→B, A→B→A, sessão expirada, respostas tardias de sucesso/erro, recover/retry obsoletos, execução substituída, storage, envelope/kind/UUID e callbacks ativos. async-state verifica seleção, isolamento, duplo envio e rollback de M1 sem apagar M2. Não há regressão concreta para reabrir RVR24-02 ou RV24-02.

## Integração real dirigida

Harness publicado reexecutado em cópia nova: [script](run-integration.ps1), [spec](gross.integrated.spec.ts), [runner](Rv24CreationBrowserIntegrationTest.java). Chromium, projeto review-sao-paulo,1440×900; instalação Playwright informa Chromium/headless153.0.8010.12, revisão1243. Backend real e PostgreSQL16 descartável/Flyway; e-mail/mercado doubles. Nenhuma corrupção de produto/persistência. O route.fetch observa200 real antes de entregar999 ao navegador. Após POST inválido, modal permanece/submit bloqueado; após GET inválido, envelope idêntico; GET válido posterior fecha, remove pendência, atualiza UI e reload conserva posição12.

Os [três checkpoints SQL](integration/browser/sql-checkpoints.json) registram sempre POSTs1, operação200/quantity2/fees0, recibo `bc891c42-68b1-4767-8e78-6aa09a7dfc02` bruto200, débito200 e saldo800. Oráculo Java final confirma uma operação/recibo. GETs de recuperação não foram contados como mutações. Identidade do recibo é comparada ao UUID efetivamente enviado. Endpoint SQL filtra owner autenticado e existe somente no runner de teste. Regressões de componente rejeitam kind/UUID alheios; não se repetiu toda auditoria de ownership backend.

[Captura final](integration/browser/recovered.png) inspecionada: tela carregada, RV24 avaliado1200. Os valores monetários/ausência de duplicação são comprovados por SQL, não pela captura. Essa jornada prova BUY200 e corrupção999; **não demonstra emissão do bruto fora do teto pelo backend**, cuja reprovação é de parser/hook. Não certifica todos os browsers/modalidades, zoom/mobile ou corte TCP físico.

## Decisão por critério

| Item | Decisão e rastreabilidade |
|---|---|
| RVR24-01 residual | Não aprovado integralmente: relação aritmética reparada; teto contratual ainda confirma indevidamente. Achado existente continua com dono RV24-01. |
| RV24-01/1 causal | Atendido: originais reexecutados intactos, mutação histórica e restauração. |
| RV24-01/2 efeito único | Aceite acumulado preservado; jornada nova SQL/reload corrobora um efeito. |
| RV24-01/3 conflito/nova intenção | Aceite da matriz c45bfb6 preservado; diff não toca backend/identidade; componentes mantêm identidade e nova intenção legítima. |
| RV24-01/4 desconhecido sem falso sucesso | **Pendente somente pela faixa monetária demonstrada**; requer os quatro vermelhos corrigidos, envelope preservado e recuperação válida. |
| RV24-01/5 lifecycle | Atendido no alcance acumulado, regressões atuais verdes. RVR24-02 encerrado preservado. |
| RV24-01/6 R03/RV01 e pendências | Preservado; execução substituída/callbacks cobertos; RVA-03 mantém dono original. |
| CF-009/1 seleção/rollback | Atendido pelo aceite R01/R02 e regressões async-state; nenhuma alteração nesses caminhos. |
| CF-009/2 erro/sucesso/retry/cancelamento | **Pendente por RVR24-01/faixa**. R03/RV01 e lifecycle mantêm aceite; completar rejeição de resposta impossível nos três caminhos sem perder retry/recuperação. |
| CF-009/3 isolamento/dupla chamada | Atendido no alcance acumulado; async-state e RV24 atuais verdes, backend continua responsável pela integridade. |
| CF-009/4 evidências/testes | Atendido: hashes, logs, contraprovas e limites preservados; não neutraliza critério2. |

Critérios originais não foram retirados/transferidos. Estados canônicos RV24-01/CF-009 mantidos em_revisao com nota desta decisão. Sem conclusão automática CF-009 a partir de RV24. H-RV24-01 ECONNRESET permanece investigação inconclusiva, sem nova ocorrência nesta execução; não é a causa deste veto nem foi encerrado por repetição verde. RVA-03, RJ-022-01/H24-01, publicação/adoção e demais gates continuam na origem. CF-025/026/027 não foram reauditas ou reabertas.

Próximo passo: saneamento pontual do teto de bruto no validador comum, mantendo amount/NG-01, seguido destas provas dirigidas. A liberação existente de CF-028 para especificação permanece independente; nenhuma execução CF-028, push, deploy ou migração real nesta revisão. [Comandos e integridade](EXECUCOES.md).
