# Revalidação independente do resíduo R28-02 — 10/10/2026

**R28-02 não encerrado; CF-028 permanece em_revisao.** A política de fontes,
união dos bloqueios, evidência, reconciliação e concorrência está atendida.
Resta uma inconsistência documental P2 introduzida pelo saneamento: os totais
por dimensão dos exemplos UNBOUNDED contradizem a regra normativa existente.
Não falta decisão de produto e não se pede revisão global.

## Base e preservação

Examinado `dc02cd18da348d132bac786a4e943e2375981160`, branch
`codex/cf-028-contrato-onboarding`, intervalo `1c54533..dc02cd1`.
Ancestralidade confirmada; HEAD era exatamente a entrega, sem commits posteriores.
Staging inicial vazio; único delta preexistente: README raiz modificado.
SHA256 preservado, fora do staging/commit:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.

Aplicadas as instruções AGENTS fornecidas na conversa; nenhum AGENTS.md adicional
encontrado na busca do repositório. Conferidos tasks/README, EXECUCAO,
POLITICA-DE-TESTES, tarefa, SPEC-001, FIN-05/06, ownership CF-023, concorrência §6,
pareceres anteriores e diff completo: 13 arquivos, exclusivamente documentais.
Geradores, avaliador e verificador lidos; os JSON completos foram regenerados em
memória e comparados byte a byte. [Resultado](result.json) registra SHA256 antes/depois
da entrega, README e provas anteriores: sem alteração durante as verificações.
O acréscimo posterior na tarefa é exclusivamente o registro deste parecer.

A revalidação `1c54533` já encerrara R28-01 e aceitara a representação dos estados
de conhecimento. O único resíduo normativo então aberto era determinar fontes
afetadas e independentes quando falta origem. Esses aceites não são reabertos.

## Achado único: total por dimensão não segue o universo de origens

**P2, inconsistência das provas introduzida pelo saneamento de R28-02.**
[SPEC-001 §5.1](../../../docs/sdd/specs/001-onboarding.md) define inventário completo,
UNBOUNDED como universo elegível menos exclusões comprovadas e, para totais por
dimensão, manda contar o nominal uma vez quando todas as origens possíveis têm
o mesmo tipo. Não exige atribuição a uma conta individual para conhecer esse total.

Em [build-cases.mjs](../saneamento-CF-028-origem/build-cases.mjs), E23/E28/E34 têm
somente contas elegíveis e reserva nominal conhecida400. E32 tem A/B/C, todas
ACCOUNT, C comprovadamente excluída da reserva400 e nova alocação100 em C.
Não há investimento, tombstone de tipo desconhecido ou lacuna de inventário
representada nessas entradas. Logo, a origem individual permanece desconhecida,
mas o tipo de todas as origens possíveis é ACCOUNT.

| Exemplo | Total normativo reservedAccounts | Resultado entregue |
|---|---|---|
| E23: nenhuma alocação nova | KNOWN400.00 | UNKNOWN/null |
| E28: novo10 recusado, sem efeitos | KNOWN400.00 | UNKNOWN/null |
| E32: C independente recebe100 | KNOWN500.00 | PARTIAL/null, subtotal100.00 |
| E34: CLOSE removido, reserva continua | KNOWN400.00 | UNKNOWN/null |

O ramo UNBOUNDED de [check-contract.mjs](../saneamento-CF-028-origem/check-contract.mjs)
adiciona incondicionalmente `totalMissing`, independentemente dos tipos do universo
restante. Os esperados literais repetem esse resultado, de modo que o verificador
verde não detecta a contradição. A frase de E23 “sem delimitação inclusive por tipo”
não é sustentada pelas entradas: incerteza de identidade não cria uma fonte de outro
tipo fora do inventário definido no próprio contrato.

[verify.mjs](verify.mjs) enumera possíveis atribuições a cada conta elegível sem
escolher uma como verdadeira. Todas produzem o mesmo total400, ou500 em E32.
A comparação com o resultado entregue falha por `DIMENSION_TOTAL`, não por ambiente.
Controles legítimos: CANDIDATES só de contas conta400 uma vez; UNBOUNDED realmente
misto ACCOUNT/INVESTMENT mantém UNKNOWN. Os controles passam. E31, sem fontes,
não é reduzido por vacuidade a KNOWN0 e não faz parte deste achado.

**Impacto e critério:** a permissão por fonte continua conservadora e não foi
demonstrada liberação indevida. Porém, o contrato integral ainda ensina dois estados
diferentes para o mesmo agregado, contrariando o primeiro critério de CF-028
(reconciliação e regra de cada payload). Trata-se de informação financeira conhecida
descartada pelo exemplo executável, não preferência de nomes, arquitetura ou auditoria.

**Condição objetiva de encerramento:** alinhar avaliador/fixtures/esperados atuais
à regra já escrita de total por dimensão, derivando o tipo do conjunto possível após
exclusões. E23/E28/E34 devem preservar400 e E32 deve totalizar500, mantendo os bloqueios,
livres UNKNOWN por fonte afetada e progresso não confirmado. Conservar um controle
com origens realmente de tipos distintos e E31 sem fontes, ambos incertos. Atualizar
resultados documentais e revalidar somente esse delta. Não mudar a política para
justificar o resultado do helper. Provas e pareceres históricos permanecem intactos.

## Matriz de critérios do resíduo

| Critério | Decisão e fundamento |
|---|---|
| Fonte elegível | Atendido: ACCOUNT/INVESTMENT BRL próprio, existente/proposto, inventário completo; saldo≤0/arquivamento não demonstram independência |
| Origem comprovada | Atendido: partes explícitas, evidência ASSIGNMENT, refs/owner/revisão e reconciliação nominal |
| Candidatas | Atendido: conjunto não vazio, único e exaustivo; mera lista encontrada não delimita risco |
| Evidência não circular | Atendido: registro de domínio ou declaração atual autenticada; claim, reserva, fontes, escopo, revisão, proveniência e inventário-base verificáveis; token-base separado do hash composto |
| Independência | Atendido: exclusão válida para cada reserva potencialmente incidente; cliente não envia autorização arbitrária |
| Vazio/desconhecido/encerrado | Atendido: CANDIDATES[] inválido; UNBOUNDED sem fontes continua pendente; CLOSED exige declaração, nominal0 e trilha; ausência de comandos não prova ausência de legado |
| União e sobreposição | Atendido: E24 e controles adicionais preservam bloqueios de outras reservas após CLOSE ou ASSIGN |
| Saldo e disponibilidade | Atendido: saldo preservado, livre UNKNOWN com incidência, capacidade0 não equivale a permissão; E21/E26 e controle saldo0 arquivado |
| Nominal sem origem | Atendido quanto a não duplicar por fonte e não promover a progresso; total por dimensão pendente conforme achado |
| Declaração atual | Atendido: não exige prova externa/histórica; valida autenticação, refs, revisões, consistência com fatos autoritativos e duplicações |
| Finalização | Atendido: sem alocação proibida pode concluir; fonte independente pode receber; nova destinação em afetada é400 atômico, sem exigir resolver todo legado |
| Recuperação | Atendido no contrato e snapshots: preview/recibo/GET coerentes, intenção imutável, replay COMPLETED conserva recibo original |
| Aceites anteriores | Preservados: R28-01, estados de conhecimento, reconciliação anterior, precisão, temporalidade, metas vinculadas e prazo original vencido |

## Conjuntos recalculados e transições

Oráculo próprio de conjuntos no novo script, sem calcular expected com evaluate:

| Casos | Conjunto e consequência conferidos |
|---|---|
| E21/E26 | Reserva11 afeta só A; B livre500. Reserva conhecida300 em A não prova livre700 com outra pendência |
| E22/E25 | Reserva11 afeta A/B; C independente.100 em C aceito;500 em B rejeitado |
| E23/E28/E29 |11 alcança A/B/C; novo ID não libera C; inventário obsoleto409 antes de efeitos |
| E24 | CLOSE11 deixa12 em B/C; A liberada |
| E27 | CLOSE11 permite500 em B; nominal encerrado0, saldos preservados |
| E30 | ASSIGN250 em A/150 em B: livres750/350, nominal400 e saldos1000/500 |
| E31 | Sem fontes: decisões vazias, reserva11 permanece UNBOUNDED |
| E32 | Exclusão comprovada libera C somente da11; A/B continuam afetadas |
| E33 | Arquivar A mantém11; expectedRevision1 versus revision2 retorna409 |
| E34 | Remover proposta CLOSE restaura11 em A/B |

Três lacunas de composição cobertas sem ampliar para validador de produto:
excluir C da11 com reserva12 em B/C ainda bloqueia C pela12; ASSIGN11 não remove12;
saldo0 arquivado mantém RESERVATION_UNCERTAIN apesar de capacidade numérica0.

ASSIGN completo admite múltiplas partes positivas, soma ampla e correção atual
confirmada, inclusive déficit legado real; não é aumento novo. CLOSE conserva
identidade/trilha e não exige fonte fictícia. Propostas não escrevem domínio antes
do commit; corrigir/remover antes de prepare faz SAVE/versionamento, PREPARED exige
cancelamento. Mesmo par em confirmação e nova alocação é erro semântico, não merge
silencioso. Nenhuma transição autoriza alteração patrimonial ou histórico financeiro.

O campo financialTransactions vazio no simulador é apenas saída documental: a
garantia de ausência de escrita real decorre do requisito, será provada futuramente.

## Concorrência e viabilidade

O inventário versionado inclui reservas sem sourceId, evidências e exclusões.
Fonte nova antes de prepare recalcula o universo; depois invalida a revisão.
CANDIDATES perde delimitação quando a exaustividade não pode ser revalidada.
Exclusão/arquivamento preservam pendência/tombstone. Alteração de vínculo/saldo,
transferência/reidentificação e reconciliação em outra aba exigem revalidação:
ID novo ou movimentação não herdam independência. Complete reconfere estado
autoritativo sob a coordenação já contratada antes de aplicar lote e recibo juntos;
409 exige revisão, enquanto replay concluído recupera o resultado original.

Requisitos observáveis suficientes para especificação; não há exigência de nova
arquitetura/locks nesta revisão. Trade-off: conservadorismo impede capacidade falsa
e permite ação independente, mas exige evidência versionada e relações fonte–reserva.
Custo O(N+R+E), pior E=N×R; leituras em lote evitam N+1. Paginação visual não pode
truncar o universo de decisão. Capacidade operacional e concorrência real são futuras.

## Provas executadas

O verificador entregue passou seus sete grupos,14 casos, seis snapshots e nove
contraprovas; os verificadores anteriores passaram9+9 grupos intactos. Isso foi
confirmado, sem adotar seu total UNBOUNDED como oráculo. Geradores inteiros coincidem
com os JSON, e um serializador independente recalculou os seis contentHash/reviewHash.
Prepare/complete/receipt/GET estão consistentes nos snapshots examinados.

| Contraprova entregue | Causa esperada confirmada | Controle legítimo |
|---|---|---|
| Origem ausente vira ausência de reserva | SOURCE_PROPAGATION | E23 |
| Escolha arbitrária de A | SOURCE_PROPAGATION | E22 |
| Liberar candidata | PERMISSION | E22 |
| Bloquear independente | INDEPENDENT_ALLOWED | E22 |
| CLOSE elimina outra reserva | SOURCE_PROPAGATION | E24 |
| UNKNOWN vira zero | SOURCE_PROPAGATION | E23 |
| Aceitar alocação proibida | FINALIZATION | E25 |
| Encerramento cria histórico | NO_FAKE_HISTORY | E27 |
| Ignorar versão/inventário | FINALIZATION | E29 |

Controles positivos executados antes das mutações; mutações em cópias/VM, nenhuma
persistida. Hashes iguais confirmam preservação, sem necessidade de restauração.

Aritmética independente em centavos: E01 contas1300 + investimentos501 − dívida350
= patrimônio1451; reservas550. E16 soma1999999999999.98 e E17 livre−1999999999999.98
permanecem exatos fora do teto individual. E18 conserva origem explícita e valor
UNKNOWN; E19 conserva300 comprovados e livre parcial500; E20 mantém zero comprovado
e NOT_APPLICABLE. E35 mantém patrimônio1500/reservas400 uma vez, progresso UNKNOWN.
R28-01 não apresenta regressão. O achado é no novo ramo de agregação por origem.

Comandos da raiz:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor 1c54533 dc02cd1
git log --oneline dc02cd1..HEAD
git diff --check 1c54533..dc02cd1
git diff --cached --stat
Get-FileHash README.md
node tasks/evidencias/revalidacao-CF-028-origem/verify.mjs
```

Execução independente passou na primeira rodada: exit0 significa que reproduziu
os verdes entregues **e detectou as quatro divergências esperadas**, não aprovação
do candidato. Resultado integral em result.json. Nenhuma suíte de produto, HTTP,
SQL, autenticação, persistência, atomicidade ou lock real foi validado. Helpers
documentais não são validadores gerais de todos os DTOs/combinações. Sem nova matriz
TZ, pois não houve delta temporal. Sem produto, banco real, push/deploy ou sucessoras.

## Decisões acumuladas e próximo passo

| Critério original CF-028 | Estado acumulado |
|---|---|
| Reconciliação e validação de cada payload | E01/R28-01/estados aprovados; falta coerência dos quatro exemplos novos por dimensão |
| Timeout, duas abas, fontes alteradas | Aceite anterior preservado e extensão de origem atendida |
| Sem histórico fictício/segunda carteira | Aceite anterior preservado e reconciliação atual atendida |
| Evidências, limites, testes não enfraquecidos | Registro completo; verdes entregues não ocultam a divergência encontrada |

R28-02 permanece aberto **somente pela consistência documental descrita**; alcance
de fontes, política autorizada e transições recebem aceite neste recorte. CF-028
não está integralmente aprovada e conserva em_revisao. Nenhum novo gate de produto,
auditoria externa ou autorização é solicitado. R28-01 segue encerrado.

Base para o saneamento: commit que contém este parecer, descendente de dc02cd1.
Próximo passo é exclusivamente alinhar as provas de total por dimensão e revalidar
esse delta. Após aprovação integral, permanece planejado o fechamento dirigido
CF-010–015. CF-029–034 e frontend não são iniciados/liberados nesta revisão.
