# Revalidação independente R28-01/02 — 10/10/2026

**R28-01 encerrado. R28-02 parcialmente saneado, permanece aberto (P2).
CF-028 não aprovada integralmente; em_revisao mantido.**

Os DTOs agora representam os valores e os estados antes impossíveis. O resíduo
é a propagação de incerteza quando uma reserva legada não tem fonte identificável:
o contrato restringe o bloqueio à fonte afetada, mas não determina como identificar
o conjunto afetado nesse caso. Não há achado novo de recuperação, precisão ou
concorrência. Não se exige produto nem revisão global para encerrar o resíduo.

## Base, escopo e preservação

Branch `codex/cf-028-contrato-onboarding`; HEAD de entrada e candidato examinado
`4dc5f674833ebc4b6d9d44c6f3dd2e21193d1be4`; base
`ef5cfae3805428f57562e3104284a41570d43811`; intervalo integral `ef5cfae..4dc5f67`.
Ancestralidade confirmada, sem commits posteriores na entrada. Staging vazio.
Único delta alheio: README raiz, SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Preservado e excluído do staging/commit da revisão.

Diff:16 arquivos,7583 inserções/185 remoções; apenas contrato, tarefa, fixtures,
geradores, verificadores e evidências. Parecer/provas originais e produto sem
delta. AGENTS da conversa aplicado; busca na árvore fora de dependências e nos
ancestrais não encontrou outro aplicável. Lidos/reconferidos tasks/README,
EXECUCAO, POLITICA-DE-TESTES, CF-028, parecer/matriz/probes originais, SPEC-001
original mais diff completo do saneamento, FIN-05/06/NG-01 e fundamentos financeiros
da revisão anterior. Normas comuns, SPEC-004 e provas originais não mudaram.

[Entrega e encaminhamento](../saneamento-CF-028-R28/README.md) confrontados com
scripts, baseline e resultados antes/depois. Fixtures completas foram regeneradas
somente em memória e comparadas byte a byte, além da inspeção das entradas,
estados, envelopes e casos. Não foi preciso executar geradores sobre a entrega.

## R28-01 — encerrado como especificação

SPEC-001 §§3–5 e E15–17 separam limite individual de representação agregada.
FIN-06 admite informar agregado fora da faixa; decimal exato acompanhado do
indicador atende a isso. Não é necessário preservar o antigo OUT_OF_RANGE/null
quando o novo contrato mantém a distinção explicitamente e sem perda.

| Categoria/campos | Representação, sinal, escala e limite verificados |
|---|---|
| Entradas Money; BySource.value; ByCard.debt/credit | String decimal individual; M=999999999999.99; contas admitem negativo; demais não negativos e >0 onde o comando exige |
| Quantity/Price informados | String até12 inteiros/8 decimais; Q=999999999999.99999999; não negativos; condições >0 preservadas |
| Metrics.accountsSigned/netWorth | SummaryAmount de AggregateMoney assinado,2 casas exatas; sem teto agregado fixo |
| Metrics.investmentsValue/cardCredit/cardDebt/reservedAccounts/reservedInvestments | Mesmo agregado, não negativo; soma dos componentes, sem somar reserva como ativo |
| Metrics.freeAccountCash/unallocatedInvestments; BySource.free | Agregado assinado,2 casas; déficit não é cortado em zero |
| BySource.reserved; ByGoal.progress MONETARY/covered | Agregado não negativo,2 casas; progresso não limitado ao alvo |
| BySource.newAllocationCapacity | Não negativo, max(0,free) quando calculável, ≤M por fonte; unknown não autoriza reserva |
| ByCard.committed/availableLimit | Principal≤dívida individual M; disponível entre−M e M; crédito não aumenta limite |
| ByGoal.progress NUMERIC | AggregateQuantity não negativo,8 casas; leitura não recebe teto arbitrário de contribuições; input inicial continua≤Q |

Todos os campos apontados no achado original estão abrangidos, incluindo progress,
covered, free e totais/intermediários. Indicador compara valor absoluto/subtotal
com teto da unidade, sem transformar excesso em UNKNOWN. Valores individuais são
validados antes de somar; compensar dois inputs inválidos não os torna válidos.
Sem Number, truncamento, clamp no teto ou arredondamento de parcelas já canônicas.

Recalculo independente a partir dos comandos/legado, usando .NET decimal:

- E16: duas fontes/reservas de999999999999.99 dão1999999999999.98; cobertura,
  progresso e patrimônio KNOWN/indicador true; livre0.00.
- E17: conta−999999999999.99 menos reserva999999999999.99 dá
  −1999999999999.98, KNOWN/true; capacidade/cobertura0 conhecidos.
- Legado com101 fontes máximas dá100999999999998.99: leitura válida além do
  limite derivado100M do draft. Não se aplica a restrição de50 contas ao inventário.
- Q+0.00000001=1000000000000.00000000 é leitura numérica válida, input inválido.
- Intermediário2M seguido de passivoM resultaM; não rejeitar intermediário agregado.

Os limites derivados [−50M,50M],50M,20M,20M e patrimônio[−70M,120M] conferem.
100M é limite superior das novas reservas com100 fontes, não teto legado. Operação/
posição individual permanece limitada. Recursos não são ilimitados: CF-030 deve
medir/configurar bytes/memória/tempo/recibo;503 SUMMARY_CAPACITY_EXCEEDED não pode
truncar resumo, produzir commit parcial ou ser traduzido em regra financeira.
Recuperação de recibo persistido mantém identidade;5xx não prova rollback no cliente.
É escolha técnica coerente, sem nova decisão material de produto necessária.

## R28-02 — aceite parcial e resíduo P2

**Representação corrigida:** KNOWN exige valor=subtotal, inclusive zero, sem
lacunas; PARTIAL exige subtotal e componentes conhecidos/desconhecidos, value=null
e lacunas; UNKNOWN exige value/subtotal/indicador null e lacunas; NOT_APPLICABLE
só covered NUMERIC, sem valor/lacunas. Não há uso de zero para ausência. O verificador
testa combinações inválidas e controles legítimos, incluindo parcial com subtotal0.

E18 preserva patrimônio1000 conhecido e reserva/progresso/free desconhecidos;
E19 conserva reservas300 PARTIAL e livre500 PARTIAL da fonte independente;
E20 tem reserva/progresso0 KNOWN e capacidade1000. A incerteza de custo/reserva
não apaga avaliação/patrimônio/dívida conhecidos. Quantia parcialmente reservada
não certifica livre: saldo−subtotal reservado não é disponibilidade. Reduzir par
comprovado não fabrica capacidade enquanto outro vínculo é desconhecido.

### Omissão essencial remanescente: reserva sem atribuição segura de fonte

Local: SPEC-001:438–466 e472–474 (§5); exemplos E18/E19:654–655;
build-cases.mjs: E18/E19 sempre fornecem sourceId. Condição original de encerramento
R28-02: propagação de desconhecimento e preservação da ausência de capacidade nova.
Contratos pertinentes: FIN-05 (capacidade por fonte) e SPEC-001 §3 (legado sem prova).

Entradas sintéticas: contas A1000 e B500; indicação legada de reserva400 cujo
vínculo não permite determinar se a fonte é A ou B; proposta de nova reserva500
em B. O valor400 é usado para construir dois mundos compatíveis com a evidência,
não para atribuir uma origem ou uma reserva confirmada por inferência.

| Mundo compatível com o registro incompleto | Reservado previamente em B | Após nova reserva500 em B |
|---|---:|---:|
| Reserva antiga recaía sobre A |0 |500, cabe |
| Reserva antiga recaía sobre B |400 |900, excede saldo500 |

**Esperado:** enquanto não for possível excluir B das fontes afetadas, não atestar
que B dispõe de500. Se prova identificar A e excluir B, permitir uso de B conforme
sua capacidade. Não duplicar a reserva400 nos totais para representar a incerteza
nas duas fontes; tampouco inventar um sourceId. A indisponibilidade deve ser
localizada pelo alcance demonstrável da incerteza, podendo alcançar todas as
fontes candidatas quando não houver evidência que as exclua.

**Especificado:** “nessa fonte”, “fonte não reconciliada” e “nenhum bloqueio global”,
com LINK/novos dados independentes permitidos. O texto não define atribuição da
incerteza quando falta a identidade da fonte, nem o critério que comprova a
independência de B. UNKNOWN de valor, por si só, não resolve UNKNOWN de vínculo.
A proibição de nova referência quebrada no draft não estabelece tratamento de
inventário legado que o complemento preserva sem modificar.

Não se afirma que o contrato manda aceitar os900, nem que exista bug de produto
executado: falta o resultado normativo determinado para essa entrada. Aplicar
apenas os bloqueios por sourceId disponível pode deixar B falsamente livre;
bloquear qualquer usuário com qualquer legado desconhecido prejudica fontes
comprovadamente independentes. Essa lacuna é material para CF-030/031.

**Condição objetiva de encerramento:** definir como representar/classificar
reservas sem fonte comprovada ou com conjunto ambíguo de fontes, o alcance dos
bloqueios e a prova de independência, propagação a resumo/total/lacunas sem dupla
contagem e recuperação após reconciliação. Acrescentar caso completo com vínculo
ausente, controles de fonte identificada e conjunto parcialmente delimitado;
confirmar erro de aumento na fonte possivelmente afetada e liberação só após
nova revisão/snapshot válido. Preservar conclusão sem modificar vínculos quando
segura. Não exigir implementação nem reconciliação de banco real nesta tarefa.

Não há decisão material do usuário pendente identificada: impedir sobrealocação
e não inventar origem já decorrem de FIN-05/legado. O executor precisa completar
a regra técnica de atribuição de incerteza; não cabe ao revisor escrever essa
solução na SPEC e aprová-la. Não é necessário perguntar novamente DEC-ONB-01.

## Matriz de segurança por fonte

| Cenário | Resultado do confronto |
|---|---|
| Fonte conhecida1000, nenhuma reserva comprovadamente | capacidade1000 KNOWN; alocação admissível até esse montante |
| FonteA1000, reserva desconhecida comprovadamente em A | free/capacidade UNKNOWN em A, bloqueio; patrimônio conhecido preservado |
| Duas metas em A,300 conhecido + reserva desconhecida | não autorizar mais700: um mundo com reserva desconhecida400 levaria1400; redução do par conhecido não certifica livre |
| Meta usa A incerta e B comprovadamente independente com200 | conservar200 como subtotal do progresso/cobertura se coberto; B500−200=300 livre conhecido; não contaminar B pela mera identidade da meta |
| Mistura A não reconciliada/B reconciliada | E19 válido porque fonteB e ausência de reservas estão comprovadas; bloquear A, preservar B |
| Origem ausente, A ou B possíveis | Resíduo R28-02: classificação/alcance não determinados; não presumir independência de B |
| Origem demonstravelmente restrita a subconjunto | bloquear fontes potencialmente afetadas, preservar exclusões comprovadas; falta formalização/exemplo do subconjunto na canônica |
| Fonte muda saldo500→400 após preparar alocação500 | SOURCE_CHANGED antes de efeito; cancel/reler/preparar/confirmar, aceites anteriores preservados |
| Reconciliação posterior identifica fonte/proveniência | precisa invalidar snapshot antigo e recalcular capacidade; caminho geral já exige nova revisão, classificação do vínculo ambíguo ainda pendente |

## Critérios originais e aceites reutilizados

| Critério CF-028 | Parecer anterior | Delta/prova atual | Resultado |
|---|---|---|---|
| Exemplo reconcilia patrimônio/dívida/reservas e cada payload tem validação | Parcial por R28-01/02 | E01 preservado; agregados e estados corrigidos; falta vínculo legado sem fonte | Parcial somente pelo resíduo R28-02 |
| Timeout, duas abas e fonte alterada determinados | Aceito como especificação | Protocolo inalterado; estados integram reviewHash; snapshots consistentes | Aceite preservado, com classificação de incerteza pendente no primeiro critério |
| Sem receita histórica, compra fictícia ou carteira duplicada | Aceito | Inputs e ações de abertura/default não mudaram; E01 recalculado | Aceite preservado |
| Evidências/limitações; testes não enfraquecidos | Aceito | Alteração de acesso .value acompanha DTO, mesmas expectativas; capacidade agora checada; oito contraprovas causais | Atendido; limites dos verificadores registrados |

Reutilizados os aceites de isolamento, recuperação, concorrência, origem financeira,
metas vinculadas, decimal e temporal da revisão ef5cfae. DEC-ONB-01 continua aceitando
prazo original hoje/passado, atraso só se incompleta e prazo<hojeNavegador; nenhum
delta nessas regras. Não se reexecutou a revisão global desses temas.

Summary mudou: contentHash do mesmo draft E01 é idêntico; reviewHash muda e propaga
ao fingerprint. Preparação/recibo/GET de cada fixture conservam o mesmo snapshot.
v1 ainda não publicado admite ajuste documental; não há migração/re-hash de recibo
real. Erros400 por fonte/par e503 operacional estão descritos; request256KiB não
limita automaticamente response legado. CF-029 preserva escrita; CF-030 possui
agregação/guardas/recursos; CF-031 consumidores e CF-032 integração. Nenhuma liberação
automática CF-029–034 ou alteração de dependências. CF-015/017/019 não bloqueiam
genericamente esta especificação e não foram aprovadas por associação.

## Provas executadas e limites

[independent.ps1](independent.ps1) / [resultado](independent-result.json): .NET
decimal a partir das entradas, sem BigInt/helpers do executor como oráculo.
E01:100+1000+200=1300 em contas,500+1=501 em ativos investidos,
200+3×50=350 em dívida,1300+501−350=1451 em patrimônio;300+200+50=550 reservas.
E16/E17, legado101 fontes, fronteiraQ e mundos contraditórios calculados à parte.

[verify.mjs](verify.mjs) / [resultado completo](verification-result.json): executa
intactos os verificadores entregues (E01:9 grupos/5 corrupções; R28:9 grupos/8
contraprovas), compara geradores/fixtures inteiras em memória e registra hashes
antes/depois de todos os16 arquivos da entrega, README e provas originais.
Nenhuma corrupção persistida; hashes idênticos dispensam restauração de arquivos.

| Contraprova entregue | Violação / causa confirmada | Controle legítimo |
|---|---|---|
| Agregado arredondado | Soma1999999999999.98 trocada por2000000000000.00: SUM_MISMATCH | E16 exato passa |
| UNKNOWN→zero | Falta tratada como soma vazia: COMPLETENESS | E18 UNKNOWN passa |
| Subtotal→total | Livre500 parcial promovido a KNOWN: COMPLETENESS | E19 PARTIAL passa |
| Estado removido | Campo obrigatório ausente: AMOUNT_FIELDS | Objeto completo passa |
| Capacidade999 em vez de1000 | CAPACITY_RECONCILIATION | E20 capacidade1000 passa |
| Parcela acima deM | INDIVIDUAL_RANGE | Fonte individual no máximo passa |
| Reaplicar teto individual a agregado | Mutante rejeita leitura legítima2M: INDIVIDUAL_RANGE | Leitura2M no helper original passa |
| Remover teto individual | Mutante deixa passar input inválido: Missing expected exception | Helper original rejeita pela faixa |

As duas últimas mutam o verificador documental em VM, não produto. As seis primeiras
mutam somente cópias. Causas específicas e controles positivos confirmados, sem
usar SyntaxError/importação como falha esperada.

Limites concretos adicionais: validateCase aceita E16 com input individual válido
alterado para1.00 e resumo original, porque reconcilia contra componentes paralelos;
também aceita E19 sem sourceId, pois não deriva atribuição das reservas do inventário.
O primeiro é lacuna de prova, **não bloqueante normativo**: texto exige soma correta,
e cálculo independente confirma a fixture legítima. O segundo evidencia que E19
não testa o resíduo de vínculo; a omissão é confirmada no texto, não inferida apenas
do verde do script. Recomenda-se ligar componentes às entradas nos casos dirigidos,
sem exigir um validador integral de produto nesta especificação.

Comandos reproduzíveis, da raiz:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor ef5cfae 4dc5f67
git diff --stat ef5cfae..4dc5f67
git diff --check ef5cfae..4dc5f67
git diff --cached --stat
Get-FileHash README.md
& tasks/evidencias/revalidacao-CF-028-R28/independent.ps1
node tasks/evidencias/revalidacao-CF-028-R28/verify.mjs
```

Execuções novas passaram na primeira rodada. Aritmética independente confere
correção financeira dos exemplos; geradores/hashes verificam consistência interna;
leitura normativa decide completude. Nenhuma dessas camadas certifica runtime.
Não repetida matriz TZ sem delta temporal; os três fusos da revisão original
continuam prova documental histórica. Sem builds/suítes de aplicação, banco,
HTTP, migração, push/deploy, checkout/reset/merge/rebase/clean.

## Encaminhamento

Usar o HEAD contendo esta revalidação, descendente de4dc5f67, para sanear **somente
o resíduo de R28-02: atribuição incerta da fonte e alcance dos bloqueios**. Acrescentar
regra e exemplos/contraprovas coerentes de snapshot/recibo/recuperação e revalidar
esse delta, preservando o encerramento de R28-01 e os aceites anteriores.
Não iniciar CF-029 nem frontend. Após aprovação integral, a sequência planejada
continua fechamento dirigido CF-010–015, sem execução automática nesta revisão.
