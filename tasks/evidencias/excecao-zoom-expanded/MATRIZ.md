# Escopo corrente — DEC-ZOOM-05

Base 64b0cb4c00e9d5905a9b87814143a33df415db97, 03/11/2026. Este snapshot referencia estados canônicos; não reescreve provas históricas.

| Recorte | Estado nesta etapa |
|---|---|
| AC-UI-001 / CF010 / CF015 zoom | pendente, com exceção temporária autorizada para a continuidade delimitada; tarefas em_revisao |
| A: universo original | Todas as identidades Java expanded (Linux + Windows), frontend, E2E e jornadas dos wrappers; listagem anterior a filtros |
| B: adiados | Exatamente projeto/arquivo/título da DEC-ZOOM-05; dois casos Playwright, nenhuma classe Java |
| C: obrigatório | A menos B; todos os wrappers Java e demais testes comuns preservados; zero falhas/erros/skips/flaky |
| A = B união C; B interseção C vazia | Conferência por identidade no contrato, manifest da rodada e gate de relatórios |
| RR3-01 | Aceite anterior preservado no alcance do parecer independente v2 |
| CF-017/P01/P02, adoção, deploy, produção | Fora do alcance; gates próprios preservados |

Plano: contratos e contraprovas isoladas; congelar inputs/seleção; Windows nativo, JVM Linux em container e navegadores/aplicação conforme grupos do plano; preservar a primeira falha e interromper aprovação. Controles não alcançados serão listados sem declarar expanded aprovada. Não corrigir produto/harness alheio nesta etapa.

Runtimes novos sob controle-financeiro-runtimes/preparacao-adocao/excecao-zoom-expanded-20261103-01. Acervos, protocolo e pacote assistido permanecem preservados. Conjuntos efetivos e seus hashes serão registrados no manifest da execução.

## Resultado da rodada

Expanded reprovada/incompleta: Windows nativo1/1; Windows frontend suplementar18 unitários/626 componentes, build com falha de topologia; Linux18 unitários/597 componentes relatados, exit1 e29 identidades ausentes. Backend115, C real23, E2E financeiro e pacote não alcançados. Contratos39/39 em cada plataforma; quatro mutações detectadas/restauradas; controlador real provado somente com fixtures sintéticas. [Resultado e limites](RESULTADO.md), [pendências por identidade](PENDENCIAS.json), [saneamentos](SANEAMENTO-SEGUINTE.md).
