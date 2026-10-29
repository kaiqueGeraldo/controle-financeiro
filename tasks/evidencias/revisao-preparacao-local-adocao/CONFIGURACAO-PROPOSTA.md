# Configuração remota: inventário e changeset proposto

Observação em 26/10/2026, America/Sao_Paulo. Fontes: conectores autenticados
Railway/Vercel/GitHub e painéis identificados em [remoto-painel.json](remoto-painel.json).
[Respostas sanitizadas](remoto-conectores.json) preservam IDs, configuração e deployments.
Nenhum endpoint de aplicação ou banco real foi acessado. Nenhuma alteração foi salva.

## Estado efetivamente observado

Railway: projeto `19974952-914d-4072-9140-e62e5ed23c31`, production
`73f7324a-a15f-4940-b2dc-d5bcb5510441`. API `f4ad9689-58ed-4112-8bb2-2cfe4af24483`
e PG `79d2ee56-cfd0-47bc-8744-e932cf49ba69` **offline na UI**, sem deployment ativo
na resposta atual. O campo `state=live` do conector significa configuração provisionada;
não significa processo ativo. Sem staged changes, sem variáveis compartilhadas;
PR environments desativados, botão Enable PR Environments observado nesta revisão.

API ligada a `kaiqueGeraldo/controle-financeiro@main`; root
`/controle-financeiro-backend`, Dockerfile homônimo, watch backend/**. Autodeploy
desabilitado; Wait for CI desligado. Sem custom start, pre-deploy ou healthcheck;
serverless e teardown desligados. Uma réplica Virginia, limite de 8 vCPU/8 GB;
esses limites não são reserva, uso ou capacidade aferida. Restart On Failure/10.
Domínio público com target port 8080. Os nove nomes de overrides foram conferidos.
`SPRING_JPA_HIBERNATE_DDL_AUTO=update` foi revelado individualmente e reocultado.
Não há overrides de perfil/Flyway/writers/jobs entre esses nomes; não há processo
para introspecção da configuração efetiva.

PG usa imagem `ghcr.io/railwayapp-templates/postgres-ssl:17`; versão efetiva,
geração física e dados permanecem desconhecidos. DNS privado configurado, proxy
TCP público existente e nunca utilizado. Volume `1fe34e12-e948-4c99-8448-7cfbf871ec54`,
5 GB, montado em `/var/lib/postgresql/data`, preservado. **Painel de backups informa
No Backups** e exige upgrade para criar snapshots/agendamentos/PITR. Isso comprova
ausência de backups listados pelo provedor, sem excluir cópias lógicas externas.
Não foi observado ensaio real de recuperação. Não interpretar volume offline como vazio.

Vercel: `prj_OdfwpJWp3wv8ZgfpcjVEBscrj03r`, root `controle-financeiro-frontend`,
Next.js/Node 24.x; sem overrides build/install/output/dev. Ignored Build Automatic,
inclusão de arquivos fora do root habilitada; máquina Basic, builds enfileirados,
Deployment Checks ausentes. Repositório conectado, sem Deploy Hooks. Production
rastreia main e atribui domínios automaticamente. Preview Branch Tracking habilitado
para todas as branches não atribuídas. System Environment Variables habilitadas,
inclusive `VERCEL_ENV`; nenhum custom environment. Proteção SSO
all_except_custom_domains, sem senha/trusted IPs conforme conector.

Uma variável de projeto, `BACKEND_API_URL`, em production/preview/development,
sem branch específica, aponta ao HTTPS raiz da API esperada, sem credenciais/query.
Valor integral omitido. A classificação correta está em
[remoto-destino-corrigido.json](remoto-destino-corrigido.json). O primeiro observador
usou `URL` indisponível no V8 e marcou false; seu recibo original permanece, mas
**não comprova configuração inválida**. A comparação exata independente corrigiu
apenas a observação, sem editar variável.

Produção permanece READY em `272001f7b4c39aebd18bdcd856109f9a0f6c1213`, deployment
`dpl_FkfL25jbyrt6FdD5Di5wqoLH9iHm`. As duas páginas do inventário retornaram
21 deployments READY: 13 production e 8 sem target production, de branches de trabalho.
São registros de controle; não foi provada disponibilidade HTTP nem isolamento dos
deployments antigos. Nenhum contém o bloqueio novo por herança de configuração local.
GitHub main observado em `fb986456a37a48afcafef204f165d15354294d26`, anterior ao lote.
Nenhuma CI nova foi disparada.

JDBC privado e FRONT_URL haviam sido classificados na revisão anterior. As tentativas
de reconferir o JDBC individualmente pela UI atual não produziram valor legível;
houve timeouts de interação e o estado observado continuou mascarado. Não se trata
de URL inválida. Classificação atual desses dois valores: **não reconfirmada**.
O DNS privado do serviço e o destino BFF atual são fatos distintos. A política de
auto-update da imagem PG também não foi lida; tag 17 não é pin de digest.

## Matriz concreta, sem execução

Todas as linhas exigem autorização posterior; nenhuma está aplicada. C01–C05 e
C09 formam um changeset conjunto do **candidato aprovado**, sem autorizar seu Deploy.
O binário remoto antigo ignora flags inexistentes; nunca ativá-lo esperando que
`APP_OPERATIONS_*` ofereça o controle novo. O Dockerfile remoto atual recompila
com skipTests e não consome o JAR/imagem p05 aprovável.

| ID / plataforma-ambiente | Configuração e estado atual | Estado proposto | Justificativa | Segurança / custo / operação | Pode reiniciar/publicar? | Pré-condições | Verificação posterior | Reversão | Autorização necessária |
|---|---|---|---|---|---|---|---|---|---|
| C01 Railway/API production | DDL_AUTO=update | SPRING_JPA_HIBERNATE_DDL_AUTO=validate | Impedir DDL fora da cadeia | Menor risco de alteração; drift impede subir | Staging sozinho não; Deploy da mudança pode iniciar/reimplantar | API offline, destino e binário conferidos | Valor efetivo sanitizado + incompatível falha sem SQL | Manter validate; não restaurar update para destravar | Configuração C01; ativação separada |
| C02 Railway/API production | Perfil sem override; Flyway sem override | SPRING_PROFILES_ACTIVE=adoption; SPRING_FLYWAY_ENABLED=false; SPRING_SQL_INIT_MODE=never; SPRING_JPA_GENERATE_DDL=false | Separar migrador/API e ativar guard | API não evolui schema; exige job separado | Sim ao aplicar por deployment | Imagem com initializer e perfil comprovados; C01 | Boot sem history/migrate/DDL; origem do guard | Parar API; voltar a imagem compatível mantendo bloqueios | Configuração conjunta C01–C05, sem Deploy implícito |
| C03 Railway/API production | Flags ausentes; código remoto antigo | APP_OPERATIONS_WRITERS_ENABLED=false; APP_OPERATIONS_JOBS_ENABLED=false | Fechar ingresso completo, async e agendadores no candidato | Indisponibilidade também de leitura; sem custo de consultas por filtro | Sim; flags são imutáveis por processo | Novo binário; drenagem de todas instâncias/scripts | GET funcional/POST 503, SQL sem efeito, sem tarefas/ShedLock/externos | Permanecer fechado; reinício para abrir exige GO | Configuração e futura inicialização restrita distintas |
| C04 Railway/API production | Sem healthcheck; domínio 8080 | PORT=8080; healthcheck /ops/health/readiness para implantação liberável | Alinhar porta e prontidão financeira | Um borrow/isValid por probe; aquisição pode competir com tráfego | Salvar/Deploy pode iniciar tentativa | Candidato aprovado, schema validado; plano para observação fechada descrito abaixo | Readiness 200 só com writers autorizados, DB indisponível 503 e liveness 200 | Parar candidato; não trocar por liveness para fabricar sucesso | Healthcheck/PORT + deploy somente na etapa própria |
| C05 Railway/API production | On Failure/10, uma réplica; limites 8/8 | Manter uma réplica e limites; primeira tentativa supervisionada, sem repetir para esconder falha | Não dimensionar por ausência de tráfego | Até 10 reinícios podem repetir erro/custo; operador deve interromper ao falhar | Mudança futura de política/escala pode reiniciar | Orçamento e diagnóstico de startup; não operar DB desconhecido | Logs por tentativa, CPU/RSS/pool/locks e ausência de escrita precoce | Parar API e preservar primeira falha | Nenhuma mudança de recursos agora; ativação supervisionada depois |
| C06 Railway/PG production | Imagem tag17; offline; volume 5 GB; sem backup listado | Preservar imagem/volume; conferir digest/versão antes de autorizar só PG; definir backup lógico privado e restore em destino novo | Classificação e recuperação antecedem migrations | Ativação consome recursos; retenção/armazenamento e eventual Pro exigem decisão | Ativar/trocar imagem pode reiniciar e produzir alterações físicas do servidor | Consumidores congelados, geração/volume identificados; autorização PG específica | Identidade, versão real, backup/hash + restore equivalente | Parar conforme consumidores; nunca apagar/restaurar origem às cegas | Ativação/leitura, backup/clone e eventual custo separados |
| C07 Railway/PG e API | DNS privado e proxy público existentes; JDBC atual não reconfirmado | Revalidar uso privado pela API; manter proxy até inventariar consumidores; runtime sem DDL/migrador distinto após ensaio de grants | Reduzir exposição e limitar DDL | Remover proxy pode cortar acesso; grants podem quebrar DML/ShedLock | Rede/grants podem romper conexões; não aplicar nesta fase | Identidades/privilégios e todos clientes conhecidos | Conexão pelo canal aprovado, DML esperado e DDL negado em clone | Restaurar rede/grants revisados, sem divulgar valores | Leitura de metadados não autoriza grants/rede/DB |
| C08 Railway/Git e PR | Autodeploy off, Wait for CI off, PR env off | Manter off durante janela; publicação manual delimitada | Evitar entrada de binário/candidato diferente | Custo de intervenção manual; CI verde não promove | Reativar autodeploy pode publicar no próximo push | Delta integrado/revisado; artefato exato e alvo aprovados | Readback de fonte e ausência de deployment inesperado | Manter off | Nenhuma ativação de gatilho neste lote |
| C09 Railway/API source | Build do Dockerfile antigo a partir de main | Consumir imagem imutável publicada do JAR aprovado, após novo pacote se houver saneamento | Evitar rebuild não testado | Registry/canal de acesso e digest precisam prova; custo de armazenamento | Alterar source e confirmar Deploy pode ativar API | Gate de startup e CI do candidato aprovados; digest/JAR conferidos | Digest remoto e hash embarcado iguais ao aprovado | Imagem compatível anterior; schema exige decisão separada | Publicar artefato e configurar source; Deploy posterior separado |
| C10 Vercel/Preview | Branch Tracking on; regras antigas limitadas a duas branches | Desabilitar Branch Tracking via painel antes de publicar branches; manter git.deploymentEnabled=false no candidato | Proteger branches que ainda não contêm vercel.json novo | Menos previews/custo; manual/API continuam possíveis | Salvar regra altera futuros gatilhos; não revoga URLs antigas | IDs/projeto confirmados, produção preservada | Readback + evento futuro autorizado mostra não criação por Git | Reabilitar somente com destino isolado e autorização | Mudança de gatilho; nenhum push para testar agora |
| C11 Vercel/Preview e development | BACKEND_API_URL compartilhada com production | Retirar backend real desses escopos; não fornecer destino financeiro até isolamento | Reduzir risco de novo preview manual/ambiente local usar alvo real | Sem backend funcional nesses ambientes; variável alterada não afeta deploys antigos | Novos deploys usam novo valor; variável por si não atualiza builds antigos | Split de targets preservando production; sistema de env habilitado | Novos previews retornam 503 sem fetch/cookies/body | Repor apenas URL de destino sintético aprovado | Atualização de escopos, sem redeploy implícito |
| C12 Vercel/deployments antigos | 8 previews READY, listados por ID; código anterior | Revisar cada URL e torná-la inacessível antes de religar API; eventual exclusão só com lista nominal, preservação e decisão expressa | Código novo não revoga BFF antigo | Exclusão pode ser irreversível; proteção SSO atual não equivale a bloqueio financeiro | Exclusão afeta URL; novo deploy/promoção é outra ação | Inventário completo salvo; nenhum domínio de produção na lista; mecanismo e custo aprovados | URLs antigas negadas e alias de produção preservado, com smoke autorizado | Recriação só a partir de fonte/destino isolado aprovado; sem rollback automático de exclusão | Autorizar mecanismo e IDs específicos; não concedida aqui |
| C13 Vercel/production | Root correto, Next/Node24, build/install defaults; API HTTPS esperada | Manter build/root/Node; conferir destino do novo deployment e FRONT_URL correspondente antes de promover | Config atual não requer rebuild por preferência | Evita drift; domínio/cookie incorretos quebram auth | Deploy/promoção troca versão; mudar variável exige novo deployment | Candidato backend/HTTPS e frontend aprovados; alias exato | Login/cookie HttpOnly Secure Lax path=/, ownership e erro API 503/504 | Voltar frontend compatível preservado; não alterar schema | Deployment/promoção e smoke sintético separados |
| C14 Vercel/produção e Railway | Readiness não monitorada continuamente | Definir responsável e monitor externo sem detalhes sensíveis antes do uso | Healthcheck do Railway só serve à promoção | Requisições periódicas têm custo/pool; frequência precisa ensaio | Monitor sozinho não reinicia; integração de ações requer nova decisão | SLO/limites e procedimento de manutenção aprovados | Falha de DB alerta sem reiniciar por liveness; retorno observado | Desativar ação automática defeituosa mantendo alerta/manual | Monitor/integração/custo próprios, sem criá-los aqui |

## Consequências para a ordem

Railway acumula mudanças em staged changes e as aplica por Deploy. Não agrupar
aceite de variável com autorização de ativação: um único Deploy pode aplicar
imagem, variáveis e escala juntos. Antes da classificação/migration real, manter
API offline e não confirmar a aplicação que a inicia. Se a interface não separar
salvar e iniciar, parar antes da confirmação; o diff continua preparado e revisável.

Manutenção do candidato retorna readiness 503 deliberadamente. Ela não pode
promover um rolling deployment nem congelar versão antiga. A observação restrita
de JPA/probes pode ocorrer em tentativa pendente sem promoção, com prazo e parada
autorizados; logs são evidência, não GO. Uma ferramenta operacional de validação
sem servidor é alternativa que precisa implementação/revisão próprias. Não propor
liveness como substituto do gate de readiness para obter verde.

Com writers=false, login e todas as operações funcionais também ficam fechados.
Smoke funcional exige uma abertura controlada para o operador/conta sintética,
jobs ainda false e ingresso geral restrito por mecanismo previamente validado.
O controle local não tem allowlist por usuário. Se não houver essa restrição,
realizar o smoke em homologação isolada e manter produção fechada; não chamar um
503 esperado de smoke financeiro aprovado. Depois do smoke e GO, liberar uso geral;
jobs entram em reinício próprio e observação da primeira execução. Toda mudança de
flag exige considerar término/drenagem do processo antigo, inclusive fila assíncrona.

## Fontes oficiais consultadas

- [Railway variables](https://docs.railway.com/variables) e [staged changes](https://docs.railway.com/deployments/staged-changes): alterações são preparadas e aplicadas por deployment.
- [Railway healthchecks](https://docs.railway.com/deployments/healthchecks): usa PORT e resposta 2xx; padrão 300s; sem monitor após promoção. Esse padrão não aprova startup do candidato.
- [Vercel Git](https://vercel.com/docs/project-configuration/git-configuration): branches omitidas ficam habilitadas; boolean false desliga gatilhos Git globais.
- [Vercel system envs](https://vercel.com/docs/environment-variables/system-environment-variables): VERCEL_ENV identifica production/preview/development quando acesso está habilitado; VERCEL_TARGET_ENV também representa custom environments.

As fontes explicam opções; o estado aplicado vem das observações acima.
