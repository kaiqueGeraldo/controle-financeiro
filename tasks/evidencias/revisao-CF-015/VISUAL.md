# Inspeção de telas renderizadas

Chromium real com Next/BFF/Spring/PostgreSQL descartável; dados exclusivamente sintéticos. As imagens foram inspecionadas pelo revisor, não aceitas por igualdade automática de snapshots. O teste de captura não contém oráculo geométrico completo.

## Execuções e cobertura

- `visual/`: 60 capturas (10 telas × 3 larguras × 2 fusos), execução `integracao-final.log`. Capturas do resumo anual nessa primeira rodada ficaram transparentes por interação com animação/clock; **não aprovam sua aparência**.
- `visual-final/` e `visual-avancando/`: tentativas parciais que preservam a assertion de opacidade e evidenciam a interferência do clock do harness. Não são suites aprovadas.
- `visual-nativo/`: 30 telas em SP, com opacidade efetiva do resumo anual, fundo rolado em três telas mobile e configuração clara após persistência/reload. A ação mobile sem nome bloqueou o roteiro restante (R12).
- `visual-encerramento/`: capturas nos dois fusos com relógio nativo; o seletor estrutural inicial apontava para o pai errado do título. **4 Playwright aprovados, 4 falhas de localização; isso não comprova R12 por assertion.** Essas tentativas foram preservadas em `browser-encerramento.log`.
- **`visual-conferencia/chromium-desktop-sao-paulo-cf007-v1/`**: rodada final com seletor estrutural corrigido e regressão de nome acessível separada. `browser-conferencia.log`: **3 aprovados, 1 falha R12 por nome `""`**, nenhum skip. A jornada visual completa passa, bem como os dois cenários temporais SP. O Java falha no gate Playwright e não chega à reconciliação SQL final nessa rodada; SQL/Excel já foram aprovados na execução integrada anterior de seis cenários.

No roteiro visual final o navegador usa relógio nativo, e o planejamento sintético de 25 é preparado para o mês nele exibido. O ano fotografado é 2026; o backend descartável continua com relógio de negócio controlado em 2027. Por isso os zeros do consolidado de 2026 não são um teste de fechamento financeiro e não devem ser comparados ao saldo de abertura registrado em 2027. A jornada temporal separada continua com seus relógios exatos e valores persistidos.

## Amostras efetivamente inspecionadas

As referências abaixo são relativas à pasta desta evidência. Não se afirma que todos os pixels das mais de 200 imagens das tentativas foram examinados; as amostras selecionadas cobrem todas as famílias de tela e as três larguras.

| Amostra | Inspeção / resultado |
|---|---|
| `visual/...sao-paulo.../360-dashboard.png`, `1440-dashboard.png` | Empilhamento mobile e grade desktop legíveis nessa massa; o conteúdo abaixo da dobra exige scroll. Não certifica todos os saldos financeiros. |
| `visual/...sao-paulo.../768-dashboard.png` | R10: valores cortados, cards estreitos e controles do gráfico sobrepostos. |
| `visual/...sao-paulo.../360-contas.png`, `768-contas.png` | Mobile empilha; tablet sobrepõe totais. Nome longo exige quebra/truncamento. |
| `visual/...sao-paulo.../768-extrato.png` e `visual-conferencia/...sao-paulo.../768-extrato.png` | R10: cabeçalho e resumos excedem espaço útil; a versão com dados maiores do primeiro ensaio evidencia o risco dos dígitos. A largura do documento sozinha não detecta overflow interno. |
| `visual/...sao-paulo.../360-cartoes.png`, `768-cartoes.png` | Mobile permite ler a amostra; tablet comprime textos/totais. Não simula fatura cheia nem pagamento. |
| `visual/...sao-paulo.../360-planejamento.png`, `768-planejamento.png` | Item sintético e total previsto visíveis no mobile; ações do cabeçalho escapam no tablet. Competência/persistência avaliadas separadamente pelo E2E/SQL. |
| `visual/...sao-paulo.../360-metas.png`, `360-investimentos.png`, `360-habitos.png` | Estados vazios de metas/hábitos e ativo sintético em investimentos legíveis. Não equivalem a marcação de hábito, detalhes volumosos ou validação de totais de posição. |
| `visual-avancando/...sao-paulo.../360-resumo-anual.png` | Primeiro recorte anual com valores renderizados. Não utilizado para aprovar animação em tablet/desktop. |
| `visual-nativo/...sao-paulo.../768-resumo-anual.png`, `1440-resumo-anual.png`; `visual-conferencia/...sao-paulo.../360-resumo-anual-bottom.png` | Anual renderizado, texto de posição atual explícito, notas alcançáveis ao rolar; tablet mantém densidade elevada e média mensal muito próxima do valor. Não confundir posição atual com fechamento histórico. |
| `visual-nativo/...sao-paulo.../360-settings-light.png` | Configuração em tema claro após alternar, salvar e reload; campos e ações legíveis na amostra longa. |
| [Modal 360](visual-conferencia/chromium-desktop-sao-paulo-cf007-v1/360-modal-light.png) | Formulário real aberto, foco inicial no fechamento; salvar visível. Campos de data/hora são controles nativos, com representação pt-BR. |
| [Modal 180](visual-conferencia/chromium-desktop-sao-paulo-cf007-v1/180-modal-light-zoom-equivalent.png) | Ensaio de largura efetiva reduzida: salvar cabe após scroll e Escape fecha, **mas** os rótulos CATEGORIA/CONTA se encostam e o botão de fechar fica recortado. Isso amplia R10/CF-010: passar a assertion do retângulo do Salvar não aprova a geometria completa. |

O nome completo de cada subpasta abreviada `...sao-paulo...` acima é `chromium-desktop-sao-paulo-cf007-v1`. [Capturas finais](visual-conferencia/chromium-desktop-sao-paulo-cf007-v1/) e [observações DOM](visual-conferencia/chromium-desktop-sao-paulo-cf007-v1/observations.json) estão preservadas.

## Limites

- 180×400 é um ensaio de largura efetiva, **não execução de zoom nativo 200%**. Zoom nativo, dispositivo touch físico, leitores de tela e outros motores de navegador não foram testados.
- Não se inspecionou o produto inteiro em claro/escuro × privacidade × dados vazios/volumosos. Privacidade e outros estados têm casos de componente, não uma certificação visual completa.
- `fullPage` captura o documento; áreas internas com scroll não necessariamente aparecem inteiras. Por isso existem imagens `-bottom` nas telas selecionadas. Modais de fatura com muitos itens e aninhamento ainda exigem inspeção funcional/visual adicional.
- O badge de desenvolvimento Next aparece em algumas capturas e pode cobrir uma área inferior. Ele é do ambiente de desenvolvimento; não foi classificado como regressão de produto.
- O fluxo de nota verifica POST, reload e GET literal; o fluxo de tema verifica estado do switch após reload. Essas assertions não comprovam o comportamento em caso de save concorrente (R04) nem substituem os testes de erro.
