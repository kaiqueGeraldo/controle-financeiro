# Reprodução e proveniência

Worktree: C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-worktrees/pr3-expanded-source; principal não é fonte do candidato. Runtime novo: C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/preparacao-adocao/saneamento-expanded-plataformas-01.

## Diagnóstico dos inputs antigos

linux-diag.sh copia fisicamente os inputs4204080a/dependências da exportação anterior para filesystem Linux nativo; oito arquivos29/29. linux-full-bind.sh e linux-full-native.sh usam mesmos inputs/pool/reporters; só muda a topologia de fontes. Imagem diagnóstica b0d7d46ca7e99280abaf27ed48b83d4bdf4f3b1db445405d877ce150b36343d3 conserva essa cópia. stdout/stderr separados, audit JSON, exit e memory.events de cada controle ficam no runtime. A imagem contém dependências antigas para diagnóstico, não é pacote corrigido ou release.

Windows: w/before-logs/execution.json e w/after-logs/execution.json registram node node_modules/next/dist/bin/next build, cwd e exit. Y: aponta só para o runtime novo; o primeiro cwd foi lógico e o segundo físico. Nenhuma limpeza de .next: cada cópia recebeu saídas próprias, ambas preservadas. Nenhum caminho pessoal foi adicionado à configuração do produto.

## Contratos e contraprovas

node --test .github/scripts/ci.test.mjs .github/scripts/suites.test.mjs .github/scripts/sanitize.test.mjs .github/scripts/required.test.mjs .github/scripts/zoom-coverage.test.mjs .github/scripts/paths.test.mjs .github/scripts/components.test.mjs

43/43 em Windows e na rodada Linux. contracts/ contém baseline, quatro módulos mutantes, logs vermelhos e controles restaurados por SHA-256: ignorar erro global; omitir caso; perder arquivo; voltar a raiz lógica. Não houve mutação de código da worktree para obter esses resultados. synthetic-unhandled.sh demonstra, apenas em fixture sintética, JSON success com erro global e rejeição pelo novo gate.

## Inputs corrigidos e expanded

Inputs executados:0aac7ccd25934ec022939464486da9fb28610279;860 fontes, digest d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660. corrected-inputs.json e inputs/.ci-source.json contêm cada arquivo/hash. O commit posterior a30bc331 altera somente o orquestrador externo, para copiar os arquivos do manifest em vez de trazer artifacts Windows; os860 arquivos de fonte do app/runner não mudam. expanded-01/invocation.json registra o hash exato do orquestrador realmente usado e a imagem c7492c6f8ef9a57a98ff15dc7a6c82a96712b99a97a5fa19edb9576a7b34d5b1. Não atribuir os resultados a outro pacote/HEAD sem essa relação.

Windows obrigatório: CF034_SUITE=expanded; JDK21 e MAVEN_ARGS=--offline; node .github/scripts/ci.mjs windows-native <runtime>/inputs <runtime>/windows-native. Usou caminhos físicos, passou1/1 e produziu XML novo. Linux: node tasks/evidencias/saneamento-expanded-plataformas/executar-linux.mjs <runtime>/inputs <runtime>/expanded-01 cf-excecao-zoom:20261103-01. O script é a reprodução exata dessa rodada **reprovada**, não uma declaração de compatibilidade atual da topologia Docker Desktop.

O executor monta inputs como somente leitura, copia apenas o manifest para /work/s nativo e instala o lock em diretório novo. Apenas /evidence usa bind Windows. Maven cache existente montado somente leitura; Docker socket dá acesso a Testcontainers descartáveis; ambiente do app real não é importado. O all roda seus gates na ordem real. Não reutiliza target, .next, relatórios ou markers. Container parado preservado: saneamento-expanded-54f13fc7-feca-468a-942c-2cacdd00c69b.

loopback-diagnostic/invocation.json registra outro controle, não integral, com host network/127.0.0.1 e duas classes. A imagem built-01 preserva os compilados dos inputs0aac7ccd somente para diagnóstico; não é JAR aprovado. Os dois layouts falharam antes das23 jornadas RF15 reais. selection-current prova apenas listagem A25/B2/C23 no candidato, sem executar zoom ou jornada real.

Node24.18.0 nas duas plataformas; npm11.16.0 Windows/10.9.8 Linux; Next16.1.6, Vitest4.1.11, Playwright1.63.0. Windows JDK21.0.12.1+1; Linux Temurin21.0.12+8; Maven3.9.12; Docker29.6.2; Testcontainers2.0.3; Chromium153.0.8010.12/revisão1243 instalado. Versões e comandos originais estão nos recibos/logs privados. Instalação não certifica jornadas de navegador. Nenhum JAR novo foi produzido. Execução local não certifica GitHub Actions.
