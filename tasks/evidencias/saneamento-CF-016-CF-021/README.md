# Saneamento CF-016–CF-021

Base: `4e685ce` (candidato revisado `46d9fad`). Marco aguardando revisão independente.
Início em 29/09/2026; execução local, sem banco real, Railway, emails, push ou deploy.
README raiz preexistente preservado: SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Achados e evidências vermelhas originais permanecem em `../revisao-CF-018-CF-021/`.
RV/UI são nomes de probes, não identificadores de achados.

## Matriz de saneamento

| ID original | Causa / critério | Dona | Correção planejada | Testes / evidência | Situação / limites |
|---|---|---|---|---|---|
| RVI-01 | Writer ignora destinação; FIN-05 | CF-018/020 | Capacidade sob lock da fonte | RV01/RV13 | Pendente |
| RVI-02 | PUT reescreve previsão; FIN-02 | CF-018 | Delegar baixa preservando original | RV02 + consumidor | Pendente |
| RVI-03 | Arquivo não aplicado a todos writers; B16 | CF-018/020 | Regra comum de conta ativa | RV03 + writers cruzados | Pendente |
| RVI-04 | UI soma lista selecionável; FIN-01 | CF-018/021 | Projeção de posição inclui arquivo | UI01 + reload | Pendente |
| RVI-05 | Ausência de cobertura vira zero; FIN-08 | CF-021 | Cobertura em API/UI/XLSX | RV04 | Pendente |
| RVI-06 | null convertido em zero na UI; FIN-04 | CF-020 | Preservar indisponibilidade | UI04 | Implementado; ver checkpoint C1 e limites |
| RVI-07 | Encerramento mantém avaliação desconhecida; FIN-04 | CF-020 | Zero conhecido na posição encerrada | RV06 | Implementado; ver checkpoint C1 e limites |
| RVI-08 | Provento mistura caixa e gerencial; E27 | CF-020/021 | Caixa líquido, receita/taxa brutas | RV08 + XLSX | Pendente |
| RVI-09 | Fronteira decimal/limites; FIN-06 | CF-018/020 | Decimais canônicos e limites de agregação | RV09/RV10/C05 | Pendente |
| RVI-10 | Ano selecionado remove posição atual; DEC-04 | CF-021 | Posição datada independente do ano | RV05 + UI | Pendente |
| RVI-11 | Intenção sem identificação; FIN-07 | CF-019 | Nova chave/intenção, retry e recuperação | UI02/R03 | Pendente |
| RVI-12 | Sugestão usa consumo original; FIN-03 | CF-019 | Exibir saldo pagável/crédito | UI02 | Pendente |
| RVI-13 | DTO omite checklist; FIN-05 | CF-020 | Carregamento com ownership sem N+1 | UI03 | Implementado; ver checkpoint B e limites |
| RVI-14 | UI trata meta como custódia; FIN-05/07 | CF-020 | Fonte explícita, liberação e modais acessíveis | UI03 + jornada completa | Implementado; ver checkpoint B e limites |
| RVI-15 | Cartão perde vínculo com intenção; FIN-07 | CF-020/019 | Vínculo de compra persistente | RV11 + parcial/total | Implementado; ver checkpoint B e limites |
| RVI-16 | Clock com frações invalida hora; SPEC-002 | CF-020 | Hora interna canônica | RV16 | Implementado; ver checkpoint B e limites |
| RVI-17 | Resgate monetário vira unidades a 1; B08 | CF-020 | Comando monetário com custo proporcional | UI06 + domínio | Implementado; ver checkpoint C1 e limites |
| RVI-18 | Ajuste sem invariantes/auditoria; FIN-04/07 | CF-020 | Data, origem, motivo e posição válida | RV15 + UI | Implementado; ver checkpoint C1 e limites |
| RVI-19 | Ausência de baixa de transferência/UI; FIN-02 | CF-018 | Previsões e realização atômica com consumidor | RV12 + E2E | Pendente |
| RVI-20 | Filtro TRANSFER inclui cartão; FIN-08 | CF-021 | Escopo uniforme por tipo | RV14 + XLSX | Pendente |
| RVI-21 | Compensação/estorno parcial ausentes; FIN-07 | CF-018/020 | Comandos rastreáveis e consumidores | Cadeias e repetição | Investimentos implementados/verificados no C2; estorno direto pendente |
| RVI-22 | Motivo cortado; legibilidade | CF-021 | Quebra/empilhamento | 360/768/1440 | Pendente |
| NG-01 | Total informado versus preço derivado; FIN-04/06 | CF-016/020 | Total autoritativo proporcional, preço apenas informativo | RV07 + oráculos literais | Implementado e testado; checkpoint C1 |
| H-01 | Ordem A→I versus I→A | CF-018/020 | Investigar barreira cruzada antes de alterar | Transações independentes | Confirmada e corrigida; checkpoint A |
| H-02 | Leituras separadas na exportação | CF-021 | Investigar escrita entre páginas | Exportação concorrente controlada | Hipótese pendente |

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
