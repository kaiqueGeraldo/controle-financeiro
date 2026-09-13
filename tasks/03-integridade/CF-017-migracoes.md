# CF-017 — Criar migrações reproduzíveis e plano para banco legado

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-002](../00-fundacao/CF-002-ambiente-backend.md), [CF-016](../03-integridade/CF-016-regras-financeiras.md)
- Origem: T-005; F-011

## Problema e resultado esperado

Produção valida schema, local o altera automaticamente e não há migrações versionadas. Banco vazio e atualização de schema precisam ser reproduzíveis sem comprometer legado.

## Escopo e referências

- `controle-financeiro-backend/pom.xml`
- `controle-financeiro-backend/src/main/resources/`
- `controle-financeiro-backend/src/test/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Escolher/configurar migrador compatível com Spring Boot 4; criar baseline de schema documentado incluindo ShedLock.
2. Testar schema vazio e fixture de schema legado com dados sintéticos representativos; validar Hibernate após migração.
3. Inventariar banco remoto somente em leitura quando identificado; documentar backup/restore e diferenças. A falta desse inventário não impede testar baseline sintético, mas impede certificar compatibilidade com Railway.

## Aceite e testes adversariais

- [ ] Migrações aplicam uma vez e nova execução é estável; constraints e versões ficam verificadas.
- [ ] Fixture de dados permanece reconciliada após upgrade; falha de migração não deixa versão falsamente aplicada.
- [ ] Compatibilidade com banco real só pode ser concluída com schema/backup conhecidos; caso contrário registrar bloqueio dessa parte.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

ddl-auto update ou baseline-on-migrate indiscriminado em produção; reset de banco não descartável.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Preparação de 13/09/2026: [derivada P01/P02 de adoção temporal](CF-017-P01-P02-adocao-temporal.md).
Há candidato aditivo e testes sintéticos; CF-017 não foi executada nem concluída.

Ainda não executada. Usar `tasks/evidencias/CF-017/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.
