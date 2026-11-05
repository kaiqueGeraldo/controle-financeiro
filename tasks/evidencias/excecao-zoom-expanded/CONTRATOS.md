# Contratos e contraprovas locais

03/11/2026. Contratos corrigidos: 39 testes, zero falhas/erros/skips. Incluem sete contratos novos da exceção, com expectativas literais independentes do seletor. A/B/C do config RF15 conferidos também pelo Playwright 1.63.0 em listagem real: 25 = 2 + 23, identidades completas iguais, interseção vazia.

Quatro mutações somente em cópias privadas: terceira exclusão; retirar a decisão; aceitar skip genérico; omitir identidade obrigatória. Todas produziram exit 1 por assertion do contrato, sem erro de sintaxe/importação. Cada módulo foi restaurado aos bytes originais SHA-256 619ed9043391ea144c64cd63c353f5562971c33537fd72b6939794ad992ed6e0; controle corrigido exit 0 após cada restauração. Logs e recibos privados em contracts/ do runtime da rodada.

O teste preserva controles normais nos dois arquivos adiados, mesmo título em outro projeto/arquivo, lista vazia/duplicada, identidade desconhecida, ausência de relatório, resultado antigo/outro candidato/inputs/rodada, erro/falha/skip/flaky/retry e manifest sem decisão ou com identidade divergente. Não há skip aprovado pela exceção.

Implementação: o wrapper RF15 permanece selecionado. Na expanded, o controlador lista o universo original sem filtros, produz manifest A/B/C e lista explícita C por projeto/arquivo/caminho de títulos, antes de executar. O relatório JSON real deve corresponder exatamente a C, ter uma única execução aprovada por identidade e vínculo atual de candidato/digest/rodada/hash da decisão. CI verifica novamente o material após o wrapper. Os demais gates e required preservam seu comportamento.

Custo do contrato de identidade: O(n log n) por ordenação dos n casos, memória O(n), mais uma listagem Playwright anterior à execução. O benefício é detectar omissões e exclusões adicionais por identidade. O contrato não é um parser genérico de Java; preserva as 116 classes existentes e acrescenta cobertura estrita às 25 jornadas afetadas. Limites da execução real e da plataforma serão registrados separadamente. Ainda depende de revisão independente.

## Prova adicional do controlador real

contrato-cli.mjs executou o Playwright real com fixtures exclusivamente sintéticas e sem navegador/produto: A=5, B=2, C=3. Controles comuns nos dois arquivos e mesmo título em outro arquivo executaram; corpos adiados não executaram. Controle passou (exit0); skip inesperado reprovou (exit1), com skip1/expected2 preservados no JSON. Não são jornadas reais RF15 nem aprovação de zoom.

A primeira versão do teste auxiliar esperou a mensagem de um guard posterior, mas o gate real já rejeitara expectedStatus=skipped. Script, logs e relatórios dessa ocorrência estão preservados em cli-contract/. A expectativa foi corrigida para a rejeição efetiva e os dados estruturados; fixture nova cli-contract-02 verificou os controles. Nenhuma alteração ao código do gate ou teste de produto.
