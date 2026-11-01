# RR3-01/P2 — causa e delta

Base c38679933551487e49086e65715243768cba4e44, branch codex/saneamento-pr3-expanded, 01/11/2026 America/Sao_Paulo. Worktree preservada em C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-worktrees/pr3-expanded-source. Runtime novo rr3-01-01 em ../controle-financeiro-runtimes/preparacao-adocao.

Antes da alteração, os dois probes independentes originais foram executados sem editar uma assertion:
geometry.mjs (dez casos) e live-geometry.ts.txt (badge da aplicação real com BFF/Spring/PG descartável e reload). Ambos ficaram vermelhos exatamente por filter-opacity e pointerless-overlay aprovados indevidamente. Os arquivos e toda a pasta da revisão anterior continuam com seus hashes originais. As cópias antes da implementação estão em runtime/originals.

| Prova anterior | Baseline | filter:opacity(0) ancestral | Cobertura branca pointer-events:none |
|---|---:|---:|---:|
| Probe estático: pixels não brancos na DOMRange | 1100 | 0 | 0 |
| Helper antigo aceita | sim | sim | sim |
| Badge real: pixels vermelhos na DOMRange | 1285 | 0 | 0 |
| Helper antigo aceita | sim | sim | sim |

A caixa do texto existiu nos dois casos e Locator.isVisible retornou true. No primeiro, o CSS filter do ancestral atua na composição; o opacity computado inspecionado pelo helper não representa essa operação. No segundo, elementFromPoint desconsidera a cobertura com pointer-events:none e continua atingindo o badge. Presença da caixa, atingibilidade no hit test e pintura do texto são propriedades distintas.

before-diagnostics.json preserva DOM/texto, estilos do alvo/ancestrais/cobertura, DOMRanges, pontos/identidade atingida e verificação independente com Sharp dos PNGs originais. Os PNGs não foram editados. Capturas inspecionadas: baseline real com texto vermelho e contraexemplos sem texto, além do resultado estático branco. No reload real, RVLIVE manteve quantity10, totalCost200, valuationAmountnull. Não houve defeito de produto demonstrado por esses experimentos no DOM.

A correção acrescenta A/B/A de contribuição dos glifos à estrutura/estilos/geometria existentes. A máscara incide só sobre o preenchimento do texto e é restaurada em finally. Os dois casos passam a retornar no-glyph-paint. [Contrato, custo e limites](CONTRATO.md) distinguem pintura, cobertura e interação. Não foram alterados produto, CSS de produto, banco real, migrations, pacotes, relógio civil ou gates.

O único consumidor funcional permaneceu byte a byte igual e passou no SAN-E2-visual em360/768/1440. O nome “legível” do teste não converte a medição em garantia universal de percepção: a evidência é estável e delimitada ao badge e aos controles descritos. Foco/click não são responsabilidade deste helper.

Estado do executor: **saneado localmente, aguardando revisão independente**. Não encerra RR3-01 por autoaprovação nem aprova CF010/CF015 ou a expanded.
