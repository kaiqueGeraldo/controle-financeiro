# RR3-01/R1 — P2: pixels da intervenção são atribuídos ao alvo invisível

Estado aberto. Categoria C, observador; não é defeito de produto demonstrado. Local: text-geometry.ts, comparação RGB A1–B e soma dentro das caixas de grafema.

O algoritmo aceita qualquer diferença RGB entre A1 e B em cada caixa e exige A1=A2. Isso não distingue a contribuição do alvo de uma mudança de fundo ou de outro texto provocada pela máscara. A intervenção cria/retira o atributo style, observável por CSS estático; os dois contraexemplos satisfazem identidade, fontes carregadas, geometria, viewport e estabilidade exigidas pelo helper.

Reprodução mínima do primeiro controle:

~~~html
<style>
body { margin:20px; background:white; color:black }
.badge { display:flex; width:max-content; filter:opacity(0) }
#text { display:contents }
body:has(#text[style]) { background:black }
</style>
<div class="badge"><span id="text">Custo ou avaliação indisponível</span></div>
~~~

Chamar textGeometry com locator#text e o texto exato. Antes/depois, o alvo está invisível e a região205×17 é branca. Ao definir -webkit-text-fill-color na máscara, o seletor muda o fundo de B para preto. A restauração remove style e restaura o fundo branco. O helper aceita3485 pixels alterados como contribuição dos28 grafemas, embora nenhum venha do texto.

No segundo controle, um span irmão semelhante, com pointer-events:none e opacity0, fica visível apenas por body:has(#text[style]) .decoy{opacity:1}. O alvo permanece sempre filtrado. O helper aceita os1100 pixels desse outro elemento como contribuição do alvo.

| Controle | Pixels não brancos A1/B/A2 | A1=A2 | Resultado candidato | Esperado |
|---|---|---|---|---|
| Fundo acionado pela máscara |0/3485/0|sim|ok=true|rejeitar |
| Outro texto acionado pela máscara |0/1100/0|sim|ok=true|rejeitar |

independentes.mjs preserva os casos, assertions e capturas1/2/3; auditar-evidencias.mjs decodifica os PNGs com Sharp, confere igualdade dos pixels A1/A2 e a origem da diferença. Não se trata de erro incidental ou de expectativa financeira. A página volta ao HTML/estilos originais e o botão continua funcional. A mudança temporária produziu o falso resultado apesar da restauração correta.

A cláusula histórica sobre ciclos de uma página dinâmica não resolve este caso: não existe atualização externa. A regra CSS estática responde justamente à alteração que o helper realiza, violando a suposição de que somente os glifos mudam entre A1 e B. Também não se exige reconhecer visualmente todo texto ou avaliar percepção humana.

Próximo saneamento mínimo: preservar geometria, identidade, estabilidade e restauração; demonstrar que as diferenças atribuídas ao alvo são exclusivas da intervenção de preenchimento, ou recusar medições em que essa exclusividade não seja sustentada. Incluir estes dois negativos e os controles visíveis correspondentes, sem remover os antigos nem compensar por mais retries/timeouts. Uma simples mudança de limiar não distingue pixels de outro elemento.

O consumidor atual passou, e não há prova de CSS equivalente no produto. O alcance é a garantia do helper e a capacidade de seu gate detectar a ausência do texto esperado. Os dois mecanismos antigos ficam reconhecidos como saneados; o RR3-01 permanece aberto por este resíduo direto, sem relação causal com zoom.
