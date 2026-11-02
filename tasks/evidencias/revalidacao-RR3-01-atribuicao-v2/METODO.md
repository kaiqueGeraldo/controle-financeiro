# Highlight, referência independente e restauração

## Intervenção e identidade

prepareTextPaint percorre os Text descendentes do ElementHandle validado por inspectText, cria Range completo por nó de texto e usa cópias desses ranges no Highlight. Não seleciona substring de outro elemento. A prova nested-full-range verificou três ranges, extremos 0/comprimento, mesmo nó nas duas pontas, todos descendentes do alvo, concatenação exata e nenhum conteúdo adjacente. Uma substring esperada diferente falhou em identity antes das capturas; seleção parcial preexistente foi preservada e recusada.

O identificador privado usa quatro valores Uint32 de crypto.getRandomValues, com prefixo CSS válido. Os nomes observados nas 14 fixtures foram distintos; a inspeção do código confirma geração nova por preparo, sem alegar impossibilidade matemática de colisão. O registro usa prioridade 2147483647 e uma folha CSS construída, adotada apenas durante B. As regras pedem cor/fill/fundo transparentes e sombra ausente. Não se escreve style, classe ou atributo; canvas e referência não entram no DOM.

A especificação define highlights como coleções de ranges, registro por documento e prioridade de sobreposição. Ranges vivos acompanham mudanças no DOM, razão adicional para comparar identidade/estado antes e depois. [CSS Custom Highlight API, CSSWG](https://drafts.csswg.org/css-highlight-api-1/).

A especificação de pseudo-elementos limita as propriedades aplicáveis e declara propriedades prefixadas, como -webkit-text-fill-color, inaplicáveis ao highlight. Não inferimos conformidade universal a partir desse nome na regra ou do valor computado: foram testados Chromium 153.0.8010.12 e os pixels efetivos. O método também exige diferença atribuível, não só o retorno de mask(). [CSS Pseudo-Elements 4, propriedades de highlight](https://drafts.csswg.org/css-pseudo-4/#highlight-styling).

A demonstração highlight-revelacao.mjs usa cor preta explícita no Highlight sobre texto branco em fundo branco: A=0, B=1395, C=0 pixels não brancos; HTML igual. Demonstra que a API pode produzir visibilidade durante B. A máscara transparente real não aprovou essa fixture. O probe independente de direção usa um único pixel preto apenas em B, com referência preta e suporte espacial exato: direção correta recusa; a mutação que desliga direção falsamente cria contribuição. Logo suporte espacial sozinho não basta.

## Referência anterior às capturas

A referência é preparada antes de A. A origem é textContent dos nós originais, não clone nem imagem de diferença. Copiam-se font-style, weight, size, family, kerning e espaçamentos letter/word. Segmentação por grafemas obtém ranges, agrupa linhas com y/altura compatíveis e usa as substrings correspondentes no canvas. As métricas width e fontBoundingBoxAscent/Descent devem concordar com as linhas DOM até 1 pixel CSS; o desenho usa a posição da linha relativa ao clip, baseline calculada pelo ascent e escala CSS. A/B/C usam exatamente esse clip e scale=css.

Canvas mede/desenha o texto segundo seu estado tipográfico; não oferece reprodução automática de layout DOM multilinha. Por isso a implementação precisa do agrupamento por ranges e da validação das métricas. [HTML Standard, Canvas text](https://html.spec.whatwg.org/multipage/canvas.html#text-styles).

O carregamento da fonte é exigido antes da referência. Multilinha e translação fracionária/DPR foram controlados; DPR aqui é alinhamento de raster, não zoom nativo. Escala 0.8 foi recusada por font-metrics-reference antes de capturar. Texto misto, transform textual, editável, direção/escrita/efeitos incompatíveis, seleção/highlight existente e fontes de pintura estrangeiras possuem recusas. O suporte aceito é HTML horizontal LTR, estático, com preenchimento sólido opaco e linhas reproduzíveis, incluindo o badge real. Não foi exigido suporte tipográfico universal.

## Atribuição e tolerâncias

A=C deve ser idêntico em RGBA. A/B usa alteração RGB; não se conta alfa como tinta independente. Cada pixel alterado deve estar na vizinhança 3×3 de alpha>0 da referência. Para ser contribuição, sua distância quadrática RGB à cor efetiva do alvo deve ser estritamente menor em A que em B. Cada núcleo alpha>=192 precisa de contribuição nessa vizinhança; cada grafema não vazio deve contribuir em seu retângulo. Há limite de 1.000.000 pixels CSS para a região.

Não há tolerância percentual para diferenças externas ou direção errada: qualquer ocorrência reprova. A margem de 1 pixel trata alinhamento/antialiasing; alpha>=192 define núcleo de referência, não contraste. A palavra final completamente coberta foi rejeitada por falta de contribuição e núcleos. Outro texto semelhante já visível não supriu a contribuição do alvo invisível. Retângulo de fundo e contribuição apenas em B têm contraprovas separadas.

O estado registra identidade, geometria, atributos, texto relevante, estilos e pseudoelementos dos elementos que intersectam a região, em quatro pontos. A restauração geométrica e a estabilidade da página se somam ao raster. Não há garantia para scripts arbitrários adulterando a observação, percepção humana, contraste, ação do usuário ou toda oclusão subglifo.

## Limpeza e custo estrutural

O finally remove o Highlight apenas se nome e objeto ainda correspondem ao recurso próprio; remove a folha apenas pela identidade. Não usa clear() nem restaura uma cópia antiga de toda a coleção. A prova de recursos alheios durante B confirmou esse comportamento. Handles são descartados, bitmaps são fechados e WeakSet<Page> é liberado; chamada simultânea/aninhada é recusada com concurrent-paint-probe. Não foram adicionados listeners nem clones pelo helper.

A comparação custa O(P+Q), onde P é a área do clip e Q soma as áreas dos retângulos de grafemas. Preparo e inspeção incluem grafemas, estilos, ancestrais e consultas DOM; quatro snapshots percorrem N elementos, mesmo quando poucos intersectam o clip. O custo depende do documento e do trabalho de layout do navegador. Memória é O(P+N+G), além de imagens e serialização, com G grafemas; o limite de P não limita N. Não se deve prometer O(P+G) para sobreposições arbitrárias.

Trade-off: o método melhora atribuição e evita efeitos de style/clones, mas exige três capturas e pode recusar tipografia ou páginas instáveis. Não há impacto novo em queries ou domínio financeiro. Eventual otimização deve reduzir trabalho/capturas redundantes somente preservando os gates, as contraprovas e o diagnóstico; não faz parte desta revisão.
