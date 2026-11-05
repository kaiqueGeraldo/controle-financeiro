# Saneamento residual da PR3 — resultado local

29/10/2026, America/Sao_Paulo; timestamps brutos em UTC. Base: `965b93c77bce6cde0c4473272901817d221466a1`. Código final: `b09d0906b16f4769356a04e031634bcfbd04cdc1`, branch `codex/saneamento-pr3-expanded`.

A organização está concluída. As correções delimitadas foram implementadas e verificadas localmente. **Zoom nativo 200% permanece pendente; expanded integral não foi executada.** O delta aguarda revisão independente. Nenhum achado foi autoencerrado e não há liberação de merge.

## Organização e preservação

Worktree registrada: `C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-worktrees/pr3-expanded-source`. O `git worktree move` preservou 36.114 arquivos, 1.634.276.589 bytes e cinco junctions, sem atravessá-las. A conferência imediatamente após a mudança encontrou somente alteração do mtime do ponteiro `.git`, cujo conteúdo permaneceu idêntico. [Recibo e mapa](REALOCACAO.json).

A `.r3` está ausente. A estrutura inicial vazia de backend/target foi inventariada e movida ao runtime da organização. Durante a primeira preparação reapareceu somente o esqueleto vazio `.r3/pr3-expanded-source/controle-financeiro-frontend`, com criação às23:49:56Z. Não tinha arquivos, links ou registro Git; foi inventariado e movido para `r3-regenerated-empty-next` no mesmo runtime. A associação com a primeira preparação é temporal; não é um defeito atribuído ao produto. A pasta `.r3` foi removida somente vazia, sem recursão.

Os 97 arquivos protegidos permanecem idênticos. O manifest de 36 registros continua com seu SHA histórico: 29 fontes/artefatos mantêm os bytes;7 receberam mudanças autorizadas — `.gitignore`, Java/driver CF023, spec milestone-review e três scripts operacionais. Os bytes anteriores desses7 foram arquivados e conferidos contra os hashes originais, sem reverter os fontes atuais. Os 21 arquivos da revisão, preservados antes do saneamento funcional, e as cinco junctions também foram reconferidos. [Conferência final](PRESERVACAO.json).

README principal: `6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`. README da worktree: `e7d3458fbd8ac227520be27996ce23c73e8c3be2086d8cfbd51ad59568f4cee0`. São arquivos distintos e ambos foram preservados. O principal conserva branch/HEAD originais e somente `M README.md` preexistente. Todos os commits anteriores permanecem ancestrais do candidato.

## Correções e contraprovas

| Item | Mudança e prova local | Limite |
|---|---|---|
| UI01/UI05/UI06 — cobertura | Totais mensais null/PARTIAL e subtotais decimais exatos observados. Abertura1000 não vira receita; despesa120 deixa880. Compra10×20/venda4×25 conserva caixa900/quantidade6/custo120/ganho observado20. Resgate220 conserva800/800/880 e caixa1220. Investimento buscado por ID. Mutações reais no clone detectadas: receita fictícia1000 e ganho20 substituído por0 | Não autoriza completar períodos desconhecidos nem certifica todo consumidor financeiro |
| UI03 — reserva | Alocação RES_ID da conta própria, item exato, request com accountId/allocationId e preço120; reload e PostgreSQL confirmam caixa880/reserva180. Exclusão libera a intenção sem renda. Fonte de outra meta é recusada400; item e conta semelhantes não são confundidos. Crédito fictício180 na exclusão produz1060 e reprova a assertion880 | Compra/reembolso fora desse recorte conserva seu aceite e seus testes próprios |
| SAN-E2 — texto e geometria | DOMRange do texto exato substitui a caixa inexistente do span display:contents. Exige pintura, viewport, recorte e amostras de oclusão. Cenário360/768/1440 passou. Probe recusa texto errado, oculto, transparente, recortado, coberto e fora do viewport. Capturas360/768/1440 e compra/exclusão foram conferidas | Texto informativo não exige foco/interatividade. Oclusão é amostrada em três pontos por retângulo; não é certificação universal de pixels nem zoom nativo |
| SAN-D1 — relógio | Só payment passou a usar o helper civil existente:15/01/2027, SãoPaulo, com performance/RAF/WAAPI nativos. Mantidas duas intenções100, replay sem novo débito, conflito409, conta800/fatura300/pagável100 e reload. A reprodução inicial do grupo falhou no modal; grupo corrigido e restaurado passaram | A manifestação antiga é intermitente: controle isolado e comparação posterior de quatro cenários passaram também com o relógio antigo. Esse resultado não foi ocultado nem repetido até falhar. Na comparação, antigo performance31737/timeline2635ms; civil2862,3/2839,5ms. Ambos terminam com modal deliberadamente reaberto. A causalidade anterior da revisão e a nova falha inicial permanecem preservadas; não se promete reprodução determinística |
| RF15 — identidade | Dono determinístico por spec/cenário; mesmo usuário em login/reload. Diretórios nativos separados. Oito sequências reais nas duas ordens: prefixo antigo reproduz segundo cadastro400; novo separa proprietários, saldos e conteúdo, inclusive conta semelhante. Duas specs reais de privacidade passaram; os dois specs nativos chegaram à prontidão sem colisão | Namespace da execução continua sendo responsabilidade do chamador; não houve aumento de UUID para reduzir chance de colisão |
| CF023 — aplicação pronta | Experimento frio: clique em991,5ms, GET/ em2924,2ms, falha original em6199,3ms, resposta200 em7074,3ms e pintura em8144,7ms. Compilação de/4,1s somou-se ao cadastro/login; sessão válida, sem307. Harness passa a compilar fontes físicas novas e servir HTTPS de loopback antes da jornada, dentro dos mesmos120s de readiness,180s do processo e5000ms após clique. Não há warmup autenticado ou execução antecipada da jornada. Jornada completa e restauração passaram; clock antigo de credencial reproduziu307 e remoção do cookie | Contrato é sessão/ownership com aplicação pronta, conforme parecer anterior. Não certifica cold start/SLO de produção. Linux ainda não executado neste lote; links internos de dependências são tratados sem seguir destinos externos |
| Zoom CF015/RF15 | Tentativa obrigatória:2 specs vermelhos no poll180s, razão DPR final/inicial1, exigida2; DPR inicial1,25. Sem indicador externo observado, sem native-confirmed.txt e sem zoom.json. Vinculação de janela Testing recusada por Sky e Cua. Uma verificação específica adicional do Chrome instalado terminou com parada de Computer Use por falta de confiança na URL atual | 200% nativo e as ações/foco/rolagem posteriores continuam não comprovados. Não foi enviado atalho por janela ambígua, nem usado CSS/deviceScaleFactor/viewport como substituto |

O transporte de abertura decimal/precisão/UI04 e o isolamento/lifecycle CF014 conservam seus aceites anteriores. Produto, migrations, dependências, queries e `.github` não foram alterados. Nenhum defeito de produto foi confirmado neste lote.

## CF023: decisão e custo do harness

A preparação compilada evita incluir compilação lazy de Nextdev no prazo da navegação funcional. Acrescenta cópia dos fontes, hardlinks das dependências imutáveis, build e certificado de teste por namespace. Preserva o cache antigo e não cria usuário ou posição antecipadamente. O custo é O(n+m) operações de arquivo, para n fontes e m arquivos instalados, além do build; não se apresenta isso como otimização de produto ou benchmark.

A primeira preparação compilada falhou por caminho longo do Windows; `cf023.frontend.runtime` permite raiz curta, com subdiretório exclusivo por namespace. A tentativa HTTP compilada abriu/ no prazo, mas o cliente auxiliar recebeu401: o cookie Secure era enviado pelo navegador em loopback e não pelo cliente HTTP. HTTPS mantém Secure/HttpOnly. O certificado e sua chave são gerados no runtime e não versionados; readiness Node confia naquele certificado. A tolerância ao certificado autoassinado fica no contexto Playwright sintético. JWT, TTL, issuer, middleware, ownership e relógio financeiro JVM/browser permanecem exigidos. Node/Edge usam tempo real; nenhuma autenticação foi desativada.

O mecanismo antigo foi aplicado apenas no clone e restaurado por SHA. Em HTTPS, login/user200 com o clock financeiro antigo produziram/307 e cookie ausente; após a restauração, A/logout/B/reload/404/logout/A, duas abas e SQL1000/2300 passaram. Não houve pageerror nas jornadas positivas. Os401 de ausência/logout são negativos esperados, preservados nos logs.

## Contagens e falhas preservadas

| Execução | Resultado, sem somar camadas sobrepostas |
|---|---|
| Primeiro boot na worktree movida | Preparação Next “package not found”; nenhum relatório concluído. Árvore própria encerrada e recibo preservado; não conta como reprodução funcional |
| before-copy | 2 wrappers reprovados;8 cenários internos,6 falhas e2 controles aprovados |
| after-observers | 2 wrappers aprovados;8 cenários internos aprovados |
| identity-geometry | Geometria aprovada;8 probes de identidade falharam por entradas novas incorretas. Erros e traces preservados |
| identity-valid-inputs | 8 sequências de identidade aprovadas após corrigir nome/senha e tamanho do e-mail da fixture de prova |
| counter-finance-clock | 4 cenários financeiros detectaram as mutações; SAN-D1 isolado com clock antigo passou. Fontes restaurados por SHA |
| clock-cohort-old/civil | Nos dois,3 cenários passaram, incluindo SAN-D1; o observer geométrico antigo foi mantido propositalmente vermelho. Só o controle do relógio payment diferiu. Fonte atual restaurado por SHA |
| CF023 | Frio vermelho; caminho longo vermelho; transporte HTTP vermelho; HTTPS positivo; credencial antiga negativa307; restauração positiva |
| restored-controls | 8 classes,88 casos JUnit,0 falhas/erros/skips. Contém83 casos sem navegador e5 wrappers com11 casos Playwright+1 jornada procedural CF023. Esses12 não são somados aos88 |
| Zoom | Grupo obrigatório2 falhas; verificação adicional do mesmo caso Chrome1 falha, sem contá-la como caso obrigatório novo |
| Checks | Tipagem aprovada;32 contratos CI aprovados,0 skips; leitor independente do XLSX aprovado |

[RESULTADOS.json](RESULTADOS.json) verifica SHA dos relatórios/logs e vincula os11 fontes de teste finais aos inputs efetivamente executados, incluindo somente a adaptação de caminho do frontend na cópia física. Relatórios, traces, screenshots, certificados, runtimes e snapshots SQL ficam privados. Não foram reescritas provas históricas.

## Expanded e encaminhamento

Seleção canônica conferida:115 classes Linux;116 na seleção completa Windows, incluindo a classe exclusiva dessa plataforma. **Expanded integral não executada.** O pré-requisito obrigatório de zoom nativo não pôde ser operado/observado com segurança: erro de propriedade da janela e posterior bloqueio da ferramenta por URL não confirmada. Os casos dirigidos não substituem a integral nem foram apresentados como smoke.

Os resultados remotos históricos expanded/required continuam reprovados; não foi feita nova consulta de aprovação, publicação, atualização da PR, dispatch remoto, merge, alteração Railway/Vercel, deploy ou acesso a banco real. PR3 segue sem liberação pelo presente trabalho.

Próximo passo: revisão independente de `965b93c7..HEAD`, incluindo os trade-offs do harness compilado/HTTPS, as provas negativas e a intermitência do SAN-D1. Depois: obter capacidade nativa segura, concluir os dois cenários200%, executar a seleção integral numa topologia válida e solicitar autorização posterior para publicação/reexecução remota. [Reprodução e limites](REPRODUCAO.md). A matriz anterior às edições está preservada em [MATRIZ.md](MATRIZ.md); os campos explicitados posteriormente estão em [MATRIZ-DETALHADA.md](MATRIZ-DETALHADA.md).
