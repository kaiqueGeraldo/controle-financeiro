# Revalidação complementar independente — 02/11/2026

**RR3-01 permanece aberto, P2, por atribuição indevida de pixels ao texto. Os dois mecanismos originais estão corrigidos no recorte testado.** Esta rodada confirma a conclusão anterior com execuções novas e um controle adicional que reage ao valor do estilo temporário, mesmo quando o atributo style já existia.

Intervalo revisado: c38679933551487e49086e65715243768cba4e44..155b249d475faa3741b31c9eeaa732b08b5cdbe9. A worktree já estava em8f52b2078bdf8e515dd118c874ff649464182365, com dois commits anteriores exclusivamente documentais/provas. Eles foram preservados. Equivalência dos fontes de backend/frontend/.github/docs normativos entre155b249d e o checkout inicial foi conferida; o candidato não foi trocado pelo HEAD documental. Todas as novas saídas pertencem ao runtime revalidacao-rr3-01-02.

## A. RR3-01

geometry.mjs original passou10/10 com o candidato; filter:opacity(0) ancestral e cobertura pointer-events:none foram recusados por no-glyph-paint. O observador antigo, recolocado somente em s/f, reproduziu os dois falsos aceites no estático e no badge real. O candidato foi restaurado por SHA52bf34a08d93ee8a8ecc61805e8b2c97cf58a2555b2b417532e80cd752349dae; estático10/10 e probe real original passaram após a restauração. A abertura atual não decorre de zoom.

O resíduo RR3-01/R1 foi reproduzido em duas condições da revisão anterior: a máscara cria style e CSS estático muda o fundo ou revela outro texto apenas emB. O complemento novo usa style preexistente e seletor que reage à presença de -webkit-text-fill-color em seu valor. O alvo permanece filtrado em todas as capturas; A1/A2 têm zero pixels não brancos, B tem3485 pixels pretos de fundo. Mesmo assim todos os28 grafemas recebem contagem positiva e ok=true. A página retorna ao HTML original e seu botão continua funcional.

É um defeito da atribuição causal da intervenção, localizado em support/text-geometry.ts:126–140, não uma exigência de percepção humana universal. O algoritmo interpreta qualquer diferença A1–B dentro das caixas como contribuição dos glifos. A igualdade A1=A2 não afasta mudanças intermediárias causadas pela própria máscara. Não foi encontrada regra equivalente em src que demonstre um defeito de produto.

Próximo saneamento mínimo: demonstrar exclusividade do sinal atribuído ao preenchimento do alvo ou recusar medições nas quais essa exclusividade não seja sustentada. Preservar os dois negativos antigos, os efeitos de fundo/outro texto e o controle com style preexistente, além dos positivos, restauração e consumidor. Não alterar produto ou limiares para aceitar o falso resultado. Nenhuma correção foi implementada nesta revisão.

## B. Método e restauração

Parcialmente aceito. Estão demonstrados texto exato/elemento conectado, caixas e regiões por grafema, alinhamento nos controles de scroll/DPR/translação fracionária/quebra de linha, igualdade dos extremos e restauração dos donos salvos. Não está demonstrado que toda diferença medida pertença aos glifos esperados.

Restauração passou para propriedade ausente, style ausente/vazio, valor!important, herança, outras declarações, erros nas capturas1/2/3, timeout de captura, remoção, navegação e substituição por nó novo normal. Chamadas aninhadas na mesma Page são recusadas; o consumidor é sequencial. Documento destruído não é restaurado e a chamada lança erro; o novo documento é verificado sem máscara. Clonar um nó enquanto ele está mascarado pode copiar o estilo transitório para um novo dono: esse caso não está incluído no aceite de restauração.

Fontes pendentes, alteração de texto/geometria, animação em andamento e diferença A1/A2 foram recusadas nos controles. O método não certifica caret editável, contraste, toda oclusão subglifo, interação ou acessibilidade completa. Ver [método e custo](METODO-E-CUSTO.md).

## C. Consumidores

SAN-E2-visual original passou em360/768/1440×900, com contagem1, texto exato, rolagem e screenshots inspecionados. O probe real original restaurado passou e manteve, após reload, RVLIVE/quantidade10/custo200/avaliaçãonull. O consumidor é aceito na fixture efetivamente executada; isso não transforma o helper em garantia geral de legibilidade.

A primeira invocação do probe real falhou no cadastro antes de chamar textGeometry: URL /auth?modo=cadastro não mudou dentro dos15000ms existentes. O trace tem cadastro/login e leituras200, mas a causa da navegação não foi estabelecida. Essa falha e seus brutos permanecem; não é falha de pintura nem teste verde. O controle pós-restauração já previsto na contraprova foi executado com o original intacto. Não houve retry adicional, aumento de prazo ou alteração da preparação para ocultar a ocorrência.

## D. Zoom

Não executado; capacidade C preservada. Nenhuma ferramenta nativa foi acionada ou abordagem recusada repetida. AC-UI-001/CF010/CF015 e os dois cenários nativos continuam obrigatórios e pendentes. DPR2 foi usado somente no controle de coordenadas; não é zoom nativo nem substituto dele.

## E. Expanded e PR #3

Integral não executada/certificada. Falta sanear a atribuição de pintura e, separadamente, obter capacidade nativa segura e cumprir seus critérios. Aceites anteriores de cobertura/reserva, SAN-D1, RF15, CF023 app-ready/HTTPS/sessões, CF014/isolation e investimentos/precisão/UI04 conservam seu alcance. Não foram repetidas suítes financeiras completas nem alterados seleção/gates.

A reprovação remota registrada permanece sem nova execução neste lote; não houve consulta remota para atribuir status atual a outro SHA. A revisão não libera merge da PR #3, publicação ou produção. [Matriz e testes](MATRIZ-E-TESTES.md), [preservação e prontidão](PRESERVACAO-E-PRONTIDAO.md).
