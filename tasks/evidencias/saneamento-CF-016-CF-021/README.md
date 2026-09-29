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
| RVI-06 | null convertido em zero na UI; FIN-04 | CF-020 | Preservar indisponibilidade | UI04 | Pendente |
| RVI-07 | Encerramento mantém avaliação desconhecida; FIN-04 | CF-020 | Zero conhecido na posição encerrada | RV06 | Pendente |
| RVI-08 | Provento mistura caixa e gerencial; E27 | CF-020/021 | Caixa líquido, receita/taxa brutas | RV08 + XLSX | Pendente |
| RVI-09 | Fronteira decimal/limites; FIN-06 | CF-018/020 | Decimais canônicos e limites de agregação | RV09/RV10/C05 | Pendente |
| RVI-10 | Ano selecionado remove posição atual; DEC-04 | CF-021 | Posição datada independente do ano | RV05 + UI | Pendente |
| RVI-11 | Intenção sem identificação; FIN-07 | CF-019 | Nova chave/intenção, retry e recuperação | UI02/R03 | Pendente |
| RVI-12 | Sugestão usa consumo original; FIN-03 | CF-019 | Exibir saldo pagável/crédito | UI02 | Pendente |
| RVI-13 | DTO omite checklist; FIN-05 | CF-020 | Carregamento com ownership sem N+1 | UI03 | Pendente |
| RVI-14 | UI trata meta como custódia; FIN-05/07 | CF-020 | Fonte explícita, liberação e modais acessíveis | UI03 + jornada completa | Pendente |
| RVI-15 | Cartão perde vínculo com intenção; FIN-07 | CF-020/019 | Vínculo de compra persistente | RV11 + parcial/total | Pendente |
| RVI-16 | Clock com frações invalida hora; SPEC-002 | CF-020 | Hora interna canônica | RV16 | Pendente |
| RVI-17 | Resgate monetário vira unidades a 1; B08 | CF-020 | Comando monetário com custo proporcional | UI06 + domínio | Pendente |
| RVI-18 | Ajuste sem invariantes/auditoria; FIN-04/07 | CF-020 | Data, origem, motivo e posição válida | RV15 + UI | Pendente |
| RVI-19 | Ausência de baixa de transferência/UI; FIN-02 | CF-018 | Previsões e realização atômica com consumidor | RV12 + E2E | Pendente |
| RVI-20 | Filtro TRANSFER inclui cartão; FIN-08 | CF-021 | Escopo uniforme por tipo | RV14 + XLSX | Pendente |
| RVI-21 | Compensação/estorno parcial ausentes; FIN-07 | CF-018/020 | Comandos rastreáveis e consumidores | Cadeias e repetição | Pendente |
| RVI-22 | Motivo cortado; legibilidade | CF-021 | Quebra/empilhamento | 360/768/1440 | Pendente |
| NG-01 | Total informado versus preço derivado; FIN-04/06 | CF-016/020 | Total autoritativo proporcional, preço apenas informativo | RV07 + oráculos literais | Decidido pelo usuário; implementação pendente |
| H-01 | Ordem A→I versus I→A | CF-018/020 | Investigar barreira cruzada antes de alterar | Transações independentes | Hipótese pendente |
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
