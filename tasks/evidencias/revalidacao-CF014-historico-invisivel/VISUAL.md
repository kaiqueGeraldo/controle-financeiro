# Inspeção visual e integridade de dados

Imagens abertas pelo revisor (não apenas geradas):

| Arquivo | Observação |
|---|---|
| Prova histórica revalidacao-residual-RF15/browser/artifacts/.../test-failed-1.png | RF15, cabeçalho legível, região inferior vazia; avaliação indisponível na fixture antiga |
| browser/playwright-clock-causal-final.png | RF15/posição80, ações visíveis, região inferior vazia após15s; JSON correlaciona IDs100–107 e opacity0 |
| browser/native-causal-final.png | Título/linhas15,14,13jan visíveis; não usar esta imagem para afirmar opacidade integral de ancestrais: modal estava em transição no JSON |
| browser/civil-delayed-loading.png | RF15, título/spinner visíveis durante GET real retido, loadingtrue/DOM0 |
| browser/civil-reload-interaction.png | RF15, últimos registros09/08jan, valores10 e área de compensações após rolagem/reload; último botão tem foco e hit-test aceitos |
| browser/review-original-operation.png | RF15 - Operação legível, data15/01/2027, Confirmar Operação totalmente no viewport e com foco |

Fonte de correlação: civil-harness.json registra fases loading/released/reopen/reload,
assetId000010, oito historyIds iguais ao GET, estilos/retângulos e interação.
review-original.json registra os mesmos oito IDs, retorno de foco, zero diálogos
após Escape e nenhum comando financeiro. Imagem do formulário não comprova
persistência de operação: nenhuma foi enviada, por desenho e exigência do pedido.

Traces manuais começam após login. Os scripts copiados abrem a prova histórica
somente para leitura; relatório extraído nesta pasta. Sanitização restrita a esta
pasta conserva hashes antes/depois; inspeção atual correlaciona HTTP/CSS e exige
zero JWT nos eventos. Originais de investigações anteriores não são modificados.
Arquivos zip/artifacts ficam locais fora de target, com hashes no manifesto;
JSON/logs e capturas desta revisão são versionados. Não houve upload externo.

Complemento final inspecionado: causal-settled/native-causal-settled.png e civil-date-only-causal-settled.png exibem título e linhas; civil-date-only-causal-interaction.png mostra últimos registros08/09jan. JSON settled confirma todos os ancestrais opacity1. Oito traces inspecionados; todos os históricos200, zero JWT nos eventos após sanitização.
