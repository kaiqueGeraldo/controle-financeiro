# CF-025 — Medir e corrigir N+1 e consultas ineficientes

- Estado: em_execucao
- Prioridade: P2
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-021](../03-integridade/CF-021-relatorios.md), [CF-022](../03-integridade/CF-022-habitos-crons.md), [CF-024](../03-integridade/CF-024-concorrencia-cache.md)
- Origem: T-009; F-013

## Problema e resultado esperado

Há busca por item na reordenação e risco de carregamento de coleções. Otimizar somente depois de medir comportamento real do banco.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/AccountService.java`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Registrar contagem SQL, dataset, p95 e EXPLAIN de extrato/agregados/listas/reorder antes da alteração.
2. Substituir consultas por item quando comprovadas, revisar índices e predicados de datas; preservar paginação e posse.
3. Explicar Big-O antes/depois: round trips de reorder, leitura de coleções e sorting; separar memória de latência SQL.

## Aceite e testes adversariais

- [ ] Datasets crescente/pequeno mostram contagem de consultas sem N+1 nas rotas corrigidas.
- [ ] Projeção/fetch join não duplica linhas nem quebra limites/paginação; valores permanecem conciliados.
- [ ] Comparação reproduzível confirma benefício sem piorar isolamento, lock ou carga de memória.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Adicionar cache distribuído, índices ou fetch join de coleção paginada sem evidência.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Execução iniciada em 01/10/2026 sobre `846c64c`, conforme prontidão local
aprovada na revisão CF-024. Staging inicial vazio; `README.md` preexistente
preservado e excluído do escopo/commits. Medições e testes novos ficam em
`src/test/java/com/controlefinanceiro/api/service/`, correspondendo aos services
do escopo, com PostgreSQL descartável e Flyway integrado. Nenhuma outra tarefa
será implementada; CF-022 continua com ressalva de browser.

Medições/testes em execução; fechamento registrado em `tasks/evidencias/CF-025/README.md`
com o [template](../templates/EVIDENCIA.md). Evidência das correções anteriores
não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


## Saneamento do marco em 30/09/2026

Checklist usa duas queries em lote; cobertura usa dois agregados por escopo; H-02 comprova export consistente com páginas 500/SXSSF 100. Custos MVCC/conexão durante geração, bytes finais em memória e replay O(operações) estão documentados. Benchmark/plano/índices/limites de volume desta tarefa não foram executados; estado preservado.

[Matriz, checkpoints e limitações](../evidencias/saneamento-CF-016-CF-021/README.md). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.

## Prontidão local após revisão independente — 01/10/2026

**CF-025 apta a iniciar localmente.** Estado `pronta`, sem implementação,
benchmark ou otimização iniciados. Ver [parecer F](../evidencias/revisao-CF-024/README.md).

CF-021 tem agregados/export/posição aceitos no próprio escopo; CF-024 concluiu
as invariantes backend, protocolo opcional e cache após commit delimitados na
revisão. CF-022 conserva `em_revisao` por RJ-022-01, mas seu backend DEC-08,
calendário/locks/migrações necessários já está aprovado no parecer conjunto.
Novo timeout H24-01 no gate ampliado permanece inconclusivo; caso isolado passou,
sem demonstração de corrupção ou pré-condição financeira indefinida que impeça
medir queries localmente. Não se declarou toda a suíte ampliada aprovada.

Preservar ownership, paginação, saldos/recibos, ordem dos locks e AFTER_COMMIT
ao otimizar; medir SQL/dataset/p95/EXPLAIN antes de alterar. RV24-01/02 pertencem
a consumidores/exclusão, não são transferidos para esta tarefa. Permanecem
RVA-03, RJ-022-01, H24-01, RV17-01/02, adoção real, zoom200% e cadeia de release.
Essa prontidão não equivale a liberação de produção nem conclusão de CF-022.
