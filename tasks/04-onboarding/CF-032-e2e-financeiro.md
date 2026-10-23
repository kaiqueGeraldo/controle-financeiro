# CF-032 — Validar jornada financeira completa e uso diário

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-021](../03-integridade/CF-021-relatorios.md), [CF-022](../03-integridade/CF-022-habitos-crons.md), [CF-023](../03-integridade/CF-023-isolamento-autenticacao.md), [CF-024](../03-integridade/CF-024-concorrencia-cache.md), [CF-026](../03-integridade/CF-026-lint-tipagem-frontend.md), [CF-031](../04-onboarding/CF-031-entrevista-frontend.md)
- Origem: T-006, T-007, T-008, T-009

## Problema e resultado esperado

Demonstrar que os módulos funcionam juntos com saldo persistido, não somente isoladamente ou com APIs mockadas.

## Escopo e referências

- `controle-financeiro-frontend/tests/`
- `controle-financeiro-backend/src/test/`
- `tasks/evidencias/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Executar registrar→entrevista→receita/despesa→transferência→compra/pagamento→investimento/meta→relatório/exportação→logout/login.
2. Conferir estado após reload e reconciliar patrimônio/saldos/compromissos em pontos definidos pelo oracle.
3. Cobrir usuário legado, contas a receber, prazo/hábito e falha/reenvio durante uma operação monetária; particionar cenários para diagnóstico.

## Aceite e testes adversariais

- [x] Percurso usa Next BFF, Spring e PostgreSQL reais; só integrações externas são substituídas.
- [ ] Reload/nova sessão recuperam o mesmo estado e relatório/exportação concilia; nenhum teste espera apenas toast.
- [ ] Pelo menos um cenário com dois usuários confirma isolamento enquanto ambos usam o app; falhas mantêm invariantes.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

Critério 3: isolamento em H e efeito único sob falha/replay em G permanecem
sustentados. O aumento indevido de E2 foi saneado localmente em 23/10/2026;
critérios 2/3 aguardam revalidação independente dos quatro achados e consumidores.
Os checkboxes continuam pendentes, sem reduzir o critério original nem autoaceite.

## Fora de escopo

Suite monolítica dependente da ordem, E2E fictício com respostas financeiras pré-programadas.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

### Saneamento local — 23/10/2026

CF032-01/02/03/04 **saneados localmente, aguardando revalidação independente**.
CF-032 permanece em_revisao: critérios 1/4 sustentados; 2/3 ainda sem aceite.
Capacidade por fonte incorpora pendências/evidências sob guard transacional;
cartão consome métricas autoritativas; nomes substituem ticker ausente sem mudar
UUID; XLSX conserva HH:mm:ss textual. Provas originais preservadas por hash.

Antes: quatro falhas originais reproduzidas. Depois: 13 selecionados mais S5
dirigido aprovados, sem alegar nova matriz histórica completa; 95 controles backend
(incluem replay e capacidade após CLOSE/ASSIGN), 54 de componentes (19 novos incluídos),
quatro contraprovas causais detectadas/restauradas e checks pertinentes aprovados.
Reconciliação B/C, UNKNOWN/PARTIAL, G/H, nova sessão e bytes do XLSX preservados.
[Causas, provas, comandos, custos e limites](../evidencias/saneamento-CF-032/README.md).

README raiz mantém o hash histórico fora dos commits; runtimes anteriores intactos.
Sem sucessoras, push, merge, deploy, banco real ou aprovação de zoom/adoção/carga.
Próximo passo: revalidação independente dos quatro achados e dos critérios 2/3.

### Revisão anterior — 23/10/2026

Revisão independente de23/10/2026 sobre123e5a5: **em_revisao**, critérios1/4
sustentados,2/3 pendentes. CF032-01/02/03 confirmados P2; CF032-04 confirmado P3
por truncagem textual na exportação, com segundos preservados em API/SQL.
R1 comprova permissões legítimas; R2 confirma limite incorreto após nova sessão
e seleção distinta das posições sem ticker; R3 isola a precisão do arquivo.
Reprodução dirigida8 cenários4/4,9 controles de reserva aprovados, cálculos
independentes e inspeção OOXML; nenhuma correção de produto ou sucessora iniciada.
[Parecer e matriz independentes](../evidencias/revisao-CF-032/README.md).
Próximo passo: saneamento delimitado por causa e revalidação dos probes intactos;
aceites anteriores e gates de zoom/adoção/desempenho preservados.

### Entrega inicial — 22/10/2026

Entrega local de validação em 22/10/2026 na branch `codex/cf032-e2e-financeiro`,
base integrada `331d3344c24dc60f5e1940989b9a35c0d5da1aa6`, **em_revisao sem sucesso
integral**. Matriz/oracles anteriores aos testes: 13 jornadas distintas, 9 passaram/4
falharam, 40 controles PostgreSQL aprovados, 6 unitários temporais em 3 fusos, quatro
contraprovas causais detectadas e fontes restauradas por hash. Lint/typecheck/build
e compilação/parsing pertinentes aprovados. Subconjuntos/reruns não são somados.

Patrimônio/saldos/reservas reconciliados, downloads lidos por POI, reload/nova sessão,
isolamento A/B e efeito único pós-commit comprovados no alcance executado. Pendentes:
CF032-01/P2 (reserva por fonte incerta), 02/P2 (limite disponível da UI), 03/P2
(nomes de posições sem identificador) e 04/P3/precisão (segundos no XLSX). Essas
regressões continuam vermelhas, sem correção silenciosa de produto.

[Entrega, comandos e falhas preservadas](../evidencias/CF-032/README.md) ·
[Cobertura/reconciliação/limites](../evidencias/CF-032/RESULTADOS.md) ·
[Achados e saneamento delimitado](../evidencias/CF-032/ACHADOS.md).
README raiz preexistente preservado por SHA256 e fora dos commits; sem publicação,
merge, deploy, banco real, autoaceite ou sucessoras. DEC-ONB-03, aceites anteriores,
zoom 200% CF010/015 e adoção CF017/P01/P02 preservados. Próximo passo: revisão
independente desta validação e saneamento dos pontos delimitados, conforme o parecer.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


## Saneamento do marco em 30/09/2026

O saneamento CF-016–021 possui jornadas reais navegador→BFF→Spring→PostgreSQL→reload, além de downloads e inspeção 360/768/1440. Essa prova localizada não encerra a matriz futura de E2E/onboarding nem o zoom nativo 200%; estado preservado.

[Matriz, checkpoints e limitações](../evidencias/saneamento-CF-016-CF-021/README.md). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.
