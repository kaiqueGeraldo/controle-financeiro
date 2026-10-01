# Achados e limitações — revisão CF-024

Base de produto `dbf828e`, HEAD auditado `f225657`. Nenhum defeito abaixo foi corrigido nesta revisão. Caminhos são relativos à raiz do repositório; linhas referem-se à base auditada.

## RV24-01 — P1 — criação pode ser reenviada sem identidade após resultado desconhecido

**Defeito confirmado no consumidor; risco de efeito financeiro duplicado.** Local: `controle-financeiro-frontend/src/components/forms/newTransactionModal.tsx:71` (envio sem operationId), `:87–92` (erro genérico e liberação da trava). Não é falha do protocolo com chave de DEC-10: o consumidor não o utiliza.

Reprodução: [probe de componente](probes/unknown-creation.test.tsx) usa o formulário real e um double apenas no serviço. Primeira submissão recebe ApiError502 com requiresReconciliation=true; segunda submissão ainda dispara create. Esperado: uma chamada até resolver o resultado desconhecido, ou repetição da mesma intenção durável segundo contrato adotado. Observado: duas chamadas e nenhum operationId na primeira. [Log vermelho](consumidor-desconhecido-red.log): expected1, received2. O [probe PostgreSQL](probes/Cf024IndependentReviewTest.java), caso reviewLegacyUnkeyedCallsHaveTwoEffectsAsDocumented, demonstra separadamente que duas criações sem chave de25 deixam conta1050, dois fatos e zero recibos novos.

Essas provas não simulam corte TCP nem formam uma jornada E2E única. Combinam uma decisão de UI reproduzida e a semântica persistente real; se a primeira chamada tiver comitado antes de a resposta se perder, a segunda pode repetir dinheiro. operationModal.tsx:107/127–131 também envia sem chave e apenas solicita reload opcional antes de liberar envio; é risco estático relacionado, sem contraprova dinâmica independente equivalente nesta revisão.

Critério: segurança de mutação/reconciliação de AC-UI-009 e resultado recuperável de AC-UI-005, coerente com FIN-07; o contrato novo explicitamente não dá idempotência ao legado sem chave. AC-FIN-010/R03/RV01 do pagamento não foram declarados falhos por esse achado. O critério consumidor não pode ser aceito usando apenas HTTP sintético com chave.

Responsável: [tarefa derivada RV24-01](../../01-datas-integracao/RV24-01-criacao-resultado-desconhecido.md), domínio de mutações/reconciliação CF-009 e integração CF-018/020; CF-032 conserva validação integrada. Não transferido para otimização CF-025. Encerramento: teste causal do formulário fica verde por tratamento demonstrado (bloqueio/reconciliação segura ou preservação durável da mesma chave/corpo), integração após resposta descartada confirma um único efeito e retry de payload diferente é rejeitado; intenções novas legítimas iguais continuam possíveis. Incluir operação de investimento e comportamento após reload/perda da identidade nos limites declarados. Não basta toast nem trava somente durante request.

## RV24-02 — P2 — exclusão de usuário com pagamento vinculado falha por FK

**Defeito funcional confirmado e herdado.** Local: `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/UserService.java:82`. O bulk delete remove CardTransaction ainda referenciada por CardPaymentAllocation. O método não organiza a limpeza desses vínculos antes dos pais.

Reprodução: criar owner/conta/cartão, registrar compra, pagar e executar UserService.deleteAccount pelo proxy real. Esperado no contrato funcional de exclusão: concluir a limpeza autorizada dos dados do proprietário, sem violar integridade referencial nem afetar outro proprietário. Observado: Hibernate ConstraintViolationException, FK de card_payment_allocations para card_transactions. [Contrato vermelho](exclusao-contrato-red.log) e [XML](exclusao-contrato-red.xml) mantêm assertThatCode(...).doesNotThrowAnyException() falhando. O caso reviewLinkedDeletionProbeKeepsRollbackAndCacheOnFailure verifica separadamente que transação aborta, owner e dados permanecem e cache não é invalidado; passou no conjunto final.

Critério: funcionalidade de UserService.deleteAccount prometida pelo fluxo de exclusão. Não é prova de violação do AFTER_COMMIT: rollback conservou o cache corretamente. A exclusão completa entre domínios foi explicitamente excluída do aceite anterior da CF-023 e da entrega bare deletion da CF-024; não se reescreveu esse aceite como se houvesse cobertura prévia.

Responsável: [tarefa derivada RV24-02](../../03-integridade/RV24-02-exclusao-usuario-vinculos.md), domínio identidade/limpeza de dados e contratos financeiros vinculados. Encerramento: ordenar/definir limpeza por dependências reais, passar o contrato vermelho com usuário vinculado e outro owner intacto, verificar ausência de órfãos, rollback de falha intermediária, recibos V13/herdados e invalidação somente após commit. A solução deve considerar outros vínculos, sem assumir que trocar apenas duas linhas resolve todo o grafo. Email externo após commit não está validado; usar double na investigação.

## H24-01 — P2 de investigação — timeout de scheduler na suíte ampliada

**Execução inconclusiva; causa não demonstrada.** Local de observação: `controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit/HabitIntegrityIntegrationTest.java:268`, segundo dispatcher.schedule(...).get(10, SECONDS) do caso independentRegisteredSchedulerCallbackUsesProductTriggerAndDatabaseLock. [Gate ampliado](afetados-verify.log):119 testes, zero falhas de assertion, um erro TimeoutException. [Thread dump](afetados-threads.txt): worker scheduling-1 em espera de socket PostgreSQL no carregamento de coleção via HabitRepository.findForUpdate/HabitCronService; main esperando Future. Não foram capturados SQL bloqueador/locks suficientes para concluir causa.

Esperado: callback completa dentro do limite já existente e verifica exatamente um efeito/streak. Observado: timeout nessa execução; o [mesmo caso isolado](scheduler-isolado.log) passou1/1 sem alterar limite, assertions ou código. Hipóteses de contenção/fixtures compartilhadas/recursos não são defeito comprovado. Não afirmar que o verde posterior resolveu nem que houve corrupção financeira.

Responsável: CF-022, acompanhamento H24-01 distinto de RJ-022-01. Encerramento: reproduzir com inventário de fixtures, conexões, pg_stat_activity/pg_locks e barreiras, identificar causa ou limite de ambiente com evidência; se houver correção, contraprova causal e conjunto afetado passam sem mascarar falha com sleep/aumento cego de timeout. CF-022 continua em_revisao. Isso limita o resultado da suíte ampliada; não torna inválidas as provas backend específicas nem bloqueia automaticamente medição local da CF-025.

## Limitações comprovadas ou não certificadas

- **L24-01, protocolo herdado:** financial_commands retorna resultado vivo. Após estorno, replay da baixa mostra status REVERSED com o mesmo ID, sem novo dinheiro. Não é snapshot imutável V13. Uma evolução desse contrato precisa tarefa própria/versionamento; não mudar expectativa dos clientes silenciosamente.
- **L24-02, cache:** callback após commit pode falhar e deixar entrada sintética antiga, sem rollback financeiro. Falha foi injetada no listener real por advice e HTTP continuou200 com recibo durável. Não há retry durável; não ativar leitores inferindo política completa a partir destes testes. Responsável por futura adoção de cache deve definir recuperação e testar concorrência de leitores.
- **L24-03, alcance:** não houve restart, corte TCP, vários dispositivos/instâncias, carga, rede externa, cache distribuído ou auditoria de todo writer. Perda da chave no cliente continua limite. Namespaces de protocolos antigos são separados e colisão concorrente entre todos os recursos antigos não foi exaustivamente testada.
- **L24-04, histórico de execução:**388/388 backend,157 componentes e typecheck são evidências do executor com hashes conferidos, não novos resultados desta revisão. A classe final30 foi reexecutada, inclusive deadlock. JAR histórico não foi revalidado byte a byte porque target foi reconstruído.

Permanecem abertos RVA-03, RJ-022-01, RV17-01/RV17-02, adoção real e zoom200%. Os novos achados não encerram nem substituem esses IDs. Nenhum deles foi usado como bloqueio automático de toda atividade local.
