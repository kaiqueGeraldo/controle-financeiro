# Garantias, perturbação e custo

A1 captura a união inteira das DOMRanges do texto exato no estado normal. B usa o mesmo recorte com -webkit-text-fill-color:transparent!important nos donos dos nós Text. A2 ocorre após restaurar a propriedade. O helper compara dimensões CSS, exige zero diferença RGBA A1/A2 e conta qualquer diferença RGB A1/B nas caixas de cada grafema não branco. O limiar é1 nível em qualquer canal e contribuição positiva por região; não existe snapshot esperado de outra máquina.

As regiões ligam o recorte ao elemento/texto esperados, mas não ligam a origem de toda diferença a esse preenchimento. A propriedade inline é observável por CSS. Três capturas podem satisfazer todas as verificações e representar fundo ou outro texto que só muda duranteB.

O novo controle atribuicao.mjs usa o atributo style já existente. A regra estática é:
~~~css
.badge { filter: opacity(0) }
body:has(#text[style*="-webkit-text-fill-color"]) { background: black }
~~~
A1/A2: fundo branco e alvo invisível. B: o alvo continua invisível e o fundo fica preto. O resultado ok=true atribui3485 pixels pretos a28 grafemas. Os PNGs foram decodificados com Sharp; os hashes RGBA A1/A2 são iguais. Capturas inspecionadas confirmam o recorte branco/preto e o consumidor normal com seu texto vermelho. Os testes positivos com fundo legítimo e negativo invisível sem reação CSS distinguem esse falso aceite de um problema geral da execução.

O resultado demonstra os limites da intervenção A/B/A. Não certifica exclusividade da contribuição, contraste, reconhecimento OCR, forma completa de cada glifo ou ausência de toda cobertura parcial. Regiões podem se sobrepor por ligaturas/arredondamento. Não se exige visão computacional universal; requer-se que os pixels atribuídos ao texto não sejam de outro objeto induzido pela própria medição.

## Alinhamento e variação

Scroll, translação fracionária, quebra de linha e DPR2 passaram nos controles de coordenadas. Screenshot scale:css produz dimensões compatíveis com o recorte DOM, arredondado por floor/ceil. Isso não certifica transform arbitrário, iframe/SVG ou zoom nativo. O consumidor tem viewport altura900; não se afirma que ele sozinho certifica AC-UI-001 inteiro.

Fontes loading são recusadas antes de capturar. Animação nativa running é recusada; a iniciada duranteB resulta em inconsistência e permanece em execução, sem fast-forward. Texto/geometria alterados e diferenças não relacionadas entre A1/A2 são recusados. Uma mudança que só exista emB pode escapar: os negativos confirmados são CSS estático, sem timer, fonte pendente, caret ou atualização externa.

caret:initial não oculta o cursor. O badge atual não é editável/focado; não há garantia contra toda variação de caret em outros consumidores. Leitura funcional, foco e ação são propriedades complementares; o helper não as certifica. As ações dos botões de continuidade nos controles próprios foram exigidas separadamente.

## Restauração e concorrência

Valores inline e prioridade!important, ausência de propriedade/style, style vazio, outras declarações e herança foram conferidos. Sucesso, exceção nas capturas1/2/3, timeout de captura2, remoção do alvo, navegação e substituição por nó novo normal foram exercitados. O dono retido é restaurado mesmo se removido. Na navegação, o contexto destruído lança erro; a página nova aceita uma nova observação sem máscara residual.

O controle element-replaced usa cloneNode(true) e sua verificação examina o dono antigo. Um clone pode copiar a máscara para um novo nó; esse controle não certifica restauração de toda a página ativa. O complemento fresh-element-replacement cria um nó novo sem copiar a máscara e exige continuidade. Preservaram-se ambos e suas limitações. Não se aceita restaurar cópias externas, documentos destruídos ou escrita concorrente na mesma propriedade como garantia universal.

A WeakSet por Page recusa helper aninhado enquanto outro mede. O consumidor faz awaits sequenciais e nenhuma ação financeira durante a máscara. Essa compatibilidade foi verificada; não se reivindica suporte a operações concorrentes arbitrárias.

## Custo observado

Oito chamadas legítimas completas dos controles independentes: mínimo138,44ms, mediana164,21ms, máximo201,59ms. Incluem gravação/hash de PNGs e foram executadas sequencialmente após Maven. Não são benchmark comparativo nem medida isolada de CPU do helper. O complemento novo, com decodificação Sharp dentro da instrumentação, mede outro custo e não foi misturado nessa distribuição.

São três capturas por chamada completa. SAN-E2 faz ao menos duas chamadas por largura: poll aprovado e coleta JSON; seis chamadas/18 capturas no caminho normal. Polls anteriores podem acrescentar trabalho. O recorte360 é aproximadamente216×18=3888pixels CSS; três buffers RGBA e prefixo somam aproximadamente16P bytes, cerca de62kB mais bordas do prefixo. PNGs, arrays/serialização, canvas, bitmaps e DOM acrescentam memória. O limite1.000.000pixels não é limite total de RSS.

A memória registrada pelo complemento é somente a do processo Node instrumentado; não mede RSS do navegador/JVM nem separa a contribuição do helper. A comparação custa O(P+G), com P pixels e G partes de grafema; a varredura explícita inclui C unidades de texto e R nós por A ancestrais: O(C+R×A+G). Layout, estilo do navegador e IPC têm custos internos adicionais. Não houve custo desproporcional ou regressão concreta que justifique otimização antecipada ou aumento de prazo. O defeito demonstrado é de correção da atribuição; não há query, N+1 ou domínio financeiro alterado.
