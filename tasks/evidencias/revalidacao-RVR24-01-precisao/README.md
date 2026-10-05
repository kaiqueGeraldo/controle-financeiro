# Revalidação independente da precisão RVR24-01 — 05/10/2026

**A. Entrega não aprovada integralmente.** Precisão decimal corrigida nos fluxos examinados, incluindo recuperação real e recibo preexistente. Entretanto o parser novo transforma a chave JSON __proto__ em protótipo e o validador aceita campos herdados: POST/retry/GET confirmam um resultado sem campos financeiros próprios e removem a intenção. Mesmo **RVR24-01/P2**, [reprodução e saneamento objetivo](ACHADOS.md).

**B. Sexta prova original inadequada à fronteira/contrato:** aceito o tratamento explícito já feito pelo executor em precision-boundary.test.tsx; a original fica histórica e vermelha, sem ser apresentada como aprovada. **C. RV24-01 permanece em_revisao pelo critério 4. D. CF-009 permanece em_revisao somente pelo critério 2.** Justificativa atual é o falso sucesso reproduzido por herança, não uma imprecisão ainda existente no caso NG-01 nem uma investigação vaga.

## Base e preservação

Branch main; HEAD inicial e candidato `98d03439119d5fa02d1c4b4732e975a18afc46d1`. Base `28e568211c1b75b6f52c57b490a24a45c0801fb6`, funcional `2d3245d6f4e44337318b5962d93da07e203b887c`; ancestralidade confirmada nas duas etapas, nenhum avanço posterior ao iniciar. Intervalos 28e5682..2d3245d e 28e5682..98d0343 conferidos; [lista de arquivos](diff-files.txt), [diff de produto](product.diff), [baseline](baseline.json). Os commits desta revisão só acrescentam probes/documentação, não estendem o aceite a produto posterior.

Staging inicial vazio; único delta preexistente README raiz, SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`, preservado e excluído dos commits. Aplicadas instruções AGENTS do usuário; busca na árvore/ancestrais sem outro AGENTS. Lidos tasks/README, EXECUCAO, POLITICA-DE-TESTES, FIN-04/06/NG-01, DEC-10, tarefas, parecer/provas28e5682 e README/ENCAMINHAMENTO/CONTRATO/EXECUCOES do saneamento. Fontes de produto da árvore principal não foram alteradas. TEMP só para cópias isoladas; evidências duráveis nesta pasta. Sem clean/reset/remoções amplas, push, deploy, banco real ou CF-028.

Diff funcional: ObjectReader local BigDecimal na recuperação; opção investmentSnapshot em apiRequest; ativação em investmentService.operation e recoverCreation; seis campos encapsulados em LosslessNumber; comparação decimal exata no validador; dependência lossless-json4.3.0 fixada, sem novas transitivas; testes de recibo/cliente/BFF. O diff documental de FIN-06 explicita preservação já requerida pelo decimal exato; não altera teto, autoridade do amount ou introduz regra usada para acomodar o candidato.

## Contrato e fronteira decimal

| Campo | Regra normativa | Representação e decisão |
|---|---|---|
| quantity | positivo, 12 inteiros/8 casas; máximo999999999999.99999999 | BigDecimal/numeric → token JSON → LosslessNumber → BigInt escala8 |
| price informado | positivo, 12+8 | igualdade ao comando e produto exato |
| price NG-01 derivado | descritivo, escala8; admite zero/mais inteiros | não recompõe amount; máximo monetário não é teto deste preço |
| totalValue | bruto positivo, máximo999999999999.99 inclusivo, escala2 | produto arredondado HALF_UP uma vez antes de fees, ou amount autoritativo |
| fees | escala2, não negativo | igual ao comando; aquisição bruto+fees limitado, outros fees≤bruto |
| costDelta/realizedResult | dinheiro conhecido escala2/faixa; null histórico; resultado pode ser negativo | preservar snapshot, sem recalcular posição/custo atual |
| amount | entrada string canônica12+2 | autoridade monetária SELL/NG-01; intacta na intenção |

FIN-06 anterior ao candidato já exige decimal exato, HALF_UP e limites; NG-01 define total autoritativo e preço descritivo. São regras independentes da implementação. A quantidade extrema com amount1.00 deriva preço0E-8 e é legítima. BUY/SELL/proventos por unidades seguem quantidade×preço; avaliação/posição usa outra leitura, não o snapshot de criação. Não foi encontrada ambiguidade normativa que impeça decidir estes casos.

Persistência numeric(20,8) da quantidade e result_json textual conservam token exato. POST/replay usa DTO BigDecimal tipado. GET antes lia DoubleNode; agora ObjectReader local com USE_BIG_DECIMAL_FOR_FLOATS lê o recibo existente, sem regravar result_json, fingerprint ou timestamp. Serialização continua número JSON; 0E-8 e 0.00000000 têm o mesmo valor admitido. O BFF lê/repassa arrayBuffer. Cliente lê response.text e opta pelo parser antes de qualquer Number: POST e retry via investmentService.operation; GET INVESTMENT_OPERATION via recoverCreation. Hooks validam antes de complete; OperationModal usa o outcome, não faz aritmética com LosslessNumber.

O leitor backend afeta também recuperação dos outros tipos de intenção, mas somente a interpretação de números fracionários: IDs/textos/bools/null/inteiros não viram decimais por essa configuração. Contratos HTTP/temporal e recibos anteriores reexecutados. A opção cliente é somente para investimento; recuperação de transação, histórico e posição continuam com tipos Number anteriores. Comandos v1 continuam congelados por JSON.stringify/parseSavedCreation antes de envio, UUID/payload inalterados. Formulários legados podem já perder dígitos ao formar comandos por unidades; não apareceu nova conversão destes endpoints para o snapshot corrigido. NG-01 usa amount string e unidades calculadas pelo servidor, atravessa o fluxo corrigido sem essa perda. Esta revisão não certifica todos os comandos possíveis nem exige migrar todos os consumidores para strings.

## Parser, BigInt e custos

Inspecionados o wrapper e o código instalado de parse/revive/LosslessNumber. É parser de gramática, não regex de substituição do JSON. Preserva tokens dos seis nomes financeiros; outros números viram Number somente no escopo opt-in. Strings, escapes Unicode, arrays, bool/null e contador não financeiro conferidos em probe. Escalas inválidas, expoentes incompletos, NaN, sinal+, zeros iniciais e vírgula final rejeitados. Excesso de teto/escala, HALF_UP, taxas, null/resultado negativo, preços descritivos e instâncias forjadas têm cobertura vigente. A exceção material é a semântica de __proto__, detalhada no achado.

decimalUnits converte coeficiente diretamente a BigInt; Number é usado só para expoente delimitado. Guarda1024 caracteres/expoente ±1024 antes da exponenciação, SafeInteger obrigatório; resto na divisão exige escala exata. Regex é linear no token e precede a guarda de tamanho; leitura do corpo/parser também custa O(n), memória O(n), recursão proporcional à profundidade. A guarda não é limite global do corpo. Para snapshots contratuais pequenos/rasos, coeficientes até20 dígitos (preço NG-01 pode ser maior) e produto até40, custo limitado; operações BigInt não devem ser chamadas genericamente O(1) ou lineares para precisão arbitrária. Probes de expoentes enormes/1025 dígitos rejeitados, sem benchmark amplo. Corpo absurdamente profundo está fora do DTO; erro do parser é capturado pelo serviço e conserva reconciliação, sem promessa de resistência irrestrita a payloads arbitrários.

Nenhuma query, lock ou escrita adicional, N+1 não introduzido. Trade-off: parser dedicado evita mudar contratos compartilhados com histórico, mas traz semântica de objetos da dependência que precisa ser validada; precisão numérica correta não garante validade do resultado.

## Decisão independente da sexta prova

O primeiro teste físico de json-precision.test.tsx faz `JSON.parse(validRedemption)`, afirma quantity===1000000000000 e exige que validateCreationResult não lance erro. Esse Number já não identifica o token máximo; também poderia vir de uma quantidade realmente proibida. O validador antes/depois recebe objeto desconhecido, não o corpo original; aceitar1e12 violaria FIN-06 e a guarda legítima. A função ainda aceita Number representável válido para compatibilidade, mas não promete recuperar lexema perdido.

Não se descartou o teste apenas pelo teto: rastreamento de consumidores acima confirma que POST/retry/GET de investimento não usam JSON.parse/response.json antes da validação. Cinco probes de transporte originais agora passam intactos, incluindo rejeição da quantidade divergente ainda dentro de12+8; a jornada real abaixo confirma o token e a recuperação. Portanto classificação **(c): oráculo inadequado para a fronteira direta**, e não consumidor real ainda vulnerável à perda anterior.

O executor já preservou o original em evidências e colocou precision-boundary.test.tsx na suíte ativa: mesmo JSON bruto deve ser aceito pelo parser correto e objeto arredondado deve ser rejeitado. Essa substituição é aceita nesta revisão, sem alteração adicional necessária ou commit artificial de teste. Não existe cópia vermelha sabidamente inválida incluída na suíte oficial; o arquivo histórico é executado em TEMP com resultado explicitamente separado. Cinco probes e controle restantes conservam entradas/assertions. Isso não neutraliza os quatro novos vermelhos válidos de __proto__.

## Provas e resultados novos

| Verificação | Resultado | Evidência |
|---|---|---|
| Sete testes originais (seis vermelhos históricos + controle) |6 passam/1 falha, oráculo acima | original.log |
| Parsing destrutivo reintroduzido só em apiRequest TEMP |6 falhas/1 positivo | client-old-original.log |
| Novos probes completos do parser/hook |4 falhas válidas/12 positivos | parser-independent.log |
| Contraprova dos três transportes com JSON.parse |3 passam;13 fora da seleção dirigida | client-old-inheritance.log |
| Frontend afetado, 15 arquivos |226/226 | components.log |
| Backend NG-01 + recibos + HTTP/temporal |30/30, inclui runner browser | ng01/result.json |
| BUY integrado + recibos |6/6, inclui runner browser;5 recibos repetidos, não somar como casos únicos | buy/result.json |
| Recuperação aproximada isolada |1 falha expected999999999999.99999999/observado1.0E12 | backend-old.log |
| Mesma prova após restauração exata |1/1 | backend-restored.log |
| Lint/typecheck/build |0 erros/avisos lint; exits0 | static-result.json, lint.json, typecheck.log, build.log |

Hashes SHA256 conferidos contra blobs históricos, fontes atuais e cópias executadas em [checkpoint](checkpoint.json):

- Precisão original, seis provas + controle: `dfdbd8d15d1b7a4fc3711799e78fdf6d1030c6444536cde90aff1ae4d1bf4c1a`.
- Teto, quatro provas +21 controles: `7b293c5a328231d950b456e95a847273e66439b22588f55026f8d1d5608bd255`.
- Bruto200→999, três provas + controle: `0174865c3f241459bb2dfae5eb9540b2a95c47c92be72f5b427a59dcb5a69143`.

Resultados históricos28e5682 (6falhas/1controle) e saneamento (1falha/6passam) consultados, não reconstruídos como originais. Duas mutações restauradas byte a byte em TEMP, fontes comparadas à árvore candidata; não houve mutação principal. Nenhuma assertion enfraquecida, retry, sleep ou timeout aumentado. Os gates verdes não anulam a reprovação adversarial nova.

## Integração independente

Chromium headless Playwright instalado, configuração São Paulo1440×900, JDK21, Spring/BFF reais, PostgreSQL16 descartável/Testcontainers/Flyway. Doubles só email/mercado; corrupção apenas no harness depois de resposta real. Fontes efetivas/config/logs guardadas por execução. Não certifica todos os browsers/modalidades.

NG-01: abertura por strings quantity999999999999.99999999/custo1/valor1; conta1000. Resgate integral amount1, fee0 → crédito1, custo baixado1, ganho0, posição0 e saldo1001, oráculo da proporção final NG-01. UUID **d3c99c2f-99d7-496a-b882-b2d45c8b1598**. Um POST UI com commit real, entrega substituída502; um POST explícito de replay com mesmo corpo/UUID. Duas requisições, uma operação/recibo/crédito. SQL nos checkpoints committed/afterReplay/recovered conserva unidades exatas em colunas textuais, não nos Numbers do relatório. Corpos [POST](ng01/browser/operation-raw.json)/[replay](ng01/browser/replay-raw.json) idênticos; [GET](ng01/browser/receipt-raw.json) preserva quantity exata. GET adulterado para1e12 mantém o mesmo storage; reload e GET legítimo fecham o modal, removem pendência, segundo reload confirma posição0. [Estado correlacionado](ng01/browser/precision-state.json). GETs não foram contados como mutações.

BUY: UUID **c185a68d-6cd2-4eef-a2e2-8da3142df731**,2×100, conta1000→800; um POST/uma operação200/um recibo200/um débito200. POST e GET adulterados acima do teto somente após commit, pendência mantida, GET válido e reload recuperam. [Três checkpoints SQL](buy/browser/sql-checkpoints.json). As capturas não substituem assertions DOM/storage/SQL. O novo defeito __proto__ é de componente/HTTP double; não se afirma que o backend produza espontaneamente esse objeto.

## Estados e limites

| Item | Parecer atual |
|---|---|
| Precisão decimal específica FIN-06/NG-01 | Aceite restrito: tokens e recuperação exatos, cinco falhas de transporte corrigidas |
| RVR24-01 completo | Não aprovado: interpretação de __proto__ confirma snapshot inválido |
| RV24-01/4 | Pendente pelo achado reproduzível; demais1/2/3/5/6 preservados pelos pareceres anteriores e regressões dirigidas |
| CF-009/2 | Pendente pelo falso sucesso/descarte; critérios1 seleção/rollback,3 isolamento/dupla chamada e4 evidências preservados |
| Sexta prova | Inadequada à fronteira; adaptação ativa aceita, original histórico intacto |

Aceites CF-025/026/027, RVR24-02/RV24-02, R01/R02 e R03/RV01 preservados. Testes de desmontagem/troca de owner/callback tardio/execução substituída passam; nenhum achado concreto nesses recortes. RVA-03, RJ-022-01/H24-01 e H-RV24-01/ECONNRESET não reapareceram nas execuções dirigidas e não foram encerrados por associação. Não houve falha de harness a reparar nesta revisão.

Próximo passo somente o saneamento de semântica de objeto/validação própria descrito no achado, mantendo precisão e provas. CF-028 conserva exclusivamente a liberação anterior para especificação, não executada nem ampliada por este parecer. Não há autorização de publicação. [Comandos, restauração e verificação](EXECUCOES.md).
