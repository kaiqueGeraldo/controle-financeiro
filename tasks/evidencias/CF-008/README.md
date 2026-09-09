# Evidência CF-008

- Estado real e data: concluída em 08/09/2026.
- Modelo/esforço usados: executor desta conversa, esforço alto.
- Commit/base e identificação do diff local testado: `main`, HEAD
  `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, mais o patch local não
  commitado de CF-001–CF-007. Nenhum reset, checkout ou descarte foi feito.
- Runtime, sistema, navegador, viewport, timezone e seed: Windows/PowerShell;
  Node `24.18.0`; Next `16.1.6`; Vitest `4.1.11`; jsdom; seed `cf001-v1`;
  relógio `2026-09-08T02:59:59Z`; componente em `America/Sao_Paulo`;
  unitários também em UTC e Pacific/Kiritimati; Eclipse Temurin `21.0.12.1`;
  Maven Wrapper; Spring Boot `4.0.2`; Docker Engine `29.6.2`;
  Testcontainers `2.0.3`; PostgreSQL 16 descartável. Navegador/viewport não se
  aplicam aos testes de contrato desta tarefa.
- Dependências integradas: CF-002, CF-003 e CF-004 concluídas; CF-005–CF-007
  também presentes na mesma base local conforme seus arquivos de tarefa.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| AC-UI-004 | 401 privado solicita autenticação; 403 preserva sessão e uma leitura posterior funciona | `http-contract.test.tsx`; `SecurityHttpContractIntegrationTest` | Aprovado no cliente e em Spring Security real |
| AC-UI-005 / AC-TIME-002 | Bean validation e desserialização civil inválida retornam 400 com campos; conflito otimista retorna 409; falha inesperada fica 500 | `HttpContractControllerTest`; `AuthControllerContractTest` | Aprovado com controller, serializer e advice reais |
| AC-UI-006 | Rede/503/504 são recuperáveis; mutação fica com resultado desconhecido; cancelamento permanece AbortError; formulário não fecha nem perde dados | `http-contract.test.tsx`, `bff-contract.test.tsx`, cenário 503 em `temporal-forms.test.tsx` | Aprovado; callbacks de sucesso/fechamento não chamados |
| AC-UI-007 | 204 não é desserializado; erro JSON não vira arquivo; XLSX conserva bytes/tipo/nome | testes do cliente e BFF | Aprovado |
| Paginação/DTOs | `content` e metadados em `page.{size,number,totalElements,totalPages}`; nomes de request/response explícitos | `HttpContractControllerTest`, teste do service e `src/services/HTTP-CONTRACT.md` | Aprovado com `PagedModel` explícito |

Os expected vieram de SPEC-002/SPEC-003 e da semântica HTTP, não da resposta
observada. Fixtures usam UUIDs, e-mails, bytes e valores exclusivamente
sintéticos.

## Falha anterior

O teste frontend foi escrito e executado contra o cliente anterior:

```text
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts tests/component/http-contract.test.tsx
Test Files 1 failed; Tests 7 failed; exit 1
```

Falhas causais observadas: 403 disparou a mesma expiração do 401; `ApiError` não
carregava classe/campos/reconciliação; 204 chamou `response.json()`; download
leu `blob()` antes de verificar HTTP e perdeu a mensagem JSON; um DOMException
AbortError de outro realm virou falso 500; falha de rede virou status 500; JSON
em resposta de download 200 foi aceito como arquivo.

O teste backend também foi executado antes da correção:

```text
mvnw.cmd --batch-mode -Dtest=HttpContractControllerTest test
Tests run: 5, Failures: 3; exit 1
```

`MethodArgumentNotValidException` e `AccessDeniedException` caíram no handler
genérico e retornaram 500; desserialização inválida retornou 400, mas sem o
campo `date`. A falha foi da regra sob teste, não de importação ou banco. Uma
tentativa anterior a essas execuções não carregou testes (`npx` global quebrado
e Maven apontando para `C:\.m2`); ela foi classificada somente como falha de
ambiente e não como regressão.

Na revisão final, um sexto teste foi incluído para o contrato temporal do
`PUT /transactions/{id}` e executado antes da correção:

```text
HttpContractControllerTest: 6 testes, 1 falha; esperado 400, observado 200
```

O endpoint não acionava o `@WallTime` de `UpdateTransactionDTO` porque faltava
`@Valid`; o log também comprovou que o service era chamado. A execução ocorreu
em `eclipse-temurin:21-jdk`, após duas tentativas classificadas como ambiente
(cache Maven sem escrita e JDK global 25 rejeitado pelo Enforcer).

Não houve execução vermelha independente do BFF antigo para timeout/499; esses
casos foram descobertos durante o mapeamento e cobertos no pós-fix. Esta lacuna
é mantida explícita em vez de inventar uma mutação histórica.

## Correção e validação

- `apiRequest` passou a distinguir autenticação, autorização, validação,
  conflito, indisponibilidade, rede e resposta inválida. Só 401 privado emite
  `sessionExpired`; 403 preserva a sessão. Erros expõem `fields`, `retryable` e
  `requiresReconciliation`.
- 204 retorna `data: null` sem parse. Download só produz Blob após `response.ok`
  e rejeita JSON/malformed JSON como resposta inválida.
- O BFF usa timeout configurável (10 s padrão), propaga cancelamento, retorna
  503/504/499 conforme a causa, transfere body como bytes e preserva cabeçalhos
  relevantes.
- O handler Spring padroniza erros de Bean Validation, Jackson, parâmetros,
  autenticação/autorização e conflito. `AuthController` deixou de converter
  qualquer `RuntimeException` em credencial inválida; falha inesperada continua
  500. `TransactionController` retorna `PagedModel` estável e valida também o
  payload de atualização antes de chamar o service.
- `SecurityConfig` foi a única implementação alterada fora dos caminhos
  enumerados na tarefa: a mudança é necessária porque 401/403 produzidos antes
  do controller não passam pelo `@ControllerAdvice`. O handler em si está no
  escopo `infra/exception` e o teste integrado comprova a conexão.

Comandos finais e códigos:

```text
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
25 testes, 6 arquivos, exit 0

node node_modules/typescript/bin/tsc --noEmit
exit 0

node node_modules/eslint/bin/eslint.js src/services src/app/api/'[...path]'/route.ts tests/component/http-contract.test.tsx tests/component/bff-contract.test.tsx tests/component/temporal-forms.test.tsx
exit 0

node scripts/test.mjs
15 execuções (5 em cada fuso), exit 0

node node_modules/next/dist/bin/next build
exit 0

mvnw.cmd --batch-mode -Duser.timezone=UTC clean verify
54 testes, 0 falhas/erros/skips, JAR gerado, exit 0

docker run ... eclipse-temurin:21-jdk ./mvnw --batch-mode -Duser.timezone=UTC -Dtest=HttpContractControllerTest test
6 testes, 0 falhas/erros/skips após a regressão final, exit 0
```

O primeiro build Next falhou somente porque o sandbox bloqueou o download das
fontes Geist. Repetido com acesso à rede autorizado, compilou e gerou as 14
páginas. O aviso preexistente de depreciação de `middleware` permaneceu.

## Verificação adversarial

- O mesmo teste faz 403 e depois 200 autorizado; nenhum novo evento de sessão é
  emitido.
- JSON de erro em download 500 não chama `blob()`; JSON com HTTP 200 também é
  rejeitado. Um ZIP sintético `50 4b 03 04` conserva exatamente os quatro bytes.
- `2026-02-31` identifica `date`; `24:00` no update identifica `time`; request
  com cinco violações retorna todas e o service não é chamado.
- Login com erro de negócio retorna 401; a chamada seguinte com
  `IllegalStateException` retorna 500, impedindo mascaramento de falha interna.
- Timeout e cancelamento usam sinais controlados, sem sleep/retry; 503 em
  formulário conserva `42.17` e a descrição, sem `onSuccess`/`onClose`.
- Nenhuma assertion foi removida, nenhum teste recebeu skip/only e nenhum
  timeout de teste foi ampliado.

## Revisão e pendências

- CF-023 ainda deve substituir os 29 lançamentos legados de
  `BusinessRuleException("Acesso negado...")` por uma política uniforme de
  referência inexistente/alheia (403 ou 404 sem enumeração). Classificar pelo
  texto da mensagem nesta tarefa seria acoplamento frágil a idioma.
- `requiresReconciliation` informa o risco, mas idempotência, respostas fora de
  ordem e consumo sistemático desse sinal pertencem às CF-009/024.
- Os services têm tipos estáticos para responses consumidos, mas não há
  validação runtime completa de todos os JSON 200. O teste cobre paginação e os
  envelopes críticos, não cada campo de todos os DTOs.
- O BFF materializa request e response com `arrayBuffer()`: custo de tempo e
  memória O(n) no tamanho do payload, útil para manter timeout e bytes sob um
  único controle, mas arriscado para exportações grandes. Streaming com limite
  explícito deve ser avaliado se o volume crescer. A tarefa não alterou queries
  nem adicionou acessos a repositório, portanto não introduziu N+1.
- Não foram executados Playwright/E2E navegador, CI remoto ou ambiente de
  produção. O upstream do BFF foi controlado em teste; Spring Security foi
  validado por integração real com PostgreSQL descartável.
- O `clean verify` de 54 testes foi concluído antes do último ajuste de
  `@Valid`. Depois dele, houve recompilação integral e execução verde dos 6
  testes de `HttpContractControllerTest` em JDK 21. A repetição do `clean
  verify` com 55 testes não foi contabilizada: montar o socket Docker do host
  dentro do contêiner JDK foi recusado por segurança. Não se infere esse
  resultado ausente a partir da execução parcial.
- O handler preserva mensagem de regra de negócio. Revisões futuras devem
  impedir que mensagens incluam dados sensíveis; exceções 500 e 401/403 já usam
  textos públicos fixos.

Conclusão restrita à CF-008; não há promessa de ausência total de bugs.
