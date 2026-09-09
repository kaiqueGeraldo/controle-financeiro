# Evidência CF-007

- Estado real e data: concluída em 08/09/2026.
- Modelo/esforço usados: `gpt-5.6-sol` / `xhigh`.
- Commit/base e identificação do diff local testado: branch `main`, `HEAD 169d7be4c7d3db97d4c318ff3f99d9de3a808067`, com o patch local não commitado das CF-001–006 preservado e as alterações desta tarefa sobre a mesma árvore.
- Runtime, sistema, navegador, viewport, timezone e seed: Windows; Java `21.0.12.1`; Spring Boot `4.0.2`; Node `24.18.0`; Playwright/Chromium `1.63.0`; Docker Desktop `29.6.2`; Testcontainers `2.0.3`; PostgreSQL `16-alpine`; Chromium desktop `1440x900`; JVM `UTC`; browsers `America/Sao_Paulo` e `Pacific/Kiritimati`; locale `pt-BR`; instante fixo `2027-01-31T05:00:00Z`; seed/namespace `cf007-v1` mais sufixo aleatório por execução.
- Dependências integradas: CF-002, CF-003, CF-005 e CF-006 constavam como concluídas e foram exercitadas na mesma árvore local.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| Data civil atravessa navegador, BFF, Spring e PostgreSQL sem deslocar o dia | `YYYY-MM-DD` é calendário, não instante; o valor digitado é comparado literalmente no payload, resposta, SQL e UI após reload | `TemporalBrowserApiPostgresE2E` + `temporal.integrated.spec.ts` | Aprovado em São Paulo e UTC+14 para transação, compra de cartão, operação de investimento, meta e log de hábito |
| Criação, edição, reabertura e navegação por competência preservam a data | Transação `2027-01-30 23:30` e edição `2027-01-29 08:15`; navegação dezembro/janeiro; demais datas explícitas conforme o cenário | Mesmo E2E, com asserts explícitos e consultas SQL independentes | Aprovado em listagem, detalhe, dashboard e releitura após reload |
| Data impossível não persiste e deixa a entrada recuperável | `2027-02-29` deve retornar HTTP 400 e nenhuma linha correspondente pode existir; o input visível continua com o valor anterior | Requisição do formulário é alterada somente para introduzir o valor impossível e segue para BFF/backend reais | Aprovado; resposta 400, formulário aberto e ausência confirmada no PostgreSQL |
| Exportação conserva o calendário | A célula da data na planilha deve representar `29/01/2027`, sem derivar o esperado da aplicação | Download pela UI e leitura do XLSX com Apache POI | Aprovado nos dois fusos |
| O E2E detecta deslocamento plausível | Alterar temporariamente a persistência da transação para `date.plusDays(1)` deve produzir falha funcional, não falha de ambiente | Execução adversarial isolada no projeto São Paulo | Aprovado: esperado `2027-01-30`, recebido `2027-01-31`; mutação removida antes dos gates finais |

As APIs financeiras não são substituídas por sucesso falso. A única interceptação do Playwright continua a requisição real, trocando a data por uma data impossível que o `input[type=date]` do navegador não permite digitar. Os dois mocks do teste Java permanecem apenas nas fronteiras externas de cotação e e-mail.

## Falha anterior

O primeiro percurso real encontrou quatro defeitos de integração que impediam cumprir o critério, todos reproduzidos no E2E antes da correção:

1. Uma data impossível falhava na desserialização antes do controller e caía no handler genérico como HTTP 500. Foi adicionado tratamento de `HttpMessageNotReadableException` como 400. O envelope detalhado por campo continua reservado à CF-008.
2. O botão de edição dentro do formulário submetia implicitamente o modal; além disso, o input numérico recusava centavos pelo `step` padrão. Os botões passaram a ser explicitamente `type="button"` e o valor monetário usa `step="0.01"`.
3. O histórico de investimento retornava entidade JPA e disparava `LazyInitializationException` durante a serialização. A resposta agora usa DTO escalar, com mapeamento `O(n)` sobre as operações e sem expor o grafo ORM.
4. A listagem de hábitos serializava `logs` depois do fechamento da sessão. Um `EntityGraph` carrega hábitos e logs em uma consulta, evitando o N+1 que uma inicialização item a item introduziria.

Falhas de montagem do harness durante a primeira iteração — caminho do servidor Next, localização do Chromium, validade do JWT frente ao relógio fixo e sincronização da navegação mensal — foram separadas das regressões de produto e não são usadas como prova de detecção do bug.

## Correção e validação

Arquivos centrais desta tarefa:

- `controle-financeiro-frontend/tests/e2e/playwright.integrated.config.ts`: matriz de fusos, relógio, artefatos, execução serial e zero retry.
- `controle-financeiro-frontend/tests/e2e/temporal.integrated.spec.ts`: jornada real, payload/resposta/UI/reload, erro 400 e exportação.
- `controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/TemporalBrowserApiPostgresE2E.java`: inicia Spring e PostgreSQL descartável, chama Playwright e confirma as linhas SQL e o XLSX.
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/investment/dto/InvestTransactionResponseDTO.java`: contrato escalar para o histórico.
- Correções mínimas de integração em `InvestmentController`, `InvestmentService`, `HabitRepository`, `ResourceExceptionHandler` e `transactionDetails.tsx`.

Comandos executados e resultados finais:

```text
cd controle-financeiro-backend
mvnw.cmd --batch-mode -Duser.timezone=UTC -Dtest=TemporalBrowserApiPostgresE2E test
# exit 0; Playwright: 2 passed; Maven: 1 teste orquestrador aprovado; 2 min

mvnw.cmd --batch-mode -Duser.timezone=UTC clean verify
# exit 0; 45 testes, 0 falhas; jar gerado

cd controle-financeiro-frontend
node scripts/test.mjs
# exit 0; 15/15 em America/Sao_Paulo, UTC e Pacific/Kiritimati

.\\node_modules\\.bin\\vitest.cmd run --config tests\\component\\vitest.config.mts
# exit 0; 11/11

.\\node_modules\\.bin\\tsc.cmd --noEmit
# exit 0

.\\node_modules\\.bin\\eslint.cmd tests\\e2e\\temporal.integrated.spec.ts tests\\e2e\\playwright.integrated.config.ts
# exit 0

set BACKEND_API_URL=http://localhost:8080
.\\node_modules\\.bin\\next.cmd build
# exit 0; 14 páginas geradas
```

O primeiro build, dentro do sandbox sem rede, falhou apenas ao baixar Geist do Google Fonts; a repetição com rede autorizada compilou com sucesso. A execução final do Playwright ficou em `controle-financeiro-frontend/tests/artifacts/cf007/cf007-d17c787f/playwright.log`, acompanhada de dois XLSX sintéticos. Esses artefatos locais estão ignorados e não foram versionados; por política, a execução verde não gera screenshot, vídeo ou trace.

## Verificação adversarial

Foi aplicado temporariamente o mutante abaixo no caminho de criação de transação:

```diff
- transaction.setDate(data.date());
+ transaction.setDate(data.date().plusDays(1));
```

O E2E chegou ao serviço real e falhou na resposta HTTP: esperava `date: 2027-01-30`, recebeu `date: 2027-01-31`. O mutante foi restaurado com patch inverso; uma inspeção do diff confirmou a ausência de `plusDays`/`mutation probe`, e a matriz final limpa aprovou nos dois fusos.

O ajuste do matcher dos logs de hábito, de igualdade do objeto completo para `objectContaining`, não relaxou data nem status: ele deixou de rejeitar somente o campo adicional e legítimo `id`, mantendo `date: 2027-01-31` e `status: COMPLETED` obrigatórios.

## Revisão e pendências

- O relógio do produto no Spring e o relógio do navegador são controlados, mas o relógio do middleware/BFF usado na validade do JWT não é injetável. O instante fixo foi escolhido depois do relógio real da execução; tornar o relógio de autenticação determinístico pertence à revisão de contrato/autenticação, não deve ser ocultado neste E2E.
- O DTO de histórico elimina vazamento de entidade e serialização tardia. O `EntityGraph` evita N+1 (`O(H + L)` para hábitos e logs), mas ainda materializa todo o histórico de logs; volume/paginação precisa ser tratado nas tarefas de consultas e desempenho.
- A API de faturas não expõe o horário original da compra; o E2E valida a data na resposta/UI e `created_at = 23:30` diretamente no PostgreSQL. A evolução canônica de `recordedAt`/competência não foi antecipada artificialmente e permanece nas tarefas de contrato/migração.
- Não foi executada matriz visual/responsiva 360/768, claro/escuro ou onboarding completo porque a CF-007 exige consistência temporal funcional em desktop e declara cobertura total do onboarding fora de escopo.
- O lint dos dois arquivos E2E novos passa. Ao incluir `transactionDetails.tsx`, o ESLint ainda aponta dois `no-explicit-any` preexistentes nas linhas 24 e 39, fora das linhas alteradas nesta tarefa; o typecheck e o build passam. A dívida permanece para a CF-026, sem desabilitar a regra.
- O Next 16 alerta que a convenção `middleware` está depreciada, sem impedir build ou E2E.

Não há tarefa nova integralmente liberada apenas pela CF-007. A CF-015 passa a ter esta dependência satisfeita, mas continua aguardando CF-009 e CF-011–014. CF-008 e CF-010 já estavam liberadas por tarefas anteriores e permanecem executáveis; nenhuma tarefa seguinte foi iniciada nem teve o estado alterado.
