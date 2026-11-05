# Reprodução e proveniência

Candidato dos inputs executados: 4204080aa9b2fa46c52f9d1ef6638b77231087fd. Decisão: 56f41bce, sobre base 64b0cb4c00e9d5905a9b87814143a33df415db97. Digest das 855 fontes de execução: 310680d084a72cebd66e01fd400c79f5eeeac1d0639cb5c281f5d3a187183164. Cópias físicas s e linux/s têm os mesmos bytes, sem transformação de caminhos no código. .ci-source.json registra arquivos/hashes; nenhum .env, credencial, target, cache ou relatório antigo foi copiado. Runtimes históricos e pacote assistido 06 não foram usados como fontes nem como aprovação nova.

Runtime privado novo: C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/preparacao-adocao/excecao-zoom-expanded-20261103-01. Os manifests s-export.json e linux-s-export.json vinculam cada fonte ao candidato; initial.json referencia os acervos protegidos.

## Contratos e contraprovas

Na worktree, node --test .github/scripts/ci.test.mjs .github/scripts/suites.test.mjs .github/scripts/sanitize.test.mjs .github/scripts/required.test.mjs .github/scripts/zoom-coverage.test.mjs. Mesmo comando executado no contêiner Linux. Contraprovas isoladas em contracts/<nome>/; cada mutant.log precisa terminar reprovado por assertion, restored.log aprovado e hash restaurado igual ao original. Não alterar módulos da worktree para reproduzir mutações.

## Windows nativo e frontend suplementar

Java: instalação JDK21 histórica apenas lida no checkout principal (target/temurin21/jdk-21.0.12.1+1); Node 24.18.0. JAVA_HOME/PATH explicitados e MAVEN_ARGS=--offline. CF034_SUITE=expanded. Comando canônico: node .github/scripts/ci.mjs windows-native <cópia-s> <out-novo>. Execução real usou Z:/s e Z:/windows-native, mapeamento reversível de Z: para o runtime novo; não moveu worktrees nem criou .r3.

Frontend suplementar: node .github/scripts/ci.mjs frontend Z:/s Z:/frontend. Preservou primeira falha de build: Turbopack resolveu o arquivo físico fora da raiz Z:. A falha é de topologia do runtime/mapeamento, não prova de defeito visual/financeiro. Não repetir este build nem adotar mapeamento de unidade como equivalente a caminho físico em futura reprodução Next. Nenhum timeout/retry/assertion foi alterado.

## Linux em Docker local

Imagem local cf-excecao-zoom:20261103-01, ID sha256:c7492c6f8ef9a57a98ff15dc7a6c82a96712b99a97a5fa19edb9576a7b34d5b1. Base Playwright fixada em mcp/playwright@sha256:8771dc4666e7c11440bfc6a0c6b00480e9a15b8891b45f29a52d7d995f8d1492 e JDK copiado internamente da imagem eclipse-temurin@sha256:85f00967bcc624fc19fa9c2cf124ea426a5363898e267141726f31f358c2e14b. Node Linux 24.18.0 extraído do arquivo oficial, hash conferido contra SHASUMS256.txt antes de construir. Dockerfile, arquivo/hashes e logs preservados em toolchain/.

Preparação preservou falha de docker cp por link simbólico sem privilégio no Windows e falha de extração por xz ausente na imagem. Uma tentativa auxiliar encontrou Python indisponível. Solução de preparação: extrair somente binário Node com tar.exe do arquivo já verificado e copiar o JDK entre imagens Linux, sem instalar ferramenta extra no host. Essas ocorrências precedem os testes e não são passes de testes.

linux/invocation.json contém argv exato de docker run, mounts e configuração não secreta. linux/run.sh registra a sequência. Contêiner próprio excecao-zoom-expanded-linux-20261103-01, /work ligado somente ao runtime linux, socket Docker para Testcontainers, cache Maven existente somente leitura em /m2, sem env de aplicação real. DOCKER_HOST=unix:///var/run/docker.sock; TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal; MAVEN_USER_HOME=/m2; MAVEN_ARGS=--offline -Dmaven.repo.local=/m2/repository; CF034_SUITE=expanded.

Controlador: node /work/s/.github/scripts/ci.mjs all /work/s /work/expanded. JVM Linux e navegador executam no contêiner local; PostgreSQL é descartável e usa os inicializadores/fixtures originais. Isso não é GitHub Actions nem comprova runner remoto. Se alcançada, a aplicação Spring dos testes executaria dentro desse contêiner; nesta rodada essa etapa não foi alcançada. A imagem de ferramentas não é JAR implantado nem release da aplicação em Docker. O estágio e2e/package só é alcançado após frontend/backend aprovados, sem reusar markers de outro candidato.

Nenhuma primeira falha pode ser apagada por teste posterior. Se o conjunto não terminar, listar etapas/identidades não executadas e manter expanded sem aprovação. Reprodução futura exige runtime novo e autorização do escopo correspondente; estes comandos documentam uma execução local, sem push/CI remota/merge/deploy.
