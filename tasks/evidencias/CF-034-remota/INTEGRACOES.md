# Revisão das integrações Railway e Vercel

25/10/2026. Somente plano de controle, configuração e código; nenhuma requisição
de teste à aplicação implantada, conexão PostgreSQL ou leitura de dados reais.
Configurações e observações em `platform-inspection.json` e `browser-inspection.json`.

| Área | Observado | Avaliação e próximo ajuste possível |
|---|---|---|
| Distribuição | Next/BFF na Vercel; Spring e Postgres no mesmo projeto/região US East Railway; funções Vercel iad1 | Topologia coerente para o BFF chamar Spring por HTTPS e Spring usar PG privado. Não medir latência por inferência geográfica; manter app/PG juntos reduz a fronteira de rede. Mover tudo para São Paulo exige medir origem dos usuários, custo e latência antes de decidir. |
| Git/produção | Main sem checks/proteção; Railway Wait for CI off; Vercel sem Deployment Checks, autoassign on | Integração atualmente pode implantar código sem aprovação dos gates. Para esta etapa CI-only, separar gatilhos; para futura release, gates explícitos no mesmo commit e proteção de main. Não criar permissão ou contornar gate para publicar. |
| Branch/PR | Railway PR environments off; Vercel preview rastreia todas as branches | `vercel.json` bloqueia somente codex/cf034-ci-local. Não abrir preview que possa usar backend de produção; nenhum ambiente pago/provisão novo criado. |
| Ambientes/dados | Railway só production; Vercel BACKEND_API_URL é Config/All Environments | Em26/10, após o titular concluir a verificação adicional, foi confirmado HTTPS para o hostname esperado do backend Railway, caminho raiz, sem credenciais/query na URL. Valor novamente ocultado; nenhuma configuração salva. Preview ainda não demonstra isolamento de dados: separar backend/PG sintéticos e escopo de variáveis antes de homologação. Credenciais/CORS e execução em produção não certificados. |
| Estado real | Frontend Production Ready em272001f; API e PG offline | Build/Ready do frontend não comprova jornada funcional com backend. Não reativar PG/API ou emitir login/testes reais para encobrir essa diferença. |
| Build monorepo | Frontend root correto, Next.js, Node24, sem overrides de comandos; Railway root backend e Dockerfile corretos, watch backend/** | Paths coerentes. Skip-unaffected Vercel desligado faz até documentação gerar build; habilitar futuramente poupa builds, mas não substitui gates. Dockerfile Maven3.9.6/Java21 com skipTests recompila outra imagem: não é o JAR validado/publicado por CI. |
| Health/readiness | Railway sem healthcheck; backend sem endpoint de saúde dedicado/Actuator no código examinado | Adicionar readiness real e configuração compatível em trabalho próprio; não apontar healthcheck a endpoint protegido/inexistente. Offline não é defeito de aplicação demonstrado. |
| Banco/rede | PostgreSQL17 configurado, volume5GB e proxy TCP público; app/PG na mesma região | Preferir rede privada no app; proxy público requer justificativa e não foi usado. Não remover sem identificar consumidores. CI usa PG16 descartável: compatibilidade operacional com17 continua fora deste teste; não certificar upgrade por associação. |
| Migrações | Fonte atual usa Flyway validate, sem baseline automático, ORM validate; variável Railway SPRING_JPA_HIBERNATE_DDL_AUTO existe | Nome de variável não confirma seu valor nem schema atual. Não executar aplicação nova contra DB real; preflight/backup/restauração da CF017 continuam próprios. |
| Capacidade | Railway1 réplica, sem limites explícitos na config; UI mostra teto8vCPU/8GB; Vercel build2vCPU/8GB, função1vCPU/2GB, Fluid Compute | Limite/teto não é reserva nem consumo. Sem carga ou métricas representativas, não aumentar réplicas/memória/pool nem prometer capacidade. Paralelismo no BFF não amplia conexões do PostgreSQL. |
| Disponibilidade/backup | PG único/volume; sem backup restaurável verificado nesta inspeção; tracing Railway off | Não presumir HA pelo metadata de template disponível. Confirmar política e ensaio de restore antes de uso real; sem conversão HA, snapshot ou migração nesta etapa. |
| Proteção dos previews | Vercel Authentication Standard Protection ativa, sem shareable links/bypass adicional listado | Preservada. Não desativar proteção para executar CI. Os gates remotos usam loopback/serviços descartáveis, independentes dessa proteção. |
| Retenção/observabilidade | Vercel deployments30dias; artifacts de CI7dias; métricas UI de baixo volume não medem correção financeira | Registrar IDs/expiração e manter resumos/hashes sanitizados no repo. Cache npm/Maven é dependência, não evidência; nenhum cache de sucesso dos testes. |

## Separação preparada e decisão necessária

Branch CF034: bloqueio versionado `git.deploymentEnabled["codex/cf034-ci-local"]=false`
no diretório frontend efetivamente configurado; Railway não acompanha a branch e
não cria ambiente de PR. CI ordinária via PR e probes via push, sem deploy.

Antes da main, a decisão necessária é **desabilitar autodeploy do serviço backend
na produção Railway e a criação automática de deployments Git de produção na
Vercel**, mantendo os serviços offline/online no estado observado e preservando
o frontend atualmente servido. Nenhum secret, banco, região, réplica, domínio ou
deploy precisa mudar para essa separação. Reativação futura é decisão própria.
Não foi executada essa mudança externa: o pedido vigente proíbe alterar
infraestrutura de produção e exige explicar a decisão antes desse caminho.

Alternativa de somente ligar Wait for CI/Deployment Checks melhora o gate, mas
permite deploy depois do verde e, portanto, não atende a esta etapa sem deploy.
Manter a main intocada e validar só a branch/PR é o caminho executável atual;
seu custo é deixar integração aguardando essa decisão explícita.

Referências oficiais consultadas:
- https://docs.railway.com/deployments/github-autodeploys
- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/deployment-checks
- https://vercel.com/docs/monorepos
