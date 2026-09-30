# Saneamento CF-016–CF-021

Base: `4e685ce` (candidato revisado `46d9fad`). Marco aguardando revisão independente.
Início em 29/09/2026; execução local, sem banco real, Railway, emails, push ou deploy.
README raiz preexistente preservado: SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Achados e evidências vermelhas originais permanecem em `../revisao-CF-018-CF-021/`.
RV/UI são nomes de probes, não identificadores de achados.

## Matriz de saneamento

| ID original | Causa / critério | Dona | Correção realizada | Testes / evidência | Situação / limites |
|---|---|---|---|---|---|
| RVI-01 | Writer ignora destinação; FIN-05 | CF-018/020 | Capacidade sob lock da fonte | RV01/RV13 | Corrigido/verificado; A + writers/precisão, FIN-05/B17 preservados |
| RVI-02 | PUT reescreve previsão; FIN-02 | CF-018 | Delegar baixa preservando original | RV02 + consumidor | Corrigido/verificado; A + SAN-D2, previsão e cadeia preservadas |
| RVI-03 | Arquivo não aplicado a todos writers; B16 | CF-018/020 | Regra comum de conta ativa | RV03 + writers cruzados | Corrigido/verificado; nove writers e arquivo concorrente em PostgreSQL |
| RVI-04 | UI soma lista selecionável; FIN-01 | CF-018/021 | Projeção de posição inclui arquivo | SAN-E2 + reload | Corrigido/verificado; checkpoint E2 |
| RVI-05 | Ausência de cobertura vira zero; FIN-08 | CF-021 | Cobertura em API/UI/XLSX | RV04 | Corrigido/verificado; E3, API/UI/XLSX e limites de origem/faixa |
| RVI-06 | null convertido em zero na UI; FIN-04 | CF-020 | Preservar indisponibilidade | UI04 | Corrigido/verificado; SAN-C e SAN-E2; desconhecido distinto de encerramento |
| RVI-07 | Encerramento mantém avaliação desconhecida; FIN-04 | CF-020 | Zero conhecido na posição encerrada | RV06 | Corrigido/verificado; SAN-C e regressões FIN-04, zero encerrado conhecido |
| RVI-08 | Provento mistura caixa e gerencial; E27 | CF-020/021 | Caixa líquido, receita/taxa brutas | RV08 + SAN-E27 + XLSX | Corrigido/verificado; checkpoint E27 |
| RVI-09 | Fronteira decimal/limites; FIN-06 | CF-018/020 | Decimais canônicos e limites de agregação | RV09/RV10/C05 | Corrigido/verificado; RV09/RV10/C05/C06, agregados e inventário de fronteiras |
| RVI-10 | Ano selecionado remove posição atual; DEC-04 | CF-021 | Posição datada independente do ano | RV05 + SAN-E2 | Corrigido/verificado; checkpoint E2 |
| RVI-11 | Intenção sem identificação; FIN-07 | CF-019 | Nova chave/intenção, retry e recuperação | UI02/R03 | Implementado/verificado no D1; limites de sessão abaixo |
| RVI-12 | Sugestão usa consumo original; FIN-03 | CF-019 | Exibir saldo pagável/crédito | UI02 | Implementado/verificado no D1; limites de sessão abaixo |
| RVI-13 | DTO omite checklist; FIN-05 | CF-020 | Carregamento com ownership sem N+1 | UI03 | Corrigido/verificado; SAN-B e carregamento em duas queries, sem N+1 |
| RVI-14 | UI trata meta como custódia; FIN-05/07 | CF-020 | Fonte explícita, liberação e modais acessíveis | UI03 + jornada completa | Corrigido/verificado; SAN-B/SAN-BC-card, fonte e histórico após exclusão |
| RVI-15 | Cartão perde vínculo com intenção; FIN-07 | CF-020/019 | Vínculo de compra persistente | RV11 + parcial/total | Corrigido/verificado; SAN-BC-card com pagamento20/120, retry sem efeito |
| RVI-16 | Clock com frações invalida hora; SPEC-002 | CF-020 | Hora interna canônica | RV16 | Corrigido/verificado; RV16 + browser com Clock fracionário |
| RVI-17 | Resgate monetário vira unidades a 1; B08 | CF-020 | Comando monetário com custo proporcional | UI06 + domínio | Corrigido/verificado; SAN-C e B08 em PostgreSQL/reload |
| RVI-18 | Ajuste sem invariantes/auditoria; FIN-04/07 | CF-020 | Data, origem, motivo e posição válida | RV15 + UI | Corrigido/verificado; RV15 + SAN-C, metadados e auditoria |
| RVI-19 | Ausência de baixa de transferência/UI; FIN-02 | CF-018 | Previsões e realização atômica com consumidor | RV12 + SAN-D2 | Implementado/verificado no D2 |
| RVI-20 | Filtro TRANSFER inclui cartão; FIN-08 | CF-021 | Escopo uniforme por tipo | RV14 + SAN-E2 + XLSX | Corrigido/verificado; checkpoint E2 |
| RVI-21 | Compensação/estorno parcial ausentes; FIN-07 | CF-018/020 | Comandos rastreáveis e consumidores | Cadeias e repetição | Implementado/verificado C2 e D2 |
| RVI-22 | Motivo cortado; legibilidade | CF-021 | Quebra/empilhamento | SAN-E2-visual 360/768/1440 | Corrigido/verificado; checkpoint E2 |
| NG-01 | Total informado versus preço derivado; FIN-04/06 | CF-016/020 | Total autoritativo proporcional, preço apenas informativo | RV07 + oráculos literais | Decidido pelo usuário; corrigido/verificado, oráculos proporcionais literais |
| H-01 | Ordem A→I versus I→A | CF-018/020 | Investigar barreira cruzada antes de alterar | Transações independentes | Confirmada e corrigida; checkpoint A |
| H-02 | Leituras separadas na exportação | CF-021 | Snapshot único REPEATABLE READ | Escrita independente entre páginas | Confirmada, corrigida e verificada; checkpoint E1 |

## Decisão NG-01

Usuário escolheu em 29/09/2026: **preservar total e proporção**. Uma avaliação
por total de 1,00 para 200.000.000 unidades não é rejeitada nem normalizada para
2,00. Venda de 100.000.000 deixa avaliação 0,50; encerramento deixa 0,00.
Preço derivado 0,00000001 arredondado para exibição não recompõe o total.
Avaliações por preço continuam usando quantidade × preço; a representação deve
distinguir as duas origens. Custos e caixa não são calculados pelo preço exibido.

## Checkpoints

- Preparação: HEAD/base confirmados, apenas README alheio modificado. Leitura das
  instruções, política, contratos, oráculos e revisão. Primeira execução dos probes
  interrompida por acesso negado ao pipe Docker, antes das assertions financeiras;
  repetição autorizada iniciada. Não contabilizar erro de ambiente como vermelho causal.

## Gates preservados

CF-015 zoom nativo 200%, CF-017 RV17-01/RV17-02 e adoção real seguem pendentes.
Sem avanço para CF-022 ou implementação transversal de CF-023/024/025/027/032.
Autotestes não substituem revisão independente nem autorizam publicação.

### Checkpoint A — fontes e baixa legada

Reprodução sobre 4e685ce: 21 casos, 16 falhas de assertiva, zero erros, 5 passes.
Após correções: 50 casos aprovados (24 CF-018, 14 CF-019, 11 probes selecionados,
1 H-01), PostgreSQL descartável. Comando no backend, JAVA_HOME=target/temurin21/jdk-21.0.12.1+1:
`./mvnw.cmd --batch-mode -Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository '-Dtest=MilestoneSourceConcurrencyTest,Cf018RegressionIntegrationTest,Cf019CardIntegrationTest,IntegratedMilestoneReviewTest#RV01*+RV02*+RV03*+RV09*+RV10*+RV13*+C0*' test`.

- RVI-01: transferência verifica livre (saldo menos destinações) incluindo taxa sob
  locks ordenados das duas contas. Pagamento bancário real continua podendo gerar
  déficit; regressões CF-019/B17 preservadas. Sem lock global por usuário.
- RVI-02: PUT de previsão delega para baixa; original e vencimento preservados.
  Edição posterior aplica-se ao fato retornado, preserva cadeia de correção e
  recalcula o restante da previsão. O teste antigo de edição foi adaptado por
  FIN-02, conservando saldos/resultado esperados e acrescentando a previsão
  preservada; três linhas antigas viram quatro (previsão + fato + reversão + correção).
- RVI-03: domínio da conta rejeita nova movimentação em arquivo; investimento
  verifica antes mesmo de operação com líquido zero. Destinações novas verificam
  conta ativa. Provas cruzadas de todos os writers ainda precisam ser ampliadas.
- RVI-09: nova baixa exige string decimal, sem expoente; credit/debit validam
  escala e resultado assinado dentro de 12 dígitos. C05 continua aprovado.
  Inventário dos demais contratos/agregados ainda pendente.
- H-01 confirmada por PostgreSQL (`deadlock detected`), duas conexões e barreira
  após primeiro lock efetivo. Ordem da compra alterada de I→A para A→I; mesmo
  teste passa, saldo990/quantidade11/reserva100. Primeiro ensaio de instrumentação
  falhou por spy em método abstrato (não causal); substituído por interceptor que
  chama a query real e observa `pg_blocking_pids` antes de liberar a primeira conexão.

Acesso Docker exigiu autorização por bloqueio do pipe no sandbox. Evidências
curadas não contêm tokens de autenticação; logs completos ficam em target ignorado.
Etapa A é checkpoint de domínio/HTTP, não prova de UI nem fechamento do marco.

### Checkpoint B — checklist e compras sobreviventes

RVI-13/14/15/16 implementados. Listagem lê metas e itens em duas consultas,
com ownership no banco e agrupamento O(metas+itens), sem consulta por meta.
V6 cria fatos de compra independentes da intenção, com fonte bancária/cartão;
a migração adota apenas vínculos explícitos sobreviventes e não inventa auditoria.
Exclusão libera destinação; UI seleciona a conta da reserva e não manda destino
fictício. Confirmação de exclusão usa Modal com portal e fecha o detalhe anterior.
Hora interna de cartão é truncada a segundos apenas ao montar o comando interno.

- Domínio/PG: 16/16 (`MilestoneGoalFlowTest,Cf020InvestmentGoalIntegrationTest,IntegratedMilestoneReviewTest#RV11*+RV16*+C04*`). Inclui owner distinto, compra bancária880/reserva180, refund1000, cartão com pagamentos20/120 e crédito20/120, repetição e clock fracionário.
- Navegador: `MilestoneRemediationBrowserTest -Dreview.grep=SAN-B`, 1 jornada aprovada. Conta/meta/reserva são setup HTTP; criar item, reload, comprar pela reserva, excluir meta, localizar e reembolsar são ações reais da UI. Após reload, conta1000 e compra reembolsada. SQL após commit em `browser/persisted.txt`.
- Flyway V1–V6 + Hibernate validate passaram no browser; suites de banco vazio6/6, legado2/2 e upgrades V2/V3/V4/V5→V6 4/4. Primeiro ensaio vazio falhou somente porque lista literal esperada ainda omitia V6; preservado em target/saneamento-v6.log, repetição direcionada verde.
- TypeScript passou; lint dos oito arquivos TS/TSX alterados passou após remover any/catches sem uso existentes no detalhe.
- Capturas do histórico em360/768/1440 abertas e inspecionadas: texto e reembolso legíveis. Não equivalem a zoom nativo200% nem a todos os estados dos modais.

Limites restantes desta etapa: backfill de vínculos já apagados não pode ser
inferido; fallback bancário anterior permanece. Browser de compra em cartão e
inspeção visual dos modais ainda pendentes. Histórico de compras atualmente usa
lista por usuário (O(compras)); paginação futura deve manter busca do fato excluído.

### Checkpoint C1 — total proporcional, avaliação auditada e resgate

NG-01 aplicado conforme decisão do usuário: referência total/quantidade preservada,
preço derivado apenas informativo; avaliações por preço têm base distinta. V7
adota o total armazenado como referência atual sem inferir método histórico.
Preços derivados têm faixa interna ampliada; limite de entrada monetária permanece.
Resgate monetário de renda fixa remove custo por proporção, mantém taxas e ganho;
resgate final zera quantidade/custo/avaliação. Parcial que arredondaria toda a
quantidade é recusado com mensagem de precisão e rollback, sem descartar residual.
Ajuste requer data/origem/motivo e grava investment_valuations sem fabricar renda.
UI apresenta desconhecido, data/origem individual, taxas e comando de resgate.

- Domínio/PG: 15/15 em Cf020InvestmentGoalIntegrationTest e probes RV06/RV07/RV08/RV15 (target/saneamento-c1.log).
- Borda e compatibilidade: 13/13 em MilestoneValuationTest e TemporalCompatibilityIntegrationTest (target/saneamento-c1-val.log). B08, .67/.33/0, preço extremo e rollback por precisão.
- Flyway/PG: vazio6, upgrades V2–V6 para V7 cinco, legado2, todos aprovados com preservação temporal e Hibernate validate. V1–V5 intocadas.
- Browser/BFF/Spring/PG: SAN-C aprovado; avaliação1100, resgate220 deixa800/800/880, final880 com taxa1 deixa0/0/0 e conta2099 após reload. Setup de conta/posição via HTTP; avaliação e ambos resgates pela UI.
- TypeScript e lint dos seis arquivos TS/TSX alterados nesta continuação passaram.
- Imagens abertas: modal legível em768/1440; captura360 registrou carteira antes da animação do modal e NÃO comprova o modal nessa largura. Repetição visual necessária.

Evidência: browser/c1 (log, SQL pós-commit, histórico e capturas). RVI-08 tem
separação do caixa líquido no agregado, mas consumidor/XLSX ainda pendentes.
RVI-21 compensação permanece pendente; este checkpoint não fecha toda a etapa C.

### Checkpoint C2 — compensação de investimento e cadeia de custo

FIN-07: POST de compensação preserva operação original, data/motivo/fonte,
taxas explicitamente devolvidas, identificação e recibo. Mesma chave/conteúdo
retorna o registro; outro conteúdo ou outra compensação do original é recusado.
Cancelamento sem taxa devolvida registra perda realizada, sem segunda despesa.
Substituição de aquisição recalcula vendas dependentes e deixa revisões imutáveis
em investment_cost_revisions. Dashboard agrega o delta de resultado na data efetiva.
UI oferece cancelamento ou operação substituta e histórico separado, com reload.

V8 grava sequência de novas operações e adota a posição atual como referência
inicial de replay. Não inventa sequência de operações históricas: compensação de
operação anterior sem sequência/fonte comprovadas exige reconciliação explícita.
Esse limite histórico permanece; não equivale a adoção real aprovada da CF-017.
Replay e auditoria têm custo O(operações da posição), memória O(n), sob lock da
conta seguido do investimento. Nenhum lock global por usuário foi introduzido.

- Domínio/PG: 4 testes de compensação aprovados (E18 com/sem devolução de taxa,
  owner distinto/repetição, substituição com venda dependente, provento e duas
  transações concorrentes). Custo original da venda50,50 permanece; revisão40,50,
  posição121,50, ganho agregado33,50 e conta912,00 após corrigir aquisição.
- Primeira execução revelou ausência de entidade para revisão no schema de teste;
  passou a usar repositório JPA. Hibernate validate depois revelou nulabilidade
  divergente; modelo alinhado ao SQL sem relaxar constraints.
- Vazio6/6, legado2/2 e upgrades V2–V7→V8 seis aprovados. Fixture adicional preserva
  posição conhecida e desconhecida, timestamp bruto e sequência histórica nula.
- Regressão posterior18/18: upgrades6, CF02011, H011; meta/reserva e ordem de locks
  continuam aprovados. Logs completos ignorados em target/saneamento-c2*.log.
- Browser/BFF/Spring/PG: SAN-C e SAN-C2 aprovados; compra original202 preservada,
  compensação202 retorna conta1000 e posição0; histórico disponível após reload.
  Repetição final inclui HTTP400 para taxa numérica no novo contrato decimal string.
- TypeScript e lint passaram. Capturas de compensação360/768/1440 abertas e
  inspecionadas; data/conta do resgate empilhadas em360 e captura final inspecionada.
  Sem equivalência com zoom nativo200%.

Evidências browser/c2 e browser/c2-final: logs, SQL após commit, recibos, históricos
e capturas. RVI-21 de transações diretas segue pendente. Escopos D/E e revisão
independente do marco continuam necessários antes de aceite/publicação.

### Complemento C2 — constraint da substituição

Ao conferir o fluxo de substituição contra V3, o vínculo correction_of_id exigia
origem CORRECTION; o teste inicial de domínio usava schema criado por Hibernate
e não exercitava essa constraint. Corrigido o movimento substituto e a leitura
gerencial da origem original, evitando contar principal como receita/despesa.
A descrição curta do extrato respeita255 caracteres e o motivo completo permanece
na auditoria. MilestoneInvestmentCorrectionTest agora usa Flyway + validate em
schema descartável da infraestrutura CF-017: quatro casos passaram, inclusive
as novas assertivas de receita/despesa zero na correção de principal. Log:
controle-financeiro-backend/target/saneamento-c2-schema-final.log. O checkpoint
C2 anterior não deve ser lido como prova de substituição no schema migrado.

### Checkpoint D1 — intenção de pagamento e saldo pagável

V9 acrescenta fingerprint do comando; não infere conteúdo de pagamentos antigos.
Nova intenção na UI recebe UUID; a mesma intenção preserva chave e conteúdo no
sessionStorage, inclusive ao reabrir/recarregar. Backend devolve recibo original
na repetição e HTTP409 no conteúdo diferente. Lock transacional por chave precede
o lock do cartão, incluindo disputa acidental da mesma chave entre cartões.
Não serializa todas as operações do usuário. GET de recibo verifica propriedade.
Atualizar dados consulta recibo e leituras, sem POST. Só após GET404 aparece ação
explícita de repetir exatamente o comando salvo. Campos ficam bloqueados enquanto
o resultado é desconhecido/confirmado. Consumo original, saldo pagável e crédito
são apresentados separadamente; novo pagamento parcial sugere o restante.

- Backend17/17: CF01915 + recuperação CF0152. Duas intenções100 em dívida300 deixam
  conta800/dívida100; retry retorna mesmo recibo; valor/hora/motivo/modalidade
  diferentes com a mesma chave conflitam; owner distinto não lê recibo.
- Componente: R03/RV01 oito cenários preservados; dois novos testes de reabertura,
  comando imutável, recuperação GET404 e recibo localizado sem segundo POST.
- Navegador real: nove jornadas passaram em browser/d1: SAN-D1, SAN-B/C/C2,
  R03 ok/read/lost/overlap e R04. SAN-D1 comprova sugestões300→200→100, chaves
  distintas, replay e HTTP409, conta800 após reload. R03 mantém um único POST,
  conta900, dívida0 e planejamentoPAID; perda de resposta agora é resolvida pelo
  recibo real, em vez de permanecer indefinidamente desconhecida.
- Alteração normativa do teste CF019: duas chamadas com a mesma chave agora
  confirmam o mesmo efeito (FIN-07), mantendo assertivas de conta900/dívida100.
  R03 lost mantém todos os saldos/planejamento/reload e passa a exigir GET200
  com recibo100 antes de fechar. Evidência vermelha e commits anteriores preservados.
- Migrações: vazio6, legado2, upgradesV2–V8→V9 sete passaram; Hibernate validate.
- TypeScript/lint passaram. Capturas360/768/1440 do modal foram abertas e
  inspecionadas; legenda secundária foi corrigida depois de "total" para "pagável"
  e valores textuais passaram a usar formatação pt-BR. Não é zoom nativo200%.

Limites: recuperação transportada na sessão da aba/usuário; isto não declara
protocolo durável multissessão/CF-024 entregue. Intenção antiga sem comando/chave
não é reconstruída automaticamente. Valores históricos de fingerprint ficam nulos.
Primeiro comando Maven com filtro contendo pipe foi rejeitado pelo wrapper CMD
antes de executar testes; conjunto integrado executado sem esse filtro e aprovado.
Logs locais target/saneamento-d1*.log; evidência compartilhável em browser/d1.

### Checkpoint D2 — previsões, transferências previstas e estornos

V10 preserva as previsões e permite múltiplos estornos parciais: a unicidade
passa à intenção, com recibo persistido, e o restante é validado sob lock.
Advisory lock somente da chave, contas afetadas ordenadas, depois lançamentos.
Criação, PUT/DELETE legados e baixa usam essa mesma ordem de fonte antes do fato.
Projeção escalar anterior ao lock evita entidade/account obsoleta em cache.
Baixas e correções são somadas pelo líquido, incluindo seus estornos parciais.
Listagem transporta restante/liquidado/estornado com agregação em lote, sem N+1.

A transferência prevista conserva vencimento e três registros originais (duas
pontas e taxa); a realização cria outro grupo, data efetiva, motivo e vínculo
por perna. Capacidade livre deve cobrir principal e taxa; rollback é integral.
Estorno direto exige valor/data/motivo, mantém original e controla o restante.
Retry usa exatamente chave/conteúdo; conteúdo diferente conflita. GET de recibo
verifica ownership. A UI salva intenção na sessão antes do POST, consulta recibo,
permite repetição explícita após 404 e mantém modal durante a reconciliação.
Nova criação oferece previsão e destino/taxa da transferência. Modais não se
sobrepõem aos detalhes. Gerenciadores têm identidade estável no layout; criação
confirmada desmonta o formulário em vez de depender do término da animação.

- PostgreSQL migrado/validate: cinco testes de comandos, ownership, rollback,
  parcial/total, original preservado, concorrência de intenções distintas e
  repetição simultânea da mesma intenção; H01 passou novamente.
- CF018: 24 regressões passaram. Vazio6, legado2 e upgradesV2–V9 oito passaram.
- RV12 foi adaptado ao comando específico de realização (FIN02 não prescreve
  baixa genérica), conservando expectativas literais798/250 e a evidência red.
  RV12 + cinco casos de comandos passaram após as últimas invariantes.
- Componentes: dois testes passaram (reabertura com comando congelado e ausência
  de reenvio após confirmação com falha de leitura). TypeScript/lint passaram.
- Navegador real SAN-D2 em browser/d2-complete passou: cria previsão, baixa40,
  estorna10+30 com datas/motivos, baixa100, cria despesa100, estorna30+70, faz
  replay da última intenção e realiza transferência100+taxa2. Após reload:
  conta de origem798, destino200, três previsõesFULFILLED e três fatosSETTLED.
  Capturas dos três modais em360/768/1440 foram abertas e inspecionadas.

Reproduções intermediárias d2/d2-retry/d2-final preservadas: criação confirmada
permanecia no DOM de saída sob clock congelado; d2-verified identificou corrida
real entre recarga financeira e desmontagem do modal antes de limpar o recibo.
Guardas de loading/erro agora preservam a reconciliação, e d2-complete passou.
Não declarar os runs anteriores verdes nem chamar a falha de domínio financeiro.
Logs: target/saneamento-d2-domain.log, saneamento-d2-integrated.log,
saneamento-d2-final-domain.log e saneamento-d2-browser-complete.log.
Limites: transporte na sessão da aba, sem declaração de CF024 multissessão;
comandos legados sem chave continuam compatíveis. Não é zoom nativo200%.

### Checkpoint E1 — snapshot da exportação, H02

Reprodução causal com barreira após materializar a primeira página, transação
independente confirmou entrada10 antes da página seguinte. READ COMMITTED:
resumo501, 502 linhas USER, apenas501 distintas; uma linha duplicada por offset.
Reprodução em h02-vermelho.txt; log integral local saneamento-h02-baseline-d2-retry.log.

Ambas as entradas públicas da exportação agora abrem transação readOnly com
REPEATABLE READ. Sumários, páginas, compras/estornos de cartão e consultas em
lote pertencem ao mesmo snapshot. entityManager.clear libera entidades, sem
encerrar o snapshot. Teste com mesma barreira passou: resumo501, 501 linhas
USER distintas, sem evento concorrente; novo arquivo posterior tem resumo511.
Teste: MilestoneExportSnapshotTest; log saneamento-d2-h02-verified.log (H02 passou;
naquele mesmo run o navegador D2 ainda falhou, corrigido no checkpoint D2).

Custos: transação fica aberta durante paginação e geração, mantém versão MVCC
até finalizar e ocupa conexão. Escrita em outra conta/ledger não fica bloqueada
pelo snapshot; a escrita controlada confirmou antes de liberar exportação.
Lotes500 e janela SXSSF100 limitam entidades/linhas em memória; bytes finais do
XLSX ainda usam ByteArrayOutputStream, O(tamanho do arquivo), e disco temporário
SXSSF. Não é benchmark amplo nem entrega transversal da CF025. Snapshot é da
requisição local; não permite reconstruir posição histórica sem cobertura.

### Checkpoint E2 — posição, arquivo, metadados e escopo

GET /accounts permanece lista de fontes ativas; GET /accounts/position soma
as contas do proprietário, inclusive arquivadas, em uma consulta e O(contas).
Valores agregados são strings decimais exatas; excesso da faixa monetária é
sinalizado e UI apresenta indisponibilidade, sem truncar/clamp. Dashboard e
Contas usam a posição, com detalhe de arquivo e data, sem inferir patrimônio
líquido nem incluir dívida/crédito do cartão.

Resumo anual conserva posição atual datada qualquer que seja o ano dos fluxos.
Cada ativo transporta data e origem da própria avaliação; desconhecido continua
null. O probe anterior que exigia esconder posição em ano passado foi adaptado
por DEC-04/FIN-08, preservando custo100/valor500 e acrescentando data/origem.
A configuração de clock do teste CF021 não era importada; o primeiro run
falhou com28/09 esperado versus30/09 observado. Import explícito torna essa
prova determinística; oito regressões CF021 passaram depois.

TRANSFER exclui cartão do resultado e do XLSX. A UI oferece esse filtro e
exporta período/tipo/conta selecionados. Arquivar exige confirmação verdadeira
sobre preservação de saldo/histórico. O motivo de avaliação desconhecida usa
quebra/empilhamento (corrigido no C1), agora verificado no navegador. Inspeção
identificou valor de transferência cortado em360; linha empilha o valor.

- PG: quatro novos casos passaram: arquivo/propriedade, agregado máximo+1,
  posição independente do ano/metadados/null, filtro e XLSX. RV05/RV14 passaram.
- CF021: oito casos passaram após import do clock (saneamento-e2-browser.log).
- Componentes: 14 testes de async-state/consumidores CF015 passaram com a nova
  posição; troca de proprietário também invalida posição e respostas tardias.
- Navegador/BFF/Spring/PG: SAN-E2 passou em e2-final e, após ajuste360, passou
  junto com SAN-E2-visual em e2-visual. Arquiva pela UI, reload, posição2000
  (arquivo1000), ano2026 mantém posição15/01/2027 e avaliação10/01, ativo
  desconhecido, filtro com duas pernas/caixa0, download XLSX e fonte arquivada
  ausente do formulário. Setup das posições/compras é HTTP, ações descritas UI.
- TypeScript passou; lint direcionado sem erros, duas advertências de parâmetros
  preexistentes sem uso nos testes de mutação. Capturas de Contas, filtro,
  posição anual e motivo em360/768/1440 abertas e inspecionadas. Footer anual
  recebeu gap/wrap após inspeção; será revisto na validação final. Não é zoom200%.

Logs locais target/saneamento-e2*.log. Primeiro browser e2 falhou somente ao
buscar botão mobile na largura1440 no último passo; e2-final usa Lançar. Runs
intermediários preservados, sem declará-los verdes. Nenhuma migração nesta
unidade; browser usa V1–V10 e Hibernate validate. Cobertura histórica e E27
continuam pendentes; zeros de períodos não cobertos ainda não são aprovados.

### Checkpoint E27 — caixa líquido e decomposição gerencial

DTO do extrato acrescenta cashAmount e cashDelta assinado, preservando amount
bruto. Provento10/retencão1 representa receita10/despesa1 e caixa9/0, sem inventar
duas pernas bancárias brutas. UI lista efeito líquido e bruto separado; detalhes
explicam os dois valores. Formulário de provento recebe total bruto e mostra
líquido, eliminando quantidade fictícia multiplicada por “total recebido”.
Transferência usa direção de cada ponta; estorno inverte efeito. Novas reversões
copiam metadados de caixa/direção, sem inferir direção ausente de legado.

XLSX mantém colunas financeiras anteriores e acrescenta caixa líquido/efeito
assinado; linha legada sem direção comprovada informa indisponibilidade. Consulta
em lote também carrega originais de CORRECTION, para não contar substituição de
principal como consumo. Sem consulta por linha e sem nova migração.

- Backend: CF01824, CF0218, compensações4 e RV08 passaram no primeiro conjunto;
  o novo teste de direção falhou só por equals de BigDecimal200 versus200.00.
  Escala literal corrigida, sem alterar valores esperados; os dois novos casos
  passaram no schema Flyway/validate. Logs saneamento-e27-domain/browser.log.
- Navegador SAN-E27 passou em browser/e27: provento e retenção pela UI,
  reload, conta1009, DTO bruto10/1 e caixa9/0, resumo9/0/9, download do XLSX.
  Setup de conta/posição foi HTTP. O arquivo efetivamente baixado foi aberto
  como XML ZIP e as duas linhas conferidas: bruto, resultado, caixa e sinal;
  prova em browser/e27/xlsx-verificado.txt.
- TypeScript/lint direcionado passaram. Capturas360/768/1440 abertas e
  inspecionadas: bruto e líquido legíveis. Não é zoom nativo200%.

Cobertura dos períodos permanece na próxima unidade; este checkpoint não
certifica zeros de história ausente nem encerra revisão independente.

## Complemento A/B/C — writers e consumidores com fatos dependentes

Arquivamento usa o mesmo lock pessimista da fonte. Reembolso bancário passa por
fonte → conta → ledger, e compra de checklist só altera o alvo após obter a fonte,
evita flush da meta antes da conta. `MilestoneWriterPolicyTest`: 3 casos aprovados
em PostgreSQL migrado/Hibernate validate. Verifica capacidade livre 300 após
reserva 700, rejeição de transferência/aporte/compra/reserva 301, débito bancário
confirmado 1100 com saldo -100, nove writers em conta arquivada (inclusive
provento líquido zero), rollback e espera real de arquivo por `pg_blocking_pids`.
A primeira rodada preservada falhou somente na consulta do teste (`card_id` não
existe em card_payments); a conferência corrigida usa join por invoice_id.

Browser `bc-final`: 3 jornadas aprovadas pelo Next/BFF/backend/PostgreSQL/reload.
Compra 120, pagamento 20 ou 120, exclusão da meta, reembolso mantido no histórico:
saldo bancário 980 ou 880, dívida zero e crédito no cartão 20 ou 120. Retry 400
sem novo efeito. Substituição da aquisição 20×10+2 por 20×8+2, venda dependente
5×15-1: saldo 912, quantidade 15, custo 121,50; venda original preserva custo
50,50, revisão separada 40,50 e recibo ajusta resultado em 10. JSON e telas
360/768/1440 em `browser/bc-final`; `bc-complete` preserva a rodada que esperava
erroneamente 409 em vez do contrato legado 400. Imagens inspecionadas: histórico
de reembolso e compensação legíveis; captura 360 da compensação ainda precedeu
carregamento do histórico e deve ser completada na rodada visual final.

### Checkpoint E3 — cobertura e fronteiras finais

V11 é aditiva: base conhecida em cartão/ativo novo e carteira automática zero
SYSTEM_INITIALIZED; legado permanece sem base, sem backfill ou baseline automático.
Cobertura distingue COMPLETE, PARTIAL, UNAVAILABLE, UNKNOWN_ORIGIN e OUT_OF_RANGE.
Totais completos ausentes ficam null; subtotais observados usam strings decimais
exatas, sem transformar registro parcial em história completa. Base coletiva
conservadora é a mais recente das fontes do escopo, incluindo arquivadas.

API, dashboard, anual, extrato e XLSX transportam motivo, intervalo e referência.
Comparação percentual exige dois períodos completos. Posição atual conserva data
própria em qualquer ano. Totais fora de 12 inteiros ficam indisponíveis, mantendo
observado exato; frontend soma centavos com BigInt antes de aplicar a faixa.
Resumo do extrato, anual e dashboard usam REPEATABLE_READ para cobertura e números
no mesmo snapshot; export também mantém páginas no mesmo snapshot H-02.

Provas: MilestoneReportingCoverageTest verifica zero coberto, passado/futuro sem
cobertura, legado desconhecido, arquivo, ownership entre dois usuários e agregado
1999999999999.98 preservado em string. MilestoneWriterPolicyTest acrescenta limite
agregado de meta/dívida; C06 rejeita numeric/expoente e dinheiro1.005 nos novos
contratos sem escrever, preservando 100.00/1.00 canônicos.

Execução estabilizada: backend-browser-234-verificado.log contém 234 testes sem
falhas/erros, inclusive 17 jornadas de browser. Banco descartável Flyway V1–V11 e
Hibernate validate; migração vazia, legada, upgrades, checksum/falha/rollback.
Browser final-verificado/SAN-E3: dezembro2026 coberto com zero; novembro2026
indisponível e observed0.00; anual2026 indisponível, posição atual2027 datada.
Capturas de E3 360/768/1440 inspecionadas e texto de cobertura legível.
verify-downloaded-xlsx.ps1 abriu os arquivos efetivamente baixados e comprovou
B3 numérico zero versus indisponibilidade, coluna C observada0.00 e aba Cobertura;
E27 receita10/taxa1/resultado9, linhas bruto10/1 e caixa9/0; filtro TRANSFER sem cartão.

Rodadas vermelhas novas preservadas: coverage-domain-primeiro, regressions-primeiro,
frontend-component-cobertura, backend-completo-primeiro e schema-conflito.
[Adaptações normativas](ADAPTACOES-DE-TESTES.md) preservam valores literais e
explicam contratos alterados; [inventário](FRONTEIRAS-E-WRITERS.md) registra
locks, consultas em lote, complexidade e custos de snapshot/replay.

A execução final complementar registra abaixo a recuperação temporal, o build e
a captura de compensação360 após a animação; o primeiro final-verificado contém
uma captura antes de opacity1, preservada sem declarar inspeção completa desse frame.

### Fechamento da verificação local

- Domínio/HTTP/migrações: 234 testes passaram sem falhas/erros/skips em
  backend-dominio-234-final.log, após corrigir a fixture UNKNOWN. O conjunto
  inclui os 22 probes atuais RV/C (21 anteriores + C06), cinco casos de cobertura,
  writers, concorrência, custo, pagamento, migrações e regras temporais.
- Dois harnesses Java de browser passaram na execução combinada:
  MilestoneRemediationBrowserTest (17 jornadas) e TemporalBrowserApiPostgresE2E
  (18 jornadas em São Paulo/UTC+14 com JVM UTC, inclusive pós-condições SQL/XLSX).
  O log combinado backend-entrega-fixture-vermelha.log continua vermelho no
  caso novo de fixture inválida; não é declarado integralmente verde. Sua causa
  foi corrigida e a suíte inteira de domínio/HTTP/migração foi repetida com verde.
- browser/entrega-final contém 17 passes, V1–V11, persistência e arquivos baixados
  conferidos pelo script. SAN-E27 também verifica dashboard líquido9/bruto10.
  Compensação360/768/1440 aberta e inspecionada após opacity1: motivo, caixa40,
  ajuste10 e taxa2 estão legíveis; resolve o frame incompleto do run anterior.
- browser/temporal-final contém 18 passes, arquivos XLSX dos dois fusos e
  capturas financeiras finais. Capturas antigas CF015 permanecem sem diff.
  Teste de zoom nativo200% continua não executado.
- Componentes: 33 arquivos/152 testes aprovados; último ajuste do agregador
  (rejeitar terceira casa, sem arredondamento silencioso) tem oito casos
  direcionados aprovados em frontend-precisao-final.log. Unitários Node:6 passes.
- TypeScript e build de produção Next passaram. Lint de65 arquivos afetados:
  zero erros/dois warnings anteriores; lint global23 erros/21 warnings fora do
  saneamento, mapeados em LINT-BASELINE.md. Build não equivale a lint global verde.
- Oráculos atuais/adversariais CF016 passaram; preservação histórica estrita
  continua vermelha em pom.xml. V1–V5, revisão vermelha original, dados/hashes
  históricos e README raiz preservados. SHA256 raiz permanece o registrado acima.

Toda a funcionalidade exigida pelo marco possui consumidor e verificação local.
Os estados desta matriz significam autoteste corrigido/verificado, aguardando
revisão independente. Não certificam adoção real, publicação, benchmark amplo,
protocolo transversal completo ou zoom nativo200%. Riscos/custos de locks,
snapshot, replay, cobertura conservadora e persistência da intenção constam dos
checkpoints e do inventário. Tarefas CF016–021 e notas transversais conservam os
estados anteriores e delimitam a prova localizada, sem iniciar CF022+.

[Entrega, comandos, intervalo de código e gates remanescentes](ENTREGA.md).
