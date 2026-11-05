# Matriz de revalidação

| Critério | Antes / contraprova | Candidato / complemento independente | Decisão |
|---|---|---|---|
| Filter:opacity(0) ancestral | Antigo aprova texto invisível; probe original reprova | no-glyph-paint; estático e real passam | Mecanismo original aceito |
| Cobertura pointer-events:none | Antigo aprova; hit test não vê cobertura | no-glyph-paint; estático e real passam | Mecanismo original aceito |
| Texto visível e identidade | Controle antigo visível; locator exato | Fundos legítimos, herança,important, quebra/scroll/DPR2 aceitos; errados/ocultos do candidato recusados | Aceito no recorte |
| Origem dos pixels emB | CSS responde ao style transitório | Fundo ou texto irmão aparece só emB; A1=A2 branca; ok=true em ambos | RR3-01/R1/P2 aberto |
| Estado variando | Texto, posição, animação ou imagem muda | text-state-changed/unstable-paint; fonte pendente recusada antes de capturar | Aceito no recorte; ciclos intermediários não certificados |
| Restauração | Falhas induzidas nas três capturas e timeout real | Valores/prioridade/ausência preservados; nova medição e ação funcionam | Aceita para donos salvos |
| Remoção/navegação/substituição | Handle antigo perde conexão/contexto | Rejeição/erro; dono retido restaurado; documento/elemento novo normal funciona | Aceito nos caminhos suportados; clone concorrente não certificado |
| Concorrência de helpers | Helper aninhado na mesma Page | concorrente recusado, externo passa | Aceito; consumidor sequencial |
| Consumidor real | Fonte/assertions originais intactas | SAN-E2 em360/768/1440 e RVLIVE10/200/null após reload/PG | Aceito nessa fixture |
| Capacidade de detectar legado | Antigo reinstalado só na cópia | Dois falsos aceites estático/real; restore SHA e originais corrigidos aprovados | Contraprova sensível |
| Gates | Seleção/required/skip não alterados |32 contratos+tipagem+lint+24 controles aprovados | Preservados |
| Zoom | Capacidade C; dois casos obrigatórios sem prova | Nenhum ensaio nativo repetido | Pendente, separado de RR3 |
| Expanded/PR | Reprovação remota preservada | Integral não executada/certificada; achado local direto persiste | Sem merge ou produção |

Não somar casos internos de Playwright a wrappers JUnit ou repetições entre condições. Não usar zoom como motivo de manter RR3 aberto: o resíduo demonstrado é do próprio método.
