# Seleção explícita e limites de CI

O gate não equivale a executar indiscriminadamente toda investigação histórica
do repositório. A seleção fica em `.github/scripts/suites.mjs`, é exportada por
execução em `backend-selection.json` e será submetida ao revisor independente.

- Backend obrigatório: todos os94 testes concretos `*Test`/`*Tests` fora dos15
  harnesses autônomos de navegador nomeados abaixo. Inclui controllers, domínio,
  migração/restore descartáveis, autenticação/isolamento, concorrência, oráculos
  de capacidade e probes CF033. Nenhum filtro para passar um teste desses falhando.
  Exigir relatório de **cada classe** e zero falhas/erros/skips, além de total>0.
- E2E obrigatório corrente: seis jornadas A/B/G/H/K/L da CF032, com BFF/Spring/PG
  e SQL/reload reais: onboarding, uso diário, resposta perdida/replay, dois
  usuários, limite financeiro e investimento sem ticker. Exigir as seis, zero
  skips/flaky e Java wrapper não vazio. Não se rotula esse recorte como toda UI.
- Frontend: 18 execuções temporais nos3 fusos e todos os testes de componente e
  onboarding descobertos pelo config ampliado; zero skips. Lint sem warnings,
  typecheck e build são etapas independentes. Cache não aprova essas etapas.
- Matriz ampliada opt-in: backend inclui também os15 harnesses; E2E inclui toda
  seleção CF032, inclusive os3 casos temporais já definidos. Não recebe aprovação
  por estar configurada. Requer preparação própria/revisão das condições históricas.

Os15 nomes preservados na matriz ampliada são: Cf014HistoryDiagnosticTest,
Cf014HistoryReviewTest, Cf019Rva03DiagnosticTest, Rvr24ReviewBrowserTest,
Rvr24VisualBrowserTest, Rv24CreationBrowserIntegrationTest,
Rf15RemediationBrowserTest, Rf15ResidualIndependentBrowserTest,
Rf15ResidualBrowserTest, Rf15IndependentBrowserTest, FrontendClosureBrowserTest,
MilestoneRemediationBrowserTest, IntegratedMilestoneBrowserReviewTest,
UserIsolationBrowserIntegrationTest e HabitBrowserIntegrationTest.

Esses arquivos são bridges ProcessBuilder para configurações/fixtures e roteiros
históricos próprios. Não foram apagados, marcados skip ou declarados aprovados.
A adoção dessa seleção corrente para CI é uma decisão de implementação **ainda
em revisão**, não um novo aceite dos contratos nem dispensa de achado obrigatório.
Se a revisão identificar uma garantia obrigatória sem representante corrente,
o recorte deve ser ampliado e o gate correspondente continuará pendente.

## Verificação ampla exploratória preservada

`exec-20261024-06` executou frontend completo (620/620) e iniciou `verify` default.
Selecionou inclusive bridges históricos antes da instalação do browser, encontrou
falhas de preparação e dados de fixtures compartilhados, e não aprovou pacote.
Foi encerrado pelo controle da própria sessão após o diagnóstico; relatórios são
parciais e não se apresentam como verify concluído. Uma tentativa anterior de
parar por PID não passou na checagem de identidade e não encerrou processo algum.
Os processos/recursos restantes devem ser conferidos antes do fechamento.

O parâmetro CLI `surefire.reportsDirectory` inicialmente presumido não é uma
propriedade de usuário documentada do parâmetro reportsDirectory. Agora há vínculo
explícito POM `cf034.reportsDirectory`, permitindo separar relatórios de backend e
E2E sem ler arquivos velhos. [Referência oficial Surefire](https://maven.apache.org/surefire/maven-surefire-plugin/test-mojo.html#reportsDirectory).
O teste de listagem Playwright também demonstrou que o grep ancorado antigo
selecionava zero casos; o grep corrigido lista os seis, e a execução exige seis.
Na listagem sem elevação, o reporter foi impedido de criar diretório externo;
isso não foi classificado como defeito ou execução financeira.

## O que a execução local não certifica

Runner Linux/Actions, filtros de eventos, permissões reais, uploads, dependências
de jobs e branch protection ainda exigem revisão/execução remotas autorizadas.
O job expanded usa `needs: required`; diagnóstico usa `always()`, pacote usa o
sucesso normal. Esses contratos são estáticos aqui, embora a sequência interna
e seus códigos de saída sejam exercitados localmente.
[Semântica oficial de needs/condições](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

Não foram alterados checks obrigatórios/proteções externas; os nomes novos de
job precisam ser conferidos antes de adoção remota. O Dockerfile histórico ainda
constrói imagem com skipTests; não foi usado para produzir o JAR testado e não
recebe aceite de imagem. CI prepara um JAR do verify, só o disponibiliza após
E2E e verifica SHA256 contra o recibo do build. Imagem, pacote publicado para uso,
adoção real, zoom e CF035/036 continuam fora deste aceite local.

Metadados oficiais dos Actions foram consultados: setup-java/v4 está marcado
deprecated, portanto o workflow final usa v5/Node24, mantendo Temurin21.
[v4](https://raw.githubusercontent.com/actions/setup-java/v4/action.yml),
[v5](https://raw.githubusercontent.com/actions/setup-java/v5/action.yml).
Checkout conserva contents:read, sem persistir credenciais e sem clean/reset
automáticos; a condição de árvore limpa é verificada antes dos gates no runner.
Esse ajuste só de workflow teve validação YAML local; não é execução Actions.
