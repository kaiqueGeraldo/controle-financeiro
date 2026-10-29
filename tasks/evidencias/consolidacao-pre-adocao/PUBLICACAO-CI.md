# Plano de publicação e CI futura — preparado, não executado

**Seleção original aceita e cobertura preservada. CPA-01/R1/P2 saneado localmente,
aguardando revisão independente; parecer C mantido.** Implementação do agregador
`b45284e876277e4136b6487ed3e3d9a320bfaa62`, base `e837748a600c356e2e9d4f60291240cebf523916`;
[provas e limites locais](../saneamento-CPA-01-R1/README.md). Candidato anterior
`193916a1778f1322f5368f66d30a83286766b147`, implementação
`c597ffc5c33abe45f764b1aaca099daa9f520b00`, branch
`codex/saneamento-cpa01-selecao-testes`.
[Parecer e resíduo](../revalidacao-CPA-01/README.md). Este documento não autoriza
push, PR, CI, merge, configuração de provedor, registry ou deploy.

## Branch, intervalo e destino

Origem local preparada:`codex/saneamento-cpa01-selecao-testes`, derivada
sem merge/rebase de `434e293f76c3b6ff345fe03f2091149291316aac`, no remoto
`https://github.com/kaiqueGeraldo/controle-financeiro.git`.
Destino da PR:`main`. Intervalo de código/documentação recebido nesta revalidação:
`fb986456a37a48afcafef204f165d15354294d26..193916a1778f1322f5368f66d30a83286766b147`:
53 commits, zero exclusivos da main reconferida por fetch. Somam-se somente os
commits de provas/parecer/preservação desta revisão, com HEAD completo na entrega.
Somou-se o delta local R1 a partir de `e837748a`; HEAD documental final na entrega.
**A publicação ainda depende da revisão independente de R1.** Não atribuir o
aceite anterior de seleção ao novo agregador.
README raiz alheio permanece fora do intervalo.

Após aprovação do saneamento, registrar main/SHA/merge-base novos e um SHA imutável
de envio. Publicar somente essa branch/intervalo sem force. PRnormal preserva os
commits/histórico; não fazer squash/rebase por conveniência. A PR proposta está em
[PROPOSTA-PR.md](PROPOSTA-PR.md), com pendência transparente até sua resolução.

## Eventos e jobs existentes

| Entrada | O que executa hoje | Consequência |
|---|---|---|
| Push da nova branch | ci.yml não reage; só main em push. Probes sintéticos também não reagem à nova branch | Não esperar check completo por esse push; integrações externas ainda podem reagir |
| Pull request para main com paths backend/frontend/.github/tasks/docs-sdd | `windows-native` Windows/15min -> `linux` Ubuntu/45min; `required` agrega ao término, Ubuntu/5min; Node24/Temurin21 | Windows executa TCP; Linux conserva frontend/backend/E2E/package. Required exige ambos success e expanded explicitamente skipped/não aplicável |
| Push main após integração | Mesmos jobs pelos mesmos paths | Combinação efetiva da main exige resultado próprio; PRverde não substitui esse run |
| Dispatch ci.yml, suite=smoke | Windows e Linux smoke obrigatórios; required agrega com always | Expanded skipped é somente não aplicabilidade explícita, não execução aprovada |
| Dispatch ci.yml, suite=expanded | Windows -> Linux smoke -> expanded Ubuntu/45min; required aguarda os três | Todos obrigatórios success; nenhum skip aceito. Conferir head_sha e evento do run |
| Push codex/cf034-ci-local com paths do probe | CF034 synthetic remote probes/contracts e cancellation | Branch antiga; nenhum gatilho da consolidação. Não empurrar branch antiga para disparar provas por associação |

Nomes declarados nos YAMLs não provam regras atuais de branch protection/rulesets.
Antes da publicação, conferir quais check contexts são realmente exigidos no remoto.

## SaneamentoCI local e matriz ainda necessária

Implementado localmente: `windows-native`, Windows/JDK21/Node24, sem condição por
evento/suite; `linux` depende dele e `expanded` depende de linux. O nome required
foi preservado para um job agregador com `if: ${{ always() }}` e needs diretos
`[windows-native, linux, expanded]`. O avaliador real exige success de Windows e
Linux em todos os modos; expanded também é obrigatório no dispatch expanded.
Nos demais modos, expanded deve constar com resultado skipped por não aplicabilidade.
Ausência, failure, cancelled, skipped obrigatório, desconhecido ou JSON inválido
reprovam com exit1. Sem continue-on-error ou comando posterior que neutralize erro.
O seletor lê a condição JUnit no nível da classe (movida do método, com corpo e
assertions intactos) e exige plataforma alvo explícita. Linux seleciona 100 classes
smoke/115 expanded; Windows executa a classe TCP, sem PostgreSQL. A união por
identidade conserva as 101/116 classes anteriores e os 15 harnesses expanded.
Condições diretas de OS não suportadas/plataforma desconhecida falham fechadas.
Não há garantia de parserJava genérico para condições compostas/herdadas, não
utilizadas nesta base. O runner Windows
usa argumentos literais via PowerShell para chamar o wrapper; o estágio específico
usa `test`, sem criar JAR. Relatório obrigatório e zero skips continuam exigidos.
Nesta revalidação,23 contratos passaram em Windows e Linux em container, mais
sete probes independentes Windows; TCPWindows real1/1 e comunsLinux3/3. Linux
usou Node22.23.1, distinto do24 previsto no workflow. Sem suíte integral ou Actions.
Runner remoto exato e versões resolvidas ainda deverão constar do futuro recibo.

**R1/P2 aguardando revisão independente:** a prova anterior reproduziu o skip do
required e o bloqueio do pacote com Windows falho. Agora o worker Linux preserva
integralmente execução/pacote (só acrescenta contratos), enquanto required avalia
os resultados estruturados em NEEDS_JSON.32 contratos,7 probes independentes e82
cenários do avaliador passaram;6 mutações foram detectadas e restauradas por hash.
Sem scheduler Actions ou rulesets consultados. A condição always dá elegibilidade
segundo a [semântica oficial](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs),
sem prometer execução após cancelamento forçado ou indisponibilidade de runner.
Agregador/checkout/setup/avaliação têm limites locais YAML de5/1/1/1min; falha de
infraestrutura não equivale a success. [Matriz e encaminhamento](../saneamento-CPA-01-R1/README.md).

| Alcance futuro | Ambiente/serviços descartáveis | Evidência necessária |
|---|---|---|
| Execução Linux e agregação required | Ubuntu resolvido; Node24/JDK21/Maven wrapper; TestcontainersPG16 e schemas/DBs sintéticos; Chromium | Linux conserva lint/tipos/build, temporais3fusos, componentes, backend, wrapper e6CF032; required verifica Windows/Linux e expanded quando aplicável |
| Windows TCP após saneamento | RunnerWindows resolvido; somente listener sintético pertencente ao teste | Classe original executada, relatório e contagem; nenhum skip aceito como execução |
| PG17 dos controles novos | Job/adaptador dirigido JDK 21,`-Dcf017.postgres.major=17`, postgres17 com clientes da mesma major | Migrations/validate/preflight/restore e controles pertinentes, vínculo de inputs/major/ferramentas. O YAML atual não tem matrizPG17 nem passa esse parâmetro |
| Novo JAR/imagem, antes de consumo de release | JAR do run aprovado e depois imagem por digest; PG16/17 descartáveis, flags/schema sintéticos | Provas de bootstrap/manutenção/jobs/saúde no pacote/imagem exatos; sem chamar p05 de pacote novo. O teste normalCI usa classes quando preparation.jar/image não é passado |
| ExpandedCF032 | Chromium, casos C, E, E2, F eT0/T1/T2 além dos 6 smoke |13 casos atuais; T0SP360×800, T1UTC768×1024, T2Kiritimati1440×900. Não produto cartesiano arbitrário |
|15 harnesses históricos | Fixtures, relógios, greps, configs e destinos próprios por classe | Seleção efetiva antes do run, relatórios de cada classe, nenhuma omissão silenciosa. Se incompatíveis, decisão de escopo separada; sem retirar gate para obter verde |
| Cancelamento remanescente | Apenas cenários exigidos, nativos/runner real, com recursos próprios e controle alheio onde faltar | Não inferir Ctrl+C, supervisor Linux nativo, daemon/SQL ou aborto de toda suíte do probe sintético anterior |

A lista das 15 classes e sete casos faltantes está em
[MATRIZ-CF034 canônica da revisão](../revisao-prontidao-CF034-CF017/MATRIZ-CF034.md)
e em verificacoes.json. Linux seleciona100/115 classes mais uma classe obrigatória
Windows, conservando101/116 na união; as 95 classes
e891execuções do run main antigo não são contagem esperada imutável deste candidato.
Não chamar expanded com classes históricas despreparadas só para produzir falha
conhecida. Preparar seleção/caminhos é parte da próxima mudança local autorizada.

Comando remoto futuro existente,**não executado**, após novo candidato aprovado:

```text
gh workflow run ci.yml --repo kaiqueGeraldo/controle-financeiro --ref codex/saneamento-cpa01-selecao-testes -f suite=expanded
```

Conferir se o workflow já existe na defaultbranch e se a branch aponta para o
SHA aprovado; comparar head_sha/run_attempt antes de aceitar. Não usar esse comando
agora e não confundir a ref mutável com pinagem por SHA. O dispatch também pode
ser feito por conector autorizado; o comando é uma proposta, não uma execução.

## Artifacts, retenção e instalação

- Worker Linux (antes required): `diagnosis-<github.sha>` com `public/` sanitizado e
  `tested-package-<github.sha>` comJAR+`public/package-manifest.json`; retenção 7dias.
  Expanded:`expanded-diagnosis-<github.sha>`, mesma retenção, sem upload de pacote.
  O agregador required não gera/publica pacote; emite diagnóstico de IDs/status
  conhecidos e exit code. Presença do artifactLinux não substitui aprovação do
  required final; como antes, o artifact smoke antecede a matriz expanded.
- `result.json` e manifesto registram SHA, digest, comandos, contagens e toolchain.
  Sanitização publica só allowlist; XMLproperties, traces, SQL, env, JFR e brutos ficam
  privados. XML/PlaywrightJSON completo não é publicado pelo YAML atual:qualquer
  complemento futuro precisa política explícita de coleta sanitizada, sem upload
  indiscriminado de surefire/trace.
- Windows publica `windows-native-diagnosis-<github.sha>` por 7dias com a mesma
  allowlist sanitizada; `result.json` inclui seleção, contagens, hashes XML,
  sourceDigest e identidade CI. XML bruto fica privado; sem pacote Windows.
  Implementado somente no YAML local; upload remoto ainda não executado. PG17
  ainda precisa job/recibo próprio, fora deste saneamento. Não criar pacote local
  para contornar revisão ou matriz remota.
- Instalação por npmci+lock, setupNode 24/setupJava 21, wrapperMaven eChromium fixado
  pelo lock do Playwright. Tagsactions/ubuntu/latest/PG são móveis:registrar
  versões/digests efetivos no run. Cache só dependências; sem cache de status/target.
- Coleta `always()` precisa sucesso para upload de diagnóstico; sem fallback bruto.
  Pacote após gates. Cancelamento/falha não pode manter certificado verde ou
  permitir pacote. Respeitar lifecycle dos containers próprios, sem cleanup por nome
  ou limpeza geral de runner/DB. Retenção de artifactsCI não é backup operacional.

## Reconferências antes de qualquer push

1. Main, refa publicar, diff, index eREADMEhash; nenhum código novo recebe aceite por
   herança. CPA-01 encerrado na base final por revisão separada.
2. GitHub:Actions/rulesets/contexts obrigatórios após corrigir/revisar R1 (inclusive
   `windows-native` e o agregador estável; nenhum skipped vale como execução aceita),
   permissões efetivas de token, ambientes do repositório,
   secrets/variables por nome, apps/webhooks/workflows reutilizáveis, checkout SHA e
   políticas de artifacts. Não solicitar ou registrar valores secretos em evidência.
   Esperado: workflow `CI integrated gates`, job/check `required` (rótulo de UI
   `CI integrated gates / required`), mesmo nome anterior, agora agregador. Conferir
   origem GitHub Actions, SHA, evento elegível, contextos legados e eventuais checks
   homônimos antes de decidir integração. Não houve consulta remota neste lote.
3. Railway:mesmos projeto/ambiente/serviços do inventário atual a consultar;
   estadoAPI/PG, autodeploy, Wait for CI, PR environments, origemGit/branch/rootDockerfile,
   pending/staged changes e webhooks. Não aplicar/religar para completar conferência.
4. Vercel:projeto/rootfrontend, GitdeploymentEnabled efetivo global, integrações,
   deploys automáticos de branches, previews existentes, domains/aliases eDeploymentChecks.
   Readback da configuração localfalse não basta; C10/C11 históricos são propostas.
5. Separar BACKEND_API_URL por escopo e conferir destino de preview/development;
   deployments antigos não recebem código novo. Qualquer mudança desses controles
   remotos exige autorização própria, antes do push se puder haver deploy incidental.
6. Antes de ativar API:changeset atual de DDLvalidate/Flywayfalse/adoption/flags/
   PORT/health/timeouts, pacote por digest e consumidores congelados. Não são ações
   implícitas da publicação Git/CI; manter a separação do plano A–D.

As observaçõesRailway/Vercel de 26/10 são históricas. Esta execução não voltou a
esses provedores e não afirma que continuamoffline/configurados da mesma forma.

## Condições para integrar à main e etapas posteriores

Na futura etapa autorizada: exercitar Windows failure/skipped/cancelled com Linux
success sintético e com skip real da cadeia, Linux failure com Windows success,
expanded failure/skipped/cancelled no modo expanded, e todos success. Required deve
falhar quando executar com qualquer obrigatório não success; interrupção forçada,
runner ausente ou check ausente não podem receber aceite operacional por skip.
Conferir também bloqueio de pacote para falha Windows/Linux, logs sem secrets e
relatórios atuais; não usar artifact já existente como certificado do agregado.
PR/push elegíveis e dispatch expanded são verificações distintas: a
[documentação atual de required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
não trata um dispatch como substituto do check de PR nas rulesets. Reconfirmar
esse vínculo no remoto autorizado. Se houver merge queue, conferir seu evento
próprio; nenhuma configuração de fila/proteção foi alterada aqui.

Novo parecer favorável do delta R1 saneado, autorização de publicação e de CI,
checkout exato, required completo eexpanded escolhido aprovado com relatórios,
artifacts/manifesto coerentes e gates remotos aplicáveis atendidos. Reconfirmar
regras de merge/revisão na hora; não executar merge nesta etapa. Falha/skip/checkout
divergente/relatório ausente interrompe o avanço e preserva a primeira ocorrência.
Não reexecutar até apagar falha; novo diagnóstico/saneamento tem recibo próprio.

Integração de código e artifactCI não concluemCF034 integral, zoom, CF017/P01/P02
ou produção por associação. Configuração e publicação de imagem são decisões
separadas; ativação PG/leitura, classificaçãoA–D, freeze, backup/restore, baseline sóB,
migrations, API restrita, smoke eGO/jobs obedecem ao plano operacional existente.
Não inventar origem temporal nem apagar metadados no rollback.
