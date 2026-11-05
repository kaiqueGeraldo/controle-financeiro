# Reprodução independente e limites das provas

Usar a worktree realocada C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-worktrees\pr3-expanded-source, branch codex/saneamento-pr3-expanded. A revisão usa recursos descartáveis e não lê .env. Os scripts aceitam somente runtime próprio sob o diretório externo de preparação. Nenhum script publica ou dispara CI.

Runtime desta revisão: C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\revalidacao-pr3-residual-01.

Exemplo em PowerShell, na worktree correta, com nome de execução NOVO:

~~~powershell
$runtime='C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\revalidacao-pr3-residual-NOVA'
node tasks/evidencias/revalidacao-PR3-expanded-residual/auditar.mjs $runtime initial
node tasks/evidencias/revalidacao-PR3-expanded-residual/executar.mjs prepare $runtime
node tasks/evidencias/revalidacao-PR3-expanded-residual/preparar-probes.mjs $runtime
node tasks/evidencias/revalidacao-PR3-expanded-residual/geometry.mjs $runtime
$env:REVALIDATE_GREP='UI01|UI03|UI05|UI06|SAN-D1 |SAN-E2|Independent ownership'
node tasks/evidencias/revalidacao-PR3-expanded-residual/executar.mjs run $runtime directed IntegratedMilestoneBrowserReviewTest MilestoneRemediationBrowserTest RevalidationIdentityProbe UserIsolationBrowserIntegrationTest
node tasks/evidencias/revalidacao-PR3-expanded-residual/preparar-complementos.mjs $runtime
node tasks/evidencias/revalidacao-PR3-expanded-residual/sequenciar-contraprovas.mjs $runtime
node tasks/evidencias/revalidacao-PR3-expanded-residual/revalidar-dirigidos.mjs $runtime
~~~

geometry.mjs deve reprovar pelos dois falsos positivos; o grupo final deve manter RevalidationVisualProbe vermelho enquanto RR3-01 existir. Não usar sua saída global vermelha para invalidar ou aprovar outras classes sem ler XML/JSON. O grupo inicial testa somente o delta e controles de identidade; não é a seleção integral.

A execução original de sequenciar-contraprovas usava filtros ancorados no início do título; o título Playwright inclui arquivo/projeto antes do nome. counter-income/counter-gain/counter-reserve não selecionaram casos e não são provas causais. O erro foi preservado e corrigido somente nos scripts da revisão. Os filtros finais da reprodução são sem essa âncora. Os rótulos counter-*-directed executam as mutações financeiras isoladas efetivas. Não se repetiu cenário vermelho funcional para buscar verde.

O runner copia844 arquivos rastreados backend/frontend/.github, sem Git, secrets, .env, caches ou histórico. O frontend físico tem nome f para reduzir profundidade no Windows; nos wrappers Java, só resolveSibling foi adaptado. prepared.json vincula cada fonte/cópia por SHA e identifica essa diferença. Dependências instaladas do lockfile foram reutilizadas por hardlinks de arquivos, com rejeição de links inesperados; nenhuma instalação compartilhada foi alterada. O servidor CF023 cria outra raiz n/<namespace> com fontes físicos e TLS próprios, sem reutilizar .next. Os novos probes terminam em Probe, fora da seleção canônica por *Test.

JDK21.0.12.1 e Maven3.9.12 offline preservados no principal; Node24.18.0, Next16.1.6, Playwright1.63/Chromium1243; PostgreSQL16-alpine por Testcontainers/Docker descartável. JVM UTC e context cache4; browser SãoPaulo; credenciais CF023 em tempo real, financeiro30/09/2026; SAN-D1 em15/01/2027. Os argumentos reais de cada invocação estão em execution.json, incluindo failIfNoTests, seleção explícita, diretórios próprios e ausência de retry. Não houve JAR novo.

Cada execução tem label novo, XML separado, log, inputs e SHA; os fontes experimentais só mudam na cópia s e são restaurados por bytes/hash em finally. Rótulos e arquivos preexistentes não são sobrescritos. Os scripts de consolidação leem brutos e validam seus hashes, não executam novamente as suítes. Mutações antigas de clock podem passar por intermitência; preservar a saída real, sem repetir até falhar.

inspecionar-historicos relê a ocorrência fria, relógios, credenciais e contratos históricos, e decodifica os PNGs das contraprovas. O resultado da própria preparação do auditor teve erros de caminho longo Git, formato da linha operacional e formato spec/TAP: foram corrigidos sem mudar dados ou assertions do candidato; não são falhas de produto nem provas de sensibilidade.

Contraprovas financeiras: renda+1000, ganho20 removido e crédito fictício de reserva são aplicadas uma por vez. Contraprova SAN-D1 altera somente a escolha do helper payment; contraprova CF023 troca somente o Clock interno de credenciais pelo antigo. Após restauração, as jornadas originais permanecem íntegras. boundary-extension executa a jornada CF023 original e acrescenta contextos negativos independentes; a chave usada é exclusivamente a do backend sintético e não é registrada nos resultados. Token/certificado/chave TLS/traces/SQL completos ficam no runtime privado.

Os32 contratos CI são node --test .github/scripts/ci.test.mjs .github/scripts/suites.test.mjs .github/scripts/sanitize.test.mjs .github/scripts/required.test.mjs, com saída externa e reporter TAP. A tipagem completa histórica foi conferida por fonte/recibo; builds físicos CF023 novos também incluem a tipagem de produto. Não alegar reexecução de todas as suítes ou de Linux.

Auditar de novo ao final com fase final; consolidar.mjs só depois dos controles encerrados. Fechamento de recursos deve identificar processos/containers próprios pelo runtime/logs, sem matar alheios ou limpar target. Preservar toda falha e bytes antigos. Os commits de revisão usam staging explícito somente nesta pasta, incluindo arquivos ignorados de forma deliberada; README, runtimes e dados de sessão ficam fora.

O primeiro RevalidationCredentialBoundaryProbe exigia automaticamente o formulário de login para assinatura inválida ainda não expirada. Isso violava a observação prevista em AC-UI-004: o produto mostra Sessão Expirada e sua ação Ir para o Login. A falha própria foi preservada, o driver anterior arquivado por SHA e corrigir-probe-credenciais.mjs ajustou somente esse probe novo para exigir o diálogo, ausência da conta de A e interação de login. O label credential-boundaries-corrected registra esse complemento. O Java/driver/assertions/timeouts do candidato não mudaram. A reprodução nova já prepara a extensão corrigida; não precisa repetir a falha de preparação.
