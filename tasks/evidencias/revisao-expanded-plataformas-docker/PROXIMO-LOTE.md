# Próxima rodada delimitada

Apta para iniciar uma **nova expanded local no Windows nativo**, com Docker Desktop/contexto desktop-linux e daemon2455a676-938f-48d8-a0ef-67c98474314d. O preflight e um consumidor Spring real passaram nessa topologia. A configuração Linux sibling original permanece incompatível com o guard. A próxima rodada não é retomada aprovada da execução reprovada e não recebe resultados por herança.

Script preparado, **não executado nesta revisão**:

```powershell
powershell.exe -NoProfile -NonInteractive -File 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-worktrees\pr3-expanded-source\tasks\evidencias\revisao-expanded-plataformas-docker\proxima-rodada.ps1' -Runtime 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\revisao-plataformas-docker-next-windows-01' -Java21 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro\controle-financeiro-backend\target\temurin21\jdk-21.0.12.1+1'
```

O processo recebe JAVA_HOME/JDK21 no Path, MAVEN_ARGS=--offline, CF034_SUITE=expanded, DOCKER_HOST=npipe:////./pipe/dockerDesktopLinuxEngine, DOCKER_CONTEXT=desktop-linux, TESTCONTAINERS_HOST_OVERRIDE=127.0.0.1, reuse=false e Ryuk ativo. Não altera variáveis globais do usuário. O script recusa runtime existente, caminho fora da raiz e daemon diferente; se infraestrutura/configuração mudar desde o preflight, revalidá-la antes de executar. O cache Maven existente é dependência, não fonte de outputs antigos.

preparar-proxima.mjs verifica os860 bytes contra o manifest referenciado, recusa alteração de fonte e cria exportação nova só de fontes. Digest obrigatório d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660. O candidato do novo manifest é o HEAD documental local atual, com vínculo explícito aos inputs0aac7ccd25934ec022939464486da9fb28610279; nenhum resultado antigo é transferido. Se a implementação mudar, esta preparação deve recusar e será necessária nova revisão do delta/manifest.

O runner usado é o ci.mjs canônico, stage all. No Windows, a seleção expandida é o conjunto completo116, em lugar da divisão115 Linux +1 Windows do ambiente anterior. Isso usa o contrato existente e foi confrontado por conjuntos; não altera selector ou dispensa classe. RF15 conserva A25/B2/C23 e exige resultados atuais de C; B continua apenas adiado.

## Gates obrigatórios da rodada completa

1. Instalação limpa pelo lock, lint sem warnings, tipos, unidade nos três fusos, componentes com auditoria completa e identidades626/71, build e browser-install.
2. Maven verify com as116 classes selecionadas, todos os relatórios XML atuais, zero erros/falhas/skips; guard e consumidores reais. O wrapper RF15 deve produzir listagem A, manifest, seleção C, receipt de invocação, JSON atual das23 jornadas e verificação exata, sem retries/skips.
3. E2E financeiro integrado após frontend/backend atuais, com relatório Java e Playwright, persistência/reload e zero skips/flaky.
4. Pacote somente depois de todos os markers atuais: exatamente um JAR novo, hash igual ao backend verificado, package-manifest com fontes/decisão/gates e result final aprovado. Sanitização/coleta pública, caso solicitada depois, preserva brutos privados e seus hashes.

Conservar result.json, comandos/ambientes/exit, manifest860, backend-selection, XML, componentes JSON/audit/eventos, RF15 universe/selection/manifest/invocation/results/verified/process, E2E e package-manifest. Ausência ou falha interrompe a sequência; não executar etapas posteriores manualmente para alegar rodada integral aprovada. Coletar/confirmar cleanup e preservar a primeira falha, sem retries até passar.

A execução integral exige um novo pedido de lote, pois o pedido desta revisão a proíbe. Não é necessária nova autorização da exceção de zoom nem alteração global de infraestrutura para a alternativa Windows comprovada. Push, PR, CI remota, merge, deploy, hospedagem e banco real continuam fora desse comando e desta autorização. CF-017/P01/P02 e aceites visuais mantêm critérios próprios.
