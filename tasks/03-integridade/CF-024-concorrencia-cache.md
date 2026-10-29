# CF-024 — Corrigir concorrência financeira e cache após commit

- Estado: concluida
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

- [x] Duas escritas não perdem saldo nem duplicam débito; conflito/retry produz resultado explícito e testado.
- [x] Cache não publica resultado que fez rollback e não permanece desatualizado após commit.
- [x] Teste observa banco após ambas as transações; remover proteção crítica faz assertion de integridade falhar.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Usar sleep como sincronização ou serializar testes para esconder corrida; lock global sem medir impacto.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Preparação conferida em 30/09/2026 sobre `a21ecdb`; implementação não iniciada
por gate de dependência. Ver evidências CF-024 (registro de execução privado)
e preflight verificável (registro de execução privado). Os critérios de
aceite permanecem pendentes; evidência das correções anteriores não equivale à
conclusão desta tarefa.

Dependência concreta encontrada no saneamento CF-015/R03: fechamento repetido
de fatura PAID debitava novamente; chamadas concorrentes também não tinham uma
resposta de conflito consistente. O saneamento adiciona lock por cartão e recusa
antes do débito, com regressões PostgreSQL sequencial/concorrente. Ver
decisões e limites (registro de execução privado).
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

Matriz, checkpoints e limitações (registro de execução privado). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.

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

## Retomada local após revisão independente — 30/09/2026

**CF-024 apta a iniciar localmente.** Estado `pronta`, anterior à execução;
nenhuma implementação/probe de CF-024 foi iniciada. O bloqueio de `9ff1aec`
acima é histórico e foi superado pelo aceite independente de CF-023 e pelo
confronto das dependências no
parecer conjunto (registro de execução privado).

CF-018 e CF-020 têm critérios próprios aceitos/concluídos; CF-019 permanece
em_revisao por RVA-03, mas pagamento/intenção/fingerprint/recibo e invariantes
backend necessários estão definidos, integrados e aprovados no recorte.
CF-023 concluiu isolamento de principal/owner/sessão/BFF/recibos. A base de
migrações local foi comprovada até V12, sem aprovar adoção real.

RVA-03 mostrou modal sem recuperação depois de POST200/débito120/pagável0;
não mostrou dinheiro perdido, débito duplicado ou pré-condição indefinida que
impeça iniciar a matriz de concorrência/cache. Permanece investigação da CF-019
relacionada à coordenação/reconciliação desta tarefa; não foi fechado nem
transferido. RJ-022-01 é outra interação, na CF-022, sem dependência comCF-024.

Próxima execução deve reconferir base/diffs e usar PostgreSQL descartável,
conexões/transações separadas, barreiras, SQL após ambas, rollback/eventos/cache
após commit, respostas recuperáveis e mutação da proteção crítica. Protocolo
transversal e ordem de locks ainda são trabalho desta tarefa. Não autoriza
cache futuro sem ownership/after-commit nem reenviar intenção desconhecida
com outra chave. Publicação conserva RVA-03, RV17-01/02/adoção real, zoom200%,
CF-024/025/027/032 e cadeia de release. Sem push/deploy/banco real ou CF-025+.

## Execução local — 30/09/2026

Retomada sobre `9fa4fae`, com README preexistente preservado. Histórico do
bloqueio mantido. Expected definidos em contrato CF-024 (registro de execução privado).
Exceções de caminhos necessárias: testes/initializer em `src/test/java/.../service/`
(não empacotar testes no produto); migração aditiva e testes de migração para
recibos duráveis de criação/transferência/operação de investimento; controllers
de comandos/recuperação e handler HTTP para comprovar conflito recuperável real.
Não haverá alteração de frontend, habilitação de Cacheable, banco real ou deploy.

## Entrega local — 30/09/2026

Critérios implementados/validados no recorte backend; `em_revisao` até execução
independente. Relatório atual e histórico (registro de execução privado),
execuções (registro de execução privado) e
mutações/restauração (registro de execução privado).

Commit local de produto/testes/contrato: `dbf828e`; fontes, JAR e preservação do
README vinculados no checkpoint (registro de execução privado).

Entregues: recibos imutáveis de criação/transferência/investimento em V13,
operationId opcional/fingerprint/replay/GET autenticado; pagamento/adiantamento
revalidado; cache após commit (writers, nota e exclusão de usuário);409 para
lock/versão/timeout/deadlock. Locks por fonte existentes preservados, sem lock
global financeiro. Bare deletion mantém limpeza global de cache anterior, agora
após commit; não certifica exclusão completa de usuário com todos os domínios.

Backend verify/JAR:388/388, incluindo29 casos CF-024; depois o30º caso de
deadlock real e toda a classe passaram30/30 na cópia restaurada, com src inteiro
igual ao checkout por SHA. Cinco mutações causais detectadas (13 falhas, zero
erros/skips). Frontend componentes157/157 e typecheck aprovados, sem fonte alterado.
Esses subconjuntos se sobrepõem; não somar contagens. Primeiras falhas preservadas.

Exceções adicionais de documentação/teste: DEC-10 em SPEC-003; teste de upgrade
de hábitos fixa target12 para conservar sua prova V11→V12 (V13 validada nas
suítes gerais/upgrade novo); testes temporais unitários recebem somente mock
do novo colaborador de transporte, mantendo assertions de datas/horários.
Expected de quantidade nas suítes de migração passa explicitamente a V1–V13.

Limites: intenção opcional não oferece idempotência para clientes legados sem
chave; frontend não passou a emitir as novas chaves/recuperação. Pagamento
mantém seu protocolo. Perda do ID, múltiplos dispositivos, corte TCP, carga e
cache distribuído/leitor antigo não certificados. Nenhum Cacheable foi ativado.
Snapshots exigem compatibilidade futura de DTO/schema; recibos crescem com as
operações. Prazo de espera de locks de produção não foi definido. A revisão
independente de CF-024 está liberada; nenhuma sucessora foi integralmente
liberada. RVA-03/RJ-022-01/RV17-01/02 e adoção real mantidos; sem push/deploy.

## Revisão independente — 01/10/2026

**Concluída no recorte backend de DEC-10 e invalidação após commit**, conforme
parecer independente A–F e matriz (registro de execução privado).
O histórico acima permanece. O checklist de cache refere-se ao caminho normal
de invalidação/chaves/rollback por proxy real, com entradas sintéticas; falha
de callback não possui recuperação durável e não certifica frescor universal
de leitura em produção. Nenhum Cacheable foi habilitado.

Classe final30 reexecutada no checkout; gate pertinente99/99 com verify/JAR;
consolidação em cópia22/22 (17 probes,1 upgrade V12→V13,4 correções herdadas);
18 componentes pertinentes; cinco mutações causais reproduzidas e restauração30/30.
Contagens se sobrepõem. Execução ampliada119 teve um timeout de scheduler,
mantido como H24-01; isolado posterior passou sem encerrar causa.

Consumidores sem chave não recebem garantia nova: RV24-01 confirma reenvio
inseguro após resultado desconhecido; RV24-02 confirma exclusão de usuário com
pagamento vinculada a FK. São defeitos herdados fora do contrato entregue,
com responsáveis e encerramento próprios (registro de execução privado),
sem aprovação integral desses fluxos. Recibos de comandos antigos não foram
declarados snapshots imutáveis. R03/RV01 preservados; RVA-03 não encerrado.

**CF-025 apta a iniciar localmente**, considerando concretamente CF-021 e o
backend aprovado de CF-022. Nenhuma implementação de CF-025 iniciada. Permanecem
RJ-022-01/H24-01, RV17-01/02, adoção real, zoom200% e gates de release. Produto,
migrações, frontend e README alheio preservados; sem banco real/push/deploy.
