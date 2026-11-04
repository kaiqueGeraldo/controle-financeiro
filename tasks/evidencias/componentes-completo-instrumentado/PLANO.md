# Rodada única — componentes Linux e continuidade condicionada

Base inicial: 03028231a7c1cbb9a2532adadd2ea1b9e1ea643e, branch codex/saneamento-pr3-expanded.
O HEAD de observação será commitado antes da execução e registrado no manifest.
Produto/testes/CI base: 860 arquivos de 0aac7ccd, digest
d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660.
Runtime novo: componentes-completo-20261103-01. Nenhum resultado antigo é herdado.

## Condições e seleção

- Uma única execução dos 626 componentes Linux / 71 arquivos, sem filtros.
- Inventário esperado por multiconjunto arquivo+título; SHA256
  7debb7e4dbafd0452bc20cfefd2f0767f246f55bb3d63fc2fb8724f8a722038f.
  Há625 chaves de título distintas e uma colisão já documentada; IDs determinísticos
  do Vitest coletados nesta execução devem ser626 únicos e todos finalizados.
- Mesmo lock, Node24.18.0/Vitest4.1.11/imagem Linux por digest, timezoneSãoPaulo,
  filesystem /work/s nativo; instalação nova. Nada de bind de fontes como execução.
- Timeout5000ms, fixture80, poolforks, isolamento e concorrência originais.
  Teto derivado15 com16CPUs visíveis; workers efetivos serão medidos.
- Captura cgroup/CPU/memória/processos a1Hz; host antes/depois e Docker baseline.
- Nenhum retry. Se falhar antes de iniciar testes, classificar preparo e corrigir
  apenas o impedimento operacional, com novos recibos; não repetir teste iniciado.

## Observação e custo

Reporters default/JSON/auditor canônicos + reporter de observação. Callback por
caso/arquivo apenas armazena metadados em memória. beforeEach/afterEach extras
registram PID, relógio real e custo local de observação. Heartbeat do controlador
a cada2s grava ativos em filesystem Linux; buffer final após término.
Não há Profiler React, proxies de estilo/Intl ou logging por render/query.

Somente os dois arquivos históricos recebem marcadores síncronos em memória:
- CF-013: cartões, faturas e planejamento lista longa mantém a ação de pagamento fora da área rolável
- compares conflict snapshots and does not silently choose the server
Dados, assertions, awaits e timers permanecem textualmente iguais após retirada
dos imports/marcadores. Wrapper de config mantém opções e acrescenta observação
ao redor do setup original. Deltas/hashes observados e fonte base são separados.
Overhead não é zero; custos dos hooks/marcas são medidos, IPC/reporting e amostragem
também podem perturbar a execução. Uma prova sintética pequena valida o observador
antes da rodada; não pertence aos626 nem aquece componentes reais.

## Matriz

| Gate | Comando/mecanismo | Plataforma | Aprovação/relatórios |
|---|---|---|---|
| Preservação/preparo | manifests por referência + exportação atual por860 hashes | Windows → Linux nativo | README/hash/status, inputs/seleção/condições novos |
| Contratos | node --test scripts CI/seleção canônicos | Linux |43 atuais; zero falhas/skips |
| Instalação/lint/tipos/temporais | npm ci, lint max-warnings0, typecheck, npm test | Linux |logs/exit atuais;18 execuções em3 fusos |
| Prova do observador |3 casos sintéticos, um erro esperado | Linux |IDs/meta/erro preservados; preparo, não resultado de produto |
| Componentes únicos | Vitest config original + observação; reporters JSON/audit/observer | Linux |626/71; exit0; zero falhas, erros globais, skips/retries; todos os IDs/arquivos terminam |
| Restauração | desfazer somente marcadores, conferir860 hashes | Linux |digest base recuperado; não reutilizar bytes observados como fontes silenciosas |
| Build/browser Linux | npm run build; test:e2e:install | Linux |somente após componentes aprovados; sem trocar modo Next |
| Preflight Windows | preflight-windows.mjs aprovado, sem alterações | JVM Windows → Docker Desktop →127.0.0.1 |Ryuk/PG16/guard/JDBC/cleanup novos |
| Contratos Windows | scripts canônicos | Windows |43 atuais; zero falhas/skips |
| All Windows vigente | ci.mjs all no candidato atual restaurado | Node/JVM Windows; PG16 Linux |frontend Windows próprio → verify116 → RF15C23 → E2E → pacote |
| Coleta/cleanup | allowlist canônica, IDs/labels/session próprios | Windows/Docker |brutos privados, hashes, nenhum recurso próprio restante |

A continuação all Windows é a prevista no plano vigente: frontend Windows e Linux
têm instalações/relatórios próprios e não transferem markers. Uma execução Windows
de componentes é gate de outra plataforma, não uma segunda tentativa Linux.
Não somar as mesmas626 identidades entre plataformas nem as43 entre ambientes.

No backend Windows,116 =115 comuns + AdoptionNativeSocketsTest, incluído uma vez
no verify. RF15A25=B2+C23; somente dois casos exatos da DEC-ZOOM-05 adiados.
RF15 usa Next dev3107; CF032 usa Next start3142, conforme configs existentes.
Não há backend Linux/Actions certificado nem intervenção manual de zoom.

Sem reaproveitamento de resultados históricos nesta sequência. Se o único Linux
reprovar, dependentes param. Se aprovar, causa histórica continua inconclusiva e
a continuidade está autorizada sem exigir correção funcional. Cada gate posterior
pode introduzir bloqueio próprio; preservar primeira ocorrência e não repetir
para buscar verde. Pacote somente após markers coerentes do mesmo fluxo Windows.

Sem produto/assertions/fixture/timeout/concorrência novos, push/PR/CI/merge,
hospedagem, deploy ou banco real. Evidências e deltas seguem para revisão conjunta.
