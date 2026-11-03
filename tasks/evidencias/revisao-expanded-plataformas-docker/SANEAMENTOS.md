# Saneamentos e proveniência

## Frontend Linux

Os logs brutos de linux-full-bind mostram seis timeouts de inicialização de workers; memory.events mantém oom/oom_kill=0. A auditoria registra 71 arquivos esperados e 65 coletados; o JSON reporta 575 passes. O controle preservado linux-full-native usa os mesmos inputs, pool e seleção em filesystem Linux nativo e registra 626/626 em 71 arquivos. Não se atribui essa mensagem à primeira ocorrência histórica.

A rodada corrigida expanded-01 também registra 626/626 em 71 arquivos, com auditoria completa, sem erros/skips, antes de o backend reprovar. A revisão comparou cada identidade com o conjunto Windows original; todas as 29 ausentes do primeiro Linux foram recuperadas. Os 71 arquivos incluem 64 em tests/component e sete em src, conforme o config versionado. COBERTURA.json contém arquivos e identidades. Isso é cobertura de execução da seleção, não percentagem de cobertura de linhas ou prova de todas as regras do produto.

O primeiro episódio de 597/29 não reteve o erro global. Está demonstrada a classe de mecanismo na reprodução atual e a recuperação exata das identidades; continua desconhecida a mensagem/causa histórica exata e não se inventou medição dos workers originais.

O executor monta inputs como leitura e copia somente as 860 entradas do manifest para /work/s nativo. Npm ci instala o lock no diretório novo; dependências e fontes antigas da imagem não são usadas como fontes do candidato. .github e .mvn/wrapper, incluindo arquivos ocultos, estão no manifest. sourceFor verifica bytes e conjunto antes dos gates; source-after-backend.log preserva a reconferência da cópia. O bind Windows é usado para evidências, não para fontes/dependências. Relatórios voltam ao runtime próprio, sem reutilização de target/.next/markers.

A revisão conferiu todos os bytes do export com a worktree e os blobs Git normalizados do commit de inputs: 860/860. Não há colisões de caixa. O wrapper Maven é invocado com sh no Linux, sem depender de bit executável Windows. Não foram acrescentadas fontes não versionadas. Os probes sintéticos desta revisão usaram dependências existentes somente para testar observadores/CLI, em roots próprios; não foram apresentados como execução do produto.

## Build Windows

O erro bruto preservado aponta eslint.config.mjs no caminho físico fora da raiz lógica Y:/w/before, durante a transformação de globals.css no Turbopack. A invocação anterior tem cwd lógico e exit 1; a posterior tem cwd físico e exit 0. Conferidos 372 arquivos frontend antes e depois contra o mesmo manifest histórico; os 373 arquivos finais incluem somente o novo reporter e correspondem aos inputs corrigidos.

A correção usa physicalPath/realpathSync.native na entrada, cwd derivado e saída do runner. Para outputs ainda inexistentes, canonicaliza o ancestral existente e acrescenta o restante. Não há caminho pessoal fixo, alteração de import, Next, TypeScript ou exclusão de arquivo legítimo. O teste de fronteira de saída continua recusando evidências dentro da fonte por ambas as direções de alias.

Uma nova unidade SUBST, limitada ao runtime próprio e removida ao final, demonstrou que raiz lógica e caminho físico resolvem para a mesma identidade e que outputs novos são canonicalizados. A mutação para caminho lógico foi rejeitada e restaurada por hash. Os builds não foram repetidos: a prova antes/depois e lint/tipos/build final aprovados já estavam preservados em cópias distintas, sem reaproveitar outputs.

## Candidato e artifacts

Inputs executados: 0aac7ccd25934ec022939464486da9fb28610279; 860 arquivos; digest d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660. A alteração a30bc33187a8214471e6e1bdd4deadae37886d6a é do orquestrador externo; seu hash ad7efca8a96ef8da46bea1f8362bb892022c5e39f29a12e851491a2cd9e4bdd1 coincide com a invocação. Até f8eff56 não houve delta nos inputs app/runner/decisão/fixtures, apenas documentação e esse orquestrador externo.

A imagem toolchain da expanded é sha256:c7492c6f8ef9a57a98ff15dc7a6c82a96712b99a97a5fa19edb9576a7b34d5b1. Node24.18.0, Next16.1.6, Vitest4.1.11, Playwright1.63.0; Linux JDK21 e Maven3.9.12; Testcontainers2.0.3. Os logs de cada ambiente preservam versões e comandos.

O result.json reprovado demonstra instalação, lint, tipos, três fusos/18 unitários, componentes, build, instalação de browser e Maven/backend. Maven verify parou nos testes. RF15 real23, E2E financeiro e empacotamento não foram alcançados. Não há artifact/package-manifest dessa rodada nem JAR novo produzido; pacotes antigos preservados não pertencem a ela. O diagnóstico loopback posterior não retoma nem aprova a rodada.

A revisão nova executou apenas contratos, contraprovas, preflight e duas classes dirigidas: guard4 + consumidor5, zero erros/falhas/skips. Maven test desta prova não empacotou a aplicação. A nova rodada integral ainda não foi executada.
