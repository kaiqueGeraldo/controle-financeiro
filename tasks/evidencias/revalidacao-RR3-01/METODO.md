# Três capturas, restauração e custo

A1 mede o recorte normal; B usa a mesma união de DOMRanges, com preenchimento dos donos Text em transparent!important; A2 vem após restaurar a propriedade. O helper não muda background/currentColor diretamente, mas o atributo inline que cria é observável por regras CSS. Esse efeito indireto é a causa de RR3-01/R1.

Região: floor dos mínimos x/y, ceil dos máximos. Screenshot scale:css normaliza pixels de dispositivo; largura/altura decodificadas precisam coincidir com o recorte CSS. A verificação passou emDPR1 e2, deslocamento fracionário, quebra de linha e rolagem. Isso não certifica transform arbitrário, iframe, SVG ou zoom nativo. Frames e donos não HTML são recusados. A geometria inclui as verificações de viewport/clipping e amostras de hit test herdadas; nenhuma caixa isolada prova pintura.

Comparação: zero diferença RGBA entre A1/A2; diferença de pelo menos1 em qualquer canal RGB A1/B conta. A soma prefixada conta esses pixels em cada caixa de grafema. Há contribuição exigida por grafema não branco, mas regiões se sobrepõem por ligaturas/arredondamento e não são máscaras do contorno real dos glifos. Não há OCR, patamar de contraste ou direção causal da mudança. A falha nova comprova que os pixels podem vir do fundo/outro elemento.

Variação: fontes loading são recusadas antes de qualquer screenshot e o controle volta a funcionar com fallback após abortar a fonte sintética. Animação em execução é recusada; a iniciada na captura intermediária provocou text-state-changed e permaneceu running no relógio nativo. Mudança de texto, substituição, deslocamento e diferença A1/A2 não relacionada foram recusados. O helper não congela timers, adianta animações, acrescenta retry ou oculta caret (caret:initial). O consumidor atual é badge estático não editável; não se declara robustez universal contra ciclos de caret/conteúdo que voltem aos mesmos pixels nos extremos.

Restauração demonstrada:
- propriedade ausente e ausência do atributo style, style vazio, valor/prioridade!important, outras declarações e preenchimento herdado;
- exceção na captura1 (antes da máscara),2 (com máscara) e3 (já restaurada);
- timeout real de1ms apenas na captura2 do teste de falha, com restauração e nova chamada positiva/ação depois;
- remoção do elemento: dono retido é restaurado e estado desconectado é rejeitado;
- navegação: execução antiga lança erro; o documento destruído não é recuperável. Documento novo sem estilo residual aceita nova medição;
- nó novo normal na mesma posição: medição antiga rejeita, dono antigo restaurado, alvo novo sem máscara e nova medição/ação funcionais;
- helper aninhado na mesma Page é recusado por concurrent-paint-probe, sem interferir no externo.

O caso inicial element-replaced usa cloneNode(true): sua assertion de restauração examina somente o dono retido, não certifica o novo clone que copia estilos transitórios. Essa limitação do próprio controle foi preservada e delimitada; fresh-element-replacement verifica o caso normal de substituição e continuidade no DOM ativo. Não se reivindica restaurar cópias criadas por operação concorrente ou preservar atualizações externas na mesma propriedade durante a máscara. São necessárias exclusão por página e premissa de estado controlado; o consumidor usa awaits sequenciais e não realiza ação financeira durante a medição.

Tempo observado em uma invocação local com gravação/hash de PNGs e preparação Maven concorrente:8 chamadas legítimas completas, mínimo161,08ms, mediana195,39ms, máximo300,75ms. Inclui a instrumentação da revisão; não isola o tempo do helper nem compara desempenho com o observador antigo. Os24 testes do candidato terminaram em6,35s. Tempo de wrapper inclui backend, browser e BFF, não pode ser atribuído integralmente ao helper.

São3 capturas por medição completa. O consumidor chama pelo menos2 vezes por largura (poll aprovado e coleta JSON),6 chamadas e18 capturas em360/768/1440; tentativas anteriores do poll podem acrescentar chamadas. No360, recorte aproximado216×18=3888pixels CSS,28 grafemas. Não medimos RSS ou toda memória do browser. Os três buffers RGBA e prefixo usam aproximadamente16P bytes, cerca de62KB nesse recorte, além de PNGs, cópias/serialização IPC, canvas, bitmaps e metadados. O cap1.000.000pixels limita a região, não a memória total do processo.

Modelo de custo: comparação O(P+G), inspeção/travessia/layout O(R×A+G) nas operações explícitas, com P pixels, G partes de grafemas, R nós de texto e A ancestrais; custos internos de layout/browser e IPC não são prometidos por essa notação. Não há query nova, N+1, domínio financeiro ou concorrência de banco alterados. Não houve regressão concreta de custo que justificasse otimização ou prazo maior; o problema demonstrado é correção da atribuição de pintura.
