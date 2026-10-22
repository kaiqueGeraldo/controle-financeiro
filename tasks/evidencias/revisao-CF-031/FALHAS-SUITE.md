# Três falhas da suíte ampla: análise separada

Reexecutados os mesmos dois arquivos na base6d819aa arquivada e no candidato0f0b619, mesmas dependências Node24/Vitest4.1.11/jsdom26, mesmas fixtures/setup. Ambos: **6 passaram / 3 falharam em9**. A suíte438/441 do executor não foi repetida integralmente: a seleção dirige as três falhas e evita repetição sem finalidade. Logs `baseline-regressions.log/json`, `candidate-regressions.log`.

## F1 — habit-product-day, focus

Assertion linha65: depois de unmount, getTimerCount esperado0, observado1. As assertions anteriores de data, destaque e payload passaram. Reproduz na base e candidato; não é regressão atribuível ao delta CF031.

Diagnóstico novo: BrowserTodayProvider isolado sob o mesmo calendário/focus encerra com0; Modal compartilhado isolado sob timers falsos deixa2 trabalhos pendentes e chega a0 após drenagem. Isto demonstra que a contagem global inclui infraestrutura de animação, não identifica o timer de calendário. Não atribui conclusivamente o único timer da fixture combinada a uma função específica.

**Classificação: resultado inconclusivo quanto à origem exata; indício demonstrado de observador/harness amplo demais.** Não declarar leak de produto nem defeito de teste definitivamente encerrado. Encaminhar para manutenção do harness CF003/CF015: rastrear identidade/stack dos timers da fixture original, manter exigência de cleanup dos timers da aplicação. Não remover assertion nem aumentar timeout.

Não bloqueia adicionalmente a CF031: esta não usa o hook de dia de hábitos; a capacidade compartilhada Modal tem desmontagem/Escape/retorno de foco exercitados nos75 casos, e interação real sem animação falsa nas jornadas. Nenhum callback tardio do onboarding foi demonstrado. Reabrir como bloqueio caso timer de aplicação permaneça recorrente ou altere formulário desmontado.

## F2 — habit-product-day, visibilitychange

Mesma assertion linha65, esperado0/observado1; casos independentes na tabela de teste. Data/payload após suspensão passam em ambas as bases. Provider isolado com visibilitychange encerra com0. **Classificação: resultado inconclusivo**, com a mesma limitação de contagem global, mas ocorrência registrada separadamente. Mesmo encaminhamento e condição de reabertura de F1; não confundir as duas execuções com um só caso nem alegar que preexistência basta para aceitá-las.

## F3 — temporal-presentation, data civil inválida

O render de TransactionDetails falha antes das assertions de saída neutra: PrivacyBlur chama useUser e falta UserProvider no teste. O próprio arquivo não fornece esse provider nem mock de useUser; outros testes do repositório que exercitam PrivacyBlur o fazem. Stack reproduzida identicamente em base/candidato.

**Classificação: defeito de teste/harness preexistente.** A fixture não monta a dependência de contexto exigida. Não é prova de que a data inválida é apresentada corretamente: essa assertion continua sem execução neste teste. Encaminhar correção da fixture e reexecutar as assertions originais, sem alterar expected.

Não bloqueia adicionalmente a CF031: o fluxo real monta UserProvider no layout autenticado; os testes de onboarding fornecem contexto, a renderização real/privacidade passa, e datas inválidas são recusadas pela fronteira input/response do onboarding. TransactionDetails não é tela da entrevista. CF032 deve reconferir sua jornada cotidiana antes de adoção; nenhuma antecipação dessa tarefa foi feita.

## Limites

Preexistência foi demonstrada por execução comparável, não apenas pelo relatório anterior. Não alteramos expectativas originais, mocks existentes ou timeouts para obter verde. Os probes de diagnóstico são complementares, não substitutos da suíte. Estas três falhas não explicam RC031-01/02, que estão no código novo do candidato.
