# CF-023 — Verificar isolamento por usuário e sessão

- Estado: concluida
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-002](../00-fundacao/CF-002-ambiente-backend.md), [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md), [CF-017](../03-integridade/CF-017-migracoes.md)
- Origem: T-003, T-009; investigação multiusuário

## Problema e resultado esperado

Autenticação na UI não comprova autorização em cada referência de conta, cartão, meta e investimento. Testar acesso indevido com dois usuários sintéticos.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/infra/security/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/controller/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/`
- `controle-financeiro-frontend/src/actions/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Montar matriz rota/método/referência com usuário proprietário, outro usuário e não autenticado.
2. Testar leitura, mutação, reorder, exportação, vínculos e cache; revisar expiração, logout e recuperação sem comunicação real.
3. Corrigir achados concretos com regressão de endpoint e política uniforme de erro.

## Aceite e testes adversariais

- [x] UUID de B não pode ser lido/alterado/vinculado por A; não há efeito parcial após tentativa.
- [x] Logout/troca de conta não reaproveita cache financeiro; token inválido/expirado produz resposta consistente.
- [x] Erros/logs/respostas não expõem segredo ou dados financeiros do outro usuário; asserts verificam estado do banco.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Declarar vulnerabilidade sem reprodução, fazer pentest em terceiros ou enviar e-mails reais.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Iniciada em 30/09/2026 sobre `0219a57`, com README raiz alheio preservado.
A revalidação dirigida dos resíduos (registro de execução privado)
libera explicitamente CF-023 localmente sobre CF-002/008/017 integradas, sem
encerrar seus gates de adoção real. Executar somente em PostgreSQL descartável.
DEC-09: adotar 404 para referência inexistente ou de outro proprietário, com
mesma mensagem por recurso; 401 para credencial ausente/inválida/expirada e 403
para proibição independente de ownership. Reorder com qualquer ID inacessível
deve falhar integralmente antes de alterar a ordem. O contrato detalhado e os
oracles ficam em evidências CF-023 (registro de execução privado).
Exceção de caminho: infraestrutura/testes novos em `src/test/java/.../infra/security/`
e `frontend/tests/component/`, para executar endpoints reais, PostgreSQL e
actions/BFF sem incluir testes no artefato produtivo; consumidores de sessão
fora de actions só serão alterados com reprodução e justificativa registrada.
`frontend/src/hooks/useAuth.ts` e `src/contexts/userContext.tsx`: reprodução
integrada mostrou outra aba conservando os dados de A depois do logout. Esses
consumidores propagam somente invalidação de sessão entre abas, limpam perfil
antes da troca e invalidam leituras pendentes; testes de consumidores e browser
real foram reexecutados. Nenhuma alteração de modelo financeiro ou schema.
`src/test/java/.../domain/habit/HabitIntegrityIntegrationTest.java`: somente a
assertion de meta alheia passa de regra 400 para referência 404, conforme DEC-09,
acrescentando mensagem exata. As assertions de data futura, tipo monetário e
progresso inalterado permanecem. A primeira suíte completa vermelha é preservada.

DEC-09 foi atualizada em `docs/sdd/specs/003-criterios-oracles.md`, mantendo
pendentes os contratos próprios de onboarding de CF-028.

## Entrega e validação em 30/09/2026

Relatório (registro de execução privado), matriz (registro de execução privado)
e comandos/resultados (registro de execução privado) preservam as falhas
causais, os resultados após correção e os limites de cada camada.
Código, testes e contrato no commit local `1b93704`; evidências e checkpoint
registrados no commit documental seguinte, sem alterar os fontes testados.

Entregues: principal JWT vinculado ao UUID assinado, Bearer validado, DTO público
de perfil/preferências, referências inacessíveis 404, reorders atômicos por
owner/parent, exportação com erro uniforme, cookie de 24h e invalidação de sessão
entre abas/respostas pendentes. Nenhuma comunicação real ou mudança de schema.

Gates: backend verify **345/345** (inclui **71 CF-023** e **320 requests 401**),
componentes **157/157**, unitários **18 execuções** em três fusos; typecheck,
lint focado e build Next aprovados. Jornada real navegador→BFF→Spring→PostgreSQL
com duas abas, logout/troca A→B→A, reload e saldos SQL **1000/2300** aprovada.
Mutação isolada do predicado owner detectada por **4/4** testes; cópia restaurada
e fonte compartilhado inalterado por SHA. A revisão independente não foi executada.

Limites: JWT stateless não é revogado por logout/reset; BroadcastChannel foi
validado somente no Chromium, sem fallback para browsers sem suporte. A matriz
delimita ramos sem novo probe de todas as permutações de owner; não certifica
pentest, carga, exclusão completa de usuário nem adoção de banco real.

**Liberada somente a revisão independente de CF-023.** Nenhuma tarefa seguinte
está integralmente liberada: CF-024/028/029/032 ainda exigem as demais
dependências e o aceite independente desta entrega. Estados alheios preservados.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


## Saneamento do marco em 30/09/2026

Os novos comandos e cobertura tiveram ownership/usuários sintéticos distintos no saneamento CF-016–021. Isso não executa a auditoria completa de autenticação, sessão, BFF e superfícies desta tarefa; estado preservado.

Matriz, checkpoints e limitações (registro de execução privado). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.

## Revisão independente conjunta — 30/09/2026

Concluída no escopo entregue após revisão do contrato/diff/consumidores e
execução independente: principalUUID, tokens401, referênciaB/ausente404 com
snapshotSQL, reorders atômicos, DTO/exportação, comandos/recibos e recuperação.
Probes novos cobrem move/realizations/note/copy; a matriz distingue execução de
inspeção. Browser de duas abas A→B→A, BFF/backend/PG/reload e saldos1000/2300
aprovados; componentes e contraprovas independentes de principal/owner aprovados.
Parecer e provas (registro de execução privado).
JWTstateless e BroadcastChannel sem fallback continuam limites contratados;
não se declara cobertura de todos os browsers/pentest/carga/exclusão de usuário.

Aceite independente fornece a dependência de isolamento para **CF-024 apta a
iniciar localmente**, com as condições/dependências comprovadas no parecer
conjunto. Não libera CF-028/029/032 integralmente nem publicação. Adoção real,
RVA-03/CF-019, zoom200% e demais gates conservam seus donos/estados.
