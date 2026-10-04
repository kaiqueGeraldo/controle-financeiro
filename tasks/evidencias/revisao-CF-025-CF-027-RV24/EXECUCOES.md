# Execuções novas e reprodução

Data 03/10/2026, America/Sao_Paulo. Base `06c1a51`; comandos da raiz salvo indicação. Não executar clean nem comandos destrutivos históricos. Nenhum timeout/assertion foi relaxado, nenhum teste de produto ganhou skip. Contagens sobrepostas não são somadas.

## Ambiente e isolamento

Node24.18.0, Vitest4.1.11, Next16.1.6, JDK21 restaurado já existente, Maven wrapper do projeto, PostgreSQL16-alpine/Testcontainers. Copiou-se o JDK inteiro para temporário externo a target antes de executar; caminho local em runtime-path.txt. Runtimes/fontes de contraprova não são colocados em outputs de build. Cópias temporárias únicas são preservadas; evidências novas exportadas para esta pasta.

PostgresTestContainerInitializer sobrescreve datasource com container aleatório `cf_test_*` e DisposablePostgresGuard; não há fallback externo. Profile test, email/market em MockitoBean; regras financeiras/ORM/controllers reais. Runner browser usa porta Spring aleatória, namespace aleatório, Next/BFF local, Chromium instalado, relógio sintético15/01/2027 e SP. O harness escolhido foi lido antes de executar. Skill vercel:agent-browser consultada; CLI não encontrado no PATH, usado Playwright já instalado do projeto. Não se instalou ferramenta.

Adaptações nos scripts desta pasta: runtime externo/nomes/destinos novos, cópia em temporário, seleção CF025 adicionada ao gate CF027. O runner Java da cópia aponta para frontend/config externos e exporta SQL nesta pasta; teste de exclusão muda apenas destino da evidência. Assertions/expected/timeout e dados originais permanecem. Probes da revisão anterior são copiados literalmente. Fontes da aplicação principal permanecem no candidato, conferidos por verify-review.cjs.

## Resultados

| Evidência | Comando/resultado | Interpretação |
|---|---|---|
| components.log | `node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts`, frontend; exit0,236/236,42 arquivos | Gate do candidato original; **não inclui** o probe novo vermelho que fica na pasta de evidências |
| typecheck.log/static-results.json | `node node_modules/typescript/bin/tsc --noEmit --incremental false`; exit0 | Sem exclusões/ignores novos |
| lint.json | `node node_modules/eslint/bin/eslint.js --format json --output-file <esta pasta>/lint.json`; exit0,247 arquivos,0/0 | Configuração original |
| unit.log | `node scripts/test.mjs`, frontend; exit0 | 6 testes em cada fuso SP,UTC,Kiritimati |
| build.log | `node node_modules/next/dist/bin/next build`; exit1 | Falhou download externo de Geist/Geist Mono; não é regressão funcional |
| build-network.log | Mesmo build com acesso à rede autorizado; exit0 | Artefato de produção local, sem deploy |
| validation/backend-verify.log | `run-validation.ps1 -RunName validation`; compilação impedida no cache Maven | Não executou testes; o coletor posterior também não encontrou surefire-reports. Preservada primeira falha, não classificada como vermelho causal |
| validation-authorized/ | `run-validation.ps1 -RunName validation-authorized`, acesso Maven/Docker autorizado; verify exit0,210/210 | Seleção literal em selection.txt; inclui CF0257, CF02430 e runner6 browser. Métricas/planos copiados do target da cópia para evidência durável |
| invalid-responses/ | `run-invalid.ps1 -RunName invalid-responses -InvalidResponses`; exit0,runner1/1,6 jornadas | POST real antes de corromper resposta e GET real antes de esvaziar result; SQL/reload intactos |
| original-before.log/original-proof.json | Na cópia frontend, substituir hook/creationIntent/dois modais por `git show a8c3724:<path>`; executar rv24-independent-review | 5 falhas causais/1 passa; SHA original idêntico ao executado |
| original-restored.log | Restaurar os4 fontes da cópia; executar rv24-independent-review + rv24-residual | 43/43, sem skips; hashes restaurados iguais ao workspace |
| financial-result.log | Primeiro probe com alias/setup externos à raiz temporária | Erro de import /@fs, zero testes. Não usado como demonstração de defeito |
| financial-result-causal.log | Cópia local de src/tests/config, mesmo probe e expected | 3 falhas/1 passa; confirmed e intenção apagada com total999 |
| frontend-probes/ | `run-frontend-probes.ps1`; execução isolada reproduzível | Bruto:3 falhas/1 passa. CF026 histórico:9 falhas/14 passam +2 rejeições null causais. Geração:4 falhas,19 não selecionados por filtro. Restauração23/23 |
| backend-probes/ | `run-backend-probes.ps1`, acesso Maven/Docker autorizado | 4 testes/4 falhas/0 erros/0 skips nas mutações; restore39/39 incluindo hábitos27, calculador7, temporal1 e4 restaurados |

Os dois unhandled rejections do histórico CF026 são os erros de produto `null.message`/`null.response`, não imports ou ambiente. Os19 casos não selecionados em `-t cleanup` são apresentados pelo Vitest como skipped apenas nesse experimento; a execução restaurada roda todos23 sem skip. Não alegar mutação de todos os testes.

## Qualidade e proveniência

Resultados esperados vêm dos critérios/oráculos: 30×10=300; páginas20+10; uma criação/recibo por identidade; duas criações iguais deliberadas são duas operações; 2×100=200; HALF_UP1.005→1.01; efeito/recibo juntos no rollback; nenhum owner alheio. Teste não importa a fórmula produtiva para produzir expected. Os probes de parser/componentes usam doubles HTTP e não certificam banco. Jornadas integradas não interceptam sucesso falso: executam o backend antes de alterar a resposta.

Contraprovas backend mudam somente: specificDays LAZY→EAGER; referência proibida no consumidor; MANDATORY→REQUIRES_NEW; recuperação sem filtro owner. Cada falha é de assertion própria, não bootstrap. Três fontes restaurados em finally, hashes registrados. Maven executado sequencialmente, sem compartilhar banco mutável entre runs. Fontes restaurados não são confundidos com classes compiladas mutantes: o run verde recompila antes de executar.

run-frontend-probes.ps1 reproduz o achado novo e contraprovas CF026 em outra cópia, sem instalar dependências; node_modules é junction para dependências existentes. As contraprovas originais RV24 foram executadas separadamente como descrito na tabela, sem alterar bytes do teste original.

Logs e SQL preservam dinheiro/IDs/status/assertions. Sanitização remove somente credenciais/tokens sintéticos quando presentes; manifesto registra hashes original/publicado. Não publicar relatórios XML brutos com system properties. Arquivos verification.json e intervalos.txt documentam fontes exatas, adaptações e ancestralidade. O incidente target antigo permanece histórico: não se reivindica recuperação dos outputs originais.

Capturas efetivamente inspecionadas: validation-authorized/browser/transaction-lost.png (duas despesas25/subtotal50) e investment-unavailable.png (posição avaliada1400), além de suas equivalentes da variante inválida. São estado carregado após reload; não aprovam matriz visual completa/zoom/mobile. Somente essas quatro capturas pequenas são versionadas; demais PNGs permanecem locais fora de target, hashes em verification.json. Sem CI remoto nesta rodada.

Não houve nova ocorrência de ECONNRESET, RVA-03 ou H24-01 que exigisse investigação adicional. O scheduler aprovado nesta rodada não fecha H24-01 histórico; a interação120 e clique semanal não foram alvos browser novos. Limites e próximo experimento estão em ACHADOS.md.

## Reproduzir sem reescrever provas

Usar RunName novo em cada script; os destinos existentes são rejeitados. Preparar JDK21 fora de target e apontar runtime-path.txt localmente, sem editar o runtime compartilhado. Rodar scripts da raiz, com Docker local descartável; acesso ao cache Maven/Docker pode exigir aprovação do ambiente. Não usar banco Railway nem produção. Para o probe vermelho esperado, o exit1 é a reprodução, não um gate aprovado.

`node tasks/evidencias/revisao-CF-025-CF-027-RV24/verify-review.cjs` confere que fontes/config/testes principais continuam byte-equivalentes em LF ao candidato, README está intacto, adaptações da cópia são somente as declaradas e soma resultados por suíte. Commits locais finais constam do Git e da resposta de entrega; staging explícito foi inspecionado sem README raiz.
