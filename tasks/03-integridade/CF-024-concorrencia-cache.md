# CF-024 — Corrigir concorrência financeira e cache após commit

- Estado: bloqueada
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-018](../03-integridade/CF-018-contas-transacoes.md), [CF-019](../03-integridade/CF-019-cartoes-faturas.md), [CF-020](../03-integridade/CF-020-investimentos-metas.md), [CF-023](../03-integridade/CF-023-isolamento-autenticacao.md)
- Origem: T-009; F-007

## Problema e resultado esperado

Transações e @Version existem, mas não há evidência de que chamadas simultâneas, retry e cache preservam dinheiro e resultado visível.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/listener/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Criar concorrência real com transações/conexões separadas e barreiras determinísticas, não duas chamadas sequenciais.
2. Cobrir pagamento, transferência, venda e aporte sobre a mesma fonte; testar rollback, eventos e invalidação após commit.
3. Tratar conflito com resposta recuperável e documentar idempotência/locks necessários, custo e risco de deadlock.

## Aceite e testes adversariais

- [ ] Duas escritas não perdem saldo nem duplicam débito; conflito/retry produz resultado explícito e testado.
- [ ] Cache não publica resultado que fez rollback e não permanece desatualizado após commit.
- [ ] Teste observa banco após ambas as transações; remover proteção crítica faz assertion de integridade falhar.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Usar sleep como sincronização ou serializar testes para esconder corrida; lock global sem medir impacto.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Preparação conferida em 30/09/2026 sobre `a21ecdb`; implementação não iniciada
por gate de dependência. Ver [evidências CF-024](../evidencias/CF-024/README.md)
e [preflight verificável](../evidencias/CF-024/preflight.json). Os critérios de
aceite permanecem pendentes; evidência das correções anteriores não equivale à
conclusão desta tarefa.

Dependência concreta encontrada no saneamento CF-015/R03: fechamento repetido
de fatura PAID debitava novamente; chamadas concorrentes também não tinham uma
resposta de conflito consistente. O saneamento adiciona lock por cartão e recusa
antes do débito, com regressões PostgreSQL sequencial/concorrente. Ver
[decisões e limites](../evidencias/saneamento-CF-015/DECISOES.md).
Isso não executa nem conclui CF-024. Permanecem nesta tarefa a idempotência
durável por operação (incluindo adiantamentos), recibo recuperável após perda de
resposta e a matriz de concorrência entre writers/fontes distintas. O frontend
mantém resultado desconhecido e não reenvia; sessionStorage não é garantia
financeira entre abas/dispositivos ou após sua perda. Revalidar ordem de locks,
rollback e cache após commit no escopo desta tarefa, sem inferir cobertura a
partir do lock localizado de CF-015.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Saneamento do marco em 30/09/2026

O saneamento implementa intenção/fingerprint/recibo recuperável para pagamento e comandos diretos exigidos pelo marco, com PostgreSQL/reload e perda de resposta. Locks por fonte/contas ordenadas e H-01 têm provas independentes. Não há certificação transversal de todos os writers/caches, multitab/dispositivo ou preservação da identificação após perda do sessionStorage; estado preservado.

[Matriz, checkpoints e limitações](../evidencias/saneamento-CF-016-CF-021/README.md). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.

## Gate de início — 30/09/2026

CF-018/019/020/023 têm commits de produto ancestrais da base, porém conservam
`em_revisao`. A entrega mais recente da
[CF-023](CF-023-isolamento-autenticacao.md) libera **somente sua revisão
independente** e exige seu aceite antes de liberar integralmente CF-024.
Não há esse aceite registrado na base inspecionada. O pedido de executar apenas
CF-024 respeitando dependências não autoriza executar ou aprovar CF-023 nesta
sessão. Por isso CF-024 fica `bloqueada`, sem alteração de produto/testes e sem
certificação transversal de concorrência/cache.

Retomada: integrar o parecer independente de CF-023 e uma liberação explícita
do recorte local de CF-024 considerando CF-018/019/020. Seus estados e gates
não foram alterados. RVA-03 permanece uma pendência delimitada de interação de
pagamento, sem prova de defeito financeiro transversal; não é a causa deste
bloqueio. README raiz preservado byte a byte e fora do staging. Nenhuma tarefa
sucessora (CF-025/027/030/032) foi liberada por esta preparação.
