# Decisão antes da implementação — RR3-01 atribuição v2

Base efetiva7f7f4ec6ec764b65d3a253391c14d52be5a6e0e9, branch codex/saneamento-pr3-expanded. Desde155b249d existem somente33 arquivos de provas/documentação; helper ainda SHA52bf34a08d93ee8a8ecc61805e8b2c97cf58a2555b2b417532e80cd752349dae. Nenhum saneamento posterior de implementação encontrado.

Propriedade: no badge HTML estático do consumidor SAN-E2, demonstrar contribuição do preenchimento do texto exato dentro de suas DOMRanges, com geometria utilizável e estado consistente. Não certificar percepção humana universal, contraste, ação ou zoom.

Violação atual: a diferença A1–B é usada simultaneamente como sinal e como máscara de glifos. O atributo style escrito pelo helper pode disparar CSS e mudar fundo/outro conteúdo. Extremos A1=A2 não asseguram atribuição.

Escolha: conservar três capturas e substituir a intervenção inline por um CSS Custom Highlight limitado às Ranges exatas, com stylesheet construída/adotada e nome privado. Não inserir elemento style, atributos, classes ou wrappers. Remover apenas o highlight e a sheet próprios em finally; nunca limpar registros de terceiros. A API permite [estilizar ranges sem mudar a estrutura DOM](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/highlight-text-ranges). O protótipo registrou máscara efetiva para preenchimento normal/important e translação fracionária.

Evidência independente: renderizar em canvas destacado, antes da intervenção, o texto/linhas e a fonte resolvida do alvo; produzir silhueta e núcleos dos glifos. Não derivar essa máscara de A1–B. Exigir que a contribuição real esteja na silhueta com margem geométrica fixa de1pixelCSS, aproxime a cor de preenchimento esperada e cubra os núcleos por grafema. Nenhuma diferença de fundo ou texto adicionado somente emB pode valer como contribuição na direção esperada. Capturas e geometria continuam estáveis; observar também identidade/estilos pintáveis dos elementos relevantes no recorte.

Suporte delimitado: Chromium com Highlights/Canvas, HTML horizontal LTR, fonte carregada, preenchimento sólido opaco, texto comum com linhas e métricas reproduzíveis em canvas. Caso sem referência confiável, animação ativa, renderizador incompatível, fonte/métricas divergentes, estado/layout alterado ou atribuição ambígua retorna ok=false com diagnóstico inconclusivo; nunca vira sucesso. Positivos reais, fundos legítimos, multilinha e estilos importantes/herdados devem passar. Não há mudança de produto.

Custo previsto: três screenshots, rasterização independente pequena, comparação O(P+G) e inspeção dos elementos que interceptam a região, memória O(P+N) mais custo dos buffers/IPC. Medir duração, captura/processamento e memória do processo de teste sem atribuí-la ao browser inteiro. Não aumentar timeout/retry.

Provas antes: independentes.mjs intacto reproduziu os dois efeitos de style (fundo/outro texto); atribuicao.mjs da segunda rodada reproduziu a reação ao valor com atributo preexistente. Os primeiros dois têm a mesma condição nova de CSS observando presença do atributo; o terceiro acrescenta que conservar a presença não basta. Baselines visíveis e negativos sem reação distinguem o mecanismo. Os originais, suas assertions e manifest1053 permanecem intactos.

Contraprovas previstas: observador anterior somente na cópia, vermelhos de atribuição, restauração por SHA e controles v2. Mutação dirigida da garantia de silhueta independente deve permitir sinal retangular alheio e ser detectada por expected próprio, sem adaptar o expected à implementação. Revisão independente fica restrita ao novo delta e caminhos compartilhados afetados.
