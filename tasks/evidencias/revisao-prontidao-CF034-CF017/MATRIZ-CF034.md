# Matriz independente da CF-034

Base fb986456a37a48afcafef204f165d15354294d26, revisão em 26/10/2026.
Os quatro critérios abaixo são os da tarefa, sem redefinição para aprovar o verde.
Os checkboxes integrais permanecem abertos. CF-015/zoom permanece dependência.

| Requisito | Evidência conferida | Estado | Impacto | Responsável | Próxima ação | Autorização |
|---|---|---|---|---|---|---|
| 1. Regressão real de regra/data falha e bloqueia avanço; configuração em execução real | Aceite local de mutação/data preservado; Actions main checkout/evento/comandos reais; probe exit 23 bloqueia backend/E2E/pacote; falta de relatório e pacote adulterado recusados; run histórico 40323062343 confirmado failure/upload de pacote skipped | Parcial remoto; sustentado localmente | Falha de harness remota não é nova mutação de regra financeira; falta prova integral ampliada | CF-034 | Ensaiar seleção expanded e contraprova remota dirigida se exigida para fechar o critério; não repetir todas as finanças sem causa | Sim para nova CI; implementação futura separada |
| 2. Checkout limpo, sem secrets de produção, finaliza processos/banco, sem verde por retry | Manifesto/árvore; workflow contents:read, persist-credentials:false, env descartável; Maven rerun=0, Playwright retries=0; PostgreSQL16/Testcontainers; probe Linux com cleanup/upload success | Sustentado no smoke e cleanup sintético delimitado; integral pendente | Aborto de suítes reais/recursos externos e Ctrl+C nativo não são certificados por esse probe | CF-034 | Concluir combinação ampliada e somente as lacunas de cancelamento exigidas; preservar aceite Windows/processos | Sim para CI nova; Ctrl+C requer ferramenta apropriada |
| 3. Build/pacote publicados correspondem à revisão testada | JAR do run main e 820 inputs; hash/bytes/recibos; dois uploads e downloads prévios confrontados com API atual | Atendido para artifact JAR de CI; imagem de release não demonstrada | Dockerfile recompila com skipTests/Maven diferente; futura imagem requer cadeia própria | CF-034; CF-035/036 para imagem | Definir e validar empacotamento do JAR testado ou testar a imagem exata antes de promoção | Sim para código/CI/publicação futuros |
| 4. Evidências/limites registrados, sem enfraquecer testes | ZIPs/coleção/recusas; delta de TZ e setSchema inspecionado; asserts, tolerâncias e retries preservados; falhas históricas mantidas | Atendido no recorte revisado | Não concede aceite das combinações puladas ou uso | CF-034 | Manter provas e preencher faltantes; revisão documental não fecha CF-017 | Já autorizado para documentação local |
| Dependência integral CF-015 | DEC-CI-04 e DEC-ONB-03; zoom nativo200% ainda sem prova | Pendente explícito | CF-010/015 em_revisao; não liberar uso | CF-010/015 | Nova etapa apenas com controle nativo/URL/captura/input adequados; não repetir abordagem bloqueada | Aprovação da etapa própria |
| Adoção do banco e temporal | CF-017/P01/P02 e runbook; schema real não acessado | Pendente | Publicação/uso condicionados | CF-017; CF-035 | Plano A–D, ferramenta PG17 e evidência real | Sim, granular; ver PLANO-ADOCAO |

## O que o run main realmente executou

[Run 40337346702/1](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/40337346702),
evento push, branch main, checkout fb98645, job required 121622364173 success,
expanded 121627121043 skipped. Workflow concluído em 26/10 às11h20min15s São Paulo.
`consultas-remotas.json` traz os steps e estados consultados novamente. Nenhum job
cancelado nessa execução ordinária. Os probes pertencem a outro run.

| Gate | Resultado conferido | Limite da contagem |
|---|---|---|
| Contratos Node/sanitização | 13, zero falhas/skips, log atual do job | Não são 13 jornadas de produto |
| Dependências/lint/tipos/build | comandos exit0; npm ci, max-warnings=0, typecheck e Next build | Cache somente de dependências |
| Temporais unitários | 6 em São Paulo + 6 UTC + 6 Kiritimati = 18 execuções | 6 casos repetidos em3 fusos; não18 regras distintas |
| Componentes | 620; zero falhas/erros/skips | Processo TZ/CF_TEST_TIMEZONE São Paulo; não matriz completa em3 fusos |
| Backend | 95 classes e soma891 por linhas de classe; zero falhas/erros/skips | Assert/fixtures podem se repetir entre classes; XML individual não é publicado, agregado do gate confrontado com logs |
| Wrapper E2E Java | 1 | Aciona as jornadas abaixo; não somar como jornada independente |
| Playwright smoke | 6: A/B/G/H/K/L; sem falha/skip/flaky | Chromium, 1440×900, São Paulo; JVM efetiva UTC depois do bootstrap |
| Pacote e coleta | dois uploads success; 5 ZIPs auditados incluindo probes | Sem imagem Docker ou deploy de aplicação |

Maven verify real usa `-Dtest=<95 classes>` e não usa skipTests; a seleção é
explícita, não equivale a todas as classes. Wrapper usa
`-Dtest=FinancialJourneyPostgresE2E test`; as seis jornadas são filtradas pelo
CF032_GREP do script. Fuso JVM `-Duser.timezone=UTC`; a aplicação muda o default
para São Paulo e o wrapper o repõe a UTC após inicialização. Relógio de produto
do harness é fixo, não relógio real de produção.

Versões observadas: Ubuntu24.04.5, Node24.21.0, npm11.19.0, Maven3.9.12,
Temurin21.0.12.1, postgres:16-alpine; runner Actions2.338.0. Spring Boot do
projeto4.0.2/JDK21. Essas versões não certificam PG17 de produção. Imagens/tags
móveis e caches não constituem pinagem imutável de um futuro build.

## Matriz ampliada: faltantes exatos

Condição do job: `github.event_name == 'workflow_dispatch' && inputs.suite ==
'expanded'`, mais `needs: required`. O push da main não satisfaz essa condição.
Não houve erro de execução do expanded e tampouco aprovação implícita. O nome
do workflow não muda esse fato.

No wrapper CF032 faltaram os seguintes sete casos, porque o grep smoke só
seleciona A/B/G/H/K/L:

| Caso omitido | Combinação/objeto real | Vínculo |
|---|---|---|
| C | Relatório/XLSX, datas/origens/estados/totais; SP1440×900 | Trabalho3; critérios1/2/4 |
| E | Legado conserva UNKNOWN/bruto, sem história fictícia; SP1440×900 | Mesmo vínculo; P01/P02 apenas sintético |
| E2 | Fonte legada incerta bloqueia destinação; SP1440×900 | Mesmo vínculo |
| F | Recebíveis/baixas parciais/calendário/persistência; SP1440×900 | Mesmo vínculo |
| T0 | São Paulo, 360×800, prazo/hábito | Política temporal mínima; critérios1/2/4 |
| T1 | UTC, 768×1024, prazo/hábito | Política temporal mínima; critérios1/2/4 |
| T2 | Pacific/Kiritimati, 1440×900, prazo/hábito | Política temporal mínima; critérios1/2/4 |

São **três combinações definidas**, não produto cartesiano de todos os fusos e
viewports. Os unitários em3fusos não substituem esses três casos de navegador.
CF032 tem13 casos atuais; não somar reruns/mutações históricas para inflar o total.

Também foram diferidas estas15 classes por `historicalBrowserHarnesses` em
`.github/scripts/suites.mjs`. Seus nomes/configs/caminhos exatos estão em
`harnesses-diferidos.json`; cada uma continua **não executada no run main**:

| Classe(s) | Fluxo/configuração |
|---|---|
| Cf014HistoryDiagnosticTest; Cf014HistoryReviewTest | configs cf014-history e cf014-history-review |
| Cf019Rva03DiagnosticTest | cf019-rva03 |
| Rvr24ReviewBrowserTest; Rvr24VisualBrowserTest | rvr24-review e rvr24-visual |
| Rv24CreationBrowserIntegrationTest | rv24 sobre milestone-review |
| Rf15RemediationBrowserTest | rf15; seleção interna condicional RF15_RVA_ONLY |
| Rf15ResidualIndependentBrowserTest; Rf15ResidualBrowserTest; Rf15IndependentBrowserTest | rf15-residual-independent, rf15-residual, rf15-independent |
| FrontendClosureBrowserTest | frontend-closure; seleção CF_CLOSURE_FINAL/TARGETED |
| MilestoneRemediationBrowserTest; IntegratedMilestoneBrowserReviewTest | milestone-remediation e milestone-review |
| UserIsolationBrowserIntegrationTest | runner infra/security/browser.cjs, Next3113 |
| HabitBrowserIntegrationTest | runner domain/habit/browser.cjs, Next3112, JVM UTC |

Cada diferimento afeta o alcance dos critérios1/2/4, não invalida automaticamente
o JAR já vinculado ao smoke (critério3). Essas classes contêm fixtures, clocks,
greps e caminhos de evidência próprios; não afirmar que todo projeto herdado ou
teste condicional será executado apenas com o nome expanded. Por exemplo,
milestone-review fixa SP1440×900, enquanto outras configs herdam projetos de
`playwright.integrated.config.ts` e filtros próprios. Exigir inventário da seleção
efetiva por classe antes do novo run, incluindo destinos novos externos ao Git.

Obrigatórios antes de alegar aceite ampliado: T0/T1/T2 e os casos declarados na
seleção expanded, com erros/skips/flaky zero, relatórios e nenhum descarte
silencioso de classes. Os15 históricos não são novo gate de todo PR smoke, mas
sua exclusão impede declarar a matriz ampliada aprovada. Reprodução causal de
diagnósticos antigos em candidatos antigos é opcional se não existe delta ou
regressão; não deve ser imposta para reabrir aceites de produto. Se uma classe
histórica não puder rodar no candidato atual, registrar a diferença e decidir
explicitamente o escopo com o usuário; não retirar o gate para obter verde.
Zoom nativo e Ctrl+C nativo são verificações separadas, não extras certificados
por expanded. Mais browsers/regiões, HA/carga de produção e reprodutibilidade
binária não são gates obrigatórios novos inventados por esta revisão.

Comando futuro existente, **não executado**:

```powershell
gh workflow run ci.yml --repo kaiqueGeraldo/controle-financeiro --ref main -f suite=expanded
```

Pré-condições: autorização de nova CI; revisão/integração do candidato e preparo
dos fixtures/caminhos; main atual conferida; bloqueios de deploy mantidos.
GitHub dispatch usa branch/tag, não assumir pinagem pelo SHA: conferir head_sha
da execução criada antes de aceitar qualquer resultado. O required rodará smoke
novamente por dependência; isso é o custo do workflow existente. Não executar
esse comando apenas por estar preparado nesta documentação.

## Cancelamento e recursos: alcance preciso

[Probe 40335789742](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/40335789742),
ddd5a41, contracts success, cancellation cancelled, downstream skipped,
cleanup/upload success. ZIP ready e cleanup têm mesmo UUID. Filhos/descendentes
ausentes, container próprio removido, sem pacote aprovado, erros vazios.
Container foi criado com label UUID, network none, tmpfs e sem porta publicada.
Código cleanup confere label antes de remover somente aquele container.

O cleanup `always()` emite uma requisição privada de cancelamento ao runner
sintético e então observa sua resposta/processos. Portanto prova o fluxo de
cancelamento suportado **com esse cleanup**, não a morte automática de qualquer
processo detached pelo Actions. Não é Ctrl+C; não é aborto abrupto de VM; não é
cancelamento de toda a suíte real/Testcontainers em qualquer ponto. Não há
processo/container alheio de controle Linux no probe: seletividade do código
está inspecionada, ausência de impacto em recursos alheios não foi medida ali.
VM descartada não foi inspecionada depois. Log de finalização ordinária e cleanup
sintético são provas distintas. Aceite Windows/processos UUID/JobObject e seu
controle alheio permanecem aceitos no recorte anterior; não recebem extensão
retroativa a Linux ou Ctrl+C.
