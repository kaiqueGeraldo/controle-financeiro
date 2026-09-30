# CF-017 — Criar migrações reproduzíveis e plano para banco legado

- Estado: em_revisao
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

- [x] Migrações aplicam uma vez e nova execução é estável; constraints e versões ficam verificadas.
- [x] Fixture de dados permanece reconciliada após upgrade; falha de migração não deixa versão falsamente aplicada.
- [ ] Compatibilidade com banco real só pode ser concluída com schema/backup conhecidos; caso contrário registrar bloqueio dessa parte.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

ddl-auto update ou baseline-on-migrate indiscriminado em produção; reset de banco não descartável.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Preparação de 13/09/2026: [derivada P01/P02 de adoção temporal](CF-017-P01-P02-adocao-temporal.md).
Há candidato aditivo e testes sintéticos; CF-017 não foi executada nem concluída.

Execução local de 22/09/2026 sobre `2269b22`: Flyway 11.14.1, V1 pré-temporal,
V2 aditiva, fixture legada independente, Hibernate validate, checksum,
falha/recuperação e backup/restore sintético implementados e aprovados em PostgreSQL
16 descartável. `ddl-auto=update` local foi substituído por `validate`; baseline
automática e clean permanecem desabilitados. [Evidência, inventário e rollout](../evidencias/CF-017/README.md).
Implementação/testes: `ae494c0be844dc1d7fa3d39073ab2acef2005533`.

Permanece `em_revisao`: schema/volume/backup/restore reais não existem nesta base.
Logo compatibilidade Railway, baseline real, deploy e liberação de writers
continuam não comprovados e bloqueados. CF-018 não foi iniciada.

Revisão independente de 22/09/2026: a cadeia local V1/V2 foi aprovada como base
para iniciar CF-018 em PostgreSQL descartável. Adoção real permanece bloqueada e
o preflight sintético aceita ao menos uma incompatibilidade de FK; o restore
sintético também possui oracle parcial. Estado mantido `em_revisao` para não
confundir fundação local apta com baseline/publicação autorizadas.
[Parecer, achados e execuções](../evidencias/revisao-CF-017/README.md).

## Saneamento do marco em 30/09/2026

Saneamento acrescentou V6–V11 sem editar V1–V5. Provas locais de banco vazio/legado/upgrades, checksum, falha/recuperação e Hibernate validate em PostgreSQL descartável. V11 não fabrica cobertura para legados. RV17-01/RV17-02, inventário/backup/restore e adoção reais permanecem pendentes; não há autorização para publicação.

[Matriz, checkpoints e limitações](../evidencias/saneamento-CF-016-CF-021/README.md). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.
