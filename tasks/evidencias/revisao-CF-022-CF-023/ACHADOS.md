# Achados e pendências da revisão conjunta

## RJ-022-01 — P2, confiabilidade da evidência integrada pendente

**Dona:** CF-022. Classificação: observação com causa inconclusiva; não é
vulnerabilidade nem defeito financeiro/de calendário confirmado.

**Reprodução observada:** comando de HabitBrowserIntegrationTest com
`cf022.evidence=../tasks/evidencias/revisao-CF-022-CF-023/browser/habits-synchronized`,
JVMUTC, Clock2027-01-05T02:59:59Z, navegadorSãoPaulo, dados sintéticos.
DAILY passou marca/desmarca/meta0→1→0/reload. WEEKLY_GOAL foi criado com200
e relido com200; a espera de resposta de toggle expirou em30000ms sem POST
registrado no Next/backend. O processo Node terminou por rejection não capturada
da promise de waitForResponse enquanto o click ainda era aguardado; não há
calllog terminal desse click nem trace/SQL pós-falha que estabeleça sua causa.

**Evidência:** logs/browser-habits-synchronized.log,
browser/habits-synchronized/playwright.log e next.log. Não existe indicação
de duplicidade de progresso ou saldo no caminho recusado; não se afirmou
ausência de efeitos pela falta de SQL terminal. O ponto observado é anterior
ao envio, distinto de RVA-03, que ocorreu depois de pagamento confirmado.

**Contrato/impacto:** a política e o pedido exigem confirmar caminhos relevantes
por browser/BFF/backend/PG/reload e não fechar falha com retryverde. O caminho
semanal funcionou na execução diagnóstica seguinte, com pós-condiçõesSQL, mas
isso não identifica por que a tentativa anterior não enviou o comando.
O backend DEC-08/locks/migração permanece aprovado; CF-022 conserva em_revisao
até classificar a confiabilidade da prova/caminho integrado.

**Diagnóstico permitido realizado:** Promise.all captura click e espera de
resposta com os mesmos prazos; nenhuma assertion/ação foi removida, nenhum
clickforçado/sleep/retry/interceptação de sucesso foi acrescentado. Em falha,
o harness agora captura screenshot/ARIA/trace. A única execução diagnóstica
passou4jornadas; seu verde foi preservado e não usado como encerramento causal.

**Condição objetiva de aceite:** observar passivamente o click semanal e a
entrada/saída do transporte no mesmo runtime com estilos carregados; ao primeiro
limite, capturar calllog/DOM/rede e SQL quando houver POST. Se a causa for produto,
reproduzir/corrigir em execução autorizada da CF-022 com regressão causal; se for
harness, demonstrar o ponto que impede ação/observação e validar sua correção
mantendo os resultados esperados. Aprovação posterior sem esse confronto não
encerra RJ-022-01. Não se exige freeze de CF-024, cuja dependência não inclui hábitos.

## RJ-H01 — Harness de identificação do scheduler, encerrado

O primeiro probe132 teve1erro NoSuchElement: Task.getRunnable retorna
OutcomeTrackingRunnable do Spring7, em vez de diretamente ScheduledMethodRunnable.
Foi inspecionado o bytecode local. O probe final identifica o delegate e seu
targetproxy real, seleciona HabitCronService (InvoiceCronService tem o mesmo
cron), e despacha o runnable original no TaskScheduler. Gates137/27 e mutação
isolada sem SchedulerLock comprovam processamento/recusa pelo DB. Não houve
mudança de produto. O primeiro erro não foi contado como bug nem mutação detectada.

## RJ-H02 — Cadastro frio no harness, sincronização corrigida

Primeiro browser falhou no toHaveURL5s após clicar cadastrar. Logs Next mostram
register200 em3,5s, login200 em634ms, user200 e compilação/render da home2,2s.
O prazo da assertion incluía cadastro/login/compilação. O harness passou a
observar o login real antes de cobrar navegação, mantendo5s e os mesmos
expected. Execuções posteriores atravessaram cadastro; não se alegou SLA de
login/ausência de lentidão. Isso não explica nem encerra RJ-022-01.

## Pendências anteriores preservadas

- RVA-03/CF-019: spinner sem recuperação depois de POST200/débito120/pagável0;
  causa inconclusiva. Experimento anterior com portal antes do click/zeroPOST não
  reproduz a ocorrência original. Próximo experimento passivo continua CF-019;
  CF-024 participa da coordenação, sem transferência de responsabilidade.
- RV17-01/02 e adoção real/CF-017: preflight insuficiente/fingerprint parcial,
  inventário/proveniência/schema/volumes/backup/restore reais não conhecidos.
- Zoom nativo200%/CF-015, verificações transversais, desempenho/lint/release:
  não executados nem encerrados nesta revisão.

Nenhum bloqueante concreto de CF-023 foi encontrado no escopo executado. Isso
não constitui declaração de ausência total de bugs ou cobertura exaustiva.
