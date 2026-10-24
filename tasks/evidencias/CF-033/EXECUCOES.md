# Execuções, sensibilidade e preservação

Produto imutável `bfb6c61`; novas provas/infra exclusivamente desta revisão.
Diretórios próprios sob `../controle-financeiro-runtimes/CF-033/`:
`revisao-20261023-01` e `mutacoes-20261023-01`. O nome com23 indica o início;
a retomada e o parecer ocorreram em24/10. Interrupção por limite de uso do
operador preservou processos/evidências; a retomada não reexecutou as mutações.

JDK21.0.12.1, Spring Boot4.0.2, PostgreSQL16.15 via Testcontainers2.0.3,
FlywayV1–V16/validate, Node24 e Playwright/Chromium registrados nos relatórios.
O prepare copia fontes/config/fixtures sintéticas e referencia node_modules
existente por junction. next.config só na cópia recebe raiz Turbopack comum.
Runner/protocolo CF032 reutilizados intencionalmente (nomes de variáveis,
schema/namespace), sem escrever em runtime CF032 ou rodar as jornadas antigas.

Os testes novos de integração usam Clock de produto fixo SP e JVM efetiva SP
(startup da aplicação configura a zona). O harness E2E configura JVM efetiva UTC
após startup; browser UTC+14. PostgreSQL/conexão UTC. Autenticação usa instante
real capturado pelo harness; datas civis fixadas sem congelar rAF/timers/WAAPI.
`environment.json`/`backend-environment.json` registram schemas, versões/checksums.
Fixtures têm owners/IDs novos; sem dados residuais usados como expected.

## Resultados — conjuntos sobrepostos não somados

| Pasta | Seleção | Resultado real |
|---|---|---|
| backend-new |6 provas novas iniciais |5 aprovadas/1 erro de fixture SQL, sem falha de regra |
| backend-installments-fixture-corrected |Somente parcela |1 aprovado; não é novo caso além dos6 |
| browser-new |N1 sessão A→B→A e N2 civil/segundos/export |2 jornadas reais aprovadas; Java1 é harness, não terceira jornada |
| counterproofs/baseline |7 provas incluindo HALF_UP novo |6 aprovadas/1 erro de estrutura PRICE; nenhuma mutação executada nessa tentativa |
| counterproofs-02/baseline |7 provas novas |7 aprovadas |
| counterproofs-02/realizado,owner,parcela,idempotencia |1 caso certo por mutação |Cada um:1 assertion falha/0 erros/0 skips |
| counterproofs-02/restored |Mesmas7 após restauração |7 aprovadas; não7 casos adicionais |
| integrated-controls |7 classes/74 controles existentes |73 aprovados/1 erro TimeoutException; **não suíte74 verde** |
| progress-investigation |Probe causal novo do timeout |1 assertion falha/0 erros; bloqueio advisory e progresso de outro owner demonstrados |
| progress-observer-final |Mesmo caso após ajuste do observador |1 assertion falha/0 erros; mesma causa/PIDs/valores. Aceita observar conclusão imediata correta ou lock, sem exigir bloqueio como pré-condição |
| frontend-build |Build da cópia |Aprovado; nenhuma fonte de produto alterada |
| browser-midnight |N3, dia local diferente de UTC |1 jornada aprovada; total de3 jornadas novas distintas, sem somar os harnesses Java |
| frontend-checks |Lint do probe novo e tipagem da cópia |0/0; logs vazios sem suppressions |

N3 e checks finais estão registrados em seus execution/results e consolidados
na matriz final. N3 não repete N1/N2: exige default23/10 no instante22/10T10Z em
UTC+14 e preserva31/12 editado ao recuperar foco. N2 anterior usava09Z, quando o
dia local ainda22; sua prova de civil/segundos permanece válida, mas isoladamente
não detectaria default via UTC. Esse refinamento é lacuna do observador identificada
na revisão, sem nova falha de produto presumida.

Os74:20 DailyReservationCapacity,1 DailyReservationConcurrency,8
OnboardingReviewConcurrency,8 Cf021Reporting,30 Cf024ConcurrencyCache,2
FinancialIntentArchitecture,5 FinancialIntents. Esses controles reconferem o
delta de guard/recibo/capacidade desde os aceites CF025/027. Benchmark CF025 e
54 componentes CF032 não foram repetidos: código e alcance aceitos conferidos;
medição histórica preservada. Nenhuma contagem histórica95/54/14 foi adicionada
às novas seleções como se fosse execução desta revisão.

## Erros de fixture e interrupções preservados

1. A primeira fixture de cartão incluiu `version`, coluna inexistente nessa
   entidade. PostgreSQL rejeitou o INSERT antes da compra; fonte em
   `backend-new/fixture-initial.java.txt`. Corrigido somente o INSERT, mantendo
   .05/3=.01/.01/.03 e .02/3 inválido. Apenas o caso afetado reexecutado.
2. O cenário HALF_UP enviou `amount` em Valuation PRICE; SPEC001 define `price`.
   Rejeição do parser antes da projeção. Entrada anterior em
   `counterproofs/baseline/fixture-half-up-initial.java.txt`; corrigida para price,
   mantendo .125×10.04=1.255→1.26. Baseline válido antecedeu as mutações.
3. Consulta CIM de processos não estava disponível no sandbox; consulta
   autorizada posterior confirmou fim do processo de prova. Não era falha do
   produto. A chamada de N3 interrompida não gerou pasta/execução; o início real
   posterior usa novo diretório vazio, sem sobrescrever evidência.
4. Avisos JVM/Mockito e warnings de whitespace dos logs brutos são preservados.
   Nenhum timeout aumentado, assertion afrouxada, skip ou snapshot renovado.
5. Primeiro verificador de preservação comparou hashes históricos LF diretamente
   com o checkout após fast-forward. Os oito textos tinham CRLF por
   `core.autocrlf=true` já configurado no Git do sistema. O alerta foi preservado
   em `historical-proofs-final-initial-verifier.json`; `historical-eol-analysis.json`
   demonstra que somente CRLF→LF recupera exatamente cada hash aceito. O observador
   corrigido exige **também** hash bruto final igual ao snapshot bruto inicial
   desta revisão, colhido após a integração. Nenhuma prova foi regravada/restaurada
   ou semanticamente normalizada; o conteúdo versionado não tem diff.
6. O primeiro probe causal aguardava obrigatoriamente um bloqueio antes de
   verificar a independência. A prova da falha era válida, mas uma futura correção
   que permitisse progresso imediato faria o observador expirar. Versão inicial
   preservada em `progress-investigation/probe-initial.java.txt`; observador final
   espera conclusão **ou** blocker do PID observado, no mesmo limite10s. Expected
   continua `sameOwnerBlocked=false`, sem mudança de produto. Reexecução só desse
   caso em `progress-observer-final`; não é caso adicional ou suite antes vermelha
   transformada em verde.

## Quatro mutações novas, cópia isolada

| Mutação plausível | Teste sensível e falha causal |
|---|---|
| Incluir PENDING no agregado de realizado |pendingAcrossYear...:0,00 esperado/250,00 observado |
| Retirar filtro de owner da coleção |collectionOwnership...:IDs de conta arquivada e ownerB aparecem onde só conta ativaA era permitida |
| Resto na primeira parcela |finalRemainder...:.03/.01/.01 observado, esperado .01/.01/.03 nas mesmas competências |
| Ignorar resultado durável do replay |replayAfterNewMovement...:novo ID de transação em vez do recibo original |

[Manifesto de resultados e SHA256](counterproofs-02/results.json). Cada alvo tem
before/after integral em arquivo texto; nenhum mutante foi executado no workspace
ou runtime compartilhado. Restauração byte a byte em finally nos quatro alvos;
hash before=restored e diferente do mutado. A seleção restaurada7/7 é positiva.
Não houve sobrevivente oculto nem erro ambiental contado como mutante eliminado.

## Reprodução

Da raiz, `prepare.ps1` e scripts referem respectivamente
`controle-financeiro-frontend/tests/cf033/` e
`controle-financeiro-backend/src/test/cf033/`. Cada execution.json guarda caminhos,
HEAD, filtro e início/fim/exit efetivamente executados.

```powershell
& controle-financeiro-frontend/tests/cf033/prepare.ps1 -RuntimeRoot <CF033/novo>
& controle-financeiro-frontend/tests/cf033/build.ps1 -RuntimeRoot <CF033/novo> -Evidence <evidencia-nova>
& controle-financeiro-backend/src/test/cf033/run.ps1 -RuntimeRoot <CF033/novo> -Evidence <evidencia-nova> -Tests 'Cf033AdversarialIntegrationTest'
$env:CF033_ZONE='Pacific/Kiritimati'
& controle-financeiro-backend/src/test/cf033/run.ps1 -RuntimeRoot <CF033/novo> -Evidence <evidencia-nova> -Tests 'FinancialJourneyPostgresE2E' -Grep 'N[123] CF033'
& controle-financeiro-backend/src/test/cf033/mutations.ps1 -RuntimeRoot <CF033/copia-mutacoes> -Evidence <evidencia-nova>
& controle-financeiro-backend/src/test/cf033/run.ps1 -RuntimeRoot <CF033/novo> -Evidence <evidencia-nova> -Tests 'Cf033ProgressIndependenceProbeTest'
```

A última seleção é vermelha no candidato, por CF033-01; não usá-la como gate
positivo. Não executar scripts com pasta de evidência existente. A cópia de
mutação deve partir do candidato intacto; não precisa build frontend para Java.

Manifestos final/inicial conferem487 fontes de produto no repositório e nas duas
cópias; oito provas históricas CF032 conferidas. README raiz fora do staging e
commits. Runtimes históricos preservados; sem clean/reset/remoção de target.
Não foram executados deploy, banco real, email real ou sucessoras.

Entrega local separada: `f8101d6` infraestrutura/probes, `4204342` provas. Staging
desse segundo lote contém170 arquivos exclusivamente de CF033;600 linhas de
diagnóstico de whitespace são de logs/relatórios brutos, conservados sem limpeza.
Parecer e estados seguem em commit próprio. README raiz nunca foi staged.
