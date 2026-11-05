# Reprodução e mapa operacional

A worktree está fora do principal; os scripts legados que calculavam o principal por ../.. passaram a consultar o Git common-dir. Logs antigos conservam seus caminhos. O primeiro boot reutilizando cache movido falhou; as provas funcionais foram executadas em cópia física nova, com frontend curto f e cache próprio. Não apagar/reutilizar `.next`, target, pacotes ou runtimes anteriores para reproduzir.

Runtimes privados desta execução, relativos à worktree:

- `../../controle-financeiro-runtimes/preparacao-adocao/pr3-expanded-residual-20261029-01`: inventários antes/depois, recibo de organização, snapshots históricos dos fontes, falha do primeiro boot e dois resíduos vazios preservados.
- `../../controle-financeiro-runtimes/saneamento-PR3-expanded-residual/01`: fontes físicos s/f, dependências imutáveis hardlinked,15 invocações, relatórios, traces, SQL, XLSX e recibos de restauração. Subpasta n contém os frontends compilados CF023 com TLS descartável.

Use um nome novo sob `controle-financeiro-runtimes/saneamento-PR3-expanded-residual/<execucao>`. O executor recusa reutilizar uma pasta de preparação ou rótulo de execução. Seus parâmetros são caminhos; não dependem de nome de usuário. As fontes vêm da worktree atual, inclusive mudanças locais explicitamente registradas; o manifest de cada execução deve ser inspecionado.

Exemplo PowerShell, executado na worktree correta:

```powershell
$principal = Split-Path -Parent (git rev-parse --path-format=absolute --git-common-dir)
$externo = Join-Path (Split-Path -Parent $principal) 'controle-financeiro-runtimes/saneamento-PR3-expanded-residual'
$runtime = Join-Path $externo 'repro-01'
node tasks/evidencias/saneamento-PR3-expanded-residual/executar.mjs prepare $runtime
node tasks/evidencias/saneamento-PR3-expanded-residual/preparar-provas.mjs $runtime
$env:RESIDUAL_GREP='UI01|UI03|UI05|UI06|SAN-D1 |SAN-E2|RESIDUAL geometry|B/C: preferências|RF15-02:'
$env:RESIDUAL_PROPERTIES=(@{'cf023.frontend.runtime'=(Join-Path $runtime 'n')} | ConvertTo-Json -Compress)
node tasks/evidencias/saneamento-PR3-expanded-residual/executar.mjs run $runtime controles IntegratedMilestoneBrowserReviewTest MilestoneRemediationBrowserTest ResidualObserverBrowserProbe UserIsolationBrowserIntegrationTest HarnessCredentialClockTest CredentialExpiryClockTest UserIsolationIntegrationTest Rf15RemediationBrowserTest
```

Pré-requisitos usados: Windows, Node24.18.0, JDK21.0.12.1, Maven3.9.12 offline, Docker Desktop/Testcontainers/Ryuk, PostgreSQL descartável e dependências já instaladas do lockfile: Next16.1.6/Playwright1.63.0. O JDK pode ser localizado/configurado conforme o ambiente; o executor desta prova consulta o JDK já preservado no principal. Nenhum `.env` ou configuração de banco real deve ser copiado. O guard de loopback permanece ativo. Contextos, banco e processos pertencem à execução.

`preparar-auth-frio.mjs` usa Java/driver imutáveis de965b93c7 com frontend físico novo, capturando a primeira navegação. Os tempos adicionais após a falha5000ms são somente diagnóstico e não podem mudar o resultado vermelho. Não há retry da jornada. As primeiras provas foram produzidas antes da alteração do harness; a referência imutável torna a reprodução posterior explícita.

`contraprovar.mjs apply/restore` modifica somente o clone: renda fictícia1000, ganho removido, crédito indevido na exclusão e clock antigo de payment. `contraprovar-auth.mjs` modifica somente o Clock de credencial no clone. `relogio-coorte.mjs` compara os quatro cenários originais com uma única diferença de clock payment, mantendo o observer antigo deliberadamente vermelho nos dois lados; depois restaura os bytes atuais. Executar cada condição uma vez com seu objetivo e guardar todas as saídas. Restaurar e conferir SHA antes dos controles positivos. Esses produtores não têm o objetivo de tornar o gate verde por repetição.

`verificar-xlsx.mjs` lê o arquivo real de after-observers por ZIP/XML sem extrair/sobrescrever o original. Esperados independentes:15/01/2027, origens INVESTMENT_BUY/SELL, caixa−200/+100, ganho observado20, total indisponível e PARTIAL. `preservar-final.mjs` confere97/36 e arquiva por SHA os bytes históricos alterados deliberadamente; não restaura a worktree. `consolidar.mjs` verifica recibos e vinculação dos fontes testados. São utilitários desta prova, com rótulos declarados; uma reprodução nova deve guardar seus próprios recibos e não sobrescrever os desta execução.

Zoom usa specs originais com namespaces/diretórios separados: native-zoom-cf015 e native-zoom-rf15-chrome. A confirmação externa depende de indicador nativo observado, métricas e captura. Não fabricar native-confirmed.txt, modificar DPR, usar CSS zoom ou substituir por viewport. Nesta execução, as interfaces nativas falharam e nenhuma confirmação foi emitida. Computer Use foi interrompido por falta de confiança na URL; não houve ação posterior de interface nem tentativa de contornar o guard.

Não existe comando de push, dispatch, merge ou deploy nesta reprodução. Revisão independente e autorização posterior são necessárias para as etapas remotas.
