# Matriz e execução desta rodada

| Prova nova | Resultado | Decisão |
|---|---|---|
| geometry.mjs candidato |10/10 | Originais corrigidos por pintura |
| candidate-live: probe original |1 JUnit falho, sem observações de geometria | Pré-condição de cadastro não cumprida; não prova RR3 |
| candidate-live: consumidor |1 JUnit/Playwright aprovado |360/768/1440, assertions originais |
| Antigo isolado: estático |2 falsos aceites em10 | Vermelho causal esperado |
| Antigo isolado: real |2 soft assertions,1 JUnit/Playwright falho | Vermelho causal esperado; dados após reload intactos |
| Restaurado: estático |10/10 | SHA do candidato conferido |
| Restaurado: real |1 JUnit/Playwright aprovado | Dois negativos originais recusados, baseline/restored aceitos |
| Controles do candidato |24/24 |19 casos básicos+5 especiais; não contar suas assertions internas como novos casos |
| Independentes anteriores reexecutados |21 condições:19 esperadas,2 falsos aceites | Fundo e outro texto reagem à criação de style |
| Complementos reexecutados |4/4 | Fonte pendente, timeout/continuidade, nó novo normal e animação tardia |
| Novo controle de atribuição |3 condições:2 esperadas,1 falso aceite | Reação ao valor de style preexistente; mesmo resíduo |
| CI |32/32,0 skip | ci/required/suites/sanitize |
| Tipagem/lint |Saída0; lint sem avisos | Três fontes de teste do candidato |

São3 invocações Maven com4 casos JUnit por sobreposição dos wrappers; Playwright é interno e não é somado. Há3 invocações estáticas originais. Os24,21,4 e3 grupos possuem controles equivalentes entre si; não devem ser somados como requisitos distintos. Os88 JUnit históricos não foram reexecutados nem chamados de expanded.

Os oito recibos do saneamento e suas saídas foram reconferidos por SHA pelo utilitário anterior intacto; não contam como execução nova. Os dois probes originais mantêm SHA:
- geometry.mjs:c29410640c70ee27064530519f3789e5108c210a509440813aecc81e52918ba6;
- live-geometry.ts.txt:efe86cb13077ed131d26acea55b4cbda61a9d1c2734961844e8a39e9a0671947.

A primeira falha real permanece em candidate-live, com trace e JSON Playwright próprios. auth-entry.json contém somente resumo de métodos/caminhos/status/timing sem credenciais e informa que o helper não foi alcançado. O coletor original de fechamento exigia o JSON ausente; sua falha de coleta foi preservada no histórico da chamada. fechar-recursos.mjs é uma cópia de coleta adaptada que verifica a ausência esperada e exige os dados exatos das execuções antigo/restaurado. Não corrige o candidato nem elimina uma assertion do probe.

## Reprodução

Na worktree correta, usar runtime NOVO sob controle-financeiro-runtimes/preparacao-adocao/revalidacao-rr3-01-<execucao>. Scripts anteriores permanecem intactos.

1. Conferir branch/HEAD/diff/README/97/36/originais e vínculo dos fontes ao candidato. preservar.mjs registra esta rodada específica, com checkout inicial8f52b207; não fazer reset para satisfazer sua guarda.
2. node tasks/evidencias/revalidacao-RR3-01/executar.mjs prepare <runtime>: cópia física, caminhos Java do frontend mapeados para f, hardlinks de dependências instaladas imutáveis, sem .env/cache anterior/instalação.
3. Executar o grupo original desta subpasta: copia o live probe por bytes, executa estático e os dois wrappers dirigidos. O esperado funcional do probe é sucesso; a falha de cadastro observada aqui não foi convertida em sucesso.
4. Executar o grupo independent:21 controles intactos,4 complementos, atribuicao.mjs, auditoria numérica e CI/tipagem/lint/24controles. Os dois programas negativos saem1 enquanto os falsos aceites permanecerem; conservar esses vermelhos.
5. Executar o grupo counter: antigo só em s/f, dois probes, restauração em finally por SHA e controles restaurados. Nenhum grupo deve correr simultaneamente com essa mutação da cópia.
6. Conferir brutos, recurso/salvo, preservação e staging. consolidar.mjs valida os recibos desta execução observada, inclusive a pré-condição que falhou; não define expectativa de falha de cadastro para outros ambientes.

Não há sleep/retry novo, force click, instalação, incremento de timeout ou alteração das assertions originais. Maven offline/JDK21, e-mail/cotação simulados na fronteira e PostgreSQL descartável seguem os wrappers originais. Brutos completos, logs/PNG/XML/traces e cópias ficam no runtime privado revalidacao-rr3-01-02.
