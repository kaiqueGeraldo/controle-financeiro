# CF-032 — validação integrada local

**Entrega de validação em_revisao, 22/10/2026; sem sucesso integral.** Matriz final:
13 cenários distintos, 9 passaram/4 falharam. Três P2 confirmados (reserva de fonte
incerta, limite na UI, identificação de investimento sem ticker) e uma perda de
precisão P3/pendente (segundos no XLSX). Produto preservado, regressões vermelhas.

Base integrada 331d3344c24dc60f5e1940989b9a35c0d5da1aa6,
branch `codex/cf032-e2e-financeiro`. Sem autoaceite, sucessoras, push, merge ou deploy.
[Resultados e limites](RESULTADOS.md) · [Achados/saneamento](ACHADOS.md) ·
[Matriz anterior às jornadas](MATRIZ.md) · [Oracles independentes](oracle.json) ·
[Reconciliação final em centavos](run-10-utc/reconciliation.json).

Percurso real navegador→Next BFF→Spring→PostgreSQL, reload/nova sessão, dois owners,
contas a receber, hábito/prazo e commit com resposta perdida executados. O ramo
diário com identificador declarado conclui todas as operações/logout/login; o E01
original sem identificador continua falhando em L, sem ocultar essa limitação.
Final financeiro: contas 1286.90 + investimentos 501.67 − dívida 270 = patrimônio 1518.57,
reservas 450/200, caixa livre 836.90. Exportação monetária concilia 250.10/162.20/87.90,
caixa −13.10; precisão horária permanece pendente. G comprova efeito único e H isolamento.

## Preservação e preparação

README raiz preexistente permanece fora do staging, SHA256
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
Runtimes novos em `../controle-financeiro-runtimes/CF-032/`:

- `20261022-01`: preparação interrompida; cópia recursiva incluiu testes/artifacts
  históricos desnecessários. Preservada, sem uso funcional. Script corrigido para
  copiar apenas fontes/testes explicitamente necessários.
- `20261022-02`: Turbopack recusou junction fora da raiz; tentativa alternativa
  Webpack compilou JS e falhou na checagem gerada do export `proxyRequest` da rota.
  Não classificado como regressão de produto/build padrão; nenhuma fonte alterada.
- `20261022-03`: somente next.config da cópia define raiz comum do Turbopack;
  build padrão aprovado. Backend e frontend de produto preservados integralmente;
  configuração e testes novos são explícitos. Nenhuma exclusão/ignore de tipo.

JDK Temurin 21.0.12.1; Spring 4.0.2; Node 24.18; Next 16.1.6; Docker local 29.6.2;
PostgreSQL 16-alpine descartável criado pelo initializer, Flyway V1–V16 e Hibernate
validate. Portas Spring/SQL aleatórias e schema cf032 único; Next 3142 com
reuseExistingServer=false. Nenhum processo/banco histórico ou remoto usado.

## Falhas do harness preservadas

`run-01`: Spring/migrações preparados; nenhum cenário browser executado. O servidor
Next recebeu cwd relativo ao arquivo de configuração em vez do frontend. Correção:
webServer.cwd explícito, sem alterar produto, timeout ou assertion.

`run-02`: dez cenários tentados. UI fez cadastro/login reais; APIRequestContext
não enviou cookie Secure por HTTP local, diferentemente do Chromium no mesmo
loopback. Consultas financeiras auxiliares deram401. Correção: probes BFF usam
fetch do navegador autenticado, sem ler/copiar tokens. O SQL terminal também
revelou erro do observador: coluna física é operation_time, não time; corrigido
com alias, mantendo as mesmas assertions de horário/valor/persistência.
Esses resultados não demonstram defeito de sessão do produto e não reabrem
timeouts históricos. Não são dez regressões financeiras independentes.

| Execução preservada | Resultado / causa |
|---|---|
| run-03 | Nenhum teste selecionado: filtro ancorado incompatível com título completo Playwright. Não conta como jornada. |
| run-04 | A passou com UI/SQL/recibo/reload; preflight do harness corrigido. |
| run-05 |5/10: B/C/G usaram seletor que inventava texto null para dígitos opcionais; E duplicou identidades da fixture legada; H não confirmou diálogo de logout. Falhas preservadas, correções somente de teste. |
| run-06 |7/11: E2 expôs defeito real; B/C/G pagaram competência novembro ativa, contrariando oracle de outubro. Seleção de outubro passou a ser explícita, mantendo valores esperados. |
| run-07 |8/12: E2/K reais e C perdeu segundos; B não encontrou nome de posição sem ticker. K tinha assertions async não aguardadas: JSON final Playwright falhou, metadata auxiliar equivocada não vale como aceite. |
| run-08 |9/13: B com identificador declarado passou; L conserva entrada/assertion originais sem ticker. C/E2/K/L falham; colunas monetárias continuam conferidas após assertion soft de segundos, que mantém C vermelho. |
| run-09 | K revalidado aguardando as duas assertions, falha real confirmada e metadata corrigida. |
| run-10-utc |9/13, mesmas quatro falhas; JVM UTC efetiva após startup, três fusos do navegador, matriz final completa. |

Até run-09, a inicialização da aplicação sobrescreveu user.timezone para Brasília.
Isso foi observado em environment.json; não se alegou UTC efetivo nessas rodadas.
O harness final define UTC após startup e restaura no cleanup, mantendo Clock de
produto explícito em São Paulo. Esse ajuste somente de teste foi verificado em
todas as 13 jornadas, sem mudar calendário/expected ou temporizadores do navegador.

Traces desabilitados para não persistir cookies/senhas; capturas e metadados de
rede/SQL/exports sintéticos são os artefatos de diagnóstico. Surefire XML sanitizado
remove propriedades do processo; scripts também removem JWTs/senha sintética dos
arquivos textuais publicados. Originais de runtime são preservados localmente.

## Contraprovas, checks e preservação final

Quatro mutações somente na cópia `20261022-controls`: retirar filtro owner,
duplicar crédito, acrescentar 0.01 ao valor exportado e deslocar data exportada.
As quatro foram detectadas pelo invariante específico, sem erros de ambiente.
[Resultados/patches/hashes](counterproofs/results.json); controle restaurado
[equivalente à base](counterproofs/restored-comparison.json): H passa, C mantém
somente a perda de segundos já conhecida. Não se usou essa falha antiga para
contar mutantes mortos: valor 250.11 e data 23/10 têm violações distintas documentadas.
O controlador de mutações encerrou exit 0 por detecção/restauração, não por aprovação
de C. Perda de persistência foi verificada por SQL/reload/nova sessão, sem mutação
própria adicional; não há alegação de cobertura exaustiva de mutação.

40 controles Java passaram, 6 unitários temporais em 3 fusos, lint src+novos testes,
typecheck, build padrão Next, compilação Java e parsing dos scripts aprovados.
Contagens se sobrepõem às regras usadas nos E2E; não somar como casos novos.
Logs e reports estão neste diretório; nenhum teste/assertion foi removido ou
suavizado para produzir sucesso integral. As quatro regressões impedem esse sucesso.

484 arquivos de produto em cada cópia conferidos por SHA256, sem diferenças:
[principal](product-source-final.json), [contraprovas restauradas](controls-source-restored.json).
README raiz mantém exatamente o hash inicial informado. Evidências intermediárias,
arquivo histórico de runtimes e alterações anteriores preservados; sem clean,
reset ou limpeza de target. Portas Next/Spring conferidas sem listeners restantes
e Docker local sem contêineres restantes em [final-preservation.json](final-preservation.json).
Varredura textual da evidência não encontrou JWT, senha sintética nem hash bcrypt.

## Git e próximo passo

Commits de fonte locais: 065c609 (harness/oracles) e 995efb8 (cenários/contraprovas/
reconciliação). O commit documental que contém este arquivo completa a entrega;
intervalo de revisão `331d3344c24dc60f5e1940989b9a35c0d5da1aa6..HEAD`.
[Refs locais e ancestralidade do aceite CF031](git-state.json); `main`, `origin/main`
e branch CF031 continuam na base informada, sem nova publicação/integração.

**Próximo passo: revisão independente da validação e dos quatro pontos; depois
saneamento delimitado de CF032-01/02/03 e decisão/correção de CF032-04**, com probes
originais preservados e consumidores afetados. CF032 não foi autoaprovada.

## Reprodução

Na raiz, preparar uma execução inexistente com
`controle-financeiro-frontend/tests/cf032/prepare.ps1 -RuntimeRoot <diretório>`.
Na cópia frontend, executar `node node_modules/next/dist/bin/next build` com
`NEXT_TELEMETRY_DISABLED=1`. Não executar ações financeiras como warmup.
Na raiz, executar `controle-financeiro-backend/src/test/cf032/run.ps1
-RuntimeRoot <diretório> -Evidence <diretório novo de evidência>`.
O script configura JDK21, JVM UTC, caminhos, namespace e evidência; Java lança
Playwright com a porta real do Spring e observador SQL exclusivo de teste.
Diretórios externos/Docker precisam da aprovação de ferramenta nesta sessão.
Para contraprovas, usar `src/test/cf032/mutations.ps1` com uma cópia exclusiva que
tenha o mesmo build de frontend, e Evidence inexistente. Nunca mutar a cópia principal.
Os scripts aceitam caminhos configuráveis, recusam sobrescrita de execuções e não
acessam Railway/banco externo. Porta JDBC é gerada/validada pelo Testcontainers;
o run final conserva identidade do banco/schema e migrações, mas não persiste a
porta JDBC mapeada como campo próprio. Next e Spring efetivos estão documentados.

Estado financeiro usa 22/10/2026 09:00Z, dia 22 em SP/UTC/+14. Date-only mantém
performance/rAF/timers/WAAPI nativos. Credenciais usam instante real separado;
nenhum teste altera validade real do cookie ou a segurança da autenticação.
Os 120s são o limite inicial das jornadas com múltiplas operações, não aumento
após falha. Assertions 12s e retries 0; nenhum sleep funcional ou animação desligada.

## Limites preservados

CF029/030/031 e demais aceites preservados. Autorização atual é exclusivamente
local/descartável; DEC-ONB-03 não libera zoom nativo 200% CF010/015, adoção real
CF017/P01/P02 ou deploy. Não há certificação de carga, cache distribuído,
dispositivos/restart completo ou todos os interleavings de writers.
O resultado registrado distingue ações UI, probes browser/BFF e integração direta.
