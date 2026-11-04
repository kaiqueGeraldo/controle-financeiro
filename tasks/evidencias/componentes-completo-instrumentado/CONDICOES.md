# Condições, observação e leitura dos tempos

A rodada usa a fonte atual exportada da worktree autorizada: candidato
d53de50fa6e005795286f492aa8cb8d5f4b53380, com 860 inputs idênticos por hash
ao produto/testes/CI de 0aac7ccd. O observador operacional de preparação foi
registrado em 4f4c9169. Não houve correção funcional.

## Identidade e preparação

- SHA256 do inventário de 626 ocorrências:
  7debb7e4dbafd0452bc20cfefd2f0767f246f55bb3d63fc2fb8724f8a722038f.
- São 625 combinações arquivo/título distintas; a colisão histórica no contrato
  onboarding é mantida como multiconjunto. O Vitest forneceu 626 IDs distintos,
  conferidos entre coleta, início, fim e resultado. Os 71 arquivos têm início/fim.
- Imagem sha256:c7492c6f8ef9a57a98ff15dc7a6c82a96712b99a97a5fa19edb9576a7b34d5b1.
  Node v24.18.0, Vitest 4.1.11, instalação nova do lock atual, /work/s em overlayfs
  Linux nativo. Inputs/probes eram binds somente leitura; dependências e execução
  estavam no filesystem Linux. O runtime privado contém versões, lock e manifest.
- Base digest d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660.
  Digest durante observação:
  89d006248895661294f00dbe3e4f8cf9e0292fad39d89e5b8202f1e50e454799.
  Apenas os dois arquivos abaixo receberam imports/marcas; o inverso textual foi
  conferido e os bytes originais recuperados por SHA antes do build.
- Preparação 01: contratos 43/43 passaram, mas o verificador do observador exigia
  TAP e o Node24 emitiu spec. Zero componentes iniciados. Brutos preservados em
  linux/. Preparação 02 explicitou --test-reporter=tap, repetiu os contratos e
  passou install/lint/tipos/18 temporais. Isso não altera o produto ou sua seleção.
- Prova sintética separada: três casos, dois aprovados e um erro esperado, exit1;
  valida callbacks, IDs, metadados e propagação do erro. Não pertence aos 626.
- Rodada real: uma invocação completa, exit0; sem repetição. Nenhum relatório
  histórico é contado como resultado atual.

## Concorrência e relógios

Configuração original preservada: forks, isolate=true, paralelismo de arquivos,
timeout5000ms e hookTimeout10000ms, sem maxWorkers configurado, retries0.
Timezone America/Sao_Paulo. O setup original registra fixedNow/seed como metadados;
não instala relógio falso. Assertions, awaits, dados e fixture80 intactos.

Há16 CPUs disponíveis e 16 PIDs de workers simultâneos na amostra de1Hz.
A antecipação de teto15 no plano era uma estimativa incorreta; não foi uma
configuração aplicada. O valor observado foi16, mantendo a decisão automática do
Vitest. Os71 PIDs distintos ao longo do conjunto não são71 workers simultâneos.
O pico de nove testes dentro dos hooks exclui importação, coleta e espera do pool.

## Dois casos históricos

| Arquivo/título completo | Duração Vitest | Corpo entre marcas | Cleanup entre marcas |
|---|---:|---:|---:|
| tests/component/cards-planning-audit.test.tsx — CF-013: cartões, faturas e planejamento lista longa mantém a ação de pagamento fora da área rolável |2652,056ms |2586,967ms |61,190ms |
| src/screens/private/onboarding/screen.test.tsx — compares conflict snapshots and does not silently choose the server |1440,208ms |1409,807ms |27,314ms |

Fatura: fixture0,249ms; render979,618ms; consulta do botão1492,520ms;
assertions114,580ms. A consulta é um intervalo entre duas marcas, sem profiler
interno. Onboarding: render6,901ms; heading42,084ms; digitação286,178ms;
clique salvar156,586ms; clique verificar761,700ms; região25,837ms;
assertions129,613ms. Incluem agendamento/atividade causada pelas operações;
não permitem atribuir todo intervalo a uma função interna.

## Recursos e custo do observador

Distribuição dos626 tempos Vitest: mediana14,972ms; p90 381,797ms;
p95 595,898ms; p99 1593,310ms; máximo2652,056ms. A duração Vitest inclui hooks;
não é uma medição isolada do watchdog do corpo nem um SLO do produto.

A janela de24,926s consumiu em média13,456 núcleos; pico amostrado de memória
cgroup3.326.734.336 bytes (3,10GiB), incluindo cache, e soma RSS dos workers
2.356.940.800 bytes (2,20GiB), que pode contar páginas compartilhadas novamente.
CPU/memory/pids do container estavam sem teto próprio; Docker dispunha de
16.623.751.168 bytes. Não houve throttling, OOM ou pressão de memória registrada.
CPU PSI some cresceu5,046s cumulativos; full cresceu0,071s. Isso evidencia espera
de CPU em parte da execução atual, sem provar a causa dos timeouts históricos.

Hooks/marcas medidos: mediana0,061ms, p99 0,655ms, máximo1,976ms por caso.
Somatório de custo das marcas históricas: fatura0,162ms; onboarding0,360ms.
Amostrador em processo separado: mediana2,171ms, máximo14,233ms por amostra.
Esses números excluem custo de IPC/metadados do Vitest, reporter, carregamento de
módulos, heartbeat e perturbação de agendamento. Não há alegação de overhead zero.

O reporter guarda eventos em memória e grava ativos a cada2s; recursos a1Hz.
Não intercepta render/query globalmente. HábeforeEach/afterEach de metadados por
caso e marcas apenas nos dois históricos; o helper loaded chama marcas inertes
nos outros testes desse mesmo arquivo. Não há log síncrono por operação de UI.
Amostragem pode perder picos breves; timestamps do reporter incluem entrega IPC.
Os custos locais de marcas medidos não calibram todo o custo do observador.

## Conclusão permitida

A execução completa atual passou nas condições registradas. A causa histórica
continua inconclusiva. Os resultados atuais não justificam afirmar correção ou
alterar os cinco segundos. Também não convertem a exceção DEC-ZOOM-05 em aceite
do zoom nativo ou da expanded original sem exceção. O próximo bloqueio, se
houver, deve ser tratado pelo gate posterior que o produziu.
