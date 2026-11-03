# Parecer independente — DEC-ZOOM-05, plataformas e Docker

03/11/2026, America/Sao_Paulo. Worktree `C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-worktrees/pr3-expanded-source`, branch `codex/saneamento-pr3-expanded`.

Base revisada: `f8eff56cba2d6ff985d3d81b20286a5b3ad050db`. Seleção: `64b0cb4c00e9d5905a9b87814143a33df415db97..48d0247b98468c9526bb9af6089062c3049247a3`. Plataformas: `48d0247b98468c9526bb9af6089062c3049247a3..f8eff56cba2d6ff985d3d81b20286a5b3ad050db`. Ancestralidade, branch, diff e estado inicial conferidos na worktree indicada, inicialmente sem alterações.

## Pareceres

| Recorte | Parecer local | Evidência e limite |
|---|---|---|
| A — seleção DEC-ZOOM-05 | **Aceita** | Dois cenários exatos adiados; 116 classes Java preservadas; RF15 A25=B2+C23 por identidades. Nenhum aceite de zoom. |
| B — frontend Linux | **Correção aceita** | 626/626, 71 arquivos, conjuntos completos e 29 identidades recuperadas. A causa histórica exata da primeira perda continua não preservada. |
| C — build Windows | **Correção aceita** | SUBST lógico falha no build preservado; caminho físico passa com os mesmos bytes. Nova prova dirigida de SUBST/guard, sem repetir builds. |
| D — infraestrutura backend | **Original incompatível; alternativa Windows comprovada** | Linux sibling alcança Ryuk e PG por host.docker.internal, mas viola o contrato do guard. JVM Windows no mesmo daemon passa A–H e consumidor Spring 5/5 + guard 4/4. |
| E — próxima expanded | **Apta para iniciar nova rodada local na alternativa Windows identificada** | Pré-requisitos de infraestrutura comprovados; usar nova exportação e runner canônico com todas as 116 classes no Windows. Nenhum resultado integral antecipado. Linux original continua bloqueado. |

Não foram encontrados defeitos que impeçam aceitar A/B/C no alcance examinado. Isso não afirma ausência total de bugs nem aprovação de backend integral, RF15, E2E financeiro, pacote, PR ou CI remota. A disponibilidade Docker já não é uma hipótese na alternativa Windows mínima; sucesso dos gates posteriores continua por demonstrar.

## Seleção e fechamento conservador

[SELECAO.json](SELECAO.json) contém os conjuntos. Os dois testes nativos continuam no repositório e somente as identidades autorizadas entram em B: projeto `review-sao-paulo`, arquivos `cf015.native-zoom.integrated.spec.ts` / `rf15-native-chrome.integrated.spec.ts`, títulos literais registrados na decisão. Controles normais nos mesmos arquivos, outro projeto ou outro título permanecem obrigatórios. Não há dispensa de classe Java.

Foram reexecutados contratos para terceira exclusão, obrigatório ausente, lista vazia/duplicada, skip/falha/retry inesperados, relatório ausente/antigo, outra execução/candidato/digest e decisão/identidade divergente. Quatro mutações de zoom e quatro de plataforma foram rejeitadas por assertions, com restauração SHA-256 e controles aprovados. CLI Playwright real com fixtures sintéticas: A5/B2/C3 passa; skip adicional reprova. São contratos do seletor, sem navegador ou jornada RF15 real.

CF-010/CF-015 permanecem **em_revisao, pendentes com exceção temporária delimitada**. DEC-ZOOM-05 não recebeu nova condição nem extensão de alcance.

## Qualidade e trade-offs

A auditoria adicionada compara conjuntos de arquivos e casos, mantém erros globais e vincula candidato/digest/runId. O reporter real foi exercitado: Vitest retornou JSON success=true e razão passed diante de uma rejeição global sintética; audit.errors=1 e o gate a recusaram. Outro controle pelo runner real produziu JSON aprovado mas exit 7 do processo de componentes: build e marker foram bloqueados. Relatório parcial/ausente, seleção vazia e outra execução também continuam reprovados.

Comparações ordenadas custam O(n log n) e memória O(n), proporcionais a 626 componentes/25 jornadas. Atestação de fontes custa O(B), para B bytes lidos; são 860 entradas. O comparador de classes/reportes já existente é O(C×R), pequeno neste universo de 116 classes. Não houve alteração em consultas, transações, concorrência de produto ou fronteiras de domínio; não cabe inferir melhorias de N+1, throughput ou semântica financeira desta revisão. Callbacks do reporter executam no controlador; escritas síncronas e um arquivo de eventos evitam sobreposição de gravações, com custo de I/O aceitável neste recorte.

Linux nativo elimina a penalidade do bind de fontes/dependências, ao custo de cópia, instalação e coleta explícitas. Canonicalizar caminhos remove aliases de entrada/saída sem alterar Next/TypeScript. Windows nativo evita a incompatibilidade de endereços do executor Linux e preserva o guard, ao custo de executar os testes comuns no Windows e manter dependência do Docker Desktop local. Nenhuma dessas escolhas certifica equivalência com GitHub Actions/Linux.

O guard exige PostgreSQL, host loopback e nome esperado exato iniciado por cf_test_. Ele sozinho não prova posse ou descarte: essa parte vem da criação Testcontainers, nome sintético, IDs/labels e cleanup. host.docker.internal não foi classificado como malicioso; é recusado porque não satisfaz o contrato literal. Não se mudou a allowlist para acomodar a topologia.

## Evidências, limites e próxima ação

- [SANEAMENTOS.md](SANEAMENTOS.md): fontes, cobertura, histórico e build.
- [CAUSAS-BACKEND.md](CAUSAS-BACKEND.md): todos os 790 erros reconciliados e causas por contexto.
- [MAPA-REDE.md](MAPA-REDE.md) e [PREFLIGHT.md](PREFLIGHT.md): endereços, etapas e cleanup.
- [PROXIMO-LOTE.md](PROXIMO-LOTE.md): comando preparado, nova seleção e gates obrigatórios.
- [PRESERVACAO.json](PRESERVACAO.json), [REFERENCIAS.json](REFERENCIAS.json): referências privadas com hashes; logs brutos permanecem privados.

Falhas de preparo de scripts desta própria revisão estão preservadas e qualificadas em CONTRAPROVAS.json. Nenhuma conta como defeito do candidato nem foi apagada por resultado posterior. O preflight não foi repetido até passar: executou-se uma vez a topologia original e uma vez a alternativa delimitada; a original parou no guard e não avançou à consulta sintética.

Sem correções de implementação, nova expanded, push, atualização de PR, CI remota, merge, mudança global Docker/WSL, deploy, hospedagem ou banco real. A próxima execução integral precisa de um novo lote solicitado; não exige repetir autorização da DEC-ZOOM-05 nem alterar infraestrutura persistente para a alternativa comprovada.
