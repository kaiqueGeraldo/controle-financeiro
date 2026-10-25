# Sanitização, permissões e encaminhamento condicionado

## Fronteiras de coleta

`collect.mjs` versiona allowlist de logs frontend/result/manifest e resumos;
Surefire bruto com propriedades, SQL/capturas/estado de autenticação ficam no
runtime externo. Resumos de suites guardam hashes, totais e casos falhos; não
presumir diagnóstico completo a partir deles. Inventários desta revisão mantêm
nomes dos casos, sem copiar propriedades XML ou corpos HTTP.

`publish-evidence.mjs` permite result, lint/typecheck/unit/components/build,
backend/e2e e browser/playwright.log. Não permite .env, XML, dumps, traces,
perfis ou auth-state. Playwright CF032 usa trace/video off, screenshot só em
falha; capturas não integram o upload. Network registra método/path/status, não
headers/cookies; A-cookie-transport registra metadados do cookie sem valor.

Entretanto, logs permitidos podem conter mensagem de assertion/erro com segredo.
A allowlist não elimina esse risco. RCI034-01 reproduz três formatos sobreviventes
em arquivo selecionado para upload. O mesmo padrão está em safe do runner e no
coletor durável. Redação em chunks não assegura detectar token quebrado entre
chunks; o coletor remoto relê log inteiro, mas ainda possui as lacunas demonstradas.
Esse cenário de chunk é risco por inspeção, não uma quarta contraprova executada.

Probes usaram somente `SENTINEL_*`, JWT sintético e diagnóstico fictício. Nenhum
segredo real foi carregado para testar redaction. Não se afirma incidente real
nos artifacts anteriores; não se afirma remoção universal de segredos. A evidência
preserva saída literal sintética para tornar o defeito auditável. Significado de
failed/status/comandos e informação diagnóstica comum permaneceram observáveis.

Pacote JAR/manifest seguem upload próprio, sem transformação, pois sanitizar
binário invalidaria seu hash. Seleção de fontes deve impedir embutir arquivos
sensíveis; .env não é exportado. Recursos/configuração versionados e inventário
de dependências foram lidos dentro do recorte. Não foi feita auditoria geral de
segredos ou segurança do produto, nem certificação de todo conteúdo arbitrário
que um futuro teste poderá imprimir.

Workflow declara somente contents:read; não referencia secrets nem credenciais
de produção. checkout não persiste token; actions de cache/upload têm mecanismos
próprios do runner. Não foi introduzido deploy, login em cloud, push de imagem,
write permission ou execução pull_request_target. Permissões efetivas externas
e outros sistemas conectados ao repositório ainda precisam de conferência própria.

## Próxima etapa e publicação futura

**Não há encaminhamento aprovado para publicar agora.** Primeiro sanear RCI034-01
e resolver o contrato/prova de RCI034-L01 em tarefa separada, preservando probes.
Revalidar o delta local, depois solicitar decisão específica de publicação e
execução controlada. Nenhum workflow foi acionado nesta revisão.

Plano técnico condicional para essa futura decisão:

| Item | Conteúdo a revisar antes de executar |
|---|---|
| Workflow/jobs | `.github/workflows/ci.yml`, required; expanded somente após preparo próprio dos15 bridges e demais jornadas |
| Eventos | push em main e PR destinado a main, filtrados por backend/frontend/.github/tasks/docs/sdd; dispatch manual default smoke, escolha expanded adiciona job dependente |
| Branch atual | Push da branch codex/cf034-ci-local sozinho não satisfaz push main; abrir PR/main ou dispatch terá efeitos próprios e exige autorização |
| Permissões | contents:read, checkout persist-credentials:false; token de runtime de Actions para cache/artifacts; verificar checks/proteção e configuração do repositório |
| Secrets | Nenhum secret de aplicação/produção declarado ou necessário ao smoke; PostgreSQL e credenciais sintéticos; não cadastrar secrets operacionais para obter verde |
| Pré-requisitos | Node24, Temurin21, Docker/Testcontainers e Chromium/dependências Linux; acessos a registros npm/Maven/container/browser e serviços Actions |
| Artifacts | diagnosis-SHA e expanded-diagnosis-SHA (allowlist sanitizada) por7dias; tested-package-SHA com JAR/manifest do required, somente após sucesso |
| Efeitos externos | Download de dependências/imagens, criação de cache e artifacts GitHub, logs/checks/notificações do GitHub, consumo do runner; nenhum deploy definido neste workflow |
| Contraprovas | Falha deliberada em candidato/control isolado e autorizado, confirmar check reprovado, downstream/pacote bloqueados e diagnóstico preservado; sem mutação no candidato aprovado |
| Critérios que poderá fechar | Semântica real dos gates/eventos/needs/if, execução limpa Linux e cleanup, upload/identidade do pacote remoto e bloqueio pelos checks configurados |
| Ainda pendentes | CF015/zoom200%, matriz ampliada se não preparada/executada, cadeia da imagem Dockerfile, adoção real CF017/P01/P02, desempenho/backup/migração operacional, autorização de uso e sucessoras |

Pacote remoto de CI para evidência não deve ser tratado como distribuição
liberada para uso. `verify -DskipTests` histórico não atende prova de testes.
Nenhuma configuração externa de checks, deploy ou notificações foi consultada
ou modificada nesta revisão; ausência de deploy no YAML não certifica outros
serviços externos não examinados.
