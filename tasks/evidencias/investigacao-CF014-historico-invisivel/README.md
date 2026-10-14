# Diagnóstico CF014 — histórico invisível, 14/10/2026

**Classificação: defeito de integração do harness de tempo/captura, com alta
confiança para a ocorrência de histórico `opacity: 0` por 15s.** O conteúdo
existia; a animação WAAPI recebia um início futuro porque o relógio instalado
pelo Playwright e a timeline nativa do novo documento tinham origens diferentes.
Não foi demonstrado defeito de produto nem efeito financeiro incorreto.

Executor nesta rodada; não é aceite independente do próprio ajuste. Base publicada
e conferida após `git fetch origin`: `8096b22f0baebf1665cf833065fd3972817d5000`.
Branch `codex/cf014-historico-invisivel`. Produto integralmente preservado.
Commits locais: `56ba986` (probes/fixture/helper) e `0b22c89` (harness somente).
A documentação/provas recebe o commit seguinte; não houve push.

## Origem e sintomas separados

1. [Ocorrência sustentada original](../revalidacao-residual-RF15/ACHADOS.md):
   cenário `rf15-matrix.integrated.spec.ts`, histórico de investimento RF15,
   mobile 360×800. Preparação histórica registrava usuário sintético, conta1000,
   ativo OTHER e oito BUY por API; em seguida navegava para investimentos,
   abria RF15 e exigia oito botões e opacidade1. **Essa preparação histórica não
   foi repetida nesta investigação.** O banco atual já contém os movimentos.
2. [Capturas posteriores insuficientes](../revalidacao-RVR24-02-ciclo-visual/VISUAL-FINANCEIRO.md):
   regiões vazias em capturas de confirmação/recuperação e formulário ausente
   em certas capturas imediatas. Não eram todas medições de15s. Não atribuir
   automaticamente cada screenshot vazio à mesma causa nem ao P2 encerrado.
3. A observação anterior de cinco segundos na operação é compatível com
   divergência temporal, mas **não foi reexecutada nem classificada aqui**.

[Trace original extraído sem alterar o arquivo](historical-trace-summary.json):
GET de histórico200 com oito registros; snapshots antes/depois da assertion
guardam `opacity: 0`; erro `toHaveCSS` após15s. Instalação do relógio em
213106,694ms e navegação em230480,29ms: **17,374s no documento anterior**.
A imagem original foi aberta e mostra o cabeçalho/detalhe legíveis e a região
inferior vazia. Seus hashes estão em [historical-hashes.json](historical-hashes.json).

O diff `a991114..8096b22` é vazio nos componentes de histórico, hook, serviço,
teste original e lockfile: não é um desaparecimento por correção existente.
Versões instaladas: Framer Motion/motion-dom12.33.0, Playwright1.63.0,
Chromium local, Next16.1.6, React19.2.3, Java21 e PostgreSQL16 descartável.

## Fixture e estado inicial

Preparação exclusiva por JDBC no schema novo do Testcontainers, com Flyway real
e Hibernate validate, antes de iniciar o navegador. E-mail/cotação são doubles;
backend, BFF, autenticação, ownership e consultas de histórico são reais.

| Entidade | Identidade/estado |
|---|---|
| Usuário | `cf014-diagnostic@example.invalid`, UUID terminado000001; sintético |
| RF15 | UUID terminado000010,8 registros, posição8, custo/avaliação80, preço10 |
| CURTO | UUID terminado000011,1 registro, posição1, custo/avaliação10 |
| VAZIO | UUID terminado000012,0 registros, posição/custo/avaliação0 |
| RF15 histórico | IDs terminados000100–000107; 08–15/01/2027; BUY1×10, taxas0 |
| Ordem | `operation_date DESC, id DESC`: 15jan/107 até8jan/100 |

Os nove registros estão ligados aos três investimentos do único proprietário.
Não há lançamento bancário nem recibo financeiro: esta é uma fixture de leitura
sintética, não uma alegação de reconciliação de compras reais. Banco real não
foi utilizado. Cada execução compara integralmente `fixture-before.txt` e
`fixture-after.txt` e exige zero `transactions` e `financial_intent_receipts`.
Data civil/backend/auth fixa15/01/2027; data da investigação14/10/2026.

## Hipóteses e experimentos delimitados

| Hipótese / variável | Confirmação/refutação esperada | Observado / conclusão permitida |
|---|---|---|
| Backend/cliente descartam registros | HTTP ausente/vazio ou estado atual sem IDs | HTTP200/8, props comprometidas8/loadingfalse, DOM8: A/B/C descartados no cenário |
| Ocultação, recorte ou cobertura | Estilo/posição incompatíveis, hit-test estranho | O contêiner do histórico tem opacity0; dimensões positivas, demais ancestrais presentes. Recorte legítimo das linhas inferiores exige scroll, não explica o desaparecimento do título |
| Relógio do harness altera a animação | Início WAAPI futuro em relação à timeline; native contraria | Contraprova com documento anterior25s: old clock falha15s, native e Date-only passam |
| Primeira abertura/reabertura/reload | Falha correlacionada a navegação/origem temporal | run-01: old clock atraso~4s; reload gap17,2s e histórico invisível; native5/5 com pintura |
| Coleção curta/vazia | Mesma divergência apesar de quantidade diferente | Old clock afeta CURTO e VAZIO; native mostra um registro ou vazio legítimo. Quantidade não é causa |
| Resposta ainda pendente | Loadingtrue/spinner enquanto GET real está retido | Date-only: spinner pintado; ao liberar o GET real,8 IDs/linhas, clique/scroll/foco; reabertura/reload preservados |

run-01 executou10 observações, sem retry. Sua primeira versão do leitor Fiber
podia acessar uma árvore anterior; esses campos de estado **não são a prova
final de C**. run-02 falhou3/3 por essa instrumentação, preservado integralmente.
Leitor corrigido percorre a raiz React comprometida, sem mudar props/hooks.
run-03 passa3/3 com estado/API/DOM alinhados; run-04 passa1/1 com resposta retida
e interação. Nenhum aumento do prazo de assertion15s, mudança de animação,
remount, forceUpdate ou estilo foi usado. A permanência25s no documento anterior
é a variável causal deliberada, não uma espera para obter imagem verde.

## Caminho causal e correlação final

Abrir detalhe → GET `/api/investments/{id}/history` → BFF/Spring/PostgreSQL →
`investmentService.getHistory` normaliza → `useInvestments` grava a resposta
corrente → `InvestmentDetails` recebe8 itens → oito linhas e botões existem →
`motion.div` do histórico tem `initial.opacity=0`, `animate.opacity=1`, delay200ms.

A versão local do Clock usa `_installIfNeeded`/`inject`, substitui `performance`
e reproduz o log de tempo em documentos novos. O documento reinicia sua timeline
WAAPI; `performance.now()` do harness conserva o tempo acumulado. Motion usa esse
`performance.now()` e atribui `animation.startTime` no
`NativeAnimationExtended`/setter de `NativeAnimation`. Resultado:
`currentTime = document.timeline.currentTime - startTime < 0`; o fill mantém
o primeiro keyframe transparente, embora playState seja running.

| run-03, mesmo documento anterior≥25s | performance−timeline | currentTime inicial | opacity final após assertion |
|---|---:|---:|---|
| Playwright Clock antigo | 24938,138ms | −24741,138ms |0; assertion falha15s |
| Native |20,1ms |163,4ms |1; passa |
| Somente Date fixa |26,5ms |121,2ms |1; passa, mesma Date.now1800014400000 |

[JSON causal](run-03-causal-committed/playwright-clock-causal.json),
[contraprova civil](run-03-causal-committed/civil-date-only-causal.json),
[loading/estado/interação](run-04-harness/civil-harness.json).
Os atuais IDs na árvore comprometida coincidem com a resposta e a ordem no banco.
O teste corrigido verifica diretamente funções nativas de performance/rAF/timers;
`Date.now`, `new Date()`, construtor explícito, parse, UTC e instanceof permanecem
consistentes. [Documentação oficial do Clock](https://playwright.dev/docs/clock)
contextualiza a API; a classificação deriva das medidas desta versão instalada.

## Pintura, captura e interação inspecionadas

Imagens efetivamente abertas: a falha histórica; run-01 fixed-reload-final,
native-reload-final, native-first-scroll e native-empty-selection-final;
run-03 old-clock-final e civil-date-only-final; run-04 delayed-loading e
reload-interaction. Não se presume pintura a partir de `toBeVisible`.

| Prova versionada | Inspeção |
|---|---|
| [Clock antigo](run-03-causal-committed/playwright-clock-causal-final.png) | Área inferior inteira vazia;8 linhas no DOM e opacity0 |
| [Date-only](run-03-causal-committed/civil-date-only-causal-final.png) | Título e compras15/14/13jan legíveis |
| [GET pendente](run-04-harness/civil-delayed-loading.png) | Título e spinner legíveis; coleção ainda pendente |
| [Scroll após reload](run-04-harness/civil-reload-interaction.png) | Compras09/08jan legíveis; último botão recebe pointer e foco |
| [Vazio legítimo](run-01/native-empty-selection-final.png) | Texto “Nenhum registro encontrado.” pintado |

Os seis traces atuais foram inspecionados por leitura de eventos, requests,
snapshots/assertions e comparação com capturas. [current-trace-inspection.json](current-trace-inspection.json)
inclui hashes, HTTP200, falhaCSS medida15005ms e controles positivos. Traces
completos permanecem locais, sanitizados, com caminhos/hashes no manifesto;
não foram despejados no Git nem enviados a CI. Leitura passiva e screenshots
podem consumir tempo; a contraprova mantém a diferença≥20s e usa a assertion
original sem polling de Fiber. Não há evidência de congelamento nativo ou de
página hidden; as observações registram visibility/focus.

## Correção, trade-offs e limites

Somente `start(...,'investment')` no harness original agora usa `setCivilDateOnly`;
outros cenários mantêm o relógio anterior. Toda a sequência/assertions original,
incluindo opacidade,8 registros, scroll, operação/Escape/foco, foi preservada.
O helper Proxy fixa Date sem interceptar timers/rAF/performance. Custo O(1) por
chamada; instrumentação de estado O(n) na árvore React, exclusivamente de teste.
Nenhuma query, N+1, estado de domínio ou concorrência de produto foi alterada.

Trade-off: um helper Date próprio exige manter sua pequena prova de semântica;
ele não oferece avanço de timers, que o cenário de histórico não utiliza. Isso
preserva a animação nativa e evita ampliar a alteração aos demais consumidores.
Não é recomendação de remover animações ou atualizar dependências globalmente.
O leitor Fiber depende do React de desenvolvimento instalado e é uma probe,
não uma API de produto. Não se certificam outros browsers/build de produção,
erros HTTP ou cada captura histórica de operação/recuperação.

O cenário original com oito comandos financeiros **não foi reexecutado**: foram
executadas suas garantias pertinentes de leitura/pintura/interação com SQL
preexistente e o mesmo helper corrigido. Descoberta do cenário original, lint
dos arquivos afetados e typecheck passaram. A rodada não libera garantias
financeiras novas nem autoaprova uma alteração.

## Impacto e próximo passo

- CF014 permanece `em_revisao`. Há causa demonstrada para a ocorrência sustentada
  do histórico; encaminhar a outro revisor a contraprova e o ajuste de harness.
  Para recomendar fechamento, confrontar o critério calendário/histórico/modais
  operáveis com os aceites acumulados e decidir explicitamente o alcance das
  capturas imediatas insuficientes. Um novo verde isolado não é esse aceite.
- CF015 permanece `em_revisao`: nenhuma liberação automática. RVA-03, zoom200%
  e os dois timeouts históricos não foram investigados nem encerrados aqui.
- P2 A→B, CF011/012, RF15-01–04, capacidades financeiras/recuperação e CF028
  exclusivamente documental permanecem aceitos no alcance anterior.

Branch antiga local removida com `git branch -d` somente após fetch, confirmação
de ausência em worktrees e divergência0/0 com main e upstream; ambas as
ancestralidades exit0. Todas as remotas, main e branch ativa conservadas.
[BASE.json](BASE.json) registra a organização. README raiz intacto:
SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`,
fora de staging/commits. Sem push, deploy, banco real, onboarding ou limpeza.

Reprodução e resultados detalhados: [EXECUCOES.md](EXECUCOES.md).
