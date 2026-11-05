# Parecer independente A–E

## Escopo e decisão

Base 7f7f4ec6ec764b65d3a253391c14d52be5a6e0e9; candidato 0dbb67cc607e1f5b1b9881a24e039a0939facd46. Worktree C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-worktrees/pr3-expanded-source; branch codex/saneamento-pr3-expanded. HEAD e branch conferidos, base ancestral e estado inicial limpo. O delta possui 22 arquivos: cinco arquivos funcionais/de testes e 17 de documentação/provas. Consumidor, produto, backend, dependências, locks, tsconfig e CI não mudaram. Foi revisto esse delta, usando os probes anteriores como regressões.

## A. RR3-01 — encerrado com alcance

Os dois mecanismos originais (filtro ancestral e cobertura sem eventos de ponteiro) e os três falsos aceites de atribuição (presença de style mudando fundo; presença de style revelando outro texto; valor preexistente de style mudando fundo) foram rejeitados. Os alvos tinham identidade e geometria preparadas corretamente; os residuais chegaram às capturas e falharam por no-glyph-paint/ambiguous-glyph-paint. Controles equivalentes visíveis passaram.

O contrato comprovado é contribuição de preenchimento do texto HTML estático suportado, na região observada, com identidade exata, referência independente e controles de atribuição. Não há residual confirmado que justifique manter RR3-01 aberto nesse alcance. A decisão não afirma ausência total de defeitos nem amplia o contrato para tipografia ou percepção universais.

## B. Método — aceito no alcance demonstrado

O canvas usa o texto dos nós originais e estilos efetivos antes de A/B/C; a máscara não é inferida da diferença das screenshots. A referência não fornece sozinha causalidade. O aceite combina estabilidade A=C, intervenção no Range exato, estados da região, pixels próximos da silhueta, direção estrita de cor, cobertura dos núcleos e contribuição por grafema.

A API Highlight pode recolorir conteúdo e criar visibilidade durante a intervenção: a demonstração independente produziu 0/1395/0 pixels não brancos em A/B/C sem mudar o HTML. Portanto o simples uso da API não constitui prova do estado original. A intervenção transparente efetiva do helper rejeitou essa fixture, e a prova de direção com um único pixel invertido isolou a proteção contra pintura apenas em B. Os dois resultados são distintos.

Casos incompatíveis ou ambíguos retornam ok=false (incluindo status inconclusive quando o estágio de pintura é atingido), ou lançam erro sem aprovação. Fonte pendente, seleção parcial, API ausente, transformação com métricas incompatíveis, preenchimento misto e captura inválida foram controlados. Ver METODO.md.

## C. Restauração — aceita nos cenários suportados

Sucesso, erros nas capturas 1/2/3, timeout, PNG inválido, dimensões inválidas, remoção/substituição/clone, navegação e exclusão de chamadas concorrentes foram verificados. Não houve resíduo de Highlight privado, folha privada ou canvas conectado. Atributos/classes/estilos inline do alvo permaneceram iguais.

Folha adotada preexistente e Highlight/folha da página criados durante B conservaram identidade. Após remover apenas esses recursos da própria fixture, a observação seguinte passou. Documento destruído pode encerrar a chamada com exceção; não há promessa de recuperar o mesmo documento. O novo documento foi observado sem resíduo. Isso não serializa ações arbitrárias da aplicação durante a medição.

## D. Consumidores — aceitos no recorte atual

SAN-E2 exigiu exatamente um texto e ok=true em 360×900, 768×900 e 1440×900. Os três recibos adicionais também foram painted, sem falhas, pixels externos, direção errada ou núcleos sem contribuição. Capturas inspecionadas nas três larguras mostram o motivo completo associado ao estado de avaliação desconhecida.

O probe real original confirmou baseline/restauração aceitos e filtro/cobertura rejeitados, apesar de isVisible=true. Após reload, a mesma entidade RVLIVE tinha quantidade 10, custo 200 e avaliação null. Ambos os wrappers e ambos os casos Playwright passaram, sem falha prévia de cadastro/sessão nesta execução.

O helper não substitui interação, foco, contraste ou persistência. O consumidor preserva seu gate explícito ok=true; outros contratos continuam separados. Altura 900 nas três larguras é o contrato atual SAN-E2 e não a matriz integral de acessibilidade.

## E. Zoom/expanded — pendências preservadas

Capacidade C; zoom nativo não executado. Dois cenários obrigatórios e AC-UI-001/CF010/CF015 permanecem pendentes. Nenhuma nova capacidade foi identificada e nenhuma tentativa/substituição por viewport, CSS zoom ou deviceScaleFactor foi feita.

RR3-01 encerrado não certifica expanded integral nem libera merge. Próximo passo: obter capacidade de zoom nativo e executar os dois cenários pelos critérios existentes; depois reconciliar a matriz expanded e os gates restantes em lote autorizado. Sem correções de implementação, push, PR, CI remota, merge, hospedagem, deploy ou banco real nesta revisão.
