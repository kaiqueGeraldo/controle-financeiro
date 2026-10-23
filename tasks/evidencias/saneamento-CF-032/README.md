# Saneamento dirigido CF-032 — 23/10/2026

**CF032-01/02/03/04 saneados localmente, aguardando revalidação independente.**
CF-032 permanece `em_revisao`: critérios 1/4 sustentados; 2/3 continuam pendentes
de aceite independente. Nenhuma sucessora, publicação ou aprovação integral.

Base conferida `f52152324716fb241134370ee14e6adfec2fefa5`, branch
`codex/cf032-e2e-financeiro`. [Plano anterior às correções](PLANO.md) e
[hashes/estado inicial](initial-state.json). Os arquivos originais da CF-032 e do
revisor não foram editados. O README raiz permanece modificado e fora dos commits,
com SHA-256 inicial igual ao histórico; conferir o registro final de preservação.

## Causa e correção

| Achado | Causa confirmada antes da edição | Correção local |
|---|---|---|
| CF032-01/P2 | GoalService autorizava pelo saldo menos goal_allocations, como se o conhecimento estivesse completo | SourceReservationService reutiliza a projeção de evidências e incidência já aprovada: CONFIRMED/CANDIDATES/UNBOUNDED/CLOSED, exclusões válidas e união de pendências. setAllocation, addValue e destino de moveAllocation compartilham a decisão. Compra voluntária de investimento também exige caixa comprovadamente livre. |
| CF032-02/P2 | Hook/resumo/cartão calculavam limite menos fatura corrente, ignorando principal futuro | DTO declara committedLimit/availableLimit; consumidores usam métricas autoritativas. Barra usa principal comprometido. Ausente/inválido permanece indisponível; zero e negativo são preservados, crédito não é somado. Loading/erro não fabricam zero e privacidade oculta valor/barra. |
| CF032-03/P2 | Lista/aria-label/detalhe/modal e descrições assumiam ticker obrigatório | Rótulo compartilhado: ticker significativo, senão nome, senão marcador neutro. UUID continua sendo chave, seleção e payload operacional. Nome longo quebra linha sem perder conteúdo. Descrições novas de aporte/resgate/proventos/retenção usam o mesmo fallback de domínio; sem backfill. |
| CF032-04/P3 | Formatter HH:mm era passado a setCellValue(String), truncando o valor armazenado | Formatter HH:mm:ss, mantendo célula textual e demais colunas/tipos. Ausência continua `—`; não se fabricam segundos para horário desconhecido. |

Normas: SPEC-001 §5/5.1/DEC-ONB-02, FIN-01/03/04/05 e SPEC-002 horário canônico,
AC-UI-005/011. Não foi criada exceção para minutos no arquivo, nem ticker obrigatório,
nem regra financeira paralela no frontend. Migrações existentes intactas.

Em CF032-01, a projeção cotidiana usa somente inventário de domínio, sem sessão,
rascunho ou comandos da entrevista. Reutiliza legacy/reservationParts e a validação
de evidência; não executa seleção, novas alocações ou relatórios do planner. A leitura
de alocações retorna total/livre/deficit desconhecidos quando a capacidade não é
comprovada, e o DTO TypeScript conserva null. Redução/liberação de reserva conhecida
e débito real não foram bloqueados pela nova autorização.

O controle positivo após CLOSE expôs um complemento necessário de CF032-01:
OnboardingOpenings deixava a evidência nova presa ao inventário anterior às
alterações da própria confirmação. Após reconciliar a meta, o token já era
incompatível e a autorização conservadora recusava capacidade legítima. Agora,
somente as declarações novas desta transação recebem o token do inventário
resultante e validatedAt do comando, sob o mesmo guard exclusivo e antes do commit.
Evidências antigas não são renovadas; histórico anterior e recibo congelado são
preservados. Não houve inferência, backfill nem afrouxamento para evidência vencida.

## Provas antes e depois

- `before-01`: sete selecionados, R1 passa e C/E2/K/L/R2/R3 falham pelos defeitos
  originais. E2 retorna 204 e persiste 0.01; K/R2 mostram 950; L não mostra nomes;
  C/R3 preservam segundos no banco e perdem no arquivo. Falhas intermediárias intactas.
- `after-01`: dez selecionados passam — B/C/E/E2/G/H/K/L/R1/R3. Nenhum expected,
  timeout, retry ou prova original foi alterado.
- `after-final`: treze selecionados passam — os dez anteriores mais S2/S3/S4.
  São oito cenários da matriz original, R1/R3 sobrepostos e três controles novos;
  não equivalem a repetir integralmente os treze históricos nem somá-los como 23.
- S2 adapta somente o observador de R2 aos nomes corrigidos; o original continua
  byte a byte preservado. Mesmo disponível 656, duas posições sem ticker e dois
  GETs por UUID; cada diálogo deve corresponder ao UUID e nome da posição. R2
  original exigia literalmente dois botões/dialogs `null`, o próprio defeito.
- S3 cria variante explícita com duas STOCK sem ticker e controle SANE3; nomes,
  detalhes, modal, UUID e operação real conferidos em 360 px. Patrimônio inicial
  dessa variante é 1453.00, não se impôs o oracle 1451.00 de E01. Após comprar uma
  unidade na primeira, ela tem quatro e a segunda continua com três. Não foi
  demonstrada historicamente operação no ativo errado; essa conclusão é preservada.
- S4 confronta entrada/API/SQL/POI para 12:34:56, 12:34:00 e null; data civil
  22/10/2026 e valor 1.23 em cada linha. Sem conversão de fuso ou zero inventado.
- `card-refresh-02`: S5 passa em seleção própria, sem repetir a matriz. Pagamento
  real 200 libera principal 194: disponível 656→850 no resumo/cartão **antes** do
  reload, depois 850 e barra 15%; API/SQL confirmam conta 1100/dívida 150/um pagamento.
  São 14 selecionados distintos nesta entrega, com sobreposições explicitadas acima.
- `declaration-consumers`: E/E2/G passam novamente após o complemento do produtor;
  são três casos já contados, não três cenários novos. Os novos ramos CLOSE/ASSIGN
  foram exercitados no conjunto PostgreSQL de 95 controles.

Capturas com relógios nativos, opacity/hit-test/dois frames e inspeção visual de
S2-cartão, S3-nome longo/lista e S3-modal. Tema escuro/privacidade desligada no E2E;
privacidade/carregamento/erro/ausência/zero/excesso/agregado em componentes. Isso
não aprova todos os temas/viewport/zoom. [Auditoria Decimal/OOXML](audit-final.json).

## Reconciliação e persistência

O oracle independente de B/C permanece:

| Contas | Investimentos | Dívida | Patrimônio | Reservas conta/invest. | Caixa livre |
|---:|---:|---:|---:|---:|---:|
| 1286.90 | 501.67 | 270.00 | 1518.57 | 450.00/200.00 | 836.90 |

Oito checkpoints recalculados com Decimal pelas linhas SQL; reload/nova sessão de B
iguais. Custo desconhecido da renda fixa, cobertura PARTIAL e totais indisponíveis
preservados. Custo/transferências/reservas não foram somados novamente ao patrimônio.
Recibo de onboarding continua sendo snapshot inicial, sem virar posição corrente.

Cinco arquivos reais lidos por POI e OOXML: C-october, H-A, H-B, R3-time e S4-time.
Receita 250.10; consumo/encargos 162.20; resultado 87.90; caixa −13.10. Hora C/R3
agora é texto 12:34:56, não formatação que oculta segundos. S4 confirma tipo textual,
numFmtId 0/General, segundos 00 e ausência neutra; datas civis intactas. Nenhuma
mudança indiscriminada de células ou de valores monetários. Não foi usado Excel nativo.

E2 final: 400, nenhuma alocação nova, sem gravação parcial; legado/saldos preservados.
Backend cobre capacidade exata, conta/investimento, exclusão válida/inválida,
candidatas exaustivas, origem confirmada incerta, múltiplas pendências, resolução
parcial, redução/liberação, destino de move e reserva declarada/materializada sem
dupla contagem. Barreiras reais provam autorização/escrita protegidas e outro owner
independente. Controles existentes de concorrência com confirmação foram preservados.

G confirma commit SQL antes de abortar a resposta, recuperação e recibo estável:
três POSTs (inicial, replay idêntico, conflito rejeitado) e um débito/pagamento.
H confirma ownership, troca de sessão e arquivos próprios A/B; SQL A1010/B2280.
O namespace/idempotência de investimento continua sendo verificado separadamente
no controle dirigido de replay, sem confundi-lo com o pagamento de G.
`backend-investment-replay-02`: mesma identidade/payload devolve o snapshot original
após surgir UNBOUNDED; nova identidade é rejeitada, conta 999, quantidade 11,
uma transação bancária, uma operação de investimento e um recibo. Pendência intacta.

## Testes, falhas preservadas e contraprovas

`backend-declarations-final`: **95 controles passam**, incluindo 20 de capacidade/
replay/declaração e um de concorrência, controles financeiros/onboarding/protocolo
e compra versus move. CLOSE da última pendência permite 1000; ASSIGN de 400 permite
os 600 restantes, sem duplicar a reserva materializada. Este conjunto inclui os
92 de backend-final e o replay dirigido; não somar 92+1+95 como casos distintos.
`components-regressions.log`: 54 testes em nove arquivos passam, incluindo os
19 novos; não somar os 19 novamente. Lint e typecheck aprovados; build padrão Next
aprovado, inclusive após alinhar a anotação nullable de total reservado. Essa última
anotação não muda JavaScript nem os efeitos dos treze cenários já executados.

Falhas intermediárias, sem apagamento:

1. `components-01`: EPERM ao renomear cache temporário no sandbox; nenhum teste
   iniciou. Execução autorizada fora desse bloqueio (`components-02`) passou 19.
2. `backend-01`: 81/82; autorização rejeitou corretamente avaliação desconhecida,
   mas a mensagem perdeu `indisponível` exigido pelo teste antigo. Corrigida a
   mensagem de produto, sem mudar o teste.
3. `backend-02`: compilação interrompida por import Map removido ainda usado em
   listAll. Import reposto; nenhum teste dessa tentativa contou como executado.
4. Primeiro controle adicional de replay de investimento: compilação do novo teste
   ambígua na inferência genérica de assertThat(valueToTree). Tipado JsonNode antes
   da assertion, preservando comparação exata. Não é defeito financeiro nem caso verde.
5. `card-refresh`: filtro ancorado `^S5` incompatível com o título completo do
   Playwright, nenhum teste selecionado. Corrigido o filtro para `S5 available`;
   primeiro exercício funcional do caso em `card-refresh-02`, sem retry funcional.
6. `closed-capacity-before`: fixture própria ainda sem a identidade materializada
   da pendência; rejeitada ao salvar rascunho, antes da autorização. Corrigida a
   fixture, `closed-capacity-before-02` revelou a recusa indevida após CLOSE real.
   Essa é regressão funcional de autorização, não erro de ambiente. O controle
   original permaneceu com esperado 1000 e passou após o vínculo da evidência nova
   ao inventário resultante; ASSIGN/600 foi acrescentado como controle associado.

Quatro mutações somente em `saneamento-20261023-mutants`, com baseline e controle
restaurado verdes. [Resultados e hashes](counterproofs/results.json),
[controle restaurado](counterproofs/restored-control.json) e patches/logs completos:

| Mutação | Detecção causal |
|---|---|
| retirar proteção de conhecimento | E2 volta a 204 e reserva SQL 0.01 em vez de 400/nenhum efeito |
| restaurar apresentação antiga | componentes observam 950 em vez de 656 no resumo/cartão |
| retirar fallback do nome | componentes perdem os nomes visíveis/acessíveis legítimos |
| restaurar HH:mm | R3 lê texto 12:34 em vez de 12:34:56 no download real |

Capacidade e exportação usam navegador/BFF/Spring/PostgreSQL reais; UI usa componentes
renderizados diretamente sobre a fonte mutada, sem alegar build de navegador mutado
nessas duas contraprovas. Fonte restaurada byte a byte; manifesto de produto final
compara 487 arquivos. Sem mutation score global ou testes passando por erro de ambiente.
O DTO nullable, alteração somente de tipo, foi alinhado nas duas cópias antes dos
manifestos finais; não integra nenhum dos cinco arquivos mutados/restaurados.
As quatro contraprovas antecedem o complemento de OnboardingOpenings. Seus cinco
arquivos-alvo continuam idênticos por hash; E2 não finaliza entrevista e R3/E01 não
declara reservas, portanto não executam o novo ramo do produtor. Não se repetiu a
matriz de mutação sem delta nesses caminhos. O ramo novo tem prova vermelha/verde
própria e os 95 controles reexecutados; ver [aplicabilidade](counterproofs-applicability.json).

## Custos e trade-offs

- Uma leitura em lote por relação do inventário e uma projeção por comando/batch;
  nenhuma consulta por fonte, candidata ou alocação. A consulta ORM de apresentação
  e a leitura de inventário são lotes distintos, não uma consulta dentro do map.
  Evidências são indexadas por ID, evitando varrer toda a lista para cada referência.
- N é inventário, R pendências/evidências e E incidências fonte–pendência. A projeção
  visita essas estruturas; mapas/sets ordenados e canonicalização acrescentam custo
  de ordenação, além do hash por bytes. Memória é O(N+R+E); E pode ser N×R para
  UNBOUNDED. Não se promete O(N+R) para a expansão nem latência de produção.
- A evidência certifica o inventário-base inteiro. Um lock só na conta não impede
  outra fonte/pendência de invalidar esse conhecimento. Aumentos/moves/aportes com
  fonte e compras voluntárias tomam o guard owner exclusivo já existente **antes**
  dos locks das fontes; sem upgrade de shared após travar uma fonte. Isso troca
  concorrência entre essas operações do mesmo owner por autorização estável. Owners
  diferentes continuam independentes; leitura, débito real e liberação para zero
  não recebem bloqueio de negócio por incerteza. Alvos positivos que sejam redução
  também passam por esse guard conservador, mas não pela rejeição de capacidade.
- A confirmação com declarações novas faz uma leitura final em lote do inventário
  e atualiza somente essas evidências por batch e revisão. Custo adicional constante
  de consultas de leitura por relação, mais O(D) escritas para D declarações novas;
  nenhum SELECT por declaração. Sem declarações, o ramo retorna antes da leitura.
  O token exclui as próprias reservas, evitando dependência circular. Falha nessa
  etapa desfaz a confirmação inteira na transação existente.
- Rótulo é O(L) por string, limitado pelos campos existentes; agregado do cartão é
  O(C), sem request extra por cartão. Não há fórmula paralela de disponível; somente
  soma exata das métricas e proporção visual do comprometido. A mudança textual do
  horário mantém compatibilidade de tipo; leitores que assumiam cinco caracteres
  precisam aceitar a precisão canônica contratual.

Sem cache, índice novo, migração/backfill, Kafka, ledger ou mudança arquitetural
paralela. Não houve EXPLAIN, carga ou certificação de desempenho. O custo adicional
de inventário/serialização por owner é uma limitação concreta para futura medição.

## Reprodução e versões

Na raiz, preparar runtime novo com
`controle-financeiro-frontend/tests/cf032/prepare.ps1 -RuntimeRoot <runtime-novo>`. Compilar
na cópia frontend com `node node_modules/next/dist/bin/next build`. O runner backend
`controle-financeiro-backend/src/test/cf032/run.ps1 -RuntimeRoot <runtime> -Evidence <diretório novo> -Grep <seleção>`
usa JDK21, Docker local/PostgreSQL descartável, Flyway 1–16 e Hibernate validate;
sem clean, reuso de servidor ou banco histórico. Somente EmailService/MarketDataService
são doubles externos; nenhum endpoint financeiro falso ou email real.

Para probes independentes, acrescentar supplemental.ts/temporal-api.ts **à cópia**
de journeys.spec.ts. Para S2–S5, acrescentar import e chamada de registerRemediationProbes
de remediation.probes.ts, também somente na cópia. Seleções e comandos exatos estão
em execution.json de cada rodada. Contraprovas: mutations-remediation.ps1 sobre
cópia exclusiva com o mesmo build; nunca usar o checkout principal como mutante.
`audit.py <run> <saida.json>` lê bytes com Python padrão, sem helpers de produto.

Runtimes próprios: `saneamento-20261023-before`, `-after`, `-final`, `-mutants`, sob
`../controle-financeiro-runtimes/CF-032/`. Fontes, scripts e evidências duráveis
ficam nos alvos autorizados. Relatórios Surefire sanitizados pelo runner; sem traces
com cookies/senhas. Hashes de produto fixam o código executado: os HEADs dos logs
indicam o checkout durante o trabalho, que ainda tinha alterações não commitadas;
não são usados isoladamente como prova de identidade do produto.

## Limites e encaminhamento

Não se repetiram A/F/T0–2 ou a suíte ampla de componentes por rotina. Seus aceites
históricos permanecem nos alcances originais. Não há nova matriz completa de temas,
zoom, dispositivos, restart, carga ou todos os interleavings. Campos ausentes/inválidos
de limite e privacidade foram exercitados em componentes, sem API financeira falsa
na jornada real. Testes de unidades antigos de efeito/tempo receberam apenas o novo
colaborador de autorização, com expectativas intactas; a regra financeira é exercida
com PostgreSQL nos controles novos e nos probes originais preservados.

DEC-ONB-03 e aceites CF021/029/030/031 preservados. Zoom nativo 200% CF010/015,
adoção real CF017/P01/P02 e desempenho de produção continuam pendentes. Sem banco
real, push, merge, deploy, exclusão de branch, limpeza de target ou de históricos.

Próximo passo: **revalidação independente dos quatro achados e dos critérios 2/3**,
reexecutando os probes originais e conferindo os observadores adaptados e limites.
Os achados não foram autoencerrados e os checkboxes de aceite continuam pendentes.

## Commits e conferência final

Commits locais separados: ab486ab (capacidade), 422a4d1 (limite), dc2df83
(identificação), 8d8fcc5 (segundos), 8cb0ffd (probes/contraprovas) e d70fb4d
(evidência nova vinculada ao inventário aplicado). O commit documental
que contém este arquivo completa o intervalo de revisão
`f52152324716fb241134370ee14e6adfec2fefa5..HEAD`; [Git de fonte](git-state.json).

[Checks consolidados](checks.json), [provas originais preservadas](proofs-preserved.json),
[fontes da cópia final](product-source-final.json), [mutantes restaurados](mutation-source-restored.json)
e [preservação/recursos encerrados](preservation-final.json). Oito arquivos de provas
conservam exatamente os hashes iniciais; histórico de evidências/migrações sem diff.
487 fontes da cópia final iguais ao candidato. O manifesto da cópia restaurada
fixa a versão das contraprovas anterior ao complemento do produtor; os cinco alvos
mutados não mudaram. São 20 capturas finais, incluindo três de reexecução, com relógios
nativos e sem overflow. Varredura textual sem JWT/senha sintética/bcrypt. README raiz
mantém o hash histórico inicial/final, fora dos commits. Portas observadas sem
listeners e Docker local sem contêineres restantes; runtimes preservados.
