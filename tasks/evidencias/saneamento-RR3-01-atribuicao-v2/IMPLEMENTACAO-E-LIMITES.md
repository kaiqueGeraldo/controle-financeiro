# Implementação e garantia delimitada

Base corrigida7f7f4ec6ec764b65d3a253391c14d52be5a6e0e9. A comparação desde155b249d confirmou33 arquivos exclusivamente de provas/documentação e o helper antigo SHA52bf34a0. Nenhum saneamento de implementação posterior foi encontrado.

Arquivos realmente alterados:
- tests/e2e/support/text-geometry.ts: mantém identidade/geometria, coordena referência, intervenção, estabilidade e classificação da pintura;
- tests/e2e/support/text-paint.mjs: referência de glifos, CSS Custom Highlight, observação de estado, restauração e comparação;
- tests/e2e/support/text-paint.d.mts: contrato tipado do módulo compartilhado entre Playwright/TypeScript e os probes Node nativos;
- tests/e2e/text-paint.observer.spec.ts:18 controles novos;
- tests/e2e/playwright.text-geometry.config.ts: acrescenta os18 aos24 existentes, mantendo15000ms e retries0.

O módulo ES explícito permite que os probes Node importem o mesmo código sem habilitar allowImportingTsExtensions no produto. Pacotes, lockfile e tsconfig permanecem intactos. O consumidor milestone-remediation.integrated.spec.ts também permanece intacto: texto exato, count1, scroll e larguras360/768/1440 continuam exigidos.

## Por que o falso aceite deixa de ocorrer

A implementação antiga criava/modificava style para tornar o preenchimento transparente. CSS podia reagir à presença ou ao valor do atributo e pintar fundo/outro texto apenas emB. A diferença contaminada também definia os próprios pixels aceitos como glifos.

A nova intervenção usa Highlight das Ranges exatas e uma CSSStyleSheet construída/adotada com nome privado. Não insere style/wrapper no DOM nem escreve atributos/classes/propriedades inline. A regra contém somente propriedades de pintura do highlight: preenchimento/color transparentes, background transparente e text-shadow none. Os casos que observam style não são disparados. A prova não depende só disso: a referência de glifos é renderizada antes da intervenção, em canvas destacado, a partir do texto, fonte resolvida, linhas e coordenadas do alvo.

Aceitar exige conjuntamente:
1. Identidade/elemento conectado, texto esperado, geometria e estados prévios válidos, como no contrato anterior.
2. Referência independente com fonte carregada, preenchimento opaco, métricas coerentes e núcleo de tinta. A silhueta vem da rasterização do texto, nunca de A1–B.
3. Mesma região nas capturas A1/B/A2, escala CSS e zero diferença RGBA entre os extremos.
4. Todo pixel que mudou está na silhueta independente ou em sua vizinhança de1pixelCSS. A cor de A1 deve ficar estritamente mais próxima do preenchimento esperado que a cor deB, em distância quadrática RGB.
5. Cada núcleo de referência encontra contribuição válida na vizinhança e cada grafema não branco possui contribuição. Campos pintáveis/identidade/atributos e interseções geométricas observados na região permanecem consistentes.
6. Highlight e stylesheet privados foram removidos. Um resultado desconhecido permanece ok=false, não satisfaz o expect.poll do consumidor.

Assim o fundo retangular é recusado por localização e direção; texto revelado apenas emB tem direção incompatível; outro texto já visível na região não substitui a contribuição do alvo. Este último controle tem texto visível nas três imagens idênticas e changedPixels0, e é rejeitado. Não há aumento de limiar para acomodar as fixtures.

## Tolerâncias e pressupostos

Referência: alpha>0 delimita tinta; alpha>=192 delimita núcleo, não contraste humano. Margem de1pixelCSS cobre rasterização/antialiasing e alinhamento de DOM/canvas; diferença de largura/altura das métricas superior a1pixel impede a referência. O protótipo registrou diferenças de intensidade de até98 entre as duas rasterizações, sem tinta fora dessa vizinhança; não se compararam cores com uma tolerância ajustada às fixtures. O algoritmo exige direção RGB, suporte espacial, núcleos e contribuição por grafema.

Suporte: HTML horizontal LTR, texto comum estático com fonte carregada, preenchimento sólido opaco e layout de linhas reproduzível em canvas, incluindo os estilos reais do badge. Fundos uniformes/gradientes, importante/herança, multiline, translação fracionária, scroll e DPR de alinhamento foram controlados.

Inconclusivos incluem fonte/métricas sem referência confiável, texto editável, seleção/highlight existente, preenchimento não opaco/misto, escrita/direção/efeitos não suportados, mídia estrangeira interceptando a região, background porURL nos ancestrais, animação ativa, estado/layout alterado ou contribuição ambígua. Há failures específicos e campos de referência/pintura; o consumidor exige ok=true. Nos probes, as três imagens e estados são preservados; o teste novo anexa também a máscara independente.

A garantia é contribuição de preenchimento no contrato estático controlado. Não certifica percepção humana universal, OCR, contraste, interação, toda cobertura subglifo, transform arbitrário, acessibilidade integral ou execução Linux. Os campos pintáveis examinados e estabilidade detectam alterações observadas; não se oferece garantia para scripts arbitrários que adulterem a observação.

## Restauração e concorrência

Como nenhum atributo/style/class é escrito, não há reconstrução aproximada do valor original nem máscara inline que cloneNode possa copiar. A referência canvas não entra na árvore DOM. Remoção do elemento ou substituição por clone resulta em falha da observação e remoção dos recursos privados; o clone permanece com o HTML original e aceita a observação seguinte.

finally remove somente o Highlight próprio, por nome/identidade, e a stylesheet própria, por identidade, preservando registros/sheets alheios. Não há CSS.highlights.clear(). Valores!important, herança, ausência/style vazio/classes/atributos continuam iguais. Sucesso, exceção, timeout, capturas1/2/3 interrompidas, remoção, clone, novo elemento e navegação foram controlados. Documento destruído encerra a chamada com erro e não é recuperado; o novo documento é observado sem resíduos.

Chamadas aninhadas na mesma Page são recusadas pela exclusão existente. A premissa dos consumidores é execução sequencial sem ações financeiras durante a medição. Mudança externa detectada resulta em inconclusivo; não se promete serializar operações arbitrárias do produto.
