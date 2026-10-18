# CF-022 — Validar hábitos e execução dos crons

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-006](../01-datas-integracao/CF-006-datas-backend.md), [CF-017](../03-integridade/CF-017-migracoes.md)
- Origem: T-010; investigação temporal

## Revisão independente da investigação — 16/10/2026

**Permanece em_revisao**, por saneamento atual do harness e das fixtures no
critério4. [Parecer, matriz completa e contraprovas](../evidencias/revalidacao-CF022/README.md),
candidato0bab205: critérios funcionais1–3 sustentados pelos aceites rastreáveis e
provas conferidas. RJ-022-01 confirma distorção de animações pelo relógio completo;
Date-only remove o mecanismo sem deslocar o dia. H24-01 confirma dependência da
carga residual: contraprova fresca→residual→isolada resulta2→1006→2 leituras.
Nenhuma causa dos timeouts históricos foi demonstrada e nenhuma correção de
produto é indicada. Não condicionar saneamento à reprodução retroativa impossível.

Próximo lote restrito: Date-only no browser.cjs de hábitos e isolamento entre
métodos do scheduler, preservando assertions, prazo10s e caso501; validar
diário/semanal/reload/SQL e ordens volume→callback/inversa. A revisão não implementou
essas mudanças. Cumpridas as condições, registrar ocorrências antigas como
inconclusivas não bloqueantes com gatilhos de reabertura, sem exigir novo timeout.
CF029 conserva prontidão exclusivamente local/descartável e não foi executada.
Demais aceites/pendências preservados. Checkbox4 abaixo reflete esta pendência
atual de confiabilidade das provas, sem retirar os aceites funcionais anteriores.

## Investigação dirigida — 16/10/2026

Estado `em_revisao` preservado. [Diagnóstico, matriz e provas](../evidencias/investigacao-CF022/README.md):
RJ-022-01 tem interferência do clock completo demonstrada no caminho de hábitos,
mas sem reprodução do timeout histórico; H24-01 tem sensibilidade ao volume de
fixtures demonstrada, sem causa histórica fechada. São investigações distintas.
Nenhuma correção de produto ou harness compartilhado aplicada; próximos
experimentos discriminantes e revisão independente delimitados por identificador.

A pendência de revisão LAZY/consumidores citada na reconciliação de03/10 abaixo
já foi satisfeita pelo [parecer CF-025](../evidencias/revisao-CF-025-CF-027-RV24/README.md#parecer-cf-025--concluída)
e sua [matriz critérios1–4](../evidencias/revisao-CF-025-CF-027-RV24/MATRIZ.md),
base06c1a51. Essa atualização documental não é novo aceite desta investigação e
não encerra RJ-022-01/H24-01. Demais aceites/dependências e prontidão local CF029
preservados; sem adoção real, onboarding ou publicação de commits novos.

## Reconciliação de pendências — 03/10/2026

Estado `em_revisao` mantido. Categoria 3: RJ-022-01 (interação semanal sem POST) e H24-01 (timeout de scheduler) exigem classificações separadas com DOM/rede/calllog e locks/fixtures. Categoria 1 na alteração posterior CF-025: LAZY e consumidores aguardam revisão própria. Backend DEC-08 aceito mantém liberações locais CF-025/027; verdes posteriores não encerram as causas.

[Critérios, pareceres, bases, alterações posteriores e efeitos nas dependências](../evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md). As seções anteriores de execução/revisão conservam sua data e alcance; esta nota não é novo aceite independente.

## Problema e resultado esperado

Hábitos dependem de dia/semana, ofensiva e jobs. O fuso do servidor e uma execução repetida não devem alterar contagem ou progresso vinculado.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/HabitService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/HabitCronService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/habit/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Especificar exemplos do comportamento existente de frequência/perdão, deixando ambiguidades explícitas.
2. Testar diário/semanal, marcar/desmarcar, semana/ano novo, repetição do job e vínculo com meta numérica.
3. Validar lock/scheduler no PostgreSQL isolado sem e-mail real.

## Aceite e testes adversariais

- [x] Mesmo dia não ganha registros/progresso duplicados; desfazer marcação desfaz efeito correspondente.
- [x] Trocar TZ da JVM não desloca dia do hábito definido no contrato; virada semanal preserva meta semanal.
- [x] Duas execuções/retry do job preservam invariantes de ofensiva e histórico.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Novo módulo de rotina ou mudar regra de perdão sem decisão de produto.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Execução iniciada em 30/09/2026 sobre `6f0d474`. A revisão dirigida de resíduos
[libera CF-022 localmente](../evidencias/revalidacao-CF-016-CF-021-residuais/README.md),
usando a fundação descartável CF-006/017 integrada; não libera produção.
README raiz alheio preservado e excluído dos commits. DEC-08 aprovada pelo usuário
nesta execução; [contrato e exemplos independentes](../evidencias/CF-022/CONTRATO.md).
Exceções de caminho necessárias: migração aditiva em `src/main/resources/db/migration/`
para vínculo persistido de contribuição; testes em `src/test/java/.../domain/habit/`
e adaptação dos consumidores temporais existentes em `src/test/java/.../service/`.
Esses caminhos permitem validar Flyway/Hibernate e preservar o contrato temporal.
`domain/goal/GoalHistory.java`: retirar geração automática que sobrescreve o
Clock explícito nos dois writers existentes (HabitService e GoalService);
validação inclui consumidores de metas e contratos temporais. Os três testes
existentes de migração passam a exigir a versão 12 e checksum de V12, mantendo
todas as assertions históricas; adaptação restrita ao novo inventário aprovado.
SPEC-002 e matriz DEC-08 atualizadas para refletir a decisão explícita do usuário;
nenhuma outra tarefa foi iniciada. Harness de browser e isolamento de schema
ficam em `src/test/java/.../domain/habit/`, sem alterar produto frontend.

Entregue e validada localmente em 30/09/2026, código
`bb14aa2e91f55db6f6d9c0651ccd65e439096210`: ofensivas recalculadas por calendário,
semana segunda–domingo, perdão preservado, configuração semanal respeitada,
travas hábito/meta, contribuição identificada e reversível, transação por hábito,
paginação keyset e V12 aditiva sem inferir legado. `streak_as_of` impede que uma
operação atrasada na meia-noite apague o calendário observado mais recentemente.

Gate final:274 testes backend/JVM UTC com verify e JAR;36 testes dirigidos/JVM
UTC+14;16 contratos temporais/JVM São Paulo. Zero falhas/erros/skips nesses gates.
Quatro jornadas reais diário/semanal em navegadores São Paulo/UTC+14, com
Next/BFF/Spring/PostgreSQL e persistência após reload; quatro mutações detectadas
na cópia isolada, restaurada por hash. Vermelhos, ajustes legítimos de fixtures,
comandos, capturas, custos e limites: [evidência CF-022](../evidencias/CF-022/README.md).

Permanece `em_revisao`: autotestes não substituem execução independente. Legado
sem identidade precisa de reconciliação para desfazer contribuição; adoção real
continua no gate CF-017. Nenhuma tarefa seguinte integralmente liberada:
CF-025/027/032 conservam suas outras dependências e o aceite desta revisão.
Somente a revisão independente da CF-022 fica pronta; nenhuma próxima foi iniciada.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Revisão independente conjunta — 30/09/2026

Backend aprovado no recorteDEC-08: calendário diário/semanal, efeitos reversíveis,
streak_as_of, concorrência real/rollback/retry, legado sem identidade, V12/upgrades/
validate e consumidoresGoalHistory. Probe novo executa o callback registrado no
worker real do TaskScheduler e comprova o lockShedLock pelo banco; mutação sem
SchedulerLock o faz falhar. Probes variam o defaultJVM após startup nos três
fusos, sem confundir o parâmetro de invocação com o timezone efetivo do app.
[Parecer, matriz e contraprovas](../evidencias/revisao-CF-022-CF-023/README.md).

**Permanece em_revisao por RJ-022-01.** Quatro jornadas browser→BFF→backend→PG/
reload passaram na execução diagnóstica, mas a tentativa semanal anterior
expirou sem POST e sua causa não foi estabelecida. Verde posterior não é
resolução. Falta classificar a confiabilidade do caminho/prova integrada e
demonstrar causalmente a correção, se necessária, conforme
[condição objetiva](../evidencias/revisao-CF-022-CF-023/ACHADOS.md).
Não se declarou defeito de calendário/PG sem prova. Não bloqueia a implementação
localCF-024, cuja dependência não inclui hábitos; produção continua não liberada.

## Evidência adicional durante revisão CF-024 — 01/10/2026

Estado permanece `em_revisao`; RJ-022-01 não foi encerrado. A execução ampliada
da revisão CF-024 observou timeout no segundo callback registrado de scheduler
(teste:268); o mesmo caso passou isolado com limite10s/assertions intactos.
[H24-01](../evidencias/revisao-CF-024/ACHADOS.md) registra logs/thread dump,
incerteza causal e condição de encerramento. É distinto do problema de browser
RJ-022-01. Não há prova de corrupção financeira; o backend já aprovado permite
início local de CF-025 com fixtures isoladas, conforme o parecer dessa revisão.
