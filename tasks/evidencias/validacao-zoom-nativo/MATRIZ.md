# Cenários obrigatórios e critérios preservados

Base: `f09e69a6511a5772ea9052da7509a8930ae88d17`, branch `codex/saneamento-pr3-expanded`. Esta etapa não reabre RR3-01 nem executa expanded integral.

| Cenário | Fonte original e navegador | Identidade/diretório | Estado nesta etapa |
|---|---|---|---|
| `R10: zoom nativo 200% com ações, rolagem e foco` | `controle-financeiro-frontend/tests/e2e/cf015.native-zoom.integrated.spec.ts`; `chromium.launch`, headed, 1440×1000 | `fixtureUser('B', namespace, 'cf015-native-zoom', 'zoom')`; `visual/native-zoom-cf015` | **Falhou**: rodada01, confirmação60s; rodada02, cadastro15s antes do ready. Sem aceite nativo integral |
| `RF15: zoom nativo Chrome 200% com ações, rolagem e foco` | `controle-financeiro-frontend/tests/e2e/rf15-native-chrome.integrated.spec.ts`; `channel:'chrome'`, headed, 1440×1000 | `fixtureUser('B', namespace, 'rf15-native-chrome', 'zoom')`; `visual/native-zoom-rf15-chrome` | **Falhou**: confirmação60s nas duas rodadas. Menu nativo100%/200% comprovado por capturas humanas; ações/foco não alcançados |

Configuração original: `tests/e2e/playwright.rf15.config.ts`, projeto `review-sao-paulo`, `workers:1`, `retries:0`. Ambos são selecionados incondicionalmente na configuração RF15 normal. `CF015_NATIVE_ZOOM` pertence à seleção integrada básica; não torna estes dois opcionais. Controlador: `Rf15RemediationBrowserTest#browserBffSpringPostgresAndReload`, classe obrigatória da expanded em `.github/scripts/suites.mjs`.

## Contrato comum, na ordem do código

| ID | Resultado exigido | Prova original/associação necessária | Estado |
|---|---|---|---|
| N01 | Cadastro real de usuário sintético com dono por spec; conta `Conta sintética longa para zoom`, CHECKING, 123456789.12; cartão `Cartão sintético para zoom`, final4242, limite123456789.12, fechamento31/vencimento5; 12 compras de1234.56 | Cadastro UI → BFF → Spring → PostgreSQL descartável; IDs próprios, nomes exatos, persistência do harness | Ready em CF015/01 e RF15/01–02; CF015/02 falhou no cadastro |
| N02 | Tela `/cartoes`, heading `Carteira`; métricas antes de zoom | `ready.json`: versão, projeto, width/height/outerWidth/outerHeight/DPR/visualViewport.scale; captura externa de URL e100% | Três ready.json com baselineDPR1; menu100% humano em RF15/02 |
| N03 | Zoom real200%, razão DPR depois/antes=2 em180000ms | Menu nativo e captura com200%; poll original; arquivo legítimo `native-confirmed.txt` exatamente `200%` em60000ms após o poll | Poll de razão2 ultrapassado em três casos; confirmação60s ausente; RF15 com prova humana do menu200% |
| N04 | Mesma outerWidth; innerWidth=round(before.width/2); visualViewport.scale=1 | `zoom.json`, associado ao indicador externo. DPR relativo é corroboração; DPR absoluto não é percentual | Não alcançado após a espera de confirmação |
| N05 | `/`, `/contas`, `/cartoes`, `/planejamento`, `/extrato`: heading h1 visível, zero `.animate-spin`, razãoDPR2 | Cinco capturas `dashboard/contas/cartoes/planejamento/extrato-200.png`; `observations.json`; inspeção do conteúdo/ações/recorte. Heading visível sozinho não prova tudo | Não alcançado após a espera de confirmação |
| N06 | `Novo lançamento` → diálogo `Nova Transação`, foco inicial `Fechar modal`; Shift+Tab → `Salvar Transação` | Assertions originais; `transaction-bottom-200.png`; inspecionar alcance real do controle | Não alcançado após a espera de confirmação |
| N07 | Escape fecha transação e retorna foco a `Novo lançamento` | Assertion original de foco no acionador | Não alcançado após a espera de confirmação |
| N08 | Abrir fatura do cartão exato; diálogo `Cartão sintético para zoom •••• 4242`; foco inicial `Fechar detalhes da fatura` | Assertion de entidade/nome e foco; `invoice-top-200.png` | Não alcançado após a espera de confirmação |
| N09 | Rolar até `Compra 12 com descrição longa para zoom`; ação `Pagar` ou `Adiantar` alcançável | `scrollIntoViewIfNeeded`, click real; `invoice-bottom-200.png`; inspeção de texto/rolagem/recorte | Não alcançado após a espera de confirmação |
| N10 | Pagamento aninhado `Pagar Fatura - Cartão sintético para zoom`; foco inicial `Fechar modal`; Shift+Tab → `Confirmar Pagamento`, botão inteiro entre y0 e altura interna | Assertions e boundingBox originais; `payment-top/bottom-200.png`. Não confirmar pagamento: o cenário fecha o overlay | Não alcançado após a espera de confirmação |
| N11 | Tab retorna ao fechamento; Escape fecha apenas pagamento e devolve foco a `Pagar/Adiantar`; outro Escape devolve foco ao abridor da fatura | Assertions originais, sequência real de teclado | Não alcançado após a espera de confirmação |
| N12 | Fechar processo/contexto descartável mesmo em falha | `finally { await browser.close() }`; recibo de recursos da invocação, preferências pessoais preservadas | Perfis/processos próprios encerrados; recursos conferidos; preferências pessoais preservadas |

Cada spec tem timeout total300000ms. Não foram alterados timeout, retries, seleção, fixtures ou assertions. CF015 usa a data do navegador para o dia15 do mês; RF15 fixa Date em15/01/2027 às12Z. O controlador conserva os clocks financeiros/de credenciais existentes e PostgreSQL16 descartável. Não transferir o clock do preparo para CF015.

## Alcance normativo

[AC-UI-001](../../../docs/sdd/specs/003-criterios-oracles.md) exige V-LONG em360×800 inclusive200%, sem sobreposição impeditiva; confirmar/cancelar por scroll/teclado, foco contido e retorno; quebra/truncamento com acesso ao conteúdo completo. Não existe proibição geral inventada de rolagem horizontal.

[CF010](../../02-frontend/CF-010-componentes-comuns.md) mantém aberto seu aceite1; foco/scroll e demais recortes anteriores conservam seus próprios aceites. [CF015](../../02-frontend/CF-015-revisao-marco-frontend.md) requer confronto do conjunto e revisão independente, mesmo com checkboxes históricos marcados.

Os dois specs obrigatórios usam janela1440×1000 e fixture específica. Não contêm, por si, toda a matriz futura360/768/1440, token sem espaços, formulário100linhas, temas e onboarding citada nos documentos. Mesmo dois passes não autoaprovam globalmente AC-UI-001/CF010/CF015. Esta etapa não amplia os specs nem inventa substitutos: coleta os dois contratos originais e encaminha seu alcance para avaliação.

Responsivo360/768/1440 e o aceite de pintura RR3-01 não são provas de zoom, contraste universal, foco ou interação a200%. N01–N03 possuem somente as provas parciais discriminadas; N04–N11 não foram alcançados. Encerramento de recursos em N12 foi conferido. Nenhum cenário nativo integral aprovado.
