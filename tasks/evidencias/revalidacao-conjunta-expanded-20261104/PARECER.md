# Parecer independente conjunto — 04/11/2026

**A–D aprovados nos alcances abaixo; E parcialmente aprovado, com verificações externas pendentes. Nenhum impedimento confirmado para encaminhar o lote à publicação controlada da PR #3 e à CI remota.** Esta recomendação não executa essas ações e não aprova merge, main, deploy ou produção.

O objeto é a **Expanded local do recorte autorizado pela DEC-ZOOM-05**. Revisão feita por leitura do diff real, reconciliação independente dos brutos e controles dirigidos. As conclusões do executor não foram tomadas como prova. [Cobertura](COBERTURA.md), [matriz15](MATRIZ-15.md), [recibos e deltas pós-candidato](RECIBOS.json) e [limites do observador](OBSERVADOR.md) permitem conferir este parecer.

## A — Correções operacionais: aprovado

Os 15 XML/logs originais foram conferidos individualmente: 14 falhas primárias de launch Chromium/ENOENT e 1 falha primária Next/Turbopack por caminho excedido, anterior à readiness. As assertions Java de saída/readiness eram derivadas. Não foram atribuídas ao produto financeiro, aos componentes Linux ou aos artefatos nas fontes.

O contraste foi repetido nesta revisão: mesmo executável SHA-256 addfa79abb060e1e514e155ed745d4bf96140bca402735958bb4e223aea0b98c, caminho antigo de 274 caracteres/ENOENT e caminho atual de 174/launch real. Page/title/screenshot/download sintético e close passaram. Nenhum SUBST é usado. A cópia executada C:\cf-exp\1104d\s e os temporários curtos são físicos; a junction E2E resolve para esse mesmo frontend e foi conferida por realpath.

Nove configs foram listados novamente com saídas externas; os 9 wrappers alterados usam BrowserEvidence.directory. As saídas de mídia/download/reporter, os processos filhos Next e as cópias preparadas foram inspecionados. Browser/cache0/TEMP são explícitos, herdados dos lançadores registrados. CF_SOURCE_ROOT é fornecido pelo controller e evita calcular a raiz a partir de cwd divergente. Contratos de alias/junction e rejeição de saída nas fontes passaram. A jornada original CF023 com Next preparado foi aprovada na full recebida, inclusive assertions SQL de duas contas/owners; não houve repetição dessa jornada nesta revisão.

Os 24 artefatos antigos foram preservados byte a byte: 7 de frontend-closure, 4 de rf15-independent e 13 de rv24. Seus produtores são os outputDir/reporter Playwright desses configs. Novos destinos, respectivamente: all/browsers/FrontendClosureBrowserTest/frontend-closure, all/browsers/Rf15IndependentBrowserTest/rf15-independent e all/browsers/Rv24CreationBrowserIntegrationTest/rv24, sob C:\cf-exp\1104d. O mailbox de recuperação foi externalizado para evidence/mailbox. A nova execução manteve 863 inputs sem arquivos adicionais; o guard continua rejeitando saídas indevidas, demonstrado em cópia isolada. .gitignore/source.mjs não foram relaxados no intervalo.

A falha adicional do caso semanal na focused foi tratada separadamente. Reload antes de confirmação não prova cancelamento; a microprova inicial de abort falhou e permanece preservada. O controle posterior com resposta retida sustenta aguardar o mesmo POST/HTTP200 antes do reload. O diff acrescenta essa espera e mantém fixtures, UI, progresso 1→0 e assertions anteriores. Controles 6+1 precederam a full. A persistência atual registra a meta semanal em 0.00. Não houve alteração de produto.

O adaptador Maven local é explícito: Maven3.9.12/JDK21, Java@argfile, encoding nativo estrito1252 neste ambiente. O controle atual executou JDK21 com argumento acentuado, rejeitou caractere não representável antes de criar arquivo, e os contratos preservam seleção longa/injeção multiline. A portabilidade tem custo: depende do contrato documentado de toolchain/raiz curta e requer novo preflight se esse ambiente mudar. Não há garantia universal de prefixos Windows.

## B — Expanded local: aprovado no recorte autorizado

- 116 classes obrigatórias =115 comuns + AdoptionNativeSocketsTest Windows uma vez. Seleção calculada pelo HEAD coincide exatamente com a seleção executada.116 XML,928 elementos testcase e928 identidades únicas;0 falhas/erros/skips, nenhuma classe ausente/extra e nenhum elemento rerun/flaky.
- Os 15 métodos originais reaparecem na full e passaram. A focused anterior preserva14 aprovados/1 falha, sem substituição de seus relatórios.
- RF15:25 originais =2 adiados +23 obrigatórios. Projeto, arquivo e cadeia de títulos exatos reconciliados com listagem, manifest, seleção, invocation e resultados.23 aprovados, um resultado por caso e0 skips/retries/flaky. Pertencem ao wrapper Java Rf15RemediationBrowserTest e não são cobertura independente adicional aos928.
- E2E financeiro:1 wrapper Java separado e13 identidades browser coincidentes com a listagem atual, sem retry/skip.12 checkpoints SQL recebidos foram reconferidos: aplicação/recibo, efeito único após perda de resposta/replay, isolamento A/B, legado e reversão de hábito nos3 fusos. Reload/nova sessão e chamadas reais BFF/Spring/PG permanecem nas assertions; doubles externos e observador SQL não neutralizam o fluxo central.
- Componentes Linux:626 IDs Vitest únicos,626 inícios/fins,71 arquivos e0 erro/skip/worker perdido. Há625 chaves arquivo+título por colisão histórica de dois parâmetros; o multiconjunto coincide com JSON/audit/seleção. Os 2 overlays de marcas síncronas têm inverso igual ao corpo original e hashes registrados. Não demonstram retrospectivamente a causa dos 2 timeouts históricos, que segue inconclusiva.
- Componentes Windows:626 ocorrências/71 arquivos, JSON/audit/contexto/exit0 aceitos pelo validador final. Ambos os aceites foram reaproveitados por igualdade dos inputs frontend, dependências, configs/seleção e preload compartilhado. O diff posterior não altera esses inputs. Nenhuma nova execução dos 626 foi feita por hábito.
- Frontend recebido: lint/tipos/build e18 execuções temporais nos3 fusos do sync03 conferidos. O frontend é composto por reuso explícito de instalação/componentes/browser e novas etapas afetadas. Backend/E2E/pacote compartilham controller/runId 26daab35-a0aa-49f4-9830-7fc3ac6fb665.

Os 116 XML têm mtime entre 04:30:00.041Z e 05:05:15.220Z, dentro da etapa backend iniciada 04:26:32.194Z/duração 2330673ms. Nenhum deles é byte a byte o XML antigo correspondente. Isso é apoio à atualidade, junto de freshOutput, diretórios novos, logs/comandos, hashes e contexto; timestamp isolado não constitui proveniência. Preparações a/b/c/d, falha de encoding, focused, microprovas e parada inicial de cleanup estão preservadas. A full 116 efetiva começou uma vez após controles corrigidos. Não se observou retry oculto ou substituição de relatório falho.

## C — Proveniência: aprovado com identidades separadas

| Objeto | Identidade / evidência |
|---|---|
|Intervalo examinado|03028231a7c1cbb9a2532adadd2ea1b9e1ea643e..9334264d4d96e8b64a2de16090ef4c5a77496441|
|HEAD recebido|9334264d4d96e8b64a2de16090ef4c5a77496441; branch codex/saneamento-pr3-expanded; árvore inicialmente limpa|
|Candidato executado e produtor do JAR|95118407cfe684430421d7f5c4b613a99d2b55d0|
|Manifest de inputs|C:\cf-exp\1104d\s\.ci-source.json;863 arquivos; digest7d1277b5daa3e86e54e6a46a88b79f18159bc77c91af10d9b3f01e634c65aa4a|
|Manifest do pacote|C:\cf-exp\1104d\all\package-manifest.json; commit/digest/863 arquivos/gates/argv/dependências|
|JAR local|C:\cf-exp\1104d\all\api-0.0.1.jar;86235083 bytes|
|SHA-256 do JAR|564f87cd83f2b7ddd793b0cded03ac64080647b5522355dc88b27ce218497be9|

Hashes completos e ancestralidade base→candidato→HEAD conferem. Os 863 arquivos do candidato correspondem aos objetos Git: 32 byte a byte e 831 somente com conversão LF/CRLF do checkout. Os bytes físicos são os hashes do manifest, não hashes normalizados. O guard foi aplicado antes/depois dos controles novos. Nenhum pacote ou manifest foi reetiquetado.

Depois de 95118407 houve documentação/recibos, scripts operacionais executáveis de coleta/continuação/observação e a alteração de .github/scripts/component-reuse.mjs com seu contrato em ci.test.mjs. Não se classifica todo esse delta como documentação. RECIBOS.json discrimina cada arquivo e SHA. O runner ci.mjs, produto, wrappers, jornadas e inputs do pacote não mudaram nesse intervalo posterior.

O reforço d0c22c1b87826aedbf17fc171d32e5ebd5ed5ac3 inclui tests/e2e/support/server-clock.cjs na fronteira do reuso: um componente de credenciais faz preload desse arquivo. O validador anterior poderia aceitar drift nesse input. Isso não invalida esta rodada: o arquivo é igual nas bases Linux/Windows e no candidato, e a comparação final foi reaplicada às provas preservadas.46 contratos novos nesta revisão passaram; a contraprova de drift foi rejeitada, assim como identidade ausente, skip, falha e contexto incompatível. O reforço é comprovado no HEAD por esses controles; a Expanded e o JAR continuam atribuídos a95118407.

O verify produziu o JAR após o backend; marker backend e bytes atuais coincidem. Coleta do pacote ocorreu depois do E2E e do guard. O SHA correspondente comprova vínculo dos bytes recebidos, sem afirmar reprodutibilidade binária, execução standalone desse JAR, imagem de release ou artifact remoto. Não se exige recompilação apenas para trocar o rótulo do commit.

## D — Publicação controlada e CI remota: aprovado para encaminhamento

O intervalo revisado pode ser encaminhado, em etapa posterior autorizada, para atualização controlada da PR #3 e execução remota. Não é necessário novo saneamento de produto antes desse encaminhamento com base nas provas deste recorte. A falta de execução remota não é impedimento circular para recomendar a própria validação remota.

Linux/Actions foi avaliado por inspeção: invocação sh/mvnw permanece separada do adaptador Windows; paths usam resolução física; artifactDirectory não depende de PowerShell; configs/seleções/required possuem contratos aprovados. Workflow mantém job Windows nativo, job Linux e expanded dispatch explícito; required rejeita skipped quando a expanded é obrigatória. Isso sustenta tentativa remota, sem certificá-la. Seus resultados, coleta sanitizada/pacote remoto e orçamento de 45 min precisam ser observados no ambiente remoto.

Próximo passo concreto: publicar somente o intervalo aprovado e os registros desta revisão na PR #3, após autorização própria; executar checks Windows/Linux e dispatch expanded no SHA publicado, conferir required e artifacts/proveniência. Qualquer delta executável posterior requer análise de impacto. Merge/main continuam sem aprovação por este parecer.

## E — Pendências externas: parcialmente aprovado quanto à delimitação

Continuam sem execução/aceite nesta revisão: zoom nativo 200% das duas identidades DEC-ZOOM-05; backend Linux/GitHub Actions/checks e artifacts remotos; CF034 integral; CF017/P01/P02; homologação, adoção real, imagem/release, deploy e produção. Aceite parcial de delimitação não equivale a teste externo aprovado.

As únicas dispensas são review-sao-paulo / cf015.native-zoom.integrated.spec.ts / “R10: zoom nativo 200% com ações, rolagem e foco” e review-sao-paulo / rf15-native-chrome.integrated.spec.ts / “RF15: zoom nativo Chrome 200% com ações, rolagem e foco”. Os títulos exatos com espaçamento estão no manifest canônico, em reconciliacao/controles e na DEC preservada. CF010/CF015 continuam pendentes no alcance de zoom. Nenhuma intervenção humana de zoom foi solicitada e nenhuma dispensa foi ampliada.

## Achados e sugestões

**Bloqueantes confirmados: nenhum neste recorte.** Limites de execução remota, zoom e adoção são pendências externas acima, sem achado financeiro inferido.

Sugestão não bloqueante P3: o título parametrizado em controle-financeiro-frontend/src/services/onboarding/contract.test.tsx:46 gera duas chaves “rejects invalid envelope/session {}”. Os626 IDs e a multiplicidade foram demonstrados; não há teste ausente. Em lote próprio, nomear explicitamente parâmetros simples/inherited melhora rastreamento sem alterar a regra ou expected. Encerramento: nomes distintos e mesmo conjunto de entradas/assertions.

Sugestão de manutenção, sem defeito atual: componentInputs contém uma dependência compartilhada explícita. Quando novos imports/preloads cruzarem tests/e2e, atualizar a fronteira e sua contraprova. Igualdade de hashes custa O(bytes) mais ordenação O(F log F + T log T); a resolução física percorre ancestrais O(profundidade). Não houve alteração de queries, concorrência de produto ou domínios que justifique refatoração financeira neste lote.

## Preservação e evidências novas/reaproveitadas

Novas: 46 contratos,25 controles dirigidos,10 listagens,12 checkpoints SQL lidos independentemente,258 referências diretas por SHA e reconciliação de 2340 referências; análise dos863 inputs contra Git e dos928 testcase. Reaproveitadas: execuções backend116/928, RF15C23, E2E13, componentes Linux/Windows626/71, frontend/sync03, provas de preflight/Next/causalidade e acervos de falhas. Revalidar provas não é reexecutar esses testes.

2321 das 2340 referências permanecem iguais no local; 19 deltas autorizados têm originais arquivados pelo SHA inicial e bytes finais corretos. 24 artefatos antigos intactos. README principal inicial/final 6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca; README da worktree inicial/final e7d3458fbd8ac227520be27996ce23c73e8c3be2086d8cfbd51ad59568f4cee0. O principal conserva HEAD c16e6545488c8f13efda4dab9efa8aa896fcddaa, branch codex/saneamento-cpa01-selecao-testes e apenas M README.md. O README não entrou no staging.

Somente a pasta própria desta revisão recebeu arquivos novos. Brutos/mídias/clones ficam no runtime privado de RECIBOS.json, sem novos inventários históricos recursivos. Docker mantém baseline 8 contêineres/3 redes/0 volumes; 0 workers próprios. Nenhum recurso alheio encerrado, arquivo histórico removido, .r3 recriado, reset/git clean, push, PR/CI remota, merge, hospedagem, deploy ou banco real. Commits da revisão são locais e documentais/de provas; seu intervalo e HEAD final são entregues no recibo Git final externo e na resposta ao usuário.

Commit local das provas: bd3dd4ad4e2443871f5c4c0a1baf800764bbc2e3. O commit deste parecer é seu sucessor documental; consultar git-final.json privado para o hash final sem referência circular.
