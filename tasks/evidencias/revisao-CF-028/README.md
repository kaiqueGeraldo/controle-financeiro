# Revisão independente CF-028 — 10/10/2026

**Não aprovada, com achados delimitados R28-01 e R28-02 (P2). CF-028 permanece
em_revisao.** O exemplo financeiro está correto e o protocolo está suficientemente
determinado como especificação; faltam representações coerentes no resumo para
agregados fora de faixa e dados legados desconhecidos. Não se exige implementação
de produto para encerrar estes achados. Não foi reescrita a SPEC para aprovar uma
solução do próprio revisor.

## Base, fontes e preservação

- Branch examinada: `codex/cf-028-contrato-onboarding`.
- Base: `c6a7c3ef3b563e9a432f80166aa4982a25180cd5`.
- Entrega/HEAD na entrada: `b7ebac85d1b6907ec1eacd4bf5ed2e008d4409ab`.
- Intervalo: `c6a7c3e..b7ebac8`; ancestralidade confirmada, exit 0. Sem commits
  posteriores na entrada. Staging vazio. Nenhum checkout/reset/merge/rebase.
- Nove arquivos no diff: SPEC, tarefa, README de evidências, gerador, fixture,
  verificador e três resultados TZ; 3355 inserções/57 remoções. Produto inalterado.
  Textos anteriores foram confrontados por `git show c6a7c3e:<arquivo>`;
  documentos/scripts atuais lidos integralmente, fixture inteira conferida pelo
  gerador em memória e examinada como objeto, inclusive envelopes e variantes.
- Único delta alheio: README raiz (40 linhas no diff, 20 inserções/20 remoções).
  SHA256 antes/depois `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
  Não editado, não staged e não incluído nos commits da revisão.
- AGENTS fornecido na conversa aplicado; busca na árvore/ancestrais não encontrou
  outro aplicável. AGENTS em node_modules/recharts não pertence ao recorte.

Lidos tasks/README, EXECUCAO, POLITICA-DE-TESTES, CF-028 e evidências completas;
SDD/README, SPEC-001/002/004 (FIN-01–08, FIN-06, NG-01, DEC-01/02/03),
CF-023/CONTRATO, CF-024/CONTRATO e CF-027/MAPA. Aceites confrontados na
[matriz CF-016–023](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), nos arquivos
canônicos das dependências, na [liberação CF-028](../revisao-CF-025-CF-027-RV24/README.md)
e no [parecer RD58](../revalidacao-RD58/README.md). Lidas CF-029–034 para confirmar
responsabilidades e dependências, sem executá-las.

Código consultado apenas para compatibilidade: AuthService/carteira,
AccountService/abertura, CreditCardService.recordOpeningPosition/CardOpeningPosition,
InvestmentService/CreateInvestmentDTO, GoalService/CreateGoalDTO/GoalType,
FinancialIntents e src/types/index.ts. Busca não encontrou onboarding de produto.
Diff de CreditCardService/domain/card desde `06c1a51` vazio: a capacidade liberada
não recebeu alteração posterior. Não se inferiu aprovação do produto pelo código.

## Matriz dos critérios originais

Critérios extraídos de CF-028 na base `c6a7c3e`, sem transformar checks do executor
em aceite independente. As seções referem-se à SPEC-001 do candidato.

| Critério | Trecho normativo | Exemplo/prova | Resultado | Lacuna/contradição | Condição de encerramento |
|---|---|---|---|---|---|
| Exemplo completo reconcilia patrimônio/dívida/reservas e cada payload tem regra de validação | §§3–5,7: posição, tipos e Summary | E01 recalculado em decimal independente; E02 e E03–15 confrontados | Parcial | R28-01/02: Summary não representa todos os estados exigidos | Saneamento documental dos tipos/validações/exemplos, revalidação dirigida |
| Reenvio após timeout, duas abas e alteração de fonte vinculada têm resultado determinado | §§5–6: identidade, versão, prepare, replay, snapshot, recuperação | Matriz de transições abaixo; envelopes da fixture | Atendido como contrato, ressalvadas representações do primeiro critério | Sem contradição independente no protocolo | Preservar protocolo; provas runtime pertencem CF-029/030/031/032 |
| Nenhuma etapa cria receita histórica, compra fictícia ou segundo saldo da carteira padrão | §3: abertura, INITIALIZE_DEFAULT, LINK, custódia; §6: commit único | 1300+501−350=1451; carteira100 substitui zero; fatura200 já contém50 | Atendido como especificação | Nenhuma identificada no recorte | Preservar invariantes ao sanear DTOs |
| Evidências e limitações registradas; testes não enfraquecidos | §9 e evidências do executor | 9 grupos/3 TZ, 5 causas inspecionadas, probes novos | Atendido | Harness não é schema completo nem prova de runtime; limitação declarada | Não promover verde documental a aceite de produto |

Trabalho original detalhado: DTOs/schema/erros atendidos parcialmente pelos mesmos
R28-01/02; versão/idempotência/default/NEW–COMPLEMENT atendidos como contrato;
ramificação/faturas/metas/progresso inicial atendidos. Não há decisão de produto
essencial sem resposta identificada. Implementação futura não é critério pendente
da CF-028. Limitações aceitas: sem histórico importado, sem preço externo, snapshot
do existente atual separado da abertura, sem prova runtime nesta tarefa.

## Achados

### R28-01 — P2 — Contradição normativa: agregados sem representação de fora de faixa

Local: SPEC-001:172–174, 191–200 e 338–343 (§§3–5).

Cenário A: duas contas novas de `999999999999.99`, cada qual com reserva desse
valor para a mesma meta monetária. Alvo `999999999999.99`; não há regra que limite
progresso ao alvo. Cada entrada/fonte/reserva cabe em Money e respeita capacidade.
Cobertura da meta é conhecida: `1999999999999.98`. Metrics tem OUT_OF_RANGE, mas
`ByGoal.covered:Fact<Money>` admite somente KNOWN com valor limitado, UNKNOWN ou
NOT_APPLICABLE. Nenhum representa corretamente o agregado conhecido fora da faixa.
`progress:string` determina escala, mas não explicita o tratamento desse agregado.

Cenário B: conta existente no piso `-999999999999.99` conserva reserva nominal
`999999999999.99` após débito real. FIN-05 preserva reserva com déficit; a própria
SPEC proíbe aumento, não apaga a reserva. Livre derivado é `-1999999999999.98`;
`BySource.free:Fact<Money>` também não o representa. Não há entrada individual
fora da faixa que justifique rejeitar automaticamente o perfil.

Esperado: aplicação coerente de FIN-06 e da regra explícita de agregado
OUT_OF_RANGE/null, sem número inválido, zero ou UNKNOWN que esconda a causa.
Especificado: Metrics possui essa variante; campos derivados em Fact não possuem.
Impacto: prepare/recibo exigem resposta impossível para entradas admissíveis;
cliente e servidor podem escolher saídas incompatíveis ou impedir complemento.

Encerramento: harmonizar representação/validação dos derivados em BySource/ByGoal
e demais agregados com a regra geral, incluindo progresso; fornecer exemplos
completos de prepare/receipt/GET para as bordas. Alternativa de rejeição exige
regra normativa explícita compatível com FIN-06 e com legado, não mero fallback
de implementação. Não é necessário ampliar limites de dinheiro de entrada.

### R28-02 — P2 — Omissão essencial: valor reservado/progresso legado desconhecido

Local: SPEC-001:338–352 (§5), relacionado a §§2–3 e FIN-01/05/08.

Cenário: complemento de usuário com conta1000 e informação legada de destinação
não reconciliada/valor obrigatório sem prova. §5 exige UNKNOWN, nunca zero;
marca allocations incompleta e impede novos vínculos. Mesmo assim,
`BySource.reserved:Money` exige um número. Para meta legada com progresso sem
prova, `ByGoal.progress:string` também não oferece estado de desconhecimento.

Esperado: conservar a fonte/meta e mostrar que a reserva/progresso não é conhecido,
sem atestar livre. Zero e300 são duas posições compatíveis com ausência de prova,
produzindo livres1000 e700; não se pode escolher uma silenciosamente.
Especificado: coverage/metrics podem ficar incompletos e free pode ser UNKNOWN,
mas reserved/progress continuam obrigatórios sem estado/omissão/null permitido.
Omitir a linha não é alternativa definida; o resumo abrange existentes, inclusive
não selecionados, e não declara listas parciais para estes casos.

Impacto: integração legada precisa inventar valor, emitir DTO inválido ou bloquear
uma entrevista que o contrato prevê como complemento. Não é pedido de reconstrução
histórica nem de completar CF-017: é representação de desconhecimento explícito.

Encerramento: determinar representação e validação desses campos e eventual
política de linhas incompletas, com exemplo completo de legado desconhecido e
controle de zero conhecido; preservar ausência de capacidade nova e separação
de completude entre dimensões. Harmonizar prepare, resumo congelado e recuperação.

### Observações não impeditivas

- **R28-N1 (P3, custo):** limites do request não limitam inventário existente.
  Summary inclui todas as fontes/metas/arquivados. Em COMPLEMENT, N/R precisam
  incluir esses registros: memória/hash/recibo podem crescer além dos 1200 IDs do
  draft, e retenção sem expiração multiplica snapshots. Registrar isso no desenho
  CF-030 e medir legado volumoso. Preferir projeções/agregações em lote; não impor
  nova infraestrutura. A especificação já proíbe SELECT secundário linear e exige
  medição; não há N+1 de implementação novo demonstrado nesta revisão.
- **R28-N2 (limite de prova):** trocar `newAllocationCapacity` de100 para999 na
  resposta sobrevive ao reconcile do executor. O contrato exige100; o script
  declara que não é schema completo. Não é defeito normativo adicional nem razão
  para reescrever todos os verificadores. Acrescentar os exemplos dos achados
  deve cobrir os estados reais, sem alterar expected para aceitar a entrega.

## Reconciliação e fronteiras

Oráculo manual e [probe.ps1](probe.ps1) usam entradas, não expected do executor:
contas100+1000+200=1300; investimentos500+1=501; ativos1801; dívida200+50+50+50=350;
patrimônio líquido1451. O contrato chama essa grandeza de patrimônio, coerente
com FIN-01. Não há segundo patrimônio a calcular abatendo dívida outra vez.
Reservas300+200+50=550:350 em contas e200 em investimento. Livre de contas950,
investimentos não destinados301. Principal194+150=344; limite1000−344=656.
Viagem500, reserva50, leituras4 livros. Progresso4 não entra em dinheiro.

Pagar200 depois: contas1100/dívida150/patrimônio1451; encargos6/principal194
liquidados, comprometimento150/disponível850; reservas550 e livre de contas750.
É saída de caixa posterior, sem nova despesa de compra. Previsão80 não altera
posição/realizado. CustoUNKNOWN da renda fixa impede ganho, não avaliação500.

| Cenário independente | Resultado/condição |
|---|---|
| FIN clássico conta1000+investimento500−dívida200/reserva300 | Patrimônio1300, livre700; reserva não soma ativo |
| Custódia1200 contém ativo1000 | Conta200+ativo1000; confirmação de caixa não aplicado evita2200 |
| Conta−100, investimento500, crédito20, dívida200 | Patrimônio220; descoberto não subtraído novamente; crédito não aumenta limite |
| Carteira80 com fatos, proposta INITIALIZE_DEFAULT100 |409 sem saldo180/segunda carteira; LINK conserva80 |
| Fonte1000/reserva300, destinação adicional700/700.01 |1000 cabe;1000.01 falha; valor enviado por par é final, não delta |
| Investimento150/reserva nominal200 após queda | Déficit50; reserva permanece200; sem capacidade nova |
| CustoUNKNOWN versus KNOWN0 | Ganho indisponível versus custo zero declarado; sem custo fabricado |
| ValuationUNKNOWN versus zero declarado | Subtotal/sem nova reserva versus valor0 conhecido |
| Fatura200 já incluindo50 e três futuras50 | Dívida350, não400; mesma competência é inválida |
| Principal/encargosUNKNOWN com dívida350 | Patrimônio conhecido; comprometimento/disponívelUNKNOWN |
| 1×1.005;0.125×10.04 | HALF_UP1.01/1.26; entrada Money1.005 inválida |
| TOTAL1/3 e TOTAL1/200000000 | Remanescente0.67/0.33/0; metade0.50; preço derivado não redefine total |
| Quantity0.00000001/TOTAL máximo | Total válido, teto de preço informado não vale para preço derivado |
| Duas fontes máximas e reservas na mesma meta | R28-01; total global fora de faixa tem estado, detalhes não |
| Reserva legada desconhecida versus zero | R28-02; não fabricar zero para preencher Summary |

Regras impedem receita histórica, compra fictícia, limite como ativo e reserva
como ativo adicional. Isso é demonstração da consistência econômica especificada,
não comprovação de que endpoints inexistentes já aplicam as proibições.

DEC-ONB-01 localizada na SPEC §1 e README de entrega: aceitar prazo original
hoje/passado para meta preexistente, atrasada apenas incompleta e com prazo menor
que hojeNavegador. DTO CivilDate e validação final não impõem futuro; E01 usa
30/09/2026. Hoje não atrasa; vencida concluída não atrasa. A diferença do
CreateGoalDTO/@FutureInProductZone está atribuída à CF-030, sem alterar criação
cotidiana. Não foi necessário pedir novamente a decisão registrada.

Datas: baseDate≤hojeProduto/SP; sugestão hojeNavegador em UTC+14 pode ser rejeitada
explicitamente, sem converter dia. Prazo/status usa navegador; avaliação/aquisição
civil≤baseDate; competência YearMonth; vencimento DEC-03 ou override civil;
auditoria Instant UTC Z exibida SP. Hora de abertura é rejeitada; origem desconhecida
não recebe meia-noite nem instante inventado. Fevereiro2027/2028=28/29; fecha31,
vence30 leva vencimento ao mês seguinte; avanço por mês não herda dia reduzido.

## Entrevista, transições e recuperação

Campos/tipos/enums, precisão/escala, booleanos, nulabilidade, referências por
tempId/id exclusivo, unicidade, owner, erros por JSON Pointer, tamanho/profundidade
e versões string estão definidos. Folhas ausentes são toleradas no draft;
valores presentes malformados não. Money/Quantity/Price usam strings até banco
decimal e volta; nenhum Number intermediário é necessário. Os achados são sobre
estados de resposta, não falta de precisão aritmética no transporte escolhido.

| Pré-condição / entrada | Efeito exigido | Erro / recuperação |
|---|---|---|
| NOT_STARTED, SAVE versão0 | Cria sessão IN_PROGRESS/versão1; sem finanças | inválido400; GET após resposta perdida |
| IN_PROGRESS, SAVE vigente | Snapshot completo/versão+1; revalida dependentes | stale409 mantém edição local para comparar |
| IN_PROGRESS, PAUSE; SKIPPED, RESUME | Conserva respostas; SKIPPED→IN_PROGRESS | preparar SKIPPED exige retomar; versão vigente |
| Sem intenção, DISCARD explícito | Limpa payload; tombstone SKIPPED/versão+1 | SAVE posterior reutiliza sessão/versão atual |
| NONE/DEFERRED, mudança de resposta | Listas vazias após confirmação; DEFERRED não é zero | dependentes inconsistentes viram issues; corrigir antes de prepare |
| Fonte removida/alteração data-base | Referência pendente conservada; revisão invalidada | corrigir/vincular/remover explicitamente |
| IN_PROGRESS válido, prepare | PREPARED durável congela snapshot; sem finanças | referências404/regras400; versão409; corrigir |
| PREPARED, editar/pausar/descartar | Sem edição concorrente do confirmado | INTENT_PENDING; cancelar antes de salvar |
| Duas abas salvam versão3 | Uma versão4 | outra409, sem overwrite automático |
| Dois prepares/IDs diferentes | Só uma intenção PREPARED | INTENT_PENDING; recuperar sessão |
| Duplo clique/complete idêntico | Commit único; replay do snapshot original | LOCK_CONFLICT recuperável, não novo UUID |
| Mesma identidade/outro conteúdo/hash/versão | Nenhum efeito adicional | INTENT_CONTENT_CONFLICT; recuperar original inclusive pós-commit |
| Timeout/resposta perdida/reload/5xx | RESULT_UNKNOWN; GET operação/sessão | PREPARED não prova rollback; retry explícito idêntico |
| Nova chave quando resultado desconhecido | Não oferecer como retry | reconciliar operação/sessão;404 não prova não execução |
| Fonte muda/reserva concorrente | Revisão antiga não aplicada | SOURCE_CHANGED; cancelar/reler/preparar/confirmar |
| Fonte removida/alheia; própria arquivada | Sem efeitos |404 uniforme; alteração própria409 |
| Falha último item/recibo | Rollback integral; PREPARED recuperável | recuperar; cancelar/corrigir quando necessário |
| Cancel vs complete | Mesmo lock decide ordem | cancel primeiro→409 complete; commit primeiro→409 cancel/recuperar |
| Cancel repetido |200 estado original sem incremento novo | prepare CANCELLED409, usar nova intenção após cancel confirmado |
|401 expiração | Draft durável | reautenticar mesmo owner e recuperar |
| A→B com resposta tardia | Limpa memória/cache e invalida geração | callback de A não pode atualizar B |
| COMPLETED ou reentrevista | Terminal; recibo imutável; ajustes regulares | mutações409 ALREADY_COMPLETED; replay preserva IDs/instante |
| Recibo200 inválido ou refresh falha | Inválido→UNKNOWN; válido+refresh falho→concluído/atualização pendente | recuperar mesmo ID ou só refazer leituras respectivamente |

Não foi identificado estado sem saída no protocolo ordinário. Os dois achados
impedem formar alguns resumos válidos e precisam ser saneados antes de aceitá-lo
para todos os perfis previstos. Não foram impostos layouts ou detalhes visuais.

Atomicidade local com recibo na mesma transação é viável no monólito. Intenção
antes das fontes, contas ordenadas antes dos investimentos, integração da ordem
de cartões/metas com writers existentes e guard comum/serializable são obrigações
da CF-030; não se atribui proteção a um lock isolado no onboarding. Batch de fontes
e reservas evita N+1; custo O(N+R), ordenação O(N log N), hash O(bytes), escritas
lineares. Guard do owner custa contenção por usuário; serializable custa aborts.
Ambos dispensam saga/Kafka. Não há medida runtime nesta revisão.

## Compatibilidade e limites dos aceites

Carteira atual é CASH/SYSTEM_INITIALIZED zero, sem identidade default persistida:
adaptação CF-030 reconhecida. AccountService grava abertura sem receita. Cartão
possui abertura corrente/futuras e lock, mas não o novo contrato de componentes
desconhecidos/crédito/override; diferença CF-030. Investimento atual exige ticker,
quantidade e reportingKnownFrom=hoje; modalidade monetária sem unidades fictícias
e metadados/data-base são adaptações declaradas. GoalService separa progresso
numérico/reserva; prazo preexistente/unit requerem DTO próprio. FinancialIntents
só tem kinds TRANSACTION_CREATE/INVESTMENT_OPERATION: prepare/cancel/session são
futuros, não capacidades herdadas. Frontend ainda usa number em balance/currentValue;
CF-031 precisa tipos/validação próprios, sem conversão intermediária do v1.

CF-029 é dona de sessão/schema/GET/PUT; CF-030 de integração financeira e migrações
novas, unknown nos leitores e protocolo; CF-031 entrevista/consumidores; CF-032
jornada integrada; CF-033/034 mantêm gates posteriores. CF-019 libera dívida/
parcelas/abertura só para especificação; RVA-03 não é aprovado por associação.
CF-017 adoção real e CF-015 frontend continuam separados. Nenhuma dessas pendências
foi usada como bloqueio genérico desta especificação, nem houve liberação das
sucessoras. Não há produto implementado pelo diff de CF-028.

## Comandos e evidências executadas

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor c6a7c3e b7ebac8
git diff --stat c6a7c3e..b7ebac8
git diff --check c6a7c3e..b7ebac8
git diff --cached --stat
Get-FileHash -Algorithm SHA256 README.md
& tasks/evidencias/revisao-CF-028/probe.ps1
node tasks/evidencias/revisao-CF-028/harness.mjs
```

[Resultado decimal independente](probe-result.json) e
[execuções/causas/fixture](harness-result.json). Node v24.18.0. O harness executa
o verificador entregue intacto em três processos/TZ:9 grupos aprovados em cada um.
Gerador executado em VM com saída interceptada em memória produz bytes idênticos
à fixture inteira; nenhum arquivo da entrega regravado. Hashes verificam
consistência interna; não autenticam finanças nem execução runtime.

Cinco corrupções têm causas reais: patrimônio2001 falha contra1451; parcela no
mês corrente falha por competência; reserva1000.01 por capacidade; Number por
tipo decimal;29/02/2027 por calendário. A primeira altera expected, portanto
prova confronto de oráculo, não mutação de produto. As outras são inputs em cópias
em memória. Os nove grupos cobrem exemplo/tipos/cálculos/datas/recibos/hashes/
contraprovas/E14/links e README. Não cobrem schema/protocolo completos; o campo
de capacidade adulterado demonstra um limite concreto. Três TZ apenas confirmam
independência documental do calendário inteiro, não comportamento JVM/browser.

Probes novos usam .NET decimal, operações literais e calendário .NET, sem importar
o algoritmo BigInt do executor. Demonstram cálculo E01, HALF_UP, terços NG-01,
pagamento, negativo, prazo e os cenários contraditórios. Não simulam uma API como
se executada. As contradições são derivadas dos tipos textuais citados; o probe
não é um compilador de toda a SPEC nem um teste de produto vermelho.

Ocorrências do ambiente/harness: alias python.exe do Windows não pôde iniciar;
nenhuma dependência foi instalada, utilizado PowerShell/.NET. Primeira execução
do probe falhou por precedência de vírgula na expressão de array, antes de
concluir; corrigidos somente parênteses do harness, expected inalterado. Rodada
posterior passou. Essa falha não é evidência financeira. Saídas extensas de leitura
foram truncadas; trechos normativos/aceites relevantes foram relidos dirigidamente.

Sem suítes de produto, HTTP, SQL, banco real, migração, build, push ou deploy:
nada disso é necessário para resolver contradições de DTO numa especificação.
Nenhuma alteração em CF-029–034 ou início do fechamento frontend CF-010–015.

## Encaminhamento

Sanear **apenas R28-01/02** em SPEC-001, DTOs lógicos, validações e exemplos de
resumo/prepare/receipt/GET; preservar as provas desta revisão e adicionar casos
válidos/contrários para esses estados. Revalidação dirigida dos campos afetados e
dos quatro critérios originais; não solicitar revisão global nem implementar
CF-029. Usar o HEAD que contém este parecer como base do saneamento (descendente
de b7ebac8, mesma branch), preservando README. Após aceite da especificação, a
sequência escolhida continua fechamento dirigido CF-010–015, sem início automático.
