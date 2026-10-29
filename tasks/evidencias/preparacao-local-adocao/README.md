# Preparação local de adoção/publicação — 26/10/2026

**Estado: em_revisao, sem autoaceite.** Implementação, pacote e provas locais
registrados; o gate de startup permanece aberto por estouros do limite de 40s
em Windows e no controle Linux posterior às mutações. O verde anterior da matriz
Linux não elimina essas falhas. Nenhum banco real, configuração remota, CI remota,
push, registry ou deploy foi utilizado para executar o lote.

Branch: `codex/preparacao-local-adocao`. Base conferida:
`46b85ee0428abb55c22d27d26284d054410ec128`, descendente de `ec6d4e7`.
Intervalo de implementação e inputs do pacote:
`46b85ee0428abb55c22d27d26284d054410ec128..24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`.
Commits posteriores deste lote contêm somente documentação, scripts de evidência
e recibos; o HEAD documental final é informado na entrega, sem alterar a origem
do binário. A alteração preexistente do README raiz fica fora dos commits.

## Causas e mudanças delimitadas

- Ferramentas recusavam PG17 antes do inventário. Suporte explícito 16/17,
  identificação real de servidor/clientes e marcador da major no snapshot;
  comparador e normalização restrita preexistente preservados.
- Flyway iniciava junto da API, com override externo `ddl-auto=update` registrado
  na revisão. Perfil `adoption` separa migration de bootstrap; initializer recusa
  configuração efetiva insegura antes de criar beans de persistência.
- Scheduling tinha habilitação duplicada e não havia fronteira de manutenção.
  Filtro fecha todo ingresso funcional, inclusive GET com escrita indireta;
  scheduling só é registrado com writers e jobs habilitados. Flags imutáveis por
  processo exigem parada/drenagem e reinício. Email fechado não cria cliente Resend.
- Ausência de saúde: dois GETs mínimos na porta da API distinguem processo vivo
  e prontidão financeira. O probe de banco não lê tabelas financeiras.
- Vercel limitava só duas branches. Arquivo local propõe desativação Git global;
  BFF recusa preview antes de cookies, body e upstream. Deployments antigos exigem
  tratamento futuro próprio.
- Novo JAR e imagem local ligados aos inputs commitados; não são o pacote
  histórico `c3860ec069aa893b8faed588f9a20904930a2937c0e8eb94818297651c85a9d9`.

O inventário detalhado de entradas/efeitos está em [INVENTARIO.md](INVENTARIO.md).
Defaults de desenvolvimento foram preservados. Não houve refatoração das regras
financeiras, nova migration, novo sistema distribuído de flags ou mudança de query.

## Matriz de critérios e alcance observado

A [matriz inicial](MATRIZ.md) foi produzida antes da implementação. Esta tabela
registra resultados do executor para revisão; não substitui aceite independente.

| Critério | Evidência local observada | Limite / pendência |
|---|---|---|
| PG17 operacional | PostgreSQL 17.11 e clientes 17.11 reais; vazio V1–V16, JPA validate, legado/preflight/baseline explícita da fixture, upgrade, history, checksum/reaplicação e rollback/recovery | Não examina banco real, extensões, roles/ACL/RLS, SSL ou volume reais; outras majors são recusadas |
| Restore rigoroso | 21 casos Cf017RestoreTest em PG17, incluindo dumps custom legados/atuais, linhas duplicadas, campos, catálogo/constraints/índices/sequences/history, divergências e rollback; snapshots antes/final e CLI do JAR `RESTORE=EQUIVALENT` | Comparação lógica; globals/roles e coordenação de nextval exigem procedimento próprio |
| API não migra/gera DDL | 11 overrides inseguros recusados; schema vazio/incompatível impede boot, sem criar history/migrar; JPA validate no caminho seguro | Override remoto continua existente até ação autorizada; JPA validate não prova todas as constraints |
| Writers/jobs | HTTP 503 antes do domínio; tentativa autenticada persistiu zero contas; snapshots SQL antes/depois iguais; zero tarefas registradas com jobs fechados; controle aberto observa job/ShedLock | Não cancela transação anterior nem congela scripts/instâncias externas |
| Modo normal | Auth 401/ownership 404, criação real, GET planning com efeito e novo fechamento; regressão financeira/concorrência e seis jornadas completas | Não certifica todos os gates de CF035/036 |
| Saúde | Manutenção readiness 503/liveness 200; banco congelado readiness 503 em 1050ms e liveness 200 mesmo com JWT; retorno readiness 200 no mesmo processo | Medida sintética com JDBC connect/socket 2s; sem monitor remoto contínuo ou promessa de latência universal |
| Previews | 14 contratos BFF, dos quais seis novos de preview sem fetch/cookies/body; configuração Git global revisável | Arquivo não aplicado; previews antigos/manual/API ainda precisam ser tratados |
| Pacote/imagem | 831 inputs, 22 recursos empacotados, hash do JAR e do JAR extraído da imagem iguais; 17 contratos passaram contra ID local Linux | Startup estável ainda não certificado; sem reprodução binária/push/deploy |
| Preservação | README raiz, 29 arquivos históricos e 16 migrations com hashes iniciais/finais iguais; revisão ancestral preservada | Outros runtimes históricos não foram limpos nem inventariados integralmente |

## Execuções e falhas preservadas

[results.json](results.json) contém contagens por classe/caso, hashes dos relatórios
JUnit, equivalência entre revisões e controle posterior restaurado. Não somar as
rodadas abaixo: elas têm casos sobrepostos. Nenhuma execução usou retry ou aumento
de timeout para obter verde.

| Execução | Resultado original | Interpretação |
|---|---|---|
| p01, ferramenta da base contra PG17 real | Recusa da major 17 | Reprodução anterior à mudança; log before-pg17 |
| p02, primeira matriz PG17 | 87 testes; 2 falhas de fixture | Argumento jobs duplicado e mensagem de schema esperada incorreta; fixtures corrigidas, logs mantidos |
| p03, matriz PG17 | 91 testes; 90 passaram, 1 falha de startup; 0 erros/skips | 74 casos fora de AdoptionRuntimeTest passaram; processo jobs excedeu 40s |
| p03, required backend PG16 | 894 execuções em 98 classes; 836 passaram, 58 erros, 0 falhas/skips | Duas classes de hábitos exigiam scheduling/ShedLock real, desabilitado pelo novo default de teste |
| p05, revalidação das duas classes | 58 passaram; 0 falhas/erros/skips, com verify | Fixture habilita jobs explicitamente; assertions preservadas. Não houve nova execução integral das 894 |
| p05, JAR nativo Windows | 17 testes; 14 passaram, 3 falharam em startup; 0 erros/skips | Mesmo limite original de 40s, execução sequencial; causa inconclusiva |
| p05, imagem Linux com mesmo JAR | 17 passaram; 0 falhas/erros/skips | Mesmos nomes/casos do JAR nativo; prova dos contratos naquela rodada |
| p04, controle após restaurar mutações | 4 testes; 2 passaram, 2 startups Linux falharam; 0 erros/skips | Falha posterior preservada, mesmo ID original da imagem; não restringir o problema a Windows |
| Frontend | Lint e tipagem exit 0; 6 testes unitários e 626 de componentes passaram | Os 14 contratos BFF já estão incluídos nos 626 |
| Build frontend | Primeiro falhou por junction de dependências fora da raiz Turbopack; segundo passou com cópia física | Correção de preparação do ambiente, sem mudança de produto/lockfile; ambos os logs mantidos |
| p05, E2E financeiro standard | 6 jornadas passaram, 0 skips/flaky/falhas; wrapper JUnit 1/1 | Next → Spring → PG reais; email e mercado simulados; não é matriz expanded/zoom |

Da revisão p03 para p05 mudou **somente** a anotação de teste em
HabitIntegrityIntegrationTest, herdada pela fixture correlata: 831 inputs
comparados e todos os inputs de produção idênticos. O coletor confronta os nomes
e quantidades dos 58 casos revalidados. Isso sustenta a revalidação dirigida,
sem renomear a rodada original falha como suíte integral verde.

E2E cobre cadastro/aplicação E01/recibo, uso diário/reconciliação, resposta perdida
após commit SQL/replay, dois usuários/ownership/exportação, limite de cartão e
investimento sem identificador. Fontes frontend são as de p03, idênticas às de
p05. Playwright 1.63.0: 114 arquivos de código comparados byte a byte com instalação
do lockfile; biblioteca e dois binários emprestados em leitura preservaram hashes
antes/depois. Recibos em [toolchain.json](toolchain.json).

Startup continua **pendência concreta**. Os logs mostram inicialização de JPA e
repositories dentro do processo, mas não isolam causa de CPU, I/O, ambiente ou
produto. Windows usa `-Xmx384m`; Linux usa ergonomia padrão e outro patch Java.
O controle Linux posterior também falhou; uma hipótese apenas de Windows ou
concorrência não é sustentada. Não se certificam startup estável ou o orçamento
proposto de 300s do Railway. Diagnóstico e decisão sobre esse gate antecedem aceite.

## Contraprovas

[counterproofs/results.json](counterproofs/results.json) guarda comandos, imagens
mutantes e hashes restaurados. Cada mutação foi isolada no runtime p04:

| Mutação | Efeito observado e detecção |
|---|---|
| Ocultar constraints no preflight | FK ausente indevidamente aceita; teste independente de FK faltante falhou |
| Bypassar filtro de manutenção | HTTP 200 e uma conta persistida, em vez de 503/zero; assertion falhou |
| Registrar scheduling com jobs fechados | Tarefas realmente registradas; assertion falhou |
| Remover guard e ligar Flyway no bootstrap | 16 migrations executadas pela API em banco vazio; teste recusou processo indevido |
| Readiness sempre UP | Banco congelado ainda recebeu 200; assertion falhou |
| Adulterar cópia do JAR | SHA divergente recusado; cópia e original conferidos após restauração |

As cinco mutações de código falharam por assertion (não erro de compilação).
Empacotamento dos mutantes usou compile/jar/repackage, sem executar testes; os
testes foram invocações posteriores explícitas. O gerador interrompeu inicialmente
por regex incompatível com CRLF, antes da terceira mutação; recibo e log mantidos,
retomada explícita sem repetir as duas primeiras. Depois, todos os 831 hashes de
fonte foram conferidos restaurados; a auditoria de hashes executou zero testes.
O controle restaurado com dois startups falhos continua em
[counterproofs/witness.json](counterproofs/witness.json).

Os testes existentes de restore também introduzem 15 divergências isoladas,
alteração de sequence, timestamp bruto, duplicatas e restore transacional falho;
não dependem somente das cinco mutações adicionais deste lote.

## Pacote, ferramentas e comandos

- Commit dos inputs: `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`.
- JAR: `../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar`,
  86.235.054 bytes, **SHA-256 `b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`**.
- Imagem local: `cf-preparacao-adocao:p05-24844b5`,
  ID `sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`,
  Linux amd64, usuário 10001:10001; nenhum registry publicado.
- Base Java fixada por digest em [image.json](image.json). Labels commit/hash e
  JAR extraído conferidos; ID local não é prova de publicação em registry.
- Java nativo 21.0.12.1+1, Java imagem 21.0.12+8; Maven wrapper 3.9.12,
  Node v24.18.0, Docker 29.6.2. JAVA_HOME foi explícito por comando;
  Java 25 do host não foi alterado. PostgreSQL/clientes 16.15 e 17.11.
- Spring Boot 4.0.2, Flyway 11.14.1, Hibernate 7.2.1.Final, pgjdbc 42.7.9
  observados no JAR; lista completa e hashes de lockfiles em
  [toolchain.json](toolchain.json) e [inputs.json](inputs.json).

[package.json](package.json) liga pacote/manifesto/commit/source digest;
[packaged-resources.json](packaged-resources.json) confere as 16 migrations e
seis recursos de configuração/verificação, incluindo o registro do initializer
em META-INF/spring.factories na raiz do JAR. O manifesto conserva hashes brutos
e blobs Git normalizados por CRLF; todos os inputs do pacote batiam com o índice
commitado. README raiz e documentação posterior estão fora dos inputs.

[COMANDOS.md](COMANDOS.md) documenta execução/reprodução local. Seleção required
original em [backend-selection.json](backend-selection.json), comando literal em
[pg16-command.json](pg16-command.json). Logs originais ficam em [logs](logs);
[collection.json](collection.json) registra hashes da coleta; atributos locais
preservam os bytes dos recibos/logs no Git. Observações SQL/resultados sintéticos
do E2E em [browser](browser). Snapshots PG17 sintéticos em
[snapshots/pg17](snapshots/pg17). Runtimes p01–p05 preservam relatórios
JUnit, saídas de processos, dependências e binários sem versioná-los.

## Operação futura, custos e limites

[OPERACAO-LOCAL.md](OPERACAO-LOCAL.md) contém ordem A–D, configuração efetiva,
precedência, flags, saúde, proposta Railway e tratamento futuro de previews.
O override remoto `SPRING_JPA_HIBERNATE_DDL_AUTO=update` ainda precisa ser corrigido
para validate, junto do perfil adoption, Flyway false, SQL init never e writers/
jobs inicialmente fechados. Essa alteração não foi aplicada. Migração depende
de inventário/freeze/backup/restore/preflight e autorização separados.

Readiness 503 de manutenção não deve promover deployment nem ser usado para
congelar a versão antiga em rolling deploy: parar/drenar todas as instâncias e
writers externos é responsabilidade operacional. Probes não são trava de banco.
O bloqueio de ingresso custa O(1), sem query adicional; readiness usa um borrow e
isValid(1), com contenção possível no pool sob probes excessivos. Nenhuma query
N+1 ou lock de domínio foi adicionada. Backup/snapshot exige I/O proporcional
aos dados e ordenação O(N log N), além de espaço para dump/restore; ensaio
sintético não dimensiona produção. Encerrar processo e reabrir por reinício
simplifica concorrência e reversão, ao custo de indisponibilidade também de leituras.

Não há exclusividade universal, cancelamento retroativo ou garantia de extensão/
locale/ACL real. CF017/P01/P02 e CF034 permanecem em_revisao; CF035/036 propostas.
Aceite local DEC-CI-04 e evidências remotas anteriores preservados, com expanded,
zoom nativo 200% e limites de cancelamento ainda pendentes.

## Preservação e revisão independente

[preservation.json](preservation.json): README inicial/final
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`,
29 arquivos inventariados intactos e 16 migrations intactas; commits da revisão
continuam ancestrais. Sem clean, reset destrutivo, repair ou limpeza de target.

[ENCAMINHAMENTO.md](ENCAMINHAMENTO.md) delimita a revisão independente de PG17,
bootstrap, writers/jobs, saúde, contraprovas e proveniência, incluindo o gate
aberto de startup. A entrega do executor não é aprovação nem liberação de uso.
