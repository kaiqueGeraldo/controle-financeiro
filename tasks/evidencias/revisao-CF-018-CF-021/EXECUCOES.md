# Execuções, contraprovas e alcance

## Ambiente e reprodução

Windows/PowerShell, JDK Temurin 21.0.12, Maven Wrapper, Node 24.18, dependências já instaladas; PostgreSQL Testcontainers descartável. Backend de navegador usa `spring.flyway.enabled=true` e `ddl-auto=validate`; mocks apenas de email e cotação externa. Serviços financeiros, Next/BFF e persistência das jornadas não são mocks. Namespaces `rv1821-*`, emails `example.invalid`, nenhum banco/email real.

Os testes de domínio novos não usam `@Transactional` no método de teste: serviços encerram transações e as observações monetárias são leituras posteriores por JdbcTemplate/HTTP. C01–C04/RV13 criam duas conexões, identificam `pg_backend_pid()`, esperam ambas antes de liberar a barreira e executam TransactionTemplate em duas threads. RV13 controla ainda a precedência da alocação enquanto ela mantém lock. Isso é disputa real, não duas chamadas sequenciais rotuladas concorrentes. O SQL após o processo do navegador está em `browser/persisted-second.txt` e `persisted-third.txt`; namespaces são distintos entre execuções.

Comandos a partir de `controle-financeiro-backend`, com Docker disponível:

```powershell
$env:JAVA_HOME=(Get-ChildItem target/temurin21 -Directory | Select-Object -First 1 -ExpandProperty FullName)
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=Cf018RegressionIntegrationTest,Cf019CardIntegrationTest,Cf020InvestmentGoalIntegrationTest,Cf021ReportingIntegrationTest' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=IntegratedMilestoneReviewTest,IncrementalMilestoneReviewTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=*Test,!IntegratedMilestoneReviewTest,!IntegratedMilestoneBrowserReviewTest' test
.\mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' '-Dtest=IntegratedMilestoneBrowserReviewTest' test
```

O segundo comando inicial precedeu quatro probes adicionais. A versão final de `IntegratedMilestoneReviewTest` foi rodada sozinha: **21 casos, 16 falhas de assertiva, zero erros, 5 passes**. Seus casos vermelhos ficam deliberadamente no repositório conforme autorização do usuário; `mvn test` sem seleção não é apresentado como verde. O comando consolidado exclui explicitamente somente as duas classes de revisão vermelha/browser. Não exclui testes antigos nem migrações.

Frontend, a partir de `controle-financeiro-frontend` (CLIs locais):

```powershell
node scripts/test.mjs
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```

Na raiz: `node tasks/evidencias/revisao-CF-018-CF-021/lint-compare.mjs` e `& tasks/evidencias/revisao-CF-018-CF-021/mutation-check.ps1`. TypeScript e lint foram repetidos após a última mudança do probe visual e passaram. O shim global de npm estava apontando para `npm-cli.js` ausente na retomada; a execução direta do TypeScript local passou, sem instalar dependências nem mudar produto.

`-Dreview.grep=UI03`, `UI06`, `UI04` ou `UI07` seleciona uma jornada no harness do navegador. O wrapper `.cmd` interpreta `|` em argumentos; usar classe de regex como `UI0[36]` em vez de pipe evita o erro de shell observado. O harness existente foi reaproveitado com configuração própria, autenticação sintética e porta 3107, sem reaproveitar servidor de desenvolvimento alheio. Clock de produto do browser: `2027-01-15T12:00:00.123456Z`; autenticação e calendário do browser fixados de forma explícita. São Paulo foi o fuso desta revisão integrada, sem alegar nova rodada Kiritimati.

## Resultados consolidados

| Execução | Resultado | Evidência |
|---|---|---|
| Recorte backend já existente CF-018/019/020/021 | **57/57**: 24+14+11+8 | `logs/baseline-backend-authorized.log` |
| Upgrades incrementais novos V2/V3/V4→V5 | **3/3** | `logs/review-domain-migrations.log`, `test-results.json` |
| Banco vazio/legado da CF-017 | **8/8** (6 vazio, 2 legado) | mesmo log |
| Probes novos de domínio/HTTP/conexões, versão final | **5 passes / 16 falhas / 0 erros** | `logs/review-final-probes.log`, `test-results.json` |
| Backend consolidado, seleção explícita acima | **167/167**, incluindo 3 novos incrementais | `logs/backend-suite.log` |
| Frontend unitário | **18 execuções aprovadas**: 6 casos × 3 fusos | `logs/frontend-unit.log` |
| Frontend componentes | **144/144**, 31 arquivos | `logs/frontend-component.log` |
| TypeScript | **Passou**, incluindo specs de revisão | `logs/frontend-typecheck.log` |
| Build de produção | **Passou** após autorização de acesso à rede | `logs/frontend-build-authorized.log` |
| Lint no mesmo escopo de produto | 21 arquivos alterados, **0 erros/0 warnings** em `0cc24b7` e `46d9fad`; specs/config da revisão também sem diagnóstico | `lint-comparable.json`, `logs/lint-comparable.log` |
| Mutantes financeiros isolados | **2/2 detectados**; **2/2 passam após restauração** | `logs/mutation-red.log`, `logs/mutation-restored.log`, `mutation-result.txt` |

A contagem não é critério de aceite. C01–C04/C05 passaram: transferência versus pagamento conserva A700/B250 e dívida zero; duas baixas de 200 sobre previsão 300 têm um único sucesso; duas reservas de 700 sobre 1000 têm um sucesso; reembolso concorrente tem uma compensação; 999999999999,99 mantém centavos em JSON e célula XLSX. RV01–RV16 falharam por valores/comportamentos documentados em ACHADOS, com RV07 reservado a NG-01 e RV12 classificado como funcionalidade incompleta.

## Navegador, camadas e dados independentes

| Jornada | Resultado e camada realmente alcançada | Evidência |
|---|---|---|
| UI01 — abrir conta e registrar despesa | UI→BFF→Spring→PG→reload: abertura 1000 sem renda, despesa 120, conta 880 e caixa 120. Formulário não oferece previsão/transferência. Arquivamento **via API**, seguido de UI: subtotal cai a zero embora SQL mantenha 880. Caso vermelho. | `ui01-new-transaction.*`, `ui01-extract.*`, `ui01-archived-dashboard.*`; SQL da segunda rodada |
| UI02 — parcelas e dois pagamentos | Conta/cartão/compra 300 em 3×100 montados via API; pagamentos pela UI. Primeiro 20 confirma, segundo 20 legítimo falha 400, input sugere 100 em vez de 80, conta 980. Caso vermelho. | `ui02-payment-0.json`, `ui02-payment-1.json`, `ui02-invoice.json`, `ui02-conflict.*` |
| UI03 — reserva/checklist/exclusão | Setup via API, reserva 300 sem débito. GET/GUI perde item. Excluir é interceptado pelo backdrop. **Não há E2E de compra/exclusão aprovado**. Probes HTTP separados confirmam contrato antigo de GOAL_BALANCE e targetAccountId recusado; conta permanece 1000. Caso vermelho. | `ui03-goals.json`, `ui03-checklist.*`, `ui03-delete-overlay.*`, `ui03-purchase-api-only.json`, `ui03-delete.json` |
| UI05 — investimento variável | Setup de conta/ativo via API; comprar 10×20 e vender 4×25 na UI; banco 900, quantidade 6, custo 120; gerencial renda/consumo 0, ganho 20; caixa entradas100/saídas200/líquido−100. Consulta após reload e SQL. Segundo contexto autenticado não lista a conta nem lê histórico do ativo do primeiro. **Passou.** | `ui05-export.xlsx`, `ui05-xlsx-cells.json`, `ui05-annual.*`, SQL da segunda rodada |
| UI06 — renda fixa B08 | Resgate real de 220 via UI, posição de abertura custo1000/valor1100. Request envia 220 unidades×1, posição residual780/858, ganho0. **Falhou**, esperado custo800/valor880/ganho20. | `ui06-request.json`, `ui06-observed.json`, SQL da terceira rodada |
| R03: ok/read/lost/overlap | Os quatro cenários passam com 1 POST, banco900, fatura paga, planejamento PAID, recarga e foco/reconciliação. Só falhas de transporte/leitura são injetadas, escrita é real. | `browser/playwright-second.log`; cópia `milestone-recovery.integrated.spec.ts` |
| Nota anual concorrente/R06 | Resposta atrasada não apaga rascunho posterior; falha preserva edição e retry persiste. Passou na segunda rodada. | mesmo log/cópia de recovery |

No XLSX realmente baixado em UI05, B3=0 (receita), B4=0 (consumo), B5=20 (resultado), B7=20 (ganho de investimento). As duas linhas de movimento registram principal de compra/venda sem colocá-lo no resultado ordinário. `ui05-xlsx-cells.json` é extração do XML do arquivo, não um segundo cálculo pela query. A regressão B21 percorreu mais de 500 registros, confrontou página/total e owner; reversões/compra em um ano e reembolso em outro foram testados no domínio, não pelo navegador. C05 não detectou perda de centavo dentro do teto monetário; faixa agregada além dele é problema separado (RV10).

Segunda rodada: 10 casos, 7 passes e 3 falhas (UI01/02/03); UI04 ainda não certificava todas as imagens estáveis. Terceira: somente UI03/UI06, ambos vermelhos com respostas e banco reais. UI07, isolado com predicado de pathname e respostas 503 observadas, **passou**. UI04 final **passou em 32,1s**, com 15 capturas de telas e uma de carregamento; o harness Java encerrou sem falhas. Os logs `playwright-second/third/error/visual-final` conservam esses recortes; não se somam execuções repetidas como casos distintos. `persisted-visual-final.txt` registra o banco do último cenário visual.

## Inspeção visual dirigida

Capturas `browser/visual-{360,768,1440}-{dashboard,accounts,extract,investments,annual}.png` e texto acessível correspondente, com dados reais do harness. Tema padrão escuro, privacidade desligada, 360×800 / 768×1024 / 1440×900. Inspeção inclui zero conhecido/sem movimento no extrato e contas, investimento com custo conhecido/avaliação ausente, posição anual indisponível, carga atrasada e erro 503 explícito. Não é uma matriz cartesiana de todos os estados em todas as telas.

Algumas telas usam rolagem interna e animação ao entrar na área visível. O probe final rola até o conteúdo financeiro e espera opacidade dos ancestrais, além da presença no DOM, antes de capturar; `fullPage` sozinho não fotografa todo o conteúdo de um contêiner interno. As capturas representam o trecho visível registrado. Tentativas iniciais com tela anual vazia não foram tratadas como inspeção visual concluída. No cenário visual final, o calendário foi deslocado para 15/01/2027 apenas pela API Date, mantendo performance/RAF/Web Animations nativos; as tentativas com Clock do Playwright não concluíram consistentemente a animação anual. Não se alterou CSS/opacidade de produto para obter as capturas. As imagens finais anuais de 768/1440 foram abertas e inspecionadas, assim como os estados de erro e carga de 360.

Achados visuais: estado de avaliação ausente vira zero/perda total no item em todos os tamanhos (RVI-06); motivo longo é cortado no resumo de investimento em 360 (RVI-22). No recorte de contas/dashboard/extrato, rótulos de subtotal e resultado são legíveis; não se observou overflow horizontal de página. Isso não detecta cortes internos por overflow-hidden e não significa aprovação visual irrestrita. O estado de erro explícito foi conferido em `visual-360-error.png`, com botão Tentar novamente e três requests 503 documentados em `ui07-outage.json`; carga em `visual-360-loading.png`.

Não executados: zoom nativo 200%, nova bateria completa CF-015, contraste formal, tema claro/privacidade nesta rodada, Safari/Firefox, toda combinação de fuso/viewport/estado. Permanecem os limites anteriores, sem reabrir a auditoria geral.

## Migrações e preservação

Confirmada ausência de diff de V1 `V1__baseline_pre_temporal.sql` e V2 `V2__adopt_temporal_metadata.sql` entre `0cc24b7` e `46d9fad`. `IncrementalMilestoneReviewTest` inicia schema sintético real em targets 2, 3 e 4, insere dados naquela versão, captura colunas comuns por PK, migra a 5 e compara. Inclui transação temporal canônica, bruto temporal desconhecido/null, owner/conta e, em V4, compra/pagamento/estorno em suas colunas existentes. Verifica origem legada desconhecida, constraints novas, validate e segunda migração sem trabalho.

O harness de navegador provou Hibernate validate sobre V1–V5 (`logs/browser-harness-visual-final.log`, inicialização e encerramento aprovados). Testes de serviço normais usam create-drop por infraestrutura existente; por isso não são apresentados como prova das migrações. Não foi testada a adoção de qualquer banco operacional nem inventado preço/custo de legado. V5 altera representações e exige os gates de compatibilidade/preflight já conhecidos. RV17-01/RV17-02 continuam: comparação de schema insuficiente para baseline real e fingerprint de backup/restore parcial. Não foi repetida a revisão completa CF-017.

## Poder dos testes e auditoria de mudanças

`mutation-check.ps1`, executado na raiz, cria `git archive` de `46d9fad` em diretório novo sob `target/`, modifica somente a cópia e executa dois métodos:

- M1: troca resto da última para a primeira parcela. `finalInstallmentGetsTheRemainderAndEachInstallmentHasOneSuccessiveCompetence` falha pela sequência, sem falha de compilação.
- M2: remove exclusão de ACCOUNT_OPENING da consulta gerencial. `periodResultExcludesOpeningPendingTransferAndInvestmentPrincipal` falha: esperado100, observado1100.

Restauração em finally dos bytes originais, hashes conferidos, mesmos métodos executados de novo: 2 passes. O checkout compartilhado nunca recebeu as mutações. Isso demonstra poder causal nessas duas regras, não mutação exaustiva de todo o bloco.

Auditoria do diff de testes: expectativas do calendário passaram a competência do fechamento e fronteira seguinte, coerentes com DEC-03 confirmado; não se recolocou comportamento antigo do emissor. `TemporalCompatibilityIntegrationTest` passou a esperar avaliação manual sem INTEREST fictício; o novo expected é consistente com FIN-04, mas não comprova motivo/data/limites, por isso RV15/RVI-18. Mocks de reserva zero em testes temporais isolam calendário e não comprovam capacidade financeira; C03/RV13 cobrem a disputa real. B21 monta algumas entidades diretamente e usa transação de teste: serve para provar queries, não todas as regras de escrita; os probes e browser usam os serviços efetivos.

Não se encontrou justificativa para enfraquecer expected em favor dos bugs reproduzidos. O caso antigo de toggle pago continuava validando efeito monetário sem exigir a preservação da previsão, lacuna exposta por RV02. A troca de DTO de metas não tinha contrato integrado que cobrisse items, exposto por UI03. Os componentes de CF-021 cobriam totais anuais/subtotais, mas não o item de investimento que recompõe valor via null, exposto por UI04. A cópia R03 foi comparada com a original: somente duas ocorrências do rótulo “Patrimônio Total” passam para “Subtotal de ativos conhecidos”. Nenhuma assertiva de débito único, dívida, planejamento, foco ou recuperação foi removida.

## CF-016: normativa e limite do verificador

O verificador documental percorreu as identidades/precisão/links antes de falhar no gate de preservação de arquivos anteriores. `--adversarial` fica depois desse gate e **não foi alcançado nesta revisão**. Também foi tentado replay de `2269b22` em arquivo Git, sem mudar contrato/verificador/snapshot; `cf016-line-endings.mjs` apenas recompõe bytes quando o SHA coincide com o snapshot (incluindo cópia de arquivos atuais comprovadamente idênticos). Restou divergência de `pom.xml`. Não se declara replay integral verde nem se apaga assertiva para obtê-lo. Log: `logs/cf016-isolated.log`.

A avaliação normativa não depende desse status: foram confrontados FIN-01–08, E01–E49/B01–B18 e as implementações, preservando a decisão DEC-03. NG-01 registra a borda de representabilidade do preço derivado. RVI-08 usa os números literais de E27; RVI-17 usa B08; RVI-05/10 usam B11/FIN-08. Esperados dos probes não foram calculados pela query nem por helper financeiro de produção.

## Higiene e limites finais

`collect-evidence.ps1` copia logs selecionados para `logs/`, removendo JWTs sintéticos e espaços ao final das linhas, e extrai resultados JUnit. Capturas/requests não contêm contas de terceiros nem credenciais operacionais. Logs brutos e falhas intermediárias de autoria permanecem locais ignorados; as execuções curadas, scripts, SQL e imagens necessários são versionados. `lint-compare.mjs` usa o mesmo ESLint/config/dependências e os mesmos 21 caminhos para base/candidato, evitando confundir legado fora do diff com regressão. O lint geral de todo o legado não foi repetido.

Limitações explícitas: não houve E2E completo de previsão/baixa/transferência, compra/reembolso de checklist ou estorno de cartão (UI/contratos impedem partes ou não foram exercitados); a prova nesses casos é domínio/HTTP/inspeção e está identificada. Não foram executados benchmark CF-025, teste específico do deadlock H-01, concorrência de exportação H-02, protocolo durável CF-024, adoção/backup em banco real ou gates de publicação. Não há alegação de ausência de bugs.
