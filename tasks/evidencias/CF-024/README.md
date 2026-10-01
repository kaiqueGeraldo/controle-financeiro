# Evidência CF-024 — concorrência, intenções e cache

Entrega local em 30/09/2026: **em_revisao**, pronta para revisão independente.
Retomada sobre `9fa4fae`, após a liberação expressa do usuário e do parecer
CF-022/023. [Preflight da retomada](resume-preflight.json); o bloqueio anterior
permanece registrado abaixo e em `preflight.json`. Somente CF-024 executada.
README raiz preservado byte a byte, fora dos commits. Sem produção, e-mail real,
push, deploy, alteração de frontend ou início de tarefa sucessora.

Commit local de produto, testes, contrato e estado: `dbf828e`.
[Checkpoint verificável](checkpoint.json) vincula os fontes ao commit, registra
o hash do JAR e do README preservado. Logs publicados foram sanitizados somente
para credenciais; valores, status e assertions foram preservados, com hashes
antes/depois em [evidence-sha256.json](evidence-sha256.json).

Executor Codex/GPT-6 da sessão; esforço efetivo não exposto. Windows/PowerShell,
JDK21.0.12.1, Spring Boot4.0.2, Maven wrapper3.9.12, Testcontainers2.0.3 e
PostgreSQL16-alpine/Docker Desktop. Novo schema `cf024_<uuid>` exclusivo,
Flyway V1–V13/Hibernate validate; banco sintético e descartável. Clock fixo
`2026-09-30T15:00:00Z`, zona de produto São Paulo, datas civis literais07/09/2026.
Invocação JVM UTC; startup do app continua normalizando o default a São Paulo,
sem alegar uma nova matriz de defaults reais nesta tarefa. UUIDs novos por caso.
E-mail/cotação e Clock são doubles; controllers, segurança, serviços financeiros,
ORM, eventos, CacheManager e PostgreSQL são reais. Testes não usam sleep para
sincronizar writers: barreiras/latches e `pg_blocking_pids` observam conexões/PIDs
distintos. SQL de pós-condição executa depois que ambos terminam.

## Resultado entregue e prova causal

Expected fixados antes de corrigir em [CONTRATO.md](CONTRATO.md), pela
AC-FIN-003/005/010, AC-UI-005, SPEC-004 FIN-05/07 e ADR-004/005. DEC-10 registrada
na SPEC-003. Nenhum expected é calculado pelo helper financeiro de produção.

| Critério / achado | Antes | Correção / evidência final |
|---|---|---|
| Débito repetido de comando identificado | POST de aporte duas vezes:800 esperado/600 observado; transferência:700/400 | V13 e FinancialIntentService: lock somente por intenção, fingerprint canônico, snapshot do DTO na mesma transação;30 casos finais |
| Disputas entre writers/fontes | Locks existentes não presumidos corretos | Seis pares pagamento/transferência/aporte/venda, dois cartões/mesma conta, vendas além da posição, duas transferências além do disponível, transferências opostas e fonte independente; banco/quantidade/custo/lançamentos após ambas |
| Pagamento/adiantamento | Um efeito econômico já protegido; representação do recibo variava200/200.00 e50/50.00 | Duas conexões retornam mesmo recibo e GET recupera;800/0 e950/150 literais; amount do DTO normalizado para centavos sem tolerância |
| Cache antecipado | Cinco probes: entrada removida antes do commit/fora de transação; nota e exclusão também reproduzidas | Listener AFTER_COMMIT, sem fallback fora de transação; notas/exclusão publicam evento; rollback preserva cache, commit invalida owner/ano; exclusão conserva a limpeza global anterior |
| Conflito pessimista | Timeout PostgreSQL55P03 retornava500 | Handler409 para conflitos otimistas/pessimistas; timeout real e deadlock40P01, um vencedor/um409, saldo700/1300 e um recibo; sem retry interno |
| Rollback após escrita financeira | Não presumido pelo uso de @Transactional | Trigger sintético recusa gravação do recibo de aporte/transferência:500 permanece500, saldo/posição/ledger/recibo/cache revertidos; mesma chave funciona depois da remoção da falha |
| Durabilidade/ownership | Protocolo novo sem histórico inventado | Replay concorrente HTTP retorna mesmo JSON, GET em outro request recupera; venda posterior não altera snapshot; alheio/ausente404, sem credencial401, reuso incompatível409 sem alteração |

Primeiro run válido20/9 falhas: cinco de cache, duas econômicas, duas de escala
do recibo. Dois probes adicionais falharam pela nota/cache e timeout500. Candidato
inicial22/22. Ampliação47/2 falhas: nova prova de exclusão/cache e contagem de
recuperação de migrações V2–V13 ainda esperava11 em vez de12. Gate completo
inicial388/1 falha/2 erros: alvo V11→V12 seguia aplicando também V13 e dois setups
temporais não injetavam o novo colaborador. [Execuções e primeiros logs](EXECUCOES.md)
distinguem esses ajustes de harness/contrato das falhas de produto.

Assertions financeiras/data/tempo/rollback não foram relaxadas ou removidas.
Suítes gerais de migração enumeram explicitamente V1–V13; recuperação V2–V13
espera12. O teste específico de hábitos fixa target12 e conserva sua assertion
de uma migração e todos os valores legados. Unitários temporais injetam mock
somente do novo transporte; regra temporal/financeira continua real no serviço.
Os testes CF-024 exercitam transporte/idempotência sem esse mock.

## Gates e mutações

- Backend verify/JAR: **388/388**, zero falhas/erros/skips. Inclui29 casos CF-024,
  migrações gerais/legadas, V12→V13 e consumidores financeiros/temporais/segurança.
- Novo30º caso (deadlock PostgreSQL real) acrescentado depois da compilação
  desse gate: classe final **30/30** na cópia restaurada/recompilada, cujo `src`
  inteiro foi comparado ao checkout por SHA, sem divergência. Não somar30 à388.
- Frontend: **157/157** componentes em36 arquivos e typecheck aprovados, Node24;
  nenhum fonte alterado. Não houve browser/BFF/E2E novo, build ou lint global:
  esta entrega é backend/contrato HTTP e não certifica nova interação visual.
- Cinco mutações, aplicadas separadamente na cópia sob target: **13 falhas
  causais, zero erros/skips**. Todos os fontes restaurados por hash; baseline
  recompilada30/30. [Diffs e resultado por assertion](mutation-results.json),
  [script reproduzível](mutations.ps1). Nenhum mutante entrou no checkout/runtime
  compartilhado. Testes da cópia finais iguais aos de trabalho.

| Mutação | Prova de detecção |
|---|---|
| Remover lock e @Version da conta | Banco final800/expected600, depois de duas transações: assertion econômica, não só ausência de espera |
| Desativar replay/gravação de intenção | Aporte600/expected800 e transferência400/expected700 |
| Listener antes do commit |7 assertions de cache: writer, nota, exclusão e evento fora de transação |
| Ignorar fingerprint | Reuso de chave com conteúdo diferente retornou200/expected409 em2 casos |
| Ignorar owner na recuperação | Recibo de outro usuário retornou200/expected404 |

## Custos, trade-offs e limitações

Não foi introduzido lock global financeiro: intenção→contas ordenadas pelo
PostgreSQL; investimento usa conta→investimento; pagamento mantém intenção→cartão→
conta. Fonte independente comita enquanto outra está retida. Deadlock imposto
por writer externo com ordem inversa é recuperável409. Isso não certifica toda
combinação de writers, hábito/meta/reorder/cron nem elimina deadlock em carga.
Não houve benchmark/p95 ou configuração de prazo de espera de produção.

Fingerprint/JSON custam O(L) no tamanho do DTO; um comando identificado acrescenta
lock advisory, busca por PK e insert de recibo com flush. PK tem custo típico
O(log N), não promessa O(1). Não cria query por parcela/meta; queries/associações
legadas e N+1 amplo continuam sujeitos à CF-025. Snapshot separado preserva
resultado mesmo após correção do ledger, ao custo de armazenamento O(N·L), sem
retenção automática e com obrigação de manter compatibilidade do DTO/serializer.
V13 não altera migrações antigas, não fabrica intenção e conserva FK de owner;
CASCADE remove recibos na exclusão do usuário, não ao alterar a posição.
Chaves usam hash64 para advisory lock: colisão pode aumentar contenção, mas
PK/fingerprint continuam impedindo uso incompatível. Nenhuma chamada externa
de cotação/e-mail foi acrescentada à transação financeira.

`operationId` é opcional para preservar clientes atuais; frontend de criação/
investimento permanece no contrato legado sem chave e não ganhou retry seguro.
Backend entrega o protocolo/GET, sem afirmar migração automática dos consumidores.
Pagamento/adiantamento conserva protocolo próprio. Ausência de recibo pode
significar rollback ou operação ainda em andamento: reler/repetir somente a
mesma intenção; perda também do ID exige reconciliação do histórico. Não houve
corte TCP real, restart de servidor, teste entre dispositivos ou novo browser;
descarte lógico da primeira resposta/GET e nova conexão comprovam persistência
no PostgreSQL, não toda condição de rede/armazenamento do cliente.

Cacheable de leitura continua ausente. Provou-se o CacheManager real/eviction
transacional com entradas sintéticas. Não se certifica repopulação por leitor
com snapshot anterior, cache em outra instância ou persistência/distribuição de
cache. Exclusão de usuário continua limpando todas as entradas somente após
commit; mede-se depois se precisa namespace por owner, antes de habilitar cache.
O probe de exclusão usa usuário sem vínculos financeiros e receipt sintético;
não certifica limpeza de todos os domínios nem notificação de exclusão após commit.

Revisão independente da CF-024 está liberada. Nenhuma sucessora foi
integralmente liberada: CF-025/027/030/032 mantêm esta revisão e seus demais
gates. RVA-03 (CF-019), RJ-022-01 (CF-022), RV17-01/02/adoção real (CF-017) e
gates de publicação preservados; nenhuma conclusão de outra tarefa foi alterada.

## Histórico — bloqueio anterior à liberação de 9fa4fae

> Gate histórico abaixo registrado em `9ff1aec`. A revisão independente conjunta
> posterior aprovou CF-023 e as dependências no recorte necessário:
> **CF-024 apta a iniciar localmente**, estado `pronta`, sem implementação.
> [Decisão, relação causal com RVA-03 e condições](../revisao-CF-022-CF-023/README.md).
> O bloqueio anterior e seu preflight permanecem preservados; publicação continua
> bloqueada pelos gates próprios.

Estado real em 30/09/2026: **bloqueada antes da implementação**. Preparação
documental somente, sobre `a21ecdbf59304e54460456ad528f20ebbec1482f`, branch
`main`, Windows/PowerShell. Executor Codex baseado em GPT-6 da sessão; esforço
efetivo não exposto. Sem runtime de aplicação, navegador, banco ou seed nesta
execução. Recomendações de modelo da tarefa não alteram a sessão.

Leitura prévia de tasks/README.md, EXECUCAO.md, POLITICA-DE-TESTES.md, CF-024,
suas quatro dependências e evidências de liberação, SDD/README.md, ADR-004/005,
AC-FIN-003/005/010, SPEC-004 e T-009. Nenhum AGENTS.md adicional foi encontrado
na busca de arquivos do repositório; instruções fornecidas pelo usuário aplicadas.

## Dependências e motivo do bloqueio

| Dependência | Commit de produto integrado | Estado oficial na base |
|---|---|---|
| CF-018 | `4203f18` | em_revisao |
| CF-019 | `fb43e62` | em_revisao |
| CF-020 | `d11359e` | em_revisao |
| CF-023 | `1b93704` | em_revisao; exige aceite independente antes de CF-024 |

Integração comprovada por `git merge-base --is-ancestor <commit> <base>`:
exit 0 nos quatro casos. SHA completos, hashes dos documentos e estado inicial
em [preflight.json](preflight.json). Ancestralidade comprova presença na base,
não revisão independente ou aceite.

A [entrega CF-023](../../03-integridade/CF-023-isolamento-autenticacao.md)
registra expressamente: **“Liberada somente a revisão independente de CF-023.”**
Em seguida exige as demais dependências e o aceite independente para CF-024.
O [relatório CF-023](../CF-023/README.md) confirma esse gate, e a
[revalidação anterior](../revalidacao-CF-016-CF-021-residuais/README.md)
não libera integralmente CF-024. Na base inspecionada não há parecer posterior
que satisfaça esse requisito. Não se deduziu bloqueio apenas de `em_revisao`:
há entregas anteriores que autorizam recortes locais nesse estado; aqui falta
a liberação exigida explicitamente pela dependência mais recente.

Respeitar esse gate evita validar a matriz transversal sobre um contrato de
isolamento ainda sem aceite independente. O custo é adiar a execução financeira;
não justifica refatoração especulativa, lock global ou aceitação automática dos
testes anteriores. Revisar outra tarefa violaria o escopo solicitado.

RVA-03 continua inconclusivo e delimitado à interação/recuperação do pagamento.
Não demonstra saldo perdido, débito duplicado ou bloqueio financeiro geral, nem
foi usado como causa para impedir esta tarefa.

## Critérios e resultados esperados pela especificação

| Critério | Oracle independente / camada necessária | Resultado desta sessão |
|---|---|---|
| Efeito econômico único | AC-FIN-003/010: conta 1000, dívida 200; dois pagamentos da mesma operação deixam conta 800 e dívida 0, com um débito | Não executado |
| Writers sobre mesma fonte | CF-024 e FIN-05/07: pagamento, transferência, venda e aporte com conexões separadas/barreiras; consultar banco após ambos | Não executado |
| Conflito/recuperação | AC-UI-005, ADR-004 e DEC-07: conflito recuperável sem sucesso fictício; detalhar recibo/transporte antes das assertions | Não executado; protocolo transversal não decidido nesta sessão |
| Cache/eventos | ADR-004 e AC-FIN-010: rollback conserva estado anterior; commit permite leitura persistida; evento de cache após commit | Não executado |
| Detecção de regressão | POLITICA-DE-TESTES: mutação isolada da proteção crítica deve falhar por integridade, com restauração comprovada | Não executado |

Não houve reprodução, correção, teste vermelho/verde, mutação ou revisão
independente de CF-024. Nenhum teste/assertion/snapshot foi alterado. Resultados
históricos de outras tarefas não são apresentados como validação desta execução.
Custos de queries, concorrência, ordem de locks e risco de deadlock permanecem
por medir; não se afirma complexidade ou desempenho da solução não executada.

## Verificações e preservação

Comandos de preparação, executados na raiz:

```powershell
git status --porcelain=v1
git diff --cached --stat
git diff -- README.md
git rev-parse HEAD
git branch --show-current
git merge-base --is-ancestor 4203f18 a21ecdb
git merge-base --is-ancestor fb43e62 a21ecdb
git merge-base --is-ancestor d11359e a21ecdb
git merge-base --is-ancestor 1b93704 a21ecdb
Get-FileHash README.md -Algorithm SHA256
```

Única mudança inicial alheia: README raiz; staging vazio. SHA256 preservado:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Entrega desta sessão limitada ao estado de CF-024 e esta pasta de evidências,
com staging explícito e inspeção do diff antes do commit documental local.
Validação de fechamento: JSON legível, quatro ancestrais integrados, dependências
inalteradas pelos hashes, README preservado, diff sem erros de whitespace e
staging restrito aos três arquivos. Não houve execução de suítes de aplicação
porque nenhum produto/teste foi modificado e o gate impede iniciar CF-024.

## Retomada e tarefas liberadas

Integrar revisão independente de CF-023 e registrar liberação do recorte local
de CF-024 considerando CF-018/019/020. Depois reconferir HEAD, alterações locais
e gates, definir o protocolo pendente pela especificação e executar a matriz
PostgreSQL/barreiras/rollback/cache e mutações exigidas pela tarefa.

**Nenhuma tarefa sucessora foi liberada nesta sessão.** CF-025/027/030/032
dependem de CF-024 e mantêm seus próprios gates. A revisão independente de
CF-023 já estava liberada anteriormente; não foi executada ou ampliada aqui.
Estados das dependências preservados. Sem banco real, e-mail real, push ou deploy.
