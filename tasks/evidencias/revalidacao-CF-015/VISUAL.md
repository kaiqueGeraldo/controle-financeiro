# Inspeção visual independente

Capturas novas da jornada `cf007-fca0b227`, Chromium São Paulo/Kiritimati,
360×800, 768×1024 e 1440×900; temas claro/escuro. Fixture sintética do harness,
sem dados reais. As assertions de teclado/rolagem/geometria foram reexecutadas
nos dois fusos. Inspeção visual direta concentrou-se nas seguintes imagens
de `visual/chromium-desktop-sao-paulo-cf007-v1/`:

| Imagem | Observação |
|---|---|
| 360-invoice-long.png | Total 14.814,72 e ação de pagamento visíveis; área central rolável. Descrições truncadas; detalhe temporal quebra linha. Não se inferiu acesso à lista inteira somente pela imagem: o roteiro de scroll verifica item 12. |
| 1440-invoice-long.png | Modal centralizado, total/limite/ação sem recorte; lista com espaço separado para valores. |
| 360-modal-light.png | Formulário de transação cabe, incluindo botão salvar; data/hora e seletores legíveis. |
| 360-dashboard-bottom.png | Extrato recente e conta mantêm 123.456.789,12 integral; quebra em linhas distintas evita corte. |
| 360-cartoes-light.png | Resumos de limite/disponível preservam valor extenso em uma coluna. |
| 768-dashboard-light.png | Sidebar recolhida, resumo em coluna sem sobreposição de valores. Botão flutuante aparece próximo do gráfico no fundo da viewport; scroll permite acesso ao conteúdo, sem converter essa única captura em garantia geral de toda posição de rolagem. |
| 1440-dashboard-light.png | Três colunas; valor extenso do extrato recente cabe; eixo compacto e controles do gráfico separados. |
| 768-planejamento-light.png | Cabeçalho quebra, ações de copiar/lançar visíveis, item/fatura e totais no rodapé legíveis. Indicador Next dev aparece no canto. |
| 768-extrato.png | Cards de resumo em duas colunas, filtros e ação de lançar sem sobreposição. |
| 1440-extrato-light.png | Cabeçalho/filtros/resumos sem recorte. Estado sem transações do mês é esperado para a seed visual; não é evidência de valor financeiro global. |

O script também captura outras telas e o segundo fuso; não se declara inspeção
individual de todas as imagens. Foco e modal aninhado foram verificados pelas
assertions de navegador e componentes, não deduzidos das imagens.

Zoom nativo 200% **não executado**. A tentativa documentada anteriormente em
headless não alterou as métricas; não se repetiu uma tentativa sabidamente
ineficaz como se fosse teste de zoom. Não há certificação de navegador
interativo/zoom, leitor de tela físico, outros browsers nem matriz cartesiana
de privacidade. `180-modal-light-narrow-viewport.png` permanece apenas viewport.
O aceite de zoom em CF-010/AC-UI-001 continua pendente.
