# Revalidação independente de RVR24-01/P2 — 08/10/2026

**A. RVR24-01/P2 aprovado no escopo verificado e encerrado. B. RV24-01 concluida, com critério4 atendido. C. CF-009 concluida, com critério2 atendido e demais aceites preservados.** Não foi encontrado defeito confirmado ou lacuna essencial que impeça os critérios destes itens. As decisões abaixo confrontam o contrato, contraprovas, consumidores e persistência; não decorrem apenas da contagem de testes.

## Base, escopo e preservação

Base anterior `d4e5a06e04aa96f95a29a7312893798d955d57a8`; funcional/testes `3ac2fc5`; candidato documental e HEAD inicial `b5e8550609cea1d7ce0e94cd5c9fbb98eb13b68a`. Branch main; ancestralidade d4e5a06→3ac2fc5→b5e8550 confirmada. Examinados intervalos funcional d4e5a06..3ac2fc5 e completo d4e5a06..b5e8550. Não houve avanço posterior no início ou na retomada. [Baseline](baseline.json), [arquivos](diff-files.txt), [diff de produto](product.diff).

Staging inicial vazio; único delta preexistente README raiz com SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`. Preservado fora do commit. AGENTS do usuário aplicado, nenhum arquivo adicional encontrado na árvore/ancestrais. Lidos tasks/README, EXECUCAO, POLITICA-DE-TESTES, FIN-06/NG-01, DEC-10, tarefas/parecer anterior/probes e encaminhamento/evidências atuais. Execução iniciada07/10 e consolidada08/10 após retomada; timestamps dos outputs preservados.

Produto alterado pelo candidato somente no frontend: criação/recuperação, validação, wrapper do parser, ownRecord e dois módulos locais upstream. Backend/BFF/schema/package/lock/UUID/fingerprint/recibo sem delta neste lote. Nossa revisão acrescenta apenas probes/documentação e estados. Sem alteração produtiva principal, clean/reset/remoção ampla, banco real, push ou deploy. Evidências novas fora de target; históricos permanecem históricos.

## Regra independente e avaliação técnica

Uma chave JSON __proto__ é dado. Não pode mudar o protótipo do objeto nem substituir membros contratuais ausentes por herança. Campos extras são admitidos quando os obrigatórios são próprios e válidos; não se exigiu proibir nomes especiais ou usar exclusivamente protótipo nulo. DEC-10 exige snapshot original da intenção, owner/kind/identidade corretos e efeito único; resposta inválida não prova ausência de commit. FIN-06 mantém dinheiro12+2/teto inclusivo999999999999.99, quantidade/preço informado12+8, HALF_UP do bruto exato antes das taxas. NG-01 mantém amount autoritativo e preço derivado descritivo, inclusive0E-8. Nenhuma nova regra financeira foi inventada para aprovar.

**Construção:** parse.js local define as duas escritas de objetos com Object.defineProperty, propriedades de dados enumeráveis/configuráveis/graváveis. revive.js faz o mesmo na substituição de membro. Não invocam setter __proto__ nem setter herdado comum. Protótipo normal continua Object.prototype, arrays continuam arrays; __proto__/constructor/prototype/hasOwnProperty ficam dados próprios. Probes com JSON bruto escapado/aninhado, extras legítimos, descritores, null/primitivos e setter explícito corroboram. Um teste do callback de reviver que remove o membro antes de retornar verifica separadamente a materialização do resultado do callback; é teste da API local, não alegação de que o wrapper financeiro faz essa remoção.

**Validação:** ownRecord usa Object.hasOwn e exige objeto não nulo/não array. Snapshot de investimento exige seus10 membros antes dos tipos/conteúdos; transação exige campos comuns e condicionais próprios (transferência/categoryId). POST/retry exige data próprio; GET exige data, operationId/kind/result próprios e valida o snapshot aninhado. parseSavedCreation exige envelope/comando obrigatórios próprios antes de uso. Objetos Object.create, protótipo nulo, método hasOwnProperty sombreado e próprio inválido sobre herdado válido são tratados corretamente. O `in` restante em validateCreationResult só discrimina o ramo TypeScript e é seguido por rejeição explícita de investmentId herdado; probe adicional demonstra isso. Não existe uso residual desse `in` como autorização de presença.

Campos opcionais do comando são lidos após JSON.parse nativo de armazenamento, que cria membros próprios; os nomes opcionais não são membros nativos de Object.prototype. Não há merge de resposta sobre protótipo nem fallback a valores herdados para campos financeiros obrigatórios. Objetos arbitrários com getters executáveis não são produzidos por esse JSON; não se transformou esse cenário externo ao contrato em critério novo. A própria construção cria dados, não accessors.

**Consumidores:** investimento POST/retry → apiRequest opt-in → parser local → validateCreationResponse → complete; GET → parser opt-in → envelope próprio → validateCreationResult → complete. Hook só remove storage após validação e geração ativa. OperationModal só chama sucesso/fechamento em confirmed. Não existe normalização/merge posterior que promova herança neste caminho. Outros endpoints conservam parsing anterior; histórico/posição não consomem LosslessNumber desses resultados. Regressões HTTP/BFF e transação preservam compatibilidade.

**Dois módulos locais:** comparei o código instalado4.3.0 com os vendorizados. [Verificador](verify-vendor.cjs) e [hashes](vendor-verification.json) confirmam somente três escritas, imports dos helpers públicos e retirada de comentários source-map. parse cuida de gramática/construção; revive percorre o valor e aplica transformação. Não são dois parsers financeiros divergentes; LosslessNumber e parsing numérico continuam na dependência fixada. Licença/proveniência presentes. Não foi preciso consultar ou presumir segurança de versão remota para decidir o candidato.

Trade-off não impeditivo: cópia local exige comparação e regressões no próximo upgrade; a orientação de manutenção já está no README do vendor. Custo normal O(n) no corpo, memória O(n)/pilha proporcional à profundidade, checagem de campos O(k) com k fixo. DefineProperty adiciona custo constante por membro, sem I/O, query/N+1 ou lock novo. Gramática/duplicatas e limites decimais1024/expoente±1024 não mudaram; rejeição de entrada inválida preservada. Não é garantia de custo ilimitado em JSON arbitrariamente grande/profundo ou duplicatas adversariais fora do DTO. Não se exige refatoração ampla por essa limitação já delimitada.

## Provas e contraprovas

Original independente [parser-independent.test.tsx](../revalidacao-RVR24-01-precisao/parser-independent.test.tsx): SHA256 **18981b2f600001356f59d87fd2fb9cd0d378db1f4d71701bd2f2d1d5eed800dd**. Blob d4e5a06, histórico atual, cópia oficial e TEMP são idênticos, portanto inputs/assertions dos quatro probes não mudaram. Histórico de04/05 registra4falhas/12positivos; relato do saneamento também4/12→16/16, confrontado sem tratá-lo como nova execução.

| Nova execução | Resultado | Evidência |
|---|---|---|
| Original: semântica __proto__ + POST/retry/GET e12controles |16/16, incluídos no gate267 | components-authorized.log |
| Seleção pertinente17arquivos: originais, próprias, precisão/teto/bruto/lifecycle/HTTP |267/267 | components-authorized.log |
| Novas lacunas: construção diferencial35fixtures, setter, reviver, discriminador e wrapperGET |5/5 | object-boundary.test.tsx, object-boundary.log |
| Validadores anteriores, construção candidata, só TEMP |17falhas/8positivos | counter-own-old.log |
| Construção anterior, validadores candidatos, só TEMP |1falha/15positivos | counter-construction-old.log |
| Restauração da cópia, complemento integral |25/25, hashes iguais | counter-restored.log, counterproof.json |
| BUY200 e NG-01 integrados |1/1 cada, PostgreSQL real descartável | buy/result.json, ng01/result.json |
| Lint/typecheck/build |exits0; lint zero erros/avisos | static-result.json e logs |

As contraprovas isolam garantias diferentes: validação deve rejeitar Object.create mesmo com parser seguro; parser deve preservar semântica de objetos mesmo que a validação nova já impeça falso sucesso. Por isso construção antiga produz somente1falha, os três transportes ficam protegidos por Object.hasOwn. Isso é defesa independente demonstrada, não teste enfraquecido. Quatro fontes mutadas somente em TEMP, finalmente restauradas byte a byte; comparação de toda src confirma restauração. As repetições de25/16 são sobrepostas, não casos únicos adicionais aos267. Total único frontend desta revisão272.

A primeira tentativa restrita [components.log](components.log) falhou nas17suítes **antes de executar testes**: EPERM ao renomear arquivos do cache em caminho sandbox, transform/setup/import/tests zero. Resultado exit1 preservado. Nova execução autorizada, mesmos17arquivos sem mudar fontes/assertions/timeouts/cacheconfig, passou267. Não se atribui causa mais profunda ao Windows/Vitest nem se declara esse problema ambiental resolvido globalmente. Essa falha de inicialização não é comportamento financeiro e não deixa prova essencial ausente após a execução completa. Não houve retries automáticos, sleeps ou aumento de timeout para obter verde.

## Integração e oráculos

Chromium headless/Playwright instalado, São Paulo1440×900, JDK21, BFF Next→Spring→PostgreSQL16/Testcontainers/Flyway descartável. Fontes/config efetivas e SQL guardados por execução. Email/mercado são doubles externos; serviço financeiro e banco reais. Não certifica todos os browsers/modalidades.

**BUY200:** fixture conta1000 e posição10/custo1000. BUY2×100/fee0 exige débito200, saldo800, posição12/custo1200. UUID **d407d7e7-952f-4626-8d50-6a31e79916f7**. Harness espera resposta real póscommit e só então entrega objeto {__proto__:snapshot}; GET também envolve result em chave própria __proto__ criada por JSON bruto/computed property, sem confundir literal JavaScript especial. Pendência, UUID/corpo e modal conservados; submit bloqueado. GET válido após reload fecha modal, storage fica vazio, novo reload lê posição12. Três [checkpoints SQL](buy/browser/sql-checkpoints.json):1POST,1operação200,1recibo do UUID,1débito200/saldo800. [Corpos adulterados POST](buy/browser/post-malformed.json) e [GET](buy/browser/get-malformed.json). Sem mutação proibida no banco para fabricar a falha.

**NG-01:** abertura por strings quantity999999999999.99999999/custo1/valor1, conta1000. Resgate final amount1.00/fee0 exige crédito1, custo/posição0, saldo1001. UUID **830172dc-3966-4112-9814-d94ebe963323**. Um POST UI e um POST explícito de replay da mesma identidade/corpo, uma operação/recibo/crédito. POST real capturado e entrega substituída502, GET adulterado1e12 conserva pendência; GET exato após reload encerra, segundo reload confirma posição0. [Estado correlacionado](ng01/browser/precision-state.json), [POST](ng01/browser/operation-raw.json), [replay](ng01/browser/replay-raw.json), [GET](ng01/browser/receipt-raw.json). POST/replay têm mesmos bytes; raw_operations/raw_receipts SQL e tokens HTTP preservam quantidade exata. O Number auxiliar do relatório SQL não é o oráculo de precisão. GETs não são contados como efeitos ou POSTs.

Precisão decimal, BigDecimal de recuperação, FIN-06, NG-01 e coerência200→999 conservam aceites anteriores e regressões verdes. Não se reabriu a sexta prova histórica: sua substituição aceita emd4e5a06 continua ativa e passa. Nenhum recibo histórico/fingerprint foi alterado pelo diff; recuperação de recibos reais corroborada, sem repetir a auditoria backend inteira.

## Decisões por critério

| Item | Evidência e decisão |
|---|---|
| RVR24-01/P2 | Construção segura, membros próprios, quatro originais e contraprovas; **encerrado** |
| RV24-01/1: causalidade | Aceite anterior preservado, hash original e contraprovas atuais corroboram |
| RV24-01/2: efeito único | Aceite acumulado e duas jornadas atuais/SQL/reload |
| RV24-01/3: conflitos e nova intenção legítima | Aceite matriz c45bfb6/40e07ef preservado; identidade/backend sem delta; regressões de intenção atuais |
| RV24-01/4: desconhecido sem falso sucesso/reload/perda de ID | **Atendido agora**: três caminhos rejeitam herança, preservam ID/corpo e recuperam; comportamento explícito de storage/perda já aceito permanece |
| RV24-01/5: owner/ciclo | RVR24-02 preservado; testes obsoletos/unmount/A→B/execução substituída verdes |
| RV24-01/6: R03/RV01 e investigação separada | Preservado; jornada alterada integrada, RVA-03 não encerrada |
| CF-009/1: seleção/rollback | Aceites R01/R02/R03/RV01 e async-state atuais; sem delta nesses caminhos |
| CF-009/2: erro/callback/retry/cancelamento | **Atendido agora**: modal real não chama sucesso/close em resposta inválida, recuperação válida chama uma vez; lifecycle/erro/cancelamento aceitos e preservados |
| CF-009/3: isolamento/dupla chamada | Aceites anteriores + regressões atuais; backend segue responsável pela integridade |
| CF-009/4: evidência/testes | Hashes, falhas ambientais e mutantes preservados, oráculos independentes, limites explícitos |

[Matriz independente anterior](../revisao-CF-025-CF-027-RV24/MATRIZ.md), [bruto e critérios acumulados](../revalidacao-RVR24-01-bruto/README.md), [precisão/último impedimento](../revalidacao-RVR24-01-precisao/README.md) sustentam os aceites reutilizados; não são outputs desta execução. RV24-01 e CF-009 passam em_revisao→concluida após exame individual, sem remover/transferir critérios e sem prometer ausência absoluta de bugs.

## Observações e continuidade

- Defeito confirmado que viola aceite: nenhum novo; mesmo RVR24-01/P2 encerrado.
- Lacuna essencial: nenhuma no recorte contratual revisado.
- Manutenção não impeditiva: comparar os dois módulos locais com upstream em futuras atualizações e manter regressões; já documentado no vendor.
- Limitações delimitadas: um navegador, fixtures sintéticas, fronteira específica de snapshot; comandos/histórico/posição Number legados não foram migrados. Não é auditoria global de segurança, desempenho ou publicação.

Separação explícita: o defeito anterior mudava o protótipo do objeto parseado e permitia aceitação de herança; nunca se demonstrou alteração global de Object.prototype. Probes atuais conferem preservação de descritores compartilhados e restauração de setter sintético, sem generalizar para segurança global.

CF-025/026/027, RVR24-02 e RV24-02 permanecem aprovados. RVA-03, RJ-022-01/H24-01 e H-RV24-01/ECONNRESET não reapareceram no fluxo financeiro desta revisão e não são encerrados por associação. EPERM foi a ocorrência ambiental específica descrita acima.

Próximo passo permitido é continuar **somente a especificação CF-028**, conforme liberação anterior, não executada aqui. Conclusão destas tarefas não autoriza implementação de CF-028, sucessoras, migração real, push ou deploy. [Comandos/proveniência](EXECUCOES.md); [checkpoint verificável](checkpoint.json).
