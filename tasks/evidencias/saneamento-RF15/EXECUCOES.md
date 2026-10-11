# Execuções preservadas

Ambiente Windows, Node/Next local, Chromium Playwright; Java21 via target/temurin21 apenas como runtime, PostgreSQL Testcontainers com Flyway1–14. Evidências duráveis nesta pasta, nunca exclusivamente em target. Casos integrados usam UI→BFF→Spring→PostgreSQL/reload, sem mock de sucesso financeiro. Clock servidor fixo15jan2027; overrides do navegador/instantes explícitos nos testes.

| Execução | Resultado e interpretação |
|---|---|
| before-targeted | Sandbox não disponibilizou Docker inicialmente; acesso adequado reproduziu2 vermelhos de produto (privacidade/Escape) e1 verde de paginação100. Falha ambiental não conta como reprodução. |
| before-dates | Original D vermelho em3 assertions: fechamento, vencimento e atraso. API correta preservada. |
| before-mobile | Nome Novo Hábito ausente em360px. Reprodução antes de alterar produto. |
| after-original | Originais C privacidade/C detalhe/D datas verdes; novo mobile detectou retorno de foco. AutoFocus concorrente/remontagem do acionador corrigidos. |
| after-surfaces | 4 verdes: mobile, PAID real, privacidade, teclado. 3 falhas de matriz: fixture meta com @Future rejeita hoje; descrição de hábito acima255 gera500; retorno de foco investimento. Todas preservadas. |
| after-final-surfaces | 7 verdes,1 vermelho investimento. Inclui SP/UTC/Kiritimati, prazo local, saldo parcial e competência/reload. Meta criada para16jan e visualizada16jan com Clock; descrição reduzida a fixture admissível. Não são retries automáticos. |
| after-stable-visual | 7 verdes,1 vermelho investimento. Reexecução dos três probes originais e mobile; geometria observada antes da captura. Ainda houve imagens sem conteúdo interno; não aceitas como prova completa. |
| after-visual-observed | Detalhe verde com CSS do conteúdo confirmado em768. Hábito vermelho por seletor ambíguo após abertura real: heading da lista e do formulário. O clique anterior no centro do card atingia Marcar Feito, não o detalhe; observação antiga não comprova Escape do detalhe. Correção somente do probe. |
| final-detail-habit | 2/2 após restringir heading ao formulário e observar conteúdo interno do extrato também depois de reabrir em360. Capturas inspecionadas; o caso exploratório verde registra detalhe hábito ainda aberto após Escape, não aprova esse comportamento. |
| backend-dates | 20/20: Cf019CardIntegrationTest15 + Rf15InvoiceDatesTest5 (oracles literais, banco real descartável). |
| counterproof-base | Arquivo causal idêntico em git archive bc5532c isolado:8 falham/3 passam. Candidato11 passam; hashes iguais em counterproof-hashes.txt. Nenhuma mutação na árvore principal, portanto nenhuma restauração destrutiva. Cópia ignorada tests/artifacts/rf15-counterproof mantida para reprodução. |
| components-zones | 11/11 em cada um de America/Sao_Paulo, UTC, Pacific/Kiritimati, incluindo limites locais23:59:59/00:00:00, civil inválido/ausente, PAID e saldo0. |
| components-after-escalated | 49 verdes/3 vermelhos; cache EPERM inicial não conta como execução. |
| components-final | 112 verdes/3 vermelhos,14 arquivos. Originais cards-planning-audit preservados: três fixtures pré-DEC03 esperam30ago/10set para setembro e não fornecem datas API. Gate permanece vermelho, não excluir testes. Precisão financeira, recuperação, RV24-original-contract/residual e CF011 verdes no recorte. |
| privacy-detail-corrected | 1/1 após completar accountId obrigatório da fixture (typecheck detectou ausência). Mesmas assertions de acessibilidade normal/privado/normal. |
| lint-final | exit0. |
| typecheck-final → typecheck-corrected | fixture nova sem accountId→erro; campo adicionado→exit0. Nenhuma mudança nas provas originais. |
| rva-passive | 2/2, única sequência original20→120 com observação passiva; causa original inconclusiva. |
| native-zoom / native-chrome | Sem confirmação200%, falhas técnicas documentadas em ZOOM.md. Não são reprovações visuais do produto nem aceites. |
| build → build-escalated | Primeiro bloqueado por SWC/Acesso negado no sandbox; acesso adequado exit0. Sem alterar fontes/configuração nem excluir páginas. |
| final-privacy-layout | Verificação adicional da inspeção visual: wrapper interno empilhava ícone/texto em Marcar Feito. Tentativa display:contents permanente corrigiu geometria, mas probe de árvore acessível detectou valores privados novamente (1 verde/1 vermelho). Não aceita. Aplicação de contents restrita ao modo normal, mantendo elemento concreto aria-hidden no privado. |
| privacy-layout-components | 22/22, mais lint/typecheck exit0. O teste real de árvore acessível foi necessário: jsdom sozinho não detectou o problema de display:contents. |
| final-accessible-layout | 3/3: contas/privacidade, criação mobile e teclado/detalhe, após contents restrito ao modo normal. Oito capturas de contas, ação de hábito e detalhe inspecionados novamente. Valores privados ausentes da árvore acessível. |
| components-delivery / delivery-results | Recorte final22/22; lint/typecheck/build exit0 da árvore entregue. Gate amplo continua112/3; este recorte adicional não o substitui nem elimina suas falhas. |

Comandos reproduzíveis: `run-browser.ps1 -Evidence <diretório novo> -Grep <recorte>`, `run-component-zones.ps1`, `run-counterproof.ps1`. Browser usa port3107 e não deve concorrer com outro harness ou build Next. RVA usa RF15_RVA_ONLY=1. Retries0 e timeouts originais90s/assert15s mantidos; observação visual não modifica DOM/CSS/zoom. [Config](../../../controle-financeiro-frontend/tests/e2e/playwright.rf15.config.ts) e testes RF15 em tests/e2e e tests/component. Lint/typecheck/build via scripts npm; testes Java `-Dtest=Cf019CardIntegrationTest,Rf15InvoiceDatesTest`.

As correções de seletor/fixture/estabilização nos probes novos não editam entradas, resultados ou assertions independentes do revisor. Falhas anteriores permanecem. Histórico longo investimento e detalhe longo hábito expõem limites que devem ser decididos na revisão, não convertidos em verde global.

Staging explícito conferido por lote, README raiz sempre ausente do índice. `git diff --check` de código/testes/documentos sem erro; espaços finais em39 logs brutos e um txt de saída foram mantidos para preservar evidência, sem “limpar” resultados. Hashes de arquivo registrados referem-se aos bytes da árvore Windows desta execução; o Git pode normalizar fim de linha ao armazenar textos, conforme configuração preexistente.
