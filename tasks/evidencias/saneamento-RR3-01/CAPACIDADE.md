# Capacidade nativa — 01/11/2026

**C: capacidade segura indisponível nesta sessão para os dois cenários obrigatórios.** Nenhum cenário nativo foi iniciado neste lote. Não há ambiente alternativo conhecido e comprovadamente preparado para declarar B. Esta classificação de capacidade é diferente da letra B usada como decisão normativa no parecer anterior: o requisito continua obrigatório.

A inspeção foi delimitada à documentação das ferramentas, versões de arquivo, inventário somente leitura e recusas anteriores. A skill computer-use 26.1027.30824 e seus guidance/api/confirmations foram lidos. Inicialização suportada de @oai/sky seguida apenas de list_apps retornou Google Chrome, uma janela 591752. Título e perfil pessoal não foram inspecionados. Não houve get_window, captura de janela, ativação, tecla, lançamento nativo nem tentativa equivalente à recusada.

| Capacidade | Evidência e limite |
|---|---|
| Navegador instalado | Chrome 155.0.8059.84, metadado do executável em Program Files. Não comprova um contexto de ensaio. |
| Contexto isolado | Os testes originais criam contextos descartáveis. Não foram iniciados nesta avaliação; a janela existente do inventário não foi tratada como alvo autorizado. |
| Zoom suportado pelo Chrome | Menu ou Ctrl+plus, segundo [documentação oficial](https://support.google.com/chrome/answer/96810). Exige vínculo seguro ao alvo e indicador observado. |
| URL + identidade da janela | sky expõe Window com app/id/title e observação/entrada. Não foi demonstrada nova capacidade de resolver a recusa anterior de propriedade/URL. Título sozinho não certifica URL. |
| Percentual nativo | Não observado. APIs [tabs.setZoom/getZoom](https://developer.chrome.com/docs/extensions/reference/api/tabs) pertencem ao contexto de extensão; não existe integração autorizada demonstrada aqui. Não foi instalada extensão. |
| Captura e interação | APIs sky e browser de página existem. Playwright/Docker permitem DOM/capturas/teclas de página; suas descrições não comprovam controle da interface nativa e indicador200% no mesmo alvo. |
| Escala/resolução do sistema | Não coletadas nesta sessão, pois não houve cenário nativo. O DPR1.25 histórico não é um baseline novo. |

Os recibos históricos native-ui-binding.json e native-chrome-ui-stop.json continuam preservados no runtime saneamento-PR3-expanded-residual/01. O primeiro informa propriedade de janela inconsistente em sky e cua; o segundo interrompe Computer Use por URL sem confiança suficiente para a política. Não houve entrada nativa nem confirmação. Uma versão nova da skill e uma janela listada não demonstram, por si, que essas condições foram resolvidas. Não se repetiu a abordagem nem se tentou obter a mesma ação por CDP, atalho de página, shell ou outra interface.

## Cenários e critérios preservados

- cf015.native-zoom.integrated.spec.ts — “R10: zoom nativo 200% com ações, rolagem e foco”, Chromium headed do Playwright.
- rf15-native-chrome.integrated.spec.ts — “RF15: zoom nativo Chrome 200% com ações, rolagem e foco”, channel chrome.

Ambos integram playwright.rf15.config.ts padrão, chamado por Rf15RemediationBrowserTest na expanded. CF015_NATIVE_ZOOM não dispensa esses casos; RF15_RVA_ONLY não pode ser usado na integral. Nenhum arquivo de seleção, gate, cenário ou CF010/015 foi editado.

AC-UI-001 em docs/sdd/specs/003-criterios-oracles.md exige, em360×800 inclusive200%, texto/valores/ações sem sobreposição, confirmar/cancelar alcançáveis por scroll/teclado e foco contido/devolvido. CF010/CF015 continuam em_revisao. Os testes nativos cobrem ainda as rotas dashboard/contas/cartões/planejamento/extrato, diálogo Nova Transação e fatura/pagamento com nomes exatos. A futura execução deve confrontar também o critério normativo; screenshots sozinhos não aprovam leitura ou reflow.

## Preparação mínima e roteiro assistido para outra execução

1. Ambiente local descartável com Node24/JDK21/keytool, Docker/PG sintético, instalação pelo lockfile, browsers compatíveis e aplicação local pronta. Comprovar origem/URL, processo, janela e contexto isolado com ferramentas autorizadas que respeitem suas políticas; não reaproveitar a janela pessoal listada.
2. Preparar os dois testes originais sem filtros que retirem casos, sem prazo adicional, skip ou relaxamento. Registrar revisão/hash das fontes e runtime externo novo. Quando o ensaio começar, capturar URL e ready.json reais, browser/version, resolução, escala do SO e métricas100%. Não alterar escala durante o ensaio.
3. Operador ou integração autorizada capaz de atuar na janela exata aplica zoom nativo pelo menu/atalho. Capturar indicador200% e URL/identidade vinculados. Somente após essa observação legítima fornecer native-confirmed.txt com200% ao diretório do teste correto. Não fabricar a confirmação a partir de DPR.
4. Exigir razão DPR2, largura interna pela metade, janela externa constante e visualViewport.scale1. Nenhuma dessas métricas isolada distingue toda forma de emulação; a prova da interface nativa continua necessária.
5. Percorrer rotas e diálogos, inspecionar conteúdo/identidade, recortes e overlays, confirmar alcance de ações, rolagem, Tab/Shift+Tab/Escape, foco inicial/contido/devolvido e persistência pertinente. Conservar capturas, relatórios, traces e observações por critério. Falha de produto vira achado separado.
6. Restaurar100% ou encerrar contexto descartável; não alterar perfil pessoal/políticas. Uma nova recusa encerra a tentativa, sem caminho alternativo de contorno.

Este roteiro prepara trabalho posterior; não solicita execução manual imediata ao usuário. Não existe native-confirmed.txt, zoom.json ou aceite novo neste lote. Expanded integral não foi executada. PR #3 continua sem liberação de merge; os resultados remotos expanded/required permanecem reprovados até nova execução autorizada.
