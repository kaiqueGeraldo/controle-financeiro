# RVR24-01/P2 — aceitação de snapshot por propriedades herdadas

Revalidação independente iniciada em 04/10/2026 e consolidada em 05/10/2026, candidato `98d0343`. Mesmo ID e tarefa responsável **RV24-01**, refletindo em CF-009/2. Defeito confirmado; não é a limitação decimal anterior nem uma hipótese de precisão ilimitada.

## Localização e causa

- `controle-financeiro-frontend/src/services/investmentResultJson.ts:9`: delega o JSON de resultado ao parser lossless-json 4.3.0.
- Dependência instalada, `node_modules/lossless-json/lib/esm/parse.js:78`: atribuição `object[key] = value` em objeto `{}`. A chave JSON `__proto__` altera o protótipo desse objeto em vez de ser preservada como propriedade própria. O reviver percorre Object.keys; não desfaz essa transformação.
- `controle-financeiro-frontend/src/services/creationResult.ts:68`: lê id/type/date e demais campos por acesso comum, aceitando propriedades herdadas. A guarda record verifica apenas objeto não nulo/não array.
- `controle-financeiro-frontend/src/hooks/useCreationIntent.ts:68`, `:83` e `:77`: confirmação do POST, retry e recuperação, respectivamente, remove a intenção quando a validação aceita. `operationModal.tsx:129` encaminha confirmed aos callbacks de sucesso/fechamento; a prova dinâmica aqui é do hook real, não uma captura visual desses callbacks no caso adulterado.

## Reprodução mínima

Comando BUY, quantity 2, price 100, fees 0, date 2027-01-15. Resposta HTTP 200, corpo bruto:

```json
{"__proto__":{"id":"10000000-0000-4000-8000-000000000001","type":"BUY","date":"2027-01-15","quantity":2,"price":100,"totalValue":200,"fees":0,"costDelta":200,"realizedResult":null,"dateOrigin":"USER_INPUT"}}
```

O objeto JSON de resultado **não possui** id, quantity, price ou totalValue no seu nível. `JSON.parse` preserva __proto__ como chave de dados e o validador rejeita. O parser candidato entrega Object.keys(result)=[], mas result.id e result.quantity são acessíveis por herança; números herdados continuam instâncias LosslessNumber.

GET: colocar exatamente esse objeto em `result` do envelope com operationId/kind corretos da intenção salva. Retry: iniciar resultado desconhecido e entregar o mesmo corpo no reenvio da intenção. Não é necessário adulterar owner, UUID ou os valores aritméticos para reproduzir.

Esperado: erro de parsing/validação ou outcome unknown; conservar a intenção, UUID e corpo; não autorizar sucesso nem nova identidade. Observado: **confirmed, sessionStorage null e pending null**, em POST/retry/GET. Quatro testes falham (semântica do parser e três caminhos); os outros 12 casos de gramática/limites passam. [Fonte](parser-independent.test.tsx), [execução integral](parser-independent.log).

Contraprova causal: somente na cópia TEMP, trocar a seleção do parser em apiRequest por JSON.parse. Os três caminhos passam a rejeitar o mesmo corpo e conservar a intenção: [log dirigido](client-old-inheritance.log). Essa contraprova seleciona apenas os três testes de transporte; os outros 13 não são anunciados como executados. A execução integral candidata acima permanece vermelha. A mutação também faz os seis probes históricos de precisão falharem, portanto **voltar a JSON.parse não é uma solução**. Bytes restaurados em [client-counterproof.json](client-counterproof.json).

## Contrato, impacto e encerramento

Viola RV24-01/4, CF-009/2 e a validação do resultado imutável de DEC-10: um objeto sem o snapshot contratado confirma uma operação. Impacto demonstrado: falso sucesso e descarte da identidade de recuperação. Uma tentativa seguinte pode ter outra identidade; duplicação financeira concreta não foi produzida por este probe. Não se demonstrou poluição global de Object.prototype, invasão entre usuários, execução de código ou emissão espontânea desse JSON pelo backend. A adulteração é double HTTP, no mesmo modelo adversarial das provas anteriores de resposta inválida.

Saneamento necessário: manter semântica de membros JSON na fronteira decimal e impedir campos herdados de satisfazer o contrato de snapshot/envelope. Pode-se rejeitar representações perigosas ou usar materialização segura, com validação de propriedades próprias; a escolha deve preservar os tokens exatos. Não basta afrouxar FIN-06, retirar o parser ou filtrar texto com substituição frágil.

Encerramento objetivo: estes quatro testes passam, os seis requisitos históricos mantêm a cobertura de fronteira corrigida, 200→999/teto/NG-01/lifecycle permanecem verdes e a recuperação dirigida continua com um efeito. Nenhuma revisão global é necessária. O problema decimal e a leitura BigDecimal recebem aceite restrito no parecer; este resíduo de interpretação do objeto impede o encerramento integral.
