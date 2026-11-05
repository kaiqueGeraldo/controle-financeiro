# Provas, contraprovas e custo

Todos os resultados atuais se referem ao saneamento novo, com brutos próprios em rr3-01-atribuicao-v2-01. Não são revalidação expanded ou aceite independente.

| Prova | Resultado | Alcance |
|---|---|---|
| Antes: independentes.mjs intacto |21 condições,2 falsos aceites | Fundo/outro texto reagem à criação de style; não houve cadastro/sessão |
| Antes: atribuicao.mjs intacto da segunda rodada |3 condições,1 falso aceite | Reação ao valor de style preexistente |
| Depois final: geometry.mjs intacto |10/10 | Filter ancestral, overlay pointerless e identidade errada recusados; visível aceito |
| Depois final: independentes.mjs |21/21 | Originais residuais, alinhamento, interrupções e positivos preservados |
| Depois final: atribuicao.mjs |3/3 | O falso aceite mais recente foi eliminado |
| Complementos intactos |4/4 | Fonte pendente, timeout/continuidade, novo elemento e animação tardia |
| Suíte do helper |42/42 |24 originais inalterados+18 novos, zero skips/flaky/retries |
| Controles finais após normalizar EOF |8/8 | Negativos de atribuição, positivo e contrato raster |
| Jornada real/consumidor final |2/2 JUnit,1 Playwright em cada |360/768/1440 e reload/API/PG com10/200/null |
| CI/tipagem/lint |32/32 e saídas0 | Cinco arquivos lint sem avisos; gates intactos |
| Vizinho já visível |Rejeitado | A1=B=A2 com texto alheio visível, alvo filtrado e contribuição0 |

Os dois testes reais também passaram numa invocação de desenvolvimento anterior à modularização ES; não são quatro requisitos novos. O consumidor continua com height900 no recorte existente, sem declarar AC-UI-001 inteiro ou zoom. Nenhuma jornada falhou no cadastro nesta execução. A falha de entrada da revisão anterior permanece no runtime/parecer antigo, sem descarte ou reinterpretação.

As reproduções são relacionadas, mas distintas: fundo e outro texto observando presença de style exercitam alterações colaterais diferentes; a condição de valor com atributo preexistente impede considerar apenas a preservação da presença uma solução. Todos os probes originais mantêm assertions e bytes. Só foi acrescentada a cópia operacional do módulo compartilhado nas etapas estáticas, pois o helper agora o importa; não houve edição dos probes.

## Contraprovas causais

Na cópia counterproof/s/f, o observador anterior SHA52bf34a08d93ee8a8ecc61805e8b2c97cf58a2555b2b417532e80cd752349dae voltou a produzir os mesmos2+1 falsos aceites. O candidato foi restaurado por hash; cinco controles focados passaram. A cópia da implementação não alterou o fonte da worktree.

Contraprova da garantia central: desativou-se somente a verificação de suporte espacial da silhueta independente em text-paint.mjs. O controle manual8×8 tem máscara de núcleo único; uma mudança retangular tem55 pixels fora da vizinhança3×3. O mutante retorna0 em vez de55 e reprova o teste. Módulo restaurado por SHA5527fcba9bef9376d467359e662b1662b8e8c8892d77114b199ec3611fa20d6e, seguido de três controles raster aprovados. Os expected vêm de condições geométricas/sintéticas explícitas, não da fórmula nova.

Foi removida uma linha vazia extra no EOF do wrapper após as provas, sem mudança de código/assertion. RESULTADOS distingue o hash executado do hash final e verifica igualdade do conteúdo por trimEnd; os oito controles finais usam os bytes entregues. O módulo de atribuição mantém bytes exatos entre a jornada final, a restauração e a entrega.

## Desenvolvimento preservado

O primeiro protótipo teve erros locais de sintaxe JavaScript antes da execução. A primeira versão do helper usou crypto.randomUUID em contexto about:blank sem essa API;13/24 passaram e11 falharam por essa implementação, preservados em first-controls. Corrigiu-se o identificador para getRandomValues, sem alterar critérios; depois24/24 passaram. O primeiro filtro ^v2 selecionou zero testes; foi corrigido para v2 e os16 controles então existentes passaram. Após dois controles conservadores adicionais,42/42 passaram.

A importação com extensão.ts foi recusada pelo TypeScript; o módulo.mjs e sua declaração.d.mts resolveram o compartilhamento sem mudar tsconfig/pacotes. Protótipos, conversão de desenvolvimento e fontes intermediários foram arquivados por SHA no runtime; os scripts canônicos desta pasta usam os arquivos finais. Essas falhas não contam como reprovação causal do observador anterior nem como testes aprovados.

## Custo medido

Cinco observações em badge controlado Arial14/fundo gradiente:15 capturas, mínimo165,67ms, mediana178,53ms, máximo316,44ms. cost.json registra tempo de screenshot e tempo fora dele, incluindo rasterização, snapshots de estilo, IPC e instrumentação CDP. Não mede CPU pura nem é benchmark comparativo do produto.

Memória máxima amostrada do processo Node:RSS190,7MB, heap86,3MB; heapJS do renderer3,59MB. São valores dos processos instrumentados com suas bibliotecas, não alocação exclusiva do helper, pico garantido ou RSS total do browser/JVM/GPU. As amostras antes/ao redor/depois estão no recibo.

O consumidor faz ao menos seis observações completas/18 screenshots em três larguras. Seus tempos Playwright incluem preparo/auth/BFF e não são atribuídos integralmente ao helper. O módulo percorre P pixels, C unidades de texto, N elementos e Q pixels somados nas caixas de grafemas: O(P+Q+C+N) nas operações explícitas, mais custo interno de estilo/layout/captura e contagem por ancestrais da geometria. Em texto horizontal corrente Q é próximo deP; não se promete O(P+G) para caixas arbitrariamente sobrepostas. Memória principal é O(P+N), além de PNGs/arrays/IPC/canvas. A decisão previa contagem O(P+G); a implementação usou varredura simples das caixas, proporcional aos recortes pequenos observados.

Não houve regressão concreta de custo que exigisse otimização antecipada ou aumento de prazos. Não há queries novas, N+1, mudança de domínio ou de concorrência de banco.
