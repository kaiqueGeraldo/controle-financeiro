# Contrato delimitado do observador

Consumidor de produto: tests/e2e/milestone-remediation.integrated.spec.ts, caso SAN-E2-visual, motivo agregado “Custo ou avaliação indisponível” nas larguras360/768/1440. A contagem exata1, o texto esperado, preparação sintética e assertions permanecem intactos. Não existe novo consumidor de ação/foco. Os probes independentes também importam o helper e foram preservados.

| Propriedade | Evidência exigida | O que não se infere |
|---|---|---|
| Identidade | Locator estrito, mesmo elemento conectado, textContent.trim exato e estado repetido após captura | Texto semelhante, entidade deduzida apenas de pixels ou OCR |
| Caixa utilizável | DOMRange dos nós Text, inclusive display:contents; regiões positivas, inteiras no viewport e nos ancestrais com overflow | Uma caixa prova que seus glifos foram pintados |
| Estado visível | display/visibility/content-visibility/opacity e cor/preenchimento; também ancestrais de descendentes do alvo | Uma lista de estilos cobre todo mecanismo de composição |
| Cobertura | Amostras de hit test conservadoras mais contribuição de pintura por grafema não branco | Hit test é prova de pintura; pointer-events:none torna cobertura irrelevante |
| Pintura | Três capturas da mesma região: A1 normal, B só com preenchimento dos glifos mascarado, A2 restaurado. A1 e A2 idênticas e cada grafema com contribuição não nula em A1–B | Legibilidade humana universal, cor correta por OCR ou ausência de qualquer oclusão subpixel |
| Interação | Não comprovada pelo helper. Jornadas de ação devem exigir click/teclado/foco pelos seus contratos | Locator.isVisible, hit test ou pixels garantem actionability |

## Condições e tolerâncias

O helper mantém a assinatura textGeometry(locator, expectedText) e os campos ok/failures/text/rects/viewport. Acrescenta glyphs e, quando a medição é possível, paint com estabilidade, dimensões e contagem de pixels. Resultado desconhecido gera falha ou exceção; nunca vira sucesso.

O recorte é a união inteira das DOMRanges do texto exato, sem buscar “alguma cor” na tela. Intl.Segmenter agrupa acentos combinantes e os grafemas não brancos recebem suas próprias regiões. Uma região de no máximo1.000.000 pixels CSS limita memória/trabalho. Páginas em iframe e donos Text não HTML ficam fora do contrato atual e são rejeitados.

Capturas usam scale:css, animations:allow e caret:initial. Não há congelamento, fast-forward, sleep ou retry dentro do helper. Fontes ainda carregando e qualquer animação CSS/WAAPI em execução no documento resultam em falha conservadora; a animação não é avançada para satisfazer o observador. O expect.poll já existente no consumidor não foi mudado.

Somente -webkit-text-fill-color é temporariamente definido como transparent!important nos donos dos nós Text do alvo. A propriedade original/prioridade e a ausência original de style são restauradas em finally, inclusive em falha de captura, sem reescrever a folha CSS do produto nem alterar background/currentColor. Uma medição simultânea na mesma página não é aceita. Mudança de identidade/geometria/estado entre A1 e A2 impede sucesso.

A1 e A2 devem ter diferença zero nos canais RGBA: não se aceita imagem em movimento como prova. Na diferença A1–B, qualquer diferença de pelo menos1 nível em RGB conta como contribuição, exigida em cada região de grafema. Não se compara com uma imagem esperada de outra fonte/OS: antialiasing e rasterização são os da mesma página e da mesma sequência. O limiar comprova contribuição digital, não um patamar de contraste. Não existe snapshot visual para renovar.

Este recorte não mede toda a forma de cada glifo, não detecta toda cobertura parcial menor que um grafema e não estima percepção humana. Regiões de grafemas podem se sobrepor por ligaturas/arredondamento; a contagem não deve ser interpretada como segmentação OCR. O controle de cobertura parcial esconde uma palavra inteira e deve falhar. Uma página dinâmica que voltasse precisamente à mesma imagem em A1/A2 poderia violar a premissa de estabilidade entre capturas; o uso atual é um badge estático em ensaio controlado. Conteúdo gerado nos donos, fontes pendentes, animação e outras condições desconhecidas são recusados em vez de atestados.

Texto com imagens, SVG, strokes/shadows sem preenchimento, efeitos de composição não controlados ou novas necessidades de contraste exigem contrato próprio. Não se afirma auditoria geral de acessibilidade/contraste nem validação de zoom nativo.

## Escolha e custo

Acrescentar apenas outra regra de filter/estilo ou consultar mais pontos do hit test deixaria a cobertura sem eventos de ponteiro sem evidência de pintura. O diferencial controlado mede a contribuição do texto e rejeita os dois mecanismos confirmados sem dependência nova, raster de referência ou mudança de produto.

Custo: três capturas pequenas e comparação dos pixels, mais caro que a inspeção DOM. A soma prefixada permite contar contribuição em cada caixa em O(P+G+R), memória O(P), sendo P pixels do recorte, G grafemas/partes e R texto percorrido; geometria/estilos custam O(R×A) para A ancestrais, com três hits por caixa. Há chamadas de layout/estilo e IPC, deliberadamente limitadas ao consumidor visual dirigido; não usar este helper para grandes tabelas ou cada célula da aplicação.

Riscos: falsos negativos em páginas animadas ou efeitos fora do recorte, e perturbação temporária do preenchimento durante a medição. A restauração em finally tem controle específico com falha induzida; nenhuma ação financeira ocorre durante a máscara. Separar por página evita concorrência de escrita nesse estilo. Não há query nova, N+1, alteração de domínio ou de serviço financeiro.

A revisão independente deve confrontar este contrato com SAN-E2 e tentar invalidar a correção. Este documento não concede o aceite da revisão.
