# CF-002 — Preparar backend e PostgreSQL isolados para testes

- Estado: concluida
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: nenhuma
- Origem: T-005; F-011, F-012, F-016

## Problema e resultado esperado

Hoje há só contextLoads, Docker não foi encontrado no PATH e o wrapper falhou no ambiente local. Precisamos de execução limpa e sem banco real.

## Escopo e referências

- `controle-financeiro-backend/pom.xml`
- `controle-financeiro-backend/mvnw.cmd`
- `controle-financeiro-backend/src/test/`
- `controle-financeiro-backend/src/main/resources/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Fixar Java 21 de verificação, diagnosticar wrapper Windows sem substituir indiscriminadamente scripts gerados.
2. Criar perfil/infra descartável PostgreSQL com JUnit e doubles de e-mail/cotação; fornecer caminho CI quando Docker local não existir.
3. Garantir isolamento, limpeza e falha clara se alguém configurar banco que não seja de teste; schema temporário aqui não é baseline de produção.

## Aceite e testes adversariais

- [x] Checkout limpo consegue executar teste de persistência e rollback no PostgreSQL descartável; runtime/comando documentados.
- [x] Teste em usuário A não vê fixture de B e nenhuma comunicação externa real ocorre.
- [x] Erro de conexão é reportado como ambiente indisponível; não passar contextLoads removendo toda a configuração útil.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Migrar ou resetar Railway; adoção de H2 como comprovação de comportamento PostgreSQL; desligar teste para deixar build verde.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Iniciada e concluída em 07/09/2026 sobre a base `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, preservando o patch anterior. O wrapper Windows foi corrigido de forma localizada; o build exige JDK 21; o perfil `test` inicia exclusivamente `postgres:16-alpine` via Testcontainers, usa schema efêmero e substitui e-mail/cotação por doubles. O CI backend passou a executar `clean verify` em vez de empacotar com testes ignorados.

Validação local com Temurin 21.0.12.1, Maven 3.9.12, Docker Desktop 4.83.0/Engine 29.6.2 e Testcontainers 2.0.3: `mvnw.cmd --batch-mode clean verify` aprovou 7 testes, incluindo persistência após `flush/clear`, rollback observado fora da transação, isolamento A/B, ausência de chamadas aos doubles e quatro recusas/aceites adversariais do guard. A execução foi repetida, gerou o JAR e deixou zero contêineres Testcontainers ativos. Com Docker desligado, a suíte falhou explicitamente como ambiente indisponível e declarou que nenhum banco externo seria usado.

Evidência completa, comandos e limitações (registro de execução privado). O `ddl-auto=create-drop` existe somente no perfil de teste e não é baseline de produção; inventário/migrações continuam pertencendo à CF-017. O workflow foi atualizado por ser o caminho CI exigido quando Docker local não existir, única alteração de implementação fora dos caminhos originalmente enumerados.

Dependências: nenhuma nova tarefa ficou integralmente liberada apenas por esta conclusão. CF-006 ainda depende de CF-004; CF-008, de CF-003 e CF-004; CF-017, de CF-016; CF-007 e CF-023 mantêm dependências adicionais. CF-003 continua pronta e CF-004 já havia sido liberada pela CF-001. Nenhuma tarefa seguinte foi iniciada nem teve estado alterado.


## Revisão independente — 09/09/2026

PostgreSQL descartável, JDK 21 e suíte completa revalidados; R16 fortalece a observação do Clock real.

O parecer da revisão (registro de execução privado) prevalece
sobre a conclusão histórica acima para o aceite atual. Somente o conjunto final
foi verificado; commits intermediários não são apresentados como testados.
